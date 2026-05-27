"use client";

import { useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "error";

interface ToastProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
}

const variants: Record<ToastVariant, { bg: string; icon: typeof CheckCircle }> = {
  success: { bg: "bg-emerald-500", icon: CheckCircle },
  error: { bg: "bg-red-500", icon: AlertCircle },
};

export default function Toast({
  show,
  onClose,
  title,
  message,
  variant = "success",
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  const { bg, icon: Icon } = variants[variant];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-8 right-8 ${bg} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
        >
          <Icon size={20} />
          <div>
            <p className="font-bold text-sm">{title}</p>
            {message && (
              <p className="text-xs text-white/80">{message}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
