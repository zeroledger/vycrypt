import {
  Address,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  toHex,
} from "viem";
import {
  Client,
  FlankkDomain,
  Instructions,
  SerializedInstructions,
} from "../channel.types";
import { Statement } from "../statement";

const eip712TypeHashAbi = parseAbiParameters(
  "bytes32 EIP712TYPE_HASH,bytes32 contractNameHash,bytes32 contractVersionHash,uint256 chainId,address verifyingContract",
);
const eip712Perfix = keccak256(
  toHex(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
  ),
);
const channelIdAbi = parseAbiParameters(
  "address token,address user0,address user1,bytes32 domainSeparator",
);

export const computeChannelId = (
  token: Address,
  user0: Address,
  user1: Address,
  domain: FlankkDomain,
) => {
  const domainSeparator = keccak256(
    encodeAbiParameters(eip712TypeHashAbi, [
      eip712Perfix,
      keccak256(toHex(domain.name)),
      keccak256(toHex(domain.version)),
      BigInt(domain.chainId),
      domain.verifyingContract,
    ]),
  );
  return keccak256(
    encodeAbiParameters(channelIdAbi, [token, user0, user1, domainSeparator]),
  );
};

export const parseInstructions = async (
  serializedInstructions: SerializedInstructions,
  client: Client,
) => {
  return await Promise.all(
    serializedInstructions.map(async (instruction) => {
      const { error, statement } = await Statement.of(
        instruction.value,
        client,
      );
      if (error) {
        throw new Error(error);
      }

      return {
        ...instruction,
        value: statement!,
      };
    }),
  );
};

export const validateTimeouts = (
  instructions: Instructions,
  maxTimeout = 2_592_000n,
) => {
  return instructions.every((instruction) => {
    if (
      instruction.op === "ADD" &&
      instruction.value.conditionParams !== "0x0"
    ) {
      const delta =
        instruction.value.conditionParams.params.deadline -
        BigInt(Math.ceil(Date.now() / 1000));
      return delta < maxTimeout;
    }
    return true;
  });
};
