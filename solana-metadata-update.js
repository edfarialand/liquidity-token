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
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // Load saved keys from previous token creation
    if (!fs.existsSync('./token-keys.json')) {
      console.error("Error: token-keys.json not found. Please run solana-token.js first to create the token.");
      return;
    }
    
    const keyData = JSON.parse(fs.readFileSync('./token-keys.json'));
    
    // Reconstruct the keypair from the saved secret key
    const payerSecretKey = new Uint8Array(keyData.payerSecretKey);
    const payer = Keypair.fromSecretKey(payerSecretKey);
    
    const tokenAddress = new PublicKey(keyData.tokenAddress);
    const metadataPDA = new PublicKey(keyData.metadataPDA);
    
    console.log(`Token Address: ${tokenAddress.toString()}`);
    console.log(`Metadata PDA: ${metadataPDA.toString()}`);
    
    // Prompt for the new permanent URI for token metadata
    const permanentUri = process.argv[2];
    if (!permanentUri) {
      console.error("Error: Please provide the permanent metadata URI as a command line argument.");
      console.log("Usage: node solana-metadata-update.js <PERMANENT_METADATA_URI>");
      console.log("Example: node solana-metadata-update.js https://arweave.net/abc123");
      return;
    }
    
    console.log(`Updating metadata URI to: ${permanentUri}`);
    
    // Create update metadata instruction
    const updateMetadataInstruction = new UpdateMetadataV2(
      { feePayer: payer.publicKey },
      {
        metadata: metadataPDA,
        updateAuthority: payer.publicKey,
        metadataData: {
          name: "Lokquidity",
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