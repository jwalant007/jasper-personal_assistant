const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class PcRemoteController {
  constructor() {
    this.scratchDir = path.join(__dirname, '../scratch');
    if (!fs.existsSync(this.scratchDir)) {
      try { fs.mkdirSync(this.scratchDir, { recursive: true }); } catch (e) {}
    }

    this.bridgeExePath = path.join(__dirname, 'JasperInputBridge.exe');
    this.bridgeCsPath = path.join(__dirname, 'JasperInputBridge.cs');
    this.ensureNativeBridge();
  }

  /**
   * Ensures the native C# input bridge is compiled and ready for ultra-low latency execution
   */
  ensureNativeBridge() {
    if (fs.existsSync(this.bridgeExePath)) {
      return true;
    }

    if (process.platform === 'win32' && fs.existsSync(this.bridgeCsPath)) {
      const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
      if (fs.existsSync(cscPath)) {
        try {
          console.log('[PcRemoteController] Compiling native Win32 JasperInputBridge.exe...');
          exec(`"${cscPath}" /target:exe /optimize /out:"${this.bridgeExePath}" "${this.bridgeCsPath}"`, (err) => {
            if (err) {
              console.warn('[PcRemoteController] Native bridge compilation notice:', err.message);
            } else {
              console.log('[PcRemoteController] Native Win32 input bridge compiled successfully!');
            }
          });
        } catch (e) {
          console.warn('[PcRemoteController] Compiler execution failed:', e.message);
        }
      }
    }
    return false;
  }

  /**
   * Captures the host Windows desktop screen as a Base64 JPEG image.
   * Utilizes native GDI BitBlt via JasperInputBridge.exe (< 100ms total latency).
   */
  getScreenCapture(quality = 65, scale = 0.75) {
    return new Promise((resolve) => {
      if (fs.existsSync(this.bridgeExePath)) {
        execFile(this.bridgeExePath, ['capture', String(quality), String(scale)], { maxBuffer: 25 * 1024 * 1024 }, (err, stdout) => {
          if (!err && stdout) {
            const match = stdout.match(/DATA_START:([\s\S]*?):DATA_END/);
            if (match && match[1]) {
              return resolve(`data:image/jpeg;base64,${match[1].trim()}`);
            }
          }
          this._fallbackCapture().then(resolve);
        });
      } else {
        this._fallbackCapture().then(resolve);
      }
    });
  }

  /**
   * Fallback PowerShell screen capture if native binary is unavailable
   */
  _fallbackCapture() {
    return new Promise((resolve) => {
      const script = `
        Add-Type -AssemblyName System.Drawing;
        Add-Type -AssemblyName System.Windows.Forms;
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
        $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height);
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap);
        $graphics.CopyFromScreen($screen.X, $screen.Y, 0, 0, $screen.Size);
        $ms = New-Object System.IO.MemoryStream;
        $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg);
        $bytes = $ms.ToArray();
        $base64 = [Convert]::ToBase64String($bytes);
        $graphics.Dispose();
        $bitmap.Dispose();
        $ms.Dispose();
        [Console]::Out.Write('DATA_START:' + $base64 + ':DATA_END');
      `;
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;
      exec(cmd, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const match = stdout.match(/DATA_START:([\s\S]*?):DATA_END/);
        if (match && match[1]) {
          resolve(`data:image/jpeg;base64,${match[1].trim()}`);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Simulates mouse click at coordinate (xPercent, yPercent) on the Windows screen.
   * Utilizes native Win32 SetCursorPos and mouse_event (< 5ms latency).
   */
  clickMouse(xPercent, yPercent, type = 'left') {
    return new Promise((resolve) => {
      if (fs.existsSync(this.bridgeExePath)) {
        execFile(this.bridgeExePath, ['click', String(xPercent), String(yPercent), type], (err, stdout) => {
          if (!err) {
            return resolve({ success: true, output: stdout ? stdout.trim() : 'CLICKED:NATIVE', bridge: 'native' });
          }
          this._fallbackClick(xPercent, yPercent, type).then(resolve);
        });
      } else {
        this._fallbackClick(xPercent, yPercent, type).then(resolve);
      }
    });
  }

  _fallbackClick(xPercent, yPercent, type = 'left') {
    return new Promise((resolve) => {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms;
        $code = '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);';
        $type = Add-Type -MemberDefinition $code -Name 'Win32Mouse' -Namespace 'Win32' -PassThru;
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
        $targetX = [int]($bounds.Width * ${xPercent} / 100);
        $targetY = [int]($bounds.Height * ${yPercent} / 100);
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($targetX, $targetY);
        Start-Sleep -Milliseconds 20;
        if ('${type}' -eq 'right') {
          [Win32.Win32Mouse]::mouse_event(0x08, 0, 0, 0, 0);
          [Win32.Win32Mouse]::mouse_event(0x10, 0, 0, 0, 0);
        } else {
          [Win32.Win32Mouse]::mouse_event(0x02, 0, 0, 0, 0);
          [Win32.Win32Mouse]::mouse_event(0x04, 0, 0, 0, 0);
        }
        [Console]::Out.Write('CLICKED:' + $targetX + ':' + $targetY);
      `;
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;
      exec(cmd, (err, stdout) => {
        resolve({ success: !err, output: stdout ? stdout.trim() : '', bridge: 'powershell' });
      });
    });
  }

  /**
   * Types text string into the active Windows window.
   * Utilizes native Win32 SendInput Unicode injection (< 5ms latency, injection safe).
   */
  typeText(text) {
    return new Promise((resolve) => {
      if (!text) return resolve({ success: true });

      if (fs.existsSync(this.bridgeExePath)) {
        const b64 = Buffer.from(text, 'utf8').toString('base64');
        execFile(this.bridgeExePath, ['type', `b64:${b64}`], (err) => {
          if (!err) {
            return resolve({ success: true, bridge: 'native' });
          }
          this._fallbackType(text).then(resolve);
        });
      } else {
        this._fallbackType(text).then(resolve);
      }
    });
  }

  _fallbackType(text) {
    return new Promise((resolve) => {
      // Escape single quotes and SendKeys control characters
      const sanitized = text.replace(/'/g, "''").replace(/[{}+^%~()\[\]]/g, '{$&}');
      const script = `
        Add-Type -AssemblyName System.Windows.Forms;
        [System.Windows.Forms.SendKeys]::SendWait('${sanitized}');
      `;
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;
      exec(cmd, (err) => {
        resolve({ success: !err, bridge: 'powershell' });
      });
    });
  }

  /**
   * Sends hotkey combination to Windows.
   * Utilizes native Win32 keybd_event (< 2ms latency).
   */
  sendHotkey(keyName) {
    return new Promise((resolve) => {
      if (fs.existsSync(this.bridgeExePath)) {
        execFile(this.bridgeExePath, ['hotkey', keyName], (err) => {
          if (!err) {
            return resolve({ success: true, bridge: 'native' });
          }
          this._fallbackHotkey(keyName).then(resolve);
        });
      } else {
        this._fallbackHotkey(keyName).then(resolve);
      }
    });
  }

  _fallbackHotkey(keyName) {
    return new Promise((resolve) => {
      let sendKey = '';
      if (keyName === 'win_d') {
        sendKey = '(New-Object -ComObject Shell.Application).ToggleDesktop();';
      } else if (keyName === 'alt_tab') {
        sendKey = '[System.Windows.Forms.SendKeys]::SendWait("%{TAB}");';
      } else if (keyName === 'enter') {
        sendKey = '[System.Windows.Forms.SendKeys]::SendWait("{ENTER}");';
      } else if (keyName === 'backspace') {
        sendKey = '[System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}");';
      } else if (keyName === 'esc') {
        sendKey = '[System.Windows.Forms.SendKeys]::SendWait("{ESC}");';
      } else if (keyName === 'ctrl_c') {
        sendKey = '[System.Windows.Forms.SendKeys]::SendWait("^c");';
      } else if (keyName === 'ctrl_v') {
        sendKey = '[System.Windows.Forms.SendKeys]::SendWait("^v");';
      } else if (keyName === 'lock') {
        sendKey = 'rundll32.exe user32.dll,LockWorkStation;';
      } else if (keyName === 'taskmgr') {
        sendKey = 'Start-Process taskmgr;';
      } else {
        sendKey = `[System.Windows.Forms.SendKeys]::SendWait('${keyName}');`;
      }

      const script = `
        Add-Type -AssemblyName System.Windows.Forms;
        ${sendKey}
      `;
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;
      exec(cmd, (err) => {
        resolve({ success: !err, bridge: 'powershell' });
      });
    });
  }
}

module.exports = new PcRemoteController();

