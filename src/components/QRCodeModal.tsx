"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Clock } from "lucide-react";

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [copied, setCopied] = useState(false);

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Optional: You could auto-close here or reset
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Copy Logic
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop (Blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Share Credential
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center">
            
            {/* Timer Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium mb-6 transition-colors ${
              secondsLeft < 10 ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
            }`}>
              <Clock size={12} />
              Session expires in {secondsLeft}s
            </div>

            {/* QR Code Container (White box for scannability) */}
            <div className="p-4 bg-white rounded-xl shadow-inner mb-6 relative group">
               {/* Visual scanner line effect */}
               <motion.div 
                 animate={{ top: ["0%", "100%", "0%"] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="absolute left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] pointer-events-none"
               />
              <QRCodeSVG value={url} size={200} level="H" />
            </div>

            {/* URL & Copy Section */}
            <div className="w-full">
              <label className="text-xs text-slate-500 mb-1.5 block ml-1">Credential Verification Link</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1 pl-3">
                <p className="flex-1 text-xs text-slate-300 font-mono truncate">
                  {url}
                </p>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
             <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}