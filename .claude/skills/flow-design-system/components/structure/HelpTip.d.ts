import * as React from 'react';

/**
 * A small ? that reveals helper copy on hover/focus. Where long explanations live now.
 */
export interface HelpTipProps {
  children: React.ReactNode; align?: 'left' | 'right'; side?: 'top' | 'bottom'; width?: number; label?: string;
}

export declare function HelpTip(props: HelpTipProps): JSX.Element;
