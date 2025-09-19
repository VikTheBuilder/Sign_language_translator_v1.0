## UnSpoken – Sign Language Translator

Real-time sign language recognition using Python, Flask, Flask-SocketIO, OpenCV, NumPy, and MediaPipe. The app streams webcam frames from the server to the browser and shows recognized gestures with translations.

### Tech Stack
- Python (Flask)
- Flask-SocketIO (real-time updates)
- OpenCV (webcam/video frames)
- NumPy (numeric ops)
- MediaPipe (hand landmarks)
- Vanilla HTML/CSS/JS on the frontend (Socket.IO client)

### Prerequisites
- Python 3.9–3.12
- pip
- A working webcam
- Windows/macOS/Linux

Note for Windows: allow camera access in system privacy settings and let Python through the firewall on first run.

### Clone
```bash
git clone <your-repo-url>.git
cd <repo-folder>
```

### Create and activate a virtual environment (recommended)

Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Windows (CMD):
```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat
```

Windows (Git Bash):
```bash
python -m venv .venv
source .venv/Scripts/activate
```

macOS/Linux (bash/zsh):
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Install dependencies

Install all dependencies (includes mediapipe now):
```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

Optional: install an async server for true WebSocket support (recommended)

Flask-SocketIO can run in threading mode (XHR polling). For full WebSocket transport, install one of:
```bash
pip install eventlet
# or
pip install gevent gevent-websocket
```

### Run the app

If your virtual environment is not active, activate it first:

- Windows (PowerShell):
```powershell
.\.venv\Scripts\Activate.ps1
```

- Windows (CMD):
```cmd
.\.venv\Scripts\activate.bat
```

- Windows (Git Bash):
```bash
source .venv/Scripts/activate
```

- macOS/Linux (bash/zsh):
```bash
source .venv/bin/activate
```

Then run the server:
```bash
python reliable_app.py
```

Then open `http://localhost:5000` in your browser.

If you installed `eventlet` or `gevent`, Flask-SocketIO will automatically use it and provide proper WebSocket transport.

### How it works (at a glance)
- `reliable_app.py`: Flask app + Socket.IO server, webcam capture with OpenCV, emits frames and recognition results to clients.
- `reliable_sign_recognition.py`: Uses MediaPipe Hands to detect landmarks and classify simple gestures to text.
- Frontend: `templates/` (HTML), `static/` (CSS/JS). Socket.IO client receives frames/labels and updates the UI.

### File structure (key parts)
```
reliable_app.py                 # Flask + Socket.IO server
reliable_sign_recognition.py    # MediaPipe-based recognizer
requirements.txt                # Base deps (install mediapipe separately)
templates/
  index.html                    # Main UI
  learn.html                    # Learning page
static/
  css/style.css
  js/app.js                     # Socket.IO client, UI logic
  js/learn.js                   # Learn page interactions
  img/person-signing.svg
```

### Common issues & fixes
- Camera not found: If you have multiple cameras or virtual devices, the server tries indices 0–3. Ensure the webcam isn’t in use by another app.
- Browser shows no video: The server sends JPEGs via Socket.IO; check devtools console for errors and allow mixed content if behind proxies.
- MediaPipe install errors: Ensure you’re on a supported Python version (3.9–3.12). Try `pip install --upgrade pip setuptools wheel` and then `pip install mediapipe`.
- Firewall prompts: Allow Python to communicate on private networks when prompted.

### One-shot setup (copy/paste)

Windows PowerShell:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python reliable_app.py
```

Windows CMD:
```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python reliable_app.py
```

Windows Git Bash:
```bash
python -m venv .venv
source .venv/Scripts/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python reliable_app.py
```

macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python reliable_app.py
```

### Development tips
- Auto-reload: set `debug=True` (already set) for code reloads.
- Port change: edit the `socketio.run(..., port=5000)` line in `reliable_app.py`.

### License
Add your license here.

