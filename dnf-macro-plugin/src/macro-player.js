const robot = require('robotjs');

class MacroPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentMacro = null;
        this.playbackTimeout = null;
        this.loopCount = 0;
        this.maxLoops = 1;
        this.playbackSpeed = 1.0;
        this.onComplete = null;
        this.shouldStop = false;
        
        // 设置robot.js的延迟，提高准确性
        robot.setMouseDelay(2);
        robot.setKeyboardDelay(2);
    }

    playMacro(macro, options = {}, onComplete = null) {
        if (this.isPlaying) {
            console.log('已经在播放宏...');
            return;
        }

        if (!macro || !macro.actions || macro.actions.length === 0) {
            console.log('没有可播放的宏或宏为空');
            return;
        }

        this.isPlaying = true;
        this.shouldStop = false;
        this.currentMacro = macro;
        this.onComplete = onComplete;
        this.loopCount = 0;
        
        // 设置播放选项
        this.maxLoops = options.loop ? (options.loopCount || Infinity) : 1;
        this.playbackSpeed = options.speed || 1.0;
        
        console.log(`开始播放宏 "${macro.name}"，循环${this.maxLoops === Infinity ? '无限' : this.maxLoops}次，速度${this.playbackSpeed}x`);
        
        this.playLoop();
    }

    playLoop() {
        if (this.shouldStop || !this.isPlaying) {
            this.stopPlaying();
            return;
        }

        if (this.loopCount >= this.maxLoops) {
            this.stopPlaying();
            return;
        }

        this.loopCount++;
        console.log(`开始第${this.loopCount}次循环播放`);
        
        this.playActions(this.currentMacro.actions, 0);
    }

    playActions(actions, index) {
        if (this.shouldStop || !this.isPlaying || index >= actions.length) {
            // 当前循环完成，检查是否需要继续下一次循环
            if (!this.shouldStop && this.isPlaying) {
                // 添加循环间隔（可选）
                const loopDelay = 1000; // 1秒间隔
                this.playbackTimeout = setTimeout(() => {
                    this.playLoop();
                }, loopDelay / this.playbackSpeed);
            }
            return;
        }

        const action = actions[index];
        const delay = Math.max(0, action.delay / this.playbackSpeed);

        this.playbackTimeout = setTimeout(() => {
            if (this.shouldStop || !this.isPlaying) return;

            try {
                this.executeAction(action);
            } catch (error) {
                console.error('执行动作时出错:', error);
            }

            // 继续下一个动作
            this.playActions(actions, index + 1);
        }, delay);
    }

    executeAction(action) {
        switch (action.type) {
            case 'mouseclick':
                this.executeMouseClick(action);
                break;
            case 'mousemove':
                this.executeMouseMove(action);
                break;
            case 'keydown':
                this.executeKeyDown(action);
                break;
            case 'keyup':
                this.executeKeyUp(action);
                break;
            case 'mousewheel':
                this.executeMouseWheel(action);
                break;
            default:
                console.log(`未知的动作类型: ${action.type}`);
        }
    }

    executeMouseClick(action) {
        try {
            // 移动鼠标到指定位置
            robot.moveMouse(action.x, action.y);
            
            // 根据按钮类型执行点击
            const buttonMap = {
                1: 'left',
                2: 'right',
                3: 'middle'
            };
            
            const button = buttonMap[action.button] || 'left';
            robot.mouseClick(button);
            
            console.log(`执行鼠标点击: ${button}键 位置(${action.x}, ${action.y})`);
        } catch (error) {
            console.error('执行鼠标点击失败:', error);
        }
    }

    executeMouseMove(action) {
        try {
            robot.moveMouse(action.x, action.y);
            console.log(`执行鼠标移动: 位置(${action.x}, ${action.y})`);
        } catch (error) {
            console.error('执行鼠标移动失败:', error);
        }
    }

    executeKeyDown(action) {
        try {
            const key = this.getKeyFromCode(action.keycode);
            if (key) {
                robot.keyToggle(key, 'down');
                console.log(`执行按键按下: ${key}`);
            }
        } catch (error) {
            console.error('执行按键按下失败:', error);
        }
    }

    executeKeyUp(action) {
        try {
            const key = this.getKeyFromCode(action.keycode);
            if (key) {
                robot.keyToggle(key, 'up');
                console.log(`执行按键释放: ${key}`);
            }
        } catch (error) {
            console.error('执行按键释放失败:', error);
        }
    }

    executeMouseWheel(action) {
        try {
            // 移动鼠标到滚轮位置
            robot.moveMouse(action.x, action.y);
            
            // 执行滚轮操作
            const direction = action.direction === 3 ? 'up' : 'down';
            const magnitude = Math.abs(action.rotation) || 1;
            
            robot.scrollMouse(action.x, action.y, direction);
            console.log(`执行鼠标滚轮: ${direction} 位置(${action.x}, ${action.y})`);
        } catch (error) {
            console.error('执行鼠标滚轮失败:', error);
        }
    }

    stopPlaying() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.shouldStop = true;
        
        // 清除所有待执行的超时
        if (this.playbackTimeout) {
            clearTimeout(this.playbackTimeout);
            this.playbackTimeout = null;
        }

        console.log('停止播放宏');

        // 调用完成回调
        if (this.onComplete) {
            this.onComplete();
            this.onComplete = null;
        }
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentProgress() {
        return {
            isPlaying: this.isPlaying,
            currentLoop: this.loopCount,
            maxLoops: this.maxLoops,
            macroName: this.currentMacro ? this.currentMacro.name : null
        };
    }

    // 将键码转换为robot.js识别的键名
    getKeyFromCode(keycode) {
        const keyMap = {
            // 数字键
            2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
            
            // 字母键
            16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
            30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
            44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
            
            // 特殊键
            1: 'escape',
            57: 'space',
            28: 'enter',
            14: 'backspace',
            15: 'tab',
            
            // 修饰键
            42: 'shift',
            54: 'shift', // 右shift
            29: 'control',
            97: 'control', // 右ctrl
            56: 'alt',
            100: 'alt', // 右alt
            
            // 方向键
            72: 'up',
            80: 'down',
            75: 'left',
            77: 'right',
            
            // 功能键
            59: 'f1', 60: 'f2', 61: 'f3', 62: 'f4', 63: 'f5', 64: 'f6',
            65: 'f7', 66: 'f8', 67: 'f9', 68: 'f10', 87: 'f11', 88: 'f12',
            
            // 其他常用键
            12: 'minus',
            13: 'equal',
            26: 'bracketleft',
            27: 'bracketright',
            39: 'semicolon',
            40: 'quote',
            41: 'grave',
            43: 'backslash',
            51: 'comma',
            52: 'period',
            53: 'slash'
        };
        
        return keyMap[keycode] || null;
    }

    // 设置播放速度
    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(10.0, speed));
        console.log(`设置播放速度: ${this.playbackSpeed}x`);
    }

    // 暂停播放（保留状态）
    pausePlaying() {
        if (!this.isPlaying) return;
        
        this.shouldStop = true;
        if (this.playbackTimeout) {
            clearTimeout(this.playbackTimeout);
            this.playbackTimeout = null;
        }
        
        console.log('暂停播放宏');
    }

    // 恢复播放
    resumePlaying() {
        if (this.isPlaying || !this.currentMacro) return;
        
        this.shouldStop = false;
        this.isPlaying = true;
        
        console.log('恢复播放宏');
        this.playLoop();
    }
}

module.exports = MacroPlayer;