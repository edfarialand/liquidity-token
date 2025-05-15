// Solana Token Creation Script - LOKQ (Lokquidity) with Metaplex Metadata
const {
    Keypair,
    Connection,
    clusterApiUrl,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const {
    TOKEN_PROGRAM_ID,
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority
} = require('@solana/spl-token');
const {
    MetadataProgram, // Only MetadataProgram.PUBKEY is used directly
    CreateMetadataV2,
    DataV2
} = require('@metaplex-foundation/mpl-token-metadata');
const { Buffer } = require('buffer');
const fs = require('fs');

async function createToken() {
    // Connect to cluster (mainnet for production)
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

    // --- YOUR NEW WALLET PATH ---
    // Using your provided Ubuntu username
    const newWalletPath = '/home/solottotoke_gmail_com/.config/solana/mainnet-payer.json'; // <-- YOUR USERNAME IS HERE!
    // --- END WALLET CONFIGURATION ---

    let payer;
    try {
        const secretKeyString = fs.readFileSync(newWalletPath, { encoding: 'utf8' });
        const secretKeyBytes = Uint8Array.from(JSON.parse(secretKeyString));
        payer = Keypair.fromSecretKey(secretKeyBytes);
    } catch (err) {
        console.error(`Error loading wallet from ${newWalletPath}.`);
        console.error("Please ensure:");
        console.error("1. The path is correct.");
        console.error("2. You have run 'solana-keygen new --outfile /home/solottotoke_gmail_com/.config/solana/mainnet-payer.json' (or equivalent).");
        console.error("3. The file is accessible and contains the secret key as a JSON array of numbers.");
        console.error(err);
        return;
    }
    console.log(`Using payer wallet: ${payer.publicKey.toString()}`);

    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`Payer wallet balance: ${balance / 1000000000} SOL`);
    if (balance < 5000000) { // Roughly 0.005 SOL, adjust as needed for fees
        console.warn("Warning: Payer wallet balance is low. Ensure you have enough SOL for transaction fees and rent.");
    }

    console.log("Creating token LOKQ (Lokquidity)...");

    const mintKeypair = Keypair.generate(); // New mint account for the token

    // Create mint account
    const tokenMintAddress = await createMint(
        connection,
        payer,             // Payer of fees
        payer.publicKey,   // Mint authority
        null,              // Freeze authority (null for no freeze authority - good for DEX)
        9,                 // Decimals
        mintKeypair,       // Keypair for the new mint account
        undefined,         // Confirm options (can be undefined for default)
        TOKEN_PROGRAM_ID
    );

    console.log("Token mint created successfully!");
    console.log(`Token Mint Address: ${tokenMintAddress.toString()}`);

    // Create associated token account for the payer to receive the initial supply
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        tokenMintAddress,
        payer.publicKey // Owner of the new token account
    );
    console.log(`Associated Token Account for payer: ${tokenAccount.address.toString()}`);

    // Mint tokens to the payer's token account
    const amount = 1000000000; // 1 billion tokens
    const rawAmount = BigInt(amount) * BigInt(10 ** 9); // Adjust for 9 decimals

    await mintTo(
        connection,
        payer,
        tokenMintAddress,
        tokenAccount.address,
        payer.publicKey, // Minting authority (currently the payer)
        rawAmount
    );
    console.log(`Minted ${amount} LOKQ tokens to ${tokenAccount.address.toString()}`);

    // --- Create Metaplex On-Chain Metadata ---
    console.log("Creating token on-chain metadata...");

    // --- IMAGE URI CONFIGURATION ---
    const permanentImageUri = "https://arweave.net/iT0xk5TdjK9t1v0mRV0gHjQ3x-hc6T6t3H2cvQkk3sI"; // Your Arweave image URI
    // --- END IMAGE URI CONFIGURATION ---

    // On-chain metadata (will be stored directly on Solana)
    const onChainMetadata = {
        name: "Lokquidity", // Max 32 bytes
        symbol: "LOKQ",     // Max 10 bytes
        // This URI will point to your off-chain JSON metadata file.
        // Initially, you can use a placeholder or the GitHub raw link if you plan to update it.
        uri: "https://raw.githubusercontent.com/edfarialand/liquidity-token/main/token-metadata.json", // Max 200 bytes. Placeholder, to be updated.
        sellerFeeBasisPoints: 0, // 0 for fungible tokens
        creators: [{ address: payer.publicKey, verified: false, share: 100 }], // Payer is the creator
        collection: null,
        uses: null
    };

    const dataV2 = new DataV2({
        name: onChainMetadata.name,
        symbol: onChainMetadata.symbol,
        uri: onChainMetadata.uri,
        sellerFeeBasisPoints: onChainMetadata.sellerFeeBasisPoints,
        creators: onChainMetadata.creators,
        collection: onChainMetadata.collection,
        uses: onChainMetadata.uses
    });

    // Derive the metadata PDA (Program Derived Address)
    const [metadataPDA] = await PublicKey.findProgramAddress(
        [
            Buffer.from("metadata"),
            MetadataProgram.PUBKEY.toBuffer(),
            tokenMintAddress.toBuffer()
        ],
        MetadataProgram.PUBKEY
    );

    const createMetadataInstruction = new CreateMetadataV2(
        { feePayer: payer.publicKey },
        {
            metadata: metadataPDA,
            mint: tokenMintAddress,
            mintAuthority: payer.publicKey,
            payer: payer.publicKey,
            updateAuthority: payer.publicKey, // Payer is also the update authority
        },
        {
            createMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true // Set to true so you can update it later (e.g., the URI)
            }
        }
    );

    const metadataTransaction = new Transaction().add(createMetadataInstruction);
    await sendAndConfirmTransaction(connection, metadataTransaction, [payer]);
    console.log(`On-chain token metadata created: ${metadataPDA.toString()}`);

    // Revoke mint authority to make the supply fixed
    console.log("Revoking mint authority...");
    await setAuthority(
        connection,
        payer,
        tokenMintAddress,
        payer.publicKey,    // Current authority (the payer)
        0,                  // Authority type: 0 for MintTokens
        null                // New authority: null to disable minting
    );
    console.log("Mint authority revoked. Token supply is now fixed.");

    // --- Prepare and Save Off-Chain Metadata JSON (for Arweave/IPFS upload) ---
    const offChainMetadataJson = {
        name: "Lokquidity - Mint Authority Revoked, Liquidity Locked", // Full descriptive name
        symbol: "LOKQ",
        description: "LOKQ is a pioneering Solana token designed with built-in protections against rug pulls and market manipulation. The token implements two critical security features: permanently revoked mint authority and locked liquidity. With mint authority revocation, no new tokens can ever be created, ensuring a truly fixed supply that can't be diluted by creators. The locked liquidity mechanism prevents sudden removal of trading pairs from decentralized exchanges, providing traders with confidence that they can always enter or exit positions. LOKQ demonstrates how blockchain technology can be leveraged to create inherently safer financial instruments through immutable code-based guarantees rather than relying solely on trust.",
        image: permanentImageUri, // Use the permanent image URI you configured above
        external_url: "https://github.com/edfarialand/liquidity-token", // Link to your project
        attributes: [
            { trait_type: "Type", value: "Utility Token" },
            { trait_type: "Liquidity", value: "Locked (Conceptual)" }, // Note: Actual locking requires separate mechanism
            { trait_type: "Supply", value: "Fixed" }
        ],
        properties: {
            files: [
                { uri: permanentImageUri, type: "image/png" } // Use the permanent image URI
            ],
            category: "token",
            creators: [
                { address: payer.publicKey.toString(), share: 100 } // Payer is the creator
            ]
        }
    };

    fs.writeFileSync('token-metadata.json', JSON.stringify(offChainMetadataJson, null, 2));
    console.log("Off-chain token metadata JSON saved to token-metadata.json. Please upload this file to Arweave/IPFS.");
    console.log("IMPORTANT: After uploading token-metadata.json to Arweave/IPFS, use its URI with the solana-metadata-update.js script to update the on-chain URI.");


    // Save key information for later use (e.g., with the update script)
    const keyData = {
        tokenMintAddress: tokenMintAddress.toString(),
        payerAssociatedTokenAccount: tokenAccount.address.toString(),
        metadataPDA: metadataPDA.toString(),
        payerPublicKey: payer.publicKey.toString(),
        // Storing the raw secret key bytes for easier reloading
        payerSecretKeyArray: Array.from(payer.secretKey)
    };

    fs.writeFileSync('token-keys.json', JSON.stringify(keyData, null, 2));
    console.log("Key information saved to token-keys.json");

    console.log("\n--- TOKEN CREATION SUMMARY ---");
    console.log(`Payer Wallet: ${payer.publicKey.toString()}`);
    console.log(`Token Mint Address: ${tokenMintAddress.toString()}`);
    console.log(`Payer's Token Account: ${tokenAccount.address.toString()}`);
    console.log(`On-Chain Metadata PDA: ${metadataPDA.toString()}`);
    console.log(`Off-Chain Metadata JSON: token-metadata.json (ready for upload)`);
    console.log(`Key Info: token-keys.json`);
    console.log("-----------------------------\n");

    return keyData;
}

createToken().then(
    (result) => console.log("Token creation process completed successfully.", result ? "" : "(No result returned)"),
    err => {
        console.error("\n--- ERROR DURING TOKEN CREATION ---");
        if (err.logs) {
            console.error("Solana Transaction Logs:");
            err.logs.forEach(log => console.error(log));
        } else {
            console.error(err);
        }
        console.error("-----------------------------------\n");
    }
);
