package com.investmentintelligence.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.getcapacitor.JSObject;

public class TransactionParser {

    // Regex for Credit/Debit Cards (Common patterns in India)
    private static final String CARD_PATTERN = "(?i)(?:spent|debited|vpa|purchase|paid)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:on|at|to|using)\\s+(.*?)\\s+(?:using|from|on|via)\\s+(.*?)(?:\\s|$)";
    
    // Regex for UPI & Wallet Payments (Debited)
    private static final String UPI_PATTERN = "(?i)(?:paid|transfer|sent|transfer of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:to|at)\\s+(.*?)\\s+(?:via|using|ref|txn)";

    // Regex for Incoming Payments (FamPay style: "Name sent ₹5.0")
    private static final String INCOMING_PATTERN = "(?i)(.*?)\\s+(?:sent|gave|transferred)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)";

    public static JSObject parse(String text) {
        if (text == null) return null;
        JSObject result = new JSObject();
        
        // Cleanup text: remove common fillers and hashtags
        String cleanText = text.replace("!", "").replace("#fampaid", "").replace(",", "").trim();

        // 1. Try Incoming Pattern (Received Money)
        Pattern inPattern = Pattern.compile(INCOMING_PATTERN);
        Matcher inMatcher = inPattern.matcher(cleanText);
        if (inMatcher.find()) {
            result.put("amount", parseAmount(inMatcher.group(2)));
            result.put("merchant", inMatcher.group(1).trim());
            result.put("source", "FamPay / UPI (Received)");
            result.put("type", "CREDIT");
            return result;
        }

        // 2. Try Card Pattern
        Pattern cardPattern = Pattern.compile(CARD_PATTERN);
        Matcher cardMatcher = cardPattern.matcher(cleanText);
        if (cardMatcher.find()) {
            result.put("amount", parseAmount(cardMatcher.group(1)));
            result.put("merchant", cardMatcher.group(2).trim());
            result.put("source", cardMatcher.group(3).trim());
            result.put("type", cleanText.toLowerCase().contains("credit") ? "CREDIT" : "DEBIT");
            return result;
        }

        // 3. Try UPI Pattern
        Pattern upiPattern = Pattern.compile(UPI_PATTERN);
        Matcher upiMatcher = upiPattern.matcher(cleanText);
        if (upiMatcher.find()) {
            result.put("amount", parseAmount(upiMatcher.group(1)));
            result.put("merchant", upiMatcher.group(2).trim());
            result.put("source", cleanText.toLowerCase().contains("fam") ? "FamPay / FamApp" : "UPI Transaction");
            result.put("type", "DEBIT");
            return result;
        }

        return null;
    }

        return null; // No match found
    }

    private static double parseAmount(String amountStr) {
        try {
            return Double.parseDouble(amountStr.replace(",", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }
}
