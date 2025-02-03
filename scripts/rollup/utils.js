import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

// 解析包路径，这里的包指的分别是packages文件夹下的模块的路径和构建输出包路径
export const resolvePkgPath = (pkgName, isDist = false) => {
  const relativePath = isDist
    ? `../../dist/node_modules/${pkgName}/`
    : `../../packages/${pkgName}/`;
  return fileURLToPath(new URL(relativePath, import.meta.url));
};

// 这里是读取packages里的模块对应的package.json文件
export const getPkgJson = (pkgName) => {
  console.log(
    `resolvePath(resolvePkgPath(pkgName), 'package.json')`,
    resolvePath(resolvePkgPath(pkgName), 'package.json'),
    pkgName
  );
  const text = readFileSync(
    resolvePath(resolvePkgPath(pkgName), 'package.json'),
    'utf-8'
  );
  return JSON.parse(text);
};

export const resolvePath = (...paths) => {
  return path.resolve(...paths);
};

export const getBaseRollupPlugins = ({ typescriptOpt = {} } = {}) => {
  return [typescript(typescriptOpt), commonjs()];
};
