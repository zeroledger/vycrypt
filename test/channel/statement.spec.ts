import {
  createWalletClient,
  http,
  publicActions,
  zeroAddress,
  zeroHash,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { Statement, CDTLC, Client, Rec } from "../../src";
import { privateKeyToAccount } from "viem/accounts";

describe("Statement", () => {
  let statement: Statement;

  const userPk =
    "0x3a74512f5ddf74d1803727dbef1972d5b199be69213ff5270bced64c66169323";

  const client = createWalletClient({
    account: privateKeyToAccount(userPk),
    chain: optimismSepolia,
    transport: http(),
  }).extend(publicActions) as Client;

  beforeEach(() => {
    statement = new Statement(
      new Rec(0n, 0n),
      new Rec(0n, 0n),
      "0x0",
      client,
      0n,
    );
  });

  it("should create statement", () => {
    expect(statement.id).toBe(
      "0xd67e819e58450a505244a454166358ac35c7c1a0a936c7ee5d84f9b0c3ebc9ea",
    );
    expect(statement.condition).toBe(zeroAddress);
    expect(statement.conditionParams).toBe("0x0");
  });

  describe("static methods", () => {
    describe("of", () => {
      it("should create staement base on serialized statement", async () => {
        expect(
          (await Statement.of(statement.serialize(), client)).statement,
        ).toEqual(statement);
      });
    });
  });

  describe("onchainVersion", () => {
    it("should return statement ready for onchain submission", () => {
      expect(statement.onchainVersion()).toEqual({
        from: { user0Balance: 0n, user1Balance: 0n },
        to: { user0Balance: 0n, user1Balance: 0n },
        condition: zeroAddress,
        conditionParams: "0x0",
      });
    });
  });

  describe("isUnconditionalVolumeExpand", () => {
    it("should return true for unconditionalVolumeExpand statement", () => {
      const unconditionalVolumeExpandStatement = new Statement(
        statement.from,
        new Rec(100n, 100n),
        "0x0",
        client,
        0n,
      );

      expect(
        unconditionalVolumeExpandStatement.isUnconditionalVolumeExpand(),
      ).toBeTruthy();

      const unconditionalVolumeExpandStatement2 = new Statement(
        statement.from,
        new Rec(100n, 0n),
        "0x0",
        client,
        1n,
      );
      expect(
        unconditionalVolumeExpandStatement2.isUnconditionalVolumeExpand(),
      ).toBeTruthy();
    });

    it("should return false for non unconditionalVolumeExpand statement", () => {
      expect(statement.isUnconditionalVolumeExpand()).toBeFalsy();

      const unconditionalStatement = new Statement(
        new Rec(100n, 0n),
        new Rec(50n, 50n),
        "0x0",
        client,
        0n,
      );

      expect(unconditionalStatement.isUnconditionalVolumeExpand()).toBeFalsy();
    });
  });

  describe("isCDTLC", () => {
    it("should return true for statement with CDTLC condition type", () => {
      const CDTLCVolumeExpandStatement = new Statement(
        statement.from,
        new Rec(100n, 100n),
        new CDTLC({
          deadline: 1000n,
          flankkLog: zeroAddress,
          proof: zeroHash,
        }),
        client,
        0n,
      );

      expect(CDTLCVolumeExpandStatement.isCDTLC()).toBeTruthy();
    });

    it("should return false for statement with non CDTLC condition type", () => {
      expect(statement.isCDTLC()).toBeFalsy();
    });
  });

  describe("verifyIntegrity", () => {
    it("should be valid for balanced statement", async () => {
      const invalidStatement = new Statement(
        new Rec(200n, 200n),
        new Rec(400n, 0n),
        "0x0",
        client,
        0n,
      );

      const { error, statement: recoveredStatement } = await Statement.of(
        invalidStatement.serialize(),
        client,
      );

      expect(recoveredStatement?.id).toEqual(
        "0x5d6c784f80fe3b06fdd1c133cb9ec663760d2cda7691c64e69962b444aec980b",
      );
      expect(error).toEqual(undefined);
    });
    it("should return 'imbalanced_records' for non-extend imbalanced statement", async () => {
      const invalidStatement = new Statement(
        new Rec(200n, 0n),
        new Rec(50n, 100n),
        "0x0",
        client,
        0n,
      );

      const { error, statement: recoveredStatement } = await Statement.of(
        invalidStatement.serialize(),
        client,
      );

      expect(recoveredStatement).toEqual(undefined);
      expect(error).toEqual("imbalanced_records");
    });

    it("should be valid for imbalanced extend statement", async () => {
      const invalidStatement = new Statement(
        new Rec(0n, 0n),
        new Rec(400n, 0n),
        new CDTLC({
          deadline: 100n,
          flankkLog: zeroAddress,
          proof: zeroHash,
        }),
        client,
        0n,
      );

      const { error, statement: recoveredStatement } = await Statement.of(
        invalidStatement.serialize(),
        client,
      );

      expect(recoveredStatement?.id).toEqual(
        "0x534138ed7af0de4fc3ca200914f0384a45c79bb122ff7ea9c87e7fd66b3329da",
      );
      expect(error).toEqual(undefined);
    });
  });
});
