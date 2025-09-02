from flask import Flask, render_template, Response, jsonify, redirect, url_for, request, session
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import base64
import threading
import time
import json
from typing import Optional, Tuple

from reliable_sign_recognition import ReliableSignRecognizer

app = Flask(__name__)
app.config['SECRET_KEY'] = 'reliable_sign_language_translator_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
camera = None
sign_recognizer = None
is_camera_active = False
current_gesture = None
current_translation = None

def initialize_system():
    """Initialize the reliable sign language recognition system."""
    global sign_recognizer
    try:
        sign_recognizer = ReliableSignRecognizer()
        print("✅ Reliable system initialized successfully!")
        print("🎯 Using MediaPipe hand detection for accurate recognition!")
        return True
    except Exception as e:
        print(f"❌ Error initializing reliable system: {e}")
        return False

def get_camera():
    """Get camera instance."""
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            # Try different camera indices
            for i in range(4):
                camera = cv2.VideoCapture(i)
                if camera.isOpened():
                    print(f"📹 Found camera at index {i}")
                    break
        
        if camera.isOpened():
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            camera.set(cv2.CAP_PROP_FPS, 10)
            print("📹 Camera initialized successfully")
        else:
            print("❌ Failed to open camera")
            return None
    return camera

def release_camera():
    """Release camera resources."""
    global camera
    if camera is not None:
        camera.release()
        camera = None
        print("📹 Camera released")

def process_frame(frame: np.ndarray) -> Tuple[Optional[str], Optional[str]]:
    """
    Process frame for sign language recognition.
    
    Args:
        frame: Input frame
        
    Returns:
        Tuple of (gesture, translation)
    """
    global current_gesture, current_translation
    
    if sign_recognizer is None:
        return None, None
    
    try:
        gesture, translation = sign_recognizer.process_frame(frame)
        
        if gesture and translation:
            current_gesture = gesture
            current_translation = translation
            print(f"🎯 Recognized: {gesture} -> {translation}")
        elif gesture is None and translation is None:
            # No hands detected, clear current gesture
            current_gesture = None
            current_translation = None
        
        return current_gesture, current_translation
        
    except Exception as e:
        print(f"Error processing frame: {e}")
        return None, None

def generate_frames():
    """Generate video frames for streaming."""
    global is_camera_active
    
    camera = get_camera()
    if not camera or not camera.isOpened():
        print("❌ Error: Could not open camera")
        return
    
    print("📹 Starting video stream...")
    is_camera_active = True
    frame_count = 0
    
    while is_camera_active:
        ret, frame = camera.read()
        if not ret:
            print("❌ Error reading camera frame")
            break
        
        try:
            # Process frame for sign recognition
            gesture, translation = process_frame(frame)
            
            # Encode frame for transmission
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_data = base64.b64encode(buffer).decode('utf-8')
            
            # Send frame and recognition data via WebSocket
            socketio.emit('video_frame', {
                'frame': frame_data,
                'gesture': gesture,
                'translation': translation
            })
            
            frame_count += 1
            if frame_count % 30 == 0:  # Log every 30 frames (3 seconds at 10 FPS)
                if gesture:
                    print(f"📊 Frame {frame_count} - Gesture: {gesture}, Translation: {translation}")
                else:
                    print(f"📊 Frame {frame_count} - No gesture detected")
            
        except Exception as e:
            print(f"Error in generate_frames: {e}")
        
        # Control frame rate
        time.sleep(0.1)  # 10 FPS
    
    print("📹 Video stream stopped")
    release_camera()

@app.route('/')
def landing():
    """Public marketing landing page."""
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Simple session-based login (demo only)."""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        # Demo authentication: accept any non-empty credentials
        if email and password:
            session['user_email'] = email
            return redirect(url_for('app_home'))
        return render_template('login.html', error='Please enter valid credentials.', mode='login')
    return render_template('login.html', mode='login')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration."""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        # Demo registration: accept any non-empty credentials
        if username and email and password:
            session['user_email'] = email
            return redirect(url_for('app_home'))
        return render_template('login.html', error='Please fill in all fields.', mode='register')
    return render_template('login.html', mode='register')

