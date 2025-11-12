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

import { useEffect, useState } from 'react';

function LoginClient() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceSecret, setDeviceSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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

  const onScanText = async (text: string) => {
    try {
      const data = JSON.parse(text);
      if (data.deviceId && data.deviceSecret) {
        setDeviceId(data.deviceId);
        setDeviceSecret(data.deviceSecret);
      }
    } catch {}
  };

  useEffect(() => {
    let active = true;
    (async () => {
      // Lazy import ZXing only on client to avoid SSR bundling issues
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const codeReader = new BrowserQRCodeReader();
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!active || videoInputDevices.length === 0) return;
        const deviceIdCam = videoInputDevices[0].deviceId;
        const result = await codeReader.decodeOnceFromVideoDevice(deviceIdCam, 'video');
        if (result?.getText()) onScanText(result.getText());
      } catch {
        // camera may be blocked without HTTPS; ignore
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black/5 rounded flex items-center justify-center overflow-hidden">
        <video id="video" className="w-full h-full object-cover" />
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Device ID" value={deviceId} onChange={(e)=>setDeviceId(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Device Secret" value={deviceSecret} onChange={(e)=>setDeviceSecret(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">Login</button>
      </form>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
