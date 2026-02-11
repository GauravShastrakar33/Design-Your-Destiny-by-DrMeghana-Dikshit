package com.dyd.drmeghana;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle; // Added
import androidx.core.view.WindowCompat; // Added

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // This line tells the Android OS (especially ColorOS/OxygenOS):
        // "Respect the system bars. Do not let my webview slide behind the clock."
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
