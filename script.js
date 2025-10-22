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
            createdAt: new Date().toISOString(),
            sortOrder: this.tasks.length // 添加排序字段
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
            createdAt: new Date().toISOString(),
            sortOrder: this.rewards.length // 添加排序字段
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

    // 排序相关方法
    updateTaskOrder(taskIds) {
        taskIds.forEach((taskId, index) => {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.sortOrder = index;
            }
        });
        this.saveData('tasks', this.tasks);
    }

    updateRewardOrder(rewardIds) {
        rewardIds.forEach((rewardId, index) => {
            const reward = this.rewards.find(r => r.id === rewardId);
            if (reward) {
                reward.sortOrder = index;
            }
        });
        this.saveData('rewards', this.rewards);
    }

    getSortedTasks() {
        return [...this.tasks].sort((a, b) => {
            // 确保有sortOrder字段，兼容旧数据
            const orderA = a.sortOrder !== undefined ? a.sortOrder : 999999;
            const orderB = b.sortOrder !== undefined ? b.sortOrder : 999999;
            return orderA - orderB;
        });
    }

    getSortedRewards() {
        return [...this.rewards].sort((a, b) => {
            // 确保有sortOrder字段，兼容旧数据
            const orderA = a.sortOrder !== undefined ? a.sortOrder : 999999;
            const orderB = b.sortOrder !== undefined ? b.sortOrder : 999999;
            return orderA - orderB;
        });
    }

    // 清理过期任务 - 保留最近一周的任务
    cleanupOldTasks() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const originalCount = this.tasks.length;
        
        // 过滤掉一周前的任务
        this.tasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= oneWeekAgo;
        });
        
        const cleanedCount = originalCount - this.tasks.length;
        
        if (cleanedCount > 0) {
            this.saveData('tasks', this.tasks);
            console.log(`清理了 ${cleanedCount} 个过期任务`);
        }
        
        return cleanedCount;
    }

    // 清理昨天的任务 - 只保留今日任务
    cleanupYesterdayTasks() {
        const today = new Date();
        const todayString = today.toDateString();
        
        const originalCount = this.tasks.length;
        
        // 只保留今日创建的任务
        this.tasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toDateString();
            return taskDate === todayString;
        });
        
        const cleanedCount = originalCount - this.tasks.length;
        
        if (cleanedCount > 0) {
            this.saveData('tasks', this.tasks);
            console.log(`清理了 ${cleanedCount} 个昨天的任务`);
        }
        
        return cleanedCount;
    }

    // 获取任务统计信息
    getTaskStats() {
        const today = new Date().toDateString();
        
        const allTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const todayTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toDateString();
            return taskDate === today;
        }).length;
        const yesterdayTasks = allTasks - todayTasks;
        
        return {
            total: allTasks,
            completed: completedTasks,
            today: todayTasks,
            yesterday: yesterdayTasks
        };
    }
}

// 全局数据管理器
const dataManager = new DataManager();

// 页面管理
class PageManager {
    constructor() {
        this.currentPage = 'home';
        this.taskSortMode = false;
        this.rewardSortMode = false;
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

        // 排序模式开关
        const taskSortToggle = document.getElementById('taskSortToggle');
        if (taskSortToggle) {
            taskSortToggle.addEventListener('click', () => this.toggleTaskSortMode());
        }
        const rewardSortToggle = document.getElementById('rewardSortToggle');
        if (rewardSortToggle) {
            rewardSortToggle.addEventListener('click', () => this.toggleRewardSortMode());
        }

        // 使用事件委托处理排序按钮点击
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('sort-btn')) {
                const taskId = target.dataset.taskId;
                const rewardId = target.dataset.rewardId;
                const direction = target.dataset.direction !== undefined ? parseInt(target.dataset.direction) : undefined;
                if (taskId && !isNaN(direction)) { moveTask(parseInt(taskId), direction); return; }
                if (rewardId && !isNaN(direction)) { moveReward(parseInt(rewardId), direction); return; }
                if (target.classList.contains('reward-delete-btn') && rewardId) { deleteRewardConfig(parseInt(rewardId)); return; }
                if (target.classList.contains('task-delete-btn') && taskId) { deleteTaskConfig(parseInt(taskId)); return; }
            }
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
        
