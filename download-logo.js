const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/edfarialand/liquidity-token/main/lokq-logo.png';
const path = './lokq-logo.png';

console.log(`Downloading logo from ${url}...`);

https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download image: ${response.statusCode}`);
    return;
  }

  const fileStream = fs.createWriteStream(path);
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`Logo downloaded successfully to ${path}`);
  });
}).on('error', (err) => {
  console.error(`Error downloading logo: ${err.message}`);
});