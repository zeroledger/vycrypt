import {
  toHex,
  type Hex,
  type Address,
  type Hash,
  recoverPublicKey,
} from "viem";

import {
  type FlankkDomain,
  type Client,
  type Instructions,
  type SerializedAddInstruction,
  type SerializedDisposeInstruction,
} from "./channel.types";

import { CDTLC, type ConditionParams } from "./conditions";

import {
  signChannelOpening,
  signChannelFunding,
  signUpdateChannel,
  verifyStateSnapSignature,
  computeChannelId,
  signSettlement,
  signPermit,
  getStateSnapMsgHash,
  signCollaborativeWithdraw,
} from "./utils";
import { State } from "./state";
import { Rec, Statement } from "./statement";

export type ChannelBackup = {
  token: Address;
  user0: Address;
  user1: Address;
  domain: FlankkDomain;
  user0SignedState?: Hex;
  user1SignedState?: Hex;
  url?: string;
  settlementEndTime?: Hex;
};

export class Channel {
  public readonly id: Hex;

  private _state?: State;

  /**
   *
   * @param token - [erc20](https://eips.ethereum.org/EIPS/eip-20) with [eip-2612](https://eips.ethereum.org/EIPS/eip-2612) extension
   * @param domain - Flankk contract domain object
   * @param user0 - the first channel user (usually initiates channel opening)
   * @param user1 - the second channel user (usually handles onchain activity)
   * @param client - viem Client
   * @param user0SignedState - user0 signed UpdateChannelTypedHash (state), optional
   * @param user1SignedState - user1 signed UpdateChannelTypedHash (state), optional
   * @param url - counterparty URL, optional
   * @param settlementEndTime - channel settlement time, optional
   */
  constructor(
    public readonly token: Address,
    public readonly domain: FlankkDomain,
    public readonly user0: Address,
    public readonly user1: Address,
    public readonly client: Client,
    private user0SignedState?: Hex,
    private user1SignedState?: Hex,
    public url?: string,
    public settlementEndTime?: Hex,
  ) {
    this.id = computeChannelId(this.token, this.user0, this.user1, this.domain);
  }

  static async of(
    data: string | ChannelBackup,
    client: Client,
    trusted = false,
  ) {
    const backup: ChannelBackup =
      typeof data === "string" ? JSON.parse(data) : data;

    const accountAddress = client.account.address;

    if (accountAddress !== backup.user0 && accountAddress !== backup.user1) {
      throw new Error(
        `WRONG_OWNER ${backup.user0} ${backup.user1} ${accountAddress}`,
      );
    }

    if (client.chain.id !== backup.domain.chainId) {
      throw new Error(
        `WRONG_CHAIN ${backup.domain.chainId} ${client.chain.id}`,
      );
    }

    const channel = new Channel(
      backup.token,
      backup.domain,
      backup.user0,
      backup.user1,
      client,
      backup.user0SignedState,
      backup.user1SignedState,
      backup.url,
      backup.settlementEndTime,
    );

    if (!trusted) {
      await channel.validateChannelIntegrity();
    }

    return channel;
  }

  attach(state: State) {
    this._state = state;

    return this;
  }

  state() {
    if (!this._state) {
      throw new Error("State unassigned");
    }
    return this._state;
  }

  isFullNode() {
    return !!this.url;
  }

  isOpen() {
    const signatures = this.signedUpdateChannelTypedHashes();
    return Boolean(
      this.state().nonce > 0n && signatures.owner && signatures.counterparty,
    );
  }

  private accountAddress() {
    return this.client.account.address;
  }

  counterparty() {
    if (this.accountAddress() === this.user0) {
      return this.user1;
    }
    return this.user0;
  }

  owner() {
    if (this.accountAddress() === this.user0) {
      return this.user0;
    }
    return this.user1;
  }

  private _getSignedStateKeys() {
    if (this.accountAddress() === this.user0) {
      return {
        owner: "user0SignedState",
        counterparty: "user1SignedState",
      } as const;
    }
    return {
      owner: "user1SignedState",
      counterparty: "user0SignedState",
    } as const;
  }

  signedUpdateChannelTypedHashes(): {
    owner?: Address;
    counterparty?: Address;
  } {
    const { owner, counterparty } = this._getSignedStateKeys();
    return {
      owner: this[owner],
      counterparty: this[counterparty],
    };
  }

  signedUpdateChannelTypedHash() {
    return this.signedUpdateChannelTypedHashes().owner;
  }

  counterpartySignedUpdateTypeHash() {
    return this.signedUpdateChannelTypedHashes().counterparty;
  }