        // 重新绑定排序按钮事件（确保在页面切换后正确绑定）
        this.bindSortButtons();
    }

    bindSortButtons() {
        const taskSortToggle = document.getElementById('taskSortToggle');
        if (taskSortToggle) {
            // 移除旧的事件监听器
            taskSortToggle.replaceWith(taskSortToggle.cloneNode(true));
            // 重新绑定
            document.getElementById('taskSortToggle').addEventListener('click', () => this.toggleTaskSortMode());
        }
        
        const rewardSortToggle = document.getElementById('rewardSortToggle');
        if (rewardSortToggle) {
            // 移除旧的事件监听器
            rewardSortToggle.replaceWith(rewardSortToggle.cloneNode(true));
            // 重新绑定
            document.getElementById('rewardSortToggle').addEventListener('click', () => this.toggleRewardSortMode());
        }
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
        this.renderTemplates();
        this.renderRewardHistory();

        // 更新按钮文案
        const taskSortToggle = document.getElementById('taskSortToggle');
        if (taskSortToggle) taskSortToggle.textContent = this.taskSortMode ? '完成排序' : '编辑排序';
        const rewardSortToggle = document.getElementById('rewardSortToggle');
        if (rewardSortToggle) rewardSortToggle.textContent = this.rewardSortMode ? '完成排序' : '编辑排序';
    }

    toggleTaskSortMode() {
        this.taskSortMode = !this.taskSortMode;
        document.body.classList.toggle('sorting-mode', this.taskSortMode || this.rewardSortMode);
        this.updateUI();
    }

    toggleRewardSortMode() {
        this.rewardSortMode = !this.rewardSortMode;
        document.body.classList.toggle('sorting-mode', this.taskSortMode || this.rewardSortMode);
        this.updateUI();
    }

    updateSortButtons() {
        // 更新任务排序按钮状态
        if (this.taskSortMode) {
            const tasks = dataManager.getSortedTasks();
            const taskItems = document.querySelectorAll('#tasksList .task-item');
            taskItems.forEach((item, index) => {
                const upBtn = item.querySelector('.sort-btn:first-child');
                const downBtn = item.querySelector('.sort-btn:last-child');
                if (upBtn) upBtn.disabled = index === 0;
                if (downBtn) downBtn.disabled = index === tasks.length - 1;
            });
        }

        // 更新奖励排序按钮状态
        if (this.rewardSortMode) {
            const rewards = dataManager.getSortedRewards();
            const rewardItems = document.querySelectorAll('#rewardsGrid .reward-item');
            rewardItems.forEach((item, index) => {
                const upBtn = item.querySelector('.sort-btn:first-child');
                const downBtn = item.querySelector('.sort-btn:last-child');
                if (upBtn) upBtn.disabled = index === 0;
                if (downBtn) downBtn.disabled = index === rewards.length - 1;
            });
        }
    }

    // 按照新顺序仅重排DOM，避免整列表重渲染导致闪烁
    reorderDomByIds(containerSelector, dataAttr, orderedIds) {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        const fragment = document.createDocumentFragment();
        orderedIds.forEach((id) => {
            const el = container.querySelector(`[${dataAttr}="${id}"]`);
            if (el) fragment.appendChild(el);
        });
        container.appendChild(fragment);
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
        // 只显示今日任务
        let tasks = dataManager.getTodayTasks();

        if (filter !== 'all') {
            tasks = tasks.filter(task => task.category === filter);
        }

        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        if (tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">今日还没有任务</div>
                    <div class="empty-hint">点击 + 按钮添加今日任务</div>
                </div>
            `;
        } else {
            tasksList.innerHTML = tasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''} ${this.taskSortMode ? 'sort-mode' : ''}" data-task-id="${task.id}">
                    <div class="task-info">
                        <div class="task-name">${esc(task.name)}</div>
                        <div class="task-meta">${esc(task.category)} • ${task.points}积分</div>
                    </div>
                    <div class="sort-actions">
                        <button class="sort-btn" data-task-id="${task.id}" data-direction="-1">上移</button>
                        <button class="sort-btn" data-task-id="${task.id}" data-direction="1">下移</button>
                        <button class="sort-btn danger task-delete-btn" data-task-id="${task.id}">删除</button>
                    </div>
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="task-btn complete-btn" onclick="completeTask(${task.id})">
                                完成
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // 编辑排序模式下不使用拖拽
    }

    renderRewards() {
        const rewardsGrid = document.getElementById('rewardsGrid');
        const rewards = dataManager.getSortedRewards();
        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        rewardsGrid.innerHTML = rewards.map(reward => {
            const canAfford = dataManager.points >= reward.cost;
            return `
                <div class="reward-item ${canAfford ? 'affordable' : ''} ${this.rewardSortMode ? 'sort-mode' : ''}" data-reward-id="${reward.id}">
                    <div class="reward-name">${esc(reward.name)}</div>
                    <div class="reward-cost">${reward.cost}积分</div>
                    <div class="reward-description">${esc(reward.description || '')}</div>
                    <div class="sort-actions">
                        <button class="sort-btn" data-reward-id="${reward.id}" data-direction="-1">上移</button>
                        <button class="sort-btn" data-reward-id="${reward.id}" data-direction="1">下移</button>
                        <button class="sort-btn danger reward-delete-btn" data-reward-id="${reward.id}">删除</button>
                    </div>
                    <button class="redeem-btn" 
                            onclick="redeemReward(${reward.id})" 
                            ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? '兑换' : '积分不足'}
                    </button>
                </div>
            `;
        }).join('');
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

    addDragListeners(type) {
        const container = type === 'task' ? 
            document.getElementById('tasksList') : 
            document.getElementById('rewardsGrid');
        
        if (!container) return;

        let draggedElement = null;

        container.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });

        container.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            draggedElement = null;
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (draggedElement && e.target !== draggedElement) {
                const targetElement = e.target.closest(`[data-${type}-id]`);
                if (targetElement && targetElement !== draggedElement) {
                    const container = targetElement.parentNode;
                    const draggedId = parseInt(draggedElement.dataset[`${type}Id`]);
                    const targetId = parseInt(targetElement.dataset[`${type}Id`]);
                    
                    // 获取所有元素的ID
                    const allElements = Array.from(container.children);
                    const allIds = allElements.map(el => parseInt(el.dataset[`${type}Id`]));
                    
                    // 重新排序
                    const draggedIndex = allIds.indexOf(draggedId);
                    const targetIndex = allIds.indexOf(targetId);
                    
                    allIds.splice(draggedIndex, 1);
                    allIds.splice(targetIndex, 0, draggedId);
                    
                    // 更新数据
                    if (type === 'task') {
                        dataManager.updateTaskOrder(allIds);
                    } else {
                        dataManager.updateRewardOrder(allIds);
                    }
                    
                    // 重新渲染
                    this.updateUI();
                }
            }
        });

        // 移动端触摸拖拽支持
        this.addTouchDrag(container, type);
    }

    addTouchDrag(container, type) {
        let isDragging = false;
        let draggingEl = null;

        const isHandle = (target) => {
            const sel = type === 'task' ? '.task-drag-handle' : '.reward-drag-handle';
            return !!target.closest(sel);
        };

        const getItemEl = (target) => target.closest(`[data-${type}-id]`);

        const onTouchStart = (e) => {
            const target = e.target;
            if (!isHandle(target)) return;
            draggingEl = getItemEl(target);
            if (!draggingEl) return;
            isDragging = true;
            draggingEl.classList.add('dragging');
            // 阻止页面滚动
            e.preventDefault();
        };

        const onTouchMove = (e) => {
            if (!isDragging || !draggingEl) return;
            const touch = e.touches && e.touches[0];
            if (!touch) return;
            const y = touch.clientY;
            e.preventDefault();
            const items = Array.from(container.querySelectorAll(`[data-${type}-id]`)).filter(el => el !== draggingEl);
            let insertBeforeEl = null;
            for (const el of items) {
                const rect = el.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (y < mid) {
                    insertBeforeEl = el;
                    break;
                }
            }
            if (insertBeforeEl) {
                container.insertBefore(draggingEl, insertBeforeEl);
            } else {
                container.appendChild(draggingEl);
            }
        };

        const onTouchEnd = () => {
            if (!isDragging || !draggingEl) return;
            draggingEl.classList.remove('dragging');
            const allIds = Array.from(container.children).map(el => parseInt(el.dataset[`${type}Id`]));
            if (type === 'task') {
                dataManager.updateTaskOrder(allIds);
            } else {
                dataManager.updateRewardOrder(allIds);
            }
            this.updateUI();
            isDragging = false;
            draggingEl = null;
        };

        container.addEventListener('touchstart', onTouchStart, { passive: false });
        container.addEventListener('touchmove', onTouchMove, { passive: false });
        container.addEventListener('touchend', onTouchEnd);
        container.addEventListener('touchcancel', onTouchEnd);
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

// 删除任务配置项，只在编辑排序模式中出现
function deleteTaskConfig(taskId) {
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

// 删除奖励配置项（不影响历史）
function deleteRewardConfig(rewardId) {
    if (confirm('确定要删除这个奖励吗？（不影响历史记录）')) {
        dataManager.deleteReward(rewardId);
        pageManager.updateUI();
        pageManager.showToast('奖励已删除');
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

function toggleTaskSortMode() {
    pageManager.toggleTaskSortMode();
}

function toggleRewardSortMode() {
    pageManager.toggleRewardSortMode();
}

function moveTask(taskId, direction) {
    const tasks = dataManager.getSortedTasks();
    const ids = tasks.map(t => t.id);
    const idx = ids.indexOf(taskId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ids.length) return;
    // 记录当前滚动位置与元素位置
    const container = document.getElementById('tasksList');
    const itemEl = container.querySelector(`[data-task-id="${taskId}"]`);
    const prevRect = itemEl ? itemEl.getBoundingClientRect() : null;

    // 更新数据
    ids.splice(idx, 1);
    ids.splice(newIdx, 0, taskId);
    dataManager.updateTaskOrder(ids);
    
    // 重排DOM顺序，避免整列表重渲染
    pageManager.reorderDomByIds('#tasksList', 'data-task-id', ids);
    // 保持视觉位置，减少抖动
    if (itemEl && prevRect) {
        const newRect = itemEl.getBoundingClientRect();
        const deltaY = newRect.top - prevRect.top;
        if (deltaY !== 0) {
            // 使用scrollBy平滑抵消位移
            container.scrollBy({ top: deltaY, behavior: 'auto' });
        }
    }
    // 更新按钮状态
    pageManager.updateSortButtons();
}

function moveReward(rewardId, direction) {
    const rewards = dataManager.getSortedRewards();
    const ids = rewards.map(r => r.id);
    const idx = ids.indexOf(rewardId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ids.length) return;
    const container = document.getElementById('rewardsGrid');
    const itemEl = container.querySelector(`[data-reward-id="${rewardId}"]`);
    const prevRect = itemEl ? itemEl.getBoundingClientRect() : null;

    // 更新数据
    ids.splice(idx, 1);
    ids.splice(newIdx, 0, rewardId);
    dataManager.updateRewardOrder(ids);
    
    // 重排DOM顺序，避免整列表重渲染
    pageManager.reorderDomByIds('#rewardsGrid', 'data-reward-id', ids);
    if (itemEl && prevRect) {
        const newRect = itemEl.getBoundingClientRect();
        const deltaY = newRect.top - prevRect.top;
        if (deltaY !== 0) {
            container.scrollBy({ top: deltaY, behavior: 'auto' });
        }
    }
    // 更新按钮状态
    pageManager.updateSortButtons();
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

function cleanupOldTasks() {
    const today = new Date().toDateString();
    const yesterdayTasks = dataManager.tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toDateString();
        return taskDate !== today;
    });
    
    if (yesterdayTasks.length === 0) {
        pageManager.showToast('没有需要清理的昨天任务');
        return;
    }
    
    if (confirm(`发现 ${yesterdayTasks.length} 个昨天的任务，确定要清理吗？\n\n清理规则：\n• 只保留今日创建的任务\n• 清理所有昨天的任务（无论是否完成）\n• 每天重新规划任务`)) {
        const cleanedCount = dataManager.cleanupYesterdayTasks();
        pageManager.updateUI();
        pageManager.showToast(`清理完成！删除了 ${cleanedCount} 个昨天的任务`);
    }
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
    // 启动时自动清理昨天的任务
    const cleanedCount = dataManager.cleanupYesterdayTasks();
    if (cleanedCount > 0) {
        console.log(`应用启动时自动清理了 ${cleanedCount} 个昨天的任务`);
    }
    
    pageManager = new PageManager();
});

// PWA 支持
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 使用相对路径，便于在子路径或本地文件部署
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                // 立即尝试更新到新SW，避免卡在旧缓存策略
                if (registration.update) registration.update();
                console.log('SW registered: ', registration);

                // 当新SW接管后，自动刷新一次，确保加载最新资源
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!window.__reloadedBySW) {
                        window.__reloadedBySW = true;
                        window.location.reload();
                    }
                });
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
