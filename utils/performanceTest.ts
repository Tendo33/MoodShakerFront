/**
 * 性能测试工具 - 验证localStorage异步优化效果
 * 对比优化前后的性能差异
 */

import { asyncStorage } from './asyncStorage';
import { appLogger } from './logger';

interface PerformanceTestResult {
  testName: string;
  oldTime: number;
  newTime: number;
  improvement: number;
  improvementPercentage: number;
}

/**
 * 测试localStorage同步vs异步性能
 */
export async function testStoragePerformance(): Promise<PerformanceTestResult[]> {
  const results: PerformanceTestResult[] = [];
  
  // 测试数据
  const testData = {
    answers: { q1: 'classic', q2: 'medium', q3: 'beginner' },
    feedback: '我想要一个清爽的鸡尾酒',
    baseSpirits: ['gin', 'vodka', 'rum'],
    language: 'cn'
  };

  // 测试1: 单个读取操作
  const singleReadResult = await testSingleRead(testData);
  results.push(singleReadResult);

  // 测试2: 批量读取操作
  const batchReadResult = await testBatchRead(testData);
  results.push(batchReadResult);

  // 测试3: 写入操作
  const writeResult = await testWrite(testData);
  results.push(writeResult);

  // 测试4: 混合操作
  const mixedResult = await testMixedOperations(testData);
  results.push(mixedResult);

  return results;
}

async function testSingleRead(testData: any): Promise<PerformanceTestResult> {
  // 先写入测试数据
  localStorage.setItem('test-answers', JSON.stringify(testData.answers));
  await asyncStorage.setItem('test-answers-async', testData.answers);

  // 测试同步读取
  const syncStart = performance.now();
  for (let i = 0; i < 100; i++) {
    const data = localStorage.getItem('test-answers');
    if (data) JSON.parse(data);
  }
  const syncTime = performance.now() - syncStart;

  // 测试异步读取
  const asyncStart = performance.now();
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(asyncStorage.getItem('test-answers-async'));
  }
  await Promise.all(promises);
  const asyncTime = performance.now() - asyncStart;

  const improvement = syncTime - asyncTime;
  const improvementPercentage = (improvement / syncTime) * 100;

  return {
    testName: '单个读取操作 (100次)',
    oldTime: syncTime,
    newTime: asyncTime,
    improvement,
    improvementPercentage
  };
}

async function testBatchRead(testData: any): Promise<PerformanceTestResult> {
  // 准备测试数据
  const keys = ['answers', 'feedback', 'baseSpirits', 'language'];
  keys.forEach(key => {
    localStorage.setItem(`test-${key}`, JSON.stringify(testData[key] || key));
  });

  // 测试同步批量读取
  const syncStart = performance.now();
  for (let i = 0; i < 50; i++) {
    keys.forEach(key => {
      const data = localStorage.getItem(`test-${key}`);
      if (data) JSON.parse(data);
    });
  }
  const syncTime = performance.now() - syncStart;

  // 测试异步批量读取
  const asyncStart = performance.now();
  const operations = keys.map(key => ({
    type: 'get' as const,
    key: `test-${key}`
  }));
  
  for (let i = 0; i < 50; i++) {
    await asyncStorage.batchOperations(operations);
  }
  const asyncTime = performance.now() - asyncStart;

  const improvement = syncTime - asyncTime;
  const improvementPercentage = (improvement / syncTime) * 100;

  return {
    testName: '批量读取操作 (50次x4项)',
    oldTime: syncTime,
    newTime: asyncTime,
    improvement,
    improvementPercentage
  };
}

async function testWrite(testData: any): Promise<PerformanceTestResult> {
  // 测试同步写入
  const syncStart = performance.now();
  for (let i = 0; i < 100; i++) {
    localStorage.setItem(`test-write-sync-${i}`, JSON.stringify(testData.answers));
  }
  const syncTime = performance.now() - syncStart;

  // 测试异步写入
  const asyncStart = performance.now();
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(asyncStorage.setItem(`test-write-async-${i}`, testData.answers));
  }
  await Promise.all(promises);
  const asyncTime = performance.now() - asyncStart;

  const improvement = syncTime - asyncTime;
  const improvementPercentage = (improvement / syncTime) * 100;

  return {
    testName: '写入操作 (100次)',
    oldTime: syncTime,
    newTime: asyncTime,
    improvement,
    improvementPercentage
  };
}

async function testMixedOperations(testData: any): Promise<PerformanceTestResult> {
  // 测试同步混合操作
  const syncStart = performance.now();
  for (let i = 0; i < 50; i++) {
    // 写入
    localStorage.setItem(`test-mixed-${i}`, JSON.stringify(testData));
    // 读取
    const data = localStorage.getItem(`test-mixed-${i}`);
    if (data) JSON.parse(data);
    // 删除
    localStorage.removeItem(`test-mixed-${i}`);
  }
  const syncTime = performance.now() - syncStart;

  // 测试异步混合操作
  const asyncStart = performance.now();
  for (let i = 0; i < 50; i++) {
    await asyncStorage.setItem(`test-mixed-async-${i}`, testData);
    await asyncStorage.getItem(`test-mixed-async-${i}`);
    await asyncStorage.removeItem(`test-mixed-async-${i}`);
  }
  const asyncTime = performance.now() - asyncStart;

  const improvement = syncTime - asyncTime;
  const improvementPercentage = (improvement / syncTime) * 100;

  return {
    testName: '混合操作 (50次写入+读取+删除)',
    oldTime: syncTime,
    newTime: asyncTime,
    improvement,
    improvementPercentage
  };
}

/**
 * 运行性能测试并输出结果
 */
export async function runPerformanceTest(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  appLogger.info('开始localStorage性能测试...');
  
  try {
    const results = await testStoragePerformance();
    
    console.group('📊 localStorage性能测试结果');
    
    results.forEach(result => {
      const emoji = result.improvementPercentage > 0 ? '🟢' : '🔴';
      console.log(`${emoji} ${result.testName}`);
      console.log(`   同步耗时: ${result.oldTime.toFixed(2)}ms`);
      console.log(`   异步耗时: ${result.newTime.toFixed(2)}ms`);
      console.log(`   性能提升: ${result.improvement.toFixed(2)}ms (${result.improvementPercentage.toFixed(1)}%)`);
      console.log('');
    });

    const averageImprovement = results.reduce((sum, r) => sum + r.improvementPercentage, 0) / results.length;
    console.log(`🚀 平均性能提升: ${averageImprovement.toFixed(1)}%`);
    
    console.groupEnd();
  } catch (error) {
    appLogger.error('性能测试失败:', error);
  }
}

// 清理测试数据
export function cleanupTestData(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('test-')) {
      localStorage.removeItem(key);
    }
  });
}
