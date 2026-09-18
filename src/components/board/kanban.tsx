'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useMoveTask } from '@/lib/queries';
import type { KanbanColumn, TaskCard as TaskCardType } from '@/lib/types';
import { CATEGORY_META, TONE, cn } from '@/lib/utils';
import { SortableTaskCard, TaskCardView } from '@/components/task/task-card';

function ColumnShell({
  column,
  onCreate,
  onOpenTask,
}: {
  column: KanbanColumn;
  onCreate?: (columnId: number) => void;
  onOpenTask: (task: TaskCardType) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, data: { type: 'column', column } });
  const overLimit = column.wipLimit != null && column.tasks.length > column.wipLimit;
  const meta = CATEGORY_META[column.category];

  return (
    <div className="flex h-full w-[302px] shrink-0 flex-col">
      <div className="mb-2.5 flex items-center gap-2 px-1">
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} title={meta.label} />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-600">{column.name}</h3>
        <span
          className={cn(
            'rounded-full px-1.5 font-mono text-[10.5px]',
            overLimit ? TONE.rose : 'text-ink-400',
          )}
          title={column.wipLimit != null ? `WIP limit ${column.wipLimit}` : undefined}
        >
          {column.tasks.length}
          {column.wipLimit != null && `/${column.wipLimit}`}
        </span>
        {onCreate && (
          <button
            onClick={() => onCreate(column.id)}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
            aria-label={`Add a task to ${column.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto rounded-md border border-ink-200/70 bg-ink-100/60 p-2 transition-colors',
          isOver && 'border-brand-600/40 bg-brand-50/70',
          overLimit && 'border-rose-300/60 dark:border-rose-500/30',
        )}
      >
        <SortableContext items={column.tasks.map((task) => `task-${task.id}`)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onOpenTask(task)} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <button
            onClick={() => onCreate?.(column.id)}
            className="flex h-20 items-center justify-center rounded-md border border-dashed border-ink-300 text-[12.5px] text-ink-400 transition-colors hover:border-brand-600/50 hover:text-brand-600"
          >
            Drop a task here
          </button>
        )}
      </div>
    </div>
  );
}

export function KanbanBoardView({
  columns: source,
  onOpenTask,
  onCreate,
  canEdit = true,
}: {
  columns: KanbanColumn[];
  onOpenTask: (task: TaskCardType) => void;
  onCreate?: (columnId: number) => void;
  canEdit?: boolean;
}) {
  const [columns, setColumns] = useState<KanbanColumn[]>(source);
  const [activeTask, setActiveTask] = useState<TaskCardType | null>(null);
  const moveTask = useMoveTask();

  useEffect(() => {
    setColumns(source);
  }, [source]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const taskIndex = useMemo(() => {
    const map = new Map<number, { columnId: number; index: number; task: TaskCardType }>();
    columns.forEach((column) =>
      column.tasks.forEach((task, index) => map.set(task.id, { columnId: column.id, index, task })),
    );
    return map;
  }, [columns]);

  function columnOf(id: string): KanbanColumn | undefined {
    if (id.startsWith('column-')) {
      return columns.find((column) => column.id === Number(id.replace('column-', '')));
    }
    const taskId = Number(id.replace('task-', ''));
    const entry = taskIndex.get(taskId);
    return entry ? columns.find((column) => column.id === entry.columnId) : undefined;
  }

  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id).replace('task-', '');
    setActiveTask(taskIndex.get(Number(id))?.task ?? null);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const from = columnOf(activeId);
    const to = columnOf(overId);
    if (!from || !to || from.id === to.id) return;

    setColumns((previous) => {
      const taskId = Number(activeId.replace('task-', ''));
      const source = previous.find((column) => column.id === from.id);
      const target = previous.find((column) => column.id === to.id);
      if (!source || !target) return previous;

      const moving = source.tasks.find((task) => task.id === taskId);
      if (!moving) return previous;

      const overTaskId = overId.startsWith('task-') ? Number(overId.replace('task-', '')) : null;
      const insertAt =
        overTaskId != null ? target.tasks.findIndex((task) => task.id === overTaskId) : target.tasks.length;

      return previous.map((column) => {
        if (column.id === source.id) {
          return { ...column, tasks: column.tasks.filter((task) => task.id !== taskId) };
        }
        if (column.id === target.id) {
          const next = [...column.tasks];
          next.splice(insertAt < 0 ? next.length : insertAt, 0, { ...moving, columnId: target.id });
          return { ...column, tasks: next };
        }
        return column;
      });
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const taskId = Number(activeId.replace('task-', ''));
    const target = columnOf(overId);
    if (!target) return;

    let position = target.tasks.length;
    setColumns((previous) =>
      previous.map((column) => {
        if (column.id !== target.id) return column;
        const currentIndex = column.tasks.findIndex((task) => task.id === taskId);
        const overIndex = overId.startsWith('task-')
          ? column.tasks.findIndex((task) => task.id === Number(overId.replace('task-', '')))
          : column.tasks.length - 1;

        if (currentIndex === -1) return column;
        const nextIndex = overIndex < 0 ? column.tasks.length - 1 : overIndex;
        position = nextIndex;
        return { ...column, tasks: arrayMove(column.tasks, currentIndex, nextIndex) };
      }),
    );

    moveTask.mutate(
      { id: taskId, columnId: target.id, position },
      {
        onError: (error) => {
          toast.error(apiError(error, 'The task could not be moved.'));
          setColumns(source);
        },
      },
    );
  }

  if (!canEdit) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <ColumnShell key={column.id} column={column} onOpenTask={onOpenTask} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <ColumnShell key={column.id} column={column} onCreate={onCreate} onOpenTask={onOpenTask} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.22,1,.36,1)' }}>
        {activeTask ? <TaskCardView task={activeTask} dragging className="w-[286px]" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
