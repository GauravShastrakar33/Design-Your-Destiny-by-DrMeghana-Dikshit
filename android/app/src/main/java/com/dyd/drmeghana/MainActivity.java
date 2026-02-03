package com.dyd.drmeghana;
import com.getcapacitor.BridgeActivity;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;

public class MainActivity extends BridgeActivity {

    @Override
    public void onStart() {
        super.onStart();

        getBridge().getWebView().setWebViewClient(new WebViewClient() {

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                // Load local offline page instead of showing URL error
                view.loadUrl("file:///android_asset/offline.html");
            }
        });
    }
}


