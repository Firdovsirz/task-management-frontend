'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useCreateBoard, usePlatforms, useUpdateBoard } from '@/lib/queries';
import type { BoardDetail, BoardSummary } from '@/lib/types';
import { BOARD_COLORS } from '@/lib/utils';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';
import { ColorPicker } from '@/components/ui/color-picker';

export function BoardForm({
  open,
  onClose,
  board,
  defaultPlatformId,
}: {
  open: boolean;
  onClose: () => void;
  board?: BoardDetail | BoardSummary | null;
  defaultPlatformId?: number | null;
}) {
  const { data: platforms = [] } = usePlatforms();
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const saving = createBoard.isPending || updateBoard.isPending;

  const [name, setName] = useState('');
  const [boardKey, setBoardKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [platformId, setPlatformId] = useState('');
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (board) {
      const detail = board as Partial<BoardDetail> & Partial<BoardSummary>;
      setName(board.name);
      setBoardKey(board.boardKey);
      setDescription(board.description ?? '');
      setColor(board.color || BOARD_COLORS[0]);
      const platform = detail.platform?.id ?? detail.platformId;
      setPlatformId(platform ? String(platform) : '');
      setArchived(board.archived);
    } else {
      setName('');
      setBoardKey('');
      setDescription('');
      setColor(BOARD_COLORS[0]);
      setPlatformId(defaultPlatformId ? String(defaultPlatformId) : String(platforms[0]?.id ?? ''));
      setArchived(false);
    }
  }, [open, board, defaultPlatformId, platforms]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!platformId) {
      toast.error('Pick a platform first.');
      return;
    }

    try {
      if (board && 'id' in board) {
        await updateBoard.mutateAsync({
          id: board.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            platformId: Number(platformId),
            archived,
          },
        });
        toast.success('Board updated');
      } else {
        await createBoard.mutateAsync({
          name: name.trim(),
          boardKey: boardKey.trim().toUpperCase(),
          description: description.trim() || undefined,
          color,
          platformId: Number(platformId),
        });
        toast.success('Board created with the default kanban columns');
      }
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The board could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={board ? 'Edit board' : 'New board'}
      description={
        board ? undefined : 'Starts with Backlog, To Do, In Progress, In Review and Done - rename or remove any of them later.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="board-form" type="submit" loading={saving}>
            {board ? 'Save changes' : 'Create board'}
          </Button>
        </>
      }
    >
      <form id="board-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Board name" required>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!board && !boardKey) {
                  const generated = event.target.value
                    .replace(/[^a-zA-Z ]/g, '')
                    .split(' ')
                    .filter(Boolean)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 5);
                  setBoardKey(generated);
                }
              }}
              placeholder="Portfolio website"
              required
              autoFocus
            />
          </Field>
          <Field label="Key" required hint={board ? 'Fixed' : 'Used in task ids'}>
            <Input
              value={boardKey}
              onChange={(event) => setBoardKey(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="WEB"
              maxLength={10}
              disabled={Boolean(board)}
              required
              className="font-mono uppercase"
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this board for?"
            rows={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform" required>
            <Select value={platformId} onChange={(event) => setPlatformId(event.target.value)} required>
              <option value="">Select a platform…</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name} ({platform.code})
                </option>
              ))}
            </Select>
          </Field>
          {board && (
            <Field label="Status" hint="Archived boards leave the sidebar and the dashboard">
              <Select value={archived ? 'true' : 'false'} onChange={(event) => setArchived(event.target.value === 'true')}>
                <option value="false">Active</option>
                <option value="true">Archived</option>
              </Select>
            </Field>
          )}
        </div>

        <Field label="Colour">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </form>
    </Modal>
  );
}
