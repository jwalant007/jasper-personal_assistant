const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'www.instagram.com',
  path: '/reel/DbyTPOVCQxL/',
  headers: {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept-Language': 'en-US,en;q=0.9'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('scratch/reel_dump.html', data);
    console.log('Saved dump size:', data.length);
    
    // Look for og tags, json-ld, or captions
    const matches = data.match(/"text":"([^"]{10,300})"/g) || [];
    console.log('Found text snippets:', matches.slice(0, 10));

    const metaMatches = data.match(/<meta[^>]+>/g) || [];
    console.log('Meta tags:', metaMatches.filter(m => m.includes('og:') || m.includes('description')));
  });
});
