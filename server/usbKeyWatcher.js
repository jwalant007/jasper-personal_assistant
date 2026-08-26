const fs = require('fs');
const path = require('path');

let isKeyInjected = false;

/**
 * POLLS WINDOWS DRIVES FOR JWALANT BHATT CREATION USB PENDRIVE KEY
 */
function startUsbKeyWatcher(onKeyDetected) {
  const checkDrives = () => {
    const drives = ['E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:', 'L:', 'M:', 'N:'];
    let found = false;

    drives.forEach(drive => {
      try {
        const keyFile = path.join(drive, '\\.jasper_security_key');
        const batFile = path.join(drive, '\\JASPER_PORTABLE_KEY.bat');

        if (fs.existsSync(keyFile) || fs.existsSync(batFile)) {
          found = true;
        }
      } catch (e) {
        // Drive unreadable or not mounted
      }
    });

    if (fs.existsSync(path.join(process.cwd(), '.jasper_security_key')) || fs.existsSync(path.join(process.cwd(), 'JASPER_PORTABLE_KEY.bat'))) {
      found = true;
    }

    if (found && !isKeyInjected) {
      isKeyInjected = true;
      console.log('⚡ [USB KEY WATCHER] JWALANT BHATT CREATION USB Security Key Injected & Authenticated!');
      if (onKeyDetected) onKeyDetected({ authenticated: true, owner: 'JWALANT BHATT CREATION' });
    } else if (!found && isKeyInjected) {
      isKeyInjected = false;
      console.log('🔒 [USB KEY WATCHER] USB Security Key Ejected.');
    }
  };

  setInterval(checkDrives, 3000);
  checkDrives();
}

module.exports = { startUsbKeyWatcher };
