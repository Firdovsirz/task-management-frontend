'use client';

import { ArrowUpRight, CalendarClock, Target } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';
import { QuickCreate } from '@/components/dashboard/quick-create';
import { Topbar } from '@/components/layout/topbar';
import { ActivityLine } from '@/components/task/activity-line';
import { TaskDrawer } from '@/components/task/task-detail';
import { Badge, Card, CardHeader, PageLoader, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useDashboard } from '@/lib/queries';
import { KIND_META, countdown, daysUntil } from '@/lib/spaces';
import { PRIORITY_META, TONE, TYPE_META, cn, dueLabel, formatDate, fromNow, greeting, progress } from '@/lib/utils';

function Stat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: 'alert' }) {
  return (
    <Link href={href} className="group flex flex-col justify-between gap-6 bg-surface px-5 py-5 transition-colors hover:bg-ink-100">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-ink-300 transition-colors group-hover:text-brand-600" />
      </div>
      <span className={cn('stat-value', tone === 'alert' && value > 0 && 'text-rose-600 dark:text-rose-400')}>
        {value}
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const [openTask, setOpenTask] = useState<string | null>(null);

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const total = data ? data.todoCount + data.inProgressCount + data.doneCount : 0;

  return (
    <>
      <Topbar title="Dashboard" subtitle="Everything in the workspace, at a glance" />

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        {isLoading || !data ? (
          <PageLoader />
        ) : (
          <div className="mx-auto max-w-[1400px] space-y-8">
            {/* greeting */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{format(new Date(), 'EEEE · d MMMM yyyy')}</p>
                <h2 className="serif mt-2 text-4xl tracking-tight text-ink-900 sm:text-5xl">
                  {greeting()}, {firstName}
                  <span className="text-brand-600">.</span>
                </h2>
                <p className="mt-2 text-[14px] text-ink-500">
                  {data.openTasks === 0
                    ? 'Nothing open. A clean slate.'
                    : `${data.openTasks} open task${data.openTasks === 1 ? '' : 's'}${
                        data.overdueTasks > 0 ? `, ${data.overdueTasks} past due` : ''
                      }.`}
                </p>
              </div>
              <QuickCreate />
            </div>

            {/* stats - the site's hairline strip */}
            <Card className="overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-ink-200 lg:grid-cols-4">
                <Stat label="Open tasks" value={data.openTasks} href="/tasks" />
                <Stat label="Overdue" value={data.overdueTasks} href="/tasks" tone="alert" />
                <Stat label="Boards" value={data.totalBoards} href="/boards" />
                <Stat label="Spaces" value={data.totalPlatforms} href="/spaces" />
              </div>
            </Card>

            {/* minmax(0,…): a bare fr track grows to its longest unbreakable line and pushes the rail off-screen */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                {/* next up */}
                <Card className="overflow-hidden">
                  <CardHeader
                    title="Next up"
                    action={
                      <Link href="/tasks" className="link-underline text-[12.5px] text-ink-500 hover:text-ink-900">
                        All tasks
                      </Link>
                    }
                  />
                  {data.nextUp.length === 0 ? (
                    <p className="px-5 py-10 text-center text-[13px] text-ink-400">
                      No open tasks. Add one from any board.
                    </p>
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {data.nextUp.map((task) => (
                        <li key={task.id}>
                          <button
                            onClick={() => setOpenTask(task.taskKey)}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-100/50"
                          >
                            <span
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold',
                                TYPE_META[task.type].color,
                              )}
                            >
                              {TYPE_META[task.type].glyph}
                            </span>
                            <span className="w-16 shrink-0 font-mono text-[11.5px] text-ink-400">{task.taskKey}</span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-800">{task.title}</span>
                            {task.dueDate && (
                              <Badge className={task.overdue ? TONE.rose : TONE.neutral}>{dueLabel(task.dueDate)}</Badge>
                            )}
                            <span
                              className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_META[task.priority].dot)}
                              title={`${PRIORITY_META[task.priority].label} priority`}
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                {/* workflow */}
                <Card className="overflow-hidden">
                  <CardHeader
                    title="Workflow"
                    action={<span className="font-mono text-[11px] text-ink-400">{total} tasks in total</span>}
                  />
                  <div className="grid grid-cols-1 gap-px bg-ink-200 sm:grid-cols-3">
                    {[
                      { label: 'To do', value: data.todoCount, color: 'bg-ink-400' },
                      { label: 'In progress', value: data.inProgressCount, color: 'bg-sky-500' },
                      { label: 'Done', value: data.doneCount, color: 'bg-brand-600' },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-1.5 w-1.5 rounded-full', item.color)} />
                          <span className="text-[12.5px] text-ink-500">{item.label}</span>
                        </div>
                        <p className="serif mt-2 text-[28px] leading-none text-ink-900">{item.value}</p>
                        <ProgressBar value={progress(item.value, total)} className="mt-3" />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-ink-200 px-5 py-4">
                    <p className="eyebrow mb-3">By priority</p>
                    <div className="space-y-2">
                      {Object.entries(PRIORITY_META).map(([key, meta]) => {
                        const value = data.tasksByPriority[key] ?? 0;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-16 text-[12px] text-ink-500">{meta.label}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                              <div
                                className={cn('h-full rounded-full transition-all duration-500', meta.bar)}
                                style={{ width: `${progress(value, total)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-mono text-[11.5px] text-ink-600">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* boards */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="eyebrow">Boards</h2>
                    <Link href="/boards" className="link-underline text-[12.5px] text-ink-500 hover:text-ink-900">
                      All boards
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.boards.map((board) => (
                      <Link key={board.id} href={`/boards/${board.boardKey}`} className="group">
                        <Card className="h-full p-4 transition-colors group-hover:border-ink-300">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: board.color || '#059669' }} />
                            <p className="truncate text-[14px] text-ink-900 group-hover:text-brand-600">{board.name}</p>
                          </div>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-400">
                            {board.platformName ? `${board.platformName} · ${board.boardKey}` : board.boardKey}
                          </p>
                          <ProgressBar value={progress(board.doneCount, board.taskCount)} className="mt-4" />
                          <p className="mt-2 font-mono text-[11px] text-ink-500">
                            {board.doneCount}/{board.taskCount} done
                          </p>
                        </Card>
                      </Link>
                    ))}
                    {data.boards.length === 0 && <p className="text-[13px] text-ink-400">No boards yet.</p>}
                  </div>
                </div>
              </div>

              {/* right rail */}
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <CardHeader
                    title="Goals"
                    icon={<Target className="h-3.5 w-3.5 text-brand-600" />}
                    action={
                      <Link href="/spaces" className="link-underline text-[12.5px] text-ink-500 hover:text-ink-900">
                        All spaces
                      </Link>
                    }
                  />
                  {(data.upcomingGoals ?? []).length === 0 ? (
                    <p className="px-5 py-8 text-center text-[13px] leading-relaxed text-ink-400">
                      No upcoming goals. Give a space a date ahead - an exam, an offer deadline - and its countdown
                      shows here.
                    </p>
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {data.upcomingGoals.map((space) => {
                        const meta = KIND_META[space.kind ?? 'PLATFORM'];
                        const Icon = meta.icon;
                        const soon = (daysUntil(space.targetDate) ?? 99) <= 14;
                        return (
                          <li key={space.id}>
                            <Link
                              href="/spaces"
                              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-ink-100/50"
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} style={{ color: space.color }} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-3">
                                  <p className="truncate text-[13.5px] text-ink-900">{space.name}</p>
                                  <span
                                    className={cn(
                                      'shrink-0 font-mono text-[11.5px]',
                                      soon ? 'text-amber-700 dark:text-amber-400' : 'text-ink-500',
                                    )}
                                  >
                                    {countdown(space.targetDate)}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-[12px] text-ink-500">
                                  {space.goal ? `${space.goal} · ` : ''}
                                  {meta.dateLabel} {formatDate(space.targetDate, 'd MMM')}
                                </p>
                                {space.taskCount > 0 && (
                                  <ProgressBar value={progress(space.doneCount, space.taskCount)} className="mt-2" />
                                )}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader title="Due this week" icon={<CalendarClock className="h-3.5 w-3.5 text-brand-600" />} />
                  {data.upcomingDeadlines.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[13px] text-ink-400">No deadlines in the next seven days.</p>
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {data.upcomingDeadlines.map((task) => (
                        <li key={task.id}>
                          <button
                            onClick={() => setOpenTask(task.taskKey)}
                            className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-100/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] text-ink-800">{task.title}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-ink-400">{task.taskKey}</p>
                            </div>
                            <Badge className={task.overdue ? TONE.rose : TONE.amber}>{dueLabel(task.dueDate)}</Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader title="Recent activity" />
                  <ol className="max-h-[460px] space-y-4 overflow-y-auto px-5 py-4">
                    {data.recentActivity.map((entry) => (
                      <li key={entry.id} className="flex gap-3">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] leading-snug text-ink-600">
                            <ActivityLine
                              entry={entry}
                              withKey={
                                entry.taskKey && (
                                  <button
                                    onClick={() => entry.taskKey && setOpenTask(entry.taskKey)}
                                    className="font-mono text-[11.5px] text-brand-600 hover:underline"
                                  >
                                    {entry.taskKey}
                                  </button>
                                )
                              }
                            />
                          </p>
                          <p className="mt-0.5 font-mono text-[10.5px] text-ink-400">{fromNow(entry.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                    {data.recentActivity.length === 0 && (
                      <p className="py-6 text-center text-[13px] text-ink-400">Nothing has happened yet.</p>
                    )}
                  </ol>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskDrawer taskKey={openTask} open={Boolean(openTask)} onClose={() => setOpenTask(null)} />
    </>
  );
}
