// jest.config.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { defaults } from 'jest-config';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 回溯到项目根目录
const projectRoot = join(__dirname, '../../');
export default {
  ...defaults,
  // 添加或覆盖自定义配置
  moduleDirectories: [...defaults.moduleDirectories, 'dist/node_modules'],
  rootDir: projectRoot,
  modulePathIgnorePatterns: ['<rootDir>/.history'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^scheduler$': '<rootDir>/node_modules/scheduler/unstable_mock.js'
  },
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: true
  },
  setupFilesAfterEnv: ['./scripts/jest/setupJest.js'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest'
  }
};
