package com.investmentintelligence.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PassbookPlugin")
public class PassbookPlugin extends Plugin {
    private static PassbookPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void sendTransactionToJS(String source, String merchant, double amount, String type, String raw) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("source", source);
            ret.put("merchant", merchant);
            ret.put("amount", amount);
            ret.put("type", type);
            ret.put("raw", raw);
            instance.notifyListeners("onTransactionDetected", ret);
        }
    }
}
