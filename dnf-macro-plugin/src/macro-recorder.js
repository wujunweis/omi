const ioHook = require('iohook');

class MacroRecorder {
    constructor() {
        this.isRecording = false;
        this.actions = [];
        this.startTime = null;
        this.lastActionTime = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 鼠标点击事件
        ioHook.on('mouseclick', (event) => {
            if (!this.isRecording) return;
            
            const currentTime = Date.now();
            const delay = this.lastActionTime ? currentTime - this.lastActionTime : 0;
            
            this.actions.push({
                type: 'mouseclick',
                button: event.button, // 1: 左键, 2: 右键, 3: 中键
                x: event.x,
                y: event.y,
                delay: delay,
                timestamp: currentTime - this.startTime
            });
            
            this.lastActionTime = currentTime;
            console.log(`录制鼠标点击: 按钮${event.button} 位置(${event.x}, ${event.y}) 延迟${delay}ms`);
        });

        // 鼠标移动事件（可选，通常游戏中不需要录制鼠标移动）
        ioHook.on('mousemove', (event) => {
            if (!this.isRecording) return;
            
            // 为了避免录制过多的鼠标移动事件，可以添加节流
            const currentTime = Date.now();
            if (this.lastMouseMoveTime && currentTime - this.lastMouseMoveTime < 50) {
                return; // 50ms内的鼠标移动忽略
            }
            
            const delay = this.lastActionTime ? currentTime - this.lastActionTime : 0;
            
            this.actions.push({
                type: 'mousemove',
                x: event.x,
                y: event.y,
                delay: delay,
                timestamp: currentTime - this.startTime
            });
            
            this.lastActionTime = currentTime;
            this.lastMouseMoveTime = currentTime;
        });

        // 键盘按下事件
        ioHook.on('keydown', (event) => {
            if (!this.isRecording) return;
            
            const currentTime = Date.now();
            const delay = this.lastActionTime ? currentTime - this.lastActionTime : 0;
            
            this.actions.push({
                type: 'keydown',
                keycode: event.keycode,
                rawcode: event.rawcode,
                delay: delay,
                timestamp: currentTime - this.startTime
            });
            
            this.lastActionTime = currentTime;
            console.log(`录制按键按下: 键码${event.keycode} 延迟${delay}ms`);
        });

        // 键盘释放事件
        ioHook.on('keyup', (event) => {
            if (!this.isRecording) return;
            
            const currentTime = Date.now();
            const delay = this.lastActionTime ? currentTime - this.lastActionTime : 0;
            
            this.actions.push({
                type: 'keyup',
                keycode: event.keycode,
                rawcode: event.rawcode,
                delay: delay,
                timestamp: currentTime - this.startTime
            });
            
            this.lastActionTime = currentTime;
            console.log(`录制按键释放: 键码${event.keycode} 延迟${delay}ms`);
        });

        // 鼠标滚轮事件
        ioHook.on('mousewheel', (event) => {
            if (!this.isRecording) return;
            
            const currentTime = Date.now();
            const delay = this.lastActionTime ? currentTime - this.lastActionTime : 0;
            
            this.actions.push({
                type: 'mousewheel',
                x: event.x,
                y: event.y,
                direction: event.direction, // 3: 向上, 4: 向下
                rotation: event.rotation,
                delay: delay,
                timestamp: currentTime - this.startTime
            });
            
            this.lastActionTime = currentTime;
            console.log(`录制鼠标滚轮: 方向${event.direction} 位置(${event.x}, ${event.y}) 延迟${delay}ms`);
        });
    }

    startRecording() {
        if (this.isRecording) {
            console.log('已经在录制中...');
            return;
        }

        this.isRecording = true;
        this.actions = [];
        this.startTime = Date.now();
        this.lastActionTime = null;
        this.lastMouseMoveTime = null;

        // 启动全局输入监听
        try {
            ioHook.start(false); // false表示不阻塞事件传播
            console.log('开始录制宏操作...');
        } catch (error) {
            console.error('启动输入监听失败:', error);
            this.isRecording = false;
            throw error;
        }
    }

    stopRecording() {
        if (!this.isRecording) {
            console.log('当前没有在录制...');
            return null;
        }

        this.isRecording = false;
        
        // 停止全局输入监听
        try {
            ioHook.stop();
            console.log('停止录制宏操作...');
        } catch (error) {
            console.error('停止输入监听失败:', error);
        }

        const macro = {
            name: `宏_${new Date().toLocaleString().replace(/[/:]/g, '-')}`,
            description: '自动录制的宏',
            actions: [...this.actions],
            duration: this.lastActionTime ? this.lastActionTime - this.startTime : 0,
            createdAt: new Date().toISOString(),
            actionCount: this.actions.length
        };

        console.log(`录制完成: 共${macro.actionCount}个操作，总时长${macro.duration}ms`);
        return macro;
    }

    isCurrentlyRecording() {
        return this.isRecording;
    }

    getCurrentActions() {
        return [...this.actions];
    }

    // 获取按键名称（用于显示）
    static getKeyName(keycode) {
        const keyMap = {
            1: 'Esc', 2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
            16: 'Q', 17: 'W', 18: 'E', 19: 'R', 20: 'T', 21: 'Y', 22: 'U', 23: 'I', 24: 'O', 25: 'P',
            30: 'A', 31: 'S', 32: 'D', 33: 'F', 34: 'G', 35: 'H', 36: 'J', 37: 'K', 38: 'L',
            44: 'Z', 45: 'X', 46: 'C', 47: 'V', 48: 'B', 49: 'N', 50: 'M',
            57: 'Space', 28: 'Enter', 14: 'Backspace', 15: 'Tab',
            42: 'Shift', 29: 'Ctrl', 56: 'Alt',
            72: 'Up', 80: 'Down', 75: 'Left', 77: 'Right',
            59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6',
            65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12'
        };
        
        return keyMap[keycode] || `Key${keycode}`;
    }

    // 获取鼠标按钮名称
    static getMouseButtonName(button) {
        const buttonMap = {
            1: '左键',
            2: '右键',
            3: '中键',
            4: '侧键1',
            5: '侧键2'
        };
        
        return buttonMap[button] || `按钮${button}`;
    }
}

module.exports = MacroRecorder;