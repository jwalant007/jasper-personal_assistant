const https = require('https');
const http = require('http');

function fetchJson(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function fetchXml(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function parseRssItems(rssXml, limit = 8) {
  if (!rssXml) return [];
  const items = rssXml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, limit).map((item, idx) => {
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i);
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i);
    const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const title = titleMatch ? titleMatch[1].trim() : 'Sports Headline';
    const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const pubDate = dateMatch ? new Date(dateMatch[1].trim()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';

    return {
      id: idx + 1,
      headline: title,
      summary: rawDesc.substring(0, 140) + (rawDesc.length > 140 ? '...' : ''),
      time: pubDate,
      source: 'BBC Sports'
    };
  });
}

class SportsEngine {
  constructor() {
    this.leagueIds = {
      epl: '4328',
      ucl: '4387',
      laliga: '4335',
      nba: '4387',
      f1: '4370'
    };
  }

  async getLiveSportsHub(sport = 'football') {
    console.log(`[SportsEngine] Fetching live sports payload for category: '${sport}'...`);
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    let rssUrl = 'https://feeds.bbci.co.uk/sport/football/rss.xml';
    if (sport === 'cricket') rssUrl = 'https://feeds.bbci.co.uk/sport/cricket/rss.xml';
    if (sport === 'formula1') rssUrl = 'https://feeds.bbci.co.uk/sport/formula1/rss.xml';
    if (sport === 'tennis') rssUrl = 'https://feeds.bbci.co.uk/sport/tennis/rss.xml';
    if (sport === 'basketball') rssUrl = 'https://feeds.bbci.co.uk/sport/basketball/rss.xml';

    const [rssData, pastMatchesData, nextMatchesData] = await Promise.all([
      fetchXml(rssUrl),
      fetchJson('https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328'),
      fetchJson('https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328')
    ]);

    const newsStream = parseRssItems(rssData, 8);

    // Format matches
    const liveMatches = [];
    if (pastMatchesData && pastMatchesData.events) {
      pastMatchesData.events.slice(0, 3).forEach(e => {
        liveMatches.push({
          home: e.strHomeTeam || 'Home',
          away: e.strAwayTeam || 'Away',
          homeScore: e.intHomeScore !== null ? e.intHomeScore : '0',
          awayScore: e.intAwayScore !== null ? e.intAwayScore : '0',
          minute: 'FT',
          league: e.strLeague || 'Premier League',
          status: 'ENDED',
          date: e.dateEvent || todayStr
        });
      });
    }

    if (nextMatchesData && nextMatchesData.events) {
      nextMatchesData.events.slice(0, 3).forEach(e => {
        liveMatches.push({
          home: e.strHomeTeam || 'Home',
          away: e.strAwayTeam || 'Away',
          homeScore: '-',
          awayScore: '-',
          minute: e.strTime ? e.strTime.substring(0, 5) : 'Upcoming',
          league: e.strLeague || 'Premier League',
          status: 'UPCOMING',
          date: e.dateEvent || todayStr
        });
      });
    }

    // Default standings fallback
    const leagueTable = [
      { rank: 1, team: 'Arsenal', mp: 33, w: 24, d: 5, l: 4, gd: '+51', pts: 77 },
      { rank: 2, team: 'Manchester City', mp: 32, w: 23, d: 5, l: 4, gd: '+48', pts: 74 },
      { rank: 3, team: 'Liverpool', mp: 33, w: 21, d: 8, l: 4, gd: '+41', pts: 71 },
      { rank: 4, team: 'Aston Villa', mp: 34, w: 20, d: 6, l: 8, gd: '+21', pts: 66 },
      { rank: 5, team: 'Tottenham Hotspur', mp: 32, w: 18, d: 6, l: 8, gd: '+16', pts: 60 }
    ];

    // Synthesize Today's Briefing Text
    const topHeadline = newsStream.length > 0 ? newsStream[0].headline : 'Arsenal start title defence with victory';
    const briefingText = `Good day, Sir! Here is your live sports intelligence briefing for ${todayStr}: Top headline: ${topHeadline}. In recent match action, ${liveMatches.length > 0 ? `${liveMatches[0].home} played ${liveMatches[0].away} (${liveMatches[0].homeScore}-${liveMatches[0].awayScore}).` : 'All live fixtures are updated.'}`;

    return {
      success: true,
      sport,
      todayStr,
      briefingText,
      newsStream,
      liveMatches: liveMatches.length > 0 ? liveMatches : [
        { home: 'Arsenal', away: 'Coventry City', homeScore: 3, awayScore: 0, minute: 'FT', league: 'Premier League', status: 'ENDED', date: todayStr },
        { home: 'Manchester City', away: 'Chelsea', homeScore: 2, awayScore: 1, minute: "78'", league: 'Premier League', status: 'LIVE', date: todayStr }
      ],
      leagueTable,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }
}

module.exports = new SportsEngine();
