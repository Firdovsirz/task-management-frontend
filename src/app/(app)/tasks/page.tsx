'use client';

import { ListChecks, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { TaskDrawer } from '@/components/task/task-detail';
import { Badge, Button, Card, EmptyState, Input, PageLoader, Select } from '@/components/ui';
import { useBoards, useTasks } from '@/lib/queries';
import type { ColumnCategory, Priority, TaskType } from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_META,
  PRIORITIES,
  PRIORITY_META,
  TASK_TYPES,
  TONE,
  TYPE_META,
  cn,
  dueLabel,
  fromNow,
} from '@/lib/utils';

function TasksContent() {
  const searchParams = useSearchParams();
  const { data: boards = [] } = useBoards();

  const [search, setSearch] = useState('');
  const [boardId, setBoardId] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [openTask, setOpenTask] = useState<string | null>(null);

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch) setSearch(querySearch);
  }, [searchParams]);

  const { data, isLoading } = useTasks({
    boardId: boardId ? Number(boardId) : null,
    type: (type || null) as TaskType | null,
    priority: (priority || null) as Priority | null,
    category: (category || null) as ColumnCategory | null,
    search,
    page,
    size: 25,
  });

  const filtered = Boolean(search || boardId || type || priority || category);

  return (
    <>
      <Topbar
        title="Tasks"
        subtitle={
          data
            ? `${data.totalElements} task${data.totalElements === 1 ? '' : 's'}${filtered ? ' match your filters' : ' across every board'}`
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search by title or key…"
                className="pl-9"
              />
            </div>
            <Select value={boardId} onChange={(event) => { setBoardId(event.target.value); setPage(0); }} className="w-auto min-w-[170px]">
              <option value="">All boards</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </Select>
            <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); }} className="w-auto min-w-[150px]">
              <option value="">Any status</option>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_META[value].label}
                </option>
              ))}
            </Select>
            <Select value={type} onChange={(event) => { setType(event.target.value); setPage(0); }} className="w-auto min-w-[140px]">
              <option value="">Any type</option>
              {TASK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_META[value].label}
                </option>
              ))}
            </Select>
            <Select value={priority} onChange={(event) => { setPriority(event.target.value); setPage(0); }} className="w-auto min-w-[150px]">
              <option value="">Any priority</option>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_META[value].label}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : !data || data.content.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-5 w-5" />}
              title="Nothing to show"
              description={filtered ? 'No tasks match these filters.' : 'Open a board and add the first task.'}
            />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-ink-100">
                {data.content.map((task) => (
                  <li key={task.id}>
                    <button
                      onClick={() => setOpenTask(task.taskKey)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-100/50 sm:px-5"
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold',
                          TYPE_META[task.type].color,
                        )}
                        title={TYPE_META[task.type].label}
                      >
                        {TYPE_META[task.type].glyph}
                      </span>
                      <span className="hidden w-20 shrink-0 font-mono text-[11.5px] text-ink-400 sm:block">
                        {task.taskKey}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-ink-900">{task.title}</span>
                        <span className="mt-0.5 block font-mono text-[10.5px] text-ink-400">
                          Updated {fromNow(task.updatedAt)}
                        </span>
                      </span>
                      <Badge className={CATEGORY_META[task.category].color}>{CATEGORY_META[task.category].label}</Badge>
                      {task.dueDate && (
                        <Badge className={task.overdue ? TONE.rose : TONE.neutral}>{dueLabel(task.dueDate)}</Badge>
                      )}
                      <span
                        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_META[task.priority].dot)}
                        title={`${PRIORITY_META[task.priority].label} priority`}
                      />
                    </button>
                  </li>
                ))}
              </ul>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3">
                  <p className="font-mono text-[11.5px] text-ink-500">
                    Page {data.page + 1} of {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={data.page === 0}
                      onClick={() => setPage((value) => Math.max(0, value - 1))}
                    >
                      Previous
                    </Button>
                    <Button variant="secondary" size="sm" disabled={data.last} onClick={() => setPage((value) => value + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <TaskDrawer taskKey={openTask} open={Boolean(openTask)} onClose={() => setOpenTask(null)} />
    </>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TasksContent />
    </Suspense>
  );
}
