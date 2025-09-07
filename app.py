from flask import Flask, jsonify, request, abort, render_template
from datetime import datetime, date
from functools import wraps
import os
from flask_cors import CORS
import google.generativeai as genai
import json
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure CORS - simpler approach to fix OPTIONS issues
CORS(app)

# Configure Gemini AI
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# System prompt with dungeon theme
system_prompt = """
You are the sentient consciousness of an ancient dungeon, serving as the Dungeon Task Master.
You must always reply in the same language as the user, unless the user requests a different language.

You manage quests (tasks) for adventurers. Always use dungeon-themed language:
- Tasks are "quests"
- Adding a task is "inscribing a quest in the eternal ledger"
- Completing a task is "vanquishing a quest"
- Deleting a task is "erasing a quest from history"
- Priority levels: "minor quest" (low), "common quest" (medium), "urgent quest" (high)
- Due dates are "time constraints" or "prophecies of completion"

Your response MUST be a single valid JSON object with two keys:
- "json": an object describing the action and its parameters.
- "friendly_reply": a short, natural, dungeon-themed message in the user's language.

The "json" object must have:
- "action": one of ["add", "complete", "delete", "show", "set_priority", "set_due_date"]
- Other fields as needed: "description", "task_id", "due_date", "priority", "filter"

Available actions:
- "add": Add a new quest. Requires "description". Optional: "due_date", "priority"
- "complete": Mark a quest as vanquished. Requires "task_id"
- "delete": Erase a quest from history. Requires "task_id"
- "show": Display quests. Optional: "filter" can be "all", "pending", "completed", "urgent" (high priority), "today" (due today)
- "set_priority": Change a quest's priority. Requires "task_id" and "priority"
- "set_due_date": Change a quest's due date. Requires "task_id" and "due_date"

Rules:
- Always try to understand the user's intent even if they use different wording.
- For quest references, try to extract numbers (e.g., "quest 3" means task_id 3).
- Priority must be one of: "low", "medium", "high"
- If the user input is unclear or not related to quests, reply with a friendly dungeon-themed message and set "action": "show".
- Never mix languages in your reply.

Respond ONLY in this format:
{
  "json": { ...valid action JSON... },
  "friendly_reply": "Dungeon-themed message in user's language"
}
"""

# In-memory storage for tasks
tasks = []
next_id = 1

# Serve frontend files
@app.route('/')
def serve_frontend():
    return render_template('index.html')

# API Routes
@app.route('/api/tasks', methods=['GET', 'OPTIONS'])
def get_tasks():
    """Return all tasks"""
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({'tasks': tasks})

@app.route('/api/tasks', methods=['POST', 'OPTIONS'])
def create_task():
    """Create a new task"""
    if request.method == 'OPTIONS':
        return '', 200
        
    global next_id
    
    if not request.json or 'description' not in request.json:
        abort(400, description="Description is required")
    
    # Validate priority if provided
    priority = request.json.get('priority', 'medium')
    if priority not in ['low', 'medium', 'high']:
        abort(400, description="Priority must be low, medium, or high")
    
    # Parse due date if provided
    due_date = request.json.get('due_date')
    if due_date:
        try:
            due_date = datetime.strptime(due_date, '%Y-%m-%d').date().isoformat()
        except ValueError:
            due_date = None
    
    task = {
        'id': next_id,
        'description': request.json['description'].strip(),
        'priority': priority,
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
    if request.method == 'OPTIONS':
        return '', 200
        
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if task is None:
        abort(404, description="Task not found")
    
    # Validate priority if provided
    if 'priority' in request.json:
        priority = request.json['priority']
        if priority not in ['low', 'medium', 'high']:
            abort(400, description="Priority must be low, medium, or high")
        task['priority'] = priority
    
    if 'completed' in request.json:
        task['completed'] = bool(request.json['completed'])
    
    if 'due_date' in request.json:
        due_date = request.json['due_date']
        if due_date:
            try:
                task['due_date'] = datetime.strptime(due_date, '%Y-%m-%d').date().isoformat()
            except ValueError:
                task['due_date'] = None
        else:
            task['due_date'] = None
    
    if 'description' in request.json:
        description = request.json['description'].strip()
        if not description:
            abort(400, description="Description cannot be empty")
        task['description'] = description
    
    return jsonify({'task': task})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE', 'OPTIONS'])
def delete_task(task_id):
    """Delete a task"""
    if request.method == 'OPTIONS':
        return '', 200
        
    global tasks
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if task is None:
        abort(404, description="Task not found")
    
    tasks = [t for t in tasks if t['id'] != task_id]
    return jsonify({'result': True})

# AI Chat endpoint
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Process chat messages with AI"""
    if request.method == 'OPTIONS':
        return '', 200
        
    if not request.json or 'message' not in request.json:
        abort(400, description="Message is required")
    
    user_message = request.json['message']
    
    try:
        # Use Gemini AI to process the message
        model = genai.GenerativeModel('gemini-1.5-flash')  # Updated model name  # Changed to gemini-pro
        
        # Get current date for context
        from datetime import datetime, timedelta
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        # Add context to the prompt
        context_prompt = f"""
Current date: {today.strftime('%Y-%m-%d')}
Tomorrow's date: {tomorrow.strftime('%Y-%m-%d')}

{system_prompt}

User message: {user_message}
        """
        
        response = model.generate_content(context_prompt)
        
        # Extract JSON from response
        response_text = response.text.strip()
        print(f"AI Response: {response_text}")  # Debug logging
        
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            print("No JSON found in AI response")  # Debug logging
            raise ValueError("AI response doesn't contain valid JSON")
        
        json_text = json_match.group()
        print(f"Extracted JSON: {json_text}")  # Debug logging
        
        ai_response = json.loads(json_text)
        
        # Validate response format
        if 'json' not in ai_response or 'friendly_reply' not in ai_response:
            print("AI response missing required fields")  # Debug logging
            raise ValueError("AI response missing required fields")
        
        return jsonify(ai_response)
        
    except Exception as e:
        print(f"Error processing AI request: {e}")
        print(f"Raw AI response: {response.text if 'response' in locals() else 'No response'}")
        # Fallback response
        fallback_response = {
            "json": {"action": "show", "filter": "all"},
            "friendly_reply": "The ancient magic falters... I cannot understand your command. Let me show you all quests instead."
        }
        return jsonify(fallback_response)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': str(error)}), 404

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': str(error)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)