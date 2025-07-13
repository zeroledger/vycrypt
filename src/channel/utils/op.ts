import { hexToBigInt } from "viem";
import {
  SerializedOpenChannelOp,
  SerializedUserFundingOp,
} from "../channel.types";
import { toSignature } from "./common";

export const deserializeUserFundingOp = (
  userFundingOp: SerializedUserFundingOp,
) => ({
  owner: userFundingOp.owner,
  fundSignature: toSignature(userFundingOp.fundSignature),
  permit: toSignature(userFundingOp.permit),
  value: hexToBigInt(userFundingOp.value),
  deadline: hexToBigInt(userFundingOp.deadline),
});

export const deserializeOpenChannelOp = (
  openChannelOp: SerializedOpenChannelOp,
) => ({
  owner: openChannelOp.owner,
  openSignature: toSignature(openChannelOp.openSignature),
  permit: toSignature(openChannelOp.permit),
  value: hexToBigInt(openChannelOp.value),
  deadline: hexToBigInt(openChannelOp.deadline),
  nodeType: openChannelOp.nodeType,
});
