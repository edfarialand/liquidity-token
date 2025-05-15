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
    
    // Load saved keys from previous token creation
    if (!fs.existsSync('./id.json')) {
      console.error("Error: token-keys.json not found. Please run solana-token.js first to create the token.");
      return;
    }
    
    const keyData = JSON.parse(fs.readFileSync('./id.json'));
    
    // Reconstruct the keypair from the saved secret key
    const payerSecretKey = new Uint8Array(keyData.payerSecretKey);
    const payer = Keypair.fromSecretKey(payerSecretKey);
    
    const tokenAddress = new PublicKey(keyData.tokenAddress);
    const metadataPDA = new PublicKey(keyData.metadataPDA);
    
    console.log(`Token Address: ${tokenAddress.toString()}`);
    console.log(`Metadata PDA: ${metadataPDA.toString()}`);
    
    // --- Define Metadata URI ---
    // The new JSON metadata URI is hardcoded here.
    const permanentUri = "https://arweave.net/-Jzxp64F3K2-K2hOpW9VqU3Vk8jodJCN2l4wcyW-8UY";
    console.log(`Using hardcoded permanent metadata URI: ${permanentUri}`);

    
    console.log(`Updating metadata URI to: ${permanentUri}`);
    
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
          creators: null,
          collection: null,
          uses: null
        },
        newUpdateAuthority: payer.publicKey,
        primarySaleHappened: false,
        isMutable: true
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