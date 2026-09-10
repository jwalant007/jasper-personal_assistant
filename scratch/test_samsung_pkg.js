const Samsung = require('../server/node_modules/samsung-tv-control').default;
const { KEYS } = require('../server/node_modules/samsung-tv-control');

const config = {
  debug: true,
  ip: '192.168.29.229',
  mac: '14:49:e0:20:f0:81',
  nameApp: 'JASPER Assistant',
  port: 55000,
  saveToken: false
};

const control = new Samsung(config);

console.log('Sending KEY_VOLDOWN via samsung-tv-control...');
control.sendKey(KEYS.KEY_VOLDOWN, (err, res) => {
  if (err) {
    console.error('sendKey error:', err);
  } else {
    console.log('sendKey success:', res);
  }
});
