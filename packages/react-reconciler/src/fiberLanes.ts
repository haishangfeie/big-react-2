export type Lane = number;
export type Lanes = number;

export const SyncLane: Lane = 0b0001;
export const NoLane: Lane = 0b0000;
export const NoLanes: Lanes = 0b0000;

export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
  return laneA | laneB;
}

export function requestUpdateLane() {
  return SyncLane;
}
