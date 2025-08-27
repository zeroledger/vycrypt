import { isHex } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { encrypt, decrypt } from "../src/crypt";
import * as fs from "fs";

describe("crypt", () => {
  const privKey = generatePrivateKey();
  const account = privateKeyToAccount(privKey);

  const hexData = `0xa5eaba8f6b292d059d9e8c3a2f1b16af`;
  const jsonData = fs.readFileSync("./test/mocks/arbitraryData.json", "utf8");

  describe("encrypt", () => {
    it("should encrypt hex string", () => {
      const data = encrypt(hexData, account.publicKey);
      console.log("data ", data);
      expect(isHex(encrypt(hexData, account.publicKey))).toBeTruthy();
    });

    it("should encrypt json string", () => {
      expect(isHex(encrypt(jsonData, account.publicKey))).toBeTruthy();
    });

    it("should encrypt empty string", () => {
      const encrypted = encrypt("", account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe("");
    });

    it("should encrypt large data", () => {
      const largeData = "x".repeat(10000);
      const encrypted = encrypt(largeData, account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe(largeData);
    });

    it("should encrypt unicode data", () => {
      const unicodeData = "Hello 世界 🌍 emoji 🚀";
      const encrypted = encrypt(unicodeData, account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe(unicodeData);
    });

    it("should encrypt binary-like data", () => {
      const binaryData = "\x00\x01\x02\x03\xff\xfe\xfd";
      const encrypted = encrypt(binaryData, account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe(binaryData);
    });

    it("should produce different ciphertexts for same plaintext", () => {
      const data = "test data";
      const encrypted1 = encrypt(data, account.publicKey);
      const encrypted2 = encrypt(data, account.publicKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw error for invalid public key", () => {
      expect(() => encrypt("test", "0xinvalid" as `0x${string}`)).toThrow();
    });

    it("should throw error for non-hex public key", () => {
      expect(() =>
        encrypt("test", "not-a-hex-string" as `0x${string}`),
      ).toThrow();
    });
  });

  describe("decrypt", () => {
    it("should decrypt hex string", () => {
      const encryptedData = encrypt(hexData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(hexData);
    });

    it("should decrypt json string", () => {
      const encryptedData = encrypt(jsonData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(jsonData);
    });

    it("should decrypt empty string", () => {
      const encryptedData = encrypt("", account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe("");
    });

    it("should decrypt large data", () => {
      const largeData = "x".repeat(10000);
      const encryptedData = encrypt(largeData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(largeData);
    });

    it("should decrypt unicode data", () => {
      const unicodeData = "Hello 世界 🌍 emoji 🚀";
      const encryptedData = encrypt(unicodeData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(unicodeData);
    });

    it("should throw error for invalid private key", () => {
      const encryptedData = encrypt("test", account.publicKey);
      expect(() =>
        decrypt("0xinvalid" as `0x${string}`, encryptedData),
      ).toThrow();
    });

    it("should throw error for non-hex private key", () => {
      const encryptedData = encrypt("test", account.publicKey);
      expect(() =>
        decrypt("not-a-hex-string" as `0x${string}`, encryptedData),
      ).toThrow();
    });

    it("should throw error for invalid encrypted data", () => {
      expect(() => decrypt(privKey, "0xinvalid" as `0x${string}`)).toThrow();
    });

    it("should throw error for malformed encrypted data", () => {
      expect(() =>
        decrypt(privKey, "0x1234567890abcdef" as `0x${string}`),
      ).toThrow();
    });

    it("should throw error for wrong private key", () => {
      const wrongPrivKey = generatePrivateKey();
      const encryptedData = encrypt("test", account.publicKey);
      expect(() => decrypt(wrongPrivKey, encryptedData)).toThrow();
    });
  });

  describe("round-trip encryption", () => {
    it("should work with different key pairs", () => {
      const privKey1 = generatePrivateKey();
      const account1 = privateKeyToAccount(privKey1);

      const data = "secret message";
      const encrypted = encrypt(data, account1.publicKey);
      const decrypted = decrypt(privKey1, encrypted);
      expect(decrypted).toBe(data);
    });

    it("should work with multiple encryptions", () => {
      const data = "test data";
      const encrypted1 = encrypt(data, account.publicKey);
      const encrypted2 = encrypt(data, account.publicKey);
      const encrypted3 = encrypt(data, account.publicKey);

      expect(decrypt(privKey, encrypted1)).toBe(data);
      expect(decrypt(privKey, encrypted2)).toBe(data);
      expect(decrypt(privKey, encrypted3)).toBe(data);
    });
  });

  describe("edge cases", () => {
    it("should handle very long strings", () => {
      const longString = "a".repeat(100000);
      const encrypted = encrypt(longString, account.publicKey);
      expect(decrypt(privKey, encrypted)).toBe(longString);
    });

    it("should handle null bytes in data", () => {
      const dataWithNulls = "test\x00data\x00with\x00nulls";
      const encrypted = encrypt(dataWithNulls, account.publicKey);
      expect(decrypt(privKey, encrypted)).toBe(dataWithNulls);
    });

    it("should handle special characters", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
      const encrypted = encrypt(specialChars, account.publicKey);
      expect(decrypt(privKey, encrypted)).toBe(specialChars);
    });

    it("should handle newlines and tabs", () => {
      const dataWithNewlines = "line1\nline2\tline3\r\nline4";
      const encrypted = encrypt(dataWithNewlines, account.publicKey);
      expect(decrypt(privKey, encrypted)).toBe(dataWithNewlines);
    });
  });

  describe("security properties", () => {
    it("should not be deterministic", () => {
      const data = "same data";
      const encrypted1 = encrypt(data, account.publicKey);
      const encrypted2 = encrypt(data, account.publicKey);
      const encrypted3 = encrypt(data, account.publicKey);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encrypted2).not.toBe(encrypted3);
      expect(encrypted1).not.toBe(encrypted3);
    });

    it("should produce different ciphertexts for different public keys", () => {
      const privKey1 = generatePrivateKey();
      const account1 = privateKeyToAccount(privKey1);
      const privKey2 = generatePrivateKey();
      const account2 = privateKeyToAccount(privKey2);

      const data = "test data";
      const encrypted1 = encrypt(data, account1.publicKey);
      const encrypted2 = encrypt(data, account2.publicKey);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
