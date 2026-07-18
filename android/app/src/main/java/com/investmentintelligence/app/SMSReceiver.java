package com.investmentintelligence.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import org.json.JSONException;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();

                        Log.d(TAG, "SMS received from: " + sender);
                        Log.d(TAG, "Message: " + messageBody);

                        if (messageBody != null) {
                            try {
                                com.getcapacitor.JSObject parsed = TransactionParser.parse(messageBody);
                                if (parsed != null) {
                                    PassbookPlugin.sendTransactionToJS(
                                        parsed.getString("source"),
                                        parsed.getString("merchant"),
                                        parsed.getDouble("amount"),
                                        parsed.getString("type"),
                                        messageBody
                                    );
                                }
                            } catch (JSONException e) {
                                Log.e(TAG, "Error parsing transaction from SMS", e);
                            }
                        }
                    }
                }
            }
        }
    }
}
