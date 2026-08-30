const net = require('net');

function check(ip, port) {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(350);
    s.on('connect', () => { s.destroy(); resolve(port); });
    s.on('timeout', () => { s.destroy(); resolve(null); });
    s.on('error', () => { s.destroy(); resolve(null); });
    s.connect(port, ip);
  });
}

(async () => {
  const ip = '192.168.29.159';
  console.log(`Fast scanning ${ip}:30000-50000...`);
  const openPorts = [];
  const batchSize = 100;
  for (let start = 30000; start <= 50000; start += batchSize) {
    const promises = [];
    for (let p = start; p < start + batchSize && p <= 50000; p++) {
      promises.push(check(ip, p));
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r) {
        console.log(`>>> FOUND OPEN PORT: ${r}`);
        openPorts.push(r);
      }
    }
  }
  console.log('ALL OPEN PORTS:', openPorts);
})();
