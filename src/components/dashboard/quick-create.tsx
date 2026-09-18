'use client';

import { Layers, Network, SquareKanban } from 'lucide-react';
import { useState } from 'react';
import { DiagramForm } from '@/components/architecture/diagram-form';
import { BoardForm } from '@/components/board/board-form';
import { PlatformForm } from '@/components/platform/platform-form';
import { Button } from '@/components/ui';

type Creating = 'platform' | 'board' | 'diagram' | null;

/** The dashboard's "start something" row - each also lives on its own page. */
export function QuickCreate() {
  const [creating, setCreating] = useState<Creating>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setCreating('board')}>
          <SquareKanban className="h-3.5 w-3.5" />
          New board
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setCreating('platform')}>
          <Layers className="h-3.5 w-3.5" />
          New platform
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setCreating('diagram')}>
          <Network className="h-3.5 w-3.5" />
          New diagram
        </Button>
      </div>

      <PlatformForm open={creating === 'platform'} onClose={() => setCreating(null)} />
      <BoardForm open={creating === 'board'} onClose={() => setCreating(null)} />
      <DiagramForm open={creating === 'diagram'} onClose={() => setCreating(null)} />
    </>
  );
}
