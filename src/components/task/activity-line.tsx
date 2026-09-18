import type { Activity } from '@/lib/types';
import { titleCase } from '@/lib/utils';

/**
 * One history entry as a sentence. Everything is done by the owner, so the sentence starts
 * with the verb - "Moved to Done", not "Firdovsi moved it to Done".
 */
export function ActivityLine({ entry, withKey }: { entry: Activity; withKey?: React.ReactNode }) {
  const strong = (value?: string | null) => <span className="text-ink-900">{value}</span>;

  switch (entry.type) {
    case 'TASK_CREATED':
      return <>Created {withKey}</>;
    case 'TASK_MOVED':
      return (
        <>
          Moved {withKey} {entry.oldValue && <>from {strong(entry.oldValue)} </>}to {strong(entry.newValue)}
        </>
      );
    case 'COMMENT_ADDED':
      return <>Commented on {withKey ?? 'this task'}</>;
    case 'TASK_DELETED':
      return <>Deleted {withKey}</>;
    case 'COMMENT_DELETED':
      return <>Removed a comment on {withKey ?? 'this task'}</>;
    case 'TASK_UPDATED':
      return (
        <>
          Changed {strong(titleCase(entry.field))}
          {withKey && <> on {withKey}</>}
          {entry.oldValue && entry.newValue && entry.oldValue !== 'null' && entry.newValue !== 'null' && (
            <>
              {' '}from {strong(entry.oldValue)} to {strong(entry.newValue)}
            </>
          )}
        </>
      );
    default:
      return <>Updated {withKey}</>;
  }
}
