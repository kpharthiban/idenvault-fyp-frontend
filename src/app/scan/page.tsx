"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ScanPage() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readerRef.current) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    // Clear any leftover DOM
    readerRef.current.innerHTML = "";

    const scanner = new Html5Qrcode(readerRef.current.id);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          scanner
            .stop()
            .then(() => {
              window.location.href = decodedText;
            })
            .catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        console.error(err);
        setError("Unable to access camera. Please allow camera permissions.");
      });

    return () => {
      if (
        scannerRef.current &&
        scannerRef.current.getState &&
        scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopScannerAndGoBack = async () => {
    try {
      if (
        scannerRef.current &&
        scannerRef.current.getState &&
        scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        await scannerRef.current.stop();
      }
    } catch {
      // Ignore stop errors
    } finally {
      router.push("/verify");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative">
      
      {/* GLOBAL STYLES FIX:
        1. Hide the library's internal canvas (removes the white white box/borders).
        2. Force video to fill container.
      */}
      <style jsx global>{`
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 1.5rem;
        }
        #qr-reader canvas, 
        #qr-reader div:not(:first-child) { 
          display: none !important; 
        }
      `}</style>

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <button
            onClick={stopScannerAndGoBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Cancel</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-300 font-mono uppercase">Live Feed</span>
            </div>
        </div>

        {/* Scanner Card */}
        <div className="bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[400px] w-full flex items-center justify-center">
            
            {/* Title Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-center">
                <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                    <Camera size={16} /> Scan QR Code
                </p>
            </div>

            {error ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-red-400">
                    <AlertCircle size={40} className="mb-4 opacity-80" />
                    <p>{error}</p>
                </div>
            ) : (
                <div className="w-full h-full relative">
                    {/* The Camera Feed Container */}
                    <div id="qr-reader" ref={readerRef} className="w-full h-full" />
                    
                    {/* Cosmetic Scanner Overlay (The Laser Line & Corners) */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {/* Corners:
                           - Removed 'shadow' classes to eliminate the weird white lines.
                           - Kept pure blue borders.
                        */}
                        <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                        <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                        <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                        <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

                        {/* Moving Laser */}
                        <motion.div
                            animate={{ top: ["15%", "85%", "15%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-[15%] w-[70%] h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)]"
                        />
                    </div>
                </div>
            )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Align the QR code within the frame to verify automatically.
        </p>
      </div>
    </main>
  );
}