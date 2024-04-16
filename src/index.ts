import RaydiumSwap from "./RaydiumSwap";
import Moralis from "moralis";
import { SolNetwork } from "@moralisweb3/common-sol-utils";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import "dotenv/config";
import { swapConfig as config } from "./swapConfig"; // Import the configuration

/**
 * Performs a token swap on the Raydium protocol.
 * Depending on the configuration, it can execute the swap or simulate it.
 */
Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});

const network = SolNetwork.MAINNET;
// const network = SolNetwork.DEVNET;

let amountThreshold = 0,
  timer = -1;
const raydiumSwap = new RaydiumSwap(
  process.env.RPC_URL,
  process.env.WALLET_PRIVATE_KEY
);

const swap = async (swapConfig) => {
  /**
   * The RaydiumSwap instance for handling swaps.
   */
  console.log(`Raydium swap initialized`);
  console.log(
    `Swapping ${swapConfig.tokenAAmount} of ${swapConfig.tokenAAddress} for ${swapConfig.tokenBAddress}...`
  );

  /**
   * Load pool keys from the Raydium API to enable finding pool information.
   */
  await raydiumSwap.loadPoolKeys(swapConfig.liquidityFile);
  console.log(`Loaded pool keys`);

  /**
   * Find pool information for the given token pair.
   */
  const poolInfo = raydiumSwap.findPoolInfoForTokens(
    swapConfig.tokenAAddress,
    swapConfig.tokenBAddress
  );
  console.log("Found pool info");

  /**
   * Prepare the swap transaction with the given parameters.
   */
  const tx = await raydiumSwap.getSwapTransaction(
    swapConfig.tokenBAddress,
    swapConfig.tokenAAmount,
    poolInfo,
    swapConfig.maxLamports,
    swapConfig.useVersionedTransaction,
    swapConfig.direction
  );

  /**
   * Depending on the configuration, execute or simulate the swap.
   */
  if (swapConfig.executeSwap) {
    /**
     * Send the transaction to the network and log the transaction ID.
     */
    const txid = swapConfig.useVersionedTransaction
      ? await raydiumSwap.sendVersionedTransaction(
          tx as VersionedTransaction,
          swapConfig.maxRetries
        )
      : await raydiumSwap.sendLegacyTransaction(
          tx as Transaction,
          swapConfig.maxRetries
        );

    console.log(`https://solscan.io/tx/${txid}`);
  } else {
    /**
     * Simulate the transaction and log the result.
     */
    const simRes = swapConfig.useVersionedTransaction
      ? await raydiumSwap.simulateVersionedTransaction(
          tx as VersionedTransaction
        )
      : await raydiumSwap.simulateLegacyTransaction(tx as Transaction);

    console.log("Err", simRes);
  }
};

const fetchTokenPrice = async (tokenAddress) => {
  // const response1 = await Moralis.SolApi.token.getTokenPrice({
  //   address: tokenAddress,
  //   network,
  // });
  const response = await fetch(
    `https://price.jup.ag/v4/price?ids=${tokenAddress}`
  );
  const data: any = await response.json();
  // console.log(data);
  // Example: Log the price of a specific token in USD
  const tokenPriceInUSD = data.data[tokenAddress];
  console.log("price    ", tokenPriceInUSD);

  // return await response1.toJSON();
  return { usdPrice: tokenPriceInUSD.price };
};

const fetchSolAmount = async (address) => {
  const response = await Moralis.SolApi.account.getBalance({
    address,
    network,
  });
  return response.toJSON();
};

const getSPL = async (address) => {
  const response = await Moralis.SolApi.account.getSPL({
    address,
    network,
  });
  return response.toJSON();
};
//swap(config);

let avgAmount = 0;

// setInterval(async () => {
//   timer++;

//   if (timer % 10 == 0 && timer > 0) {
//     const spls = await getSPL(raydiumSwap.getWalletPublicKey());
//     console.log(spls);

//     const currentTokenAmount = spls.map((splToken) => {
//       return splToken.mint == process.env.TOKEN_MINT && splToken.amount;
//     });
//     console.log(currentTokenAmount);

//     const solCurrentAmount = await fetchSolAmount(
//       raydiumSwap.getWalletPublicKey()
//     );
//     console.log(solCurrentAmount);

//     if (avgAmount / 10 < amountThreshold) {
//       // Sell
//     } else {
//       // Buy
//     }
//     amountThreshold = avgAmount / 10;
//     avgAmount = 0;
//     timer = -1;
//   } else {
//     const solPrice = await fetchTokenPrice(
//       "So11111111111111111111111111111111111111112"
//     );

//     const tokenPrice = await fetchTokenPrice(process.env.TOKEN_MINT);

//     if (amountThreshold == 0)
//       amountThreshold = solPrice.usdPrice / tokenPrice.usdPrice;

//     avgAmount += solPrice.usdPrice / tokenPrice.usdPrice;
//     console.log(
//       solPrice.usdPrice,
//       "     ",
//       tokenPrice.usdPrice,
//       "    ",
//       amountThreshold,
//       "     ",
//       avgAmount
//     );
//   }
// }, 3000);

const main = async () => {
  const res = await raydiumSwap.loadPoolKeys(config.liquidityFile);
  console.log(res);
  // console.log(process.env.TOKEN_MINT);
  // console.log(
  //   await raydiumSwap.findPoolInfoForTokens(
  //     config.tokenAAddress,
  //     process.env.TOKEN_MINT
  //   )
  // );
};

main();
