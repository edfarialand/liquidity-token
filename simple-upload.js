const fs = require('fs');
const https = require('https');
const FormData = require('form-data');
const { Readable } = require('stream');

// Your NFT.Storage API key - hardcoded for testing
const apiKey = "69a68fdf.1560afc7d9f645c786549c18f6a53185";

if (!apiKey) {
  console.error('NFT_STORAGE_API_KEY environment variable not set');
  process.exit(1);
}

// Function to upload file to NFT.Storage
async function uploadToNFTStorage(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const formData = new FormData();
    
    // Create a readable stream from the file data
    const stream = new Readable();
    stream.push(fileData);
    stream.push(null);
    
    formData.append('file', stream, {
      filename: filePath.split('/').pop(),
      knownLength: fileData.length
    });
    
    const options = {
      hostname: 'api.nft.storage',
      port: 443,
      path: '/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    formData.pipe(req);
  });
}

async function main() {
  try {
    console.log('Uploading LOKQ logo to NFT.Storage...');
    const logoResponse = await uploadToNFTStorage('./lokq-logo.png');
    
    if (!logoResponse.ok) {
      throw new Error('Failed to upload logo');
    }
    
    const logoUrl = `https://${logoResponse.value.cid}.ipfs.nftstorage.link`;
    console.log(`Logo uploaded successfully! URL: ${logoUrl}`);
    
    // Update metadata with the new logo URL
    const metadata = {
      name: "Lokquidity",
      symbol: "LOKQ",
      description: "A Solana token with locked liquidity and revoked mint authority",
      image: logoUrl,
      external_url: "https://yourprojectwebsite.com",
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
            uri: logoUrl,
            type: "image/png"
          }
        ],
        category: "token",
        creators: [
          {
            address: "Your wallet address here",
            share: 100
          }
        ]
      }
    };
    
    // Write updated metadata to file
    fs.writeFileSync('./token-metadata-ipfs.json', JSON.stringify(metadata, null, 2));
    
    console.log('Uploading metadata to NFT.Storage...');
    const metadataResponse = await uploadToNFTStorage('./token-metadata-ipfs.json');
    
    if (!metadataResponse.ok) {
      throw new Error('Failed to upload metadata');
    }
    
    const metadataUrl = `https://${metadataResponse.value.cid}.ipfs.nftstorage.link`;
    console.log(`Metadata uploaded successfully! URL: ${metadataUrl}`);
    
    console.log('\nUpload Summary:');
    console.log('---------------');
    console.log(`Logo URL: ${logoUrl}`);
    console.log(`Metadata URL: ${metadataUrl}`);
    
    // Generate code for updating the token
    const updateCode = `
// In your solana-token.js or solana-metadata-update.js:

const tokenMetadata = {
  name: "Lokquidity",
  symbol: "LOKQ",
  uri: "${metadataUrl}",
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null
};
`;
    
    fs.writeFileSync('./update-code.js', updateCode);
    console.log('\nCode for updating your token saved to update-code.js');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();