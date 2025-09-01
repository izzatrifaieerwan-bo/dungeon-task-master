from flask import Flask, jsonify, request, abort, send_from_directory
from datetime import datetime, date
from functools import wraps
import os

app = Flask(__name__)

FRONTEND_PATH = os.path.join(os.path.dirname(__file__), '../frontend')

# Simple CORS handling
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

app.after_request(add_cors_headers)

# Handle preflight OPTIONS requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE')
        return response

# In-memory storage for tasks
tasks = []
next_id = 1

@app.route('/')
def serve_frontend():
    return send_from_directory(FRONTEND_PATH, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(FRONTEND_PATH, path)

@app.route('/api/tasks', methods=['GET', 'OPTIONS'])
def get_tasks():
    """Return all tasks"""
    return jsonify({'tasks': tasks})

@app.route('/api/tasks', methods=['POST', 'OPTIONS'])
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

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'OPTIONS'])
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

@app.route('/api/tasks/<int:task_id>', methods=['DELETE', 'OPTIONS'])
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