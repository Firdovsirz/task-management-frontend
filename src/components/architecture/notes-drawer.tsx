'use client';

import { FileText } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { Drawer } from '@/components/ui/overlays';
import type { ArchNode, ArchNoteKind, ArchNoteStatus } from '@/lib/types';
import { TONE, formatDate } from '@/lib/utils';

const NOTE_KIND_LABEL: Record<ArchNoteKind, string> = {
  DECISION: 'Decisions',
  CONSTRAINT: 'Constraints',
  RISK: 'Risks',
  ASSUMPTION: 'Assumptions',
  NOTE: 'Notes',
};

const NOTE_STATUS_META: Record<ArchNoteStatus, { label: string; color: string }> = {
  PROPOSED: { label: 'Proposed', color: TONE.amber },
  ACCEPTED: { label: 'Accepted', color: TONE.accent },
  SUPERSEDED: { label: 'Superseded', color: TONE.neutral },
  REJECTED: { label: 'Rejected', color: TONE.rose },
};

const ORDER: ArchNoteKind[] = ['DECISION', 'CONSTRAINT', 'RISK', 'ASSUMPTION', 'NOTE'];

/**
 * The decision log. A read-mostly list is exactly what a modal overlay is for, which is why
 * this uses Drawer while the editing inspector deliberately does not.
 */
export function NotesDrawer({
  open,
  onClose,
  nodes,
  onShowOnCanvas,
}: {
  open: boolean;
  onClose: () => void;
  nodes: ArchNode[];
  onShowOnCanvas: (node: ArchNode) => void;
}) {
  const notes = nodes.filter((node) => node.kind === 'NOTE' || (node.description ?? '').trim().length > 0);
  const grouped = ORDER.map((kind) => ({
    kind,
    items: notes.filter((node) => (node.kind === 'NOTE' ? (node.noteKind ?? 'NOTE') === kind : kind === 'NOTE')),
  })).filter((group) => group.items.length > 0);

  return (
    <Drawer open={open} onClose={onClose} width="max-w-xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-ink-200 px-5 py-4">
          <h2 className="serif text-[22px] text-ink-900">Notes &amp; decisions</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Every note on this diagram, plus any component that carries a description.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {grouped.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="Nothing recorded yet"
              description="Add a Note to the canvas, or describe a component, and it will appear here."
            />
          ) : (
            grouped.map((group) => (
              <section key={group.kind}>
                <h3 className="eyebrow mb-2">
                  {NOTE_KIND_LABEL[group.kind]}
                </h3>
                <div className="space-y-2.5">
                  {group.items.map((node) => (
                    <article key={node.id} className="rounded-md border border-ink-200 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[14px] text-ink-900">{node.name}</h4>
                        {node.noteStatus && (
                          <Badge className={NOTE_STATUS_META[node.noteStatus].color}>
                            {NOTE_STATUS_META[node.noteStatus].label}
                          </Badge>
                        )}
                      </div>

                      {node.description && (
                        <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-600">
                          {node.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-ink-400">
                        {node.decidedOn && <span>Decided {formatDate(node.decidedOn)}</span>}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={() => onShowOnCanvas(node)}
                        >
                          Show on canvas
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
}
