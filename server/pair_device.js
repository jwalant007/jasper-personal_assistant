const { execFile } = require('child_process');
const adbPath = 'C:\\Users\\Jwalant\\AppData\\Local\\Android\\platform-tools\\adb.exe';

console.log('Pairing with 192.168.29.159:40677 code: 243245');
execFile(adbPath, ['pair', '192.168.29.159:40677', '243245'], (err, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
  if (err) {
    console.log('ERROR:', err.message);
  }
});
