import * as React from 'react';

/**
 * On/off toggle for layers and modes (Arpeggiator, Percussion, Automatic droplets). With a label it becomes a full row.
 */
export interface SwitchProps {
  checked?: boolean; defaultChecked?: boolean; onChange?: (on: boolean) => void; label?: string; description?: string; disabled?: boolean; ariaLabel?: string;
}

export declare function Switch(props: SwitchProps): JSX.Element;
