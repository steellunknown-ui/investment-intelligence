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
import java.util.Arrays;
import java.util.List;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG        = "SMSReceiver";
    private static final String PREFS_NAME = "PendingTransactions";
    private static final String PREFS_KEY  = "queue";

    // Common Indian Bank/Payment sender IDs
    private static final List<String> SENDER_KEYWORDS = Arrays.asList(
        "BANK", "PAY", "UPI", "NEFT", "FAMPAY", "HDFCBK", "SBI", "ICICI", "AXIS", "KOTAK", "PAYTM", "GPAY", "PHONEPE"
    );

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

            if (messageBody == null || messageBody.isEmpty() || sender == null) continue;

            Log.d(TAG, "✉️ SMS Received from: " + sender);
            
            boolean isFinance = false;
            String upperSender = sender.toUpperCase();
            for (String key : SENDER_KEYWORDS) {
                if (upperSender.contains(key)) {
                    isFinance = true;
                    break;
                }
            }

            if (isFinance || messageBody.length() > 30) {
                Log.d(TAG, "📥 Queuing SMS for parsing from: " + sender);
                queueRawTransaction(context, sender, messageBody);
                
                // Notify live if app is open
                PassbookPlugin.sendTransactionToJS("sms", messageBody);
            }
        }
    }

    private void queueRawTransaction(Context context, String sender, String raw) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(existing);

            JSONObject entry = new JSONObject();
            entry.put("source", "sms");
            entry.put("sender", sender);
            entry.put("raw", raw);
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Raw SMS Queued. Total: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue SMS", e);
        }
    }
}
