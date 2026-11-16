package com.investmentintelligence.app;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "PassbookPlugin",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS }
        )
    }
)
public class PassbookPlugin extends Plugin {
    private static final String TAG = "PassbookPlugin";
    private static final String PREFS_NAME = "PendingTransactions";
    private static final String PREFS_KEY = "queue";

    private static PassbookPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.d(TAG, "✅ PassbookPlugin loaded — instance ready.");
    }

    @PluginMethod
    public void sync(PluginCall call) {
        Log.d(TAG, "🔄 Sync called from JS — ensuring queue is drained.");
        drainPendingQueue();
        call.resolve();
    }

    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        boolean smsGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean notifGranted = isNotificationServiceEnabled();
        ret.put("smsPermission", smsGranted);
        ret.put("notificationAccess", notifGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSMSPermission(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
        }
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        boolean smsGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", smsGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", ctx.getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open app settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open notification settings: " + e.getMessage());
        }
    }

    public static boolean sendTransactionToJS(String source, String raw) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("source", source);
            ret.put("raw", raw);
            instance.notifyListeners("onTransactionDetected", ret);
            Log.d(TAG, "📤 Transaction sent to JS: " + source);
            return true;
        }
        Log.d(TAG, "⚠️ instance is null — app is in background");
        return false;
    }

    private synchronized void drainPendingQueue() {
        try {
            Context ctx = getContext();
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(raw);

            if (queue.length() == 0) {
                Log.d(TAG, "📭 No pending transactions.");
                return;
            }

            Log.d(TAG, "📬 Draining " + queue.length() + " pending raw transactions...");

            for (int i = 0; i < queue.length(); i++) {
                JSONObject entry = queue.getJSONObject(i);
                JSObject ret = new JSObject();
                ret.put("source", entry.optString("source", "Unknown"));
                ret.put("raw",    entry.optString("raw", ""));
                notifyListeners("onTransactionDetected", ret);
            }

            prefs.edit().putString(PREFS_KEY, "[]").apply();
            Log.d(TAG, "✅ Queue drained and cleared.");

        } catch (JSONException e) {
            Log.e(TAG, "Failed to drain pending queue", e);
        }
    }

    private boolean isNotificationServiceEnabled() {
        Context context = getContext();
        String pkgName = context.getPackageName();
        final String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        if (flat != null && !flat.isEmpty()) {
            final String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && pkgName.equals(cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }
}
