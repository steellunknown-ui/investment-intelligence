package com.investmentintelligence.app;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.app.Notification;
import android.os.Bundle;
import org.json.JSONException;

public class NotificationService extends NotificationListenerService {
    private static final String TAG = "NotificationService";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        String title = extras.getString(Notification.EXTRA_TITLE);
        CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);

        Log.d(TAG, "Notification received from: " + packageName);
        Log.d(TAG, "Title: " + title);
        Log.d(TAG, "Text: " + text);

        if (text != null) {
            com.getcapacitor.JSObject parsed = TransactionParser.parse(text.toString());
            if (parsed != null) {
                Log.d(TAG, "Parsed Transaction: " + parsed.toString());
                try {
                    PassbookPlugin.sendTransactionToJS(
                        parsed.getString("source"),
                        parsed.getString("merchant"),
                        parsed.getDouble("amount"),
                        parsed.getString("type"),
                        text.toString()
                    );
                } catch (JSONException e) {
                    Log.e(TAG, "Error parsing transaction JSON", e);
                }
            }
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed for now
    }
}
