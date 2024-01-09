const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function downloadAndModifyFont(fontFamily, fontStyle, fontWeight) {
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:${fontStyle.join(',')}&display=swap`;

  const response = await fetch(googleFontsUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Fonts CSS: ${response.status} - ${response.statusText}`);
  }

  const cssContent = await response.text();

  const fileName = `${fontFamily}-${fontStyle.join('-')}-${fontWeight}.woff2`;
  const fontPath = path.join('fonts', fileName);
  const cssPath = 'font.css';

  // Create the fonts directory if it doesn't exist
  if (!fs.existsSync('fonts')) {
    fs.mkdirSync('fonts');
  }

  // Modify the CSS content
  const modifiedCssContent = cssContent.replace(
    new RegExp(`url\\(https://fonts.gstatic.com/s/${fontFamily.replace(/\s/g, '')}/(.*?)\\)`, 'g'),
    `url(${fileName}`
  );

  fs.writeFileSync(cssPath, modifiedCssContent);

  console.log(`CSS file (${cssPath}) fetched and updated successfully!`);

  // If the font file URL is embedded in the CSS, extract it and download the font file
  const fontUrlMatch = cssContent.match(/url\((https:\/\/fonts.gstatic.com\/s\/.*?)\)/);
  if (fontUrlMatch) {
    const fontUrl = fontUrlMatch[1];

    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error(`Failed to download font file: ${fontResponse.status} - ${fontResponse.statusText}`);
    }

    const fileStream = fs.createWriteStream(fontPath);
    await new Promise((resolve, reject) => {
      fontResponse.body.pipe(fileStream);
      fontResponse.body.on('error', (err) => {
        reject(err);
      });
      fileStream.on('finish', function () {
        resolve();
      });
    });

    console.log(`Font file (${fileName}) downloaded successfully!`);
  }
}

// Example usage
const fontFamily = 'Poppins';
const fontStyle = ['ital', 'wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900'];
const fontWeight = '400';

downloadAndModifyFont(fontFamily, fontStyle, fontWeight)
  .catch((err) => {
    console.error('Error:', err);
  });
