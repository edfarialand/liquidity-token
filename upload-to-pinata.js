const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// For demonstration purposes - use your own API keys in production
const PINATA_API_KEY = 'GET_YOUR_OWN_KEY';
const PINATA_SECRET_KEY = 'GET_YOUR_OWN_SECRET';

async function uploadToPinata(filePath) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  
  console.log(`Uploading ${filePath} to Pinata...`);
  
  // Create form data
  const formData = new FormData();
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);
  
  formData.append('file', fileStream, {
    filepath: fileName
  });
  
  try {
    const response = await axios.post(url, formData, {
      maxContentLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });
    
    if (response.status === 200) {
      const ipfsHash = response.data.IpfsHash;
      const pinataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      console.log(`Upload successful! URL: ${pinataUrl}`);
      return pinataUrl;
    } else {
      throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error uploading to Pinata: ${error.message}`);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }
    throw error;
  }
}

// For DEXscreener compatibility, we'll manually upload the files to GitHub instead
// since it's simpler and works with DEXscreener

console.log(`
=====================================================================
          INSTRUCTIONS FOR DEX SCREENER COMPATIBILITY
=====================================================================

Since we're unable to upload directly due to API key issues, follow these
steps to get your token showing up on DEXscreener:

1. The token logo is already set with this URL:
   https://raw.githubusercontent.com/edfarialand/solotto/c6fbc9b67791a131597e3b8dc175035624c5dc09/049E410C-5AC7-4943-B603-6EB47BA757DB.png

2. Create a public GitHub repository or use an existing one

3. Upload your token-metadata.json file to that repository

4. Get the raw URL to your metadata file:
   - Go to the file on GitHub
   - Click the "Raw" button
   - Copy the URL (should look like: https://raw.githubusercontent.com/username/repo/branch/token-metadata.json)

5. Update your token metadata with:
   node solana-metadata-update.js <YOUR_METADATA_URL>

DEXscreener will now display your token with its logo and metadata.
=====================================================================
`);

// Example upload code for when API keys are available:
/*
async function main() {
  try {
    // Upload logo to Pinata
    const logoUrl = await uploadToPinata('./lokq-logo.png');
    
    // Update metadata with logo URL
    const metadata = JSON.parse(fs.readFileSync('./token-metadata.json', 'utf8'));
    metadata.image = logoUrl;
    if (metadata.properties && metadata.properties.files) {
      metadata.properties.files[0].uri = logoUrl;
    }
    
    // Write updated metadata to file
    fs.writeFileSync('./token-metadata-pinata.json', JSON.stringify(metadata, null, 2));
    
    // Upload metadata to Pinata
    const metadataUrl = await uploadToPinata('./token-metadata-pinata.json');
    
    console.log(`\nLogo URL: ${logoUrl}`);
    console.log(`Metadata URL: ${metadataUrl}`);
    console.log(`\nUpdate your token with:\nnode solana-metadata-update.js ${metadataUrl}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
*/