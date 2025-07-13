import { createWalletClient, http, publicActions, zeroHash } from "viem";
import { optimismSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  CDTLC,
  Channel,
  parseInstructions,
  SignWallet,
  type Client,
  State,
  typeToAddress,
} from "../../src/channel";

export const flankk = "0x427fF03f452B28ebc90D9AB51db014D0B28eA0AA";
export const token = "0x25eC837C325C3f6c7D7772CD737CBca962329621";

const addr = (client: SignWallet) => client.account.address;

describe("Channel", () => {
  const domain = {
    name: "Flankk",
    version: "0.0.5",
    chainId: optimismSepolia.id,
    verifyingContract: flankk,
  } as const;

  const user0Pk =
    "0x3a74512f5ddf74d1803727dbef1972d5b199be69213ff5270bced64c66169323";
  const user1Pk =
    "0xb80bfbfb69e567170bd4bccf53f871544deef10c7b5f4405986f280f5adca536";

  const client0 = createWalletClient({
    account: privateKeyToAccount(user0Pk),
    chain: optimismSepolia,
    transport: http(),
  }).extend(publicActions) as Client;

  const client1 = createWalletClient({
    account: privateKeyToAccount(user1Pk),
    chain: optimismSepolia,
    transport: http(),
  }).extend(publicActions) as Client;

  let channel: Channel;
  let state: State;

  beforeEach(() => {
    state = new State({}, 0n);
    channel = new Channel(token, domain, addr(client0), addr(client1), client0);
    channel.attach(state);
  });

  it("should create channel", () => {
    expect(channel.id).toBe(
      "0x3f9fa2fece8517d61c0b1a913aaeb441ba0af1d0c094c21ed16081b3afad0383",
    );
    expect(channel.isOpen()).toBeFalsy();
    expect(channel.isFullNode()).toBeFalsy();
    expect(channel.owner()).toBe(addr(client0));
    expect(channel.counterparty()).toBe(addr(client1));
  });

  describe("craftVolumeExpandInstructions", () => {
    it(`should create 'add' instruction that expands (mint) balances for channel owners`, async () => {
      const instructions = await channel.craftVolumeExpandInstructions(
        100n,
        50n,
        "0x0",
      );
      expect(state.nonce).toBe(1n);
      expect(instructions.length).toBe(1);
      expect(instructions[0].op).toBe("ADD");
    });
  });

  describe("craftTransferInstructions", () => {
    it(`should always create consolidation instruction (dispose + add)`, async () => {
      await channel.craftVolumeExpandInstructions(100n, 50n, "0x0");

      const instructions = await channel.craftTransferInstructions(10n);

      expect(state.nonce).toBe(6n);
      expect(instructions.length).toBe(5);
      expect(instructions[0].op).toBe("DISPOSE");
      expect(instructions[1].op).toBe("ADD");
      expect(instructions[2].op).toBe("DISPOSE");
      expect(instructions[3].op).toBe("ADD");
      expect(instructions[4].op).toBe("ADD");
    });
    it("should throw error if balance is no enough for transfer", async () => {
      await channel.craftVolumeExpandInstructions(100n, 50n, "0x0");

      let error: Error | undefined = undefined;

      try {
        await channel.craftTransferInstructions(101n);
      } catch (e) {
        error = e as Error;
      }

      expect(error?.message).toBe("BALANCE_IS_NOT_ENOUGH");
    });
  });

  describe("coinbaseInstruction", () => {
    it("should return coinbase instruction for initialized channel", async () => {
      const instructions = await channel.craftVolumeExpandInstructions(
        100n,
        50n,
        "0x0",
      );

      const coinbaseInstruction = await channel.coinbaseInstruction();

      expect(instructions[0]).toEqual(coinbaseInstruction);
    });

    it("should return undefined for non initialized channel", async () => {
      const coinbaseInstruction = await channel.coinbaseInstruction();
      expect(coinbaseInstruction).toBeUndefined();
    });

    it("should return undefined for initialized channel with more than more than 1 instruction processed", async () => {
      await channel.craftVolumeExpandInstructions(100n, 50n, "0x0");

      await channel.craftTransferInstructions(10n);

      const coinbaseInstruction = await channel.coinbaseInstruction();
      expect(coinbaseInstruction).toBeUndefined();
    });
  });

  describe("processInstructions", () => {
    let counterpartyChannelState: State;
    let counterpartyChannel: Channel;

    beforeEach(() => {
      counterpartyChannelState = new State({}, 0n);
      counterpartyChannel = new Channel(
        token,
        domain,
        addr(client0),
        addr(client1),
        client1,
      );
      counterpartyChannel.attach(counterpartyChannelState);
    });
    it("should process coinbase instruction if channel is empty", async () => {
      const serializedInstructions =
        await channel.craftVolumeExpandInstructions(100n, 50n, "0x0");

      const instructions = await parseInstructions(
        serializedInstructions,
        counterpartyChannel.client,
      );

      await counterpartyChannel.processInstructions(instructions, 0n);

      expect(counterpartyChannel.state().nonce).toBe(1n);
      expect(await counterpartyChannel.getSettledBalanceOfOwner()).toBe(50n);
      expect(await counterpartyChannel.getSettledBalanceOfCounterparty()).toBe(
        100n,
      );
    });

    it("should not process non-coinbase instruction if channel is empty", async () => {
      await channel.craftVolumeExpandInstructions(100n, 50n, "0x0");
      const serializedInstructions =
        await channel.craftTransferInstructions(10n);

      const instructions = await parseInstructions(
        serializedInstructions,
        counterpartyChannel.client,
      );

      let error: Error | undefined = undefined;

      try {
        await counterpartyChannel.processInstructions(instructions, 0n);
      } catch (e) {
        error = e as Error;
      }

      expect(error?.message).toBe("INVALID_COINBASE_INSTRUCTION");
    });

    it("should process coins transfer instruction", async () => {
      const coinbaseInstructions = await parseInstructions(
        await channel.craftVolumeExpandInstructions(100n, 50n, "0x0"),
        counterpartyChannel.client,
      );

      await counterpartyChannel.processInstructions(coinbaseInstructions, 0n);

      const transferInstructions = await parseInstructions(
        await channel.craftTransferInstructions(10n),
        counterpartyChannel.client,
      );

      await counterpartyChannel.processInstructions(transferInstructions, 150n);

      expect(counterpartyChannel.state().nonce).toBe(6n);
      expect(await counterpartyChannel.getSettledBalanceOfOwner()).toBe(60n);
      expect(await counterpartyChannel.getSettledBalanceOfCounterparty()).toBe(
        90n,
      );
    });

    it("should process coins expansion instruction", async () => {
      const coinbaseInstructions = await parseInstructions(
        await channel.craftVolumeExpandInstructions(100n, 50n, "0x0"),
        counterpartyChannel.client,
      );

      await counterpartyChannel.processInstructions(coinbaseInstructions, 0n);

      const expandInstructions = await parseInstructions(
        await channel.craftVolumeExpandInstructions(
          10n,
          0n,
          new CDTLC({
            deadline: 100n,
            flankkLog: typeToAddress[counterpartyChannel.client.chain.id].CDTLC,
            proof: zeroHash,
          }),
        ),
        counterpartyChannel.client,
      );

      await counterpartyChannel.processInstructions(expandInstructions, 150n);

      expect(counterpartyChannel.state().nonce).toBe(2n);
      expect(await counterpartyChannel.getSettledBalanceOfOwner()).toBe(50n);
      expect(await counterpartyChannel.getSettledBalanceOfCounterparty()).toBe(
        100n,
      );
      expect(await counterpartyChannel.getIncomingBalanceOfCounterparty()).toBe(
        10n,
      );
    });
  });
});
