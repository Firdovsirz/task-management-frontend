'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';
import { apiError } from '@/lib/api';
import { usePlatforms, useSaveDiagram } from '@/lib/queries';
import type { DiagramStatus, DiagramSummary } from '@/lib/types';

const STATUSES: DiagramStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'DEPRECATED'];

export function DiagramForm({
  open,
  onClose,
  diagram,
  defaultPlatformId,
}: {
  open: boolean;
  onClose: () => void;
  diagram?: DiagramSummary | null;
  defaultPlatformId?: number | null;
}) {
  const { data: platforms = [] } = usePlatforms();
  const save = useSaveDiagram();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [status, setStatus] = useState<DiagramStatus>('DRAFT');

  useEffect(() => {
    if (!open) return;
    setName(diagram?.name ?? '');
    setDescription(diagram?.description ?? '');
    setPlatformId(String(diagram?.platformId ?? defaultPlatformId ?? platforms[0]?.id ?? ''));
    setStatus(diagram?.status ?? 'DRAFT');
  }, [open, diagram, defaultPlatformId, platforms]);

  async function submit() {
    if (!name.trim() || !platformId) return;
    try {
      await save.mutateAsync({
        id: diagram?.id,
        payload: {
          name: name.trim(),
          description: description.trim() || null,
          status,
          platformId: Number(platformId),
        },
      });
      toast.success(diagram ? 'Diagram updated' : 'Diagram created');
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The diagram could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={diagram ? 'Edit diagram' : 'New architecture diagram'}
      description="A diagram documents one system: its components, how they connect, and the decisions behind them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending} disabled={!name.trim() || !platformId}>
            {diagram ? 'Save changes' : 'Create diagram'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Name">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Portfolio site architecture" />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Space">
            <Select value={platformId} onChange={(event) => setPlatformId(event.target.value)}>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as DiagramStatus)}>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value.replace('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
