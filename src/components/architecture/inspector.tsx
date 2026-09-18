'use client';

import { Link2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { MAX_HEIGHT, MAX_WIDTH, MIN_HEIGHT, MIN_WIDTH } from '@/lib/architecture';
import type { ArchEdge, ArchNode, ArchNodeKind, ArchNoteKind, ArchNoteStatus, NodePayload } from '@/lib/types';

const KINDS: ArchNodeKind[] = ['COMPONENT', 'SERVICE', 'DATABASE', 'EXTERNAL', 'NOTE'];
const NOTE_KINDS: ArchNoteKind[] = ['DECISION', 'CONSTRAINT', 'RISK', 'ASSUMPTION', 'NOTE'];
const NOTE_STATUSES: ArchNoteStatus[] = ['PROPOSED', 'ACCEPTED', 'SUPERSEDED', 'REJECTED'];

/**
 * A plain aside rather than the Drawer primitive: Drawer is modal and locks page scroll, which
 * would freeze the canvas behind it while you are editing what is on it.
 */
export function NodeInspector({
  node,
  saving,
  onSave,
  onDelete,
  onStartConnect,
}: {
  node: ArchNode;
  saving: boolean;
  onSave: (payload: NodePayload) => void;
  onDelete: () => void;
  onStartConnect: () => void;
}) {
  const [draft, setDraft] = useState<NodePayload>(() => toPayload(node));

  useEffect(() => setDraft(toPayload(node)), [node]);

  const isNote = draft.kind === 'NOTE';

  return (
    <div className="space-y-3.5">
      <Field label="Name">
        <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </Field>

      <Field label="Type">
        <Select
          value={draft.kind}
          onChange={(event) => setDraft({ ...draft, kind: event.target.value as ArchNodeKind })}
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind.charAt(0) + kind.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Technology">
        <Input
          value={draft.technology ?? ''}
          placeholder="Spring Boot 3.3 / Java 21"
          onChange={(event) => setDraft({ ...draft, technology: event.target.value })}
        />
      </Field>

      <Field label={isNote ? 'Note' : 'Description'}>
        <Textarea
          rows={isNote ? 5 : 3}
          value={draft.description ?? ''}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </Field>

      {isNote && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Record">
              <Select
                value={draft.noteKind ?? 'NOTE'}
                onChange={(event) => setDraft({ ...draft, noteKind: event.target.value as ArchNoteKind })}
              >
                {NOTE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind.charAt(0) + kind.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={draft.noteStatus ?? 'PROPOSED'}
                onChange={(event) => setDraft({ ...draft, noteStatus: event.target.value as ArchNoteStatus })}
              >
                {NOTE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Decided on">
            <Input
              type="date"
              value={draft.decidedOn ?? ''}
              // An empty date input yields "", which Jackson refuses to bind to LocalDate.
              onChange={(event) => setDraft({ ...draft, decidedOn: event.target.value || null })}
            />
          </Field>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Width">
          <Input
            type="number"
            step={10}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            value={draft.width ?? 220}
            onChange={(event) => setDraft({ ...draft, width: Number(event.target.value) })}
          />
        </Field>
        <Field label="Height">
          <Input
            type="number"
            step={10}
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            value={draft.height ?? 100}
            onChange={(event) => setDraft({ ...draft, height: Number(event.target.value) })}
          />
        </Field>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" loading={saving} onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={onStartConnect}>
          <Link2 className="h-3.5 w-3.5" />
          Connect
        </Button>
        <button
          onClick={onDelete}
          className="ml-auto rounded-full p-1.5 text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
          aria-label="Delete component"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function EdgeInspector({
  edge,
  saving,
  onSave,
  onDelete,
}: {
  edge: ArchEdge;
  saving: boolean;
  onSave: (payload: { label: string; technology: string; dashed: boolean }) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(edge.label ?? '');
  const [technology, setTechnology] = useState(edge.technology ?? '');
  const [dashed, setDashed] = useState(edge.dashed);

  useEffect(() => {
    setLabel(edge.label ?? '');
    setTechnology(edge.technology ?? '');
    setDashed(edge.dashed);
  }, [edge]);

  return (
    <div className="space-y-3.5">
      <Field label="Label">
        <Input value={label} placeholder="reads published posts" onChange={(event) => setLabel(event.target.value)} />
      </Field>
      <Field label="Technology">
        <Input value={technology} placeholder="HTTPS/JSON" onChange={(event) => setTechnology(event.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-[13px] text-ink-700">
        <input type="checkbox" checked={dashed} onChange={(event) => setDashed(event.target.checked)} />
        Dashed line
      </label>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" loading={saving} onClick={() => onSave({ label, technology, dashed })}>
          Save
        </Button>
        <button
          onClick={onDelete}
          className="ml-auto rounded-full p-1.5 text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
          aria-label="Delete connection"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function toPayload(node: ArchNode): NodePayload {
  return {
    name: node.name,
    kind: node.kind,
    description: node.description ?? '',
    technology: node.technology ?? '',
    color: node.color ?? null,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    noteKind: node.noteKind ?? null,
    noteStatus: node.noteStatus ?? null,
    decidedOn: node.decidedOn ?? null,
  };
}
