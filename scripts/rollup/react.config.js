import {
  resolvePkgPath,
  getPkgJson,
  resolvePath,
  getBaseRollupPlugins
} from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const pkgPath = resolvePkgPath('react');
const pkg = getPkgJson('react');
const outputPath = resolvePkgPath('react', true);

export default [
  {
    input: resolvePath(pkgPath, pkg.module),
    output: {
      file: resolvePath(outputPath, 'index.js'),
      name: 'react',
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
        name: 'jsx',
        format: 'umd'
      },
      {
        file: resolvePath(outputPath, 'jsx-dev-runtime.js'),
        name: 'jsx',
        format: 'umd'
      }
    ],
    plugins: getBaseRollupPlugins()
  }
];
