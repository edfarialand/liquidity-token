// Arweave Upload Script for LOKQ Token Assets
const Arweave = require('arweave');
const fs = require('fs');

// Initialize Arweave with Arweave.net gateway
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Function to upload file to Arweave
async function uploadToArweave(filePath, contentType) {
  try {
    console.log(`Uploading ${filePath} to Arweave...`);
    
    // Read wallet key file - you need to provide your own wallet key JSON
    const jwk = JSON.parse(fs.readFileSync('./arweave-key.json'));
    
    // Read the file data
    const fileData = fs.readFileSync(filePath);
    
    // Create transaction
    const transaction = await arweave.createTransaction({
      data: fileData
    }, jwk);
    
    // Add tags to the transaction
    transaction.addTag('Content-Type', contentType);
    transaction.addTag('App-Name', 'LOKQ-Token');
    transaction.addTag('Token-Name', 'Lokquidity');
    transaction.addTag('Token-Symbol', 'LOKQ');
    
    // Sign the transaction
    await arweave.transactions.sign(transaction, jwk);
    
    // Get the transaction ID
    const txid = transaction.id;
    
    // Submit the transaction
    const response = await arweave.transactions.post(transaction);
    
    if (response.status === 200) {
      console.log(`Successfully submitted to Arweave with TX ID: ${txid}`);
      console.log(`File will be available at: https://arweave.net/${txid}`);
      return `https://arweave.net/${txid}`;
    } else {
      console.error('Failed to submit transaction:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error uploading to Arweave:', error);
    return null;
  }
}

// Main function to upload logo and metadata
async function uploadTokenAssets() {
  console.log('Starting Arweave upload process for LOKQ token assets...');
  
  // Check if wallet key exists
  if (!fs.existsSync('./arweave-key.json')) {
    console.error('ERROR: arweave-key.json not found!');
    console.log('You need an Arweave wallet key file to proceed.');
    console.log('1. Go to https://arweave.app/add');
    console.log('2. Create a new wallet or import existing one');
    console.log('3. Export your wallet key as JSON');
    console.log('4. Save the file as arweave-key.json in this directory');
    console.log('5. Fund your wallet with some AR tokens for storage fees');
    return;
  }
  
  // Upload logo first
  const logoUrl = await uploadToArweave('./lokq-logo.png', 'image/png');
  
  if (logoUrl) {
    console.log('Logo uploaded successfully!');
    
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
    fs.writeFileSync('./token-metadata-arweave.json', JSON.stringify(metadata, null, 2));
    
    // Upload the updated metadata
    const metadataUrl = await uploadToArweave('./token-metadata-arweave.json', 'application/json');
    
    if (metadataUrl) {
      console.log('Metadata uploaded successfully!');
      console.log('\nArweave Upload Summary:');
      console.log('------------------------');
      console.log(`Logo URL: ${logoUrl}`);
      console.log(`Metadata URL: ${metadataUrl}`);
      console.log('\nTo update your token, replace the URLs in solana-token.js with these Arweave URLs.');
      
      // Generate updated code snippet
      const codeSnippet = `
// Update these lines in solana-token.js:

// Metadata for the token
const tokenMetadata = {
  name: "Lokquidity",
  symbol: "LOKQ",
  uri: "${metadataUrl}", // Arweave metadata URL
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null
};
`;
      
      fs.writeFileSync('./arweave-updates.js', codeSnippet);
      console.log('\nCode update example saved to arweave-updates.js');
    } else {
      console.error('Failed to upload metadata to Arweave.');
    }
  } else {
    console.error('Failed to upload logo to Arweave.');
  }
}

// Run the upload function
uploadTokenAssets();