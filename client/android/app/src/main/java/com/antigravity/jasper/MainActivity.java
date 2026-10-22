package com.antigravity.jasper;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request runtime Camera and Audio permissions if not granted
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        };

        boolean needsRequest = false;
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                needsRequest = true;
                break;
            }
        }

        if (needsRequest) {
            ActivityCompat.requestPermissions(this, permissions, 101);
        }

        // Configure WebView WebChromeClient to grant media permission requests (Camera/Mic)
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        request.grant(request.getResources());
                    });
                }
            });
        }

        handleAssistantIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleAssistantIntent(intent);
    }

    private void handleAssistantIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        boolean isAssist = Intent.ACTION_ASSIST.equals(action) || 
                           Intent.ACTION_VOICE_COMMAND.equals(action) ||
                           "mobile_assistant".equals(intent.getStringExtra("mode"));

        if (isAssist) {
            // When invoked as Default Assistant or via Quick Settings / Gesture,
            // route WebView directly into the Siri/Google Assistant overlay mode
            runOnUiThread(() -> {
                try {
                    if (this.bridge != null && this.bridge.getWebView() != null) {
                        this.bridge.getWebView().evaluateJavascript(
                            "if (typeof window !== 'undefined') {" +
                            "  if (!window.location.search.includes('mode=mobile_assistant')) {" +
                            "    window.location.href = '/?mode=mobile_assistant&auto_wake=true';" +
                            "  }" +
                            "}", null
                        );
                    }
                } catch (Exception ignored) {}
            });
        }
    }
}
