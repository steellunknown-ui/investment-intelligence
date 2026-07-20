package com.investmentintelligence.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.getcapacitor.JSObject;

public class TransactionParser {

    // 1. UNIVERSAL DEBIT PATTERN (Works for HDFC, SBI, AXIS, ICICI, etc.)
    // Matches: "Bank Name... Acct XX123 debited for Rs 500 at Merchant"
    private static final String UNIVERSAL_DEBIT = "(?i)(.*?)\\s*bank.*?acct.*?\\s+(?:debited|spent|paid)\\s+(?:for|at)?\\s*(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:on|at|to)\\s+(.*?)(?:;|$|\\s+using|\\s+ref)";

    // 2. UNIVERSAL CREDIT PATTERN (Works for HDFC, SBI, AXIS, ICICI, etc.)
    // Matches: "Bank Name... Acct XX123 credited with Rs 1000 from Name"
    private static final String UNIVERSAL_CREDIT = "(?i)(.*?)\\s*bank.*?acct.*?\\s+(?:is\\s+)?(?:credited|received|refunded)\\s+(?:with|of)?\\s*(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:on|from|in)\\s+(.*?)(?:;|$|\\s+by|\\s+ref|\\.)";

    // 3. UPI / WALLET PATTERN (GPay, PhonePe, Paytm, FamPay)
    private static final String UNIVERSAL_UPI = "(?i)(?:paid|transfer|sent|paid to|transfer of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:to|at)\\s+(.*?)\\s+(?:via|using|ref|txn)";

    // 4. FamPay Incoming (Specific pattern from screenshot)
    private static final String FAM_INCOMING = "(?i)(.+?)\\s+sent\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)";

    public static JSObject parse(String text) {
        if (text == null) return null;
        JSObject result = new JSObject();
        
        // Cleanup text
        String cleanText = text.replace("!", "").replace("#fampaid", "").replace(",", "").trim();

        // Try Universal Debit
        Pattern debPattern = Pattern.compile(UNIVERSAL_DEBIT);
        Matcher debMatcher = debPattern.matcher(cleanText);
        if (debMatcher.find()) {
            result.put("amount", parseAmount(debMatcher.group(2)));
            result.put("merchant", debMatcher.group(3).trim()); 
            result.put("source", debMatcher.group(1).trim().isEmpty() ? "Bank" : debMatcher.group(1).trim() + " Bank");
            result.put("type", "DEBIT");
            return result;
        }

        // Try Universal Credit
        Pattern crePattern = Pattern.compile(UNIVERSAL_CREDIT);
        Matcher creMatcher = crePattern.matcher(cleanText);
        if (creMatcher.find()) {
            result.put("amount", parseAmount(creMatcher.group(2)));
            result.put("merchant", creMatcher.group(3).trim());
            result.put("source", creMatcher.group(1).trim().isEmpty() ? "Bank" : creMatcher.group(1).trim() + " Bank");
            result.put("type", "CREDIT");
            return result;
        }

        // Try UPI
        Pattern upiPattern = Pattern.compile(UNIVERSAL_UPI);
        Matcher upiMatcher = upiPattern.matcher(cleanText);
        if (upiMatcher.find()) {
            result.put("amount", parseAmount(upiMatcher.group(1)));
            result.put("merchant", upiMatcher.group(2).trim());
            result.put("source", cleanText.toLowerCase().contains("fam") ? "FamPay / FamApp" : "UPI Transaction");
            result.put("type", "DEBIT");
            return result;
        }

        // Try FamPay Incoming
        Pattern famInPattern = Pattern.compile(FAM_INCOMING);
        Matcher famInMatcher = famInPattern.matcher(cleanText);
        if (famInMatcher.find()) {
            result.put("amount", parseAmount(famInMatcher.group(2)));
            result.put("merchant", famInMatcher.group(1).trim());
            result.put("source", "FamPay (Received)");
            result.put("type", "CREDIT");
            return result;
        }

        return null;
    }

    private static double parseAmount(String amountStr) {
        try {
            return Double.parseDouble(amountStr.replace(",", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }
}
