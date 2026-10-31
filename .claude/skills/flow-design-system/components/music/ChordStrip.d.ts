import * as React from 'react';

/**
 * The progression, with the current chord lit and a thin accent progress line.
 */
export interface ChordStripProps {
  chords: string[]; current?: number; progress?: number;
}

export declare function ChordStrip(props: ChordStripProps): JSX.Element;
