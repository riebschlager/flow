import * as React from 'react';

/**
 * Text button. One primary per view (Play); secondary for actions; ghost for navigation; record only for capture.
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'record'; size?: 'sm' | 'md' | 'lg'; icon?: React.ReactNode; iconRight?: React.ReactNode; children?: React.ReactNode;
  disabled?: boolean; /** Pressed / toggled state; renders in accent. */ active?: boolean; full?: boolean; onClick?: () => void; type?: 'button' | 'submit'; title?: string; style?: React.CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;
