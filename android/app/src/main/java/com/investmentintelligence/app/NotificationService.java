package com.investmentintelligence.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.app.Notification;
import android.os.Bundle;
import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

public class NotificationService extends NotificationListenerService {
    private static final String TAG = "NotificationService";
    private static final String PREFS_NAME = "PendingTransactions";
    private static final String PREFS_KEY = "queue";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        String title = extras.getString(Notification.EXTRA_TITLE, "");

        // FIX 1: FamPay uses BigTextStyle — read EXTRA_BIG_TEXT first, then fallback to EXTRA_TEXT
        CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        CharSequence text    = extras.getCharSequence(Notification.EXTRA_TEXT);
        String body = bigText != null ? bigText.toString()
                    : text != null    ? text.toString()
                    : "";

        Log.d(TAG, "--- Notification Received ---");
        Log.d(TAG, "Package : " + packageName);
        Log.d(TAG, "Title   : " + title);
        Log.d(TAG, "Body    : " + body);

        if (body.isEmpty()) return;

        // FIX 2: Combine title + body so patterns like "#fampaid ... sent ₹5" are captured
        String fullText = title + " " + body;

        com.getcapacitor.JSObject parsed = TransactionParser.parse(fullText);

        // If full-text parse failed, try body alone
        if (parsed == null) {
            parsed = TransactionParser.parse(body);
        }

        if (parsed != null) {
            Log.d(TAG, "✅ Transaction Parsed: " + parsed.toString());
            try {
                boolean sent = PassbookPlugin.sendTransactionToJS(
                    parsed.getString("source"),
                    parsed.getString("merchant"),
                    parsed.getDouble("amount"),
                    parsed.getString("type"),
                    body
                );

                // FIX 3: If app is in background (sent=false), queue the transaction locally
                if (!sent) {
                    Log.d(TAG, "⚠️ App in background — queuing transaction to SharedPreferences");
                    queueTransaction(parsed.getString("source"),
                                     parsed.getString("merchant"),
                                     parsed.getDouble("amount"),
                                     parsed.getString("type"),
                                     body);
                }
            } catch (JSONException e) {
                Log.e(TAG, "Error reading parsed transaction fields", e);
            }
        } else {
            Log.d(TAG, "❌ No transaction pattern matched for: " + fullText);
        }
    }

    /**
     * Saves a parsed transaction into SharedPreferences as a JSON queue.
     * This is drained by PassbookPlugin when the app next opens.
     */
    private void queueTransaction(String source, String merchant, double amount, String type, String raw) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(existing);

            JSONObject entry = new JSONObject();
            entry.put("source", source);
            entry.put("merchant", merchant);
            entry.put("amount", amount);
            entry.put("type", type);
            entry.put("raw", raw);
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Queued. Total pending: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue transaction", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed
    }
}
