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
        Log.d(TAG, "✅ PassbookPlugin loaded — draining pending queue...");
        // Drain any transactions that were captured while app was closed
        drainPendingQueue();
    }

    /**
     * Sends a transaction event to the JavaScript/WebView layer.
     * Returns true if sent successfully, false if the app is in the background.
     */
    public static boolean sendTransactionToJS(String source, String merchant, double amount, String type, String raw) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("source", source);
            ret.put("merchant", merchant);
            ret.put("amount", amount);
            ret.put("type", type);
            ret.put("raw", raw);
            instance.notifyListeners("onTransactionDetected", ret);
            Log.d(TAG, "📤 Transaction sent to JS: " + merchant + " ₹" + amount);
            return true; // successfully sent
        }
        Log.d(TAG, "⚠️ instance is null — app is in background");
        return false; // app is in background, caller should queue
    }

    /**
     * When the app opens, check SharedPreferences for any pending transactions
     * that were saved while the app was closed, and fire them to the JS layer.
     */
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

            Log.d(TAG, "📬 Draining " + queue.length() + " pending transactions...");

            for (int i = 0; i < queue.length(); i++) {
                JSONObject entry = queue.getJSONObject(i);
                JSObject ret = new JSObject();
                ret.put("source",   entry.getString("source"));
                ret.put("merchant", entry.getString("merchant"));
                ret.put("amount",   entry.getDouble("amount"));
                ret.put("type",     entry.getString("type"));
                ret.put("raw",      entry.getString("raw"));
                notifyListeners("onTransactionDetected", ret);
            }

            // Clear the queue after draining
            prefs.edit().putString(PREFS_KEY, "[]").apply();
            Log.d(TAG, "✅ Queue drained and cleared.");

        } catch (JSONException e) {
            Log.e(TAG, "Failed to drain pending queue", e);
        }
    }
}
