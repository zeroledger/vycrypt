import { isHex } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

import { encrypt, decrypt } from "../src/crypt";

describe("crypt", () => {
  const privKey = generatePrivateKey();
  const account = privateKeyToAccount(privKey);

  const hexData = `0xa5eaba8f6b292d059d9e8c3a2f1b16af`;
  const jsonData = JSON.stringify({
    data: {
      channelId:
        "0x9774d860afce7a5a58f0e9a7f23a705f434742352ec6f5dfa491b240494fa5bc",
      sync: {
        snap: '{"token":"0x25eC837C325C3f6c7D7772CD737CBca962329621","user0":"0xfdbF10719dDb9310768160d4a5a03EC5F848FD50","user1":"0xf2BbBe4Cb4070a40600c126a5c2f082369E300cB","domain":{"name":"Flankk","version":"0.0.5","chainId":11155420,"verifyingContract":"0x13D9589164E5De30c61588082279Cf93a5c5Dd23"},"user0SignedState":"0xa502cdd4defe8bcaeee6bc29aeae121ce86ff98a4362de473b021c347104caec34801ed00849d62a385900e5910409725d7549a61c5ae5439f6f56708121717a1c","user1SignedState":"0x35fd11f2686205565c36e392d63d362f48fd9de19f9d0e49be8d30423569c3a663ab9a211febdc767dc35c56cd6e9d6369dc18fd2dc55d756852e130cb48e6d31b","UTXOs":[{"id":"0x7ff86fb03e1c7e1a1e00ae7ea49e7387f9ccf2a099ac074eb96d331814ad85fe","from":{"user0Balance":"0x0","user1Balance":"0x2"},"to":{"user0Balance":"0x2","user1Balance":"0x0"},"conditionParams":{"params":{"deadline":"0x67a0d300","stealthUser":"0xe7CC95646D942CCb57D8aC531DFf97CaC221b45f"},"meta":{"multiplier":"0x9d46b26ddfbbf2aa36bbfd7e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000002102f9931d38f86643de2517aa5793be1d33c4f98995fa3c5d6133fd03e29e34c89200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003224721381dd8ef7209463b14628cb96402e4af44118eb745adffb4f76ad38dfd637aaca753348b3822f7deabcbc7d003343740000000000000000000000000000"},"abi":[{"name":"SSTLCParams","type":"tuple","components":[{"name":"stealthUser","type":"address"},{"name":"deadline","type":"uint256"}]}],"type":"SSTLC"},"condition":"0x743DDD0f1A2425b05C20C48e593ffa42C99A5532"},{"id":"0x9822d8b78732c929517a5366583aad6fe2e4d42ef217a753c72bdad1f8ac120b","from":{"user0Balance":"0x0","user1Balance":"0x2"},"to":{"user0Balance":"0x2","user1Balance":"0x0"},"conditionParams":{"params":{"deadline":"0xcf1d7952","stealthUser":"0xafBf23b2785fe66fFda7ce289cC13F8C05CB0093"},"meta":{"multiplier":"0x76ce82e4439148567862712b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000021032ae72292c294c97680f575859f3d2ae23ecaf76efded78c8308459cb8bb8b7f2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032b757fc9180311a554cf911bbe465771b9c55e2ebf092e5f48fc4b68d607b319420aa508e1dd656a9e1c241b696bd1f5843b10000000000000000000000000000"},"abi":[{"name":"SSTLCParams","type":"tuple","components":[{"name":"stealthUser","type":"address"},{"name":"deadline","type":"uint256"}]}],"type":"SSTLC"},"condition":"0x743DDD0f1A2425b05C20C48e593ffa42C99A5532"},{"id":"0x1a4692222d166a162e75068aa52e863716705230091b9ca5f31f7ad1fd5bfe4c","from":{"user0Balance":"0x0","user1Balance":"0x0"},"to":{"user0Balance":"0x2a53","user1Balance":"0x23c9"},"conditionParams":"0x0","condition":"0x0000000000000000000000000000000000000000"}],"nonce":"0x2d3","url":"http://proxy_0:3000"}',
        url: "http://proxy_1:3000",
      },
      transactions: [],
      nonce: "0x2d8",
      signedUpdateChannelTypeHash:
        "0xc741c4069ca24b757faedf544c25e311b45d81ef45377358bab5436bdb6a804567ea2ba74193c417399a2f41e729639bc44ddd041226b17b19a68c6eccef81ff1b",
    },
  });

  describe("encrypt", () => {
    it("should encrypt hex string", () => {
      expect(isHex(encrypt(hexData, account.publicKey))).toBeTruthy();
    });

    it("should encrypt json string", () => {
      expect(isHex(encrypt(jsonData, account.publicKey))).toBeTruthy();
    });
  });

  describe("decrypt", () => {
    it("should decrypt hex string", () => {
      const encryptedData = encrypt(hexData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(hexData);
    });

    it("should decrypt json string", () => {
      const encryptedData = encrypt(jsonData, account.publicKey);
      expect(decrypt(privKey, encryptedData)).toBe(jsonData);
    });
  });
});