  async validateChannelIntegrity() {
    if (
      !(await verifyStateSnapSignature(
        this.counterparty(),
        this.id,
        this.state().stateHash,
        this.domain,
        this.counterpartySignedUpdateTypeHash()!,
      ))
    ) {
      throw new Error("INVALID_USER0_SIGNATURE");
    }
    if (
      !(await verifyStateSnapSignature(
        this.owner(),
        this.id,
        this.state().stateHash,
        this.domain,
        this.signedUpdateChannelTypedHash()!,
      ))
    ) {
      throw new Error("INVALID_USER1_SIGNATURE");
    }
  }

  async validateAndAdd(counterpartySignedUpdateChannelTypeHash: Hex) {
    const isValidSnap = await verifyStateSnapSignature(
      this.counterparty(),
      this.id,
      this.state().stateHash,
      this.domain,
      counterpartySignedUpdateChannelTypeHash,
    );

    if (!isValidSnap) {
      throw new Error(
        "Channel:validateAndAdd: invalid state commitment from counterparty",
      );
    }

    const { counterparty } = this._getSignedStateKeys();

    this[counterparty] = counterpartySignedUpdateChannelTypeHash;
  }

  async recoverCounterpartyPublicKey() {
    return recoverPublicKey({
      hash: getStateSnapMsgHash(this.id, this.state().stateHash, this.domain),
      signature: this.counterpartySignedUpdateTypeHash()!,
    });
  }

  async signSettlementTypeHash() {
    return signSettlement(
      this.client,
      this.id!,
      this.state().stateHash,
      this.domain,
    );
  }

  async signCollaborativeWithdrawTypeHash(deadline: bigint) {
    const { user0Balance, user1Balance } = this.state().getSettledBalances();
    return signCollaborativeWithdraw(
      this.client,
      this.id!,
      this.state().stateHash,
      this.domain,
      user0Balance,
      user1Balance,
      deadline,
    );
  }

  async signUpdateTypeHash() {
    const { owner } = this._getSignedStateKeys();
    this[owner] = await signUpdateChannel(
      this.client,
      this.id!,
      this.state().stateHash,
      this.domain,
    );
  }

  async getOpenChannelOp(nodeType: boolean = false) {
    const deposit = this.getSettledBalanceOfOwner();
    const deadline = (await this.client.getBlock()).timestamp + 4200n;

    const ownerPermit = await signPermit({
      contractAddress: this.token,
      spenderAddress: this.domain.verifyingContract,
      value: deposit,
      client: this.client,
      deadline,
    });

    return {
      owner: this.accountAddress(),
      openSignature: await signChannelOpening(
        this.client,
        this.id,
        ownerPermit,
        this.domain,
        nodeType,
      ),
      permit: ownerPermit,
      value: toHex(deposit),
      deadline: toHex(deadline),
      nodeType,
    };
  }

  async getUserFundingOp(deposit: bigint) {
    const deadline = (await this.client.getBlock()).timestamp + 4200n;

    const ownerPermit = await signPermit({
      contractAddress: this.token,
      spenderAddress: this.domain.verifyingContract,
      value: deposit,
      client: this.client,
      deadline,
    });

    return {
      owner: this.accountAddress(),
      fundSignature: await signChannelFunding(
        this.client,
        this.id,
        ownerPermit,
        this.domain,
      ),
      permit: ownerPermit,
      value: toHex(deposit),
      deadline: toHex(deadline),
    };
  }

  balanceKeys() {
    return this.accountAddress() === this.user0
      ? (["user0Balance", "user1Balance"] as const)
      : (["user1Balance", "user0Balance"] as const);
  }

  ownerBalanceKey() {
    return this.balanceKeys()[0];
  }

  counterpartyBalanceKey() {
    return this.balanceKeys()[1];
  }

  getSettledBalanceOfOwner() {
    return this.state().getSettledBalances()[this.ownerBalanceKey()];
  }

  getSettledBalanceOfCounterparty() {
    return this.state().getSettledBalances()[this.counterpartyBalanceKey()];
  }

  getIncomingBalanceOfOwner() {
    return this.state().getPendingBalances()[this.ownerBalanceKey()];
  }

  getIncomingBalanceOfCounterparty() {
    return this.state().getPendingBalances()[this.counterpartyBalanceKey()];
  }

  getSendingOwnerAmount() {
    return this.getIncomingBalanceOfCounterparty();
  }

  getSendingCounterpartyAmount() {
    return this.getIncomingBalanceOfOwner();
  }

  get snapShot() {
    const backup: ChannelBackup = {
      token: this.token,
      user0: this.user0,
      user1: this.user1,
      domain: this.domain,
      user0SignedState: this.user0SignedState,
      user1SignedState: this.user1SignedState,
      url: this.url,
      settlementEndTime: this.settlementEndTime,
    };
    return JSON.stringify(backup);
  }

