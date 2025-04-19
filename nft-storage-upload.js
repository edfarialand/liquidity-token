// NFT.Storage Upload Script for LOKQ Token Assets
const { NFTStorage, File } = require('nft.storage');
const fs = require('fs');
const path = require('path');

// Simple mime type lookup function instead of using the mime package
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// NFT.Storage API key - you'll need to get your own from https://nft.storage
// This is a placeholder - NEVER commit real API keys to your repository
const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY || 'YOUR_API_KEY_HERE';

// Initialize the NFT.Storage client
const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });

// Function to read a file from disk as a File object
function fileFromPath(filePath) {
  const content = fs.readFileSync(filePath);
  const type = getMimeType(filePath);
  return new File([content], path.basename(filePath), { type });
}

// Function to upload the token's logo and metadata to NFT.Storage
async function uploadTokenAssets() {
  try {
    console.log('Starting NFT.Storage upload process for LOKQ token assets...');
    
    // Check if API key is set
    if (NFT_STORAGE_API_KEY === 'YOUR_API_KEY_HERE') {
      console.error('ERROR: NFT_STORAGE_API_KEY not set!');
      console.log('1. Go to https://nft.storage and sign up for a free account');
      console.log('2. Create a new API key');
      console.log('3. Replace YOUR_API_KEY_HERE in this file with your actual API key');
      return;
    }
    
    // First, upload the logo
    console.log('Uploading logo to NFT.Storage...');
    const logoFile = fileFromPath('./lokq-logo.png');
    const logoCid = await client.storeBlob(logoFile);
    const logoUrl = `https://${logoCid}.ipfs.nftstorage.link`;
    
    console.log(`Logo uploaded successfully! URL: ${logoUrl}`);
    
    // Update metadata with the new logo URL
    const metadata = JSON.parse(fs.readFileSync('./token-metadata.json'));
    metadata.image = logoUrl;
    
    // Update files array in properties
    if (metadata.properties && metadata.properties.files) {
      metadata.properties.files = metadata.properties.files.map(file => {
        if (file.type === 'image/png') {
          return {
            ...file,
            uri: logoUrl
          };
        }
        return file;
      });
    }
    
    // Write updated metadata to file
    fs.writeFileSync('./token-metadata-ipfs.json', JSON.stringify(metadata, null, 2));
    
    // Upload the updated metadata
    console.log('Uploading metadata to NFT.Storage...');
    const metadataFile = fileFromPath('./token-metadata-ipfs.json');
    const metadataCid = await client.storeBlob(metadataFile);
    const metadataUrl = `https://${metadataCid}.ipfs.nftstorage.link`;
    
    console.log(`Metadata uploaded successfully! URL: ${metadataUrl}`);
    
    console.log('\nNFT.Storage Upload Summary:');
    console.log('----------------------------');
    console.log(`Logo URL: ${logoUrl}`);
    console.log(`Metadata URL: ${metadataUrl}`);
    console.log('\nTo update your token, replace the URLs in solana-token.js with these IPFS URLs.');
    
    // Generate updated code snippet
    const codeSnippet = `
// Update these lines in solana-token.js:

// Metadata for the token
const tokenMetadata = {
  name: "Lokquidity",
  symbol: "LOKQ",
  uri: "${metadataUrl}", // IPFS metadata URL
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null
};
`;
    
    fs.writeFileSync('./ipfs-updates.js', codeSnippet);
    console.log('\nCode update example saved to ipfs-updates.js');
    
  } catch (error) {
    console.error('Error uploading to NFT.Storage:', error);
  }
}

// Run the upload function
uploadTokenAssets();