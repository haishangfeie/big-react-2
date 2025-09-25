export type Flags = number;

export const NoFlags = /*      */ 0b0000000;
export const Placement = /*    */ 0b0000001;
export const Update = /*       */ 0b0000010;
export const ChildDeletion = /**/ 0b0000100;
export const PassiveEffect = /**/ 0b0001000;

export const MutationMask = Placement | Update | ChildDeletion;

// 该掩码用于统一处理副作用和子节点清理逻辑
// PassiveEffectMask = PassiveEffect | ChildDeletion 是为了确保：
// 当前节点有 useEffect → 执行自己的 destroy 和 create
// 子节点要被删除 → 向下遍历执行子树中的 destroy
export const PassiveMask = PassiveEffect | ChildDeletion;
