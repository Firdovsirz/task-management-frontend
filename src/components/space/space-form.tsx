'use client';

import { ArrowRight, FilePlus2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useBoards, useCreateFromTemplate, usePlatforms, useSavePlatform, useSpaceTemplates } from '@/lib/queries';
import { KIND_META, SPACE_KINDS, freeKey, latinLetters } from '@/lib/spaces';
import type { Platform, SpaceKind, SpaceTemplate } from '@/lib/types';
import { BOARD_COLORS, cn } from '@/lib/utils';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { ColorPicker } from '@/components/ui/color-picker';
import { Modal } from '@/components/ui/overlays';

/** Stable, so the reset effect below does not fire on every render while the templates load. */
const NO_TEMPLATES: SpaceTemplate[] = [];

const CHOICE =
  'flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
const CHOICE_ON = 'border-brand-600 bg-brand-50 text-brand-700';
const CHOICE_OFF = 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-100/60';

/**
 * One option in a set of toggle buttons: the pressed one is the choice. Choosing the option that is
 * already chosen does nothing, so it cannot wipe what has been typed.
 */
function Choice({
  on,
  onClick,
  icon: Icon,
  label,
  caption,
}: {
  on: boolean;
  onClick: () => void;
  icon: typeof FilePlus2;
  label: string;
  caption: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        if (!on) onClick();
      }}
      className={cn(CHOICE, on ? CHOICE_ON : CHOICE_OFF)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-tight">{label}</span>
        <span className={cn('mt-0.5 block text-[11.5px] leading-snug', on ? 'text-brand-700/80' : 'text-ink-400')}>
          {caption}
        </span>
      </span>
    </button>
  );
}

/** What a template will make, so nothing about pressing Create is a surprise. */
function TemplatePreview({ template, boardKey, dateLabel }: { template: SpaceTemplate; boardKey: string; dateLabel: string }) {
  return (
    <div className="rounded-md border border-ink-200 bg-ink-50 px-4 py-3 text-[12.5px] leading-relaxed text-ink-600">
      <p className="eyebrow mb-2">What it creates</p>
      <p>
        A board, <span className="text-ink-900">{template.boardName}</span>
        {boardKey && <span className="font-mono text-[11.5px] text-ink-400"> · {boardKey}</span>}, with these columns:
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {template.columns.map((column, index) => (
          <span key={column} className="flex items-center gap-1">
            {index > 0 && <ArrowRight className="h-3 w-3 text-ink-300" />}
            <span className="rounded-sm bg-ink-100 px-1.5 py-0.5 text-[11.5px] text-ink-700">{column}</span>
          </span>
        ))}
      </div>
      <p className="mt-2">
        {template.taskCount} starter tasks.
        {template.datedTaskCount > 0 &&
          ` Set the ${dateLabel.toLowerCase()} and ${template.datedTaskCount} of them get due dates counted back from it.`}
      </p>
    </div>
  );
}

