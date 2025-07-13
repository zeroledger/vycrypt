import { hexToBigInt } from "viem";

import {
  CONDITION_TYPE,
  TLC,
  SSTLC,
  CTLC,
  CDTLC,
  flankkLogAddresses,
  SerializedConditionParams,
} from "./conditions.dto";

export const conditionRequiredArbitraryProof = (
  type: keyof typeof CONDITION_TYPE,
) => type === CONDITION_TYPE.SSTLC || type === CONDITION_TYPE.CTLC;

// @todo: remove TLC once migrated to SSTLC & CTLC
export const isRouteLikeCondition = (type: keyof typeof CONDITION_TYPE) =>
  type === CONDITION_TYPE.TLC ||
  type === CONDITION_TYPE.SSTLC ||
  type === CONDITION_TYPE.CTLC;

export const parseConditionParams = (
  conditionParams: SerializedConditionParams,
  chainId: number,
) => {
  if (conditionParams === "0x0") {
    return conditionParams;
  }
  if (conditionParams.type === CONDITION_TYPE.TLC) {
    return new TLC({
      deadline: hexToBigInt(conditionParams.params.deadline),
    });
  }
  if (conditionParams.type === CONDITION_TYPE.SSTLC) {
    return new SSTLC(
      {
        ...conditionParams.params,
        deadline: hexToBigInt(conditionParams.params.deadline),
      },
      conditionParams.meta,
    );
  }
  if (conditionParams.type === CONDITION_TYPE.CTLC) {
    return new CTLC({
      ...conditionParams.params,
      deadline: hexToBigInt(conditionParams.params.deadline),
    });
  }
  if (conditionParams.type === CONDITION_TYPE.CDTLC) {
    return new CDTLC({
      ...conditionParams.params,
      flankkLog: flankkLogAddresses[chainId],
      deadline: hexToBigInt(conditionParams.params.deadline),
    });
  }
  throw new Error("INVALID_CONDITION_TYPE");
};
