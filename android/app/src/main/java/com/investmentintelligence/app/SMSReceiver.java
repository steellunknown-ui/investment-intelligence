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

    // Known Indian Bank & Fintech Sender Keywords
    private static final List<String> SENDER_KEYWORDS = Arrays.asList(
        "BANK", "PAY", "UPI", "NEFT", "IMPS", "FAMPAY", "HDFCBK", "SBI", "ICICI",
        "AXIS", "KOTAK", "PAYTM", "GPAY", "PHONEPE", "BOB", "BARODA", "BOBSMS",
        "BOBTXN", "CANARA", "UNIONB", "PNB", "IDFC", "SLICE", "CRED", "NAVI", "INDUS"
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

            // 1. STRICT FILTER: Reject 10-12 digit personal phone numbers (friends/family/contacts)
            // Authentic Indian bank SMS NEVER come from 10-digit mobile numbers!
            if (sender.matches("^(\\+91|91|0)?[6-9]\\d{9}$") || sender.matches("^\\+?[0-9]{10,13}$")) {
                Log.d(TAG, "⛔ Rejecting personal SMS from contact/phone number: " + sender);
                continue;
            }

            // 2. Sender check: Financial keyword or official TRAI 6-character header
            // e.g. VK-BOBSMS, AD-HDFCBK, AX-SBIUPI, JM-FAMPAY
            boolean isFinance = false;
            String upperSender = sender.toUpperCase();
            for (String key : SENDER_KEYWORDS) {
                if (upperSender.contains(key)) {
                    isFinance = true;
                    break;
                }
            }

            boolean isTraiHeader = sender.matches("^[A-Za-z]{2}-[A-Za-z0-9]{5,8}$") || sender.matches("^[A-Za-z0-9]{5,8}$");

            if (isFinance || isTraiHeader) {
                Log.d(TAG, "📥 Queuing authentic financial SMS from: " + sender);
                queueRawTransaction(context, sender, messageBody);

                // Notify live if app is open (pipe format sender|messageBody)
                PassbookPlugin.sendTransactionToJS("sms", sender + "|" + messageBody);
            } else {
                Log.d(TAG, "⏩ Ignoring non-financial SMS sender: " + sender);
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
            entry.put("raw",    sender + "|" + raw);
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Raw SMS Queued. Total: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue SMS", e);
        }
    }
}
