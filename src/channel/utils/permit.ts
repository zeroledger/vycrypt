import { type Hex } from "viem";
import { ERC_20_PERMIT_ABI } from "../channel.constants";
import { Client } from "../channel.types";

export type SignPermitProps = {
  /** Address of the token to approve */
  contractAddress: Hex;
  /** Address to grant allowance to */
  spenderAddress: Hex;
  /** Expiration of this approval, in SECONDS */
  deadline: bigint;
  /** Defaults to 1. Some tokens need a different version, check the [PERMIT INFORMATION](https://github.com/vacekj/wagmi-permit/blob/main/PERMIT.md) for more information */
  permitVersion?: string;
};

export type Eip2612Props = SignPermitProps & {
  /** Amount to approve */
  value: bigint;
  client: Client;
};

const types = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

/**
 * Signs a permit for a given ERC-2612 ERC20 token using the specified parameters.
 */
export async function signPermit({
  contractAddress,
  spenderAddress,
  value,
  deadline,
  permitVersion,
  client,
}: Eip2612Props) {
  const contractConf = {
    address: contractAddress,
    abi: ERC_20_PERMIT_ABI,
  };

  const data = await client.multicall({
    contracts: [
      {
        ...contractConf,
        functionName: "name",
      },
      {
        ...contractConf,
        functionName: "nonces",
        args: [client.account.address],
      },
    ],
  });

  const erc20Name = data[0].result;
  const nonce = data[1].result;

  const domainData = {
    name: erc20Name,
    /** We assume 1 if permit version is not specified */
    version: permitVersion ?? "1",
    chainId: client.chain.id,
    verifyingContract: contractAddress,
  };

  const message = {
    owner: client.account.address,
    spender: spenderAddress,
    value,
    nonce,
    deadline,
  };

  return client.signTypedData({
    message,
    domain: domainData,
    primaryType: "Permit",
    types,
  });
}
