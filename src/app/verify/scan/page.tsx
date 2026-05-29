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

    const startScanner = async () => {
      const config = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      const onSuccess = (decodedText: string) => {
        scanner
          .stop()
          .then(() => {
            window.location.href = decodedText;
          })
          .catch(() => {});
      };
      
      const onScanError = () => {};

      try {
        await scanner.start({ facingMode: "environment" }, config, onSuccess, onScanError);
      } catch (err1) {
        console.warn("Environment camera failed, trying user camera...", err1);
        try {
          await scanner.start({ facingMode: "user" }, config, onSuccess, onScanError);
        } catch (err2) {
          console.warn("User camera failed, trying any available camera...", err2);
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              await scanner.start(cameras[0].id, config, onSuccess, onScanError);
            } else {
              throw new Error("No cameras found.");
            }
          } catch (err3) {
            console.error("All camera fallback options failed:", err3);
            setError("Unable to access camera. Please allow permissions or ensure no other app is using it.");
          }
        }
      }
    };

    startScanner();

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
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8F8] bg-dotgrid p-6 relative">
      
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
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <button
            onClick={stopScannerAndGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:shadow-sm transition-all text-sm font-medium"
            >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Cancel</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-700 font-mono uppercase font-semibold">Live Feed</span>
            </div>
        </div>

        {/* Scanner Card */}
        <div className="bg-slate-900 border-2 border-white rounded-3xl overflow-hidden shadow-xl relative h-[400px] w-full flex items-center justify-center">
            
            {/* Title Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent z-20 flex justify-center">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                    <Camera size={16} /> Scan QR Code
                </p>
            </div>

            {error ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-red-500 bg-white">
                    <AlertCircle size={40} className="mb-4 opacity-80" />
                    <p className="font-medium">{error}</p>
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
                        <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-purple-500 rounded-tl-xl" />
                        <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                        <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                        <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-purple-500 rounded-br-xl" />

                        {/* Moving Laser */}
                        <motion.div
                            animate={{ top: ["15%", "85%", "15%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-[15%] w-[70%] h-0.5 bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)]"
                        />
                    </div>
                </div>
            )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6 font-medium">
          Align the QR code within the frame to verify automatically.
        </p>
      </div>
    </main>
  );
}