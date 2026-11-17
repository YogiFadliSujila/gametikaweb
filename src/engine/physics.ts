import {
  BRIDGE_AREAS,
  BRIDGE_POLYGONS,
  GROUND_POLYGONS,
  HIGHGROUND_POLYGONS,
  PROPS_POLYGONS,
  Polygon2D,
  TILE_SIZE,
  WORLD_LAYERS,
} from '../data/worldMapData';

export interface WorldColliders {
  layer1Polygons: Polygon2D[]; // Wall_Water (Ground edges, HighGround edges, Tree trunks)
  layer5Polygons: Polygon2D[]; // Bridge_Railing
}

function buildLayerPolygons(
  cells: [number, number, number, number, number, number][],
  polyMap: Record<string, Polygon2D[]>
): Polygon2D[] {
  const result: Polygon2D[] = [];
  for (const [cx, cy, src, ax, ay] of cells) {
    const key = `${src}:${ax}:${ay}`;
    const polys = polyMap[key];
    if (!polys) continue;
    const centerX = cx * TILE_SIZE + TILE_SIZE * 0.5;
    const centerY = cy * TILE_SIZE + TILE_SIZE * 0.5;
    for (const poly of polys) {
      result.push(poly.map(([px, py]) => [centerX + px, centerY + py]));
    }
  }
  return result;
}

// Pier end-cap and side guardrails at tile (14, 5) so unlocked players stay on the wooden pier
const BRIDGE_2_PIER_GUARD_POLYGONS: Polygon2D[] = [
  [
    [896, 320],
    [900, 320],
    [900, 384],
    [896, 384],
  ],
  [
    [956, 320],
    [960, 320],
    [960, 384],
    [956, 384],
  ],
  [
    [896, 366],
    [960, 366],
    [960, 390],
    [896, 390],
  ],
];

export function buildWorldColliders(): WorldColliders {
  const ground = buildLayerPolygons(WORLD_LAYERS.Ground || [], GROUND_POLYGONS);
  const highGround = buildLayerPolygons(WORLD_LAYERS.HighGround || [], HIGHGROUND_POLYGONS);
  const props = buildLayerPolygons(WORLD_LAYERS.Props || [], PROPS_POLYGONS);
  const bridge = buildLayerPolygons(WORLD_LAYERS.Bridge || [], BRIDGE_POLYGONS);

  return {
    layer1Polygons: [...ground, ...highGround, ...props],
    layer5Polygons: [...bridge, ...BRIDGE_2_PIER_GUARD_POLYGONS],
  };
}

export function isInsideBridgeArea(x: number, y: number): boolean {
  for (const rect of BRIDGE_AREAS) {
    if (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    ) {
      return true;
    }
  }
  return false;
}

function pointInPolygon(px: number, py: number, poly: Polygon2D): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function closestPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): [number, number] {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1e-8) return [ax, ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  return [ax + t * abx, ay + t * aby];
}

function resolveCircleVsPolygon(
  cx: number,
  cy: number,
  r: number,
  poly: Polygon2D
): [number, number] | null {
  let minDistSq = Infinity;
  let nearestX = cx;
  let nearestY = cy;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const [qx, qy] = closestPointOnSegment(cx, cy, ax, ay, bx, by);
    const dx = cx - qx;
    const dy = cy - qy;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearestX = qx;
      nearestY = qy;
    }
  }

  const inside = pointInPolygon(cx, cy, poly);
  const dist = Math.sqrt(minDistSq);

  if (inside) {
    if (dist < 1e-5) {
      return [0, -r];
    }
    const nx = (nearestX - cx) / dist;
    const ny = (nearestY - cy) / dist;
    return [nx * (dist + r), ny * (dist + r)];
  }

  if (dist < r) {
    if (dist < 1e-5) {
      return [0, -r];
    }
    const push = r - dist;
    const nx = (cx - nearestX) / dist;
    const ny = (cy - nearestY) / dist;
    return [nx * push, ny * push];
  }

  return null;
}

export const BRIDGE_GATE_POLYGON: Polygon2D = [
  [352, 58],
  [374, 58],
  [374, 134],
  [352, 134],
];

export const BRIDGE_2_GATE_POLYGON: Polygon2D = [
  [896, 208],
  [960, 208],
  [960, 232],
  [896, 232],
];

export function testMoveCollision(
  targetX: number,
  targetY: number,
  radius: number,
  colliders: WorldColliders,
  bridgeUnlocked = true,
  bridge2Unlocked = true
): boolean {
  const onBridge = isInsideBridgeArea(targetX, targetY);
  const activePolys = onBridge
    ? [...colliders.layer5Polygons]
    : [...colliders.layer1Polygons, ...colliders.layer5Polygons];
  if (!bridgeUnlocked) {
    activePolys.push(BRIDGE_GATE_POLYGON);
  }
  if (!bridge2Unlocked) {
    activePolys.push(BRIDGE_2_GATE_POLYGON);
  }
  const cy = targetY - 6;
  for (const poly of activePolys) {
    if (resolveCircleVsPolygon(targetX, cy, radius, poly)) {
      return true;
    }
  }
  return false;
}

export function moveAndSlide(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
  radius: number,
  colliders: WorldColliders,
  bridgeUnlocked = true,
  bridge2Unlocked = true
): { x: number; y: number; realVx: number; realVy: number } {
  const startX = x;
  const startY = y;
  let nx = x + vx * dt;
  let ny = y + vy * dt;

  const onBridge = isInsideBridgeArea(nx, ny);
  const activePolys = onBridge
    ? [...colliders.layer5Polygons]
    : [...colliders.layer1Polygons, ...colliders.layer5Polygons];
  if (!bridgeUnlocked) {
    activePolys.push(BRIDGE_GATE_POLYGON);
  }
  if (!bridge2Unlocked) {
    activePolys.push(BRIDGE_2_GATE_POLYGON);
  }

  // Iterative SAT resolution for smooth sliding along corners
  for (let iter = 0; iter < 3; iter++) {
    const cy = ny - 6;
    let moved = false;
    for (const poly of activePolys) {
      const push = resolveCircleVsPolygon(nx, cy, radius, poly);
      if (push) {
        nx += push[0];
        ny += push[1];
        moved = true;
      }
    }
    if (!moved) break;
  }

  const realVx = dt > 0 ? (nx - startX) / dt : 0;
  const realVy = dt > 0 ? (ny - startY) / dt : 0;
  return { x: nx, y: ny, realVx, realVy };
}