@app.route('/logout')
def logout():
    session.pop('user_email', None)
    return redirect(url_for('landing'))

@app.route('/app')
def app_home():
    """Protected application page that renders the main translator UI."""
    if not session.get('user_email'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/start_camera')
def start_camera():
    """Start camera and recognition."""
    global is_camera_active
    
    try:
        if not is_camera_active:
            # Test camera availability
            test_camera = get_camera()
            if test_camera and test_camera.isOpened():
                is_camera_active = True
                threading.Thread(target=generate_frames, daemon=True).start()
                print("🎬 Camera started")
                return jsonify({'status': 'success', 'message': 'Camera started'})
            else:
                return jsonify({'status': 'error', 'message': 'Camera not available. Please check your webcam connection.'})
        else:
            return jsonify({'status': 'error', 'message': 'Camera already running'})
    except Exception as e:
        print(f"❌ Error starting camera: {e}")
        return jsonify({'status': 'error', 'message': f'Error starting camera: {str(e)}'})

@app.route('/stop_camera')
def stop_camera():
    """Stop camera and recognition."""
    global is_camera_active
    
    try:
        is_camera_active = False
        release_camera()
        print("🛑 Camera stopped")
        return jsonify({'status': 'success', 'message': 'Camera stopped'})
    except Exception as e:
        print(f"❌ Error stopping camera: {e}")
        return jsonify({'status': 'error', 'message': f'Error stopping camera: {str(e)}'})

@app.route('/get_gesture_info/<gesture>')
def get_gesture_info(gesture):
    """Get information about a specific gesture."""
    if sign_recognizer:
        info = sign_recognizer.get_gesture_info(gesture)
        return jsonify(info)
    else:
        return jsonify({'error': 'Sign recognizer not initialized'})

@app.route('/get_supported_gestures')
def get_supported_gestures():
    """Get list of supported gestures."""
    if sign_recognizer:
        gestures = sign_recognizer.get_supported_gestures()
        return jsonify({
            'gestures': gestures,
            'count': len(gestures)
        })
    else:
        return jsonify({'error': 'Sign recognizer not initialized'})

@app.route('/get_translator_info')
def get_translator_info():
    """Get information about the translator."""
    if sign_recognizer:
        info = sign_recognizer.get_translator_info()
        return jsonify(info)
    else:
        return jsonify({'error': 'Sign recognizer not initialized'})

@app.route('/learn')
def learn():
    """Learning page with gamification."""
    # Optional: require login for learn page
    if not session.get('user_email'):
        return redirect(url_for('login'))
    return render_template('learn.html')

@app.route('/module/greetings')
def module_greetings():
    """Render the Greetings & Basics learning module page."""
    if not session.get('user_email'):
        return redirect(url_for('login'))
    return render_template('module-greetings.html')

@app.route('/module/family')
def module_family():
    # Check if user is logged in
    if not session.get('user_email'):
        return redirect(url_for('login'))
    return render_template('module-family.html')

@app.route('/module/food')
def module_food():
    """Render the Food & Dining learning module page."""
    if not session.get('user_email'):
        return redirect(url_for('login'))
    return render_template('module-food.html')

@app.route('/dashboard')
def dashboard():
    """User dashboard page."""
    if not session.get('user_email'):
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection."""
    print("🔌 Client connected")
    emit('status', {'message': 'Connected to reliable sign language translator'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection."""
    print("🔌 Client disconnected")

@socketio.on('request_gesture_info')
def handle_gesture_info_request(data):
    """Handle gesture info request."""
    gesture = data.get('gesture')
    if gesture and sign_recognizer:
        info = sign_recognizer.get_gesture_info(gesture)
        emit('gesture_info', info)
    else:
        emit('gesture_info', {'error': 'Invalid request'})

if __name__ == '__main__':
    # Initialize system on startup
    if initialize_system():
        print("🚀 Starting reliable Flask application...")
        print("📊 Translator Info:", sign_recognizer.get_translator_info())
        print("🤟 Supported Gestures:", sign_recognizer.get_supported_gestures())
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    else:
        print("❌ Failed to initialize reliable system. Exiting.")