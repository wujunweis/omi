const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');
const MacroRecorder = require('./macro-recorder');
const MacroPlayer = require('./macro-player');
const HotkeyManager = require('./hotkey-manager');

class DNFMacroApp {
    constructor() {
        this.mainWindow = null;
        this.macroRecorder = new MacroRecorder();
        this.macroPlayer = new MacroPlayer();
        this.hotkeyManager = new HotkeyManager(this);
        this.isRecording = false;
        this.isPlaying = false;
        this.currentMacro = null;
    }

    createWindow() {
        // 创建浏览器窗口
        this.mainWindow = new BrowserWindow({
            width: 400,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            icon: path.join(__dirname, '../assets/icon.png'),
            title: 'DNF宏插件',
            resizable: false,
            alwaysOnTop: true,
            frame: true,
            show: false
        });

        // 加载应用的 index.html
        this.mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));

        // 当窗口准备好显示时
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        // 当窗口被关闭时
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // 开发者工具（开发模式）
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }
    }

    setupGlobalShortcuts() {
        // 使用快捷键管理器注册全局快捷键
        this.hotkeyManager.registerHotkeys();
    }

    setupIpcHandlers() {
        // 开始录制
        ipcMain.on('start-recording', () => {
            this.startRecording();
        });

        // 停止录制
        ipcMain.on('stop-recording', () => {
            this.stopRecording();
        });

        // 开始播放
        ipcMain.on('start-playing', (event, options) => {
            this.startPlaying(options);
        });

        // 停止播放
        ipcMain.on('stop-playing', () => {
            this.stopPlaying();
        });

        // 保存宏
        ipcMain.on('save-macro', (event, macroData) => {
            this.saveMacro(macroData);
        });

        // 加载宏
        ipcMain.on('load-macro', (event, macroName) => {
            this.loadMacro(macroName);
        });

        // 获取宏列表
        ipcMain.on('get-macro-list', (event) => {
            const macroList = this.getMacroList();
            event.reply('macro-list-response', macroList);
        });

        // 删除宏
        ipcMain.on('delete-macro', (event, macroName) => {
            this.deleteMacro(macroName);
        });
    }

    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.macroRecorder.startRecording();
        
        // 通知渲染进程
        if (this.mainWindow) {
            this.mainWindow.webContents.send('recording-started');
        }
        
        console.log('开始录制宏...');
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.currentMacro = this.macroRecorder.stopRecording();
        
        // 通知渲染进程
        if (this.mainWindow) {
            this.mainWindow.webContents.send('recording-stopped', this.currentMacro);
        }
        
        console.log('录制完成，共录制', this.currentMacro.actions.length, '个操作');
    }

    startPlaying(options = {}) {
        if (this.isPlaying || !this.currentMacro) return;
        
        this.isPlaying = true;
        
        const playOptions = {
            loop: options.loop || false,
            loopCount: options.loopCount || 1,
            speed: options.speed || 1.0,
            ...options
        };
        
        this.macroPlayer.playMacro(this.currentMacro, playOptions, () => {
            this.isPlaying = false;
            if (this.mainWindow) {
                this.mainWindow.webContents.send('playing-stopped');
            }
        });
        
        // 通知渲染进程
        if (this.mainWindow) {
            this.mainWindow.webContents.send('playing-started');
        }
        
        console.log('开始播放宏...');
    }

    stopPlaying() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this.macroPlayer.stopPlaying();
        
        // 通知渲染进程
        if (this.mainWindow) {
            this.mainWindow.webContents.send('playing-stopped');
        }
        
        console.log('停止播放宏');
    }

    emergencyStop() {
        this.stopRecording();
        this.stopPlaying();
        console.log('紧急停止所有操作');
    }

    saveMacro(macroData) {
        const fs = require('fs');
        const macrosDir = path.join(__dirname, '../macros');
        
        // 确保宏目录存在
        if (!fs.existsSync(macrosDir)) {
            fs.mkdirSync(macrosDir, { recursive: true });
        }
        
        const macroPath = path.join(macrosDir, `${macroData.name}.json`);
        fs.writeFileSync(macroPath, JSON.stringify(macroData, null, 2));
        
        console.log(`宏 "${macroData.name}" 已保存`);
    }

    loadMacro(macroName) {
        const fs = require('fs');
        const macroPath = path.join(__dirname, '../macros', `${macroName}.json`);
        
        if (fs.existsSync(macroPath)) {
            const macroData = JSON.parse(fs.readFileSync(macroPath, 'utf8'));
            this.currentMacro = macroData;
            
            if (this.mainWindow) {
                this.mainWindow.webContents.send('macro-loaded', macroData);
            }
            
            console.log(`宏 "${macroName}" 已加载`);
        }
    }

    getMacroList() {
        const fs = require('fs');
        const macrosDir = path.join(__dirname, '../macros');
        
        if (!fs.existsSync(macrosDir)) {
            return [];
        }
        
        const files = fs.readdirSync(macrosDir);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    }

    deleteMacro(macroName) {
        const fs = require('fs');
        const macroPath = path.join(__dirname, '../macros', `${macroName}.json`);
        
        if (fs.existsSync(macroPath)) {
            fs.unlinkSync(macroPath);
            console.log(`宏 "${macroName}" 已删除`);
        }
    }

    init() {
        // 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
        app.whenReady().then(() => {
            this.createWindow();
            this.setupGlobalShortcuts();
            this.setupIpcHandlers();

            app.on('activate', () => {
                // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
                // 通常在应用程序中重新创建一个窗口。
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });

        // 当所有窗口都关闭时退出应用
        app.on('window-all-closed', () => {
            // 在 macOS 上，应用程序和它们的菜单栏通常保持活动状态，
            // 直到用户使用 Cmd + Q 显式退出
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        // 应用退出前清理
        app.on('will-quit', () => {
            this.hotkeyManager.unregisterAll();
        });
    }
}

// 创建应用实例并初始化
const dnfMacroApp = new DNFMacroApp();
dnfMacroApp.init();