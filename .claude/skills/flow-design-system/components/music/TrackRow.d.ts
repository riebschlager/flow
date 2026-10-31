import * as React from 'react';

/**
 * A recording or community track in a list.
 */
export interface TrackRowProps {
  title: string; author?: string; duration?: string; likes?: number; liked?: boolean; playing?: boolean; colors?: string[]; selected?: boolean; meta?: string; onPlay?: () => void; onLike?: () => void; onSelect?: () => void;
}

export declare function TrackRow(props: TrackRowProps): JSX.Element;
