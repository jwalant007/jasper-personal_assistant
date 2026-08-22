const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class PcRemoteController {
  constructor() {
    this.scratchDir = path.join(__dirname, '../scratch');
    if (!fs.existsSync(this.scratchDir)) {
      try { fs.mkdirSync(this.scratchDir, { recursive: true }); } catch (e) {}
    }
  }

  /**
   * Captures the host Windows desktop screen as a Base64 JPEG image.
   */
  getScreenCapture() {
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
        if (err || !stdout) {
          return resolve(null);
        }
        const match = stdout.match(/DATA_START:([\s\S]*?):DATA_END/);
        if (match && match[1]) {
          const b64 = match[1].trim();
          resolve(`data:image/jpeg;base64,${b64}`);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Simulates mouse click at coordinate (xPercent, yPercent) on the Windows screen.
   */
  clickMouse(xPercent, yPercent, type = 'left') {
    return new Promise((resolve) => {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms;
        $code = '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);';
        $type = Add-Type -MemberDefinition $code -Name 'Win32Mouse' -Namespace 'Win32' -PassThru;

        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
        $targetX = [int]($bounds.Width * ${xPercent} / 100);
        $targetY = [int]($bounds.Height * ${yPercent} / 100);

        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($targetX, $targetY);
        Start-Sleep -Milliseconds 50;

        if ('${type}' -eq 'right') {
          [Win32.Win32Mouse]::mouse_event(0x08, 0, 0, 0, 0);
          [Win32.Win32Mouse]::mouse_event(0x10, 0, 0, 0, 0);
        } else {
          [Win32.Win32Mouse]::mouse_event(0x02, 0, 0, 0, 0);
          [Win32.Win32Mouse]::mouse_event(0x04, 0, 0, 0, 0);
          if ('${type}' -eq 'double') {
            Start-Sleep -Milliseconds 100;
            [Win32.Win32Mouse]::mouse_event(0x02, 0, 0, 0, 0);
            [Win32.Win32Mouse]::mouse_event(0x04, 0, 0, 0, 0);
          }
        }
        [Console]::Out.Write('CLICKED:' + $targetX + ':' + $targetY);
      `;

      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;

      exec(cmd, (err, stdout) => {
        resolve({ success: !err, output: stdout ? stdout.trim() : '' });
      });
    });
  }

  /**
   * Types text string into the active Windows window.
   */
  typeText(text) {
    return new Promise((resolve) => {
      const sanitized = text.replace(/[{}+^%~()\[\]]/g, '{$&}');
      const script = `
        Add-Type -AssemblyName System.Windows.Forms;
        [System.Windows.Forms.SendKeys]::SendWait('${sanitized}');
      `;

      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;

      exec(cmd, (err) => {
        resolve({ success: !err });
      });
    });
  }

  /**
   * Sends hotkey combination to Windows.
   */
  sendHotkey(keyName) {
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
        resolve({ success: !err });
      });
    });
  }
}

module.exports = new PcRemoteController();
