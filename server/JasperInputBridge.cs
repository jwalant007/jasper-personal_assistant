using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using System.Diagnostics;

namespace JasperInputBridge
{
    public class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        private static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        private static extern bool LockWorkStation();

        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP = 0x0010;

        private const byte VK_LWIN = 0x5B;
        private const byte VK_D = 0x44;
        private const uint KEYEVENTF_KEYUP = 0x0002;

        public static int Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine("Usage: JasperInputBridge.exe <capture|click|type|hotkey> [options...]");
                return 1;
            }

            string command = args[0].ToLowerInvariant();

            try
            {
                switch (command)
                {
                    case "capture":
                        int quality = 65;
                        double scale = 0.75;
                        int parsedQ;
                        if (args.Length > 1 && int.TryParse(args[1], out parsedQ)) quality = Math.Max(10, Math.Min(100, parsedQ));
                        double parsedS;
                        if (args.Length > 2 && double.TryParse(args[2], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out parsedS))
                        {
                            scale = Math.Max(0.2, Math.Min(1.0, parsedS));
                        }
                        CaptureScreen(quality, scale);
                        return 0;

                    case "click":
                        if (args.Length < 3)
                        {
                            Console.Error.WriteLine("Error: click requires xPercent and yPercent");
                            return 1;
                        }
                        double xPercent = double.Parse(args[1], System.Globalization.CultureInfo.InvariantCulture);
                        double yPercent = double.Parse(args[2], System.Globalization.CultureInfo.InvariantCulture);
                        string clickType = args.Length > 3 ? args[3].ToLowerInvariant() : "left";
                        ClickMouse(xPercent, yPercent, clickType);
                        return 0;

                    case "type":
                        if (args.Length < 2)
                        {
                            Console.Error.WriteLine("Error: type requires text (or base64 encoded text)");
                            return 1;
                        }
                        string text = args[1];
                        // If prefixed with b64:
                        if (text.StartsWith("b64:"))
                        {
                            byte[] bytes = Convert.FromBase64String(text.Substring(4));
                            text = Encoding.UTF8.GetString(bytes);
                        }
                        TypeText(text);
                        return 0;

                    case "hotkey":
                        if (args.Length < 2)
                        {
                            Console.Error.WriteLine("Error: hotkey requires keyName");
                            return 1;
                        }
                        SendHotkey(args[1]);
                        return 0;

                    default:
                        Console.Error.WriteLine("Unknown command: " + command);
                        return 1;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("ERROR:" + ex.ToString());
                return 2;
            }
        }

        [DllImport("user32.dll")]
        private static extern IntPtr GetDesktopWindow();

        [DllImport("user32.dll")]
        private static extern IntPtr GetWindowDC(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

        [DllImport("gdi32.dll")]
        private static extern bool BitBlt(IntPtr hObject, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hObjectSource, int nXSrc, int nYSrc, int dwRop);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateCompatibleBitmap(IntPtr hDC, int nWidth, int nHeight);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateCompatibleDC(IntPtr hDC);

        [DllImport("gdi32.dll")]
        private static extern bool DeleteDC(IntPtr hDC);

        [DllImport("gdi32.dll")]
        private static extern bool DeleteObject(IntPtr hObject);

        [DllImport("gdi32.dll")]
        private static extern IntPtr SelectObject(IntPtr hDC, IntPtr hObject);

        private const int SRCCOPY = 0x00CC0020;

        private static void CaptureScreen(int quality, double scale)
        {
            Rectangle bounds = Screen.PrimaryScreen.Bounds;
            IntPtr hDesktopWnd = GetDesktopWindow();
            IntPtr hDesktopDC = GetWindowDC(hDesktopWnd);
            IntPtr hMemDC = CreateCompatibleDC(hDesktopDC);
            IntPtr hBitmap = CreateCompatibleBitmap(hDesktopDC, bounds.Width, bounds.Height);
            IntPtr hOldBitmap = SelectObject(hMemDC, hBitmap);

            BitBlt(hMemDC, 0, 0, bounds.Width, bounds.Height, hDesktopDC, bounds.X, bounds.Y, SRCCOPY);
            SelectObject(hMemDC, hOldBitmap);

            using (Bitmap rawBitmap = Image.FromHbitmap(hBitmap))
            {
                DeleteObject(hBitmap);
                DeleteDC(hMemDC);
                ReleaseDC(hDesktopWnd, hDesktopDC);

                Bitmap finalBitmap = rawBitmap;
                bool isResized = false;

                if (Math.Abs(scale - 1.0) > 0.01)
                {
                    int scaledW = Math.Max(320, (int)(bounds.Width * scale));
                    int scaledH = Math.Max(240, (int)(bounds.Height * scale));
                    Bitmap scaledBitmap = new Bitmap(scaledW, scaledH);
                    using (Graphics sg = Graphics.FromImage(scaledBitmap))
                    {
                        sg.InterpolationMode = InterpolationMode.Bilinear;
                        sg.SmoothingMode = SmoothingMode.HighSpeed;
                        sg.PixelOffsetMode = PixelOffsetMode.HighSpeed;
                        sg.DrawImage(rawBitmap, 0, 0, scaledW, scaledH);
                    }
                    finalBitmap = scaledBitmap;
                    isResized = true;
                }

                try
                {
                    ImageCodecInfo jpegEncoder = GetEncoder(ImageFormat.Jpeg);
                    EncoderParameters encoderParams = new EncoderParameters(1);
                    encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)quality);

                    using (MemoryStream ms = new MemoryStream())
                    {
                        finalBitmap.Save(ms, jpegEncoder, encoderParams);
                        byte[] bytes = ms.ToArray();
                        string b64 = Convert.ToBase64String(bytes);
                        Console.Out.Write("DATA_START:" + b64 + ":DATA_END");
                    }
                }
                finally
                {
                    if (isResized)
                    {
                        finalBitmap.Dispose();
                    }
                }
            }
        }

        private static ImageCodecInfo GetEncoder(ImageFormat format)
        {
            ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
            foreach (ImageCodecInfo codec in codecs)
            {
                if (codec.FormatID == format.Guid)
                {
                    return codec;
                }
            }
            return null;
        }

        private static void ClickMouse(double xPercent, double yPercent, string type)
        {
            Rectangle bounds = Screen.PrimaryScreen.Bounds;
            int targetX = (int)(bounds.Width * (xPercent / 100.0));
            int targetY = (int)(bounds.Height * (yPercent / 100.0));

            SetCursorPos(targetX, targetY);
            System.Threading.Thread.Sleep(10);

            if (type == "right")
            {
                mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, UIntPtr.Zero);
                mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, UIntPtr.Zero);
            }
            else if (type == "double")
            {
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
                System.Threading.Thread.Sleep(50);
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
            }
            else
            {
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
            }

            Console.Out.Write("CLICKED:" + targetX + ":" + targetY);
        }

        private const uint INPUT_KEYBOARD = 1;
        private const uint KEYEVENTF_UNICODE = 0x0004;

        [StructLayout(LayoutKind.Sequential)]
        private struct INPUT
        {
            public uint type;
            public InputUnion u;
        }

        [StructLayout(LayoutKind.Explicit)]
        private struct InputUnion
        {
            [FieldOffset(0)]
            public KEYBDINPUT ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public UIntPtr dwExtraInfo;
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        private static void TypeText(string text)
        {
            if (string.IsNullOrEmpty(text)) return;

            INPUT[] inputs = new INPUT[text.Length * 2];
            int idx = 0;

            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];

                // Key down
                inputs[idx] = new INPUT();
                inputs[idx].type = INPUT_KEYBOARD;
                inputs[idx].u.ki.wVk = 0;
                inputs[idx].u.ki.wScan = (ushort)c;
                inputs[idx].u.ki.dwFlags = KEYEVENTF_UNICODE;
                inputs[idx].u.ki.time = 0;
                inputs[idx].u.ki.dwExtraInfo = UIntPtr.Zero;
                idx++;

                // Key up
                inputs[idx] = new INPUT();
                inputs[idx].type = INPUT_KEYBOARD;
                inputs[idx].u.ki.wVk = 0;
                inputs[idx].u.ki.wScan = (ushort)c;
                inputs[idx].u.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
                inputs[idx].u.ki.time = 0;
                inputs[idx].u.ki.dwExtraInfo = UIntPtr.Zero;
                idx++;
            }

            SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
            Console.Out.Write("TYPED:OK");
        }

        private static void SendSingleKey(byte vk, bool alt = false, bool ctrl = false)
        {
            const byte VK_MENU = 0x12;
            const byte VK_CONTROL = 0x11;

            if (ctrl) keybd_event(VK_CONTROL, 0, 0, UIntPtr.Zero);
            if (alt) keybd_event(VK_MENU, 0, 0, UIntPtr.Zero);

            keybd_event(vk, 0, 0, UIntPtr.Zero);
            keybd_event(vk, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);

            if (alt) keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            if (ctrl) keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }

        private static void SendHotkey(string keyName)
        {
            string k = keyName.ToLowerInvariant().Trim();

            if (k == "win_d")
            {
                keybd_event(VK_LWIN, 0, 0, UIntPtr.Zero);
                keybd_event(VK_D, 0, 0, UIntPtr.Zero);
                keybd_event(VK_D, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
            else if (k == "alt_tab")
            {
                SendSingleKey(0x09, alt: true); // Tab with Alt
            }
            else if (k == "enter")
            {
                SendSingleKey(0x0D); // VK_RETURN
            }
            else if (k == "backspace")
            {
                SendSingleKey(0x08); // VK_BACK
            }
            else if (k == "esc")
            {
                SendSingleKey(0x1B); // VK_ESCAPE
            }
            else if (k == "ctrl_c")
            {
                SendSingleKey(0x43, ctrl: true); // 'C' with Ctrl
            }
            else if (k == "ctrl_v")
            {
                SendSingleKey(0x56, ctrl: true); // 'V' with Ctrl
            }
            else if (k == "lock")
            {
                LockWorkStation();
            }
            else if (k == "taskmgr")
            {
                Process.Start("taskmgr.exe");
            }
            else
            {
                // Try sending as text
                TypeText(keyName);
            }

            Console.Out.Write("HOTKEY:OK");
        }
    }
}
