import { DocumentBuilder } from '@/components/documents/DocumentBuilder';
import { Suspense } from 'react';

export const metadata = {
  title: 'Document Builder | Fee Calculator',
};

export default function DocumentsPage() {
  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden w-full">
      <Suspense fallback={<div className="p-8 text-slate-500">Loading document builder...</div>}>
        <DocumentBuilder />
      </Suspense>
    </div>
  );
}
