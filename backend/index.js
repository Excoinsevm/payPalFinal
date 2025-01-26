const express = require("express");
const { ethers } = require("ethers");
const app = express();
const cors = require("cors");
require("dotenv").config();
const ABI = require("./abi.json");

const port = 3001;

// Initialize the provider and the contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.SMART_CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, ABI, provider);

app.use(cors());
app.use(express.json());

function convertArrayToObjects(arr) {
  const dataArray = arr.map((transaction, index) => ({
    key: (arr.length + 1 - index).toString(),
    type: transaction[0],
    amount: transaction[1],
    message: transaction[2],
    address: `${transaction[3].slice(0, 4)}...${transaction[3].slice(-4)}`,
    subject: transaction[4],
  }));

  return dataArray.reverse();
}

app.get("/getNameAndBalance", async (req, res) => {
  try {
    const { userAddress } = req.query;

    if (!userAddress) {
      return res.status(400).json({ error: "userAddress is required" });
    }

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    // Call `getMyName` from the smart contract
    const name = await contract.getMyName(userAddress);

    // Get the native token balance
    const balance = await provider.getBalance(userAddress);
    const balanceInEth = ethers.formatEther(balance);

    // Call `getMyHistory` from the smart contract
    const history = await contract.getMyHistory(userAddress);
    const formattedHistory = convertArrayToObjects(history);

    // Call `getMyRequests` from the smart contract
    const requests = await contract.getMyRequests(userAddress);

    // Prepare and send the response
    const jsonResponse = {
      name,
      balance: balanceInEth,
      history: formattedHistory,
      requests,
    };

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error in /getNameAndBalance:", error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Listening for API calls on port ${port}`);
});
