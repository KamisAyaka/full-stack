"use client";

import { InputForm } from "./ui/InputField";
import { useMemo, useState } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal } from "@/utils";
export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amounts, setAmount] = useState("");
  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const total: number = useMemo(() => calculateTotal(amounts), [amounts]);
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false); // 新增 loading 状态

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
    <div>
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
