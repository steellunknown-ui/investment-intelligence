// Reminder helper functions for receivables
import { toast } from "sonner";

export interface ReminderData {
  name: string;
  phone?: string;
  outstanding: number;
  dueDate?: string;
  upiId?: string;
}

export type ReminderMode = "polite" | "strict" | "final";

// Message templates
const getMessageTemplate = (data: ReminderData, mode: ReminderMode = "polite"): string => {
  const { name, outstanding, dueDate, upiId } = data;
  const amount = formatCurrency(outstanding);
  
  let message = "";
  
  switch (mode) {
    case "polite":
      message = `Hi ${name}, reminder: ${amount} pending hai. Please repay when possible. Thanks.`;
      break;
    case "strict":
      message = `Hi ${name}, ${amount} pending hai. Please clear today.`;
      break;
    case "final":
      message = `Final reminder: ${amount} pending. Please repay immediately.`;
      break;
    default:
      message = `Hi ${name}, aapke ${amount} pending hain. Please jaldi repay kar do. Thanks.`;
  }
  
  // Add due date if overdue
  if (dueDate && new Date(dueDate) < new Date()) {
    message += `\nDue date: ${new Date(dueDate).toLocaleDateString()}`;
  }
  
  // Add UPI if available
  if (upiId) {
    message += `\nUPI: ${upiId}`;
  }
  
  return message;
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Validate phone number
const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10;
};

// WhatsApp tap-to-send (FREE)
export const openWhatsApp = (data: ReminderData, mode: ReminderMode = "polite"): void => {
  const { phone, outstanding } = data;
  
  if (!phone) {
    toast.error("Phone number is required for WhatsApp");
    return;
  }
  
  if (outstanding <= 0) {
    toast.error("No pending amount to remind about");
    return;
  }
  
  const cleaned = phone.replace(/\D/g, "");
  if (!validatePhone(phone)) {
    toast.error("Invalid phone number");
    return;
  }
  
  const message = getMessageTemplate(data, mode);
  const url = `https://wa.me/91${cleaned}?text=${encodeURIComponent(message)}`;
  
  try {
    window.open(url, "_blank");
    toast.success("WhatsApp opened with reminder message");
  } catch (error) {
    toast.error("Failed to open WhatsApp");
  }
};

// SMS tap-to-send (FREE)
export const openSMS = (data: ReminderData, mode: ReminderMode = "polite"): void => {
  const { phone, outstanding } = data;
  
  if (!phone) {
    toast.error("Phone number is required for SMS");
    return;
  }
  
  if (outstanding <= 0) {
    toast.error("No pending amount to remind about");
    return;
  }
  
  const cleaned = phone.replace(/\D/g, "");
  if (!validatePhone(phone)) {
    toast.error("Invalid phone number");
    return;
  }
  
  const message = getMessageTemplate(data, mode);
  const smsUrl = `sms:+91${cleaned}?body=${encodeURIComponent(message)}`;
  
  try {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = smsUrl;
      toast.success("SMS app opened with reminder message");
    } else {
      toast.info("SMS works best on mobile devices");
      // Still try to open on desktop
      window.location.href = smsUrl;
    }
  } catch (error) {
    toast.error("Failed to open SMS app");
  }
};

// Copy message to clipboard (Fallback)
export const copyReminder = async (data: ReminderData, mode: ReminderMode = "polite"): Promise<void> => {
  const { outstanding } = data;
  
  if (outstanding <= 0) {
    toast.error("No pending amount to remind about");
    return;
  }
  
  const message = getMessageTemplate(data, mode);
  
  try {
    await navigator.clipboard.writeText(message);
    toast.success("Reminder message copied to clipboard!");
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = message;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    toast.success("Reminder message copied!");
  }
};

// Get reminder modes for dropdown
export const getReminderModes = (): Array<{ value: ReminderMode; label: string }> => [
  { value: "polite", label: "Polite" },
  { value: "strict", label: "Strict" },
  { value: "final", label: "Final Notice" },
];