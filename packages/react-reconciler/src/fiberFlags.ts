export type Flags = number;

export const NoFlags = /*          */ 0b00000000;
export const Placement = /*        */ 0b00000001;
export const Update = /*           */ 0b00000010;
export const ChildDeletion = /*    */ 0b00000100;
export const PassiveEffect = /*    */ 0b00001000;
export const Ref = /*              */ 0b00010000;
export const Visibility = /*       */ 0b00100000;
// 捕获到 something
export const DidCapture = /*       */ 0b01000000;
// unwind应该捕获、还未捕获到
export const ShouldCapture = /*     */ 0b10000000;

export const MutationMask =
  Placement | Update | ChildDeletion | Ref | Visibility;
export const layoutMask = Ref;

// 该掩码用于统一处理副作用和子节点清理逻辑
// PassiveEffectMask = PassiveEffect | ChildDeletion 是为了确保：
// 当前节点有 useEffect → 执行自己的 destroy 和 create
// 子节点要被删除 → 向下遍历执行子树中的 destroy
export const PassiveMask = PassiveEffect | ChildDeletion;
