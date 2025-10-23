const { ipcRenderer } = require('electron');

class DNFMacroUI {
    constructor() {
        this.isRecording = false;
        this.isPlaying = false;
        this.currentMacro = null;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupIpcListeners();
        this.loadMacroList();
    }

    initializeElements() {
        // 状态指示器
        this.recordingStatus = document.getElementById('recordingStatus');
        this.playingStatus = document.getElementById('playingStatus');
        
        // 录制控制
        this.startRecordBtn = document.getElementById('startRecordBtn');
        this.stopRecordBtn = document.getElementById('stopRecordBtn');
        this.recordingInfo = document.getElementById('recordingInfo');
        this.recordingTime = document.getElementById('recordingTime');
        this.actionCount = document.getElementById('actionCount');
        
        // 播放控制
        this.startPlayBtn = document.getElementById('startPlayBtn');
        this.stopPlayBtn = document.getElementById('stopPlayBtn');
        this.playingInfo = document.getElementById('playingInfo');
        this.currentLoop = document.getElementById('currentLoop');
        this.maxLoop = document.getElementById('maxLoop');
        this.progressFill = document.getElementById('progressFill');
        
        // 播放选项
        this.loopPlayback = document.getElementById('loopPlayback');
        this.loopCount = document.getElementById('loopCount');
        this.playSpeed = document.getElementById('playSpeed');
        
        // 宏管理
        this.macroName = document.getElementById('macroName');
        this.saveMacroBtn = document.getElementById('saveMacroBtn');
        this.macroSelect = document.getElementById('macroSelect');
        this.loadMacroBtn = document.getElementById('loadMacroBtn');
        this.deleteMacroBtn = document.getElementById('deleteMacroBtn');
        this.currentMacroInfo = document.getElementById('currentMacroInfo');
        this.currentMacroName = document.getElementById('currentMacroName');
        this.currentMacroActions = document.getElementById('currentMacroActions');
        this.currentMacroDuration = document.getElementById('currentMacroDuration');
    }

    bindEvents() {
        // 录制控制事件
        this.startRecordBtn.addEventListener('click', () => this.startRecording());
        this.stopRecordBtn.addEventListener('click', () => this.stopRecording());
        
        // 播放控制事件
        this.startPlayBtn.addEventListener('click', () => this.startPlaying());
        this.stopPlayBtn.addEventListener('click', () => this.stopPlaying());
        
        // 宏管理事件
        this.saveMacroBtn.addEventListener('click', () => this.saveMacro());
        this.loadMacroBtn.addEventListener('click', () => this.loadMacro());
        this.deleteMacroBtn.addEventListener('click', () => this.deleteMacro());
        
        // 宏选择事件
        this.macroSelect.addEventListener('change', () => {
            const selected = this.macroSelect.value;
            this.loadMacroBtn.disabled = !selected;
            this.deleteMacroBtn.disabled = !selected;
        });
        
        // 循环播放选项事件
        this.loopPlayback.addEventListener('change', () => {
            this.loopCount.disabled = !this.loopPlayback.checked;
        });
        
        // 宏名称输入事件
        this.macroName.addEventListener('input', () => {
            this.saveMacroBtn.disabled = !this.macroName.value.trim() || !this.currentMacro;
        });
    }

    setupIpcListeners() {
        // 录制状态变化
        ipcRenderer.on('recording-started', () => {
            this.onRecordingStarted();
        });
        
        ipcRenderer.on('recording-stopped', (event, macro) => {
            this.onRecordingStopped(macro);
        });
        
        // 播放状态变化
        ipcRenderer.on('playing-started', () => {
            this.onPlayingStarted();
        });
        
        ipcRenderer.on('playing-stopped', () => {
            this.onPlayingStopped();
        });
        
        // 宏管理
        ipcRenderer.on('macro-loaded', (event, macro) => {
            this.onMacroLoaded(macro);
        });
        
        ipcRenderer.on('macro-list-response', (event, macroList) => {
            this.updateMacroList(macroList);
        });
    }

    // 录制相关方法
    startRecording() {
        ipcRenderer.send('start-recording');
    }

    stopRecording() {
        ipcRenderer.send('stop-recording');
    }

    onRecordingStarted() {
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        
        // 更新UI状态
        this.updateRecordingStatus('recording', '录制中...');
        this.startRecordBtn.disabled = true;
        this.stopRecordBtn.disabled = false;
        this.recordingInfo.style.display = 'block';
        
        // 开始计时器
        this.recordingTimer = setInterval(() => {
            this.updateRecordingTime();
        }, 100);
        
        console.log('开始录制');
    }

    onRecordingStopped(macro) {
        this.isRecording = false;
        this.currentMacro = macro;
        
        // 更新UI状态
        this.updateRecordingStatus('idle', '录制完成');
        this.startRecordBtn.disabled = false;
        this.stopRecordBtn.disabled = true;
        
        // 停止计时器
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        // 更新宏信息
        this.updateCurrentMacroInfo(macro);
        this.startPlayBtn.disabled = false;
        this.macroName.value = macro.name;
        this.saveMacroBtn.disabled = false;
        
        console.log('录制完成:', macro);
    }

