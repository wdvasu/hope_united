import { Suspense } from 'react';
import ByPersonClient from './ByPersonClient';

export default function AdminByPersonPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ByPersonClient />
    </Suspense>
  );
}
