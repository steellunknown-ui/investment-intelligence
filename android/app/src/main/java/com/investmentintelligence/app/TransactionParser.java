package com.investmentintelligence.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.getcapacitor.JSObject;

public class TransactionParser {

    // Regex for Credit/Debit Cards (Common patterns in India)
    private static final String CARD_PATTERN = "(?i)(?:spent|debited|vpa|purchase|paid)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:on|at|to|using)\\s+(.*?)\\s+(?:using|from|on|via)\\s+(.*?)(?:\\s|$)";
    
    // Regex for UPI & Wallet (Including FamPay/FamApp)
    private static final String UPI_PATTERN = "(?i)(?:paid|transfer|sent|transfer of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:to|at)\\s+(.*?)\\s+(?:via|using|ref|txn)";

    public static JSObject parse(String text) {
        if (text == null) return null;
        JSObject result = new JSObject();
        
        // Cleanup text: remove common fillers to make regex easier
        String cleanText = text.replace("!", "").replace(",", "");

        // Try Card Pattern first
        Pattern pattern = Pattern.compile(CARD_PATTERN);
        Matcher matcher = pattern.matcher(cleanText);
        
        if (matcher.find()) {
            result.put("amount", parseAmount(matcher.group(1)));
            result.put("merchant", matcher.group(2).trim());
            result.put("source", matcher.group(3).trim());
            result.put("type", cleanText.toLowerCase().contains("credit") ? "CREDIT" : "DEBIT");
            return result;
        }

        // Try UPI Pattern (Handles FamPay style: "Sent! ₹250 to Merchant via FamApp")
        pattern = Pattern.compile(UPI_PATTERN);
        matcher = pattern.matcher(cleanText);
        if (matcher.find()) {
            result.put("amount", parseAmount(matcher.group(1)));
            result.put("merchant", matcher.group(2).trim());
            result.put("source", cleanText.toLowerCase().contains("fam") ? "FamPay / FamApp" : "UPI Transaction");
            result.put("type", "UPI");
            return result;
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
