import { FiberNode } from 'react-reconciler/src/fiber';
import { REACT_MEMO_TYPE } from 'shared/ReactSymbols';
import { Props } from 'shared/ReactTypes';
export function memo(
  type: FiberNode['type'],
  compare?: (oldProps: Props, newProps: Props) => boolean
) {
  return {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === void 0 ? null : compare
  };
}
