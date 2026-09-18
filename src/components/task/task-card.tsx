'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, MessageSquare } from 'lucide-react';
import type { TaskCard as TaskCardType } from '@/lib/types';
import { PRIORITY_META, TONE, TYPE_META, cn, dueLabel } from '@/lib/utils';

export function TaskCardView({
  task,
  onClick,
  dragging,
  className,
}: {
  task: TaskCardType;
  onClick?: () => void;
  dragging?: boolean;
  className?: string;
}) {
  const type = TYPE_META[task.type];
  const priority = PRIORITY_META[task.priority];
  const due = dueLabel(task.dueDate);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-md border border-ink-200 bg-surface p-3 shadow-card dark:bg-ink-100',
        'transition-colors duration-150 hover:border-ink-300',
        dragging && 'rotate-1 opacity-95 shadow-pop ring-1 ring-brand-500',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold',
            type.color,
          )}
          title={type.label}
        >
          {type.glyph}
        </span>
        <p className="flex-1 text-[13.5px] leading-snug text-ink-900 line-clamp-3 group-hover:text-ink-950">{task.title}</p>
      </div>

      {task.labels?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded-sm bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-500"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[11px] text-ink-400">{task.taskKey}</span>
        <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} title={`${priority.label} priority`} />

        {due && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10.5px]',
              task.overdue ? TONE.rose : TONE.neutral,
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {due}
          </span>
        )}

        {task.commentCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-400">
            <MessageSquare className="h-3 w-3" />
            {task.commentCount}
          </span>
        )}

        {task.storyPoints != null && (
          <span
            className="ml-auto rounded-full border border-ink-200 px-1.5 font-mono text-[10.5px] text-ink-500"
            title="Story points"
          >
            {task.storyPoints}
          </span>
        )}
      </div>
    </div>
  );
}

export function SortableTaskCard({ task, onClick }: { task: TaskCardType; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} onClick={onClick} />
    </div>
  );
}
