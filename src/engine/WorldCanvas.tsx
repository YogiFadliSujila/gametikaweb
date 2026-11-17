import React, { useEffect, useRef } from 'react';
import { ISLAND_NPCS, PAPER_ITEM_ASSET, WORLD_PAPERS } from '../data/bridge2Quest';
import {
  COMPANION_1_DATA,
  COMPANION_2_DATA,
  PLAYER_DATA,
} from '../data/characters';
import { TILE_SIZE, TileCell, WORLD_LAYERS } from '../data/worldMapData';
import {
  CharacterData,
  CompanionState,
  CompanionSummary,
  Direction,
  IslandNpcData,
  WorldPaperItem,
} from '../types/game';
import { buildWorldColliders, moveAndSlide, testMoveCollision, WorldColliders } from './physics';

interface WorldCanvasProps {
  onOpenCharacterInfo: (data: CharacterData, screenPos: { x: number; y: number }) => void;
  onCompanionsUpdate: (companions: CompanionSummary[]) => void;
  onOpenBridgePuzzle: () => void;
  onInteractBridge2Gate: () => void;
  onCollectPaper: (paper: WorldPaperItem) => void;
  onTalkIslandNpc: (npc: IslandNpcData) => void;
  bridgeUnlocked: boolean;
  bridge2Unlocked: boolean;
  collectedPaperIds: string[];
  talkedNpcIds: string[];
  commandRef: React.MutableRefObject<{
    toggleCompanion: (id: string) => void;
  } | null>;
  isPopupOpen: boolean;
}

interface CompanionEntity {
  id: string;
  name: string;
  data: CharacterData;
  followOrder: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  realVx: number;
  realVy: number;
  state: CompanionState;
  playerInRange: boolean;
  isFollowingMoving: boolean;
  breadcrumbs: Array<{ x: number; y: number }>;
  lastDirX: number;
  lastDirY: number;
  dirSuffix: Direction;
  currentAnim: string;
  animCooldown: number;
  stuckTimer: number;
  animTime: number;
  followTargetId: string | null;
  idleImgKey: string;
  runImgKey: string;
}

interface PlayerEntity {
  x: number;
  y: number;
  facing: Direction;
  isMoving: boolean;
  animTime: number;
  data: CharacterData;
}

const INTERACT_RADIUS = 85;
const PAPER_INTERACT_RADIUS = 56;
const ISLAND_NPC_INTERACT_RADIUS = 68;
const STOP_DISTANCE = 32;
const RESUME_DISTANCE = 44;
const TELEPORT_DISTANCE = 220;
const BREADCRUMB_SPACING = 10;
const PLAYER_SPEED = 100;
const NPC_SPEED = 95;
const COLLIDER_RADIUS = 7;
const BRIDGE_GATE_POS = { x: 356, y: 96 };
const BRIDGE_GATE_RADIUS = 68;
const BRIDGE_2_GATE_POS = { x: 928, y: 214 };
const BRIDGE_2_GATE_RADIUS = 66;

const DIR_ROW: Record<Direction, number> = {
  up: 0,
  left: 1,
  down: 2,
  right: 3,
};

const ASSET_PATHS: Record<string, string> = {
  waterBg: '/assets/environment/Tileset/Water Background color.png',
  waterFoam: '/assets/environment/animated_tiles/Water Foam.png',
  waterRock1: '/assets/environment/Rocks in the Water/Water Rocks_01.png',
  waterRock2: '/assets/environment/Rocks in the Water/Water Rocks_02.png',
  waterRock3: '/assets/environment/Rocks in the Water/Water Rocks_03.png',
  waterRock4: '/assets/environment/Rocks in the Water/Water Rocks_04.png',
  ground: '/assets/environment/Tileset/Tilemap_color3.png',
  highGround: '/assets/environment/Tileset/Tilemap_color1.png',
  shadow: '/assets/environment/Tileset/Shadow.png',
  bridge: '/assets/environment/Bridge/Bridge_All.png',
  tree1: '/assets/environment/Wood/Trees/Tree1.png',
  tree2: '/assets/environment/Wood/Trees/Tree2.png',
  tree3: '/assets/environment/Wood/Trees/Tree3.png',
  tree4: '/assets/environment/Wood/Trees/Tree4.png',
  bush1: '/assets/environment/Bushes/Bushe1.png',
  bush2: '/assets/environment/Bushes/Bushe2.png',
  bush3: '/assets/environment/Bushes/Bushe3.png',
  bush4: '/assets/environment/Bushes/Bushe4.png',
  playerIdle: '/assets/player/idle_smooth_8x.png',
  playerRun: '/assets/player/run_smooth_8x.png',
  npc1Idle: '/assets/npcs/teman1/idle_smooth_8x (1).png',
  npc1Run: '/assets/npcs/teman1/run_smooth_8x (1).png',
  npc2Idle: '/assets/npcs/teman2/idle_smooth_8x (2).png',
  npc2Run: '/assets/npcs/teman2/run_smooth_8x (2).png',
  paperItem: PAPER_ITEM_ASSET,
};

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

