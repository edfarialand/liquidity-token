const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const fs = require('fs');

// Load wallet data
const walletData = JSON.parse(fs.readFileSync('./mnemonicWallet.json'));
const publicKey = new PublicKey(walletData.publicKey);

// Connect to mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

async function checkBalance() {
  try {
    const balance = await connection.getBalance(publicKey);
    console.log('Wallet Address: ' + publicKey.toString());
    console.log('Balance: ' + (balance / 1000000000) + ' SOL (on mainnet)');
  } catch (e) {
    console.error('Error checking balance:', e);
  }
}

checkBalance();