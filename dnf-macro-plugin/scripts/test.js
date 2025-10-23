#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class DNFMacroTester {
    constructor() {
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }

    async runTests() {
        console.log('🧪 DNF宏插件测试套件');
        console.log('======================');
        console.log('');

        try {
            // 基础功能测试
            await this.testBasicFunctionality();
            
            // 模块加载测试
            await this.testModuleLoading();
            
            // 文件系统测试
            await this.testFileSystem();
            
            // 配置测试
            await this.testConfiguration();
            
            // 性能测试
            await this.testPerformance();
            
            // 显示测试结果
            this.showResults();
            
        } catch (error) {
            console.error('❌ 测试运行失败:', error.message);
            process.exit(1);
        }
    }

    async testBasicFunctionality() {
        console.log('📋 基础功能测试...');
        
        // 测试package.json
        this.test('package.json存在', () => {
            return fs.existsSync(path.join(process.cwd(), 'package.json'));
        });
        
        // 测试主入口文件
        this.test('主入口文件存在', () => {
            return fs.existsSync(path.join(process.cwd(), 'src/main.js'));
        });
        
        // 测试UI文件
        this.test('UI文件存在', () => {
            return fs.existsSync(path.join(process.cwd(), 'ui/index.html'));
        });
        
        console.log('');
    }

    async testModuleLoading() {
        console.log('📦 模块加载测试...');
        
        // 测试核心模块
        this.test('MacroRecorder模块', () => {
            try {
                const MacroRecorder = require('../src/macro-recorder');
                return typeof MacroRecorder === 'function';
            } catch (error) {
                console.log(`  错误: ${error.message}`);
                return false;
            }
        });
        
        this.test('MacroPlayer模块', () => {
            try {
                const MacroPlayer = require('../src/macro-player');
                return typeof MacroPlayer === 'function';
            } catch (error) {
                console.log(`  错误: ${error.message}`);
                return false;
            }
        });
        
        this.test('HotkeyManager模块', () => {
            try {
                const HotkeyManager = require('../src/hotkey-manager');
                return typeof HotkeyManager === 'function';
            } catch (error) {
                console.log(`  错误: ${error.message}`);
                return false;
            }
        });
        
        console.log('');
    }

    async testFileSystem() {
        console.log('📁 文件系统测试...');
        
        // 测试目录创建
        this.test('创建宏目录', () => {
            const macrosDir = path.join(process.cwd(), 'macros');
            if (!fs.existsSync(macrosDir)) {
                fs.mkdirSync(macrosDir, { recursive: true });
            }
            return fs.existsSync(macrosDir);
        });
        
        // 测试文件写入
        this.test('文件写入权限', () => {
            try {
                const testFile = path.join(process.cwd(), 'test_write.tmp');
                fs.writeFileSync(testFile, 'test');
                const exists = fs.existsSync(testFile);
                if (exists) {
                    fs.unlinkSync(testFile);
                }
                return exists;
            } catch (error) {
                return false;
            }
        });
        
        console.log('');
    }

    async testConfiguration() {
        console.log('⚙️  配置测试...');
        
        // 测试package.json配置
        this.test('package.json配置', () => {
            try {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                return pkg.name === 'dnf-macro-plugin' && 
                       pkg.main === 'src/main.js' &&
                       pkg.scripts && 
                       pkg.scripts.start;
            } catch (error) {
                return false;
            }
        });
        
        // 测试依赖项
        this.test('必需依赖项', () => {
            try {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                
                const required = ['electron', 'robotjs'];
                return required.every(dep => deps[dep]);
            } catch (error) {
                return false;
            }
        });
        
        console.log('');
    }

    async testPerformance() {
        console.log('⚡ 性能测试...');
        
        // 测试模块加载时间
        this.test('模块加载性能', () => {
            const start = Date.now();
            try {
                require('../src/macro-recorder');
                require('../src/macro-player');
                require('../src/hotkey-manager');
                const loadTime = Date.now() - start;
                console.log(`    加载时间: ${loadTime}ms`);
                return loadTime < 1000; // 应该在1秒内加载完成
            } catch (error) {
                return false;
            }
        });
        
        // 测试内存使用
        this.test('内存使用检查', () => {
            const memUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            console.log(`    堆内存使用: ${heapUsedMB}MB`);
            return heapUsedMB < 100; // 应该小于100MB
        });
        
        console.log('');
    }

    test(name, testFn) {
        try {
            const result = testFn();
            if (result) {
                console.log(`  ✅ ${name}`);
                this.passed++;
            } else {
                console.log(`  ❌ ${name}`);
                this.failed++;
            }
            
            this.testResults.push({
                name,
                passed: result,
                timestamp: new Date()
            });
            
            return result;
        } catch (error) {
            console.log(`  ❌ ${name} (异常: ${error.message})`);
            this.failed++;
            
            this.testResults.push({
                name,
                passed: false,
                error: error.message,
                timestamp: new Date()
            });
            
            return false;
        }
    }

    showResults() {
        console.log('📊 测试结果汇总');
        console.log('================');
        console.log(`总测试数: ${this.passed + this.failed}`);
        console.log(`通过: ${this.passed}`);
        console.log(`失败: ${this.failed}`);
        console.log(`成功率: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
        console.log('');
        
        if (this.failed > 0) {
            console.log('❌ 失败的测试:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`  - ${result.name}${result.error ? ` (${result.error})` : ''}`);
                });
            console.log('');
        }
        
        // 保存测试报告
        this.saveTestReport();
        
        if (this.failed === 0) {
            console.log('🎉 所有测试通过！插件已准备就绪。');
        } else {
            console.log('⚠️  部分测试失败，请检查上述问题。');
            process.exit(1);
        }
    }

    saveTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.passed + this.failed,
                passed: this.passed,
                failed: this.failed,
                successRate: Math.round((this.passed / (this.passed + this.failed)) * 100)
            },
            tests: this.testResults,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        
        try {
            const reportsDir = path.join(process.cwd(), 'test-reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            const reportFile = path.join(reportsDir, `test-report-${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            console.log(`📄 测试报告已保存: ${reportFile}`);
        } catch (error) {
            console.warn('⚠️  无法保存测试报告:', error.message);
        }
    }

    // 集成测试 - 启动应用并测试基本功能
    async integrationTest() {
        console.log('🔄 集成测试...');
        
        return new Promise((resolve, reject) => {
            const electron = spawn('npm', ['start'], {
                cwd: process.cwd(),
                stdio: 'pipe'
            });
            
            let output = '';
            
            electron.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            electron.stderr.on('data', (data) => {
                output += data.toString();
            });
            
            // 10秒后终止测试
            setTimeout(() => {
                electron.kill();
                
                // 检查输出中是否包含成功启动的标志
                const success = output.includes('DNF宏插件') || 
                               output.includes('ready') ||
                               !output.includes('Error');
                
                if (success) {
                    console.log('  ✅ 应用启动成功');
                    resolve(true);
                } else {
                    console.log('  ❌ 应用启动失败');
                    console.log('  输出:', output);
                    resolve(false);
                }
            }, 10000);
        });
    }
}

// 运行测试
const tester = new DNFMacroTester();
tester.runTests().catch(console.error);