import {
    createWalletClient,
    custom,
    createPublicClient,
    parseEther,
    defineChain,
    formatEther,
    WalletClient,
    PublicClient,
  } from "viem";
  import "viem/window";
  import { contractAddress, abi } from "./constants-ts";
  
  // 假设 DOM 元素是 HTMLButtonElement 或 HTMLInputElement
  const connectButton = document.getElementById("connectButton") as HTMLButtonElement | null;
  const fundButton = document.getElementById("fundButton") as HTMLButtonElement | null;
  const ethAmountInput = document.getElementById("ethAmount") as HTMLInputElement | null;
  const balanceButton = document.getElementById("balanceButton") as HTMLButtonElement | null;
  const withdrawButton = document.getElementById("withdrawButton") as HTMLButtonElement | null;
  
  console.log("Hello World");

  let walletClient: WalletClient;
  let publicClient: PublicClient;
  
  async function connect(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });
      await walletClient.requestAddresses();
      connectButton!.innerHTML = "Connected!";
    } else {
      connectButton!.innerHTML = "Install Metamask";
    }
  }
  
  async function withdraw(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });
      const [connectedAccount] = await walletClient.requestAddresses();
  
      const currentChain = await getCurrentChain(walletClient);
  
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
  
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: abi,
        functionName: "withdraw",
        account: connectedAccount,
        chain: currentChain,
      });
  
      const hash = await walletClient.writeContract(request);
      console.log(`Transaction Hash: ${hash}`);
    }
  }
  
  async function fund(): Promise<void> {
    const ethAmount = ethAmountInput?.value ?? "";
    console.log(`Funding with ${ethAmount}...`);
  
    if (typeof window.ethereum !== "undefined") {
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });
  
      const [connectedAccount] = await walletClient.requestAddresses();
      const currentChain = await getCurrentChain(walletClient);
  
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
  
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: abi,
        functionName: "fund",
        account: connectedAccount,
        chain: currentChain,
        value: parseEther(ethAmount),
      });
  
      const hash = await walletClient.writeContract(request);
      console.log(`Transaction Hash: ${hash}`);
    } else {
      connectButton!.innerHTML = "Install Metamask";
    }
  }
  
  async function getCurrentChain(client: any): Promise<any> {
    const chainId = await client.getChainId();
    const currentChain = defineChain({
      id: chainId,
      name: "Custom Chain",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["http://localhost:8545"],
        },
      },
    });
    return currentChain;
  }
  
  async function getbalance(): Promise<void> {
    console.log("Getting balance...");
    if (typeof window.ethereum !== "undefined") {
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
  
      const balance = await publicClient.getBalance({
        address: contractAddress,
      });
  
      console.log(formatEther(balance));
    }
  }
  
  connectButton!.onclick = connect;
  fundButton!.onclick = fund;
  balanceButton!.onclick = getbalance;
  withdrawButton!.onclick = withdraw;