// Update Solana Token Metadata
const { Keypair, Connection, clusterApiUrl, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { 
  Metadata, 
  MetadataProgram, 
  UpdateMetadataV2
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

async function updateTokenMetadata() {
  console.log("Updating LOKQ token metadata with permanent storage URLs...");
  
  try {
    // Connect to cluster (devnet for testing)
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

    // Define the path to your project's token configuration file
    const projectConfigPath = './project-token-config.json'; // Assumes this file is in the same directory as the script
    
    if (!fs.existsSync(projectConfigPath)) {
      console.error(`Error: Project token config file not found at ${projectConfigPath}.`);
      console.error("Please create this file with payerKeyPath, tokenAddress, metadataPDA, and jsonMetadataUri.");
      return;
    }
    
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'));

    if (!fs.existsSync(projectConfig.payerKeyPath)) {
      console.error(`Error: Payer keypair file not found at ${projectConfig.payerKeyPath} (specified in ${projectConfigPath}).`);
      return;
    }

    // Load the payer's secret key (this file should be an array of numbers)
    const payerSecretKeyArray = JSON.parse(fs.readFileSync(projectConfig.payerKeyPath, 'utf-8'));
    const payerSecretKey = new Uint8Array(payerSecretKeyArray);
    const payer = Keypair.fromSecretKey(payerSecretKey);
    console.log(`Using payer wallet: ${payer.publicKey.toString()}`);
    
    const tokenAddress = new PublicKey(projectConfig.tokenAddress);
    const metadataPDA = new PublicKey(projectConfig.metadataPDA);
    const permanentUri = projectConfig.jsonMetadataUri; // Use URI from config
    
    console.log(`Token Address: ${tokenAddress.toString()}`);
    console.log(`Metadata PDA: ${metadataPDA.toString()}`);
    
    // --- Define Metadata URI ---
    // The JSON metadata URI is now read from project-token-config.json
    console.log(`Using metadata URI from config: ${permanentUri}`);

    // Load the off-chain JSON metadata to get creator details for on-chain metadata
    // This assumes your solana-token.js is accessible or its content is reflected in permanentUri
    // For simplicity, we'll use the creator from your example solana-token.js
    // In a real scenario, you might fetch and parse permanentUri if it's different or dynamic
    
    // Create update metadata instruction
    const updateMetadataInstruction = new UpdateMetadataV2(
      { feePayer: payer.publicKey },
      {
        metadata: metadataPDA,
        updateAuthority: payer.publicKey,
        metadataData: {
          name: "Lokquidity - Mint Authority Revoked, Liquidity Locked",
          symbol: "LOKQ",
          uri: permanentUri,
          sellerFeeBasisPoints: 0,
          creators: [ // Match this with your solana-token.js content
            {
              address: new PublicKey("13xZVeQA95PgGC4dyy8T6rprjQyzzehFm2udfPLP2HGa"), // This is your new wallet
              verified: payer.publicKey.toString() === "13xZVeQA95PgGC4dyy8T6rprjQyzzehFm2udfPLP2HGa", // True if payer is this creator
              share: 100
            }
          ],
          collection: null,
          uses: null
        },
        newUpdateAuthority: payer.publicKey,
        primarySaleHappened: false,
        isMutable: false // Set to false for final, immutable metadata on mainnet
      }
    );
    
    // Create and send transaction
    const transaction = new Transaction().add(updateMetadataInstruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    
    console.log("Metadata update successful!");
    console.log(`Transaction signature: ${signature}`);
    console.log(`Token will now display with metadata from: ${permanentUri}`);
    
  } catch (error) {
    console.error("Error updating token metadata:", error);
  }
}

updateTokenMetadata();