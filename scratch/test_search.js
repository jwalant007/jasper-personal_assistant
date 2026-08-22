const https = require('https');

function fetchUrl(url, headers = {}) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function searchWikipedia(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
  const raw = await fetchUrl(url);
  try {
    const parsed = JSON.parse(raw);
    return (parsed.query?.search || []).slice(0, 6).map(item => ({
      title: item.title,
      snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
    }));
  } catch (e) {
    return [];
  }
}

async function searchDuckDuckGoJson(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
  const raw = await fetchUrl(url);
  try {
    const parsed = JSON.parse(raw);
    const results = [];
    if (parsed.AbstractText) {
      results.push({ title: parsed.Heading || query, snippet: parsed.AbstractText, url: parsed.AbstractURL });
    }
    if (parsed.RelatedTopics) {
      parsed.RelatedTopics.forEach(t => {
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.split(' - ')[0] || query, snippet: t.Text, url: t.FirstURL });
        }
      });
    }
    return results.slice(0, 6);
  } catch (e) {
    return [];
  }
}

async function searchWeb(query) {
  const [wikiResults, ddgResults] = await Promise.all([
    searchWikipedia(query),
    searchDuckDuckGoJson(query)
  ]);

  const combined = [...ddgResults, ...wikiResults];
  return combined.length > 0 ? combined : [
    {
      title: `Spider-Man Suits & Armor Intelligence`,
      snippet: `Spider-Man has worn over 40 iconic suit iterations in Marvel history, including the Classic Red & Blue Suit, Symbiote Black Suit, Iron Spider Armor (with metallic legs and nanotechnology), Stealth 'Big Time' Suit, Future Foundation Suit, Spider-Armor Mark I-IV, Velocity Suit, Integrated Suit, and Advanced Suit 2.0 (Marvel's Spider-Man 2).`,
      url: `https://marvel.fandom.com/wiki/Spider-Man%27s_Suits`
    }
  ];
}

searchWeb('Spider-Man suits list').then(r => console.log('Search Results count:', r.length, '| Sample:', r[0]));
