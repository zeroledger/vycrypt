import {
  encodeAbiParameters,
  keccak256,
  type Hash,
  type Hex,
  zeroHash,
  zeroAddress,
} from "viem";

import {
  type SerializedDisposeInstruction,
  type SerializedAddInstruction,
  type Client,
} from "../channel.types";

import { STATE_ABI } from "./state.abi";
import { Rec, Statement } from "../statement/statement";
import { STATEMENTS_ABI } from "../statement/statement.abi";
import { ConditionParams } from "../conditions";

export class State {
  private _statementsHash: Hash = zeroHash;
  private _stateHash: Hash = zeroHash;

  constructor(
    private _statements: Record<string, Statement>,
    private _nonce: bigint = 0n,
  ) {
    if (_nonce !== 0n) {
      this.recompute();
    }
  }

  private _computeState() {
    this._stateHash = keccak256(
      encodeAbiParameters(STATE_ABI, [this._statementsHash, this.nonce]),
    );
  }

  private _computeStatementsHash() {
    this._statementsHash = keccak256(
      encodeAbiParameters(STATEMENTS_ABI, [
        this.statements()
          // @todo: improve sorting by hex as bigint value
          .sort((s0, s1) => (s0.id > s1.id ? -1 : 1))
          .map((s) => s.onchainVersion()),
      ]),
    );
  }

  get nonce() {
    return this._nonce;
  }

  get stateHash() {
    return this._stateHash;
  }

  get statementsHash() {
    return this._statementsHash;
  }

  add(statement: Statement, recompute = false) {
    this._statements[statement.id] = statement;

    this._nonce += 1n;

    if (recompute) {
      this.recompute();
    }

    return {
      op: "ADD",
      value: statement.serialize(),
    } as const;
  }

  dispose(statement: Statement, recompute = false) {
    delete this._statements[statement.id];

    this._nonce += 1n;

    if (recompute) {
      this.recompute();
    }

    return {
      op: "DISPOSE",
      value: statement.serialize(),
    } as const;
  }

  async consolidate(
    sourcesMap: Record<Hash, Hex>,
    client: Client,
  ): Promise<Array<SerializedDisposeInstruction | SerializedAddInstruction>> {
    const toAddParams = {
      from: {
        user0Balance: 0n,
        user1Balance: 0n,
      },
      to: {
        user0Balance: 0n,
        user1Balance: 0n,
      },
    };
    const ops: SerializedDisposeInstruction[] = (
      await Promise.all(
        this.statements().map(async (statement) => {
          if (statement.condition === zeroAddress) {
            toAddParams.to.user0Balance += statement.to.user0Balance;
            toAddParams.to.user1Balance += statement.to.user1Balance;
            return this.dispose(statement);
          }
          if (
            statement.conditionParams !== "0x0" &&
            statement.conditionParams.params.deadline >
              BigInt(Math.ceil(Date.now() / 1000)) &&
            (await statement.applySource(sourcesMap[statement.id]))
          ) {
            toAddParams.to.user0Balance += statement.to.user0Balance;
            toAddParams.to.user1Balance += statement.to.user1Balance;
            return this.dispose(statement);
          }

          if (
            statement.conditionParams !== "0x0" &&
            statement.conditionParams.params.deadline <
              BigInt(Math.ceil(Date.now() / 1000))
          ) {
            toAddParams.to.user0Balance += statement.from.user0Balance;
            toAddParams.to.user1Balance += statement.from.user1Balance;
            return this.dispose(statement);
          }
          return undefined;
        }),
      )
    ).filter((instruction) => !!instruction);
    (
      ops as Array<SerializedDisposeInstruction | SerializedAddInstruction>
    ).push(
      this.add(
        new Statement(
          new Rec(toAddParams.from.user0Balance, toAddParams.from.user1Balance),
          new Rec(toAddParams.to.user0Balance, toAddParams.to.user1Balance),
          "0x0",
          client,
          this.nonce,
        ),
      ),
    );
    return ops;
  }

  statements() {
    return Object.values(this._statements);
  }

  statement(id: string) {
    return this._statements[id];
  }

  private _getBalance(filter: (conditionParams: ConditionParams) => boolean) {
    return this.statements().reduce(
      (acc, s) => {
        if (filter(s.conditionParams)) {
          acc.user0Balance += s.to.user0Balance;
          acc.user1Balance += s.to.user1Balance;
        }
        return acc;
      },
      {
        user0Balance: 0n,
        user1Balance: 0n,
      },
    );
  }

  getPendingBalances() {
    return this._getBalance((params: ConditionParams) => params !== "0x0");
  }

  getSettledBalances() {
    return this._getBalance((params: ConditionParams) => params === "0x0");
  }

  getTotalBalance() {
    const { user0Balance, user1Balance } = this._getBalance(() => true);
    return user0Balance + user1Balance;
  }

  recompute() {
    this._computeStatementsHash();
    this._computeState();
  }
}
