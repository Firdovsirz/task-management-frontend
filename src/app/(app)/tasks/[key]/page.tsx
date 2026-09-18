'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { TaskDetailPanel } from '@/components/task/task-detail';
import { Card } from '@/components/ui';

export default function TaskPage() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const taskKey = (params?.key ?? '').toUpperCase();

  return (
    <>
      <Topbar
        title={taskKey}
        subtitle="Task detail"
        actions={
          <Link
            href="/tasks"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to tasks
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1100px]">
          <Card className="flex min-h-[70vh] flex-col overflow-hidden">
            <TaskDetailPanel taskKey={taskKey} onDeleted={() => router.push('/tasks')} />
          </Card>
        </div>
      </div>
    </>
  );
}
