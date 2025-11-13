declare module 'react-noop-renderer' {
  import type { ReactElement } from 'react';

  export function createRoot(): {
    render(element: ReactElement): void;
    getChildrenAsJSX(): unknown;
  };

  export function getChildrenAsJSX(): unknown;
}
