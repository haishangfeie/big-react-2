import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolvePath, resolvePkgPath } from '../rollup/utils';
import replace from '@rollup/plugin-replace';

const reactDomPkgPath = resolvePkgPath('react-dom');
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    replace({
      __DEV__: true,
      preventAssignment: true
    })
  ],
  resolve: {
    alias: {
      react: resolvePkgPath('react'),
      'react-dom': reactDomPkgPath,
      hostConfig: resolvePath(reactDomPkgPath, 'src/hostConfig.ts')
    }
  }
});
