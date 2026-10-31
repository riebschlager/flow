import * as React from 'react';

/**
 * Pick one of 2–7 discrete musical values (note rate, chord length, octaves, rhythm speed). Replaces short selects.
 */
export interface SegmentedProps {
  options: Array<string | number | { value: any; label: string }>; value?: any; defaultValue?: any; onChange?: (v: any) => void; size?: 'sm' | 'md'; full?: boolean; ariaLabel?: string;
}

export declare function Segmented(props: SegmentedProps): JSX.Element;
