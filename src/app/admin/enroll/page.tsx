export const dynamic = 'force-dynamic';

import 'server-only';
import EnrollClient from './EnrollClient';

export default async function EnrollPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Enroll a Tablet</h1>
      <EnrollClient />
    </div>
  );
}
