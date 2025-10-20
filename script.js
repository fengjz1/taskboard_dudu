// 数据存储
class DataManager {
    constructor() {
        this.tasks = this.loadData('tasks') || [];
        this.rewards = this.loadData('rewards') || [];
        this.points = this.loadData('points') || 0;
        this.history = this.loadData('history') || [];
        this.templates = this.loadData('templates') || [];
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    addTask(task) {
        const newTask = {
            id: Date.now(),
            name: task.name,
            points: parseInt(task.points, 10),
            category: task.category,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks.push(newTask);
        this.saveData('tasks', this.tasks);
        return newTask;
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            this.points += task.points;
            this.history.push({
                type: 'task_completed',
                taskId: taskId,
                points: task.points,
                timestamp: new Date().toISOString()
            });
            this.saveData('tasks', this.tasks);
            this.saveData('points', this.points);
            this.saveData('history', this.history);
            return true;
        }
        return false;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData('tasks', this.tasks);
    }

    addReward(reward) {
        const newReward = {
            id: Date.now(),
            name: reward.name,
            cost: parseInt(reward.cost, 10),
            description: reward.description,
            createdAt: new Date().toISOString()
        };
        this.rewards.push(newReward);
        this.saveData('rewards', this.rewards);
        return newReward;
    }

    redeemReward(rewardId) {
        const reward = this.rewards.find(r => r.id === rewardId);
        if (reward && this.points >= reward.cost) {
            this.points -= reward.cost;
            this.history.push({
                type: 'reward_redeemed',
                rewardId: rewardId,
                points: -reward.cost,
                timestamp: new Date().toISOString()
            });
            this.saveData('points', this.points);
            this.saveData('history', this.history);
            return true;
        }
        return false;
    }

    deleteReward(rewardId) {
        this.rewards = this.rewards.filter(r => r.id !== rewardId);
        this.saveData('rewards', this.rewards);
    }

    getTodayTasks() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toDateString();
            return taskDate === today;
        });
    }

    getTodayCompleted() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toDateString();
            return taskDate === today && task.completed;
        });
    }

    addTemplate(template) {
        const newTemplate = {
            id: Date.now(),
            name: template.name,
            points: parseInt(template.points, 10),
            category: template.category,
            createdAt: new Date().toISOString()
        };
        this.templates.push(newTemplate);
        this.saveData('templates', this.templates);
        return newTemplate;
    }

    createTaskFromTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            const task = {
                name: template.name,
                points: template.points,
                category: template.category
            };
            return this.addTask(task);
        }
        return null;
    }

    deleteTemplate(templateId) {
        this.templates = this.templates.filter(t => t.id !== templateId);
        this.saveData('templates', this.templates);
    }
}

// 全局数据管理器
const dataManager = new DataManager();

