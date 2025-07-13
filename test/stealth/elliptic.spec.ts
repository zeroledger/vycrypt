import { mulPublicKey, mulPrivateKey } from "../../src/stealth";
import { hexToBigInt, keccak256, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

describe("EllipticService", () => {
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
  });
});
