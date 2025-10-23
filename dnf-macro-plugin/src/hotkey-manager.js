const { globalShortcut } = require('electron');

class HotkeyManager {
    constructor(app) {
        this.app = app;
        this.registeredKeys = new Map();
        this.isEnabled = true;
    }

    /**
     * 注册全局快捷键
     */
    registerHotkeys() {
        try {
            // F9: 开始/停止录制
            this.registerKey('F9', () => {
                if (!this.isEnabled) return;
                
                if (this.app.isRecording) {
                    this.app.stopRecording();
                } else {
                    this.app.startRecording();
                }
            }, '录制控制');

            // F10: 开始/停止播放
            this.registerKey('F10', () => {
                if (!this.isEnabled) return;
                
                if (this.app.isPlaying) {
                    this.app.stopPlaying();
                } else {
                    this.app.startPlaying();
                }
            }, '播放控制');

            // F11: 紧急停止所有操作
            this.registerKey('F11', () => {
                if (!this.isEnabled) return;
                
                this.app.emergencyStop();
            }, '紧急停止');

            // Ctrl+Shift+R: 快速重新录制
            this.registerKey('CommandOrControl+Shift+R', () => {
                if (!this.isEnabled) return;
                
                if (this.app.isRecording) {
                    this.app.stopRecording();
                }
                setTimeout(() => {
                    this.app.startRecording();
                }, 100);
            }, '重新录制');

            // Ctrl+Shift+P: 快速播放最后一个宏
            this.registerKey('CommandOrControl+Shift+P', () => {
                if (!this.isEnabled) return;
                
                if (this.app.currentMacro && !this.app.isPlaying) {
                    this.app.startPlaying();
                }
            }, '快速播放');

            // Ctrl+Shift+S: 快速保存宏
            this.registerKey('CommandOrControl+Shift+S', () => {
                if (!this.isEnabled) return;
                
                if (this.app.currentMacro && this.app.mainWindow) {
                    this.app.mainWindow.webContents.send('hotkey-quick-save');
                }
            }, '快速保存');

            // Ctrl+Shift+L: 显示/隐藏主窗口
            this.registerKey('CommandOrControl+Shift+L', () => {
                if (!this.isEnabled) return;
                
                if (this.app.mainWindow) {
                    if (this.app.mainWindow.isVisible()) {
                        this.app.mainWindow.hide();
                    } else {
                        this.app.mainWindow.show();
                        this.app.mainWindow.focus();
                    }
                }
            }, '显示/隐藏窗口');

            console.log('全局快捷键注册成功');
            return true;
        } catch (error) {
            console.error('注册全局快捷键失败:', error);
            return false;
        }
    }

    /**
     * 注册单个快捷键
     */
    registerKey(accelerator, callback, description = '') {
        try {
            const success = globalShortcut.register(accelerator, callback);
            
            if (success) {
                this.registeredKeys.set(accelerator, {
                    callback,
                    description,
                    registeredAt: new Date()
                });
                console.log(`快捷键 ${accelerator} 注册成功: ${description}`);
            } else {
                console.warn(`快捷键 ${accelerator} 注册失败，可能已被其他应用占用`);
            }
            
            return success;
        } catch (error) {
            console.error(`注册快捷键 ${accelerator} 时出错:`, error);
            return false;
        }
    }

    /**
     * 注销单个快捷键
     */
    unregisterKey(accelerator) {
        try {
            globalShortcut.unregister(accelerator);
            this.registeredKeys.delete(accelerator);
            console.log(`快捷键 ${accelerator} 已注销`);
            return true;
        } catch (error) {
            console.error(`注销快捷键 ${accelerator} 时出错:`, error);
            return false;
        }
    }

    /**
     * 注销所有快捷键
     */
    unregisterAll() {
        try {
            globalShortcut.unregisterAll();
            this.registeredKeys.clear();
            console.log('所有快捷键已注销');
            return true;
        } catch (error) {
            console.error('注销所有快捷键时出错:', error);
            return false;
        }
    }

