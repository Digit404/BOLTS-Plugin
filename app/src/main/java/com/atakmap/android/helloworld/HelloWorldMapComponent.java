package com.atakmap.android.helloworld;

import android.content.Context;
import android.content.Intent;

import com.atakmap.android.dropdown.DropDownMapComponent;
import com.atakmap.android.helloworld.plugin.R;
import com.atakmap.android.ipc.AtakBroadcast.DocumentedIntentFilter;
import com.atakmap.android.maps.MapView;
import com.atakmap.coremap.log.Log;

public class HelloWorldMapComponent extends DropDownMapComponent {

    public static final String TAG = "HelloWorldMapComponent";

    private WebViewDropDownReceiver webViewDropDown;

    @Override
    public void onCreate(final Context context, Intent intent, final MapView view) {
        context.setTheme(R.style.ATAKPluginTheme);

        super.onCreate(context, intent, view);

        Log.d(TAG, "registering WebView dropdown");

        webViewDropDown = new WebViewDropDownReceiver(view, context);

        DocumentedIntentFilter webViewFilter = new DocumentedIntentFilter();
        webViewFilter.addAction(
                WebViewDropDownReceiver.SHOW_WEBVIEW,
                "Show WebView dropdown"
        );

        registerDropDownReceiver(webViewDropDown, webViewFilter);

        Log.d(TAG, "registered WebView dropdown");
    }

    @Override
    protected void onDestroyImpl(Context context, MapView view) {
        Log.d(TAG, "destroying WebView dropdown");

        if (webViewDropDown != null) {
            webViewDropDown.dispose();
            webViewDropDown = null;
        }

        super.onDestroyImpl(context, view);
    }
}