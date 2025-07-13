import {
  type Hash,
  type Address,
  type Hex,
  encodeAbiParameters,
  AbiParameter,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { serialize } from "../utils";
import {
  TLC_ABI,
  SSTLC_ABI,
  CTLC_ABI,
  CDTLC_ABI,
} from "./conditions.constants";
/**
 * All values must be in lower case
 */
export const typeToAddress: {
  [chainId: number]: {
    TLC: Address;
    SSTLC: Address;
    CTLC: Address;
    CDTLC: Address;
  };
} = {
  [optimismSepolia.id]: {
    TLC: "0xc28a967F85F5E1B2ece4afBAE2DE5Dbfe203A5FB",
    SSTLC: "0x116d38Ec6a10912014597700C814fBA3DCA67B58",
    CTLC: "0xb41357E5794EA79D476D9049aF48CaFFa28be95F",
    CDTLC: "0x535Af9Ff8fB77dB01095eE05E097ada39143a383",
  },
};

/**
 * All values must be in lower case
 */
export const flankkLogAddresses: Record<number, Address> = {
  [optimismSepolia.id]: "0x92879b56273Cd2fA620b3C03c07Fd87a61d3E7B9",
};

export const CONDITION_TYPE = {
  TLC: "TLC",
  SSTLC: "SSTLC",
  CTLC: "CTLC",
  CDTLC: "CDTLC",
} as const;

export abstract class AbstractConditionParams<T> {
  abstract readonly abi: readonly AbiParameter[];
  abstract readonly type: string;
  abstract readonly params: object;
  abstract readonly meta: object;

  serialize() {
    return serialize<T>({
      type: this.type,
      params: this.params,
      meta: this.meta,
    });
  }

  encode() {
    return encodeAbiParameters(this.abi, [this.params]);
  }

  abstract clone(): AbstractConditionParams<T>;
}

export type SerializedTLC = {
  type: typeof CONDITION_TYPE.TLC;
  params: {
    deadline: Hex;
  };
  meta: Record<string, never>;
};

export class TLC extends AbstractConditionParams<SerializedTLC> {
  readonly abi = TLC_ABI;
  readonly type = CONDITION_TYPE.TLC;
  readonly meta = {};
  constructor(readonly params: { deadline: bigint }) {
    super();
  }

  clone() {
    return new TLC(this.params);
  }
}

export type SerializedSSTLC = {
  type: typeof CONDITION_TYPE.SSTLC;
  params: {
    deadline: Hex;
    stealthUser: Address;
  };
  meta: {
    multiplier: Hex;
  };
};

export class SSTLC extends AbstractConditionParams<SerializedSSTLC> {
  readonly abi = SSTLC_ABI;
  readonly type = CONDITION_TYPE.SSTLC;
  constructor(
    readonly params: { deadline: bigint; stealthUser: Address },
    readonly meta: { multiplier: Hex },
  ) {
    super();
  }

  clone() {
    return new SSTLC(this.params, this.meta);
  }
}

export type SerializedCTLC = {
  type: typeof CONDITION_TYPE.CTLC;
  params: {
    deadline: Hex;
    roothash: Hash;
    alrtRoothash: Hash;
  };
  meta: Record<string, never>;
};

export class CTLC extends AbstractConditionParams<SerializedCTLC> {
  readonly abi = CTLC_ABI;
  readonly type = CONDITION_TYPE.CTLC;
  readonly meta = {};
  constructor(
    readonly params: {
      deadline: bigint;
      roothash: Hash;
      alrtRoothash: Hash;
    },
  ) {
    super();
  }

  clone() {
    return new CTLC(this.params);
  }
}

export type SerializedCDTLC = {
  type: typeof CONDITION_TYPE.CDTLC;
  params: {
    deadline: Hex;
    proof: Hash;
  };
  meta: Record<string, never>;
};

export class CDTLC extends AbstractConditionParams<SerializedCDTLC> {
  readonly abi = CDTLC_ABI;
  readonly type = CONDITION_TYPE.CDTLC;
  readonly meta = {};
  constructor(
    readonly params: {
      deadline: bigint;
      flankkLog: Address;
      proof: Hash;
    },
  ) {
    super();
  }

  clone() {
    return new CDTLC(this.params);
  }
}

export type ConditionParams = TLC | SSTLC | CTLC | CDTLC | "0x0";

export type SerializedConditionParams =
  | SerializedTLC
  | SerializedSSTLC
  | SerializedCTLC
  | SerializedCDTLC
  | "0x0";
