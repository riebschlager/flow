import * as React from 'react';

/**
 * Slider for levels and proportions (volume, mix, probability, pace); vertical orientation is the Mix fader.
 * @startingPoint section="Controls" subtitle="Level slider and vertical mix fader" viewport="700x290"
 */
export interface SliderProps {
  value?: number; defaultValue?: number; min?: number; max?: number; step?: number;
  onChange?: (v: number) => void; label?: string; format?: (v: number) => string;
  orientation?: 'horizontal' | 'vertical'; /** Vertical track length in px. */ length?: number;
  /** Left/right end labels, e.g. ['Straight','Laid back']. */ extents?: [string, string];
  color?: string; disabled?: boolean; showValue?: boolean; ariaLabel?: string;
}

export declare function Slider(props: SliderProps): JSX.Element;
