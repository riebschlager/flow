import * as React from 'react';

/**
 * Disclosure row for secondary settings (Note shape, Groove feel). Summary shows current values while closed.
 */
export interface FoldProps {
  title: string; summary?: string; defaultOpen?: boolean; open?: boolean; onToggle?: (open: boolean) => void; children?: React.ReactNode; trailing?: React.ReactNode;
}

export declare function Fold(props: FoldProps): JSX.Element;
