"use client";

import { motion } from "framer-motion";
import { Card } from "./Card";
import type { ReactNode } from "react";

interface MotionCardProps {
    children: ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
    onClick?: () => void;
    delay?: number;
}

export function MotionCard({
    children,
    className = "",
    padding = "md",
    onClick,
    delay = 0
}: MotionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.4,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
        >
            <Card className={className} padding={padding} onClick={onClick}>
                {children}
            </Card>
        </motion.div>
    );
}
