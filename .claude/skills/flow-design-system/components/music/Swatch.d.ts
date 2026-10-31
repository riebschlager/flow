import * as React from 'react';

/**
 * Voice color dot. Selected gets a gap ring in its own color.
 */
export interface SwatchProps {
  color: string; name: string; selected?: boolean; onClick?: () => void; size?: number;
}

export declare function Swatch(props: SwatchProps): JSX.Element;
