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

    private static final List<String> ALLOWED_PACKAGES = Arrays.asList(
        "com.google.android.apps.nbu.paisa.user", // GPay
        "net.one97.paytm",                         // Paytm
        "com.phonepe.app",                         // PhonePe
        "in.amazon.mShop.android.shopping",        // Amazon Pay
        "com.fampay.in",                           // FamPay
        "com.mobikwik_new",                        // MobiKwik
        "com.csam.icici.bank.imobile",             // ICICI iMobile
        "com.hdfcbank.hdfcmobilebanking",          // HDFC Mobile
        "com.sbi.SBIFreedomPlus",                  // SBI YONO
        "com.google.android.apps.messaging"        // SMS App
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String packageName = sbn.getPackageName();
            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;

            CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE, "");
            String title = titleSeq != null ? titleSeq.toString() : "";

            // read EXTRA_BIG_TEXT first, then fallback to EXTRA_TEXT
            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence text    = extras.getCharSequence(Notification.EXTRA_TEXT);
            String body = bigText != null ? bigText.toString()
                        : text != null    ? text.toString()
                        : "";

            Log.d(TAG, "--- Notification Received ---");
            Log.d(TAG, "Package : " + packageName);
            Log.d(TAG, "Title   : " + title);
            Log.d(TAG, "Body    : " + body);

            if (!ALLOWED_PACKAGES.contains(packageName)) {
                Log.d(TAG, "⏩ Ignoring non-financial app: " + packageName);
                return;
            }

            if (body.isEmpty()) {
                Log.d(TAG, "⚠️ Body is empty, skipping.");
                return;
            }
            
            String fullText = title + " " + body;

            Log.d(TAG, "📥 Queuing raw notification text from: " + packageName);
            
            queueRawTransaction("notification", packageName, fullText);
            
            // Also notify live if app is open
            PassbookPlugin.sendTransactionToJS("notification", fullText);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onNotificationPosted", e);
        }
    }

    private void queueRawTransaction(String source, String packageName, String raw) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(existing);

            JSONObject entry = new JSONObject();
            entry.put("source", source);
            entry.put("package_name", packageName);
            entry.put("raw", raw);
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Raw Notification Queued. Total pending: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue raw transaction", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {}
}
