'use client';

import { useState } from 'react';

interface Device {
  id: string;
  label: string;
  active: boolean;
  createdAt: string;
  revokedAt?: string | null;
}

interface EnrollResponse {
  device: Device;
  deviceSecret: string;
  qrDataUrl: string;
}

export default function EnrollClient() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrollResponse | null>(null);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/enroll', { method: 'POST' });
      const j: EnrollResponse = await res.json();
      setData(j);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Creating…' : 'Create Device & Show QR'}
      </button>
      {data && (
        <div className="border rounded p-4 space-y-2">
          <p><strong>Device ID:</strong> {data.device.id}</p>
          <p><strong>Device Secret:</strong> {data.deviceSecret}</p>
          <p className="text-sm text-zinc-600">Print or save this QR for the tablet to scan.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.qrDataUrl} alt="Device QR" width={280} height={280} />
        </div>
      )}
    </div>
  );
}
