const https = require('https');

const options = {
  hostname: 'www.instagram.com',
  path: '/reel/DcUTZfPP7kX/',
  headers: {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept-Language': 'en-US,en;q=0.9'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const ogDesc = data.match(/property="og:description"\s+content="([^"]+)"/i) ||
                   data.match(/name="description"\s+content="([^"]+)"/i);
    const ogTitle = data.match(/property="og:title"\s+content="([^"]+)"/i) ||
                    data.match(/<title>([^<]+)<\/title>/i);

    console.log('TITLE:', ogTitle ? ogTitle[1] : 'N/A');
    console.log('DESC:', ogDesc ? ogDesc[1] : 'N/A');
  });
}).on('error', err => console.error(err));
