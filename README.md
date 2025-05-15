# LOKQ Token (Lokquidity - mint auth revo - liquidity locked)

LOKQ is a pioneering Solana token designed with built-in protections against rug pulls and market manipulation. The token implements two critical security features: permanently revoked mint authority and locked liquidity. With mint authority revocation, no new tokens can ever be created, ensuring a truly fixed supply that can't be diluted by creators. The locked liquidity mechanism prevents sudden removal of trading pairs from decentralized exchanges, providing traders with confidence that they can always enter or exit positions.

## Token Details

- **Name**: Lokquidity - mint auth revo - liquidity locked
- **Symbol**: LOKQ
- **Decimals**: 9
- **Features**: 
  - Mint authority revoked (fixed supply)
  - Locked liquidity
  - Metaplex metadata support
  - Token-2022 program compatible

## Setup

1. Install dependencies:
```
npm install @solana/web3.js @solana/spl-token @metaplex-foundation/mpl-token-metadata buffer fs
```

2. Token Metadata:
   - The script is already configured with a GitHub-hosted logo image
   - For production, consider uploading the image and metadata to a permanent storage like Arweave
   - The token metadata is already configured in the script

3. Run the token creation script:
```
node solana-token.js
```

4. The script will:
   - Connect to Solana devnet
   - Generate a new wallet
   - Request an airdrop of SOL for transaction fees
   - Create the LOKQ token using the Token-2022 program
   - Mint the initial token supply
   - Create Metaplex metadata for DEX and wallet compatibility
   - Revoke mint authority (fixing supply)
   - Save keys to `token-keys.json`
   - Save example metadata JSON to `token-metadata.json`

## Token Metadata

The token includes full Metaplex metadata to ensure compatibility with:
- All major Solana wallets (showing token logo)
- DEXes and liquidity pools
- NFT marketplaces and token explorers

## Logo and Metadata for DEXscreener Compatibility

For proper display on DEXscreener and other platforms, your token needs metadata and logo uploaded to permanent storage.

### Option 1: Upload to NFT.Storage (IPFS) - Easiest

1. Get an API key from [NFT.Storage](https://nft.storage/) (free)
2. Set your API key:
   ```
   export NFT_STORAGE_API_KEY=your_api_key_here
   ```
3. Run the one-command script that handles everything:
   ```
   ./upload-one-command.sh
   ```
   
   Or run the steps manually:
   ```
   node nft-storage-upload.js
   node solana-metadata-update.js <METADATA_URL>
   ```

### Option 2: Upload to Arweave - Most Permanent

1. Get an Arweave wallet key JSON from [Arweave.app](https://arweave.app/add)
2. Save it as `arweave-key.json` in your project directory
3. Run the upload script:
   ```
   node arweave-upload.js
   ```
4. Update your token metadata with the returned URLs:
   ```
   node solana-metadata-update.js <METADATA_URL>
   ```

### Current Configuration

The token is currently configured with GitHub URLs, which work for development but aren't recommended for production. For proper DEXscreener integration, follow one of the upload methods above.

## Security Note

The token keys are saved to `token-keys.json`. Keep this file secure and never share it publicly, as it contains your private keys.

## Next Steps

1. Deploy to mainnet (modify cluster URL in script)
2. Set up liquidity pools with locked liquidity
3. Implement additional token features as needed