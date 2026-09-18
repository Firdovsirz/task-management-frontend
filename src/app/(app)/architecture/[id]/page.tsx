'use client';

import { ArrowLeft, Box, Cloud, Database, FileText, Minus, Plus, Server, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArchitectureCanvas } from '@/components/architecture/canvas';
import { EdgeInspector, NodeInspector } from '@/components/architecture/inspector';
import { NotesDrawer } from '@/components/architecture/notes-drawer';
import { Topbar } from '@/components/layout/topbar';
import { Badge, Button, PageLoader } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/overlays';
import { apiError } from '@/lib/api';
import { KIND_META, STATUS_META, ZOOM_STEPS, nextFreeSlot } from '@/lib/architecture';
import {
  useDeleteEdge,
  useDeleteNode,
  useDiagram,
  useMoveNode,
  useSaveEdge,
  useSaveNode,
} from '@/lib/queries';
import type { ArchEdge, ArchNode, ArchNodeKind, NodePayload } from '@/lib/types';

const ADD_BUTTONS: { kind: ArchNodeKind; icon: typeof Box }[] = [
  { kind: 'COMPONENT', icon: Box },
  { kind: 'SERVICE', icon: Server },
  { kind: 'DATABASE', icon: Database },
  { kind: 'EXTERNAL', icon: Cloud },
  { kind: 'NOTE', icon: StickyNote },
];

