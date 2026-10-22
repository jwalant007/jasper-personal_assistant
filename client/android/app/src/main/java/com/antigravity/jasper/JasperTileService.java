package com.antigravity.jasper;

import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import androidx.annotation.RequiresApi;

@RequiresApi(api = Build.VERSION_CODES.N)
public class JasperTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_ACTIVE);
            tile.setLabel("JASPER Voice");
            tile.setContentDescription("Tap to invoke JASPER Assistant");
            tile.updateTile();
        }
    }

    @Override
    public void onClick() {
        super.onClick();
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.setAction(Intent.ACTION_ASSIST);
            intent.putExtra("mode", "mobile_assistant");
            intent.putExtra("auto_wake", true);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // Android 14+
                startActivityAndCollapse(intent);
            } else {
                startActivityAndCollapse(intent);
            }
        } catch (Exception e) {
            // Fallback for security exceptions
        }
    }
}
