const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Convert logo SVG to PNG icon
async function convertLogo() {
  try {
    console.log('Converting logo.svg to icon.png...');
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ icon.png created');

    console.log('Converting logo.svg to adaptive-icon.png...');
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(192, 192, { fit: 'contain', background: { r: 5, g: 150, b: 105, alpha: 1 } })
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ adaptive-icon.png created');
  } catch (error) {
    console.error('Error converting logo:', error);
  }
}

// Convert splash screen SVG to PNG
async function convertSplash() {
  try {
    console.log('Converting splash-screen.svg to splash-icon.png...');
    await sharp(path.join(assetsDir, 'splash-screen.svg'))
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✓ splash-icon.png created');

    console.log('Converting splash-screen.svg to splash-screen.png...');
    await sharp(path.join(assetsDir, 'splash-screen.svg'))
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(assetsDir, 'splash-screen.png'));
    console.log('✓ splash-screen.png created');
  } catch (error) {
    console.error('Error converting splash:', error);
  }
}

// Convert favicon for web
async function convertFavicon() {
  try {
    console.log('Converting logo.svg to favicon.png...');
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ favicon.png created');
  } catch (error) {
    console.error('Error converting favicon:', error);
  }
}

async function main() {
  console.log('Starting SVG to PNG conversion...\n');
  await convertLogo();
  await convertSplash();
  await convertFavicon();
  console.log('\n✓ All conversions complete!');
}

main();
