import { parseAbiItem, parseAbiParameters } from "viem";

export const RecordStruct =
  "struct Record { uint240 user0Balance; uint240 user1Balance; }";

export const SettlementStruct =
  "struct Statement { Record from; Record to; address condition; bytes conditionParams; }";

export const STATEMENT_ID_ABI = parseAbiParameters([
  RecordStruct,
  SettlementStruct,
  "Statement statement, uint256 nonce",
]);

export const STATEMENTS_ABI = parseAbiParameters([
  RecordStruct,
  SettlementStruct,
  "Statement[] memory statement",
]);

export const FLANKK_CONDITION_ABI = [
  parseAbiItem([
    RecordStruct,
    SettlementStruct,
    "function validate(Statement memory statement, bytes memory source) external view returns (bool)",
  ]),
] as const;
