const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

let srcPath = path.join(__dirname, '../public/jari-logo.png');
if (!fs.existsSync(srcPath)) {
  srcPath = path.join(__dirname, '../public/logo.png');
}

async function generate() {
  console.log('Generating jari icons from:', srcPath);

  if (!fs.existsSync(srcPath)) {
    throw new Error('Source logo not found at ' + srcPath);
  }

  const srcBuffer = fs.readFileSync(srcPath);

  // 1. Logo (clean high-res 1024x1024)
  await sharp(srcBuffer)
    .resize(1024, 1024, { fit: 'contain' })
    .png()
    .toFile('public/logo.png');
  console.log('Saved public/logo.png');

  // 2. Standard PWA Icon 192
  await sharp(srcBuffer)
    .resize(192, 192, { fit: 'contain' })
    .png()
    .toFile('public/icon-192.png');
  console.log('Saved public/icon-192.png');

  // 3. Standard PWA Icon 512
  await sharp(srcBuffer)
    .resize(512, 512, { fit: 'contain' })
    .png()
    .toFile('public/icon-512.png');
  console.log('Saved public/icon-512.png');

  // 4. Apple Touch Icon 180x180
  await sharp(srcBuffer)
    .resize(180, 180, { fit: 'contain' })
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Saved public/apple-touch-icon.png');

  // 5. Favicon PNG (48x48)
  await sharp(srcBuffer)
    .resize(48, 48, { fit: 'contain' })
    .png()
    .toFile('public/favicon.png');
  console.log('Saved public/favicon.png');

  // Favicon ICO (32x32)
  await sharp(srcBuffer)
    .resize(32, 32, { fit: 'contain' })
    .png()
    .toFile('public/favicon.ico');
  console.log('Saved public/favicon.ico');

  // Copy to src/app metadata icons
  fs.copyFileSync('public/icon-192.png', 'src/app/icon.png');
  fs.copyFileSync('public/apple-touch-icon.png', 'src/app/apple-icon.png');
  fs.copyFileSync('public/favicon.ico', 'src/app/favicon.ico');
  console.log('Copied to src/app metadata icons');

  // 6. Cashier Icons with distinct 'POS' badge in jari Royal Blue (#0A52A9)
  async function makeCashierIcon(size, filename) {
    const pad = Math.round(size * 0.08);
    const innerSize = size - pad * 2;
    const logoResized = await sharp(srcBuffer)
      .resize(innerSize, innerSize, { fit: 'contain' })
      .toBuffer();

    const badgeHeight = Math.round(size * 0.22);
    const badgeWidth = Math.round(size * 0.58);
    const fontSize = Math.round(badgeHeight * 0.65);
    const rx = Math.round(badgeHeight / 2);

    const svgBadge = Buffer.from(`
      <svg width="${badgeWidth}" height="${badgeHeight}" viewBox="0 0 ${badgeWidth} ${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${badgeWidth}" height="${badgeHeight}" rx="${rx}" fill="#073B7A" stroke="#ffffff" stroke-width="${Math.max(2, Math.round(size*0.015))}" />
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}px" font-weight="900" letter-spacing="1.5">POS</text>
      </svg>
    `);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 10, g: 82, b: 169, alpha: 1 } // #0A52A9
      }
    })
    .composite([
      { input: logoResized, top: Math.round(size * 0.02), left: Math.round((size - innerSize)/2) },
      { input: svgBadge, top: size - badgeHeight - Math.round(size * 0.04), left: Math.round((size - badgeWidth)/2) }
    ])
    .png()
    .toFile(filename);

    console.log('Saved cashier icon:', filename);
  }

  await makeCashierIcon(192, 'public/icon-cashier-192.png');
  await makeCashierIcon(512, 'public/icon-cashier-512.png');
  await makeCashierIcon(180, 'public/apple-touch-icon-cashier.png');
  console.log('ALL JARI ICONS GENERATED SUCCESSFULLY!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
