import { createWalletClient, http, publicActions, zeroHash } from "viem";
import { optimismSepolia } from "viem/chains";
import { Statement, Client, Rec, State } from "../../src";
import { privateKeyToAccount } from "viem/accounts";

describe("State", () => {
  const userPk =
    "0x3a74512f5ddf74d1803727dbef1972d5b199be69213ff5270bced64c66169323";

  const client = createWalletClient({
    account: privateKeyToAccount(userPk),
    chain: optimismSepolia,
    transport: http(),
  }).extend(publicActions) as Client;
  describe("generic test", () => {
    it("should pass", () => {
      const state = new State({});
      expect(state.nonce).toEqual(0n);
      expect(state.stateHash).toEqual(zeroHash);
      expect(state.statementsHash).toEqual(zeroHash);
      expect(state.getTotalBalance()).toEqual(0n);
      state.add(
        new Statement(
          new Rec(0n, 0n),
          new Rec(100n, 100n),
          "0x0",
          client,
          state.nonce,
        ),
      );
      state.recompute();
      expect(state.nonce).toEqual(1n);
      expect(state.stateHash).toEqual(
        "0xdc86132ccc9b0312432f10f91727d62c31a398417bfca79d464ca8ed55d2e14d",
      );
      expect(state.statementsHash).toEqual(
        "0x853e963b6c12ad3075f4f4baf52b75639a8813a839cb44d2f26150046b4d1550",
      );
      expect(state.getTotalBalance()).toEqual(200n);
      state.dispose(state.statements()[0]);
      state.add(
        new Statement(
          new Rec(100n, 100n),
          new Rec(150n, 50n),
          "0x0",
          client,
          state.nonce,
        ),
      );
      state.recompute();
      expect(state.nonce).toEqual(3n);
      expect(state.stateHash).toEqual(
        "0x35be16db3725588830952f1027164088b6d24703865d4731e44854d8313322a3",
      );
      expect(state.statementsHash).toEqual(
        "0x514d32c35130506006c2c4a8f590176a48744a251080fccae627ef1af8e6a682",
      );
      expect(state.getTotalBalance()).toEqual(200n);
    });
  });
});
