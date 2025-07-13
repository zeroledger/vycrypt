import * as utils from "@noble/curves/abstract/utils";
import { randomBytes } from "@noble/hashes/utils";
import { type Hex, hexToBigInt, keccak256, isAddress, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mulPublicKey, mulPrivateKey } from "./elliptic";

export const createStealth = (publicKey: Hex) => {
  const random = utils.bytesToNumberBE(randomBytes(16));
  const stealthPublicKey = mulPublicKey(publicKey, random);
  const stealthAddress = getAddress(
    `0x${keccak256(("0x" + stealthPublicKey.substring(4)) as Hex).substring(
      26,
    )}`,
  );
  if (!isAddress(stealthAddress)) {
    throw new Error("STEALTH_ADDRESS_GENERATION_FAIL");
  }
  return {
    stealthAddress,
    random,
  };
};

export const deriveStealthAccount = (pk: Hex, random: Hex) => {
  const stealthPk = mulPrivateKey(pk, hexToBigInt(random));
  return privateKeyToAccount(stealthPk);
};
