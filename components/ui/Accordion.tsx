"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
    title: string;
  }
>(({ className, title, children, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-slate-200 dark:border-slate-800", className)}
    {...props}
  >
    <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-4 text-left font-medium text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors [&[data-state=open]>svg]:rotate-180">
      {title}
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
    <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
      <div className="pb-4 pt-0 text-slate-600 dark:text-slate-400">{children}</div>
    </AccordionPrimitive.Content>
  </AccordionPrimitive.Item>
));
AccordionItem.displayName = "AccordionItem";

export { Accordion, AccordionItem };