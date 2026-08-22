const https = require('https');

function fetchRss(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function run() {
  const rss = await fetchRss('https://feeds.bbci.co.uk/sport/football/rss.xml');
  const items = rss.match(/<item>[\s\S]*?<\/item>/gi) || [];
  console.log('BBC Football RSS Items count:', items.length);

  items.slice(0, 5).forEach((item, idx) => {
    const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i);
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    console.log(`[${idx + 1}]`, title ? title[1].trim() : 'No Title', '| Date:', pubDate ? pubDate[1].trim() : '');
  });
}

run();
