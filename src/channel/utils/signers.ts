import { keccak256, type Hex, hashTypedData, Hash } from "viem";

import {
  openChannelTypes,
  fundChannelTypes,
  updateChannelTypes,
  settleChannelTypes,
  collaborativeWithdrawTypes,
} from "../channel.constants";
import { type FlankkDomain, type SignWallet } from "../channel.types";
import { encodeAbiSignature } from "./common";

export async function signChannelOpening(
  client: SignWallet,
  channelId: Hash,
  permit: Hex,
  domain: FlankkDomain,
  nodeType: boolean = false,
) {
  const message = {
    channelId,
    userPermitHash: keccak256(encodeAbiSignature(permit)),
    nodeType,
  } as const;

  return client.signTypedData({
    message,
    domain,
    primaryType: "OpenChannelConf",
    types: openChannelTypes,
  });
}

export async function signChannelFunding(
  client: SignWallet,
  channelId: Hash,
  permit: Hex,
  domain: FlankkDomain,
) {
  const message = {
    channelId,
    userPermitHash: keccak256(encodeAbiSignature(permit)),
  } as const;

  return client.signTypedData({
    message,
    domain,
    primaryType: "FundChannelConf",
    types: fundChannelTypes,
  });
}

export async function signUpdateChannel(
  client: SignWallet,
  channelId: Hash,
  stateHash: Hash,
  domain: FlankkDomain,
) {
  return client.signTypedData({
    message: {
      channelId,
      state: stateHash,
    } as const,
    domain,
    primaryType: "UpdateChannelConf",
    types: updateChannelTypes,
  });
}

export const getStateSnapMsgHash = (
  channelId: Hash,
  stateHash: Hash,
  domain: FlankkDomain,
) => {
  return hashTypedData({
    domain,
    types: updateChannelTypes,
    primaryType: "UpdateChannelConf",
    message: {
      channelId,
      state: stateHash,
    } as const,
  });
};

export async function signSettlement(
  client: SignWallet,
  channelId: Hash,
  stateHash: Hash,
  domain: FlankkDomain,
) {
  return client.signTypedData({
    message: {
      channelId,
      state: stateHash,
    } as const,
    domain,
    primaryType: "SettlementConf",
    types: settleChannelTypes,
  });
}

export async function signCollaborativeWithdraw(
  client: SignWallet,
  channelId: Hash,
  stateHash: Hash,
  domain: FlankkDomain,
  user0Balance: bigint,
  user1Balance: bigint,
  deadline: bigint,
) {
  return client.signTypedData({
    message: {
      channelId,
      state: stateHash,
      user0Balance,
      user1Balance,
      deadline,
    } as const,
    domain,
    primaryType: "CollaborativeWithdrawConf",
    types: collaborativeWithdrawTypes,
  });
}
