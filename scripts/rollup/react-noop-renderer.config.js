import {
  resolvePkgPath,
  getPkgJson,
  resolvePath,
  getBaseRollupPlugins
} from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const pkg = getPkgJson('react-noop-renderer');
const pkgPath = resolvePkgPath(pkg.name);
const outputPath = resolvePkgPath(pkg.name, true);

export default [
  // react-noop-renderer
  {
    input: resolvePath(pkgPath, pkg.module),
    output: [
      {
        file: resolvePath(outputPath, 'index.js'),
        name: 'ReactNoopRenderer',
        format: 'umd'
      }
    ],
    // scheduler 对react-noop-renderer 以及 react-dom 等包来说都是外部包
    external: [...Object.keys(pkg.peerDependencies), 'scheduler'],
    plugins: [
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`
        }
      }),
      ...getBaseRollupPlugins({
        typescriptOpt: {
          compilerOptions: {
            paths: {
              hostConfig: ['./react-noop-renderer/src/hostConfig.ts']
            }
          }
        }
      }),
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
            react: version,
            scheduler: '0.23.0'
          },
          license
        })
      })
    ]
  }
];