    /**
     * 检查快捷键是否已注册
     */
    isRegistered(accelerator) {
        return globalShortcut.isRegistered(accelerator);
    }

    /**
     * 获取已注册的快捷键列表
     */
    getRegisteredKeys() {
        return Array.from(this.registeredKeys.entries()).map(([key, info]) => ({
            accelerator: key,
            description: info.description,
            registeredAt: info.registeredAt
        }));
    }

    /**
     * 启用/禁用快捷键
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`快捷键${enabled ? '已启用' : '已禁用'}`);
    }

    /**
     * 重新注册所有快捷键
     */
    reregisterAll() {
        this.unregisterAll();
        return this.registerHotkeys();
    }

    /**
     * 检查快捷键冲突
     */
    checkConflicts() {
        const conflicts = [];
        
        for (const [accelerator] of this.registeredKeys) {
            if (!this.isRegistered(accelerator)) {
                conflicts.push(accelerator);
            }
        }
        
        if (conflicts.length > 0) {
            console.warn('检测到快捷键冲突:', conflicts);
        }
        
        return conflicts;
    }

    /**
     * 获取快捷键帮助信息
     */
    getHelpInfo() {
        return [
            { key: 'F9', description: '开始/停止录制宏' },
            { key: 'F10', description: '开始/停止播放宏' },
            { key: 'F11', description: '紧急停止所有操作' },
            { key: 'Ctrl+Shift+R', description: '重新开始录制' },
            { key: 'Ctrl+Shift+P', description: '快速播放最后一个宏' },
            { key: 'Ctrl+Shift+S', description: '快速保存当前宏' },
            { key: 'Ctrl+Shift+L', description: '显示/隐藏主窗口' }
        ];
    }

    /**
     * 自定义快捷键配置
     */
    setCustomHotkey(action, accelerator) {
        // 注销旧的快捷键
        const oldKey = this.findKeyByAction(action);
        if (oldKey) {
            this.unregisterKey(oldKey);
        }

        // 注册新的快捷键
        let callback;
        let description;

        switch (action) {
            case 'record':
                callback = () => {
                    if (this.app.isRecording) {
                        this.app.stopRecording();
                    } else {
                        this.app.startRecording();
                    }
                };
                description = '录制控制';
                break;
            case 'play':
                callback = () => {
                    if (this.app.isPlaying) {
                        this.app.stopPlaying();
                    } else {
                        this.app.startPlaying();
                    }
                };
                description = '播放控制';
                break;
            case 'stop':
                callback = () => this.app.emergencyStop();
                description = '紧急停止';
                break;
            default:
                console.error('未知的动作:', action);
                return false;
        }

        return this.registerKey(accelerator, callback, description);
    }

    /**
     * 根据动作查找快捷键
     */
    findKeyByAction(action) {
        const actionMap = {
            'record': 'F9',
            'play': 'F10',
            'stop': 'F11'
        };
        
        return actionMap[action];
    }

    /**
     * 验证快捷键格式
     */
    validateAccelerator(accelerator) {
        try {
            // 尝试注册一个临时快捷键来验证格式
            const tempKey = `temp_${Date.now()}`;
            const success = globalShortcut.register(accelerator, () => {});
            
            if (success) {
                globalShortcut.unregister(accelerator);
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取系统快捷键使用情况
     */
    getSystemHotkeyUsage() {
        const commonKeys = [
            'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
            'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+Y', 'Ctrl+A', 'Ctrl+S',
            'Alt+Tab', 'Alt+F4', 'Win+L', 'Win+D', 'Win+R'
        ];

        const usage = {};
        
        commonKeys.forEach(key => {
            usage[key] = this.isRegistered(key);
        });

        return usage;
    }
}

module.exports = HotkeyManager;