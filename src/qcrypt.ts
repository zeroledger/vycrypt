import { randomBytes } from "@noble/hashes/utils";
import { gcm } from "@noble/ciphers/aes.js";
import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";
import { sha512 } from "@noble/hashes/sha2";

import { type Hex, isHex, sha256, toHex, toBytes } from "viem";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/**
 * Quantum-resistant key pair for ML-KEM encryption
 */
export interface QuantumKeyPair {
  publicKey: Hex;
  secretKey: Hex;
}

/**
 * @notice Throws if provided public key is not valid.
 * @param publicKey ML-KEM-768 public key as hex string
 */
export function assertValidQuantumPublicKey(publicKey: Hex) {
  if (!isHex(publicKey)) {
    throw new Error("Must provide public key as hex string");
  }
  const keyBytes = toBytes(publicKey);
  if (keyBytes.length !== 1184) {
    throw new Error("Invalid ML-KEM-768 public key length");
  }
}

/**
 * @notice Throws if provided secret key is not valid.
 * @param secretKey ML-KEM-768 secret key as hex string
 */
export function assertValidQuantumSecretKey(secretKey: Hex) {
  if (!isHex(secretKey)) {
    throw new Error("Must provide secret key as hex string");
  }
  const keyBytes = toBytes(secretKey);
  if (keyBytes.length !== 2400) {
    throw new Error("Invalid ML-KEM-768 secret key length");
  }
}

/**
 * @notice Generate a quantum-resistant key pair using ML-KEM-768
 * @param seed Optional seed string for deterministic key generation
 * @returns QuantumKeyPair with public and secret keys as hex strings
 */
export function generateQuantumKeyPair(seed?: string): QuantumKeyPair {
  let seedBytes: Uint8Array;

  if (seed !== undefined) {
    // Generate 64-byte seed from string using SHA-512 (produces exactly 64 bytes)
    seedBytes = sha512(encoder.encode(seed));
  } else {
    seedBytes = randomBytes(64);
  }

  const keyPair = ml_kem768.keygen(seedBytes);
  return {
    publicKey: toHex(keyPair.publicKey),
    secretKey: toHex(keyPair.secretKey),
  };
}

/**
 * @notice Encrypt data using quantum-resistant ML-KEM-768 with length obfuscation
 * @param data String to encrypt (supports any UTF-8 data)
 * @param publicKey Recipient's ML-KEM-768 public key (0x-prefixed hex string, 1184 bytes)
 * @returns Hex string of encrypted data
 * @description Adds a 1-byte header + paddingSize (1-254 bytes) before the actual data to obfuscate length
 */
export const encryptQuantum = (data: string, publicKey: Hex): Hex => {
  assertValidQuantumPublicKey(publicKey);

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

  // Convert public key from hex to bytes
  const publicKeyBytes = toBytes(publicKey);

  // Encapsulate to get shared secret and KEM ciphertext
  const { cipherText: kemCiphertext, sharedSecret } =
    ml_kem768.encapsulate(publicKeyBytes);

  // Derive AES key from shared secret
  const aesKey = toBytes(sha256(toHex(sharedSecret)));

  // Encrypt data with AES-256-GCM
  const iv = randomBytes(12);
  const aes = gcm(aesKey, iv);
  const ciphertext = aes.encrypt(paddedData);

  // Format: iv(12) + kemCiphertext(1088) + ciphertext(variable)
  return `${toHex(iv)}${toHex(kemCiphertext).slice(2)}${toHex(ciphertext).slice(2)}` as Hex;
};

/**
 * @notice Decrypt data using quantum-resistant ML-KEM-768
 * @param secretKey Your ML-KEM-768 secret key (0x-prefixed hex string, 2400 bytes)
 * @param encodedData Encrypted data from encryptQuantum()
 * @returns Decrypted string
 * @description Automatically removes fake prefix padding added during encryption
 */
export const decryptQuantum = (secretKey: Hex, encodedData: Hex): string => {
  assertValidQuantumSecretKey(secretKey);

  // Convert secret key from hex to bytes
  const secretKeyBytes = toBytes(secretKey);

  // Manually split string: bytes12 (iv) + bytes1088 (KEM ciphertext) + rest (AES ciphertext)
  const iv = toBytes(encodedData.slice(0, 26)); // 0x + 12*2 = 26
  const kemCiphertext = toBytes(`0x${encodedData.slice(26, 2202)}`); // 26 + 1088*2 = 2202
  const ciphertext = toBytes(`0x${encodedData.slice(2202)}`);

  // Decapsulate to get shared secret
  const sharedSecret = ml_kem768.decapsulate(kemCiphertext, secretKeyBytes);

  // Derive AES key from shared secret
  const aesKey = toBytes(sha256(toHex(sharedSecret)));

  // Decrypt with AES-256-GCM
  const aes = gcm(aesKey, iv);
  const decryptedBytes = aes.decrypt(ciphertext);

  // Read the fake prefix size from first byte
  const fakePrefixSize = decryptedBytes[0];

  // Skip header (1 byte) and fake prefix, return actual data
  const actualData = decryptedBytes.slice(1 + fakePrefixSize);

  return decoder.decode(actualData);
};
