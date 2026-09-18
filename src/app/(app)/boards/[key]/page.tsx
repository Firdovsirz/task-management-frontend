'use client';

import { Filter, Search, Settings2, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { BoardForm } from '@/components/board/board-form';
import { BoardSettings } from '@/components/board/board-settings';
import { KanbanBoardView } from '@/components/board/kanban';
import { TaskDrawer } from '@/components/task/task-detail';
import { TaskForm } from '@/components/task/task-form';
import { Button, EmptyState, Input, PageLoader, Select } from '@/components/ui';
import { useBoard, useKanban } from '@/lib/queries';
import type { Priority, TaskType } from '@/lib/types';
import { PRIORITIES, PRIORITY_META, TASK_TYPES, TYPE_META, cn } from '@/lib/utils';

export default function BoardPage() {
  const params = useParams<{ key: string }>();
  const boardKey = (params?.key ?? '').toUpperCase();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [creatingIn, setCreatingIn] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);
  const [openTask, setOpenTask] = useState<string | null>(null);

  const { data: board, isLoading: loadingBoard, isError } = useBoard(boardKey);
  const { data: kanban, isLoading } = useKanban(boardKey, {
    type: (type || null) as TaskType | null,
    priority: (priority || null) as Priority | null,
    search,
  });

  const hasFilters = Boolean(search || type || priority);

  function clearFilters() {
    setSearch('');
    setType('');
    setPriority('');
  }

  if (isError) {
    return (
      <>
        <Topbar title="Board" />
        <div className="flex-1 p-6">
          <EmptyState title="Board not found" description={`No board with the key ${boardKey} exists.`} />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={board?.name ?? boardKey}
        subtitle={board ? `${board.platform?.name ?? 'Platform'} · ${board.taskCount} tasks` : undefined}
        onCreateTask={board ? () => { setCreatingIn(null); setCreating(true); } : undefined}
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant={hasFilters ? 'subtle' : 'ghost'}
              size="icon"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-label="Filters"
            >
              <Filter className="h-[18px] w-[18px]" />
            </Button>
            {board && (
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Board settings">
                <Settings2 className="h-[18px] w-[18px]" />
              </Button>
            )}
          </div>
        }
      />

      {filtersOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 bg-surface px-4 py-3 sm:px-6">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by title or key…"
              className="h-9 pl-9"
            />
          </div>
          <Select value={type} onChange={(event) => setType(event.target.value)} className="h-9 w-auto min-w-[140px]">
            <option value="">Any type</option>
            {TASK_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_META[value].label}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-9 w-auto min-w-[150px]">
            <option value="">Any priority</option>
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_META[value].label}
              </option>
            ))}
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      )}

      <div className={cn('flex-1 overflow-hidden px-4 py-5 sm:px-6')}>
        {isLoading || loadingBoard || !kanban ? (
          <PageLoader label="Loading board…" />
        ) : kanban.columns.length === 0 ? (
          <EmptyState
            title="This board has no columns"
            description="Add columns from the board settings."
          />
        ) : (
          <div className="h-full">
            {board?.description && (
              <p className="mb-4 max-w-3xl text-[13.5px] leading-relaxed text-ink-500">{board.description}</p>
            )}
            <KanbanBoardView
              columns={kanban.columns}
              onOpenTask={(task) => setOpenTask(task.taskKey)}
              onCreate={(columnId) => {
                setCreatingIn(columnId);
                setCreating(true);
              }}
            />
          </div>
        )}
      </div>

      {board && (
        <>
          <TaskForm
            open={creating}
            onClose={() => setCreating(false)}
            boardId={board.id}
            columns={board.columns}
            defaultColumnId={creatingIn}
          />
          <BoardSettings
            board={board}
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onEditBoard={() => {
              setSettingsOpen(false);
              setEditingBoard(true);
            }}
          />
          <BoardForm open={editingBoard} onClose={() => setEditingBoard(false)} board={board} />
        </>
      )}

      <TaskDrawer taskKey={openTask} open={Boolean(openTask)} onClose={() => setOpenTask(null)} />
    </>
  );
}
