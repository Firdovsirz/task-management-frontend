'use client';

import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { memo, useMemo, type Ref } from 'react';
import type { ArchEdge, ArchNode } from '@/lib/types';
import { GRID, WORLD_HEIGHT, WORLD_WIDTH, clampX, clampY, layoutEdges, nodeColor } from '@/lib/architecture';
import { cn } from '@/lib/utils';

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

const NodeShape = memo(function NodeShape({
  node,
  zoom,
  selected,
  connecting,
  canEdit,
  onSelect,
}: {
  node: ArchNode;
  zoom: number;
  selected: boolean;
  connecting: boolean;
  canEdit: boolean;
  onSelect: (node: ArchNode) => void;
}) {
  // While connecting, dragging is disabled so the click that picks the second box can never be
  // swallowed by an accidental move.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    disabled: !canEdit || connecting,
  });

  // dnd-kit reports the offset in SCREEN pixels. This <g> lives in a user-unit coordinate
  // system that the svg's width/height already scales by `zoom`, so the offset has to be
  // divided by zoom or the rectangle travels at the wrong speed under the cursor at any zoom
  // other than 100%. It is applied as an SVG transform attribute, not a CSS transform.
  const dx = (transform?.x ?? 0) / zoom;
  const dy = (transform?.y ?? 0) / zoom;

  const fill = nodeColor(node);
  const isNote = node.kind === 'NOTE';

  return (
    <g
      // dnd-kit types setNodeRef for HTMLElement; these nodes are SVG groups.
      ref={setNodeRef as unknown as Ref<SVGGElement>}
      transform={`translate(${node.x + dx}, ${node.y + dy})`}
      onPointerDown={() => onSelect(node)}
      // Panning is the container's native scroll, so without this a touch-drag on a box scrolls
      // the canvas instead of moving it. dnd-kit does not set this for you.
      style={{ touchAction: 'none', cursor: canEdit ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
      className={cn(isDragging && 'opacity-90')}
      {...listeners}
      {...attributes}
    >
      {/* Theme colours go through style, not the fill/stroke attributes: var() is reliable in
          CSS properties but not in SVG presentation attributes. */}
      <rect
        width={node.width}
        height={node.height}
        rx={isNote ? 4 : 6}
        style={{
          fill: isNote ? 'color-mix(in srgb, #eab308 10%, rgb(var(--surface)))' : 'rgb(var(--surface))',
          stroke: selected ? 'rgb(var(--brand-600))' : fill,
        }}
        strokeWidth={selected ? 2.5 : 1.25}
        strokeDasharray={isNote ? '6 4' : undefined}
      />
      {!isNote && <rect width={node.width} height={4} rx={2} fill={fill} />}

      <text
        x={14}
        y={isNote ? 26 : 32}
        className="select-none font-sans"
        fontSize={15}
        fontWeight={500}
        style={{ fill: 'rgb(var(--ink-900))' }}
      >
        {truncate(node.name, Math.floor(node.width / 9))}
      </text>

      {node.technology && (
        <text
          x={14}
          y={isNote ? 46 : 52}
          className="select-none font-mono"
          fontSize={11.5}
          style={{ fill: 'rgb(var(--ink-400))' }}
        >
          {truncate(node.technology, Math.floor(node.width / 7))}
        </text>
      )}

      {isNote && node.description && (
        <text
          x={14}
          y={node.technology ? 66 : 48}
          className="select-none font-sans"
          fontSize={12}
          style={{ fill: 'rgb(var(--ink-600))' }}
        >
          {truncate(node.description, Math.floor(node.width / 6.5))}
        </text>
      )}

      <text
        x={node.width - 12}
        y={node.height - 12}
        textAnchor="end"
        className="select-none font-mono"
        fontSize={9.5}
        letterSpacing="0.12em"
        fill={fill}
      >
        {(isNote ? node.noteKind ?? 'NOTE' : node.kind).toUpperCase()}
      </text>
    </g>
  );
});

