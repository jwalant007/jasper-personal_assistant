const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'www.instagram.com',
  path: '/reel/DbyTPOVCQxL/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  }
};

https.get(options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('scratch/reel_dbyt.html', data);
    console.log('HTML size:', data.length);

    // Search for meta tags
    const metas = data.match(/<meta[^>]+>/gi) || [];
    metas.forEach(m => {
      if (m.includes('property=') || m.includes('name=')) {
        console.log('META:', m);
      }
    });

    // Search for any caption / text strings
    const captionMatches = data.match(/"text":"([^"]+)"/g) || [];
    console.log('Found captions:', captionMatches.slice(0, 10));
  });
}).on('error', err => console.error(err));