// 页面管理
class PageManager {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showPage('home');
        this.updateUI();
    }

    bindEvents() {
        // 导航按钮事件
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // 过滤器事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setFilter(filter);
            });
        });

        // 表单提交事件
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.getElementById('addRewardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addReward();
        });

        document.getElementById('addTemplateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTemplate();
        });

        // 奖励标签切换事件
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchRewardTab(tab);
            });
        });
    }

    showPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        document.getElementById(pageName).classList.add('active');

        // 更新导航状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        this.currentPage = pageName;
        this.updateUI();
    }

    setFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.renderTasks(filter);
    }

    updateUI() {
        this.updatePoints();
        this.updateTodayStats();
        this.renderTasks();
        this.renderRewards();
        this.renderRecentTasks();
        this.renderTemplates();
        this.renderRewardHistory();
    }

    updatePoints() {
        document.getElementById('totalPoints').textContent = dataManager.points;
    }

    updateTodayStats() {
        const todayTasks = dataManager.getTodayTasks();
        const todayCompleted = dataManager.getTodayCompleted();
        
        document.getElementById('todayTotal').textContent = todayTasks.length;
        document.getElementById('todayCompleted').textContent = todayCompleted.length;
        
        const progress = todayTasks.length > 0 ? (todayCompleted.length / todayTasks.length) * 100 : 0;
        document.getElementById('progressFill').style.width = progress + '%';
    }

    renderTasks(filter = 'all') {
        const tasksList = document.getElementById('tasksList');
        let tasks = dataManager.tasks;

        if (filter !== 'all') {
            tasks = tasks.filter(task => task.category === filter);
        }

        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        tasksList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-info">
                    <div class="task-name">${esc(task.name)}</div>
                    <div class="task-meta">${esc(task.category)} • ${task.points}积分</div>
                </div>
                <div class="task-actions">
                    ${!task.completed ? `
                        <button class="task-btn complete-btn" onclick="completeTask(${task.id})">
                            完成
                        </button>
                    ` : ''}
                    <button class="task-btn delete-btn" onclick="deleteTask(${task.id})">
                        删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderRewards() {
        const rewardsGrid = document.getElementById('rewardsGrid');
        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        rewardsGrid.innerHTML = dataManager.rewards.map(reward => {
            const canAfford = dataManager.points >= reward.cost;
            return `
                <div class="reward-item ${canAfford ? 'affordable' : ''}">
                    <div class="reward-name">${esc(reward.name)}</div>
                    <div class="reward-cost">${reward.cost}积分</div>
                    <div class="reward-description">${esc(reward.description || '')}</div>
                    <button class="redeem-btn" 
                            onclick="redeemReward(${reward.id})" 
                            ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? '兑换' : '积分不足'}
                    </button>
                </div>
            `;
        }).join('');
    }

    renderRecentTasks() {
        const recentTasksList = document.getElementById('recentTasksList');
        const recentTasks = dataManager.tasks.slice(-5).reverse();
        
        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        recentTasksList.innerHTML = recentTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-info">
                    <div class="task-name">${esc(task.name)}</div>
                    <div class="task-meta">${esc(task.category)} • ${task.points}积分</div>
                </div>
                <div class="task-points">${task.points}</div>
            </div>
        `).join('');
    }

    renderTemplates() {
        const templatesList = document.getElementById('templatesList');
        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        templatesList.innerHTML = dataManager.templates.map(template => `
            <div class="template-item">
                <div class="template-info">
                    <div class="template-name">${esc(template.name)}</div>
                    <div class="template-meta">${esc(template.category)} • ${template.points}积分</div>
                </div>
                <div class="template-actions">
                    <button class="template-btn use-btn" onclick="useTemplate(${template.id})">
                        使用
                    </button>
                    <button class="template-btn delete-btn" onclick="deleteTemplate(${template.id})">
                        删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    switchRewardTab(tab) {
        // 更新标签状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.reward-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tab === 'available' ? 'availableRewards' : 'rewardHistory').classList.add('active');
    }

    renderRewardHistory() {
        const historyList = document.getElementById('historyList');
        const rewardHistory = dataManager.history.filter(record => record.type === 'reward_redeemed');
        
        if (rewardHistory.length === 0) {
            historyList.innerHTML = '<div class="empty-state">暂无兑换记录</div>';
            return;
        }

        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        historyList.innerHTML = rewardHistory.map(record => {
            const reward = dataManager.rewards.find(r => r.id === record.rewardId);
            const rewardName = reward ? reward.name : '未知奖励';
            const date = new Date(record.timestamp).toLocaleDateString('zh-CN');
            const time = new Date(record.timestamp).toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-name">${esc(rewardName)}</div>
                        <div class="history-meta">${date} ${time}</div>
                    </div>
                    <div class="history-cost">-${Math.abs(record.points)}积分</div>
                </div>
            `;
        }).join('');
    }

    renderTemplateQuickList() {
        const templateQuickList = document.getElementById('templateQuickList');
        
        if (dataManager.templates.length === 0) {
            templateQuickList.innerHTML = '<div class="no-templates">暂无模板，请先创建模板</div>';
            return;
        }

        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        templateQuickList.innerHTML = dataManager.templates.map(template => `
            <div class="template-quick-item" onclick="useTemplateQuick(${template.id})">
                <div class="template-quick-name">${esc(template.name)}</div>
                <div class="template-quick-meta">${esc(template.category)} • ${template.points}积分</div>
            </div>
        `).join('');
    }

    addTask() {
        const form = document.getElementById('addTaskForm');
        const task = {
            name: document.getElementById('taskName').value,
            points: document.getElementById('taskPoints').value,
            category: document.getElementById('taskCategory').value
        };

        // 简单校验：名称非空、积分为正整数
        if (!task.name.trim()) {
            this.showToast('请输入任务名称');
            return;
        }
        const pointsNum = parseInt(task.points, 10);
        if (Number.isNaN(pointsNum) || pointsNum <= 0) {
            this.showToast('积分需为正整数');
            return;
        }

        dataManager.addTask(task);
        hideAddTask();
        this.updateUI();
        
        // 显示成功提示
        this.showToast('任务添加成功！');
    }

    addReward() {
        const reward = {
            name: document.getElementById('rewardName').value,
            cost: document.getElementById('rewardCost').value,
            description: document.getElementById('rewardDescription').value
        };

        if (!reward.name.trim()) {
            this.showToast('请输入奖励名称');
            return;
        }
        const costNum = parseInt(reward.cost, 10);
        if (Number.isNaN(costNum) || costNum <= 0) {
            this.showToast('所需积分需为正整数');
            return;
        }

        dataManager.addReward(reward);
        hideAddReward();
        this.updateUI();
        
        // 显示成功提示
        this.showToast('奖励添加成功！');
    }

    addTemplate() {
        const template = {
            name: document.getElementById('templateName').value,
            points: document.getElementById('templatePoints').value,
            category: document.getElementById('templateCategory').value
        };

        if (!template.name.trim()) {
            this.showToast('请输入模板名称');
            return;
        }
        const pointsNum = parseInt(template.points, 10);
        if (Number.isNaN(pointsNum) || pointsNum <= 0) {
            this.showToast('积分需为正整数');
            return;
        }

        dataManager.addTemplate(template);
        hideAddTemplate();
        this.updateUI();
        
        this.showToast('模板添加成功！');
    }

    showToast(message) {
        // 简单的提示功能
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1001;
            font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

// 全局函数
function completeTask(taskId) {
    if (dataManager.completeTask(taskId)) {
        pageManager.updateUI();
        pageManager.showToast('任务完成！获得积分！');
    }
}

function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        dataManager.deleteTask(taskId);
        pageManager.updateUI();
        pageManager.showToast('任务已删除');
    }
}

function redeemReward(rewardId) {
    if (dataManager.redeemReward(rewardId)) {
        pageManager.updateUI();
        pageManager.showToast('奖励兑换成功！');
    } else {
        pageManager.showToast('积分不足！');
    }
}

function showAddTask() {
    document.getElementById('addTaskModal').classList.add('active');
    pageManager.renderTemplateQuickList();
    document.getElementById('taskName').focus();
}

function hideAddTask() {
    document.getElementById('addTaskModal').classList.remove('active');
    document.getElementById('addTaskForm').reset();
}

function showAddReward() {
    document.getElementById('addRewardModal').classList.add('active');
    document.getElementById('rewardName').focus();
}

function hideAddReward() {
    document.getElementById('addRewardModal').classList.remove('active');
    document.getElementById('addRewardForm').reset();
}

function showRewards() {
    pageManager.showPage('rewards');
}

function showTemplates() {
    pageManager.showPage('templates');
}

function showAddTemplate() {
    document.getElementById('addTemplateModal').classList.add('active');
    document.getElementById('templateName').focus();
}

function hideAddTemplate() {
    document.getElementById('addTemplateModal').classList.remove('active');
    document.getElementById('addTemplateForm').reset();
}

function useTemplate(templateId) {
    if (dataManager.createTaskFromTemplate(templateId)) {
        pageManager.updateUI();
        pageManager.showToast('任务已添加！');
    }
}

function useTemplateQuick(templateId) {
    if (dataManager.createTaskFromTemplate(templateId)) {
        hideAddTask(); // 关闭添加任务弹窗
        pageManager.updateUI();
        pageManager.showToast('任务已添加！');
    }
}

function deleteTemplate(templateId) {
    if (confirm('确定要删除这个模板吗？')) {
        dataManager.deleteTemplate(templateId);
        pageManager.updateUI();
        pageManager.showToast('模板已删除');
    }
}

function exportData() {
    const data = {
        tasks: dataManager.tasks,
        rewards: dataManager.rewards,
        templates: dataManager.templates,
        points: dataManager.points,
        history: dataManager.history,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskboard_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    pageManager.showToast('数据导出成功！');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (confirm('导入数据将覆盖当前数据，确定继续吗？')) {
                        dataManager.tasks = data.tasks || [];
                        dataManager.rewards = data.rewards || [];
                        dataManager.templates = data.templates || [];
                        dataManager.points = data.points || 0;
                        dataManager.history = data.history || [];
                        
                        dataManager.saveData('tasks', dataManager.tasks);
                        dataManager.saveData('rewards', dataManager.rewards);
                        dataManager.saveData('templates', dataManager.templates);
                        dataManager.saveData('points', dataManager.points);
                        dataManager.saveData('history', dataManager.history);
                        
                        pageManager.updateUI();
                        pageManager.showToast('数据导入成功！');
                    }
                } catch (error) {
                    pageManager.showToast('文件格式错误！');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function clearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
    }
}

// 初始化应用
let pageManager;
document.addEventListener('DOMContentLoaded', () => {
    pageManager = new PageManager();
});

// PWA 支持
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 使用相对路径，便于在子路径或本地文件部署
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
