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
import java.util.regex.Pattern;

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
        "in.org.npci.upiapp",                       // BHIM UPI
        "com.whatsapp",                             // WhatsApp (UPI payments)
        "com.whatsapp.w4b",                         // WhatsApp Business

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
        "com.epifi.slice",                          // Fi Money

        // Bank Mobile Apps
        "com.bankofbaroda.mconnect",                // Bank of Baroda (BOB World)
        "com.csam.icici.bank.imobile",              // ICICI iMobile
        "com.hdfcbank.hdfcmobilebanking",           // HDFC NetBanking
        "com.sbi.SBIFreedomPlus",                   // SBI YONO
        "com.sbi.lotusintouch",                     // SBI YONO Lite
        "com.axis.mobile",                          // Axis Mobile
        "com.kotak.mahindra.kotak800",              // Kotak 811
        "com.idfc.firstbank",                       // IDFC First
        "com.indusind.mobile",                      // IndusInd
        "com.msf.kbank.mobile",                     // Kotak Elite
        "com.pnb.mobilebanking",                    // PNB One
        "com.yesbank",                              // Yes Bank
        "com.canarabank.mobility",                  // Canara ai1
        "com.unionbank.online",                     // Union Bank Vyom
        "com.rblbank.mobank",                       // RBL MoBank
        "com.fedmobile",                            // FedMobile (Federal Bank)
        "com.sc.mobile.in",                         // Standard Chartered
        "com.standardchartered.mobile"              // Standard Chartered
    ));

    // ── Known bank / payment sender keywords ────────────────────────────────
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
        "NAVI", "SLICE", "CRED", "JUPITER",
        "NEFT", "IMPS", "UPI", "RTGS",
        "BANK", "FINANC"
    };

    // Regex patterns for financial transactional alerts across any app
    private static final Pattern FINANCIAL_AMOUNT_PATTERN = Pattern.compile(
        "(?:[₹]|rs\\.?|inr)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern FINANCIAL_ACTION_PATTERN = Pattern.compile(
        "\\b(debited|credited|dr\\.?|cr\\.?|paid|spent|transferred|withdrawn|deposited|sent|received|vpa|a/c|acct)\\b",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String packageName = sbn.getPackageName();
            if (packageName == null) return;
            String lowerPkg = packageName.toLowerCase();

            Notification notification = sbn.getNotification();
            if (notification == null) return;
            Bundle extras = notification.extras;
            if (extras == null) return;

            // Extract all title and text layers
            CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE, "");
            String title = (titleSeq != null) ? titleSeq.toString().trim() : "";

            CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
            CharSequence summaryText = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT);

            StringBuilder bodyBuilder = new StringBuilder();
            if (text != null && text.length() > 0) {
                bodyBuilder.append(text.toString().trim());
            }
            if (bigText != null && bigText.length() > 0 && !bigText.toString().trim().equals(bodyBuilder.toString())) {
                if (bodyBuilder.length() > 0) bodyBuilder.append(" ");
                bodyBuilder.append(bigText.toString().trim());
            }
            if (subText != null && subText.length() > 0) {
                if (bodyBuilder.length() > 0) bodyBuilder.append(" ");
                bodyBuilder.append(subText.toString().trim());
            }
            if (summaryText != null && summaryText.length() > 0 && !bodyBuilder.toString().contains(summaryText.toString())) {
                if (bodyBuilder.length() > 0) bodyBuilder.append(" ");
                bodyBuilder.append(summaryText.toString().trim());
            }

            String body = bodyBuilder.toString().trim();
            if (body.isEmpty() && title.isEmpty()) {
                return;
            }

            String fullText = (title + " " + body).trim();

            // 1. Detect SMS or messaging app (Google, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Truecaller, etc.)
            boolean isSmsApp = lowerPkg.contains(".mms")
                            || lowerPkg.contains(".messaging")
                            || lowerPkg.contains(".sms")
                            || lowerPkg.contains("samsung")
                            || lowerPkg.contains("oneplus")
                            || lowerPkg.contains("miui")
                            || lowerPkg.contains("vivo")
                            || lowerPkg.contains("coloros")
                            || lowerPkg.contains("transsion")
                            || lowerPkg.contains("truecaller")
                            || lowerPkg.equals("org.thoughtcrime.securesms");

            // 2. Personal contact check: If sender/title is a 10-12 digit phone number, skip it to safeguard personal privacy
            if (title.matches("^(\\+91|91|0)?[6-9]\\d{9}$") || title.matches("^\\+?[0-9]{10,13}$")) {
                Log.d(TAG, "⛔ Skipping notification from personal contact number: " + title);
                return;
            }

            // 3. Financial relevance check
            boolean isAllowedFinancialApp = ALLOWED_PACKAGES.contains(packageName);
            boolean hasBankSender = isBankSender(title) || isBankSender(body);
            boolean hasFinancialContent = FINANCIAL_AMOUNT_PATTERN.matcher(fullText).find()
                                       && FINANCIAL_ACTION_PATTERN.matcher(fullText).find();

            if (!isAllowedFinancialApp && !isSmsApp && !hasBankSender && !hasFinancialContent) {
                return;
            }

            if (isSmsApp && !hasBankSender && !hasFinancialContent) {
                // SMS notification, but from personal contact or general notification
                return;
            }

            if (!hasFinancialContent && !hasBankSender && !isAllowedFinancialApp) {
                return;
            }

            Log.d(TAG, "📥 Queuing verified transaction alert from " + packageName + ": " + fullText);
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
            Log.d(TAG, "📥 Queued. Total pending: " + queue.length());
        } catch (JSONException e) {
            Log.e(TAG, "Failed to queue transaction", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {}
}
