const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public', 'images');
const dirs = ['products', 'auth', 'placeholders'];

dirs.forEach(dir => {
  const fullPath = path.join(publicDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  try {
    await download('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', path.join(publicDir, 'placeholders', 'furniture-placeholder.jpg'));
    console.log('Downloaded placeholder');
    
    await download('https://images.unsplash.com/photo-1618220179428-22790b46a0eb?w=1200&q=80', path.join(publicDir, 'auth', 'auth-bg.jpg'));
    console.log('Downloaded auth bg');
  } catch (err) {
    console.error('Error downloading:', err);
  }
}

run();
