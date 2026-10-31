import * as React from 'react';

/**
 * Native select, restyled. For long or named lists: vibe, progression, kit, instrument.
 */
export interface SelectProps {
  options?: Array<string | { value: string; label: string }>; groups?: Array<{ label?: string; options: Array<string | { value: string; label: string }> }>;
  value?: string; defaultValue?: string; onChange?: (v: string) => void; label?: string; /** Label left, select right. */ inline?: boolean; size?: 'sm' | 'md'; full?: boolean; ariaLabel?: string;
}

export declare function Select(props: SelectProps): JSX.Element;
