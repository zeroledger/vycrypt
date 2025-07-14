import { createStealth, deriveStealthAccount } from "../../src/stealth";
import { isAddress, toHex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

describe("Stealth lib", () => {
  const privateKey = generatePrivateKey();
  const pubKey = privateKeyToAccount(privateKey).publicKey;

  describe("createStealth", () => {
    it("should create stealth address", () => {
      expect(isAddress(createStealth(pubKey).stealthAddress)).toBeTruthy();
    });

    it("should create different stealth addresses for same public key", () => {
      const stealth1 = createStealth(pubKey);
      const stealth2 = createStealth(pubKey);
      expect(stealth1.stealthAddress).not.toBe(stealth2.stealthAddress);
    });

    it("should return valid random number", () => {
      const stealth = createStealth(pubKey);
      expect(typeof stealth.random).toBe("bigint");
      expect(stealth.random).toBeGreaterThan(0n);
    });

    it("should create stealth address with different random values", () => {
      const stealth1 = createStealth(pubKey);
      const stealth2 = createStealth(pubKey);
      expect(stealth1.random).not.toBe(stealth2.random);
    });

    it("should throw error for invalid public key", () => {
      expect(() => createStealth("0xinvalid" as `0x${string}`)).toThrow();
    });

    it("should throw error for non-hex public key", () => {
      expect(() =>
        createStealth("not-a-hex-string" as `0x${string}`),
      ).toThrow();
    });

    it("should throw error for public key with wrong length", () => {
      expect(() =>
        createStealth("0x1234567890abcdef" as `0x${string}`),
      ).toThrow();
    });

    it("should work with different public keys", () => {
      const privKey1 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;
      const privKey2 = generatePrivateKey();
      const pubKey2 = privateKeyToAccount(privKey2).publicKey;

      const stealth1 = createStealth(pubKey1);
      const stealth2 = createStealth(pubKey2);

      expect(stealth1.stealthAddress).not.toBe(stealth2.stealthAddress);
    });
  });

  describe("deriveStealthAccount", () => {
    it("should derive private key for stealth address", async () => {
      const { stealthAddress, random } = createStealth(pubKey);
      const account = deriveStealthAccount(privateKey, toHex(random));
      expect(account.address).toBe(stealthAddress);
    });

    it("should derive different accounts for different random values", () => {
      const stealth1 = createStealth(pubKey);
      const stealth2 = createStealth(pubKey);

      const account1 = deriveStealthAccount(privateKey, toHex(stealth1.random));
      const account2 = deriveStealthAccount(privateKey, toHex(stealth2.random));

      expect(account1.address).not.toBe(account2.address);
    });

    it("should derive consistent account for same random value", () => {
      const { stealthAddress, random } = createStealth(pubKey);

      const account1 = deriveStealthAccount(privateKey, toHex(random));
      const account2 = deriveStealthAccount(privateKey, toHex(random));

      expect(account1.address).toBe(account2.address);
      expect(account1.address).toBe(stealthAddress);
    });

    it("should throw error for invalid private key", () => {
      const { random } = createStealth(pubKey);
      expect(() =>
        deriveStealthAccount("0xinvalid" as `0x${string}`, toHex(random)),
      ).toThrow();
    });

    it("should throw error for non-hex private key", () => {
      const { random } = createStealth(pubKey);
      expect(() =>
        deriveStealthAccount(
          "not-a-hex-string" as `0x${string}`,
          toHex(random),
        ),
      ).toThrow();
    });

    it("should throw error for invalid random value", () => {
      expect(() =>
        deriveStealthAccount(privateKey, "0xinvalid" as `0x${string}`),
      ).toThrow();
    });

    it("should work with different private keys", () => {
      const privKey1 = generatePrivateKey();
      const privKey2 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;

      const { stealthAddress, random } = createStealth(pubKey1);

      const account1 = deriveStealthAccount(privKey1, toHex(random));
      const account2 = deriveStealthAccount(privKey2, toHex(random));

      expect(account1.address).toBe(stealthAddress);
      expect(account2.address).not.toBe(stealthAddress);
    });
  });

  describe("round-trip stealth operations", () => {
    it("should work with multiple stealth addresses", () => {
      const stealth1 = createStealth(pubKey);
      const stealth2 = createStealth(pubKey);
      const stealth3 = createStealth(pubKey);

      const account1 = deriveStealthAccount(privateKey, toHex(stealth1.random));
      const account2 = deriveStealthAccount(privateKey, toHex(stealth2.random));
      const account3 = deriveStealthAccount(privateKey, toHex(stealth3.random));

      expect(account1.address).toBe(stealth1.stealthAddress);
      expect(account2.address).toBe(stealth2.stealthAddress);
      expect(account3.address).toBe(stealth3.stealthAddress);

      expect(account1.address).not.toBe(account2.address);
      expect(account2.address).not.toBe(account3.address);
      expect(account1.address).not.toBe(account3.address);
    });

    it("should work with different key pairs", () => {
      const privKey1 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;
      const privKey2 = generatePrivateKey();
      const pubKey2 = privateKeyToAccount(privKey2).publicKey;

      const stealth1 = createStealth(pubKey1);
      const stealth2 = createStealth(pubKey2);

      const account1 = deriveStealthAccount(privKey1, toHex(stealth1.random));
      const account2 = deriveStealthAccount(privKey2, toHex(stealth2.random));

      expect(account1.address).toBe(stealth1.stealthAddress);
      expect(account2.address).toBe(stealth2.stealthAddress);
    });
  });

  describe("edge cases", () => {
    it("should handle very large random values", () => {
      const largeRandom = BigInt("0xffffffffffffffffffffffffffffffff");
      const stealth = createStealth(pubKey);
      expect(stealth.random).toBeLessThanOrEqual(largeRandom);
    });

    it("should handle very small random values", () => {
      const stealth = createStealth(pubKey);
      expect(stealth.random).toBeGreaterThan(0n);
    });

    it("should work with multiple iterations", () => {
      for (let i = 0; i < 10; i++) {
        const stealth = createStealth(pubKey);
        const account = deriveStealthAccount(privateKey, toHex(stealth.random));
        expect(account.address).toBe(stealth.stealthAddress);
        expect(isAddress(account.address)).toBeTruthy();
      }
    });
  });

  describe("security properties", () => {
    it("should not be deterministic", () => {
      const stealth1 = createStealth(pubKey);
      const stealth2 = createStealth(pubKey);
      const stealth3 = createStealth(pubKey);

      expect(stealth1.stealthAddress).not.toBe(stealth2.stealthAddress);
      expect(stealth2.stealthAddress).not.toBe(stealth3.stealthAddress);
      expect(stealth1.stealthAddress).not.toBe(stealth3.stealthAddress);

      expect(stealth1.random).not.toBe(stealth2.random);
      expect(stealth2.random).not.toBe(stealth3.random);
      expect(stealth1.random).not.toBe(stealth3.random);
    });

    it("should produce different addresses for different public keys", () => {
      const privKey1 = generatePrivateKey();
      const pubKey1 = privateKeyToAccount(privKey1).publicKey;
      const privKey2 = generatePrivateKey();
      const pubKey2 = privateKeyToAccount(privKey2).publicKey;

      const stealth1 = createStealth(pubKey1);
      const stealth2 = createStealth(pubKey2);

      expect(stealth1.stealthAddress).not.toBe(stealth2.stealthAddress);
    });
  });
});
