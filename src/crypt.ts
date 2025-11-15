import { secp256k1 } from "@noble/curves/secp256k1";
import { randomBytes } from "@noble/hashes/utils";
import { gcm } from "@noble/ciphers/aes.js";

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
  ProjectivePoint: Point,
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
 * @notice Encrypt data with ECIES and length obfuscation
 * @param data String to encrypt
 * @param counterpartyPubKey Recipient's public key
 * @returns Hex strings of uncompressed 65 byte public key and ciphertext
 * @description Adds a 1-byte header + paddingSize (1-254 bytes) before the actual data to obfuscate length
 */
export const encrypt = (data: string, counterpartyPubKey: Hex) => {
  const dataBytes = encoder.encode(data);

  if (dataBytes.length >= 255) {
    throw new Error("Data length must be less than 255");
  }

  const fakePrefixSize = 255 - dataBytes.length;
  const fakePrefix = randomBytes(fakePrefixSize);
  // Create padded data: [prefix_size(1 byte)][fake_prefix(1-254 bytes)][actual_data]
  const paddedData = new Uint8Array(1 + fakePrefixSize + dataBytes.length);
  paddedData[0] = fakePrefixSize;
  paddedData.set(fakePrefix, 1);
  paddedData.set(dataBytes, 1 + fakePrefixSize);

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
  const aes = gcm(sharedSecret, iv);
  const ciphertext = aes.encrypt(paddedData);
  return `${toHex(iv)}${ephemeralPublicKeyHex.slice(2)}${toHex(ciphertext).slice(2)}` as Hex;
};

/**
 * @notice Decrypt data encrypted with ECIES
 * @param privateKey Your private key
 * @param encodedData Encrypted data from encrypt()
 * @returns Decrypted string
 * @description Automatically removes fake prefix padding added during encryption
 */
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
  const decryptedBytes = aes.decrypt(ciphertext);

  // Read the fake prefix size from first byte
  const fakePrefixSize = decryptedBytes[0];

  // Skip header (1 byte) and fake prefix, return actual data
  const actualData = decryptedBytes.slice(1 + fakePrefixSize);

  return decoder.decode(actualData);
};
