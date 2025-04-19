// Solana Token Creation Script - LOKQ (Lokquidity) with Metaplex Metadata
const { Keypair, Connection, clusterApiUrl, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { 
  Metadata, 
  MetadataProgram, 
  CreateMetadataV2, 
  DataV2 
} = require('@metaplex-foundation/mpl-token-metadata');
const { Buffer } = require('buffer');
const fs = require('fs');

async function createToken() {
  // Connect to cluster
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Generate a new wallet keypair
  const payer = Keypair.generate();
  
  // Request airdrop for wallet
  console.log("Requesting airdrop to creator wallet...");
  const airdropSignature = await connection.requestAirdrop(
    payer.publicKey,
    2 * 1000000000 // 2 SOL
  );
  
  await connection.confirmTransaction(airdropSignature);
  console.log("Airdrop received!");
  
  // Create token with specified properties using Token-2022 program
  console.log("Creating token LOKQ (Lokquidity - mint auth revo - locked liquid)...");
  
  const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
  
  const mintKeypair = Keypair.generate();
  
  // Create mint account
  const createMintAccountInstruction = await Token.createMintToInstruction(
    connection,
    payer.publicKey,
    mintKeypair.publicKey,
    payer.publicKey, // Mint authority 
    null, // Freeze authority (none)
    9, // Decimals
    TOKEN_2022_PROGRAM_ID
  );
  
  const transaction = new Transaction().add(createMintAccountInstruction);
  await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair]);
  
  const tokenMint = new Token(
    connection,
    mintKeypair.publicKey,
    TOKEN_2022_PROGRAM_ID,
    payer
  );
  
  console.log("Token created successfully!");
  console.log(`Token address: ${tokenMint.publicKey.toString()}`);
  
  // Create associated token account
  const tokenAccount = await tokenMint.getOrCreateAssociatedAccountInfo(
    payer.publicKey
  );
  console.log(`Token account: ${tokenAccount.address.toString()}`);
  
  // Mint tokens
  const amount = 1000000000; // 1 billion tokens with 9 decimals
  await tokenMint.mintTo(
    tokenAccount.address,
    payer.publicKey,
    [],
    amount * (10 ** 9)
  );
  console.log(`Minted ${amount} LOKQ tokens to ${tokenAccount.address.toString()}`);
  
  // Create Metaplex Metadata
  console.log("Creating token metadata...");
  
  // Metadata for the token - using GitHub repo URL for metadata
  const tokenMetadata = {
    name: "Lokquidity",
    symbol: "LOKQ",
    uri: "https://raw.githubusercontent.com/edfarialand/liquidity-token/main/token-metadata.json", // Updated metadata URL from our repo
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  };
  
  // Convert to DataV2 format
  const dataV2 = new DataV2({
    name: tokenMetadata.name,
    symbol: tokenMetadata.symbol,
    uri: tokenMetadata.uri,
    sellerFeeBasisPoints: tokenMetadata.sellerFeeBasisPoints,
    creators: tokenMetadata.creators,
    collection: tokenMetadata.collection,
    uses: tokenMetadata.uses
  });
  
  // Find metadata PDA
  const [metadataPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      MetadataProgram.PUBKEY.toBuffer(),
      tokenMint.publicKey.toBuffer()
    ],
    MetadataProgram.PUBKEY
  );
  
  // Create metadata instruction
  const createMetadataInstruction = new CreateMetadataV2(
    { feePayer: payer.publicKey },
    {
      metadata: metadataPDA,
      mint: tokenMint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV2: {
        data: dataV2,
        isMutable: true
      }
    }
  );
  
  // Send transaction to create metadata
  const metadataTransaction = new Transaction().add(createMetadataInstruction);
  await sendAndConfirmTransaction(connection, metadataTransaction, [payer]);
  
  console.log(`Token metadata created: ${metadataPDA.toString()}`);
  
  // Revoke mint authority
  await tokenMint.setAuthority(
    tokenMint.publicKey,
    null,
    'MintTokens',
    payer.publicKey,
    []
  );
  console.log("Mint authority revoked - token supply is now fixed");
  
  // Save token metadata example JSON for arweave upload
  const metadataJson = {
    name: "Lokquidity",
    symbol: "LOKQ",
    description: "A Solana token with locked liquidity and revoked mint authority",
    image: "https://raw.githubusercontent.com/edfarialand/liquidity-token/main/lokq-logo.png",
    attributes: [
      {
        trait_type: "Type",
        value: "Utility Token"
      },
      {
        trait_type: "Liquidity",
        value: "Locked"
      },
      {
        trait_type: "Supply",
        value: "Fixed"
      }
    ],
    properties: {
      files: [
        {
          uri: "https://raw.githubusercontent.com/edfarialand/liquidity-token/main/lokq-logo.png",
          type: "image/png"
        }
      ],
      category: "token"
    }
  };
  
  fs.writeFileSync('token-metadata.json', JSON.stringify(metadataJson, null, 2));
  console.log("Token metadata JSON example saved to token-metadata.json");
  
  // Save keys to file
  const keyData = {
    tokenAddress: tokenMint.publicKey.toString(),
    tokenAccount: tokenAccount.address.toString(),
    metadataPDA: metadataPDA.toString(),
    payerPublicKey: payer.publicKey.toString(),
    payerSecretKey: Array.from(payer.secretKey)
  };
  
  fs.writeFileSync('token-keys.json', JSON.stringify(keyData, null, 2));
  console.log("Keys saved to token-keys.json");
  
  return {
    tokenMint,
    tokenAccount,
    metadataPDA,
    payer
  };
}

createToken().then(
  () => console.log("Token creation with metadata completed successfully"),
  err => console.error("Error creating token with metadata:", err)
);