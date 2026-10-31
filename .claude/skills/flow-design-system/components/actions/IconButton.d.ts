import * as React from 'react';

/**
 * Square or round icon-only button. `label` is required (aria + tooltip).
 */
export interface IconButtonProps {
  children: React.ReactNode; label: string; size?: 'sm' | 'md' | 'lg' | number; variant?: 'ghost' | 'secondary' | 'primary'; round?: boolean; active?: boolean; disabled?: boolean; onClick?: () => void; style?: React.CSSProperties;
}

export declare function IconButton(props: IconButtonProps): JSX.Element;
