"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm text-center">
        <h2 className="text-lg text-black font-bold mb-2">Share Credential</h2>

        <p className="text-xs text-gray-500 mb-4">
            This QR code will refresh in{" "}
            <span className="font-medium">{secondsLeft}</span> seconds.
        </p>

        <div className="flex justify-center mb-4">
          <QRCodeSVG value={url} size={200} />
        </div>

        <p className="text-xs text-gray-600 break-all mb-4">{url}</p>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}
