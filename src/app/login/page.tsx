"use client";

export default function LoginPage() {
  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tablet Login</h1>
      <p className="text-sm text-zinc-600">Scan the QR from the enrollment page or enter the codes manually.</p>
      <LoginClient />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

function LoginClient() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceSecret, setDeviceSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<unknown>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, deviceSecret }),
    });
    const j = await res.json();
    if (res.ok) setMessage('Login successful.');
    else setMessage(j.error || 'Login failed');
  };

  const onScanText = (text: string) => {
    try {
      const data = JSON.parse(text);
      if (data.deviceId && data.deviceSecret) {
        setDeviceId(data.deviceId);
        setDeviceSecret(data.deviceSecret);
        setMessage('Scanned. You can press Login now.');
      }
    } catch {
      setScanError('QR not recognized.');
    }
  };

  const stopScanner = () => {
    setScanning(false);
    setScanError(null);
    try {
      if (codeReaderRef.current && typeof (codeReaderRef.current as { reset?: () => void }).reset === 'function') {
        (codeReaderRef.current as { reset: () => void }).reset();
      }
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
    } catch {}
  };

  const startScanner = async () => {
    setScanError(null);
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;
      const video = videoRef.current!;
      // Request environment (rear) camera; requires user gesture on iOS
      await codeReader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        video,
        (result, _err) => {
          if (result) {
            onScanText(result.getText());
            stopScanner();
          }
        }
      );
      setScanning(true);
    } catch (_e: unknown) {
      setScanError('Camera unavailable. Ensure HTTPS and allow camera access.');
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black/5 rounded flex items-center justify-center overflow-hidden">
        <video
          id="video"
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
      </div>
      <div className="flex gap-2">
        {!scanning ? (
          <button type="button" onClick={startScanner} className="px-4 py-2 rounded border">Start scanner</button>
        ) : (
          <button type="button" onClick={stopScanner} className="px-4 py-2 rounded border">Stop scanner</button>
        )}
      </div>
      {scanError && <p className="text-sm text-red-600">{scanError}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Device ID" value={deviceId} onChange={(e)=>setDeviceId(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Device Secret" value={deviceSecret} onChange={(e)=>setDeviceSecret(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">Login</button>
      </form>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
