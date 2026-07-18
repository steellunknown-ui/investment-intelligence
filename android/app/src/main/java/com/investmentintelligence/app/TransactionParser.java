package com.investmentintelligence.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.getcapacitor.JSObject;

public class TransactionParser {

    // Regex for Credit/Debit Cards (Common patterns in India)
    private static final String CARD_PATTERN = "(?i)(?:spent|debited|vpa|purchase|paid)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:on|at|to|using)\\s+(.*?)\\s+(?:using|from|on|via)\\s+(.*?)(?:\\s|$)";
    
    // Regex for UPI & Wallet Payments (Debited)
    private static final String UPI_DEBIT_PATTERN = "(?i)(?:paid|transfer|sent|transfer of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:to|at)\\s+(.*?)\\s+(?:via|using|ref|txn)";

    // Regex for Received Money (UPI/Bank)
    private static final String CREDIT_PATTERN = "(?i)(?:received|credited|refunded|received of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:from|in|to)\\s+(.*?)(?:\\s|$)";

    // Regex for Incoming Payments (FamPay style: "Name sent ₹5.0")
    private static final String FAM_INCOMING_PATTERN = "(?i)(.*?)\\s+(?:sent|gave|transferred)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)";

    public static JSObject parse(String text) {
        if (text == null) return null;
        JSObject result = new JSObject();
        
        // Cleanup text: remove common fillers and hashtags
        String cleanText = text.replace("!", "").replace("#fampaid", "").replace(",", "").trim();

        // 1. Try FamPay Incoming Pattern (Received Money)
        Pattern famInPattern = Pattern.compile(FAM_INCOMING_PATTERN);
        Matcher famInMatcher = famInPattern.matcher(cleanText);
        if (famInMatcher.find()) {
            result.put("amount", parseAmount(famInMatcher.group(2)));
            result.put("merchant", famInMatcher.group(1).trim());
            result.put("source", "FamPay (Received)");
            result.put("type", "CREDIT");
            return result;
        }

        // 2. Try General Credit Pattern (Bank/UPI Received)
        Pattern creditPattern = Pattern.compile(CREDIT_PATTERN);
        Matcher creditMatcher = creditPattern.matcher(cleanText);
        if (creditMatcher.find()) {
            result.put("amount", parseAmount(creditMatcher.group(1)));
            result.put("merchant", creditMatcher.group(2).trim());
            result.put("source", "Bank / UPI (Received)");
            result.put("type", "CREDIT");
            return result;
        }

        // 3. Try Card Pattern (Spent)
        Pattern cardPattern = Pattern.compile(CARD_PATTERN);
        Matcher cardMatcher = cardPattern.matcher(cleanText);
        if (cardMatcher.find()) {
            result.put("amount", parseAmount(cardMatcher.group(1)));
            result.put("merchant", cardMatcher.group(2).trim());
            result.put("source", cardMatcher.group(3).trim());
            result.put("type", "DEBIT"); 
            return result;
        }

        // 4. Try UPI Debit Pattern
        Pattern upiDebitPattern = Pattern.compile(UPI_DEBIT_PATTERN);
        Matcher upiDebitMatcher = upiDebitPattern.matcher(cleanText);
        if (upiDebitMatcher.find()) {
            result.put("amount", parseAmount(upiDebitMatcher.group(1)));
            result.put("merchant", upiDebitMatcher.group(2).trim());
            result.put("source", cleanText.toLowerCase().contains("fam") ? "FamPay / FamApp" : "UPI Transaction");
            result.put("type", "DEBIT");
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
