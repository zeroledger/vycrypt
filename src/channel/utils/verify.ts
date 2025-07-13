import { Address, verifyTypedData, type Hex, type Hash } from "viem";

import { updateChannelTypes } from "../channel.constants";
import { FlankkDomain } from "../channel.types";
import { toViemSignature } from "./common";

export function verifyStateSnapSignature(
  signer: Address,
  channelId: Hash,
  stateHash: Hash,
  domain: FlankkDomain,
  snapSignature: Hex,
) {
  return verifyTypedData({
    address: signer,
    domain,
    types: updateChannelTypes,
    primaryType: "UpdateChannelConf",
    message: {
      channelId,
      state: stateHash,
    } as const,
    signature: toViemSignature(snapSignature),
  });
}
