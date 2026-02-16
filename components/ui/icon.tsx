'use client';

import { type ComponentProps } from 'react';
import * as icons from '@/lib/ui/icons';
import type { LucideIcon } from '@/lib/ui/icons';

/** All valid icon names (keys of the icon map). */
type IconName = Exclude<keyof typeof icons, 'LucideIcon'>;

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

interface IconProps extends Omit<ComponentProps<LucideIcon>, 'ref'> {
  /** Semantic name matching a key in lib/ui/icons.ts */
  name: IconName;
  /** Predefined size token (default: "md") */
  size?: IconSize;
}

/**
 * Unified icon wrapper. Usage:
 * ```tsx
 * <Icon name="Sparkles" size="lg" className="text-magic-gold" />
 * ```
 */
export function Icon({ name, size = 'md', className = '', ...rest }: IconProps) {
  const Component = icons[name] as LucideIcon;
  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }
  return <Component className={`${sizes[size]} ${className}`.trim()} {...rest} />;
}
