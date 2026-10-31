import * as React from 'react';

/**
 * Numeric stepper with − / + and a scrubbable value. Used for tempo.
 */
export interface StepperProps {
  value?: number; defaultValue?: number; min?: number; max?: number; step?: number; onChange?: (v: number) => void; label?: string; unit?: string; size?: 'md' | 'lg';
}

export declare function Stepper(props: StepperProps): JSX.Element;
