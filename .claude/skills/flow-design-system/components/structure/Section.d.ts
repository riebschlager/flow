import * as React from 'react';

/**
 * Panel section: small caps title, optional HelpTip and action, hairline above.
 */
export interface SectionProps {
  title?: string; help?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode; gap?: number; divider?: boolean;
}

export declare function Section(props: SectionProps): JSX.Element;
