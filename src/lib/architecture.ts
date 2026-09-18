import type { ArchEdge, ArchNode, ArchNodeKind, DiagramStatus } from '@/lib/types';
import { TONE } from '@/lib/utils';

/**
 * The canvas coordinate rules. These MUST stay identical to the server's
 * ArchitectureGeometry.java - if the two disagree by a single unit, every drop ends with the
 * rectangle twitching as the server's answer arrives and overwrites where the user let go.
 */
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 2600;
export const SNAP = 10;
export const GRID = 20;

export const MIN_WIDTH = 120;
export const MAX_WIDTH = 480;
export const MIN_HEIGHT = 60;
export const MAX_HEIGHT = 360;

export const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5];

export function snap(value: number): number {
  return Math.round(value / SNAP) * SNAP;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampX(x: number, width: number): number {
  return clamp(snap(x), 0, WORLD_WIDTH - width);
}

export function clampY(y: number, height: number): number {
  return clamp(snap(y), 0, WORLD_HEIGHT - height);
}

export const KIND_META: Record<ArchNodeKind, { label: string; color: string }> = {
  COMPONENT: { label: 'Component', color: '#059669' },
  SERVICE: { label: 'Service', color: '#0ea5e9' },
  DATABASE: { label: 'Database', color: '#8b5cf6' },
  EXTERNAL: { label: 'External', color: '#f59e0b' },
  NOTE: { label: 'Note', color: '#eab308' },
};

export const STATUS_META: Record<DiagramStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: TONE.neutral },
  IN_REVIEW: { label: 'In review', color: TONE.amber },
  APPROVED: { label: 'Approved', color: TONE.accent },
  DEPRECATED: { label: 'Deprecated', color: TONE.rose },
};

export function nodeColor(node: Pick<ArchNode, 'kind' | 'color'>): string {
  // A null colour is OMITTED from the JSON entirely (spring.jackson non_null), so this must
  // treat undefined and null alike rather than testing `=== null`.
  return node.color ?? KIND_META[node.kind].color;
}

/**
 * Deterministic placement for a new rectangle: the first free cell of a lattice.
 * Nudging from a fixed point instead would pile new boxes up on a diagonal.
 */
export function nextFreeSlot(nodes: ArchNode[]): { x: number; y: number } {
  const COLUMNS = 5;
  const STEP_X = 280;
  const STEP_Y = 170;
  const ORIGIN = 60;

  for (let index = 0; index < 60; index += 1) {
    const x = ORIGIN + (index % COLUMNS) * STEP_X;
    const y = ORIGIN + Math.floor(index / COLUMNS) * STEP_Y;
    const taken = nodes.some((node) => Math.abs(node.x - x) < 40 && Math.abs(node.y - y) < 40);
    if (!taken) return { x, y: Math.min(y, WORLD_HEIGHT - 200) };
  }
  return { x: ORIGIN, y: ORIGIN };
}

type Side = 'top' | 'right' | 'bottom' | 'left';

interface Anchor {
  x: number;
  y: number;
  side: Side;
}

function centre(node: ArchNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

/** Which face of the box a connection should leave from, by dominant direction. */
function sideTowards(from: ArchNode, to: ArchNode): Side {
  const a = centre(from);
  const b = centre(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function anchorOn(node: ArchNode, side: Side, offset: number): Anchor {
  switch (side) {
    case 'top':
      return { x: clamp(node.x + node.width / 2 + offset, node.x + 12, node.x + node.width - 12), y: node.y, side };
    case 'bottom':
      return {
        x: clamp(node.x + node.width / 2 + offset, node.x + 12, node.x + node.width - 12),
        y: node.y + node.height,
        side,
      };
    case 'left':
      return { x: node.x, y: clamp(node.y + node.height / 2 + offset, node.y + 10, node.y + node.height - 10), side };
    default:
      return {
        x: node.x + node.width,
        y: clamp(node.y + node.height / 2 + offset, node.y + 10, node.y + node.height - 10),
        side,
      };
  }
}

function normal(side: Side, strength: number) {
  switch (side) {
    case 'top':
      return { x: 0, y: -strength };
    case 'bottom':
      return { x: 0, y: strength };
    case 'left':
      return { x: -strength, y: 0 };
    default:
      return { x: strength, y: 0 };
  }
}

export interface EdgeGeometry {
  id: number;
  path: string;
  labelX: number;
  labelY: number;
}

/**
 * Routes every edge, fanning out connections that share a face.
 *
 * Without the fan-out, three services pointing at one database all terminate on the same pixel
 * and the last stretch of every connector lies on top of the others.
 */
export function layoutEdges(nodes: ArchNode[], edges: ArchEdge[]): EdgeGeometry[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  // First pass: which face does each end use, so we can count how many share it.
  const ends = edges
    .map((edge) => {
      const source = byId.get(edge.sourceNodeId);
      const target = byId.get(edge.targetNodeId);
      if (!source || !target) return null;
      return {
        edge,
        source,
        target,
        sourceSide: sideTowards(source, target),
        targetSide: sideTowards(target, source),
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const buckets = new Map<string, number[]>();
  const push = (nodeId: number, side: Side, edgeId: number) => {
    const key = `${nodeId}:${side}`;
    const list = buckets.get(key) ?? [];
    list.push(edgeId);
    buckets.set(key, list);
  };
  ends.forEach((end) => {
    push(end.source.id, end.sourceSide, end.edge.id);
    push(end.target.id, end.targetSide, end.edge.id);
  });

  const offsetFor = (nodeId: number, side: Side, edgeId: number) => {
    const list = buckets.get(`${nodeId}:${side}`) ?? [];
    if (list.length < 2) return 0;
    const index = list.indexOf(edgeId);
    return (index - (list.length - 1) / 2) * 16;
  };

  return ends.map(({ edge, source, target, sourceSide, targetSide }) => {
    const from = anchorOn(source, sourceSide, offsetFor(source.id, sourceSide, edge.id));
    const to = anchorOn(target, targetSide, offsetFor(target.id, targetSide, edge.id));

    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const strength = Math.max(50, Math.min(160, distance / 2.5));
    const c1 = normal(from.side, strength);
    const c2 = normal(to.side, strength);

    const p1 = { x: from.x + c1.x, y: from.y + c1.y };
    const p2 = { x: to.x + c2.x, y: to.y + c2.y };

    return {
      id: edge.id,
      path: `M ${from.x} ${from.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${to.x} ${to.y}`,
      // Cubic Bezier at t = 0.5
      labelX: (from.x + 3 * p1.x + 3 * p2.x + to.x) / 8,
      labelY: (from.y + 3 * p1.y + 3 * p2.y + to.y) / 8,
    };
  });
}
