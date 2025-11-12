export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function AdminRegistrationsPage() {
  const regs = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Recent Registrations</h1>
      <div>
        <Link
          className="px-3 py-2 rounded bg-black text-white"
          href="/api/registrations/export?format=csv"
        >
          Download CSV
        </Link>
      </div>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">UID</th>
              <th className="text-left p-2">Full Name</th>
              <th className="text-left p-2">ZIP</th>
              <th className="text-left p-2">Veteran</th>
              <th className="text-left p-2">Drugs</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2 font-mono">{r.uid}</td>
                <td className="p-2">{r.fullName}</td>
                <td className="p-2">{r.zipCode}</td>
                <td className="p-2">{r.veteranStatus}</td>
                <td className="p-2">{(r.drugs || []).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
