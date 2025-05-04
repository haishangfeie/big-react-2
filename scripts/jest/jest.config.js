// jest.config.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 回溯到项目根目录
const projectRoot = join(__dirname, '../../');

export default {
  // 添加或覆盖自定义配置
  moduleDirectories: [
    'dist/node_modules', // 添加自定义的目录
    'node_modules'
  ],
  rootDir: projectRoot,
  modulePathIgnorePatterns: ['<rootDir>/.history'],
  testEnvironment: 'jsdom'
};
