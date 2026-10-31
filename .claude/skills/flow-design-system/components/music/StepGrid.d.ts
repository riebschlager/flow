import * as React from 'react';

/**
 * Beat studio sequencer grid. Click cycles off → ghost → hit → accent; the dot mutes.
 * @startingPoint section="Music" subtitle="4 voices × 16 steps, off → ghost → hit → accent" viewport="700x400"
 */
export interface StepGridProps {
  voices: Array<{ name: string; color: string; muted?: boolean; steps: Array<0 | 1 | 2 | 3> }>; playhead?: number; onStep?: (voice: number, step: number, next: 0 | 1 | 2 | 3) => void; onMute?: (voice: number) => void; steps?: number;
}

export declare function StepGrid(props: StepGridProps): JSX.Element;
