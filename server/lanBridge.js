const os = require('os');

/**
 * GETS LOCAL IP ADDRESS OF LAPTOP 1 FOR DIRECT ETHERNET / LAN CONNECTION TO LAPTOP 2
 */
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function printLaptopBridgeBanner(port = 5000) {
  const ip = getLocalIpAddress();
  console.log('\n===============================================================================');
  console.log('  ⚡ JWALANT BHATT CREATION - TWO-LAPTOP DIRECT CABLE / LAN BRIDGE ⚡');
  console.log('===============================================================================');
  console.log(`  💻 LAPTOP 1 (Developer/AI Node): Running Code, AI & Server`);
  console.log(`  🖥️ LAPTOP 2 (Operator HUD Node): Open Browser to -> http://${ip}:${port}`);
  console.log('===============================================================================\n');
}

module.exports = { getLocalIpAddress, printLaptopBridgeBanner };
