const API_BASE = 'http://localhost:5000/api';

// DOM elements
const taskInput = document.getElementById('taskInput');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const chatInput = document.getElementById('chatInput');
const taskList = document.getElementById('taskList');
const chatMessages = document.getElementById('chatMessages');

// Store tasks for reference
let currentTasks = [];
let currentFilter = 'all';

// Dungeon-themed messages
const dungeonMessages = [
    "The dungeon listens... speak your command, mortal.",
    "Your quests await your attention, adventurer.",
    "The ancient stones record your every task.",
    "What quest would you have me inscribe?",
    "The dungeon's memory is vast... what shall we store?",
    "Speak, and your will shall be done.",
    "Another task for the eternal ledger...",
    "The runes are ready to record your command."
];

// Load tasks when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    const randomMessage = dungeonMessages[Math.floor(Math.random() * dungeonMessages.length)];
    addChatMessage('DUNGEON', randomMessage);
});

// Add a new task
async function addTask() {
    const description = taskInput.value.trim();
    if (!description) return;

    const taskData = {
        description: description,
        priority: taskPriority.value,
        due_date: taskDueDate.value || null
    };

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            taskInput.value = '';
            taskDueDate.value = '';
            loadTasks();
            addChatMessage('DUNGEON', 'Quest inscribed in the eternal ledger.');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        addChatMessage('DUNGEON', 'The ancient magic falters... try again.');
    }
}

// Update a task
async function updateTask(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            loadTasks();
            return true;
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
    return false;
}

// Mark task as complete
async function completeTask(id) {
    if (await updateTask(id, { completed: true })) {
        addChatMessage('DUNGEON', `Quest #${id} has been vanquished!`);
    }
}

// Delete a task
async function deleteTask(id) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTasks();
            addChatMessage('DUNGEON', `Quest #${id} has been erased from history.`);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        addChatMessage('DUNGEON', 'The dungeon refuses to forget this quest...');
    }
}

// Filter tasks
function filterTasks(filterType) {
    currentFilter = filterType;
    renderTasks();
}

// Render tasks based on current filter
function renderTasks() {
    let filteredTasks = currentTasks;
    
    if (currentFilter === 'high') {
        filteredTasks = currentTasks.filter(task => task.priority === 'high' && !task.completed);
    } else if (currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredTasks = currentTasks.filter(task => task.due_date === today && !task.completed);
    }
    
    taskList.innerHTML = '';
    filteredTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `priority-${task.priority} ${task.completed ? 'completed' : ''} ${isDueSoon(task.due_date) ? 'due-soon' : ''}`;
        
        const dueDateText = task.due_date ? `Due: ${formatDate(task.due_date)}` : 'No time constraint';
        const priorityText = {
            'high': '⚡ Urgent Quest',
            'medium': '⚔️ Common Quest',
            'low': '🕯️ Minor Quest'
        }[task.priority];
        
        li.innerHTML = `
            <div class="task-info">
                <span><strong>${index + 1}.</strong> ${task.description}</span>
                <div class="task-details">
                    ${dueDateText} | ${priorityText}
                </div>
            </div>
            <div class="task-actions">
                ${!task.completed ? 
                    `<button class="complete-btn" onclick="completeTask(${task.id})">✅ Complete</button>` : ''}
                <button class="delete-btn" onclick="deleteTask(${task.id})">☠️ Delete</button>
            </div>
        `;
        
        taskList.appendChild(li);
    });
}

