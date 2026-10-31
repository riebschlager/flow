import * as React from 'react';

/**
 * Text tabs with a sliding 1px accent underline. Control rail sections (Sound, Layers, Play, Scene, Mix).
 */
export interface TabsProps {
  items: Array<{ id: string; label: string }>; value?: string; defaultValue?: string; onChange?: (id: string) => void; size?: 'sm' | 'md';
}

export declare function Tabs(props: TabsProps): JSX.Element;
