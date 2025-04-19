#!/bin/bash
# One-command script to upload LOKQ token assets to IPFS and update the token

echo "LOKQ Token - One-Command Upload and Update Script"
echo "================================================="

# Check if NFT.Storage API key is set
if [ -z "$NFT_STORAGE_API_KEY" ]; then
  echo "Error: NFT_STORAGE_API_KEY environment variable not set"
  echo "Please set it with: export NFT_STORAGE_API_KEY=your_key_here"
  exit 1
fi

# Install dependencies if needed
if ! npm list | grep -q "nft.storage"; then
  echo "Installing required dependencies..."
  npm install nft.storage mime
fi

# Run the NFT.Storage upload script
echo "Uploading logo and metadata to IPFS via NFT.Storage..."
node nft-storage-upload.js

# Check if ipfs-updates.js was created
if [ ! -f "./ipfs-updates.js" ]; then
  echo "Error: Upload to NFT.Storage failed"
  exit 1
fi

# Extract the metadata URL from ipfs-updates.js
METADATA_URL=$(grep -o 'uri: "https://.*"' ./ipfs-updates.js | cut -d'"' -f2)

if [ -z "$METADATA_URL" ]; then
  echo "Error: Could not extract metadata URL from ipfs-updates.js"
  exit 1
fi

echo "Extracted metadata URL: $METADATA_URL"

# Update the token metadata with the new URL
echo "Updating token metadata with permanent IPFS URL..."
node solana-metadata-update.js "$METADATA_URL"

echo "Done! Your LOKQ token should now be properly configured for DEXscreener."