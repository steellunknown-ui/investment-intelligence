package com.investmentintelligence.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.getcapacitor.JSObject;

public class TransactionParser {

    // Regex for Credit/Debit Cards (Common patterns in India)
    private static final String CARD_PATTERN = "(?i)(?:spent|debited|vpa|purchase)\\s+(?:rs\\.?|inr)\\s*([\\d,.]+)\\s+(?:on|at|to)\\s+(.*?)\\s+(?:using|from|on)\\s+(.*?)(?:\\s|$)";
    
    // Regex for UPI (Simple version)
    private static final String UPI_PATTERN = "(?i)(?:paid|transfer|sent)\\s+(?:rs\\.?|inr)\\s*([\\d,.]+)\\s+(?:to)\\s+(.*?)\\s+(?:ref|txn)";

    public static JSObject parse(String text) {
        JSObject result = new JSObject();
        
        // Try Card Pattern first
        Pattern pattern = Pattern.compile(CARD_PATTERN);
        Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            result.put("amount", parseAmount(matcher.group(1)));
            result.put("merchant", matcher.group(2).trim());
            result.put("source", matcher.group(3).trim());
            result.put("type", text.toLowerCase().contains("credit") ? "CREDIT" : "DEBIT");
            return result;
        }

        // Try UPI Pattern
        pattern = Pattern.compile(UPI_PATTERN);
        matcher = pattern.matcher(text);
        if (matcher.find()) {
            result.put("amount", parseAmount(matcher.group(1)));
            result.put("merchant", matcher.group(2).trim());
            result.put("source", "UPI / Bank");
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
