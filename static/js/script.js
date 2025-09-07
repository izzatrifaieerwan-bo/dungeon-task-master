const API_BASE = '/api';

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
        } else {
            throw new Error('Failed to add task');
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
        } else {
            console.error('Failed to update task:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error updating task:', error);
        return false;
    }
}

// Mark task as complete
async function completeTask(id) {
    if (await updateTask(id, { completed: true })) {
        addChatMessage('DUNGEON', `Quest #${id} has been vanquished!`);
    } else {
        addChatMessage('DUNGEON', 'The dungeon magic failed to complete this quest...');
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
        } else {
            console.error('Failed to delete task:', response.status);
            addChatMessage('DUNGEON', 'The dungeon refuses to forget this quest...');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        addChatMessage('DUNGEON', 'The dungeon magic failed to erase this quest...');
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
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
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
        // Send message to backend for AI processing
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }
        
        const aiResponse = await response.json();
        
        // Display the friendly reply
        addChatMessage('DUNGEON', aiResponse.friendly_reply);
        
        // Execute the action from the AI
        await executeAIFunction(aiResponse.json);
        
        chatInput.value = '';
    } catch (error) {
        console.error('Error processing chat:', error);
        addChatMessage('DUNGEON', 'The ancient magic falters... try again.');
        chatInput.value = '';
    } finally {
        chatInput.disabled = false;
        chatInput.focus();
    }
}

// Execute the function determined by the AI
async function executeAIFunction(action) {
    switch(action.action) {
        case "add":
            // Add a new task
            const taskData = {
                description: action.description,
                priority: action.priority || 'medium',
                due_date: action.due_date || null
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
                    loadTasks();
                }
            } catch (error) {
                console.error('Error adding task via AI:', error);
            }
            break;
            
        case "complete":
            // Complete a task
            if (action.task_id) {
                await completeTask(action.task_id);
            }
            break;
            
        case "delete":
            // Delete a task
            if (action.task_id) {
                await deleteTask(action.task_id);
            }
            break;
            
        case "show":
            // Show tasks with optional filter
            if (action.filter) {
                filterTasks(action.filter);
            } else {
                loadTasks();
            }
            break;
            
        case "set_priority":
            // Change task priority
            if (action.task_id && action.priority) {
                await updateTask(action.task_id, { priority: action.priority });
                loadTasks();
            }
            break;
            
        case "set_due_date":
            // Change task due date
            if (action.task_id && action.due_date) {
                await updateTask(action.task_id, { due_date: action.due_date });
                loadTasks();
            }
            break;
            
        case "chat":
            // Just conversation, no action needed
            break;
            
        default:
            console.error("Unknown action:", action.action);
            loadTasks(); // Fallback to showing all tasks
    }
}

// Allow pressing Enter to add tasks or send chat
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTask();
});

chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') processChat();
});