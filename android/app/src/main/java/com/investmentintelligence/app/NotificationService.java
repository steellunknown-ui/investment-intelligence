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
import java.util.HashSet;
import java.util.Set;

public class NotificationService extends NotificationListenerService {
    private static final String TAG        = "NotificationService";
    private static final String PREFS_NAME = "PendingTransactions";
    private static final String PREFS_KEY  = "queue";

    // ── Whitelisted UPI / Fintech / Bank Apps ──────────────────────────────────
    private static final Set<String> ALLOWED_PACKAGES = new HashSet<>(Arrays.asList(
        // UPI / Payment Apps
        "com.google.android.apps.nbu.paisa.user",  // GPay
        "net.one97.paytm",                          // Paytm
        "com.phonepe.app",                          // PhonePe
        "in.amazon.mShop.android.shopping",         // Amazon Pay
        "com.mobikwik_new",                         // MobiKwik
        "com.freecharge.android",                   // FreeCharge
        "com.bbps.app",                             // BBPS
        // Fintech / Neo-banks / Credit Card apps
        "com.fampay.in",                            // FamPay
        "com.navi.in",                              // NAVI
        "com.slicepay",                             // Slice
        "com.cred.club",                            // CRED
        "co.jupiter",                               // Jupiter
        "com.niyo.global",                          // Niyo
        "com.onecard.app",                          // OneCard
        "com.freo.app",                             // Freo
        "com.kreditbee.app",                        // KreditBee
        "com.zestmoney.app",                        // ZestMoney
        // Bank Mobile Apps
        "com.bankofbaroda.mconnect",                // Bank of Baroda (BOB World)
        "com.csam.icici.bank.imobile",              // ICICI iMobile
        "com.hdfcbank.hdfcmobilebanking",           // HDFC NetBanking
        "com.sbi.SBIFreedomPlus",                   // SBI YONO
        "com.axis.mobile",                          // Axis Mobile
        "com.kotak.mahindra.kotak800",              // Kotak
        "com.idfc.firstbank",                       // IDFC First
        "com.indusind.mobile",                      // IndusInd
        "com.msf.kbank.mobile",                     // KotakElite
        "com.pnb.mobilebanking",                    // PNB
        "com.yesbank",                              // Yes Bank
        // SMS apps — filtered strictly below
        "com.google.android.apps.messaging",        // Google Messages
        "com.android.mms",                          // Stock SMS app
        "org.thoughtcrime.securesms"                // Signal
    ));

    // ── Known bank / payment sender‑ID keywords ────────────────────────────────
    private static final String[] BANK_SENDER_KEYWORDS = {
        "BOB", "BARODA", "BOBSMS", "BOBTXN",
        "HDFC", "HDFCBK", "HDFCBANK",
        "SBI", "SBIINB", "SBIUPI", "SBIPSG", "SBICRD",
        "ICICI", "ICICIB", "ICICIS",
        "AXIS", "AXISBK", "AXISBNK",
        "KOTAK", "KOTAKB",
        "PAYTM", "PAYTMB",
        "GPAY", "GOOGLEPAY",
        "PHONEPE", "PHPE",
        "FAMPAY", "FAM",
        "IDFC", "IDFCFB",
        "YESBNK", "YESBK",
        "INDUSIND", "INDBNK",
        "CANARA", "CANBNK",
        "PNB", "PNBSMS",
        "UNIONB", "UNION",
        "AMAZON", "AMZPAY",
        "MOBIKWIK", "MBKWK",
        "NAVI", "SLICE", "CRED",
        "NEFT", "IMPS", "UPI", "RTGS",
        "BANK", "FINANC"
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String packageName = sbn.getPackageName();

            // ── 1. Drop Truecaller duplicate notifications ─────────────────────
            // Truecaller intercepts SMS and posts duplicate notifications; drop them!
            if (packageName.equals("com.truecaller") || packageName.contains("truecaller")) {
                Log.d(TAG, "⛔ Dropping Truecaller notification to avoid duplicate entries");
                return;
            }

            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;

            // Extract title and text
            CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE, "");
            String title = (titleSeq != null) ? titleSeq.toString() : "";

            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence text    = extras.getCharSequence(Notification.EXTRA_TEXT);
            String body = (bigText != null) ? bigText.toString()
                        : (text   != null)  ? text.toString()
                        : "";

            Log.d(TAG, "--- Notification ---  pkg=" + packageName + "  title=" + title + "  body=" + body);

            // ── 2. Filter SMS apps ─────────────────────────────────────────────
            boolean isSmsApp = packageName.equals("com.google.android.apps.messaging")
                            || packageName.equals("com.android.mms")
                            || packageName.equals("org.thoughtcrime.securesms");

            if (isSmsApp) {
                // Reject if title is a personal phone number (friend/contact chat)
                if (title.matches("^(\\+91|91|0)?[6-9]\\d{9}$") || title.matches("^\\+?[0-9]{10,13}$")) {
                    Log.d(TAG, "⛔ Skipping SMS app notification from personal number: " + title);
                    return;
                }
                if (!isBankSender(title) && !isBankSender(body)) {
                    Log.d(TAG, "⛔ Skipping personal SMS: " + title);
                    return;
                }
            } else if (!ALLOWED_PACKAGES.contains(packageName)) {
                Log.d(TAG, "⏩ Ignoring non-financial app: " + packageName);
                return;
            }

            if (body.isEmpty()) {
                Log.d(TAG, "⚠️ Empty body — skip.");
                return;
            }

            // Combine title + body for the parser
            String fullText = title + " " + body;

            Log.d(TAG, "📥 Queuing for parse: " + packageName);
            queueRawTransaction("notification", packageName, fullText);

            // Live push to JS if app is foregrounded
            PassbookPlugin.sendTransactionToJS("notification", packageName + "|" + fullText);

        } catch (Exception e) {
            Log.e(TAG, "Error in onNotificationPosted", e);
        }
    }

    private boolean isBankSender(String text) {
        if (text == null) return false;
        String upper = text.toUpperCase();
        for (String kw : BANK_SENDER_KEYWORDS) {
            if (upper.contains(kw)) return true;
        }
        return false;
    }

    private void queueRawTransaction(String source, String packageName, String raw) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray queue = new JSONArray(existing);

            JSONObject entry = new JSONObject();
            entry.put("source",       source);
            entry.put("package_name", packageName);
            entry.put("raw",          raw);
            entry.put("timestamp",    System.currentTimeMillis());
            queue.put(entry);

            prefs.edit().putString(PREFS_KEY, queue.toString()).apply();
            Log.d(TAG, "📥 Queued. Pending: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue transaction", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {}
}