export function SpaceForm({
  open,
  onClose,
  space,
  initialTemplate,
}: {
  open: boolean;
  onClose: () => void;
  /** The space to edit; without one the form creates. */
  space?: Platform | null;
  /** Open with this template already picked. */
  initialTemplate?: string | null;
}) {
  const router = useRouter();
  const id = useId();
  const saveSpace = useSavePlatform();
  const createFromTemplate = useCreateFromTemplate();
  const templates = useSpaceTemplates().data ?? NO_TEMPLATES;
  const { data: spaces = [] } = usePlatforms();
  const { data: boards = [] } = useBoards();

  const [templateKey, setTemplateKey] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  // a blank space's code follows the name until it is typed in by hand
  const [codeEdited, setCodeEdited] = useState(false);
  const [boardKey, setBoardKey] = useState('');
  const [kind, setKind] = useState<SpaceKind>('PLATFORM');
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [active, setActive] = useState(true);

  const template = space ? null : (templates.find((item) => item.key === templateKey) ?? null);
  const pending = saveSpace.isPending || createFromTemplate.isPending;

  // A template asked for before the list has loaded is picked once, when the list arrives.
  const awaitingTemplate = useRef<string | null>(null);

  function pickTemplate(key: string) {
    setTemplateKey(key);
    setCodeEdited(false);
    const picked = templates.find((item) => item.key === key);
    if (!picked) {
      setName('');
      setCode('');
      setBoardKey('');
      setKind('PLATFORM');
      setGoal('');
      setColor(BOARD_COLORS[0]);
      return;
    }
    // A second IELTS attempt should not fail on the first one's code or board key.
    setName(picked.name);
    setCode(freeKey(picked.code, spaces.map((item) => item.code), 20));
    setBoardKey(freeKey(picked.boardKey, boards.map((item) => item.boardKey), 10, ''));
    setKind(picked.kind);
    setGoal(picked.goal);
    setColor(picked.color);
  }

  useEffect(() => {
    if (!open) return;
    setCodeEdited(false);
    setTargetDate(space?.targetDate ?? '');
    setDescription(space?.description ?? '');
    setActive(space?.active ?? true);
    if (space) {
      setTemplateKey('');
      setName(space.name);
      setCode(space.code);
      setKind(space.kind ?? 'PLATFORM');
      setGoal(space.goal ?? '');
      setColor(space.color || BOARD_COLORS[0]);
    } else {
      pickTemplate(initialTemplate ?? '');
      awaitingTemplate.current =
        initialTemplate && !templates.some((item) => item.key === initialTemplate) ? initialTemplate : null;
    }
    // Only opening resets the form. pickTemplate reads the space and board lists as they are now,
    // and a refetch (or the templates arriving) while the form is open must not wipe what was typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, space, initialTemplate]);

  useEffect(() => {
    const waiting = awaitingTemplate.current;
    if (!open || !waiting || !templates.some((item) => item.key === waiting)) return;
    awaitingTemplate.current = null;
    pickTemplate(waiting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templates]);

  const dateLabel = template?.targetDateLabel ?? KIND_META[kind].dateLabel;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (template) {
        const key = boardKey.trim().toUpperCase();
        await createFromTemplate.mutateAsync({
          template: template.key,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          boardKey: key,
          goal: goal.trim(),
          targetDate: targetDate || null,
          color,
        });
        toast.success(`${name.trim()} is ready, with ${template.taskCount} tasks to start from`);
        onClose();
        router.push(`/boards/${key}`);
        return;
      }
      await saveSpace.mutateAsync({
        id: space?.id,
        payload: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          color,
          icon: space?.icon ?? 'layers',
          active,
          kind,
          goal: goal.trim(),
          targetDate: targetDate || null,
        },
      });
      toast.success(space ? 'Space updated' : 'Space created');
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The space could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={space ? 'Edit space' : 'New space'}
      description="A space is anything you work towards - a product, an exam like IELTS, a job hunt. It holds boards and diagrams."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="space-form" type="submit" loading={pending}>
            {space ? 'Save changes' : template ? 'Create space and board' : 'Create space'}
          </Button>
        </>
      }
    >
      <form id="space-form" onSubmit={onSubmit} className="space-y-5">
        {!space && templates.length > 0 && (
          <Field label="Start from">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Start from">
              <Choice
                on={!template}
                onClick={() => pickTemplate('')}
                icon={FilePlus2}
                label="Blank"
                caption="Pick a kind, add boards later"
              />
              {templates.map((item) => (
                <Choice
                  key={item.key}
                  on={template?.key === item.key}
                  onClick={() => pickTemplate(item.key)}
                  icon={KIND_META[item.kind].icon}
                  label={item.boardName}
                  caption={`${item.columns.length} columns · ${item.taskCount} tasks`}
                />
              ))}
            </div>
          </Field>
        )}

        {!template && (
          <Field label="Kind">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Kind">
              {SPACE_KINDS.map((option) => (
                <Choice
                  key={option}
                  on={kind === option}
                  onClick={() => setKind(option)}
                  icon={KIND_META[option].icon}
                  label={KIND_META[option].label}
                  caption={KIND_META[option].hint}
                />
              ))}
            </div>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Name" required htmlFor={`${id}-name`}>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!space && !template && !codeEdited) {
                  setCode(latinLetters(event.target.value).replace(/ /g, '').slice(0, 4).toUpperCase());
                }
              }}
              placeholder={template?.name ?? 'Research'}
              maxLength={120}
              required
              autoFocus
            />
          </Field>
          <Field label="Code" required htmlFor={`${id}-code`}>
            <Input
              id={`${id}-code`}
              value={code}
              onChange={(event) => {
                setCodeEdited(true);
                setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
              }}
              placeholder="RES"
              maxLength={20}
              required
              className="font-mono uppercase"
            />
          </Field>
        </div>

        {template && (
          <Field
            label="Board key"
            required
            htmlFor={`${id}-board-key`}
            hint={`Its tasks will be ${boardKey || 'KEY'}-1, ${boardKey || 'KEY'}-2 …`}
          >
            <Input
              id={`${id}-board-key`}
              value={boardKey}
              onChange={(event) => setBoardKey(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              pattern="[A-Za-z][A-Za-z0-9]{1,9}"
              title="2-10 letters and digits, starting with a letter"
              maxLength={10}
              required
              className="font-mono uppercase sm:w-40"
            />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Goal" htmlFor={`${id}-goal`} hint="What done looks like. Leave it empty if there is no finish line.">
            <Input
              id={`${id}-goal`}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder={KIND_META[kind].goalPlaceholder}
              maxLength={200}
            />
          </Field>
          <Field label={dateLabel} htmlFor={`${id}-date`}>
            <Input
              id={`${id}-date`}
              type="date"
              value={targetDate}
              // a template's plan is counted back from this date, so it cannot already be over
              min={template ? format(new Date(), 'yyyy-MM-dd') : undefined}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </Field>
        </div>

        {template ? (
          <TemplatePreview template={template} boardKey={boardKey} dateLabel={dateLabel} />
        ) : (
          <Field label="Description" htmlFor={`${id}-description`}>
            <Textarea
              id={`${id}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What belongs in this space?"
              maxLength={500}
              rows={3}
            />
          </Field>
        )}

        {space && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor={`${id}-status`}>
              <Select
                id={`${id}-status`}
                value={active ? 'true' : 'false'}
                onChange={(event) => setActive(event.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Archived</option>
              </Select>
            </Field>
          </div>
        )}

        <Field label="Colour">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </form>
    </Modal>
  );
}
