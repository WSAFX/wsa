import type { Batch } from './types';

export const STATUS_LABEL: Record<Batch['status'], string> = {
  current: 'Current class',
  outgoing: 'Outgoing / graduating',
  archived: 'Past batch',
};

export const DISPLAY_OPTIONS: { value: Batch['display_mode']; label: string; desc: string }[] = [
  { value: 'slider', label: 'Slider', desc: 'Big featured photo, then an auto-playing slideshow' },
  { value: 'featured_thumbs', label: 'Featured + thumbnails', desc: 'Large photo with a clickable strip below' },
  { value: 'grid', label: 'Grid', desc: 'Featured banner above an even photo grid' },
  { value: 'masonry', label: 'Masonry', desc: 'Featured banner above a natural-shape collage' },
];

export const DISPLAY_LABEL = Object.fromEntries(DISPLAY_OPTIONS.map((o) => [o.value, o.label])) as Record<
  Batch['display_mode'],
  string
>;
