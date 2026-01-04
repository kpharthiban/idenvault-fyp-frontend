"use client";

import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
} from "html5-qrcode";
import { useRouter } from "next/navigation";

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

    // Clear any leftover DOM (important in dev)
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
      .catch(() => {
        setError("Unable to access camera. Please allow camera permission.");
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-xl text-black font-bold mb-4">Scan QR Code</h1>
        <button
          onClick={stopScannerAndGoBack}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          ← Back to Verification
        </button>

        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <div
            id="qr-reader"
            ref={readerRef}
            className="w-full border rounded overflow-hidden"
            // style={{ minHeight: "320px" }}
          />
        )}

        <p className="text-xs text-gray-500 mt-4">
          Point your camera at the QR code to verify a credential.
        </p>
      </div>
    </main>
  );
}
