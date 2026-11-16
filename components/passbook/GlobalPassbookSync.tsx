"use client";

import { useEffect, useRef } from "react";
import { registerPlugin } from "@capacitor/core";
import { App } from "@capacitor/app";
import { toast } from "sonner";

export interface PassbookPluginInterface {
  sync(): Promise<void>;
  checkStatus(): Promise<{ smsPermission: boolean; notificationAccess: boolean }>;
  requestSMSPermission(): Promise<{ granted: boolean }>;
  openAppSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;
  addListener(eventName: "onTransactionDetected", listenerFunc: (data: any) => void): Promise<any>;
  removeAllListeners(): Promise<void>;
}

export const PassbookPlugin = registerPlugin<PassbookPluginInterface>("PassbookPlugin");

export function GlobalPassbookSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) return;

    let subListener: any = null;

    // 1. Transaction event handler
    const handleTransaction = async (data: any) => {
      let rawText: string = data.raw ?? "";
      let packageName: string | undefined;
      let sender: string | undefined;

      if (rawText.includes("|")) {
        const pipeIdx = rawText.indexOf("|");
        const prefix = rawText.substring(0, pipeIdx);
        rawText = rawText.substring(pipeIdx + 1);
        if (data.source === "notification") {
          packageName = prefix;
        } else {
          sender = prefix;
        }
      }

      if (!rawText.trim()) return;

      try {
        const res = await fetch("/api/passbook/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_text: rawText,
            source: data.source,
            package_name: packageName,
            sender: sender,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.transaction) {
            const tx = result.transaction;
            const formattedAmt = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            }).format(tx.amount || 0);

            const label = tx.type === "credit" ? "Credited" : "Debited";
            const entity = tx.merchant || tx.bank || "Account";

            toast.success(`${label}: ${formattedAmt}`, {
              description: `${entity} • ${tx.instrument || "Direct UPI"} (A/C ••${tx.account_last4 || "XXXX"})`,
              duration: 5000,
            });

            // Dispatch global event for passbook and dashboard views
            window.dispatchEvent(
              new CustomEvent("ii:transaction-logged", { detail: tx })
            );
          }
        }
      } catch (err) {
        console.error("[GlobalPassbookSync] Parse error:", err);
      }
    };

    // 2. Setup Native Listener
    PassbookPlugin.addListener("onTransactionDetected", handleTransaction)
      .then((sub) => {
        subListener = sub;
      })
      .catch((err) => {
        console.warn("[GlobalPassbookSync] Failed to add listener:", err);
      });

    // 3. Drain pending queue on mount
    PassbookPlugin.sync().catch(console.error);

    // 4. Drain on App Resume (when returning from another app or phone unlock)
    const appStateSub = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        PassbookPlugin.sync().catch(console.error);
      }
    });

    // 5. Periodic background queue drain (every 10s)
    const interval = setInterval(() => {
      PassbookPlugin.sync().catch(console.error);
    }, 10000);

    return () => {
      clearInterval(interval);
      appStateSub.then((s) => s.remove()).catch(console.error);
      if (subListener && typeof subListener.remove === "function") {
        subListener.remove();
      }
    };
  }, []);

  return null;
}
