import {
  type Hex,
  type Address,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
  type RpcSchema,
  type PublicClient,
} from "viem";
import { SerializedStatement, Statement } from "./statement/statement";

export type NormalizedSignature = { r: Hex; s: Hex; v: number };

export type SerializedUserFundingOp = {
  owner: Address;
  fundSignature: Hex;
  permit: Hex;
  value: Hex;
  deadline: Hex;
};

export type UserFundingOp = {
  owner: Address;
  fundSignature: NormalizedSignature;
  permit: NormalizedSignature;
  value: bigint;
  deadline: bigint;
};

export type SerializedOpenChannelOp = {
  owner: Address;
  openSignature: Hex;
  permit: Hex;
  value: Hex;
  deadline: Hex;
  nodeType: boolean;
};

export type ChannelOpenOp = {
  owner: Address;
  openSignature: NormalizedSignature;
  permit: NormalizedSignature;
  value: bigint;
  deadline: bigint;
  nodeType: boolean;
};

export type DisposeInstruction = {
  op: "DISPOSE";
  value: Statement;
};

export type AddInstruction = {
  op: "ADD";
  value: Statement;
};

export type Instructions = (DisposeInstruction | AddInstruction)[];

export type SerializedDisposeInstruction = {
  op: "DISPOSE";
  value: SerializedStatement;
};

export type SerializedAddInstruction = {
  op: "ADD";
  value: SerializedStatement;
};

export type SerializedInstructions = (
  | SerializedDisposeInstruction
  | SerializedAddInstruction
)[];

export type FlankkDomain = {
  chainId: number;
  name: "Flankk";
  verifyingContract: Address;
  version: string;
};

export type SignWallet = WalletClient<Transport, Chain, Account, RpcSchema>;

export type Client = PublicClient<Transport, Chain, Account, RpcSchema> &
  WalletClient<Transport, Chain, Account, RpcSchema>;
