import * as React from 'react';

/**
 * 24px-grid 1.5-stroke glyphs. First eight copied from the app sprite; the rest are geometric additions.
 */
export interface IconProps {
  name: 'drop' | 'play' | 'pause' | 'reset' | 'expand' | 'volume' | 'sliders' | 'spark' | 'stop' | 'record' | 'close' | 'chevron-down' | 'chevron-up' | 'chevron-right' | 'chevron-left' | 'plus' | 'minus' | 'arrow-up-right' | 'help' | 'heart' | 'share' | 'download' | 'loop';
  size?: number; strokeWidth?: number; filled?: boolean; style?: React.CSSProperties; title?: string;
}

export declare function Icon(props: IconProps): JSX.Element;