    updateRecordingTime() {
        if (!this.recordingStartTime) return;
        
        const elapsed = Date.now() - this.recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        this.recordingTime.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 播放相关方法
    startPlaying() {
        if (!this.currentMacro) return;
        
        const options = {
            loop: this.loopPlayback.checked,
            loopCount: parseInt(this.loopCount.value) || 1,
            speed: parseFloat(this.playSpeed.value) || 1.0
        };
        
        ipcRenderer.send('start-playing', options);
    }

    stopPlaying() {
        ipcRenderer.send('stop-playing');
    }

    onPlayingStarted() {
        this.isPlaying = true;
        
        // 更新UI状态
        this.updatePlayingStatus('playing', '播放中...');
        this.startPlayBtn.disabled = true;
        this.stopPlayBtn.disabled = false;
        this.playingInfo.style.display = 'block';
        
        // 更新循环信息
        const maxLoops = this.loopPlayback.checked ? parseInt(this.loopCount.value) : 1;
        this.maxLoop.textContent = maxLoops;
        this.currentLoop.textContent = '1';
        
        console.log('开始播放');
    }

    onPlayingStopped() {
        this.isPlaying = false;
        
        // 更新UI状态
        this.updatePlayingStatus('idle', '播放完成');
        this.startPlayBtn.disabled = false;
        this.stopPlayBtn.disabled = true;
        this.playingInfo.style.display = 'none';
        
        console.log('播放完成');
    }

    // 宏管理相关方法
    saveMacro() {
        if (!this.currentMacro || !this.macroName.value.trim()) return;
        
        const macroData = {
            ...this.currentMacro,
            name: this.macroName.value.trim(),
            savedAt: new Date().toISOString()
        };
        
        ipcRenderer.send('save-macro', macroData);
        this.loadMacroList();
        
        // 显示保存成功提示
        this.showNotification('宏已保存成功！', 'success');
    }

    loadMacro() {
        const selectedMacro = this.macroSelect.value;
        if (!selectedMacro) return;
        
        ipcRenderer.send('load-macro', selectedMacro);
    }

    deleteMacro() {
        const selectedMacro = this.macroSelect.value;
        if (!selectedMacro) return;
        
        if (confirm(`确定要删除宏 "${selectedMacro}" 吗？`)) {
            ipcRenderer.send('delete-macro', selectedMacro);
            this.loadMacroList();
            this.showNotification('宏已删除', 'info');
        }
    }

    onMacroLoaded(macro) {
        this.currentMacro = macro;
        this.updateCurrentMacroInfo(macro);
        this.startPlayBtn.disabled = false;
        this.macroName.value = macro.name;
        this.saveMacroBtn.disabled = false;
        
        this.showNotification(`宏 "${macro.name}" 已加载`, 'success');
    }

    loadMacroList() {
        ipcRenderer.send('get-macro-list');
    }

    updateMacroList(macroList) {
        // 清空现有选项
        this.macroSelect.innerHTML = '<option value="">选择已保存的宏...</option>';
        
        // 添加宏列表
        macroList.forEach(macroName => {
            const option = document.createElement('option');
            option.value = macroName;
            option.textContent = macroName;
            this.macroSelect.appendChild(option);
        });
    }

    // UI更新方法
    updateRecordingStatus(status, text) {
        const dot = this.recordingStatus.querySelector('.status-dot');
        const textElement = this.recordingStatus.querySelector('.status-text');
        
        dot.className = `status-dot ${status}`;
        textElement.textContent = text;
    }

    updatePlayingStatus(status, text) {
        const dot = this.playingStatus.querySelector('.status-dot');
        const textElement = this.playingStatus.querySelector('.status-text');
        
        dot.className = `status-dot ${status}`;
        textElement.textContent = text;
    }

    updateCurrentMacroInfo(macro) {
        if (!macro) {
            this.currentMacroInfo.style.display = 'none';
            return;
        }
        
        this.currentMacroName.textContent = macro.name;
        this.currentMacroActions.textContent = macro.actions ? macro.actions.length : 0;
        this.currentMacroDuration.textContent = `${macro.duration || 0}ms`;
        this.currentMacroInfo.style.display = 'block';
    }

    // 通知方法
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // 设置背景色
        switch (type) {
            case 'success':
                notification.style.background = '#51cf66';
                break;
            case 'error':
                notification.style.background = '#ff6b6b';
                break;
            case 'warning':
                notification.style.background = '#ffd43b';
                break;
            default:
                notification.style.background = '#4c6ef5';
        }
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 格式化时间
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}分${remainingSeconds}秒`;
        } else {
            return `${remainingSeconds}秒`;
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new DNFMacroUI();
    console.log('DNF宏插件UI已初始化');
});