"use client";

import { InputForm } from "./ui/InputField";
import { useMemo, useState, useEffect } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal } from "@/utils";
export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState(() => {
    return localStorage.getItem("tokenAddress") || "";
  });
  const [recipientAddress, setRecipientAddress] = useState(() => {
    return localStorage.getItem("recipientAddress") || "";
  });
  const [amounts, setAmount] = useState(() => {
    return localStorage.getItem("amounts") || "";
  });
  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const total: number = useMemo(() => calculateTotal(amounts), [amounts]);
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false); // 新增 loading 状态
  const [tokenName, setTokenName] = useState<string>(""); // 存储代币名称
  const { totalWeiStr, totalTokensStr } = useMemo(() => {
    if (!total) {
      return { totalWeiStr: "0", totalTokensStr: "0" };
    }

    const totalWei = BigInt(Math.floor(total)); // 防止浮点数问题
    const totalTokens = Number(totalWei) / 1e18; // 转为浮点数

    return {
      totalWeiStr: totalWei.toString(),
      totalTokensStr: totalTokens.toFixed(6), // 保留6位小数
    };
  }, [total]);

  useEffect(() => {
    localStorage.setItem("tokenAddress", tokenAddress);
  }, [tokenAddress]);

  useEffect(() => {
    localStorage.setItem("recipientAddress", recipientAddress);
  }, [recipientAddress]);

  useEffect(() => {
    localStorage.setItem("amounts", amounts);
  }, [amounts]);
  useEffect(() => {
    const fetchTokenName = async () => {
      if (!tokenAddress) {
        setTokenName("");
        return;
      }

      try {
        const name = await readContract(config, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "name",
        });
        setTokenName(name as string);
      } catch (error) {
        console.error("Failed to fetch token name", error);
        setTokenName("Unknown");
      }
    };

    fetchTokenName();
  }, [tokenAddress, config]);

  async function getApprovedAmount(
    tSenderAddress: string | null
  ): Promise<number> {
    if (!tSenderAddress) {
      alert(
        "no tSender address found for this chain, Please check your chainId"
      );
      return 0;
    }
    const response = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [account.address, tSenderAddress as `0x${string}`],
    });
    return response as number;
  }
  async function handleSubmit() {
    setIsLoading(true); // 开始加载
    try {
      const tSenderAddress = chainsToTSender[chainId].tsender;
      const approvedAmount = await getApprovedAmount(tSenderAddress);

      if (approvedAmount < total) {
        const approvalHash = await writeContractAsync({
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "approve",
          args: [tSenderAddress as `0x${string}`, BigInt(total)],
        });
        const approvalReceipt = await waitForTransactionReceipt(config, {
          hash: approvalHash,
        });
        console.log("Approval receipt:", approvalReceipt);

        await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress as `0x${string}`,
          functionName: "airdropERC20",
          args: [
            tokenAddress,
            // Comma or new line separated
            recipientAddress
              .split(/[,\n]+/)
              .map((addr) => addr.trim())
              .filter((addr) => addr !== ""),
            amounts
              .split(/[,\n]+/)
              .map((amt) => amt.trim())
              .filter((amt) => amt !== ""),
            BigInt(total),
          ],
        });
      } else {
        await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress as `0x${string}`,
          functionName: "airdropERC20",
          args: [
            tokenAddress,
            // Comma or new line separated
            recipientAddress
              .split(/[,\n]+/)
              .map((addr) => addr.trim())
              .filter((addr) => addr !== ""),
            amounts
              .split(/[,\n]+/)
              .map((amt) => amt.trim())
              .filter((amt) => amt !== ""),
            BigInt(total),
          ],
        });
      }
    } catch (error) {
      console.error("Transaction failed", error);
    } finally {
      setIsLoading(false); // 结束加载
    }
  }
  return (
    <div className="w-full max-w-full">
      <InputForm
        label="Token Address"
        placeholder="0x..."
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <InputForm
        label="Recipient Address"
        placeholder="0x...,0x..."
        value={recipientAddress}
        onChange={(e) => setRecipientAddress(e.target.value)}
        large={true}
      />
      <InputForm
        label="Amount"
        placeholder="100...,200..."
        value={amounts}
        onChange={(e) => setAmount(e.target.value)}
        large={true}
      />
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Token Name:</span>
          <span>{tokenName || "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Total Amount (wei):</span>
          <span>{totalWeiStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">
            Total Tokens (1e18 wei = 1 token):
          </span>
          <span>{totalTokensStr}</span>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 mr-2 absolute right-3 top-1/2 transform -translate-y-1/2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          "send airdrop"
        )}
      </button>
    </div>
  );
}
