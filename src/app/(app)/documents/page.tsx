import { DocumentBuilder } from '@/components/documents/DocumentBuilder';
import { Suspense } from 'react';

export const metadata = {
  title: 'Document Builder | Fee Calculator',
};

export default function DocumentsPage() {
  return (
    <div className="flex h-full bg-ink-50 dark:bg-ink-950 overflow-hidden w-full">
      <Suspense fallback={<div className="p-8 text-ink-500">Loading document builder...</div>}>
        <DocumentBuilder />
      </Suspense>
    </div>
  );
}
