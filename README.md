# Dungeon Task Master

A mystical task management application with an ancient dungeon theme and AI-powered chat interface. Manage your quests with the help of a sentient dungeon consciousness powered by Google's Gemini AI.

## Features

🏰 **Dungeon-Themed Interface**
- Medieval-inspired design with torches and stone aesthetics
- Immersive dungeon atmosphere with custom fonts and animations
- Tasks are called "quests" with dungeon-themed terminology

⚔️ **Quest Management**
- Add, complete, and delete quests
- Set priority levels (Minor, Common, Urgent quests)
- Due date tracking with visual indicators
- Filter quests by priority and due dates

🤖 **AI Dungeon Master**
- Natural language processing using Google Gemini AI
- Chat with the dungeon consciousness in plain English
- AI interprets commands and manages quests automatically
- Dungeon-themed responses and personality

✨ **Interactive Features**
- Real-time quest updates
- Responsive design for all devices
- Visual feedback for due dates and priorities
- Smooth animations and hover effects

## Project Structure

```
dungeon-task-master/
├── app.py                      # Flask backend application
├── requirements.txt            # Python dependencies
├── .env                       # Environment variables (create from .env.example)
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
├── templates/
│   └── index.html            # Main HTML template
└── static/
    ├── css/
    │   └── styles.css        # Dungeon theme styles
    └── js/
        └── script.js         # Frontend JavaScript
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dungeon-task-master
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

5. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

## Running the Application

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Open your browser**
   Navigate to `http://localhost:5000`

3. **Start managing your quests!**

## Usage

### Adding Quests
- Use the quest input form to add new tasks
- Set priority levels and due dates
- Click "Add Quest" or press Enter

### AI Chat Interface
The dungeon consciousness understands natural language commands:

- "Add a quest to buy groceries"
- "Complete quest 3"
- "Delete the first task"
- "Show me urgent quests"
- "Set quest 2 to high priority"

### Quest Filtering
- **All Quests**: View all your quests
- **Urgent Only**: Show high-priority quests
- **Due Today**: Show quests due today

## API Endpoints

- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/<id>` - Update a task
- `DELETE /api/tasks/<id>` - Delete a task
- `POST /api/chat` - Process AI chat messages

## Deployment

### Local Development
```bash
python app.py
```

### Production (using Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Environment Variables for Production
```bash
FLASK_DEBUG=False
FLASK_ENV=production
SECRET_KEY=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key
PORT=8000
```

## Technologies Used

- **Backend**: Flask (Python)
- **AI**: Google Gemini AI
- **Frontend**: HTML, CSS, JavaScript
- **Styling**: Custom CSS with medieval theme
- **Fonts**: Google Fonts (MedievalSharp, Cinzel)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini AI for the intelligent chat functionality
- Medieval and fantasy themes for inspiration
- Flask community for the excellent web framework