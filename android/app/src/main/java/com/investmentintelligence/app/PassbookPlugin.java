package com.investmentintelligence.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "PassbookPlugin")
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

    @com.getcapacitor.PluginMethod
    public void sync(com.getcapacitor.PluginCall call) {
        Log.d(TAG, "🔄 Sync called from JS — ensuring queue is drained.");
        drainPendingQueue();
        call.resolve();
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

    private void drainPendingQueue() {
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
}
