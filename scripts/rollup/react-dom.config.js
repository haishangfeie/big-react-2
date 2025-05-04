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

export default [
  // react-dom
  {
    input: resolvePath(pkgPath, pkg.module),
    output: [
      // react17
      {
        file: resolvePath(outputPath, 'index.js'),
        name: 'reactDOM',
        format: 'umd'
      },
      // react18
      {
        file: resolvePath(outputPath, 'client.js'),
        name: 'client',
        format: 'umd'
      }
    ],
    external: [...Object.keys(pkg.peerDependencies)],
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        baseContents: ({
          name,
          version,
          description,
          author,
          license,
          dependencies
        }) => ({
          name,
          version,
          description,
          main: 'index.js',
          author,
          dependencies,
          peerDependencies: {
            // react版本要和react-dom版本一致
            react: version
          },
          license
        })
      }),
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`
        }
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
    external: ['react', 'react-dom'],
    plugins: getBaseRollupPlugins()
  }
];
