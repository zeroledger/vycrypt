import { isHex } from "viem";
import {
  encryptQuantum,
  decryptQuantum,
  generateQuantumKeyPair,
  type QuantumKeyPair,
} from "../src/qcrypt";
import * as fs from "fs";

describe("quantum-resistant encryption", () => {
  let keyPair: QuantumKeyPair;

  beforeEach(() => {
    keyPair = generateQuantumKeyPair();
  });

  const hexData = `0xa5eaba8f6b292d059d9e8c3a2f1b16af`;
  const jsonData = fs.readFileSync("./test/mocks/arbitraryData.json", "utf8");

  describe("generateQuantumKeyPair", () => {
    it("should generate a valid key pair", () => {
      expect(isHex(keyPair.publicKey)).toBeTruthy();
      expect(isHex(keyPair.secretKey)).toBeTruthy();
      // Public key: 1184 bytes = 2368 hex chars + 2 for "0x" = 2370
      expect(keyPair.publicKey.length).toBe(2370);
      // Secret key: 2400 bytes = 4800 hex chars + 2 for "0x" = 4802
      expect(keyPair.secretKey.length).toBe(4802);
    });

    it("should generate different key pairs each time", () => {
      const keyPair1 = generateQuantumKeyPair();
      const keyPair2 = generateQuantumKeyPair();

      expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
      expect(keyPair1.secretKey).not.toEqual(keyPair2.secretKey);
    });

    it("should accept a seed string parameter", () => {
      const seed = "my-deterministic-seed";
      const keyPair1 = generateQuantumKeyPair(seed);
      const keyPair2 = generateQuantumKeyPair(seed);

      // Same seed should produce same key pair
      expect(keyPair1.publicKey).toBe(keyPair2.publicKey);
      expect(keyPair1.secretKey).toBe(keyPair2.secretKey);
    });

    it("should produce different keys for different seeds", () => {
      const keyPair1 = generateQuantumKeyPair("seed1");
      const keyPair2 = generateQuantumKeyPair("seed2");

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.secretKey).not.toBe(keyPair2.secretKey);
    });

    it("should handle empty seed string", () => {
      const keyPair1 = generateQuantumKeyPair("");
      const keyPair2 = generateQuantumKeyPair("");

      // Empty seed should still be deterministic
      expect(keyPair1.publicKey).toBe(keyPair2.publicKey);
      expect(keyPair1.secretKey).toBe(keyPair2.secretKey);
    });

    it("should handle unicode seed strings", () => {
      const seed = "Hello 世界 🌍";
      const keyPair1 = generateQuantumKeyPair(seed);
      const keyPair2 = generateQuantumKeyPair(seed);

      expect(keyPair1.publicKey).toBe(keyPair2.publicKey);
      expect(keyPair1.secretKey).toBe(keyPair2.secretKey);
    });
  });

  describe("encryptQuantum", () => {
    it("should encrypt hex string", () => {
      const encrypted = encryptQuantum(hexData, keyPair.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
    });

    it("should encrypt json string", () => {
      const encrypted = encryptQuantum(jsonData, keyPair.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
    });

    it("should encrypt empty string", () => {
      const encrypted = encryptQuantum("", keyPair.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decryptQuantum(keyPair.secretKey, encrypted)).toBe("");
    });

    it("should encrypt large data", () => {
      const largeData = "x".repeat(10000);
      const encrypted = encryptQuantum(largeData, keyPair.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decryptQuantum(keyPair.secretKey, encrypted)).toBe(largeData);
    });

    it("should encrypt unicode data", () => {
      const unicodeData = "Hello 世界 🌍 emoji 🚀";
      const encrypted = encryptQuantum(unicodeData, keyPair.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decryptQuantum(keyPair.secretKey, encrypted)).toBe(unicodeData);
    });

    it("should encrypt binary-like data", () => {
      const binaryData = "\x00\x01\x02\x03\xff\xfe\xfd";
      const encrypted = encryptQuantum(binaryData, keyPair.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decryptQuantum(keyPair.secretKey, encrypted)).toBe(binaryData);
    });

    it("should produce different ciphertexts for same plaintext", () => {
      const data = "test data";
      const encrypted1 = encryptQuantum(data, keyPair.publicKey);
      const encrypted2 = encryptQuantum(data, keyPair.publicKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw error for non-hex public key", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => encryptQuantum("test", "not-hex" as any)).toThrow(
        "Must provide public key as hex string",
      );
    });

    it("should throw error for invalid public key length", () => {
      const invalidKey = "0x1234" as `0x${string}`;
      expect(() => encryptQuantum("test", invalidKey)).toThrow(
        "Invalid ML-KEM-768 public key length",
      );
    });
  });

  describe("decryptQuantum", () => {
    it("should decrypt hex string", () => {
      const encrypted = encryptQuantum(hexData, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(hexData);
    });

    it("should decrypt json string", () => {
      const encrypted = encryptQuantum(jsonData, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(jsonData);
    });

    it("should decrypt empty string", () => {
      const encrypted = encryptQuantum("", keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe("");
    });

    it("should decrypt large data", () => {
      const largeData = "x".repeat(10000);
      const encrypted = encryptQuantum(largeData, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(largeData);
    });

    it("should decrypt unicode data", () => {
      const unicodeData = "Hello 世界 🌍 emoji 🚀";
      const encrypted = encryptQuantum(unicodeData, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(unicodeData);
    });

    it("should throw error for non-hex secret key", () => {
      const encrypted = encryptQuantum("test", keyPair.publicKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => decryptQuantum("not-hex" as any, encrypted)).toThrow(
        "Must provide secret key as hex string",
      );
    });

    it("should throw error for invalid secret key length", () => {
      const invalidKey = "0x1234" as `0x${string}`;
      const encrypted = encryptQuantum("test", keyPair.publicKey);
      expect(() => decryptQuantum(invalidKey, encrypted)).toThrow(
        "Invalid ML-KEM-768 secret key length",
      );
    });

    it("should throw error for wrong secret key", () => {
      const wrongKeyPair = generateQuantumKeyPair();
      const encrypted = encryptQuantum("test", keyPair.publicKey);
      expect(() => decryptQuantum(wrongKeyPair.secretKey, encrypted)).toThrow();
    });

    it("should throw error for malformed encrypted data", () => {
      expect(() =>
        decryptQuantum(
          keyPair.secretKey,
          "0x1234567890abcdef" as `0x${string}`,
        ),
      ).toThrow();
    });
  });

  describe("round-trip encryption", () => {
    it("should work with different key pairs", () => {
      const keyPair1 = generateQuantumKeyPair();
      const data = "secret message";
      const encrypted = encryptQuantum(data, keyPair1.publicKey);
      const decrypted = decryptQuantum(keyPair1.secretKey, encrypted);
      expect(decrypted).toBe(data);
    });

    it("should work with multiple encryptions", () => {
      const data = "test data";
      const encrypted1 = encryptQuantum(data, keyPair.publicKey);
      const encrypted2 = encryptQuantum(data, keyPair.publicKey);
      const encrypted3 = encryptQuantum(data, keyPair.publicKey);

      expect(decryptQuantum(keyPair.secretKey, encrypted1)).toBe(data);
      expect(decryptQuantum(keyPair.secretKey, encrypted2)).toBe(data);
      expect(decryptQuantum(keyPair.secretKey, encrypted3)).toBe(data);
    });
  });

  describe("edge cases", () => {
    it("should handle very long strings", () => {
      const longString = "a".repeat(100000);
      const encrypted = encryptQuantum(longString, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(longString);
    });

    it("should handle null bytes in data", () => {
      const dataWithNulls = "test\x00data\x00with\x00nulls";
      const encrypted = encryptQuantum(dataWithNulls, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(dataWithNulls);
    });

    it("should handle special characters", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
      const encrypted = encryptQuantum(specialChars, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(specialChars);
    });

    it("should handle newlines and tabs", () => {
      const dataWithNewlines = "line1\nline2\tline3\r\nline4";
      const encrypted = encryptQuantum(dataWithNewlines, keyPair.publicKey);
      const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
      expect(decrypted).toBe(dataWithNewlines);
    });
  });

  describe("security properties", () => {
    it("should not be deterministic", () => {
      const data = "same data";
      const encrypted1 = encryptQuantum(data, keyPair.publicKey);
      const encrypted2 = encryptQuantum(data, keyPair.publicKey);
      const encrypted3 = encryptQuantum(data, keyPair.publicKey);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encrypted2).not.toBe(encrypted3);
      expect(encrypted1).not.toBe(encrypted3);
    });

    it("should produce different ciphertexts for different public keys", () => {
      const keyPair1 = generateQuantumKeyPair();
      const keyPair2 = generateQuantumKeyPair();

      const data = "test data";
      const encrypted1 = encryptQuantum(data, keyPair1.publicKey);
      const encrypted2 = encryptQuantum(data, keyPair2.publicKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should produce larger ciphertext than plaintext", () => {
      const data = "test";
      const encrypted = encryptQuantum(data, keyPair.publicKey);

      // Quantum encryption has overhead: 12 (IV) + 1088 (KEM) + 16 (GCM tag) = 1116 bytes
      // In hex: 1116 * 2 + 2 ("0x") = 2234 chars minimum
      expect(encrypted.length).toBeGreaterThan(2200);
    });
  });
});
