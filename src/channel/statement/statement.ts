import {
  type Address,
  type Hash,
  hexToBigInt,
  zeroAddress,
  encodeAbiParameters,
  keccak256,
  Hex,
  toHex,
} from "viem";
import {
  parseConditionParams,
  typeToAddress,
  CONDITION_TYPE,
  type ConditionParams,
  conditionRequiredArbitraryProof,
  SerializedConditionParams,
} from "../conditions";
import { Client } from "../channel.types";
import { FLANKK_CONDITION_ABI, STATEMENT_ID_ABI } from "./statement.abi";

export class Rec {
  constructor(
    public readonly user0Balance: bigint,
    public readonly user1Balance: bigint,
  ) {}

  serialize() {
    return {
      user0Balance: toHex(this.user0Balance),
      user1Balance: toHex(this.user1Balance),
    };
  }

  static of(data: ReturnType<Rec["serialize"]>) {
    return new Rec(
      hexToBigInt(data.user0Balance),
      hexToBigInt(data.user1Balance),
    );
  }
}

export interface SerializedStatement {
  from: ReturnType<Rec["serialize"]>;
  to: ReturnType<Rec["serialize"]>;
  conditionParams: SerializedConditionParams;
  nonce: Hex;
  source?: Hex;
}

export class Statement {
  public readonly condition: Address;
  public readonly encodedConditionParams: Hex;
  public readonly id: Hash;

  constructor(
    public readonly from: Rec,
    public readonly to: Rec,
    public readonly conditionParams: ConditionParams,
    public readonly client: Client,
    public readonly nonce: bigint,
    private _source?: Hex,
  ) {
    this.condition = this.defineCondition(
      conditionParams,
      this.client.chain.id,
    );
    this.encodedConditionParams =
      this.conditionParams !== "0x0" ? this.conditionParams.encode() : "0x0";
    this.id = this.computeId();
  }

  get source() {
    return this._source;
  }

  defineCondition(conditionParams: ConditionParams, chainId: number) {
    return conditionParams === "0x0"
      ? zeroAddress
      : typeToAddress[chainId][conditionParams.type];
  }

  computeId() {
    return keccak256(
      encodeAbiParameters(STATEMENT_ID_ABI, [
        this.onchainVersion(),
        this.nonce,
      ]),
    );
  }

  onchainVersion() {
    return {
      from: {
        ...this.from,
      },
      to: {
        ...this.to,
      },
      condition: this.condition,
      conditionParams: this.encodedConditionParams,
    } as const;
  }

  serialize(): SerializedStatement {
    return {
      from: this.from.serialize(),
      to: this.to.serialize(),
      conditionParams:
        this.conditionParams !== "0x0"
          ? this.conditionParams.serialize()
          : "0x0",
      source: this.source,
      nonce: toHex(this.nonce),
    } as const;
  }

  static async of(data: ReturnType<Statement["serialize"]>, client: Client) {
    try {
      const statement = new Statement(
        Rec.of(data.from),
        Rec.of(data.to),
        parseConditionParams(data.conditionParams, client.chain.id),
        client,
        hexToBigInt(data.nonce),
      );

      const { error } = statement.verifyIntegrity();

      if (error) {
        return { error };
      }

      const sourceApplied = data.source
        ? await statement.applySource(data.source)
        : true;

      if (!sourceApplied) {
        return {
          error: "invalid_source",
        };
      }

      return { statement };
    } catch (error) {
      return { error: "statement_creation_error" };
    }
  }

  private verifyRecords() {
    return (
      this.from.user0Balance >= 0n &&
      this.from.user1Balance >= 0n &&
      this.to.user0Balance >= 0n &&
      this.to.user1Balance >= 0n
    );
  }

  isVolumeExpand() {
    return this.isCDTLC() || this.isUnconditionalVolumeExpand();
  }

  isUnconditionalVolumeExpand() {
    return (
      this.condition === zeroAddress &&
      this.from.user0Balance === 0n &&
      this.from.user1Balance === 0n &&
      (this.to.user0Balance > 0n || this.to.user1Balance > 0n)
    );
  }

  isCDTLC() {
    return (
      this.conditionParams !== "0x0" &&
      this.conditionParams.type === CONDITION_TYPE.CDTLC &&
      this.from.user0Balance === 0n &&
      this.from.user1Balance === 0n &&
      (this.to.user0Balance > 0n || this.to.user1Balance > 0n)
    );
  }

  verifyIntegrity() {
    if (!this.verifyRecords()) {
      return { error: "invalid_records" };
    }

    const isExpand = this.isVolumeExpand();

    const totalFromBalance = this.from.user0Balance + this.from.user1Balance;
    const totalToBalance = this.to.user0Balance + this.to.user1Balance;

    if (!isExpand && totalFromBalance !== totalToBalance) {
      return { error: "imbalanced_records" };
    }

    return {};
  }

  async applySource(source: Hex) {
    const isValid = await this.verifyDisposing(source);

    if (isValid) {
      this._source = source;
    }

    return isValid;
  }

  async verifyDisposing(source: Hex = "0x0") {
    if (this.conditionParams === "0x0") {
      return true;
    }
    if (
      this.conditionParams.params.deadline <
      BigInt(Math.ceil(Date.now() / 1000))
    ) {
      return true;
    }

    if (
      conditionRequiredArbitraryProof(this.conditionParams.type) &&
      source === "0x0"
    ) {
      return false;
    }

    try {
      const result = await this.client.readContract({
        abi: FLANKK_CONDITION_ABI,
        address: this.condition,
        functionName: "validate",
        args: [this.onchainVersion(), source],
      });
      return result;
    } catch (error) {
      return false;
    }
  }
}
