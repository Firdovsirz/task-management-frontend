'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useCreateBoard, usePlatforms, useUpdateBoard } from '@/lib/queries';
import type { BoardDetail, BoardSummary } from '@/lib/types';
import { BOARD_COLORS } from '@/lib/utils';
import { latinLetters } from '@/lib/spaces';
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
  // the key follows the name until it is typed in by hand
  const [keyEdited, setKeyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [platformId, setPlatformId] = useState('');
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKeyEdited(false);
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
      // opened from a space it goes there; otherwise it starts out on its own
      setPlatformId(defaultPlatformId ? String(defaultPlatformId) : '');
      setArchived(false);
    }
  }, [open, board, defaultPlatformId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (board && 'id' in board) {
        await updateBoard.mutateAsync({
          id: board.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            platformId: platformId ? Number(platformId) : null,
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
          platformId: platformId ? Number(platformId) : null,
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
                if (!board && !keyEdited) {
                  const words = latinLetters(event.target.value).split(' ').filter(Boolean);
                  // initials for several words; one word would give a single letter, and a key needs two
                  const generated = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] ?? '').slice(0, 4);
                  // under two letters there is nothing usable yet - leave it empty so the form asks
                  setBoardKey(generated.length >= 2 ? generated.toUpperCase().slice(0, 5) : '');
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
              onChange={(event) => {
                setKeyEdited(true);
                setBoardKey(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              }}
              placeholder="WEB"
              pattern="[A-Za-z][A-Za-z0-9]{1,9}"
              title="2-10 letters and digits, starting with a letter"
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
          <Field label="Space" hint="Optional - a board can stand on its own">
            <Select value={platformId} onChange={(event) => setPlatformId(event.target.value)}>
              <option value="">No space</option>
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
