import { secp256k1 } from "@noble/curves/secp256k1";
import { type Hex, toHex } from "viem";

const { ProjectivePoint: Point, CURVE } = secp256k1;

/**
 * @notice Returns new PublicKey prefixed with 0x04
 * @param value number to multiply by
 * @returns 64 bytes length public key padded with 0x
 */
export const mulPublicKey = (
  publicKey: Hex,
  number: bigint,
  isCompressed = false,
) => {
  // Perform the multiplication
  const publicKey_ = Point.fromHex(publicKey.slice(2)).multiply(number);

  return `0x${publicKey_.toHex(isCompressed)}` as Hex;
};

/**
 * @notice Returns new KeyPair instance after multiplying this private key by some value
 * @param value number to multiply by
 * @returns 32 byte length private key, padded with 0x
 */
export const mulPrivateKey = (pk: Hex, number: bigint) => {
  /**
   * Get new private key.
   * Multiplication gives us an arbitrarily large number that is not necessarily in the domain
   * of the secp256k1 curve, so then we use modulus operation to get in the correct range.
   */
  const privateKeyBigInt = (BigInt(pk) * number) % CURVE.n;
  return toHex(privateKeyBigInt, { size: 32 }); // convert to 32 byte hex
};
