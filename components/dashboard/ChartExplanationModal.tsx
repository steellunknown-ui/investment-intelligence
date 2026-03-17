"use client";

import { Modal } from "@/components/ui/Modal";
import { Info, CheckCircle2 } from "lucide-react";

interface ChartExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  insights: string[];
}

export function ChartExplanationModal({
  isOpen,
  onClose,
  title,
  summary,
  insights,
}: ChartExplanationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-6 py-2">
        <div>
          <div className="flex items-center gap-2 mb-2 text-foreground">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Summary</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {summary}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Key Insights</h3>
          </div>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-bold">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
