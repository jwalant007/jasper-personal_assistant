param (
    [Parameter(Mandatory=$true)]
    [ValidateRange(0, 100)]
    [int]$Volume
)

# Load the C# VolumeControl class if not already loaded
$type = Get-Type -Name "VolumeControl" -ErrorAction SilentlyContinue
if (-not $type) {
    $code = @"
    using System;
    using System.Runtime.InteropServices;

    public class VolumeControl {
        [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IAudioEndpointVolume {
            int f1(); int f2(); int f3(); int f4();
            int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
            int GetMasterVolumeLevelScalar(out float pfLevel);
            int SetMute(bool bMute, Guid pguidEventContext);
            int GetMute(out bool pbMute);
        }

        [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IMMDevice {
            int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, out IAudioEndpointVolume ppInterface);
        }

        [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IMMDeviceEnumerator {
            int f1();
            int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
        }

        [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
        private class MMDeviceEnumerator {}

        public static void SetVolume(float percentage) {
            var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
            IMMDevice dev;
            // 0 = eRender (playback), 1 = eConsole
            int hr = enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (hr != 0) throw new Exception("Failed to get audio endpoint. HRESULT: " + hr);
            
            Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
            IAudioEndpointVolume epv;
            hr = dev.Activate(ref IID_IAudioEndpointVolume, 23, IntPtr.Zero, out epv); // 23 = CLSCTX_ALL
            if (hr != 0) throw new Exception("Failed to activate audio interface. HRESULT: " + hr);
            
            // Unmute first to make sure volume changes are audible
            epv.SetMute(false, Guid.Empty);
            
            hr = epv.SetMasterVolumeLevelScalar(percentage / 100f, Guid.Empty);
            if (hr != 0) throw new Exception("Failed to set master volume scalar. HRESULT: " + hr);
        }
    }
"@
    Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
}

[VolumeControl]::SetVolume($Volume)
Write-Output "Volume set to $Volume%"
