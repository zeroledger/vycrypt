import { parseAbiParameters } from "viem";

export const STATE_ABI = parseAbiParameters(
  "bytes32 statementsHash,uint256 nonce",
);