// Check if task is due soon (within 2 days)
function isDueSoon(dueDate) {
    if (!dueDate) return false;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 2 && diffDays >= 0;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Load all tasks
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks`);
        const data = await response.json();
        
        // Store tasks for reference
        currentTasks = data.tasks;
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        addChatMessage('DUNGEON', 'The ancient archives are sealed... cannot access quests.');
    }
}

// Add message to chat
function addChatMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender.toLowerCase()}-message`;
    messageDiv.textContent = `${sender}: ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Process chat input with AI
async function processChat() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    addChatMessage('ADVENTURER', message);
    chatInput.value = 'The dungeon ponders...';
    chatInput.disabled = true;
    
    try {
        const aiResponse = simulateAIResponse(message);
        addChatMessage('DUNGEON', `I shall ${aiResponse.function} for you.`);
        await executeAIFunction(aiResponse);
        chatInput.value = '';
    } catch (error) {
        addChatMessage('DUNGEON', error.message);
        chatInput.value = '';
    } finally {
        chatInput.disabled = false;
        chatInput.focus();
    }
}

// Find task ID by position in the list
function findTaskIdByPosition(position) {
    const index = parseInt(position) - 1;
    if (index >= 0 && index < currentTasks.length) {
        return currentTasks[index].id;
    }
    return null;
}

// Parse date from natural language
function parseDateFromText(text) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (text.includes('today')) {
        return today.toISOString().split('T')[0];
    } else if (text.includes('tomorrow')) {
        return tomorrow.toISOString().split('T')[0];
    }
    
    // Try to parse specific date formats
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        return dateMatch[0];
    }
    
    return null;
}

// Parse priority from text
function parsePriorityFromText(text) {
    if (text.includes('high') || text.includes('urgent')) return 'high';
    if (text.includes('medium') || text.includes('common')) return 'medium';
    if (text.includes('low') || text.includes('minor')) return 'low';
    return null;
}

// Simulate AI response
function simulateAIResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('add') || lowerMsg.includes('create') || lowerMsg.includes('new')) {
        const addIndex = lowerMsg.indexOf('add');
        let description = message.substring(addIndex + 3).trim();
        
        // Extract priority if mentioned
        const priority = parsePriorityFromText(lowerMsg) || 'medium';
        
        // Remove priority words and other phrases
        description = description.replace(/(high|medium|low|urgent|minor|common|priority|to my|to the|to|my|the|list|please).*$/gi, '').trim();
        
        if (!description) {
            throw new Error("What quest would you have me inscribe?");
        }
        
        return { 
            function: "addTask", 
            parameters: { 
                description: description,
                priority: priority
            } 
        };
    }
    else if (lowerMsg.includes('change') || lowerMsg.includes('set') || lowerMsg.includes('update')) {
        // Handle priority changes
        if (lowerMsg.includes('priority')) {
            const positionMatch = message.match(/\d+/);
            if (positionMatch) {
                const taskId = findTaskIdByPosition(positionMatch[0]);
                const priority = parsePriorityFromText(lowerMsg);
                
                if (taskId && priority) {
                    return { 
                        function: "setPriority", 
                        parameters: { 
                            task_id: taskId,
                            priority: priority
                        } 
                    };
                }
            }
        }
        // Handle due date changes
        else if (lowerMsg.includes('date') || lowerMsg.includes('due') || lowerMsg.includes('time')) {
            const positionMatch = message.match(/\d+/);
            if (positionMatch) {
                const taskId = findTaskIdByPosition(positionMatch[0]);
                const dueDate = parseDateFromText(lowerMsg);
                
                if (taskId) {
                    return { 
                        function: "setDueDate", 
                        parameters: { 
                            task_id: taskId,
                            due_date: dueDate
                        } 
                    };
                }
            }
        }
    }
    else if (lowerMsg.includes('show') || lowerMsg.includes('view') || 
             lowerMsg.includes('what') || lowerMsg.includes('get') || lowerMsg.includes('list')) {
        return { function: "viewTasks", parameters: {} };
    }
    else if (lowerMsg.includes('complete') || lowerMsg.includes('done') || lowerMsg.includes('finish')) {
        const positionMatch = message.match(/\d+/);
        if (positionMatch) {
            const taskId = findTaskIdByPosition(positionMatch[0]);
            if (taskId) {
                return { function: "completeTask", parameters: { task_id: taskId } };
            }
        }
        throw new Error("I cannot find that quest. Speak its number.");
    }
    else if (lowerMsg.includes('delete') || lowerMsg.includes('remove') || lowerMsg.includes('erase')) {
        const positionMatch = message.match(/\d+/);
        if (positionMatch) {
            const taskId = findTaskIdByPosition(positionMatch[0]);
            if (taskId) {
                return { function: "deleteTask", parameters: { task_id: taskId } };
            }
        }
        throw new Error("I cannot find that quest. Speak its number.");
    }
    
    throw new Error("The dungeon does not understand. Try 'add [quest]', 'set quest 1 to urgent', 'complete quest 1', or 'delete quest 1'.");
}

// Execute the function determined by the AI
async function executeAIFunction(aiResponse) {
    switch(aiResponse.function) {
        case "addTask":
            taskInput.value = aiResponse.parameters.description;
            taskPriority.value = aiResponse.parameters.priority;
            await addTask();
            break;
        case "viewTasks":
            await loadTasks();
            break;
        case "completeTask":
            await completeTask(aiResponse.parameters.task_id);
            break;
        case "deleteTask":
            await deleteTask(aiResponse.parameters.task_id);
            break;
        case "setPriority":
            if (await updateTask(aiResponse.parameters.task_id, { priority: aiResponse.parameters.priority })) {
                const priorityText = {
                    'high': 'urgent',
                    'medium': 'common',
                    'low': 'minor'
                }[aiResponse.parameters.priority];
                addChatMessage('DUNGEON', `Quest #${aiResponse.parameters.task_id} is now marked as ${priorityText}.`);
            }
            break;
        case "setDueDate":
            if (await updateTask(aiResponse.parameters.task_id, { due_date: aiResponse.parameters.due_date })) {
                const dateText = aiResponse.parameters.due_date ? formatDate(aiResponse.parameters.due_date) : 'no time constraint';
                addChatMessage('DUNGEON', `Quest #${aiResponse.parameters.task_id} now has ${dateText}.`);
            }
            break;
        default:
            console.error("Unknown function:", aiResponse.function);
    }
}

// Allow pressing Enter to add tasks or send chat
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTask();
});

chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') processChat();
});