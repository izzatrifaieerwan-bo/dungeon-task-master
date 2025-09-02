from flask import Flask, jsonify, request, abort, send_from_directory
from datetime import datetime, date
from functools import wraps
import os
from flask_cors import CORS  # Add this import

app = Flask(__name__)

# Add CORS support - this is the simplest and most reliable approach
CORS(app)

FRONTEND_PATH = os.path.join(os.path.dirname(__file__), '../frontend')

# In-memory storage for tasks
tasks = []
next_id = 1

@app.route('/')
def serve_frontend():
    return send_from_directory(FRONTEND_PATH, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(FRONTEND_PATH, path)

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Return all tasks"""
    return jsonify({'tasks': tasks})

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    global next_id
    
    if not request.json or 'description' not in request.json:
        abort(400)
    
    # Parse due date if provided
    due_date = request.json.get('due_date')
    if due_date:
        try:
            due_date = datetime.strptime(due_date, '%Y-%m-%d').date().isoformat()
        except:
            due_date = None
    
    task = {
        'id': next_id,
        'description': request.json['description'],
        'priority': request.json.get('priority', 'medium'),
        'due_date': due_date,
        'completed': False,
        'created_at': datetime.now().isoformat()
    }
    
    tasks.append(task)
    next_id += 1
    
    return jsonify({'task': task}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if task is None:
        abort(404)
    
    if 'completed' in request.json:
        task['completed'] = request.json['completed']
    if 'priority' in request.json:
        task['priority'] = request.json['priority']
    if 'due_date' in request.json:
        due_date = request.json['due_date']
        if due_date:
            try:
                task['due_date'] = datetime.strptime(due_date, '%Y-%m-%d').date().isoformat()
            except:
                task['due_date'] = None
        else:
            task['due_date'] = None
    if 'description' in request.json:
        task['description'] = request.json['description']
    
    return jsonify({'task': task})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    global tasks
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if task is None:
        abort(404)
    
    tasks = [t for t in tasks if t['id'] != task_id]
    return jsonify({'result': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)