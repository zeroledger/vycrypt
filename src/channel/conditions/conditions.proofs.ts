import { encodeAbiParameters, keccak256, type Hex } from "viem";

import { toSignature } from "../utils/common";
import { FUNDING_PROOF_ABI } from "./conditions.constants";

export const getFundingProof = (fundSignature: Hex, permit: Hex) => {
  return keccak256(
    encodeAbiParameters(FUNDING_PROOF_ABI, [
      toSignature(fundSignature),
      toSignature(permit),
    ]),
  );
};
