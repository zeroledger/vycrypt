import { secp256k1 } from "@noble/curves/secp256k1";
import { randomBytes } from "@noble/hashes/utils";
import { gcm } from "@noble/ciphers/aes";

import {
  isHash,
  isHex,
  type Hash,
  type Hex,
  sha256,
  toHex,
  toBytes,
} from "viem";

const {
  Point,
  utils: secp256k1Utils,
  getSharedSecret: nobleGetSharedSecret,
} = secp256k1;

const decoder = new TextDecoder();
const encoder = new TextEncoder();
// Used for passing around encrypted random number
export interface EncryptedPayload {
  ephemeralPublicKey: Hash; // hex string with 0x04 prefix
  ciphertext: Hex; // hex string with 0x prefix
}

/**
 * @notice Throws if provided private key is not valid.
 * @param point Private key as hash string
 */
export function assertValidPrivateKey(key: Hash) {
  if (!isHash(key)) throw new Error("Must provide private key as hash string");
  if (!secp256k1Utils.isValidPrivateKey(key.slice(2)))
    throw new Error("Invalid private key");
}

/**
 * @notice Throws if provided public key is not on the secp256k1 curve
 * @param point Uncompressed public key as hex string
 */
export function assertValidPoint(point: Hex) {
  if (!isHex(point))
    throw new Error("Must provide uncompressed public key as hex string");

  const pointInstance = Point.fromHex(point.slice(2));
  pointInstance.assertValidity();
}

function getSharedSecret(privateKey: Hash, publicKey: Hex) {
  assertValidPoint(publicKey);
  assertValidPrivateKey(privateKey);

  const sharedSecret = nobleGetSharedSecret(
    privateKey.slice(2),
    publicKey.slice(2),
    true,
  );
  return toBytes(sha256(sharedSecret));
}

/**
 * @notice Encrypt a number with the instance's public key
 * @param randomNumber Number as instance of RandomNumber class
 * @returns Hex strings of uncompressed 65 byte public key and 32 byte ciphertext
 */
export const encrypt = (data: string, counterpartyPubKey: Hex) => {
  // Get shared secret to use as encryption key
  const ephemeralPrivateKey = secp256k1Utils.randomPrivateKey();
  const ephemeralPublicKey = Point.fromPrivateKey(ephemeralPrivateKey);
  const ephemeralPrivateKeyHex = toHex(ephemeralPrivateKey);
  const ephemeralPublicKeyHex = `0x${ephemeralPublicKey.toHex()}` as Hex;
  const sharedSecret = getSharedSecret(
    ephemeralPrivateKeyHex,
    counterpartyPubKey,
  );

  const iv = randomBytes(12);
  const rawData = encoder.encode(data);
  const aes = gcm(sharedSecret, iv);
  const ciphertext = aes.encrypt(rawData);
  return `${toHex(iv)}${ephemeralPublicKeyHex.slice(2)}${toHex(ciphertext).slice(2)}` as Hex;
};

export const decrypt = (privateKey: Hash, encodedData: Hex) => {
  // manually split string by bytes12, bytes64, the rest
  const iv = toBytes(encodedData.slice(0, 26));
  const ephemeralPublicKey = `0x${encodedData.slice(26, 92)}` as Hex;
  const ciphertext = toBytes(`0x${encodedData.slice(92)}`);
  assertValidPrivateKey(privateKey);
  assertValidPoint(ephemeralPublicKey);

  // Get shared secret to use as decryption key, then decrypt with XOR
  const sharedSecret = getSharedSecret(privateKey, ephemeralPublicKey);

  const aes = gcm(sharedSecret, iv);

  return decoder.decode(aes.decrypt(ciphertext));
};
