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
  });

  describe("deriveStealthAccount", () => {
    it("should derive private key for stealth address", async () => {
      const { stealthAddress, random } = createStealth(pubKey);
      const account = deriveStealthAccount(privateKey, toHex(random));
      expect(account.address).toBe(stealthAddress);
    });
  });
});
