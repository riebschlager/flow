import * as React from 'react';

/**
 * Rotary control for continuous character parameters (reverb, swirl, attack, glide, tone). Vertical drag, Shift for fine, wheel, double-click to reset, arrow keys.
 * @startingPoint section="Controls" subtitle="Rotary control with vertical drag, fine adjust, wheel and reset" viewport="700x250"
 */
export interface KnobProps {
  value?: number; defaultValue?: number; min?: number; max?: number; step?: number;
  /** Exponent for non-linear taper (2–3 for times/frequencies). */ skew?: number;
  onChange?: (v: number) => void; label?: string; format?: (v: number) => string;
  size?: 'sm' | 'md' | 'lg' | number; bipolar?: boolean; disabled?: boolean; showValue?: boolean;
  /** Override fill color, e.g. var(--voice-1) for a voice-specific knob. */ color?: string;
  /** Pixels of vertical travel for the full range. Default 200. */ dragRange?: number; ariaLabel?: string;
}

export declare function Knob(props: KnobProps): JSX.Element;
