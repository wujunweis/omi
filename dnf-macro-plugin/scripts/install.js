#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DNFMacroInstaller {
    constructor() {
        this.platform = os.platform();
        this.arch = os.arch();
        this.nodeVersion = process.version;
    }

    async install() {
        console.log('🎮 DNF宏插件安装程序');
        console.log('========================');
        console.log(`系统: ${this.platform} ${this.arch}`);
        console.log(`Node.js: ${this.nodeVersion}`);
        console.log('');

        try {
            // 检查系统要求
            this.checkSystemRequirements();
            
            // 安装依赖
            await this.installDependencies();
            
            // 编译原生模块
            await this.buildNativeModules();
            
            // 创建必要目录
            this.createDirectories();
            
            // 设置权限（Linux/macOS）
            this.setupPermissions();
            
            // 创建启动脚本
            this.createLaunchScripts();
            
            console.log('✅ 安装完成！');
            console.log('');
            console.log('启动方式：');
            console.log('  npm start        # 开发模式');
            console.log('  npm run build    # 构建发布版');
            console.log('');
            console.log('注意事项：');
            console.log('  - Windows用户可能需要以管理员权限运行');
            console.log('  - macOS用户需要在系统偏好设置中授予辅助功能权限');
            console.log('  - Linux用户可能需要安装额外的X11开发包');
            
        } catch (error) {
            console.error('❌ 安装失败:', error.message);
            console.error('');
            console.error('常见解决方案：');
            console.error('  1. 确保以管理员/root权限运行');
            console.error('  2. 检查网络连接');
            console.error('  3. 更新Node.js到最新LTS版本');
            console.error('  4. 安装Python和C++编译工具');
            process.exit(1);
        }
    }

    checkSystemRequirements() {
        console.log('🔍 检查系统要求...');
        
        // 检查Node.js版本
        const nodeVersion = process.versions.node;
        const majorVersion = parseInt(nodeVersion.split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`Node.js版本过低 (${nodeVersion})，需要16.0.0或更高版本`);
        }
        
        // 检查平台支持
        if (!['win32', 'darwin', 'linux'].includes(this.platform)) {
            throw new Error(`不支持的操作系统: ${this.platform}`);
        }
        
        // 检查Python（用于编译原生模块）
        try {
            execSync('python --version', { stdio: 'ignore' });
        } catch {
            try {
                execSync('python3 --version', { stdio: 'ignore' });
            } catch {
                console.warn('⚠️  未检测到Python，可能影响原生模块编译');
            }
        }
        
        console.log('✅ 系统要求检查通过');
    }

    async installDependencies() {
        console.log('📦 安装依赖包...');
        
        const packages = [
            'electron@^27.0.0',
            'robotjs@^0.6.0',
            'iohook@^0.1.17',
            'node-global-key-listener@^0.1.1'
        ];
        
        const devPackages = [
            'electron-builder@^24.6.4'
        ];
        
        try {
            // 安装生产依赖
            console.log('安装生产依赖...');
            execSync(`npm install ${packages.join(' ')}`, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            // 安装开发依赖
            console.log('安装开发依赖...');
            execSync(`npm install --save-dev ${devPackages.join(' ')}`, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            console.log('✅ 依赖安装完成');
        } catch (error) {
            throw new Error(`依赖安装失败: ${error.message}`);
        }
    }

    async buildNativeModules() {
        console.log('🔨 编译原生模块...');
        
        try {
            // 重新编译原生模块以匹配Electron
            execSync('npm run electron-rebuild', { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            console.log('✅ 原生模块编译完成');
        } catch (error) {
            console.warn('⚠️  原生模块编译可能有问题，但可以继续尝试运行');
            console.warn('如果遇到问题，请手动运行: npm install --rebuild');
        }
    }

    createDirectories() {
        console.log('📁 创建必要目录...');
        
        const directories = [
            'macros',
            'logs',
            'temp',
            'assets'
        ];
        
        directories.forEach(dir => {
            const dirPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`  创建目录: ${dir}`);
            }
        });
        
        console.log('✅ 目录创建完成');
    }

    setupPermissions() {
        if (this.platform === 'win32') return;
        
        console.log('🔐 设置权限...');
        
        try {
            // 设置执行权限
            const scriptsDir = path.join(process.cwd(), 'scripts');
            if (fs.existsSync(scriptsDir)) {
                execSync(`chmod +x ${scriptsDir}/*`, { stdio: 'ignore' });
            }
            
            console.log('✅ 权限设置完成');
        } catch (error) {
            console.warn('⚠️  权限设置可能有问题，请手动检查');
        }
    }

    createLaunchScripts() {
        console.log('📜 创建启动脚本...');
        
        // Windows批处理文件
        if (this.platform === 'win32') {
            const batContent = `@echo off
echo Starting DNF Macro Plugin...
npm start
pause`;
            fs.writeFileSync('start.bat', batContent);
            console.log('  创建: start.bat');
        }
        
        // Unix shell脚本
        if (this.platform !== 'win32') {
            const shContent = `#!/bin/bash
echo "Starting DNF Macro Plugin..."
npm start`;
            fs.writeFileSync('start.sh', shContent);
            execSync('chmod +x start.sh');
            console.log('  创建: start.sh');
        }
        
        console.log('✅ 启动脚本创建完成');
    }

    static showHelp() {
        console.log(`
DNF宏插件安装程序

用法:
  node scripts/install.js [选项]

选项:
  --help, -h     显示帮助信息
  --verbose, -v  显示详细输出
  --skip-deps    跳过依赖安装
  --dev          安装开发环境

示例:
  node scripts/install.js
  node scripts/install.js --verbose
  node scripts/install.js --skip-deps
        `);
    }
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    DNFMacroInstaller.showHelp();
    process.exit(0);
}

// 运行安装程序
const installer = new DNFMacroInstaller();
installer.install().catch(console.error);