export function ArchitectureCanvas({
  nodes,
  edges,
  zoom,
  canEdit,
  selectedNodeId,
  selectedEdgeId,
  connectFrom,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  onMove,
}: {
  nodes: ArchNode[];
  edges: ArchEdge[];
  zoom: number;
  canEdit: boolean;
  selectedNodeId: number | null;
  selectedEdgeId: number | null;
  connectFrom: number | null;
  onSelectNode: (node: ArchNode) => void;
  onSelectEdge: (edge: ArchEdge) => void;
  onClearSelection: () => void;
  onMove: (nodeId: number, x: number, y: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const geometry = useMemo(() => layoutEdges(nodes, edges), [nodes, edges]);
  const edgeById = useMemo(() => new Map(edges.map((edge) => [edge.id, edge])), [edges]);

  function onDragEnd(event: DragEndEvent) {
    const node = nodes.find((item) => item.id === event.active.id);
    if (!node) return;
    const x = clampX(node.x + event.delta.x / zoom, node.width);
    const y = clampY(node.y + event.delta.y / zoom, node.height);
    if (x !== node.x || y !== node.y) onMove(node.id, x, y);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <svg
        width={WORLD_WIDTH * zoom}
        height={WORLD_HEIGHT * zoom}
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onClearSelection();
        }}
        className="block"
      >
        <defs>
          {/* userSpaceOnUse - the SVG default is objectBoundingBox, where width=20 would mean
              twenty times the bounding box and the grid renders as one enormous smear. */}
          <pattern id="arch-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" style={{ stroke: 'rgb(var(--ink-200))' }} strokeWidth={1} />
          </pattern>
          {/* markerUnits defaults to strokeWidth, which would give a selected 3px edge a visibly
              bigger arrowhead than an unselected 2px one. */}
          <marker
            id="arch-arrow"
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={10}
            markerHeight={10}
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: 'rgb(var(--ink-400))' }} />
          </marker>
          <marker
            id="arch-arrow-selected"
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={10}
            markerHeight={10}
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: 'rgb(var(--brand-600))' }} />
          </marker>
        </defs>

        <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#arch-grid)" />

        <g>
          {geometry.map((shape) => {
            const edge = edgeById.get(shape.id);
            if (!edge) return null;
            const selected = selectedEdgeId === edge.id;
            const caption = [edge.label, edge.technology].filter(Boolean).join(' · ');
            return (
              <g key={edge.id} onPointerDown={() => onSelectEdge(edge)} style={{ cursor: 'pointer' }}>
                {/* a fat invisible stroke so the thin line is actually clickable */}
                <path d={shape.path} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  d={shape.path}
                  fill="none"
                  style={{ stroke: selected ? 'rgb(var(--brand-600))' : 'rgb(var(--ink-400))' }}
                  strokeWidth={selected ? 2.5 : 1.5}
                  strokeDasharray={edge.dashed ? '8 6' : undefined}
                  markerEnd={`url(#${selected ? 'arch-arrow-selected' : 'arch-arrow'})`}
                />
                {caption && (
                  <>
                    <rect
                      x={shape.labelX - (caption.length * 3.3 + 8)}
                      y={shape.labelY - 11}
                      width={caption.length * 6.6 + 16}
                      height={22}
                      rx={11}
                      style={{
                        fill: 'rgb(var(--surface))',
                        stroke: selected ? 'rgb(var(--brand-600))' : 'rgb(var(--ink-200))',
                      }}
                    />
                    <text
                      x={shape.labelX}
                      y={shape.labelY + 4}
                      textAnchor="middle"
                      className="select-none font-mono"
                      fontSize={11}
                      style={{ fill: 'rgb(var(--ink-600))' }}
                    >
                      {caption}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>

        {nodes.map((node) => (
          <NodeShape
            key={node.id}
            node={node}
            zoom={zoom}
            selected={selectedNodeId === node.id}
            connecting={connectFrom !== null}
            canEdit={canEdit}
            onSelect={onSelectNode}
          />
        ))}

        {connectFrom !== null &&
          nodes
            .filter((node) => node.id === connectFrom)
            .map((node) => (
              <rect
                key={`halo-${node.id}`}
                x={node.x - 6}
                y={node.y - 6}
                width={node.width + 12}
                height={node.height + 12}
                rx={10}
                fill="none"
                style={{ stroke: 'rgb(var(--brand-600))' }}
                strokeWidth={2}
                strokeDasharray="6 5"
              />
            ))}
      </svg>
    </DndContext>
  );
}
