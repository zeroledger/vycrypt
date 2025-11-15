import { isHex } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { encrypt, decrypt } from "../src/crypt.ts";

describe("crypt", () => {
  const privKey = generatePrivateKey();
  const account = privateKeyToAccount(privKey);

  const hexData = `0xa5eaba8f6b292d059d9e8c3a2f1b16af`;

  describe("encrypt", () => {
    it("should encrypt hex string", () => {
      expect(isHex(encrypt(hexData, account.publicKey))).toBeTruthy();
    });

    it("should encrypt json string (small)", () => {
      const smallJson = JSON.stringify({
        name: "Alice",
        age: 30,
        active: true,
      });
      const encrypted = encrypt(smallJson, account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe(smallJson);
    });

    it("should encrypt empty string", () => {
      const encrypted = encrypt("", account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe("");
    });

    it("should encrypt maximum allowed data (254 bytes)", () => {
      const maxData = "x".repeat(254);
      const encrypted = encrypt(maxData, account.publicKey);
      expect(isHex(encrypted)).toBeTruthy();
      expect(decrypt(privKey, encrypted)).toBe(maxData);
    });

    it("should throw error for data >= 255 bytes", () => {
      const tooLarge = "x".repeat(255);
      expect(() => encrypt(tooLarge, account.publicKey)).toThrow(
        "Data length must be less than 255",
      );
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

    it("should decrypt json string (small)", () => {
      const smallJson = JSON.stringify({
        name: "Bob",
        id: 123,
        verified: false,
      });
      const encryptedData = encrypt(smallJson, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(smallJson);
    });

    it("should decrypt empty string", () => {
      const encryptedData = encrypt("", account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe("");
    });

    it("should decrypt maximum allowed data (254 bytes)", () => {
      const maxData = "x".repeat(254);
      const encryptedData = encrypt(maxData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(maxData);
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
    it("should handle maximum size strings (254 bytes)", () => {
      const maxString = "a".repeat(254);
      const encrypted = encrypt(maxString, account.publicKey);
      expect(decrypt(privKey, encrypted)).toBe(maxString);
    });

    it("should throw for strings over 254 bytes", () => {
      const tooLong = "a".repeat(255);
      expect(() => encrypt(tooLong, account.publicKey)).toThrow(
        "Data length must be less than 255",
      );
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

  describe("length obfuscation", () => {
    it("should produce same length for all plaintexts (fixed 255 bytes)", () => {
      const data1 = "short";
      const data2 = "x".repeat(254);
      const data3 = "";

      const encrypted1 = encrypt(data1, account.publicKey);
      const encrypted2 = encrypt(data2, account.publicKey);
      const encrypted3 = encrypt(data3, account.publicKey);

      // All should be same length (255 bytes padded + overhead)
      expect(encrypted1.length).toBe(encrypted2.length);
      expect(encrypted2.length).toBe(encrypted3.length);
    });

    it("should pad to exactly 255 bytes before encryption", () => {
      // All encrypted data should be same length regardless of input
      const data1 = "test";
      const data2 = "";
      const data3 = "x".repeat(100);

      const encrypted1 = encrypt(data1, account.publicKey);
      const encrypted2 = encrypt(data2, account.publicKey);
      const encrypted3 = encrypt(data3, account.publicKey);

      // All should be exactly the same length
      expect(encrypted1.length).toBe(encrypted2.length);
      expect(encrypted2.length).toBe(encrypted3.length);
    });

    it("should correctly decrypt data with different sizes", () => {
      const testData = [
        "",
        "a",
        "test data",
        "x".repeat(50),
        "x".repeat(100),
        "x".repeat(254),
      ];

      for (const data of testData) {
        const encrypted = encrypt(data, account.publicKey);
        const decrypted = decrypt(privKey, encrypted);
        expect(decrypted).toBe(data);
      }
    });

    it("should handle maximum padding (254 bytes for empty string)", () => {
      const data = "";
      const encrypted = encrypt(data, account.publicKey);
      const decrypted = decrypt(privKey, encrypted);
      expect(decrypted).toBe(data);

      // Should be same length as any other encryption
      const other = encrypt("test", account.publicKey);
      expect(encrypted.length).toBe(other.length);
    });

    it("should handle minimum padding (1 byte for 254-byte string)", () => {
      const data = "x".repeat(254);
      const encrypted = encrypt(data, account.publicKey);
      const decrypted = decrypt(privKey, encrypted);
      expect(decrypted).toBe(data);

      // Should be same length as any other encryption
      const other = encrypt("test", account.publicKey);
      expect(encrypted.length).toBe(other.length);
    });

    it("should throw error for corrupted data", () => {
      const data = "test data";
      const encrypted = encrypt(data, account.publicKey);

      // Corrupt the encrypted data
      const corruptedData = encrypted.slice(0, -10) + "ff".repeat(5);

      // Should fail at AES decryption
      expect(() => decrypt(privKey, corruptedData as `0x${string}`)).toThrow();
    });
  });
});
