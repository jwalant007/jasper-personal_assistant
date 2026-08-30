const net = require('net');

function check(ip, port) {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(1000);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.connect(port, ip);
  });
}

(async () => {
  console.log('Testing 192.168.29.159:40677...');
  const res = await check('192.168.29.159', 40677);
  console.log('Port 40677 Reachable:', res);
})();