function isDrawableReady(src: CanvasImageSource | undefined): boolean {
  if (!src) return false;
  if (src instanceof HTMLImageElement) {
    return src.complete && src.naturalWidth > 0;
  }
  if (src instanceof HTMLCanvasElement) {
    return src.width > 0 && src.height > 0;
  }
  return true;
}

function createTintedSpriteSheet(
  img: HTMLImageElement,
  hueRotateDeg: number
): HTMLCanvasElement | null {
  if (!img.complete || img.naturalWidth === 0) return null;
  const off = document.createElement('canvas');
  off.width = img.naturalWidth;
  off.height = img.naturalHeight;
  const octx = off.getContext('2d');
  if (!octx) return null;
  octx.filter = `hue-rotate(${hueRotateDeg}deg) saturate(1.15)`;
  octx.drawImage(img, 0, 0);
  octx.filter = 'none';
  return off;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  onOpenCharacterInfo,
  onCompanionsUpdate,
  onOpenBridgePuzzle,
  onInteractBridge2Gate,
  onCollectPaper,
  onTalkIslandNpc,
  bridgeUnlocked,
  bridge2Unlocked,
  collectedPaperIds,
  talkedNpcIds,
  commandRef,
  isPopupOpen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPopupOpenRef = useRef(isPopupOpen);
  isPopupOpenRef.current = isPopupOpen;

  const bridgeUnlockedRef = useRef(bridgeUnlocked);
  bridgeUnlockedRef.current = bridgeUnlocked;

  const bridge2UnlockedRef = useRef(bridge2Unlocked);
  bridge2UnlockedRef.current = bridge2Unlocked;

  const collectedPaperIdsRef = useRef(collectedPaperIds);
  collectedPaperIdsRef.current = collectedPaperIds;

  const talkedNpcIdsRef = useRef(talkedNpcIds);
  talkedNpcIdsRef.current = talkedNpcIds;

  const callbacksRef = useRef({
    onOpenCharacterInfo,
    onCompanionsUpdate,
    onOpenBridgePuzzle,
    onInteractBridge2Gate,
    onCollectPaper,
    onTalkIslandNpc,
  });
  callbacksRef.current = {
    onOpenCharacterInfo,
    onCompanionsUpdate,
    onOpenBridgePuzzle,
    onInteractBridge2Gate,
    onCollectPaper,
    onTalkIslandNpc,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images: Record<string, HTMLImageElement> = {};
    const tintedNpcSheets: Record<string, HTMLCanvasElement> = {};
    let loadedCount = 0;

    const rebuildTintedSheetsFor = (spriteKey: 'npc1Idle' | 'npc2Idle') => {
      const baseImg = images[spriteKey];
      if (!baseImg || !baseImg.complete || baseImg.naturalWidth === 0) return;
      for (const npc of ISLAND_NPCS) {
        if (npc.spriteKey === spriteKey) {
          const sheet = createTintedSpriteSheet(baseImg, npc.hueRotateDeg);
          if (sheet) tintedNpcSheets[npc.id] = sheet;
        }
      }
    };

    for (const [key, src] of Object.entries(ASSET_PATHS)) {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (key === 'npc1Idle' || key === 'npc2Idle') {
          rebuildTintedSheetsFor(key);
        }
      };
      img.src = src;
      images[key] = img;
    }

    const colliders: WorldColliders = buildWorldColliders();

    const player: PlayerEntity = {
      x: 32,
      y: 64,
      facing: 'down',
      isMoving: false,
      animTime: 0,
      data: PLAYER_DATA,
    };

    const companions: CompanionEntity[] = [
      {
        id: 'teman1',
        name: 'Teman 1',
        data: COMPANION_1_DATA,
        followOrder: 1,
        x: -16,
        y: 96,
        vx: 0,
        vy: 0,
        realVx: 0,
        realVy: 0,
        state: 'IDLE_WAIT',
        playerInRange: false,
        isFollowingMoving: false,
        breadcrumbs: [],
        lastDirX: 0,
        lastDirY: 1,
        dirSuffix: 'down',
        currentAnim: 'idle_down',
        animCooldown: 0,
        stuckTimer: 0,
        animTime: 0,
        followTargetId: null,
        idleImgKey: 'npc1Idle',
        runImgKey: 'npc1Run',
      },
      {
        id: 'teman2',
        name: 'Teman 2',
        data: COMPANION_2_DATA,
        followOrder: 2,
        x: 96,
        y: 96,
        vx: 0,
        vy: 0,
        realVx: 0,
        realVy: 0,
        state: 'IDLE_WAIT',
        playerInRange: false,
        isFollowingMoving: false,
        breadcrumbs: [],
        lastDirX: 0,
        lastDirY: 1,
        dirSuffix: 'down',
        currentAnim: 'idle_down',
        animCooldown: 0,
        stuckTimer: 0,
        animTime: 0,
        followTargetId: null,
        idleImgKey: 'npc2Idle',
        runImgKey: 'npc2Run',
      },
    ];

    const keys = new Set<string>();
    const cam = { x: player.x, y: player.y - 20, zoom: 2 };

    const updateAllFollowTargets = () => {
      const active = companions
        .filter((c) => c.state === 'FOLLOW')
        .sort((a, b) => a.followOrder - b.followOrder);

      for (const c of companions) {
        if (c.state !== 'FOLLOW') {
          c.followTargetId = null;
        }
      }

      for (let i = 0; i < active.length; i++) {
        active[i].breadcrumbs = [];
        active[i].followTargetId = i === 0 ? 'player' : active[i - 1].id;
      }
    };

    const getEntityPos = (id: string | null): { x: number; y: number } | null => {
      if (!id) return null;
      if (id === 'player') return { x: player.x, y: player.y };
      const found = companions.find((c) => c.id === id);
      return found ? { x: found.x, y: found.y } : null;
    };

    const toggleCompanionState = (npc: CompanionEntity) => {
      if (npc.state === 'IDLE_WAIT') {
        npc.state = 'FOLLOW';
        npc.breadcrumbs = [];
        npc.stuckTimer = 0;
      } else {
        npc.state = 'IDLE_WAIT';
        npc.vx = 0;
        npc.vy = 0;
        npc.isFollowingMoving = false;
        npc.breadcrumbs = [];
        npc.stuckTimer = 0;
      }
      updateAllFollowTargets();
      emitCompanionSummary();
    };

    const emitCompanionSummary = () => {
      callbacksRef.current.onCompanionsUpdate(
        companions.map((c) => ({
          id: c.id,
          name: c.name,
          followOrder: c.followOrder,
          state: c.state,
          inRange: c.playerInRange,
        }))
      );
    };

    commandRef.current = {
      toggleCompanion: (id: string) => {
        const npc = companions.find((c) => c.id === id);
        if (npc) toggleCompanionState(npc);
      },
    };

    const isClosestInteractableNpc = (npc: CompanionEntity): boolean => {
      const myDist = dist(npc.x, npc.y, player.x, player.y);
      for (const other of companions) {
        if (other !== npc && other.playerInRange) {
          const otherDist = dist(other.x, other.y, player.x, player.y);
          if (otherDist < myDist) return false;
        }
      }
      return true;
    };

    const respawnBehindTarget = (npc: CompanionEntity) => {
      const targetPos = getEntityPos(npc.followTargetId);
      if (!targetPos) return;

      const spacing = 22 * npc.followOrder;
      let ox = 0;
      let oy = -spacing;
      switch (player.facing) {
        case 'down':
          ox = 0;
          oy = -spacing;
          break;
        case 'up':
          ox = 0;
          oy = spacing;
          break;
        case 'left':
          ox = spacing;
          oy = 0;
          break;
        case 'right':
          ox = -spacing;
          oy = 0;
          break;
      }

      const spawnX = targetPos.x + ox;
      const spawnY = targetPos.y + oy;
      if (
        testMoveCollision(
          spawnX,
          spawnY,
          COLLIDER_RADIUS,
          colliders,
          bridgeUnlockedRef.current,
          bridge2UnlockedRef.current
        )
      ) {
        npc.x = targetPos.x;
        npc.y = targetPos.y;
      } else {
        npc.x = spawnX;
        npc.y = spawnY;
      }

      npc.vx = 0;
      npc.vy = 0;
      npc.isFollowingMoving = false;
      npc.breadcrumbs = [];
      npc.stuckTimer = 0;
    };

    const getStableDirSuffix = (npc: CompanionEntity, dx: number, dy: number): Direction => {
      if (Math.abs(dx) > Math.abs(dy) + 0.15) {
        npc.dirSuffix = dx > 0 ? 'right' : 'left';
      } else if (Math.abs(dy) > Math.abs(dx) + 0.15) {
        npc.dirSuffix = dy > 0 ? 'down' : 'up';
      }
      return npc.dirSuffix;
    };

    const isPlayerInGate1Zone = (): boolean =>
      !bridgeUnlockedRef.current &&
      dist(player.x, player.y, BRIDGE_GATE_POS.x, BRIDGE_GATE_POS.y) <= BRIDGE_GATE_RADIUS;

    const isPlayerInGate2Zone = (): boolean =>
      !bridge2UnlockedRef.current &&
      dist(player.x, player.y, BRIDGE_2_GATE_POS.x, BRIDGE_2_GATE_POS.y) <= BRIDGE_2_GATE_RADIUS;

    const getClosestPaperInRange = (): WorldPaperItem | null => {
      let closest: WorldPaperItem | null = null;
      let minDist = Infinity;
      for (const paper of WORLD_PAPERS) {
        if (collectedPaperIdsRef.current.includes(paper.id)) continue;
        const d = dist(player.x, player.y, paper.x, paper.y);
        if (d <= PAPER_INTERACT_RADIUS && d < minDist) {
          minDist = d;
          closest = paper;
        }
      }
      return closest;
    };

    const getClosestIslandNpcInRange = (): IslandNpcData | null => {
      let closest: IslandNpcData | null = null;
      let minDist = Infinity;
      for (const npc of ISLAND_NPCS) {
        const d = dist(player.x, player.y, npc.x, npc.y);
        if (d <= ISLAND_NPC_INTERACT_RADIUS && d < minDist) {
          minDist = d;
          closest = npc;
        }
      }
      return closest;
    };

    type PromptTarget =
      | { kind: 'gate1' }
      | { kind: 'gate2' }
      | { kind: 'paper'; paper: WorldPaperItem }
      | { kind: 'islandNpc'; npc: IslandNpcData }
      | { kind: 'companion'; companion: CompanionEntity };

    const getActiveInteractTarget = (): PromptTarget | null => {
      const candidates: Array<{ target: PromptTarget; score: number }> = [];

      if (isPlayerInGate1Zone()) {
        candidates.push({
          target: { kind: 'gate1' },
          score: dist(player.x, player.y, BRIDGE_GATE_POS.x, BRIDGE_GATE_POS.y) - 14,
        });
      }
      if (isPlayerInGate2Zone()) {
        candidates.push({
          target: { kind: 'gate2' },
          score: dist(player.x, player.y, BRIDGE_2_GATE_POS.x, BRIDGE_2_GATE_POS.y) - 14,
        });
      }
      const paper = getClosestPaperInRange();
      if (paper) {
        candidates.push({
          target: { kind: 'paper', paper },
          score: dist(player.x, player.y, paper.x, paper.y) - 12,
        });
      }
      const islandNpc = getClosestIslandNpcInRange();
      if (islandNpc) {
        candidates.push({
          target: { kind: 'islandNpc', npc: islandNpc },
          score: dist(player.x, player.y, islandNpc.x, islandNpc.y) - 10,
        });
      }
      const comp = companions.find((c) => c.playerInRange && isClosestInteractableNpc(c));
      if (comp) {
        candidates.push({
          target: { kind: 'companion', companion: comp },
          score: dist(player.x, player.y, comp.x, comp.y),
        });
      }

      if (candidates.length === 0) return null;
      candidates.sort((a, b) => a.score - b.score);
      return candidates[0].target;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keys.add(code);

      if (code === 'KeyE' || code === 'Space') {
        if (isPopupOpenRef.current) return;
        const target = getActiveInteractTarget();
        if (!target) return;

        e.preventDefault();
        if (target.kind === 'gate1') {
          keys.clear();
          callbacksRef.current.onOpenBridgePuzzle();
        } else if (target.kind === 'gate2') {
          keys.clear();
          callbacksRef.current.onInteractBridge2Gate();
        } else if (target.kind === 'paper') {
          callbacksRef.current.onCollectPaper(target.paper);
        } else if (target.kind === 'islandNpc') {
          keys.clear();
          callbacksRef.current.onTalkIslandNpc(target.npc);
        } else {
          toggleCompanionState(target.companion);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
    };

    const screenToWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return {
        x: (sx - canvas.width * 0.5) / cam.zoom + cam.x,
        y: (sy - canvas.height * 0.5) / cam.zoom + cam.y,
      };
    };

    const hitTestCharacter = (wx: number, wy: number): CharacterData | null => {
      const candidates: Array<{ x: number; y: number; data: CharacterData }> = [
        { x: player.x, y: player.y, data: player.data },
        ...companions.map((c) => ({ x: c.x, y: c.y, data: c.data })),
      ];
      for (const c of candidates) {
        if (Math.abs(wx - c.x) <= 18 && wy >= c.y - 44 && wy <= c.y + 8) {
          return c.data;
        }
      }
      return null;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const hit = hitTestCharacter(worldPos.x, worldPos.y);
      if (hit) {
        callbacksRef.current.onOpenCharacterInfo(hit, { x: e.clientX, y: e.clientY });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0 || isPopupOpenRef.current) return;
      const worldPos = screenToWorld(e.clientX, e.clientY);

      // Gate 1 click
      if (
        !bridgeUnlockedRef.current &&
        Math.abs(worldPos.x - BRIDGE_GATE_POS.x) <= 28 &&
        worldPos.y >= 40 &&
        worldPos.y <= 136
      ) {
        keys.clear();
        callbacksRef.current.onOpenBridgePuzzle();
        return;
      }

      // Gate 2 click
      if (
        !bridge2UnlockedRef.current &&
        Math.abs(worldPos.x - BRIDGE_2_GATE_POS.x) <= 36 &&
        worldPos.y >= 186 &&
        worldPos.y <= 246
      ) {
        keys.clear();
        callbacksRef.current.onInteractBridge2Gate();
        return;
      }

      // Paper pickup click (must be in range)
      for (const paper of WORLD_PAPERS) {
        if (collectedPaperIdsRef.current.includes(paper.id)) continue;
        if (
          dist(player.x, player.y, paper.x, paper.y) <= PAPER_INTERACT_RADIUS &&
          Math.abs(worldPos.x - paper.x) <= 18 &&
          worldPos.y >= paper.y - 30 &&
          worldPos.y <= paper.y + 10
        ) {
          callbacksRef.current.onCollectPaper(paper);
          return;
        }
      }

      // Island NPC click (must be in range)
      for (const npc of ISLAND_NPCS) {
        if (
          dist(player.x, player.y, npc.x, npc.y) <= ISLAND_NPC_INTERACT_RADIUS &&
          Math.abs(worldPos.x - npc.x) <= 22 &&
          worldPos.y >= npc.y - 54 &&
          worldPos.y <= npc.y + 8
        ) {
          keys.clear();
          callbacksRef.current.onTalkIslandNpc(npc);
          return;
        }
      }

      // Companion click
      for (const npc of companions) {
        if (
          npc.playerInRange &&
          isClosestInteractableNpc(npc) &&
          Math.abs(worldPos.x - npc.x) <= 22 &&
          worldPos.y >= npc.y - 54 &&
          worldPos.y <= npc.y + 8
        ) {
          toggleCompanionState(npc);
          return;
        }
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cam.zoom = Math.max(1.6, Math.min(3.0, Math.min(canvas.width / 640, canvas.height / 360)));
    };

    handleResize();
    emitCompanionSummary();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('click', handleClick);

    let lastTime = performance.now();
    let globalTime = 0;
    let rafId = 0;
    let prevRangeSnapshot = '';

    const update = (dt: number) => {
      globalTime += dt;

      // 1. Player movement
      let ix = 0;
      let iy = 0;
      if (!isPopupOpenRef.current) {
        if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) iy += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) iy -= 1;
      }

      const len = Math.hypot(ix, iy);
      const vx = len > 0 ? (ix / len) * PLAYER_SPEED : 0;
      const vy = len > 0 ? (iy / len) * PLAYER_SPEED : 0;

      const pMoved = moveAndSlide(
        player.x,
        player.y,
        vx,
        vy,
        dt,
        COLLIDER_RADIUS,
        colliders,
        bridgeUnlockedRef.current,
        bridge2UnlockedRef.current
      );
      player.x = pMoved.x;
      player.y = pMoved.y;

      if (len > 0) {
        player.isMoving = true;
        if (ix !== 0) player.facing = ix > 0 ? 'right' : 'left';
        else if (iy !== 0) player.facing = iy > 0 ? 'down' : 'up';
      } else {
        player.isMoving = false;
      }
      player.animTime += dt;

      // 2. Companions update
      for (const npc of companions) {
        if (npc.animCooldown > 0) npc.animCooldown -= dt;

        const dToPlayer = dist(npc.x, npc.y, player.x, player.y);
        npc.playerInRange = dToPlayer <= INTERACT_RADIUS;

        if (npc.state === 'FOLLOW' && npc.followTargetId) {
          const targetPos = getEntityPos(npc.followTargetId);
          if (targetPos) {
            const distToTarget = dist(npc.x, npc.y, targetPos.x, targetPos.y);

            if (distToTarget >= TELEPORT_DISTANCE || dToPlayer >= TELEPORT_DISTANCE + 40) {
              respawnBehindTarget(npc);
            } else if (distToTarget <= STOP_DISTANCE) {
              npc.isFollowingMoving = false;
              npc.vx = 0;
              npc.vy = 0;
              npc.breadcrumbs = [];
              npc.stuckTimer = 0;
              if (dToPlayer > 1) {
                npc.lastDirX = (player.x - npc.x) / dToPlayer;
                npc.lastDirY = (player.y - npc.y) / dToPlayer;
              }
            } else {
              if (!npc.isFollowingMoving) {
                if (distToTarget >= RESUME_DISTANCE) {
                  npc.isFollowingMoving = true;
                } else {
                  npc.vx = 0;
                  npc.vy = 0;
                  if (dToPlayer > 1) {
                    npc.lastDirX = (player.x - npc.x) / dToPlayer;
                    npc.lastDirY = (player.y - npc.y) / dToPlayer;
                  }
                }
              }

              if (npc.isFollowingMoving) {
                if (npc.breadcrumbs.length === 0) {
                  npc.breadcrumbs.push({ x: targetPos.x, y: targetPos.y });
                } else {
                  const back = npc.breadcrumbs[npc.breadcrumbs.length - 1];
                  if (dist(back.x, back.y, targetPos.x, targetPos.y) >= BREADCRUMB_SPACING) {
                    npc.breadcrumbs.push({ x: targetPos.x, y: targetPos.y });
                  }
                }

                while (
                  npc.breadcrumbs.length > 1 &&
                  dist(npc.breadcrumbs[0].x, npc.breadcrumbs[0].y, targetPos.x, targetPos.y) <=
                    STOP_DISTANCE
                ) {
                  npc.breadcrumbs.shift();
                }

                if (npc.breadcrumbs.length > 0) {
                  const nextPt = npc.breadcrumbs[0];
                  const distToPt = dist(npc.x, npc.y, nextPt.x, nextPt.y);
                  if (distToPt <= 4) {
                    npc.breadcrumbs.shift();
                    npc.vx = 0;
                    npc.vy = 0;
                  } else {
                    const dx = (nextPt.x - npc.x) / distToPt;
                    const dy = (nextPt.y - npc.y) / distToPt;
                    const speed = distToTarget < RESUME_DISTANCE ? NPC_SPEED * 0.65 : NPC_SPEED;
                    npc.vx = dx * speed;
                    npc.vy = dy * speed;
                    npc.lastDirX = dx;
                    npc.lastDirY = dy;
                  }
                }
              }
            }
          }
        } else {
          npc.vx = 0;
          npc.vy = 0;
          npc.isFollowingMoving = false;
        }

        const nMoved = moveAndSlide(
          npc.x,
          npc.y,
          npc.vx,
          npc.vy,
          dt,
          COLLIDER_RADIUS,
          colliders,
          bridgeUnlockedRef.current,
          bridge2UnlockedRef.current
        );
        npc.x = nMoved.x;
        npc.y = nMoved.y;
        npc.realVx = nMoved.realVx;
        npc.realVy = nMoved.realVy;

        const realSpeed = Math.hypot(npc.realVx, npc.realVy);
        if (npc.state === 'FOLLOW' && npc.isFollowingMoving && (npc.vx !== 0 || npc.vy !== 0)) {
          if (realSpeed < 10) {
            npc.stuckTimer += dt;
            if (npc.stuckTimer >= 1.5) {
              respawnBehindTarget(npc);
            }
          } else {
            npc.stuckTimer = 0;
          }
        }

        const isActuallyMoving = npc.isFollowingMoving && realSpeed > 8;
        const dir = getStableDirSuffix(npc, npc.lastDirX, npc.lastDirY);
        const targetAnim = `${isActuallyMoving ? 'run' : 'idle'}_${dir}`;
        if (targetAnim !== npc.currentAnim && npc.animCooldown <= 0) {
          npc.currentAnim = targetAnim;
          npc.animCooldown = 0.1;
        }
        npc.animTime += dt;
      }

      // Sync range indicator to React HUD only when it changes
      const snapshot = companions
        .map((c) => `${c.id}:${c.state}:${c.playerInRange}`)
        .join('|');
      if (snapshot !== prevRangeSnapshot) {
        prevRangeSnapshot = snapshot;
        emitCompanionSummary();
      }

      // 3. Smooth Camera2D follow (offset 0, -20)
      cam.x += (player.x - cam.x) * Math.min(1, dt * 10);
      cam.y += (player.y - 20 - cam.y) * Math.min(1, dt * 10);
    };

    const drawTileCell = (
      img: HTMLImageElement | undefined,
      cell: TileCell,
      regionW = 64,
      regionH = 64,
      offsetX = 0,
      offsetY = 0,
      animFrame = 0
    ) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const [cx, cy, , ax, ay] = cell;
      const sx = (ax + animFrame) * regionW;
      const sy = ay * regionH;
      const dx = cx * TILE_SIZE + TILE_SIZE * 0.5 - regionW * 0.5 + offsetX;
      const dy = cy * TILE_SIZE + TILE_SIZE * 0.5 - regionH * 0.5 + offsetY;
      ctx.drawImage(img, sx, sy, regionW, regionH, Math.round(dx), Math.round(dy), regionW, regionH);
    };

    const drawCharacter = (
      x: number,
      y: number,
      img: CanvasImageSource | undefined,
      dir: Direction,
      isMoving: boolean,
      animTime: number
    ) => {
      if (!isDrawableReady(img) || !img) return;
      const row = DIR_ROW[dir];
      const col = isMoving
        ? Math.floor(animTime / 0.08) % 8
        : Math.floor(animTime / 0.5) % 2;
      const frameSize = 512;
      const drawSize = 51.2; // scale 0.1 * 512
      const sx = col * frameSize;
      const sy = row * frameSize;
      // Godot: offset = (0, -265) * 0.1 = (0, -26.5) from origin
      const dx = x - drawSize * 0.5;
      const dy = y - 26.5 - drawSize * 0.5;

      // Subtle ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(img, sx, sy, frameSize, frameSize, dx, dy, drawSize, drawSize);
    };

    const drawPromptTag = (px: number, py: number, label: string, strokeColor = '#f3cf7a') => {
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText(label);
      const boxW = metrics.width + 12;
      const boxH = 15;

      ctx.fillStyle = 'rgba(20, 16, 12, 0.88)';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(px - boxW * 0.5, py - boxH * 0.5, boxW, boxH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff7df';
      ctx.fillText(label, px, py + 0.5);
    };

    const render = () => {
      ctx.fillStyle = '#4097a8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      if (loadedCount === 0) return;

      ctx.save();
      ctx.translate(Math.round(canvas.width * 0.5), Math.round(canvas.height * 0.5));
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

      const frame16 = Math.floor(globalTime * 8) % 16;
      const frame8 = Math.floor(globalTime * 8) % 8;

      // 1. Water
      const waterImg = images.waterBg;
      for (const cell of WORLD_LAYERS.Water || []) {
        drawTileCell(waterImg, cell, 64, 64);
      }

      // 2. FoamandRock (Water Foam 192x192 animated 16 frames)
      const foamImg = images.waterFoam;
      for (const cell of WORLD_LAYERS.FoamandRock || []) {
        drawTileCell(foamImg, cell, 192, 192, 0, 0, frame16);
      }

      // 3. RockinWater (sources 0..3 -> waterRock1..4)
      const rockImgs = [images.waterRock1, images.waterRock2, images.waterRock3, images.waterRock4];
      for (const cell of WORLD_LAYERS.RockinWater || []) {
        drawTileCell(rockImgs[cell[2]], cell, 64, 64, 0, 0, frame16);
      }

      // 4. Ground
      const groundImg = images.ground;
      for (const cell of WORLD_LAYERS.Ground || []) {
        drawTileCell(groundImg, cell, 64, 64);
      }

      // 5. Shadow
      const shadowImg = images.shadow;
      for (const cell of WORLD_LAYERS.Shadow || []) {
        drawTileCell(shadowImg, cell, 192, 192);
      }

      // 6. Bridge (drawn below entities so characters walk across it)
      const bridgeImg = images.bridge;
      for (const cell of WORLD_LAYERS.Bridge || []) {
        drawTileCell(bridgeImg, cell, 64, 64);
      }

      // 7. Y-Sorted layer: HighGround + Props + Collectible Papers + Island NPCs + Player + Companions + Gates
      type Drawable = { sortY: number; draw: () => void };
      const ySorted: Drawable[] = [];

      const highGroundImg = images.highGround;
      for (const cell of WORLD_LAYERS.HighGround || []) {
        const [, cy] = cell;
        ySorted.push({
          sortY: cy * TILE_SIZE + TILE_SIZE * 0.5,
          draw: () => drawTileCell(highGroundImg, cell, 64, 64),
        });
      }

      const propConfig: Record<
        number,
        { img: HTMLImageElement | undefined; w: number; h: number; oy: number; ySortOff: number; animated: boolean }
      > = {
        0: { img: images.tree1, w: 192, h: 256, oy: -90, ySortOff: 15, animated: true },
        1: { img: images.tree2, w: 192, h: 256, oy: -90, ySortOff: 15, animated: true },
        2: { img: images.tree3, w: 192, h: 192, oy: -60, ySortOff: 10, animated: true },
        3: { img: images.tree4, w: 192, h: 192, oy: -60, ySortOff: 10, animated: true },
        4: { img: images.bush1, w: 128, h: 128, oy: 0, ySortOff: 2, animated: true },
        5: { img: images.bush2, w: 128, h: 128, oy: 0, ySortOff: 1, animated: true },
        6: { img: images.bush3, w: 128, h: 128, oy: 0, ySortOff: 2, animated: true },
        7: { img: images.bush4, w: 128, h: 128, oy: 0, ySortOff: 2, animated: true },
      };

      for (const cell of WORLD_LAYERS.Props || []) {
        const [, cy, src] = cell;
        const cfg = propConfig[src];
        if (!cfg) continue;
        const sortY = cy * TILE_SIZE + TILE_SIZE * 0.5 + cfg.ySortOff;
        ySorted.push({
          sortY,
          draw: () =>
            drawTileCell(
              cfg.img,
              cell,
              cfg.w,
              cfg.h,
              0,
              cfg.oy,
              cfg.animated ? frame8 : 0
            ),
        });
      }

      // Collectible 3 Papers on Right Island
      const paperImg = images.paperItem;
      WORLD_PAPERS.forEach((paper, idx) => {
        if (collectedPaperIdsRef.current.includes(paper.id)) return;
        const bob = Math.sin(globalTime * 3.4 + idx * 1.4) * 2.2;
        ySorted.push({
          sortY: paper.y,
          draw: () => {
            // Soft golden shimmer halo
            ctx.fillStyle = 'rgba(243, 207, 122, 0.25)';
            ctx.beginPath();
            ctx.ellipse(paper.x, paper.y - 4, 11, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
            ctx.beginPath();
            ctx.ellipse(paper.x, paper.y - 1, 7, 3.2, 0, 0, Math.PI * 2);
            ctx.fill();

            if (paperImg && paperImg.complete && paperImg.naturalWidth > 0) {
              const drawW = 18;
              const drawH = 22;
              ctx.drawImage(
                paperImg,
                Math.round(paper.x - drawW * 0.5),
                Math.round(paper.y - 23 + bob),
                drawW,
                drawH
              );
            } else {
              ctx.fillStyle = '#f3e6c4';
              ctx.strokeStyle = '#6b4d2e';
              ctx.lineWidth = 1.2;
              ctx.fillRect(paper.x - 6, paper.y - 20 + bob, 12, 16);
              ctx.strokeRect(paper.x - 6, paper.y - 20 + bob, 12, 16);
            }
          },
        });
      });

      // 3 New Island NPCs
      ISLAND_NPCS.forEach((npc, idx) => {
        const sprite = tintedNpcSheets[npc.id] ?? images[npc.spriteKey];
        const talked = talkedNpcIdsRef.current.includes(npc.id);
        const markerBob = talked ? 0 : Math.sin(globalTime * 4 + idx) * 1.5;

        ySorted.push({
          sortY: npc.y,
          draw: () => {
            drawCharacter(
              npc.x,
              npc.y,
              sprite,
              npc.facing,
              false,
              globalTime + idx * 0.6
            );

            // Quest status badge (! / ✓) above NPC head
            const bx = Math.round(npc.x);
            const by = Math.round(npc.y - 44 + markerBob);
            ctx.fillStyle = talked ? '#194b40' : '#2a1d17';
            ctx.strokeStyle = talked ? '#34d399' : '#f3cf7a';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(bx - 6, by - 6, 12, 12, 3);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = talked ? '#6ee7b7' : '#f3cf7a';
            ctx.fillText(talked ? '✓' : '!', bx, by + 0.5);
          },
        });
      });

      // Player
      ySorted.push({
        sortY: player.y,
        draw: () =>
          drawCharacter(
            player.x,
            player.y,
            player.isMoving ? images.playerRun : images.playerIdle,
            player.facing,
            player.isMoving,
            player.animTime
          ),
      });

      // Companions
      for (const npc of companions) {
        const isMoving = npc.currentAnim.startsWith('run_');
        ySorted.push({
          sortY: npc.y,
          draw: () =>
            drawCharacter(
              npc.x,
              npc.y,
              isMoving ? images[npc.runImgKey] : images[npc.idleImgKey],
              npc.dirSuffix,
              isMoving,
              npc.animTime
            ),
        });
      }

      // Bridge 1 Gate Barrier (western bridge entrance)
      ySorted.push({
        sortY: 126,
        draw: () => {
          ctx.fillStyle = '#3d2314';
          ctx.fillRect(353, 62, 10, 12);
          ctx.fillRect(353, 118, 10, 12);
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(355, 64, 6, 8);
          ctx.fillRect(355, 120, 6, 8);

          if (!bridgeUnlockedRef.current) {
            ctx.fillStyle = '#3d2314';
            ctx.fillRect(355, 72, 6, 48);
            ctx.fillStyle = '#c88a4b';
            ctx.fillRect(356, 74, 4, 44);

            ctx.fillStyle = '#3d2314';
            ctx.fillRect(352, 89, 12, 12);
            ctx.fillStyle = '#f3cf7a';
            ctx.fillRect(354, 92, 8, 7);
            ctx.strokeStyle = '#f3cf7a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(355.5, 87.5, 5, 5);
          }
        },
      });

      // Bridge 2 Gate Barrier (northern entrance of vertical bridge on right island)
      ySorted.push({
        sortY: 226,
        draw: () => {
          // Left and right gate posts at bridge mouth (x=896..960, y=214)
          ctx.fillStyle = '#3d2314';
          ctx.fillRect(896, 208, 10, 14);
          ctx.fillRect(950, 208, 10, 14);
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(898, 210, 6, 10);
          ctx.fillRect(952, 210, 6, 10);

          if (!bridge2UnlockedRef.current) {
            ctx.fillStyle = '#3d2314';
            ctx.fillRect(904, 214, 48, 7);
            ctx.fillStyle = '#c88a4b';
            ctx.fillRect(905, 215, 46, 5);

            // Padlock emblem
            ctx.fillStyle = '#3d2314';
            ctx.fillRect(922, 212, 12, 12);
            ctx.fillStyle = '#f3cf7a';
            ctx.fillRect(924, 215, 8, 7);
            ctx.strokeStyle = '#f3cf7a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(925.5, 210.5, 5, 5);
          }
        },
      });

      ySorted.sort((a, b) => a.sortY - b.sortY);
      for (const item of ySorted) {
        item.draw();
      }

      // 8. Floating [E] prompts for active interactables
      const activeTarget = getActiveInteractTarget();
      if (activeTarget) {
        if (activeTarget.kind === 'gate1') {
          drawPromptTag(BRIDGE_GATE_POS.x, 50, '[E] Buka Jembatan');
        } else if (activeTarget.kind === 'gate2') {
          drawPromptTag(BRIDGE_2_GATE_POS.x, 194, '[E] Periksa Jembatan 2');
        } else if (activeTarget.kind === 'paper') {
          drawPromptTag(
            activeTarget.paper.x,
            activeTarget.paper.y - 34,
            `[E] Ambil ${activeTarget.paper.title}`,
            '#34d399'
          );
        } else if (activeTarget.kind === 'islandNpc') {
          drawPromptTag(
            Math.round(activeTarget.npc.x),
            Math.round(activeTarget.npc.y - 60),
            `[E] Bicara · ${activeTarget.npc.name}`,
            '#f3cf7a'
          );
        } else if (activeTarget.kind === 'companion') {
          const comp = activeTarget.companion;
          drawPromptTag(
            Math.round(comp.x),
            Math.round(comp.y - 50),
            comp.state === 'IDLE_WAIT' ? '[E] Ajak' : '[E] Tunggu',
            '#e7c677'
          );
        }
      }

      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      update(dt);
      render();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('click', handleClick);
    };
  }, [commandRef]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-default"
      aria-label="gametika 2D Island World"
    />
  );
};
