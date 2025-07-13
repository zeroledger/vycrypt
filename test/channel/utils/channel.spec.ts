import { zeroAddress, zeroHash } from "viem";
import {
  CDTLC,
  Client,
  Instructions,
  Rec,
  Statement,
  validateTimeouts,
} from "../../../src";
import { optimismSepolia } from "viem/chains";

const now = () => BigInt(Math.ceil(Date.now() / 1000));

describe("Channel utils", () => {
  const client = {
    chain: optimismSepolia,
  } as unknown as Client;
  describe("validateTimeouts", () => {
    const instructions: Instructions = [
      {
        op: "ADD",
        value: new Statement(
          new Rec(0n, 0n),
          new Rec(0n, 0n),
          "0x0",
          client,
          0n,
        ),
      },
      {
        op: "DISPOSE",
        value: new Statement(
          new Rec(0n, 0n),
          new Rec(0n, 0n),
          "0x0",
          client,
          0n,
        ),
      },
      {
        op: "ADD",
        value: new Statement(
          new Rec(0n, 0n),
          new Rec(0n, 0n),
          new CDTLC({
            deadline: now() + 1000n,
            flankkLog: zeroAddress,
            proof: zeroHash,
          }),
          client,
          0n,
        ),
      },
    ];
    it("should validate if instructions has proper timeouts", () => {
      expect(validateTimeouts(instructions)).toBeTruthy();
      expect(
        validateTimeouts([
          ...instructions,
          {
            op: "ADD",
            value: new Statement(
              new Rec(0n, 0n),
              new Rec(0n, 0n),
              new CDTLC({
                deadline: now() + 2_592_000n + 1000n,
                flankkLog: zeroAddress,
                proof: zeroHash,
              }),
              client,
              0n,
            ),
          },
        ]),
      ).toBeFalsy();
    });
  });
});
