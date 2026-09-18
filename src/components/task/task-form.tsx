'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useCreateTask, useUpdateTask } from '@/lib/queries';
import type { BoardColumnDto, Priority, TaskDetail, TaskType } from '@/lib/types';
import { PRIORITIES, PRIORITY_META, TASK_TYPES, TYPE_META } from '@/lib/utils';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  boardId: number;
  columns: BoardColumnDto[];
  task?: TaskDetail | null;
  defaultColumnId?: number | null;
}

interface FormState {
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
  columnId: string;
  startDate: string;
  dueDate: string;
  storyPoints: string;
  estimateHours: string;
  labels: string;
}

const EMPTY: FormState = {
  title: '',
  description: '',
  type: 'TASK',
  priority: 'MEDIUM',
  columnId: '',
  startDate: '',
  dueDate: '',
  storyPoints: '',
  estimateHours: '',
  labels: '',
};

export function TaskForm({ open, onClose, boardId, columns, task, defaultColumnId }: TaskFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const saving = createTask.isPending || updateTask.isPending;

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        type: task.type,
        priority: task.priority,
        columnId: String(task.columnId),
        startDate: task.startDate ?? '',
        dueDate: task.dueDate ?? '',
        storyPoints: task.storyPoints != null ? String(task.storyPoints) : '',
        estimateHours: task.estimateHours != null ? String(task.estimateHours) : '',
        labels: task.labels.join(', '),
      });
    } else {
      setForm({
        ...EMPTY,
        columnId: String(defaultColumnId ?? columns[0]?.id ?? ''),
      });
    }
  }, [open, task, defaultColumnId, columns]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      priority: form.priority,
      columnId: form.columnId ? Number(form.columnId) : null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
      estimateHours: form.estimateHours ? Number(form.estimateHours) : null,
      labels: form.labels
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, payload });
        toast.success(`${task.taskKey} updated`);
      } else {
        const created = await createTask.mutateAsync({ ...payload, boardId });
        toast.success(`${created.taskKey} created`);
      }
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The task could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? `Edit ${task.taskKey}` : 'Create task'}
      description={task ? undefined : 'Tasks are numbered automatically from the board key.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="task-form" type="submit" loading={saving}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="What needs to be done?"
            maxLength={250}
            required
            autoFocus
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Context, acceptance criteria, links…"
            rows={4}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <Select value={form.type} onChange={(event) => update('type', event.target.value as TaskType)}>
              {TASK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_META[type].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(event) => update('priority', event.target.value as Priority)}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_META[priority].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Column">
            <Select value={form.columnId} onChange={(event) => update('columnId', event.target.value)}>
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <Input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Story points">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.storyPoints}
              onChange={(event) => update('storyPoints', event.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Estimate (hours)">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={form.estimateHours}
              onChange={(event) => update('estimateHours', event.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Labels" hint="Comma separated">
            <Input
              value={form.labels}
              onChange={(event) => update('labels', event.target.value)}
              placeholder="frontend, urgent"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
