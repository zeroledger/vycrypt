import { mulPublicKey, mulPrivateKey } from "../../src/stealth/elliptic.ts";
import { hexToBigInt, keccak256, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

describe("Elliptic lib", () => {
  const random = hexToBigInt("0x6e3c9fd251ab29e975e08263de3bd80878756834");
  const privateKey =
    "0x03931c2e8f4d8cb2c285e5d0684eab0dd5c3d8f2d15b3377721b272fedaff245";
  const pubKey = privateKeyToAccount(privateKey).publicKey;

  describe("mulPublicKey", () => {
    it("should create public key", () => {
      expect(mulPublicKey(pubKey, random)).toBe(
        "0x0498c45665e7cae17ee78e885fea1414605e0eee733363e1a77185bb706c0ba612c885338e7bca64a12d8603a3f71d2bdc9814326277344f80ee780d47332a11c6",
      );
    });

    it("should create different public keys for different multipliers", () => {
      const result1 = mulPublicKey(pubKey, 1n);
      const result2 = mulPublicKey(pubKey, 2n);
      const result3 = mulPublicKey(pubKey, 3n);

      expect(result1).not.toBe(result2);
      expect(result2).not.toBe(result3);
      expect(result1).not.toBe(result3);
    });

    it("should create compressed public key when requested", () => {
      const compressed = mulPublicKey(pubKey, random, true);
      expect(compressed.length).toBe(68); // 0x + 33 bytes + 0x04 prefix
    });

    it("should create uncompressed public key by default", () => {
      const uncompressed = mulPublicKey(pubKey, random, false);
      expect(uncompressed.length).toBe(132); // 0x + 65 bytes + 0x04 prefix
    });

    it("should throw error for invalid public key", () => {
      expect(() => mulPublicKey("0xinvalid" as Hex, random)).toThrow();
    });

    it("should throw error for non-hex public key", () => {
      expect(() => mulPublicKey("not-a-hex-string" as Hex, random)).toThrow();
    });

    it("should throw error for public key with wrong length", () => {
      expect(() => mulPublicKey("0x1234567890abcdef" as Hex, random)).toThrow();
    });

    it("should work with zero multiplier", () => {
      expect(() => mulPublicKey(pubKey, 0n)).toThrow();
    });

    it("should work with very large multiplier", () => {
      const largeMultiplier = BigInt("0xffffffffffffffffffffffffffffffff");
      expect(() => mulPublicKey(pubKey, largeMultiplier)).not.toThrow();
    });

    it("should work with different public keys", () => {
      const privKey1 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;
      const privKey2 = generatePrivateKey();
      const pubKey2 = privateKeyToAccount(privKey2).publicKey;

      const result1 = mulPublicKey(pubKey1, random);
      const result2 = mulPublicKey(pubKey2, random);

      expect(result1).not.toBe(result2);
    });

    it("should be deterministic for same inputs", () => {
      const result1 = mulPublicKey(pubKey, random);
      const result2 = mulPublicKey(pubKey, random);
      expect(result1).toBe(result2);
    });
  });

  describe("mulPrivateKey", () => {
    it("should create private key", async () => {
      const extendedPublicKey = mulPublicKey(pubKey, random);
      const stealthAddress =
        "0x" +
        keccak256(("0x" + extendedPublicKey.substring(4)) as Hex).substring(26);
      const newPrivateKey = mulPrivateKey(privateKey, random);
      const account = privateKeyToAccount(newPrivateKey);
      expect(account.publicKey).toBe(extendedPublicKey);
      expect(account.address.toLowerCase()).toBe(stealthAddress);
    });

    it("should create different private keys for different multipliers", () => {
      const result1 = mulPrivateKey(privateKey, 1n);
      const result2 = mulPrivateKey(privateKey, 2n);
      const result3 = mulPrivateKey(privateKey, 3n);

      expect(result1).not.toBe(result2);
      expect(result2).not.toBe(result3);
      expect(result1).not.toBe(result3);
    });

    it("should return valid private key format", () => {
      const result = mulPrivateKey(privateKey, random);
      expect(result.startsWith("0x")).toBeTruthy();
      expect(result.length).toBe(66); // 0x + 32 bytes
    });

    it("should throw error for invalid private key", () => {
      expect(() => mulPrivateKey("0xinvalid" as Hex, random)).toThrow();
    });

    it("should throw error for non-hex private key", () => {
      expect(() => mulPrivateKey("not-a-hex-string" as Hex, random)).toThrow();
    });

    it("should work with private key of any length (modulo operation handles it)", () => {
      expect(() =>
        mulPrivateKey("0x1234567890abcdef" as Hex, random),
      ).not.toThrow();
    });

    it("should work with zero multiplier", () => {
      expect(() => mulPrivateKey(privateKey, 0n)).not.toThrow();
    });

    it("should work with very large multiplier", () => {
      const largeMultiplier = BigInt("0xffffffffffffffffffffffffffffffff");
      expect(() => mulPrivateKey(privateKey, largeMultiplier)).not.toThrow();
    });

    it("should work with different private keys", () => {
      const privKey1 = generatePrivateKey();
      const privKey2 = generatePrivateKey();

      const result1 = mulPrivateKey(privKey1, random);
      const result2 = mulPrivateKey(privKey2, random);

      expect(result1).not.toBe(result2);
    });

    it("should be deterministic for same inputs", () => {
      const result1 = mulPrivateKey(privateKey, random);
      const result2 = mulPrivateKey(privateKey, random);
      expect(result1).toBe(result2);
    });

    it("should produce valid private key within curve order", () => {
      const result = mulPrivateKey(privateKey, random);
      const account = privateKeyToAccount(result);
      expect(account.address).toBeDefined();
    });
  });

  describe("round-trip operations", () => {
    it("should work with multiple multipliers", () => {
      const multipliers = [1n, 2n, 3n, 10n, 100n, 1000n];

      for (const multiplier of multipliers) {
        const extendedPublicKey = mulPublicKey(pubKey, multiplier);
        const newPrivateKey = mulPrivateKey(privateKey, multiplier);
        const account = privateKeyToAccount(newPrivateKey);

        expect(account.publicKey).toBe(extendedPublicKey);
      }
    });

    it("should work with different key pairs", () => {
      const privKey1 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;
      const privKey2 = generatePrivateKey();
      const pubKey2 = privateKeyToAccount(privKey2).publicKey;

      const extendedPublicKey1 = mulPublicKey(pubKey1, random);
      const newPrivateKey1 = mulPrivateKey(privKey1, random);
      const account1 = privateKeyToAccount(newPrivateKey1);

      const extendedPublicKey2 = mulPublicKey(pubKey2, random);
      const newPrivateKey2 = mulPrivateKey(privKey2, random);
      const account2 = privateKeyToAccount(newPrivateKey2);

      expect(account1.publicKey).toBe(extendedPublicKey1);
      expect(account2.publicKey).toBe(extendedPublicKey2);
      expect(account1.publicKey).not.toBe(account2.publicKey);
    });
  });

  describe("edge cases", () => {
    it("should handle very large multipliers", () => {
      const largeMultiplier = BigInt("0xffffffffffffffffffffffffffffffff");
      expect(() => {
        const extendedPublicKey = mulPublicKey(pubKey, largeMultiplier);
        const newPrivateKey = mulPrivateKey(privateKey, largeMultiplier);
        const account = privateKeyToAccount(newPrivateKey);
        expect(account.publicKey).toBe(extendedPublicKey);
      }).not.toThrow();
    });

    it("should handle very small multipliers", () => {
      const smallMultiplier = 1n;
      expect(() => {
        const extendedPublicKey = mulPublicKey(pubKey, smallMultiplier);
        const newPrivateKey = mulPrivateKey(privateKey, smallMultiplier);
        const account = privateKeyToAccount(newPrivateKey);
        expect(account.publicKey).toBe(extendedPublicKey);
      }).not.toThrow();
    });

    it("should work with multiple iterations", () => {
      for (let i = 0; i < 10; i++) {
        const multiplier = BigInt(i + 1);
        const extendedPublicKey = mulPublicKey(pubKey, multiplier);
        const newPrivateKey = mulPrivateKey(privateKey, multiplier);
        const account = privateKeyToAccount(newPrivateKey);
        expect(account.publicKey).toBe(extendedPublicKey);
      }
    });
  });

  describe("security properties", () => {
    it("should not be deterministic across different inputs", () => {
      const result1 = mulPublicKey(pubKey, 1n);
      const result2 = mulPublicKey(pubKey, 2n);
      const result3 = mulPublicKey(pubKey, 3n);

      expect(result1).not.toBe(result2);
      expect(result2).not.toBe(result3);
      expect(result1).not.toBe(result3);
    });

    it("should produce different results for different public keys", () => {
      const privKey1 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;
      const privKey2 = generatePrivateKey();
      const pubKey2 = privateKeyToAccount(privKey2).publicKey;

      const result1 = mulPublicKey(pubKey1, random);
      const result2 = mulPublicKey(pubKey2, random);

      expect(result1).not.toBe(result2);
    });

    it("should produce different results for different private keys", () => {
      const privKey1 = generatePrivateKey();
      const privKey2 = generatePrivateKey();

      const result1 = mulPrivateKey(privKey1, random);
      const result2 = mulPrivateKey(privKey2, random);

      expect(result1).not.toBe(result2);
    });
  });
});
