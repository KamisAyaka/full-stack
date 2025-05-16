import {
  createWalletClient,
  custom,
  createPublicClient,
  parseEther,
  defineChain,
  formatEther,
} from "https://esm.sh/viem";
import { contractAddress, abi } from "./constants-js.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const ethAmountInput = document.getElementById("ethAmount");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
const getAddressToAmountFunded = document.getElementById(
  "getAddressToAmountFunded"
);
const inputAddress = document.getElementById("inputAddress");

let walletClient;
let publicClient;
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    await walletClient.requestAddresses();
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "Install Metamask";
  }
}
async function withdraw() {
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
  }
}

async function fund() {
  const ethAmount = ethAmountInput.value;
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
  } else {
    connectButton.innerHTML = "Install Metamask";
  }
}

async function getCurrentChain(client) {
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

async function getbalance() {
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

function GetAddressToAmountFunded() {
  console.log("Getting address to amount funded...");
  if (typeof window.ethereum !== "undefined") {
    publicClient = createPublicClient({
      transport: custom(window.ethereum),
    });
    const addressToAmountFunded = publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "getAddressToAmountFunded",
      args: [inputAddress.value],
    });
    console.log(`Funded Amount: ${formatEther(addressToAmountFunded)} ETH`);
  }
}

connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getbalance;
withdrawButton.onclick = withdraw;
getAddressToAmountFunded.onclick = GetAddressToAmountFunded;
