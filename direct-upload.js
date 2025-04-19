// NFT.Storage Direct Upload Script
const { NFTStorage } = require('nft.storage');
const fs = require('fs');

// The API key
const token = '69a68fdf.1560afc7d9f645c786549c18f6a53185';

// Use alternative method of interacting with NFT.Storage
async function upload() {
  // Create client with proper JS object
  const storage = new NFTStorage({ token });
  
  console.log('Uploading logo...');
  try {
    // Read file as blob
    const logoData = fs.readFileSync('./lokq-logo.png');
    
    // Upload directly with the blob API
    const logoCid = await storage.storeBlob(new Blob([logoData]));
    console.log(`Logo uploaded! CID: ${logoCid}`);
    console.log(`URL: https://${logoCid}.ipfs.nftstorage.link`);
    
    // Create metadata
    const metadata = {
      name: "Lokquidity",
      symbol: "LOKQ",
      description: "A Solana token with locked liquidity and revoked mint authority",
      image: `https://${logoCid}.ipfs.nftstorage.link`,
      properties: {
        files: [
          {
            uri: `https://${logoCid}.ipfs.nftstorage.link`,
            type: "image/png"
          }
        ],
        category: "token"
      }
    };
    
    // Write metadata to file
    fs.writeFileSync('./metadata.json', JSON.stringify(metadata, null, 2));
    
    // Upload metadata file
    const metadataData = fs.readFileSync('./metadata.json');
    const metadataCid = await storage.storeBlob(new Blob([metadataData]));
    
    console.log(`Metadata uploaded! CID: ${metadataCid}`);
    console.log(`URL: https://${metadataCid}.ipfs.nftstorage.link`);
    
    console.log(`\nTo update your token, use this URL: https://${metadataCid}.ipfs.nftstorage.link`);
    
  } catch (error) {
    console.error('Error uploading to NFT.Storage:', error);
    
    // Check if the error is related to API key
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\nIt seems the API key is invalid or malformed.');
      console.log('Please get a valid API key from https://nft.storage/manage/');
      console.log('NFT.Storage API keys should be a string without periods or special characters.');
    }
  }
}

upload();