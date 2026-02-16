'use client';

import { type ComponentProps } from 'react';
import * as icons from '@/lib/ui/icons';
import type { LucideIcon } from 'lucide-react';

/**
 * Tipo helper: prende solo le chiavi di `icons` che puntano a componenti Lucide.
 * Esclude automaticamente eventuali export non-componenti.
 */
export type IconName = {
  [K in keyof typeof icons]: (typeof icons)[K] extends LucideIcon ? K : never;
}[keyof typeof icons];

const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
} as const;

type IconSize = keyof typeof sizes;

type IconProps = Omit<ComponentProps<LucideIcon>, 'ref'> & {
  /** Nome semantico che deve esistere in lib/ui/icons.ts */
  name: IconName;
  /** Token dimensione (default: md) */
  size?: IconSize;
};

/**
 * Unified icon wrapper.
 * Usage:
 * <Icon name="Sparkles" size="lg" className="text-magic-gold" />
 */
export function Icon({ name, size = 'md', className = '', ...rest }: IconProps) {
  const Component = icons[name];

  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[Icon] Unknown icon name: "${String(name)}"`);
    }
    return null;
  }

  const LucideComponent = Component as unknown as LucideIcon;

  return (
    <LucideComponent
      className={`${sizes[size]} ${className}`.trim()}
      {...rest}
    />
  );
}
