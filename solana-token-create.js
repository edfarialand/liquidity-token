// Create Solana SPL Token with Metaplex Metadata
const {
  Keypair,
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} = require('@solana/spl-token');
const {
  DataV2,
  createCreateMetadataAccountV2Instruction,
  PROGRAM_ID: METADATA_PROGRAM_ID,
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

async function createToken() {
  console.log("Starting LOKQ token creation process...");

  try {
    // --- 1. Load Configuration and Connect ---
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const projectConfigPath = './MySolanaProjectConfg.json';

    if (!fs.existsSync(projectConfigPath)) {
      console.error(`Error: Project token config file not found at ${projectConfigPath}.`);
      return;
    }
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'));

    if (!fs.existsSync(projectConfig.payerKeyPath)) {
      console.error(`Error: Payer keypair file not found at ${projectConfig.payerKeyPath}.`);
      return;
    }
    const payerSecretKeyArray = JSON.parse(fs.readFileSync(projectConfig.payerKeyPath, 'utf-8'));
    const payer = Keypair.fromSecretKey(new Uint8Array(payerSecretKeyArray));
    console.log(`Using payer wallet: ${payer.publicKey.toString()}`);

    const tokenName = projectConfig.tokenName;
    const tokenSymbol = projectConfig.tokenSymbol;
    const metadataUri = projectConfig.jsonMetadataUri;
    const tokenDecimals = projectConfig.tokenDecimals;
    // Adjust supply for decimals: if tokenSupply is 1 billion and decimals is 9,
    // actual_supply = 1,000,000,000 * (10^9)
    const tokenSupply = BigInt(projectConfig.tokenSupply) * BigInt(Math.pow(10, tokenDecimals));

    // --- 2. Create New Mint Account ---
    const mintKeypair = Keypair.generate();
    console.log(`New Token Mint Address: ${mintKeypair.publicKey.toString()}`);

    const lamportsForMint = await getMinimumBalanceForRentExemptMint(connection);

    const createMintAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: lamportsForMint,
      programId: TOKEN_PROGRAM_ID,
    });

    const initializeMintInstruction = createInitializeMintInstruction(
      mintKeypair.publicKey,
      tokenDecimals,
      payer.publicKey, // Mint Authority
      payer.publicKey  // Freeze Authority
    );

    // --- 3. Create Metaplex Metadata Account ---
    const [metadataPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
      METADATA_PROGRAM_ID
    );
    console.log(`Metadata PDA: ${metadataPDA.toString()}`);

    const tokenMetadata = {
      name: tokenName,
      symbol: tokenSymbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: [{ address: payer.publicKey, verified: true, share: 100 }],
      collection: null,
      uses: null,
    };

    const createMetadataInstruction = createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      { createMetadataAccountArgsV2: { data: tokenMetadata, isMutable: true } } // isMutable: true initially
    );

    // --- 4. Create Associated Token Account (ATA) and Mint Tokens ---
    const payerATA = await getAssociatedTokenAddress(mintKeypair.publicKey, payer.publicKey);
    const createPayerATAInstruction = createAssociatedTokenAccountInstruction(
        payer.publicKey, payerATA, payer.publicKey, mintKeypair.publicKey
    );

    const mintToInstruction = createMintToInstruction(
      mintKeypair.publicKey,
      payerATA,
      payer.publicKey, // Mint authority
      tokenSupply
    );

    // --- 5. Revoke Mint Authority ---
    const revokeMintAuthorityInstruction = createSetAuthorityInstruction(
        mintKeypair.publicKey,
        payer.publicKey, // Current authority
        AuthorityType.MintTokens,
        null // New authority (none)
    );

    // --- 6. Send Transaction ---
    const transaction = new Transaction().add(
      createMintAccountInstruction,
      initializeMintInstruction,
      createMetadataInstruction,
      createPayerATAInstruction, // Ensure ATA exists before minting
      mintToInstruction,
      revokeMintAuthorityInstruction
    );

    console.log("Sending transaction to create token, metadata, mint supply, and revoke mint authority...");
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair]);
    console.log(`Transaction successful! Signature: ${signature}`);
    console.log("--- IMPORTANT ---");
    console.log(`New Token Mint Address: ${mintKeypair.publicKey.toString()}`);
    console.log(`Metadata PDA: ${metadataPDA.toString()}`);
    console.log(`Payer's Associated Token Account (ATA): ${payerATA.toString()} received ${tokenSupply.toString()} tokens (raw amount).`);
    console.log("Update your 'project-token-config.json' with the new 'tokenAddress' and 'metadataPDA'.");

  } catch (error) {
    console.error("Error creating token:", error);
  }
}

createToken();
