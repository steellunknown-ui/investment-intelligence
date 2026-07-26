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
import java.util.Arrays;
import java.util.List;

public class NotificationService extends NotificationListenerService {
    private static final String TAG = "NotificationService";
    private static final String PREFS_NAME = "PendingTransactions";
    private static final String PREFS_KEY = "queue";

    // Only process notifications from these financial apps
    private static final List<String> ALLOWED_PACKAGES = Arrays.asList(
        "com.google.android.apps.nbu.paisa.user", // GPay
        "net.one97.paytm",                         // Paytm
        "com.phonepe.app",                         // PhonePe
        "in.amazon.mShop.android.shopping",        // Amazon Pay
        "com.fampay.in",                           // FamPay
        "com.mobikwik_new",                        // MobiKwik
        "com.csam.icici.bank.imobile",             // ICICI iMobile
        "com.hdfcbank.hdfcmobilebanking",          // HDFC Mobile
        "com.sbi.SBIFreedomPlus"                   // SBI YONO
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String packageName = sbn.getPackageName();
            Log.d(TAG, "🔔 Detected Notification from: " + packageName);

            // Only process whitelisted financial apps for the Smart Passbook
            if (!ALLOWED_PACKAGES.contains(packageName)) {
                Log.d(TAG, "⏩ Ignoring non-financial app: " + packageName);
                return;
            }

            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;

            CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE, "");
            String title = titleSeq != null ? titleSeq.toString() : "";

            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence text    = extras.getCharSequence(Notification.EXTRA_TEXT);
            String body = bigText != null ? bigText.toString()
                        : text != null    ? text.toString()
                        : "";

            if (body.isEmpty()) return;
            
            String fullText = title + " - " + body;

            Log.d(TAG, "📥 Queuing Notification for AI parsing from: " + packageName);
            queueRawTransaction(packageName, fullText);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onNotificationPosted", e);
        }
    }

    private void queueRawTransaction(String source, String raw) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(existing);

            JSONObject entry = new JSONObject();
            entry.put("source", source);
            entry.put("raw", raw);
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Raw Notification Queued. Total pending: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue raw transaction", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed
    }
}
