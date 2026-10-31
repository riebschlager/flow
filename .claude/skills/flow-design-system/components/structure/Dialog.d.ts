import * as React from 'react';

/**
 * Modal sheet for Beat studio, Library and Community.
 * @startingPoint section="Overlays" subtitle="Centered sheet over a blurred scrim" viewport="700x400"
 */
export interface DialogProps {
  open?: boolean; onClose?: () => void; eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode; children?: React.ReactNode; width?: number; /** Render without scrim, in flow. */ inline?: boolean;
}

export declare function Dialog(props: DialogProps): JSX.Element;
