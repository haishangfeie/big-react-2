import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkType } from './workTags';
import { NoFlags, Flags } from './fiberFlags';

export class FiberNode {
  tag: WorkType;
  key: Key;
  stateNode: any;
  type: any;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  ref: Ref;

  pendingProps: Props;
  memoizedProps: Props;
  alternate: FiberNode | null;
  flags: Flags;

  constructor(tag: WorkType, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key;
    this.stateNode = null;
    this.type = null;

    // 构成树状结构
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    this.ref = null;

    // 作为数据单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.alternate = null;
    this.flags = NoFlags;
  }
}
