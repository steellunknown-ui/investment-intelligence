package com.investmentintelligence.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.getcapacitor.JSObject;

public class TransactionParser {

    // Regex for Credit/Debit Cards (Common patterns in India)
    private static final String CARD_PATTERN = "(?i)(?:spent|debited|vpa|purchase|paid|debited for)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:on|at|to|using)\\s+(.*?)\\s+(?:using|from|on|via|credited|;)";
    
    // Regex for ICICI specific and common bank debit messages (e.g., triggered by GPay)
    private static final String BANK_DEBIT_PATTERN = "(?i)(.*?)bank.*?acct\\s+.*?\\s+debited\\s+for\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+on\\s+(.*?);\\s+(.*?)\\s+credited";

    // Regex for Bank Credit messages (e.g., "Acct XX172 is credited with Rs 5.00 from Abhishek")
    private static final String BANK_CREDIT_PATTERN = "(?i)(.*?)bank.*?acct\\s+.*?\\s+is\\s+credited\\s+with\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+on\\s+(.*?)\\s+from\\s+(.*?)\\.";

    // Regex for UPI & Wallet Payments (Debited)
    private static final String UPI_DEBIT_PATTERN = "(?i)(?:paid|transfer|sent|transfer of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:to|at)\\s+(.*?)\\s+(?:via|using|ref|txn)";

    // Regex for Received Money (UPI/Bank)
    private static final String CREDIT_PATTERN = "(?i)(?:received|credited|refunded|received of)\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+(?:from|in|to)\\s+(.*?)(?:\\s|$)";

    // FamPay: "You received ₹5.0 in your FamX account"
    private static final String FAMAPP_CREDIT_PATTERN = "(?i)you\\s+received\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)\\s+in\\s+your\\s+fam";

    // FamPay: "DEEPNARAYAN BALIRAM VISHWAKARMA sent ₹5.0"
    private static final String FAM_INCOMING_PATTERN = "(?i)(.+?)\\s+sent\\s+(?:rs\\.?|inr|₹)\\s*([\\d,.]+)";

    public static JSObject parse(String text) {
        if (text == null) return null;
        JSObject result = new JSObject();
        
        // Cleanup text: remove common fillers and hashtags
        String cleanText = text.replace("!", "").replace("#fampaid", "").replace(",", "").trim();

        // 1. Try Bank Debit Pattern (ICICI/GPay Style)
        Pattern bankDebitPattern = Pattern.compile(BANK_DEBIT_PATTERN);
        Matcher bankDebitMatcher = bankDebitPattern.matcher(cleanText);
        if (bankDebitMatcher.find()) {
            result.put("amount", parseAmount(bankDebitMatcher.group(2)));
            result.put("merchant", bankDebitMatcher.group(4).trim()); 
            result.put("source", bankDebitMatcher.group(1).trim().isEmpty() ? "Bank" : bankDebitMatcher.group(1).trim() + " Bank");
            result.put("type", "DEBIT");
            return result;
        }

        // 2. Try Bank Credit Pattern (e.g. "credited with Rs")
        Pattern bankCreditPattern = Pattern.compile(BANK_CREDIT_PATTERN);
        Matcher bankCreditMatcher = bankCreditPattern.matcher(cleanText);
        if (bankCreditMatcher.find()) {
            result.put("amount", parseAmount(bankCreditMatcher.group(2)));
            result.put("merchant", bankCreditMatcher.group(4).trim());
            result.put("source", bankCreditMatcher.group(1).trim().isEmpty() ? "Bank" : bankCreditMatcher.group(1).trim() + " Bank");
            result.put("type", "CREDIT");
            return result;
        }

        // 3. FamApp Email/Credit notification
        Pattern famAppPattern = Pattern.compile(FAMAPP_CREDIT_PATTERN);
        Matcher famAppMatcher = famAppPattern.matcher(cleanText);
        if (famAppMatcher.find()) {
            result.put("amount", parseAmount(famAppMatcher.group(1)));
            result.put("merchant", "FamPay / FamX");
            result.put("source", "FamApp");
            result.put("type", "CREDIT");
            return result;
        }

        // 4. FamPay Incoming
        Pattern famInPattern = Pattern.compile(FAM_INCOMING_PATTERN);
        Matcher famInMatcher = famInPattern.matcher(cleanText);
        if (famInMatcher.find()) {
            result.put("amount", parseAmount(famInMatcher.group(2)));
            result.put("merchant", famInMatcher.group(1).trim());
            result.put("source", "FamPay (Received)");
            result.put("type", "CREDIT");
            return result;
        }

        // 5. Try General Credit Pattern
        Pattern creditPattern = Pattern.compile(CREDIT_PATTERN);
        Matcher creditMatcher = creditPattern.matcher(cleanText);
        if (creditMatcher.find()) {
            result.put("amount", parseAmount(creditMatcher.group(1)));
            result.put("merchant", creditMatcher.group(2).trim());
            result.put("source", "Bank / UPI (Received)");
            result.put("type", "CREDIT");
            return result;
        }

        // 6. Try Card Pattern
        Pattern cardPattern = Pattern.compile(CARD_PATTERN);
        Matcher cardMatcher = cardPattern.matcher(cleanText);
        if (cardMatcher.find()) {
            result.put("amount", parseAmount(cardMatcher.group(1)));
            result.put("merchant", cardMatcher.group(2).trim());
            result.put("source", cardMatcher.group(3).trim());
            result.put("type", "DEBIT"); 
            return result;
        }

        // 7. Try UPI Debit Pattern
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
