'use client';

import { Network, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DiagramForm } from '@/components/architecture/diagram-form';
import { Topbar } from '@/components/layout/topbar';
import { Badge, Button, Card, EmptyState, Input, PageLoader, Select } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/overlays';
import { apiError } from '@/lib/api';
import { useDeleteDiagram, useDiagrams, usePlatforms } from '@/lib/queries';
import { STATUS_META } from '@/lib/architecture';
import type { DiagramSummary } from '@/lib/types';
import { fromNow, plural } from '@/lib/utils';

export default function ArchitecturePage() {
  const [platformId, setPlatformId] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DiagramSummary | null>(null);
  const [deleting, setDeleting] = useState<DiagramSummary | null>(null);

  const { data: platforms = [] } = usePlatforms();
  const { data: diagrams, isLoading } = useDiagrams(platformId ? Number(platformId) : null);
  const deleteDiagram = useDeleteDiagram();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return diagrams ?? [];
    return (diagrams ?? []).filter(
      (diagram) =>
        diagram.name.toLowerCase().includes(term) ||
        (diagram.platformName ?? '').toLowerCase().includes(term),
    );
  }, [diagrams, search]);

  return (
    <>
      <Topbar
        title="Architecture"
        subtitle="How the things you build fit together, and why"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New diagram
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1400px] space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search diagrams…"
                className="pl-9"
              />
            </div>
            <Select value={platformId} onChange={(event) => setPlatformId(event.target.value)} className="w-full sm:w-56">
              <option value="">All spaces</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Network className="h-5 w-5" />}
              title="No architecture diagrams yet"
              description="Sketch a system's components and connections, and keep the decisions behind it next to them."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  New diagram
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((diagram) => (
                <Link key={diagram.id} href={`/architecture/${diagram.id}`} className="group">
                  <Card className="h-full overflow-hidden transition-colors group-hover:border-ink-300">
                    <div className="h-1" style={{ backgroundColor: diagram.color ?? '#059669' }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="serif min-w-0 truncate text-[18px] leading-snug text-ink-900 group-hover:text-brand-600">
                          {diagram.name}
                        </h3>
                        <Badge className={STATUS_META[diagram.status].color}>{STATUS_META[diagram.status].label}</Badge>
                      </div>

                      {diagram.platformName && (
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-400">{diagram.platformName}</p>
                      )}
                      {diagram.description && (
                        <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">
                          {diagram.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-ink-500">
                        <span>{plural(diagram.nodeCount, 'component')}</span>
                        <span className="flex items-center gap-1.5">
                          <span>{diagram.updatedAt ? fromNow(diagram.updatedAt) : ''}</span>
                          <span className="ml-1 flex items-center gap-0.5 border-l border-ink-200 pl-1.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setEditing(diagram);
                              }}
                              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                              aria-label={`Edit ${diagram.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setDeleting(diagram);
                              }}
                              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                              aria-label={`Delete ${diagram.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <DiagramForm
        open={creating}
        onClose={() => setCreating(false)}
        defaultPlatformId={platformId ? Number(platformId) : null}
      />
      <DiagramForm open={Boolean(editing)} onClose={() => setEditing(null)} diagram={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteDiagram.mutateAsync(deleting.id);
            toast.success(`${deleting.name} deleted`);
            setDeleting(null);
          } catch (error) {
            toast.error(apiError(error, 'This diagram could not be deleted.'));
          }
        }}
        loading={deleteDiagram.isPending}
        title={`Delete ${deleting?.name ?? 'diagram'}?`}
        message="Every component, connection and note on this diagram is permanently removed."
        confirmLabel="Delete diagram"
      />
    </>
  );
}
