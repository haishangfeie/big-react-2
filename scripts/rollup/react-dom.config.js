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
  {
    input: resolvePath(pkgPath, pkg.module),
    output: [
      // react17
      {
        file: resolvePath(outputPath, 'index.js'),
        name: 'react-dom',
        format: 'umd'
      },
      // react18
      {
        file: resolvePath(outputPath, 'client.js'),
        name: 'react-dom',
        format: 'umd'
      }
    ],
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
  }
];
