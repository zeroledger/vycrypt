import { Hash } from "viem";
import { Statement } from "./statement";

export type StoredStatement = ReturnType<Statement["serialize"]>;

export abstract class AbstractStatementsStore {
  abstract load(
    channelId: Hash,
    statementIds: Hash[],
  ): Promise<StoredStatement[]>;
  /**
   * @dev atomic
   */
  abstract remove(
    channelId: Hash,
    statementIds: Hash[],
    nonce: bigint,
  ): Promise<void>;
  /**
   * @dev atomic
   */
  abstract save(
    channelId: Hash,
    statements: Statement[],
    nonce: bigint,
  ): Promise<void>;

  /**
   * @description iterate throw all items and run function.
   * @param fn - function executed for each item. Iteration stops once function returns 'true'
   */
  abstract each(
    channelId: Hash,
    fn: (statement: StoredStatement) => Promise<boolean>,
  ): Promise<void>;

  abstract has(channelId: Hash, statementIds: Hash[]): Promise<boolean>;

  abstract nonce(channelId: Hash): Promise<bigint>;
}
