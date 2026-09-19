'use client';

import { CalendarClock, Layers, Pencil, Plus, SquareKanban, Target, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/topbar';
import { BoardForm } from '@/components/board/board-form';
import { SpaceForm } from '@/components/space/space-form';
import { Badge, Button, Card, EmptyState, PageLoader, ProgressBar } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/overlays';
import { apiError } from '@/lib/api';
import { useBoards, useDeletePlatform, usePlatforms, useSpaceTemplates } from '@/lib/queries';
import { KIND_META, SPACE_KINDS, countdown, daysUntil } from '@/lib/spaces';
import type { Platform, SpaceKind } from '@/lib/types';
import { TONE, cn, formatDate, plural, progress } from '@/lib/utils';

/** Red once the date has passed, amber in the last two weeks. */
function countdownTone(days: number) {
  if (days < 0) return TONE.rose;
  if (days <= 14) return TONE.amber;
  return TONE.accent;
}

function SpaceCard({
  space,
  onEdit,
  onDelete,
  onAddBoard,
}: {
  space: Platform;
  onEdit: () => void;
  onDelete: () => void;
  onAddBoard: () => void;
}) {
  const { data: boards = [] } = useBoards(space.id);
  const meta = KIND_META[space.kind ?? 'PLATFORM'];
  const Icon = meta.icon;
  const days = daysUntil(space.targetDate);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="h-1" style={{ backgroundColor: space.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200"
              style={{ color: space.color }}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h3 className="serif truncate text-[20px] leading-tight text-ink-900">{space.name}</h3>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
                {space.code} · {meta.label}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={onEdit}
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              aria-label={`Edit ${space.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              aria-label={`Delete ${space.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {(space.goal || space.targetDate) && (
          <div className="mt-4 space-y-1.5 text-[13px]">
            {space.goal && (
              <p className="flex items-center gap-2 text-ink-800">
                <Target className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span className="truncate">{space.goal}</span>
              </p>
            )}
            {space.targetDate && days !== null && (
              <p className="flex flex-wrap items-center gap-2 text-ink-500">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <span>
                  {meta.dateLabel} · {formatDate(space.targetDate)}
                </span>
                <Badge className={countdownTone(days)}>{countdown(space.targetDate)}</Badge>
              </p>
            )}
          </div>
        )}

        {space.description && (
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{space.description}</p>
        )}

        {space.taskCount > 0 && (
          <div className="mt-4">
            <ProgressBar value={progress(space.doneCount, space.taskCount)} />
            <p className="mt-1.5 font-mono text-[11px] text-ink-500">
              {space.doneCount}/{space.taskCount} done
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Badge className={TONE.neutral}>{plural(space.boardCount, 'board')}</Badge>
          <Badge className={TONE.neutral}>{plural(space.taskCount, 'task')}</Badge>
          {!space.active && <Badge className={TONE.amber}>Archived</Badge>}
        </div>

        <div className="mt-4 flex-1 space-y-0.5">
          {boards.slice(0, 5).map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.boardKey}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: board.color }} />
              <span className="truncate">{board.name}</span>
              <span className="ml-auto font-mono text-[11px] text-ink-400">{board.taskCount}</span>
            </Link>
          ))}
          {boards.length === 0 && (
            <p className="px-2 py-1.5 text-[12.5px] italic text-ink-400">No boards in this space yet.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end border-t border-ink-200 pt-3">
          <Button variant="ghost" size="sm" onClick={onAddBoard}>
            <SquareKanban className="h-3.5 w-3.5" />
            Add board
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function SpacesPage() {
  const { data: spaces, isLoading } = usePlatforms();
  const { data: templates = [] } = useSpaceTemplates();
  const deleteSpace = useDeletePlatform();

  const [kindFilter, setKindFilter] = useState<SpaceKind | null>(null);
  const [creating, setCreating] = useState(false);
  const [templateFor, setTemplateFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [deleting, setDeleting] = useState<Platform | null>(null);
  const [boardFor, setBoardFor] = useState<number | null>(null);

  const all = spaces ?? [];
  const kinds = SPACE_KINDS.filter((kind) => all.some((space) => (space.kind ?? 'PLATFORM') === kind));
  // a filter left over from a kind whose last space was just deleted shows everything again
  const activeFilter = kindFilter && kinds.includes(kindFilter) ? kindFilter : null;
  const shown = activeFilter ? all.filter((space) => (space.kind ?? 'PLATFORM') === activeFilter) : all;

  function openCreate(template: string | null = null) {
    setTemplateFor(template);
    setCreating(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteSpace.mutateAsync(deleting.id);
      toast.success('Space deleted');
      setDeleting(null);
    } catch (error) {
      toast.error(apiError(error, 'The space could not be deleted.'));
    }
  }

  return (
    <>
      <Topbar
        title="Spaces"
        subtitle="Products, exams, a job hunt - whatever your boards and diagrams belong to"
        actions={
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="h-4 w-4" />
            New space
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1400px] space-y-8">
          {isLoading ? (
            <PageLoader />
          ) : all.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-5 w-5" />}
              title="No spaces yet"
              description="A space is the top level: a product, an exam like IELTS, a job hunt. Create one, then add boards to it."
              action={
                <Button onClick={() => openCreate()}>
                  <Plus className="h-4 w-4" />
                  New space
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              {kinds.length > 1 && (
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by kind">
                  {[null, ...kinds].map((kind) => {
                    const on = activeFilter === kind;
                    const count = kind ? all.filter((space) => (space.kind ?? 'PLATFORM') === kind).length : all.length;
                    return (
                      <button
                        key={kind ?? 'all'}
                        onClick={() => setKindFilter(kind)}
                        aria-pressed={on}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                          on
                            ? 'border-ink-900 bg-ink-900 text-ink-50'
                            : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-900',
                        )}
                      >
                        {kind ? KIND_META[kind].label : 'All'}
                        <span className={cn('font-mono text-[11px]', on ? 'text-ink-300' : 'text-ink-400')}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {shown.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    onEdit={() => setEditing(space)}
                    onDelete={() => setDeleting(space)}
                    onAddBoard={() => setBoardFor(space.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && templates.length > 0 && (
            <section>
              <h2 className="eyebrow mb-3">Start from a template</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => {
                  const Icon = KIND_META[template.kind].icon;
                  return (
                    <button
                      key={template.key}
                      onClick={() => openCreate(template.key)}
                      className="group flex items-start gap-3 rounded-md border border-dashed border-ink-300 bg-surface p-4 text-left transition-colors hover:border-ink-400"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-200"
                        style={{ color: template.color }}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] text-ink-900 group-hover:text-brand-600">{template.boardName}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">{template.description}</span>
                        <span className="mt-2 block font-mono text-[11px] text-ink-400">
                          {template.columns.length} columns · {template.taskCount} tasks · goal: {template.goal}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      <SpaceForm open={creating} onClose={() => setCreating(false)} initialTemplate={templateFor} />
      <SpaceForm open={Boolean(editing)} onClose={() => setEditing(null)} space={editing} />
      <BoardForm open={Boolean(boardFor)} onClose={() => setBoardFor(null)} defaultPlatformId={boardFor} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteSpace.isPending}
        title={`Delete ${deleting?.name ?? 'space'}?`}
        message="A space can only be deleted once its boards and diagrams have been removed or moved."
        confirmLabel="Delete space"
      />
    </>
  );
}
