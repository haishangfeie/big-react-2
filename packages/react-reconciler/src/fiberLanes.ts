import {
  unstable_getCurrentPriorityLevel,
  unstable_IdlePriority,
  unstable_ImmediatePriority,
  unstable_NormalPriority,
  unstable_UserBlockingPriority
} from 'scheduler';
import { FiberRootNode } from './fiber';
import internals from 'shared/internals';

export type Lane = number;
export type Lanes = number;

// 不是0的情况下，数值越低，优先级越高
export const SyncLane = 0b00001;
export const NoLane = 0b00000;
export const NoLanes = 0b00000;
export const InputContinuousLane = 0b00010;
export const DefaultLane = 0b00100;
export const TransitionLane = 0b01000;
export const IdleLane = 0b10000;

export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
  return laneA | laneB;
}

export function requestUpdateLane() {
  const isTransition = internals.currentBatchConfig.transition !== null;

  if (isTransition) {
    return TransitionLane;
  }
  const priority = unstable_getCurrentPriorityLevel();
  const lane = schedulerPriorityToLane(priority);
  return lane;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
  // root.pendingLanes = root.pendingLanes & ~lane;
  root.pendingLanes &= ~lane;
  root.pingedLanes = NoLanes;
  root.suspenseLanes = NoLanes;
}

export function laneToSchedulerPriority(lane: Lane) {
  if (lane === SyncLane) {
    return unstable_ImmediatePriority;
  }
  if (lane === InputContinuousLane) {
    return unstable_UserBlockingPriority;
  }
  if (lane === DefaultLane) {
    return unstable_NormalPriority;
  }
  if (lane === TransitionLane) {
    return unstable_NormalPriority;
  }
  return unstable_IdlePriority;
}

export function schedulerPriorityToLane(schedulerPriority: number) {
  if (schedulerPriority === unstable_ImmediatePriority) {
    return SyncLane;
  }
  if (schedulerPriority === unstable_UserBlockingPriority) {
    return InputContinuousLane;
  }
  if (schedulerPriority === unstable_NormalPriority) {
    return DefaultLane;
  }
  return NoLane;
}

export function isSubsetOfLanes(set: Lanes, subset: Lane) {
  return (set & subset) === subset;
}

export function markRootPinged(root: FiberRootNode, pingedLane: Lane) {
  root.pingedLanes |= root.suspenseLanes & pingedLane;
}

export function markRootSuspended(root: FiberRootNode, suspendedLane: Lane) {
  root.suspenseLanes |= suspendedLane;
  root.pendingLanes &= ~suspendedLane;
}

export function getNextLane(root: FiberRootNode): Lane {
  const notSuspended = root.pendingLanes & ~root.suspenseLanes;
  const pingedLane = root.pendingLanes & root.pingedLanes;

  if (notSuspended !== NoLanes) {
    return getHighestPriorityLane(notSuspended);
  } else if (pingedLane !== NoLanes) {
    return getHighestPriorityLane(pingedLane);
  } else {
    return NoLane;
  }
}
