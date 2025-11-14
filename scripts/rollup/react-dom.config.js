import {
  resolvePkgPath,
  getPkgJson,
  resolvePath,
  getBaseRollupPlugins
} from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const pkg = getPkgJson('react-dom');
const pkgPath = resolvePkgPath(pkg.name);
const outputPath = resolvePkgPath(pkg.name, true);

/*
react-dom 的传统入口（React 17 及之前）是 react-dom/index.js，通常暴露为 ReactDOM。

React 18 引入了新的入口 react-dom/client.js，主要提供 createRoot 等 API。
 */
export default [
  // react-dom
  {
    input: resolvePath(pkgPath, pkg.module),
    output: [
      // react17 使用的入口
      {
        file: resolvePath(outputPath, 'index.js'),
        name: 'ReactDOM',
        format: 'umd',
        globals: {
          react: 'React'
        }
      },
      // react18 采用的入口
      {
        file: resolvePath(outputPath, 'client.js'),
        name: 'ReactDOM',
        format: 'umd',
        globals: {
          react: 'React'
        }
      }
    ],
    external: [...Object.keys(pkg.peerDependencies)],
    plugins: [
      alias({
        entries: [
          { find: 'hostConfig', replacement: `${pkgPath}/src/hostConfig.ts` }
        ]
      }),
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        baseContents: ({ name, version, description, author, license }) => ({
          name,
          version,
          description,
          main: 'index.js',
          author,
          peerDependencies: {
            // react版本要和react-dom版本一致
            react: version
          },
          license
        })
      })
    ]
  },
  // react-test-utils
  {
    input: resolvePath(pkgPath, 'test-utils.ts'),
    output: [
      {
        file: resolvePath(outputPath, 'test-utils.js'),
        name: 'testUtils',
        format: 'umd'
      }
    ],
    external: ['react', 'react-dom', 'scheduler'],
    plugins: getBaseRollupPlugins()
  }
];
