"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, AlertCircle, RefreshCw, Upload, CheckCircle2 } from "lucide-react";

interface QrCameraScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

// Play pleasant confirmation beep on successful scan using Web Audio API
function playScanChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export default function QrCameraScanner({ onScan, onClose }: QrCameraScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [_cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isHandlingScanRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerId = "qr-camera-stream-container";

  // Clean stop helper
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn("Scanner cleanup notice:", e);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      setIsInitializing(true);
      setError(null);

      // Check if secure context
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        setError(
          "Camera access requires a secure connection (HTTPS). Please open via https:// or upload a QR image below."
        );
        setIsInitializing(false);
        return;
      }

      try {
        // Enumerate devices if possible
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (mounted) {
          setCameras(devices);
          if (devices.length > 0 && !activeCameraId) {
            // Find back camera if available
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes("back") ||
                d.label.toLowerCase().includes("rear") ||
                d.label.toLowerCase().includes("environment")
            );
            setActiveCameraId(backCam ? backCam.id : devices[0].id);
          }
        }

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.72);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        };

        const cameraConfig = activeCameraId ? activeCameraId : { facingMode };

        await html5QrCode.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (isHandlingScanRef.current) return;
            isHandlingScanRef.current = true;

            // Trigger feedback
            playScanChime();
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([40, 40, 80]);
            }

            setScannedResult(decodedText);

            // Stop scanner & propagate scan result
            stopScanner().finally(() => {
              onScanRef.current(decodedText);
            });
          },
          () => {
            // Frame parse failed (normal while scanning, do nothing)
          }
        );

        if (mounted) {
          setIsInitializing(false);
        }
      } catch (err: unknown) {
        console.error("Camera startup error:", err);
        if (mounted) {
          setIsInitializing(false);
          const errString = String(err).toLowerCase();
          if (errString.includes("notallowed") || errString.includes("permission")) {
            setError(
              "Camera access permission was denied. Please enable camera permission in your browser settings, or upload a QR image below."
            );
          } else if (errString.includes("notfound") || errString.includes("devices")) {
            setError("No camera device was detected on this hardware.");
          } else {
            setError(
              "Unable to start live camera stream. You can upload a QR image below or enter the 6-digit counter PIN."
            );
          }
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [facingMode, activeCameraId]);

  // Flip camera between front & back
  const toggleFacingMode = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Handle local image file upload (screenshot of customer QR pass)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsInitializing(true);
      setError(null);
      const html5QrCode = scannerRef.current || new Html5Qrcode(containerId);
      const decodedText = await html5QrCode.scanFile(file, true);
      playScanChime();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 40, 80]);
      }
      setScannedResult(decodedText);
      await stopScanner();
      onScanRef.current(decodedText);
    } catch (err) {
      console.warn("File scan error:", err);
      setError("No valid QR code was detected in the uploaded image. Please ensure the QR is clear and well-lit.");
      setIsInitializing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col mx-auto">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0A52A9] border border-[#073B7A] flex items-center justify-center text-[#F4EECF]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-serif text-[#F4EECF]">Customer QR Scanner</h3>
              <p className="text-[10px] text-neutral-400">Point camera at customer digital pass</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner().finally(() => onClose());
            }}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          {/* HTML5 QR Container */}
          <div
            id={containerId}
            className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
          />

          {/* Viewfinder Overlay & Scanning Laser (when active and no error) */}
          {!error && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened borders */}
              <div className="relative w-64 h-64 border-2 border-[#F4EECF]/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* 4 Corner brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#F4EECF] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#F4EECF] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#F4EECF] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#F4EECF] rounded-br-lg" />

                {/* Animated Laser Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#F4EECF] to-transparent shadow-[0_0_12px_#F4EECF] animate-bounce" />
              </div>
            </div>
          )}

          {/* Initializing Loader */}
          {isInitializing && !error && (
            <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full border-2 border-[#F4EECF] border-t-transparent animate-spin" />
              <span className="text-xs font-mono text-[#F4EECF]">Starting camera stream...</span>
            </div>
          )}

          {/* Success Flash Indicator */}
          {scannedResult && (
            <div className="absolute inset-0 bg-[#0A52A9]/95 flex flex-col items-center justify-center gap-2 text-[#F4EECF] p-4 text-center animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-12 h-12 text-[#F4EECF] animate-pulse" />
              <span className="text-sm font-semibold font-serif">Customer pass identified!</span>
              <span className="text-xs font-mono text-[#F4EECF]/80 truncate max-w-xs">{scannedResult}</span>
            </div>
          )}

          {/* Error Message Card */}
          {error && (
            <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-700 text-red-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4 max-w-xs">{error}</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0A52A9] hover:bg-[#073B7A] text-[#F4EECF] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#073B7A]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload QR Screenshot / Image</span>
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFacingMode}
              className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Flip Camera (Front / Rear)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload QR Image"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            {/* Hidden file upload input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <button
            onClick={() => stopScanner().finally(() => onClose())}
            className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
