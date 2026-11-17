export type RibbonColor = 'TEAL' | 'RED' | 'YELLOW' | 'PURPLE' | 'SLATE';

export const RIBBON_INDEX: Record<RibbonColor, number> = {
  TEAL: 0,
  RED: 1,
  YELLOW: 2,
  PURPLE: 3,
  SLATE: 4,
};

export interface AbilityData {
  displayName: string;
  icon: string;
  cooldown: number;
  cost: number;
  description: string;
}

export interface CharacterData {
  id: string;
  displayName: string;
  ribbon: RibbonColor;
  portrait: string;
  stats: Record<string, number>;
  abilities: AbilityData[];
}

export type Direction = 'up' | 'down' | 'left' | 'right';
export type CompanionState = 'IDLE_WAIT' | 'FOLLOW';

export interface CompanionSummary {
  id: string;
  name: string;
  followOrder: number;
  state: CompanionState;
  inRange: boolean;
}

export interface WorldPaperItem {
  id: string;
  title: string;
  note: string;
  x: number;
  y: number;
}

export interface IslandNpcData {
  id: string;
  name: string;
  role: string;
  portrait: string;
  spriteKey: 'npc1Idle' | 'npc2Idle';
  hueRotateDeg: number;
  x: number;
  y: number;
  facing: Direction;
  dialogLines: string[];
}

