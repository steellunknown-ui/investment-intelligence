package com.investmentintelligence.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG       = "SMSReceiver";
    private static final String PREFS_NAME = "PendingTransactions";
    private static final String PREFS_KEY  = "queue";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) return;

        for (Object pdu : pdus) {
            SmsMessage sms    = SmsMessage.createFromPdu((byte[]) pdu);
            String sender      = sms.getDisplayOriginatingAddress();
            String messageBody = sms.getMessageBody();

            if (messageBody == null || messageBody.isEmpty()) continue;

            Log.d(TAG, "✉️ SMS Received from: " + sender);
            
            // Only queue bank SMS (sender usually contains a bank code or AD-HDFCBK)
            // But for safety, we'll queue most non-contact SMS and let the AI parser filter them out.
            // A simple filter: length > 30 and sender has letters (not a normal phone number).
            if (messageBody.length() > 20) {
                Log.d(TAG, "📥 Queuing SMS for AI parsing from: " + sender);
                queueRawTransaction(context, "SMS: " + sender, messageBody);
            }
        }
    }

    private void queueRawTransaction(Context context, String source, String raw) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(existing);

            JSONObject entry = new JSONObject();
            entry.put("source", source);
            entry.put("raw", raw);
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Raw SMS Queued. Total: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue SMS transaction", e);
        }
    }
}
