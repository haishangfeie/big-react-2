import { ReactContext } from 'shared/ReactTypes';

let prevContextValue: unknown;
const contextValueStack: unknown[] = [];
export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
  prevContextValue = context._currentValue;
  contextValueStack.push(prevContextValue);
  context._currentValue = newValue;
}

export function popProvider<T>(context: ReactContext<T>) {
  prevContextValue = contextValueStack.pop();
  context._currentValue = prevContextValue as T;
}
