import {
  resolvePkgPath,
  getPkgJson,
  resolvePath,
  getBaseRollupPlugins
} from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const pkg = getPkgJson('react');
const pkgPath = resolvePkgPath(pkg.name);
const outputPath = resolvePkgPath(pkg.name, true);

export default [
  {
    input: resolvePath(pkgPath, pkg.module),
    output: {
      file: resolvePath(outputPath, 'index.js'),
      name: 'React',
      format: 'umd'
    },
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        baseContents: ({ name, version, description, author, license }) => ({
          name,
          version,
          description,
          main: 'index.js',
          author,
          license
        })
      })
    ]
  },
  {
    input: resolvePath(pkgPath, './src/jsx.ts'),
    output: [
      {
        file: resolvePath(outputPath, 'jsx-runtime.js'),
        name: 'jsx-runtime',
        format: 'umd'
      },
      {
        file: resolvePath(outputPath, 'jsx-dev-runtime.js'),
        name: 'jsx-dev-runtime',
        format: 'umd'
      }
    ],
    plugins: getBaseRollupPlugins()
  }
];