  coinbaseInstruction(): SerializedAddInstruction | undefined {
    const nonce = this.state().nonce;
    if (nonce > 1n || nonce === 0n) {
      return;
    }
    return {
      op: "ADD",
      value: this.state().statements()[0].serialize(),
    };
  }

  private convertToUserBalances(
    ownerBalance: bigint,
    counterpartyBalance: bigint,
  ) {
    if (this.accountAddress() === this.user0) {
      return [ownerBalance, counterpartyBalance] as const;
    }
    return [counterpartyBalance, ownerBalance] as const;
  }

  craftVolumeExpandInstructions(
    ownerAddBalance: bigint,
    counterpartyAddBalance: bigint,
    conditionParams: "0x0" | CDTLC,
  ) {
    const op = this.state().add(
      new Statement(
        new Rec(0n, 0n),
        new Rec(
          ...this.convertToUserBalances(
            ownerAddBalance,
            counterpartyAddBalance,
          ),
        ),
        conditionParams,
        this.client,
        this.state().nonce,
      ),
      true,
    );
    return [op];
  }

  async craftTransferInstructions(
    amount: bigint,
    conditionParams: ConditionParams = "0x0",
    sources: Record<Hash, Hex> = {},
  ) {
    if (this.getSettledBalanceOfOwner() - amount < 0n) {
      throw new Error("BALANCE_IS_NOT_ENOUGH");
    }
    const instructions = await this.state().consolidate(sources, this.client);
    if (amount === 0n) {
      this.state().recompute();
      return instructions;
    }

    const sts = this.state().statements();
    const consolidatedStatement = sts[sts.length - 1];
    // no need verify coinbase disposing
    instructions.push(this.state().dispose(consolidatedStatement));

    const [ownerBk, counterpartyBk] = this.balanceKeys();

    // conditional transfer
    instructions.push(
      this.state().add(
        new Statement(
          new Rec(0n, 0n),
          new Rec(
            ...this.convertToUserBalances(
              consolidatedStatement.to[ownerBk] - amount,
              consolidatedStatement.to[counterpartyBk],
            ),
          ),
          "0x0",
          this.client,
          this.state().nonce,
        ),
      ),
      this.state().add(
        new Statement(
          new Rec(...this.convertToUserBalances(amount, 0n)),
          new Rec(...this.convertToUserBalances(0n, amount)),
          conditionParams,
          this.client,
          this.state().nonce,
        ),
      ),
    );
    this.state().recompute();
    return instructions;
  }

  /**
   * @dev instructions validation should happened before processing
   * @param instructions
   * @param onchainTotalBalance
   */
  async processInstructions(
    instructions: Instructions,
    onchainTotalBalance: bigint,
  ) {
    const state = this.state();
    const coinbaseMode = state.nonce === 0n;

    if (
      coinbaseMode &&
      (instructions.length > 1 ||
        instructions[0].op === "DISPOSE" ||
        !instructions[0].value.isUnconditionalVolumeExpand())
    ) {
      throw new Error("INVALID_COINBASE_INSTRUCTION");
    }

    let channelVolumeExpanded = false;

    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (instruction.op === "DISPOSE") {
        const { value: statement } = instruction;
        state.dispose(statement!);
      }
      if (instruction.op === "ADD") {
        const { value: statement } = instruction;
        /**
         * Processing 'expansion' statement with CDTLC should happen before onchain deposit transaction get settled.
         * This will create inconsistency between state.getTotalBalance() and onchainTotalBalance by design.
         * That means any next call of processInstructions will fail until 'expansion' statement disposed.
         */
        channelVolumeExpanded = statement.isCDTLC();

        if (
          statement.from[this.ownerBalanceKey()] >
          statement.to[this.ownerBalanceKey()]
        ) {
          throw new Error("NEGATIVE_VALUE_TRANSFER");
        }

        state.add(statement!);
      }
    }

    if (
      !channelVolumeExpanded &&
      !coinbaseMode &&
      onchainTotalBalance < state.getTotalBalance()
    ) {
      throw new Error("INCONSISTENT_TOTAL_BALANCES");
    }

    /**
     * Prevents having two 'pending' channel volume expansion
     */
    if (
      channelVolumeExpanded &&
      onchainTotalBalance >= state.getTotalBalance()
    ) {
      throw new Error("INCONSISTENT_TOTAL_BALANCES_AFTER_EXPANSION");
    }
    state.recompute();
  }

  async getInstructionStatement(
    instruction: SerializedAddInstruction | SerializedDisposeInstruction,
  ) {
    const { error, statement } = await Statement.of(
      instruction.value,
      this.client,
    );
    if (error) {
      throw new Error(error);
    }

    return statement!;
  }
}
