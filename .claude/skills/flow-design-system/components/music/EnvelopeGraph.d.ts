import * as React from 'react';

/**
 * ADSR preview drawn from note-shape values; highlights the segment being edited.
 */
export interface EnvelopeGraphProps {
  attack?: number; decay?: number; sustain?: number; length?: number; active?: 'a' | 'd' | 's' | 'r'; height?: number;
}

export declare function EnvelopeGraph(props: EnvelopeGraphProps): JSX.Element;