export default function DiagramPage() {
  const params = useParams<{ id: string }>();
  const diagramId = Number(params.id);

  const { data, isLoading } = useDiagram(diagramId);
  const saveNode = useSaveNode(diagramId);
  const moveNode = useMoveNode(diagramId);
  const removeNode = useDeleteNode(diagramId);
  const saveEdge = useSaveEdge(diagramId);
  const removeEdge = useDeleteEdge(diagramId);

  const [nodes, setNodes] = useState<ArchNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'node' | 'edge'; id: number; name: string } | null>(null);

  // A refetch landing mid-gesture would snap a rectangle back to its old position. The canvas
  // stays mounted for minutes, so unlike the kanban this is not a theoretical race.
  const pendingMoves = useRef(0);

  useEffect(() => {
    if (!data) return;
    if (pendingMoves.current > 0) return;
    setNodes(data.nodes);
  }, [data]);

  const edges = data?.edges ?? [];
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((e) => e.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);

  const onMove = useCallback(
    (nodeId: number, x: number, y: number) => {
      setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, x, y } : node)));
      pendingMoves.current += 1;
      moveNode.mutate(
        { nodeId, x, y },
        {
          onError: (error) => toast.error(apiError(error, 'The position could not be saved.')),
          onSettled: () => {
            pendingMoves.current = Math.max(0, pendingMoves.current - 1);
          },
        },
      );
    },
    [moveNode],
  );

  const onSelectNode = useCallback(
    (node: ArchNode) => {
      setSelectedEdgeId(null);
      if (connectFrom !== null && connectFrom !== node.id) {
        saveEdge.mutate(
          { payload: { sourceNodeId: connectFrom, targetNodeId: node.id } },
          {
            onSuccess: () => toast.success('Connected'),
            onError: (error) => toast.error(apiError(error, 'Those components could not be connected.')),
          },
        );
        setConnectFrom(null);
        return;
      }
      setSelectedNodeId(node.id);
    },
    [connectFrom, saveEdge],
  );

  // Delete/Backspace removes the selection - but never while the caret is in a text field, or
  // backspacing inside the name box would delete the thing being renamed.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (event.key === 'Escape') {
        setConnectFrom(null);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        return;
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (selectedNode) {
        event.preventDefault();
        setConfirmDelete({ kind: 'node', id: selectedNode.id, name: selectedNode.name });
      } else if (selectedEdge) {
        event.preventDefault();
        setConfirmDelete({ kind: 'edge', id: selectedEdge.id, name: selectedEdge.label ?? 'this connection' });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedNode, selectedEdge]);

  async function addNode(kind: ArchNodeKind) {
    const spot = nextFreeSlot(nodes);
    const isNote = kind === 'NOTE';
    const payload: NodePayload = {
      name: isNote ? 'New note' : `New ${KIND_META[kind].label.toLowerCase()}`,
      kind,
      x: spot.x,
      y: spot.y,
      width: isNote ? 260 : 220,
      height: isNote ? 140 : 100,
      noteKind: isNote ? 'DECISION' : null,
      noteStatus: isNote ? 'PROPOSED' : null,
    };
    try {
      const created = await saveNode.mutateAsync({ payload });
      setSelectedEdgeId(null);
      setSelectedNodeId(created.id);
    } catch (error) {
      toast.error(apiError(error, 'The component could not be added.'));
    }
  }

  if (isLoading || !data) return <PageLoader />;

  const zoomIndex = ZOOM_STEPS.indexOf(zoom);
  const showInspector = Boolean(selectedNode || selectedEdge);

  return (
    <>
      <Topbar
        title={data.diagram.name}
        subtitle={`${data.diagram.platformName ?? 'Unfiled'} · ${nodes.length} components · ${edges.length} connections`}
        actions={
          <div className="flex items-center gap-2">
            <Badge className={STATUS_META[data.diagram.status].color}>{STATUS_META[data.diagram.status].label}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setNotesOpen(true)}>
              <FileText className="h-4 w-4" />
              Notes
            </Button>
            <div className="flex items-center gap-1 rounded-full border border-ink-200 px-1.5 py-0.5">
              <button
                onClick={() => setZoom(ZOOM_STEPS[Math.max(0, zoomIndex - 1)])}
                disabled={zoomIndex <= 0}
                className="rounded-full p-1 text-ink-500 hover:text-ink-900 disabled:opacity-30"
                aria-label="Zoom out"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-[11px] tabular-nums text-ink-600">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1)])}
                disabled={zoomIndex >= ZOOM_STEPS.length - 1}
                className="rounded-full p-1 text-ink-500 hover:text-ink-900 disabled:opacity-30"
                aria-label="Zoom in"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link href="/architecture">
              <Button size="sm" variant="ghost">
                <ArrowLeft className="h-4 w-4" />
                All diagrams
              </Button>
            </Link>
          </div>
        }
      />

      <div className="arch-toolbar flex flex-wrap items-center gap-2 border-b border-ink-200 bg-surface px-4 py-2 sm:px-6">
        {ADD_BUTTONS.map(({ kind, icon: Icon }) => (
          <Button key={kind} size="sm" variant="secondary" onClick={() => addNode(kind)} loading={saveNode.isPending}>
            <Icon className="h-3.5 w-3.5" />
            {KIND_META[kind].label}
          </Button>
        ))}
        {connectFrom !== null && (
          <span className="ml-2 flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[12px] text-brand-700">
            Pick the component to connect to
            <button onClick={() => setConnectFrom(null)} className="text-brand-600 hover:text-brand-700">
              Cancel
            </button>
          </span>
        )}
      </div>

      {/* min-h-0 or the overflow-auto canvas grows to its content height and the page scrolls
          instead of the canvas. */}
      <div className="flex min-h-0 flex-1">
        <div className="arch-canvas min-w-0 flex-1 overflow-auto bg-ink-50">
          <ArchitectureCanvas
            nodes={nodes}
            edges={edges}
            zoom={zoom}
            canEdit
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            connectFrom={connectFrom}
            onSelectNode={onSelectNode}
            onSelectEdge={(edge: ArchEdge) => {
              setSelectedNodeId(null);
              setSelectedEdgeId(edge.id);
            }}
            onClearSelection={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
              setConnectFrom(null);
            }}
            onMove={onMove}
          />
        </div>

        {showInspector && (
          <aside className="arch-inspector w-[300px] shrink-0 overflow-y-auto border-l border-ink-200 bg-surface p-4">
            <h2 className="eyebrow mb-4">
              {selectedNode ? 'Component' : 'Connection'}
            </h2>
            {selectedNode ? (
              <NodeInspector
                node={selectedNode}
                saving={saveNode.isPending}
                onStartConnect={() => setConnectFrom(selectedNode.id)}
                onDelete={() =>
                  setConfirmDelete({ kind: 'node', id: selectedNode.id, name: selectedNode.name })
                }
                onSave={async (payload) => {
                  try {
                    await saveNode.mutateAsync({ nodeId: selectedNode.id, payload });
                    toast.success('Saved');
                  } catch (error) {
                    toast.error(apiError(error, 'The component could not be saved.'));
                  }
                }}
              />
            ) : selectedEdge ? (
              <EdgeInspector
                edge={selectedEdge}
                saving={saveEdge.isPending}
                onDelete={() =>
                  setConfirmDelete({ kind: 'edge', id: selectedEdge.id, name: selectedEdge.label ?? 'this connection' })
                }
                onSave={async (payload) => {
                  try {
                    await saveEdge.mutateAsync({
                      edgeId: selectedEdge.id,
                      payload: {
                        sourceNodeId: selectedEdge.sourceNodeId,
                        targetNodeId: selectedEdge.targetNodeId,
                        ...payload,
                      },
                    });
                    toast.success('Saved');
                  } catch (error) {
                    toast.error(apiError(error, 'The connection could not be saved.'));
                  }
                }}
              />
            ) : null}
          </aside>
        )}
      </div>

      <NotesDrawer
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        nodes={nodes}
        onShowOnCanvas={(node) => {
          setNotesOpen(false);
          setSelectedEdgeId(null);
          setSelectedNodeId(node.id);
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        loading={removeNode.isPending || removeEdge.isPending}
        title={`Delete ${confirmDelete?.name ?? 'this'}?`}
        message={
          confirmDelete?.kind === 'node'
            ? 'The component and every connection touching it are removed.'
            : 'The connection is removed. Both components stay.'
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            if (confirmDelete.kind === 'node') {
              await removeNode.mutateAsync(confirmDelete.id);
              setSelectedNodeId(null);
            } else {
              await removeEdge.mutateAsync(confirmDelete.id);
              setSelectedEdgeId(null);
            }
            setConfirmDelete(null);
          } catch (error) {
            toast.error(apiError(error, 'That could not be deleted.'));
          }
        }}
      />
    </>
  );
}
