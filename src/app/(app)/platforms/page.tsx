'use client';

import { Layers, Pencil, Plus, SquareKanban, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/topbar';
import { BoardForm } from '@/components/board/board-form';
import { PlatformForm } from '@/components/platform/platform-form';
import { Badge, Button, Card, EmptyState, PageLoader } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/overlays';
import { apiError } from '@/lib/api';
import { useBoards, useDeletePlatform, usePlatforms } from '@/lib/queries';
import type { Platform } from '@/lib/types';
import { TONE, plural } from '@/lib/utils';

function PlatformCard({
  platform,
  onEdit,
  onDelete,
  onAddBoard,
}: {
  platform: Platform;
  onEdit: () => void;
  onDelete: () => void;
  onAddBoard: () => void;
}) {
  const { data: boards = [] } = useBoards(platform.id);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="h-1" style={{ backgroundColor: platform.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200"
              style={{ color: platform.color }}
            >
              <Layers className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h3 className="serif truncate text-[20px] leading-tight text-ink-900">{platform.name}</h3>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">{platform.code}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={onEdit}
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              aria-label="Edit platform"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              aria-label="Delete platform"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {platform.description && (
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{platform.description}</p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Badge className={TONE.neutral}>{plural(platform.boardCount, 'board')}</Badge>
          <Badge className={TONE.neutral}>{plural(platform.taskCount, 'task')}</Badge>
          {!platform.active && <Badge className={TONE.amber}>Archived</Badge>}
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
            <p className="px-2 py-1.5 text-[12.5px] italic text-ink-400">No boards on this platform yet.</p>
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

export default function PlatformsPage() {
  const { data: platforms, isLoading } = usePlatforms();
  const deletePlatform = useDeletePlatform();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [deleting, setDeleting] = useState<Platform | null>(null);
  const [boardFor, setBoardFor] = useState<number | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deletePlatform.mutateAsync(deleting.id);
      toast.success('Platform deleted');
      setDeleting(null);
    } catch (error) {
      toast.error(apiError(error, 'The platform could not be deleted.'));
    }
  }

  return (
    <>
      <Topbar
        title="Platforms"
        subtitle="The areas of work your boards and diagrams belong to"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New platform
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          {isLoading ? (
            <PageLoader />
          ) : (platforms ?? []).length === 0 ? (
            <EmptyState
              icon={<Layers className="h-5 w-5" />}
              title="No platforms yet"
              description="Platforms are the top level: research, side projects, personal. Create one, then add boards to it."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  New platform
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {(platforms ?? []).map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  onEdit={() => setEditing(platform)}
                  onDelete={() => setDeleting(platform)}
                  onAddBoard={() => setBoardFor(platform.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PlatformForm open={creating} onClose={() => setCreating(false)} />
      <PlatformForm open={Boolean(editing)} onClose={() => setEditing(null)} platform={editing} />
      <BoardForm open={Boolean(boardFor)} onClose={() => setBoardFor(null)} defaultPlatformId={boardFor} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletePlatform.isPending}
        title={`Delete ${deleting?.name ?? 'platform'}?`}
        message="A platform can only be deleted once its boards and diagrams have been removed or moved."
        confirmLabel="Delete platform"
      />
    </>
  );
}
