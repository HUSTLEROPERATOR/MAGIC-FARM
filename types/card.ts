import type { ReactNode } from 'react';

export interface CardData {
  id: string;
  faceContent: ReactNode;
  backContent: ReactNode;
  value?: string;
  metadata?: Record<string, unknown>;
}

export interface CardPosition {
  x: number;
  y: number;
  rotate: number;
}
