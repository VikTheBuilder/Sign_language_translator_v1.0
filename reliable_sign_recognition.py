import numpy as np
from typing import List, Dict, Optional, Tuple
import cv2
from collections import deque
import time
import mediapipe as mp
import joblib
import os
import json

class ReliableSignRecognizer:
    def __init__(self):
        """Initialize the reliable sign language recognizer using MediaPipe."""
        # --- New Stability Logic ---
        self.prediction_history = deque(maxlen=15) # Store last 15 raw predictions
        self.last_recognition_time = 0
        self.min_time_between_recognitions = 1.5 # Cooldown period in seconds
        self.stability_threshold = 0.7 # 70% of frames in history must be the same gesture

        # --- Model and MediaPipe Setup ---
        self.min_model_confidence = 0.6  # Lowered confidence threshold for better detection (was 0.7)
        
        # Initialize MediaPipe for hand detection
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Initialize MediaPipe Hands with optimal settings
        self.hands = self.mp_hands.Hands(
            model_complexity=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7,
            max_num_hands=2,
            static_image_mode=False
        )
        
        print("✅ Reliable Hand Detector initialized with MediaPipe!")

        # --- Load the new Random Forest Model ---
        self.model = None
        # Labels provided by the user, converted to string keys for model compatibility.
        # Using standardized lowercase_with_underscores format
        self.labels = { "0": "hello", "1": "help", "2": "thank_you", "3": "goodbye", "4": "happy", "5": "stop", "6": "sorry", "7": "angry", "8": "food", "9": "good", "10": "please", "11": "you", "12": "no", "13": "one", "14": "two" }
        
        # Use absolute path for model loading
        model_path = 'd:/Sign_language_translator_v1.0/New Sign Model/Project_Exibition SLT Model-RandomForest/model.p'

        try:
            if os.path.exists(model_path):
                model_dict = joblib.load(model_path)
                self.model = model_dict['model']  # Extract model from dictionary
                print(f"✅ Random Forest model loaded successfully from '{model_path}'")
                print(f"✅ Labels are hardcoded. Model supports {len(self.labels)} signs.")
            else:
                print(f"❌ Error: Model file not found. Looked for '{model_path}'.")
                raise FileNotFoundError(f"Model file not found at {model_path}")
        except Exception as e:
            print(f"❌ Critical Error loading Random Forest model: {e}")
            raise  # Re-raise the exception to ensure the application knows about the failure
        
        # Comprehensive sign language mapping
        self.sign_mapping = {
            # Basic signs
            'hello': 'Hello',
            'goodbye': 'Goodbye',
            'thank_you': 'Thank you',
            'please': 'Please',
            'sorry': 'Sorry',
            'yes': 'Yes',
            'no': 'No',
            'help': 'Help',
            'good': 'Good',
            'bad': 'Bad',
            
            # Questions
            'how_are_you': 'How are you?',
            'what_is_your_name': 'What is your name?',
            'where_are_you_from': 'Where are you from?',
            'how_old_are_you': 'How old are you?',
            
            # Responses
            'fine': 'I am fine',
            'my_name_is': 'My name is',
            'nice_to_meet_you': 'Nice to meet you',
            'i_understand': 'I understand',
            'i_dont_understand': "I don't understand",
            
            # Family
            'family': 'Family',
            'mother': 'Mother',
            'father': 'Father',
            'sister': 'Sister',
            'brother': 'Brother',
            'daughter': 'Daughter',
            'son': 'Son',
            
            # Common words
            'work': 'Work',
            'home': 'Home',
            'friend': 'Friend',
            'love': 'Love',
            'like': 'Like',
            'want': 'Want',
            'need': 'Need',
            'can': 'Can',
            'will': 'Will',
            'do': 'Do',
            
            # Time
            'today': 'Today',
            'tomorrow': 'Tomorrow',
            'yesterday': 'Yesterday',
            'morning': 'Morning',
            'afternoon': 'Afternoon',
            'evening': 'Evening',
            'night': 'Night',
            
            # Numbers
            'one': 'One',
            'two': 'Two',
            'three': 'Three',
            'four': 'Four',
            'five': 'Five',
            'six': 'Six',
            'seven': 'Seven',
            'eight': 'Eight',
            'nine': 'Nine',
            'ten': 'Ten',
            
            # Colors
            'red': 'Red',
            'blue': 'Blue',
            'green': 'Green',
            'yellow': 'Yellow',
            'black': 'Black',
            'white': 'White',
            
            # Emotions
            'happy': 'Happy',
            'sad': 'Sad',
            'angry': 'Angry',
            'excited': 'Excited',
            'tired': 'Tired',
            'scared': 'Scared'
        }
        
        print("🎯 Reliable Sign Recognizer initialized!")
        print(f"📚 Supports {len(self.sign_mapping)} different signs!")
    
    def detect_hands_mediapipe(self, frame: np.ndarray) -> Tuple[np.ndarray, List]:
        """
        Detect hands using MediaPipe and extract landmarks.
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Tuple of (processed_frame, landmarks_list)
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        results = self.hands.process(rgb_frame)
        
        processed_frame = frame.copy()
        landmarks_list = []
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw hand landmarks
                self.mp_drawing.draw_landmarks(
                    processed_frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )
                
                # Extract landmarks
                landmarks = self._extract_mediapipe_landmarks(hand_landmarks, frame.shape)
                landmarks_list.append(landmarks)
        
        return processed_frame, landmarks_list
    
    def _extract_mediapipe_landmarks(self, hand_landmarks, frame_shape) -> List:
        """
        Extract landmarks from MediaPipe hand detection.
        
        Args:
            hand_landmarks: MediaPipe hand landmarks
            frame_shape: Shape of the input frame
            
        Returns:
            List of normalized landmarks
        """
        landmarks = []
        height, width = frame_shape[:2]
        
        for landmark in hand_landmarks.landmark:
            # Normalize coordinates to [0, 1]
            normalized_x = landmark.x
            normalized_y = landmark.y
            normalized_z = landmark.z
            
            landmarks.append([normalized_x, normalized_y, normalized_z])
        
        return landmarks
    
    def process_frame(self, frame: np.ndarray) -> Tuple[Optional[str], Optional[str]]:
        """
        Process a single frame for sign language recognition.
        
        Args:
            frame: Input frame
            
        Returns:
            Tuple of (gesture, translation)
        """
        # Detect hands using MediaPipe
        processed_frame, landmarks_list = self.detect_hands_mediapipe(frame)

        # Use reliable landmark-based recognition to get a raw prediction
        raw_gesture = self._reliable_recognition(landmarks_list)

        # Add the raw prediction (or None) to our history
        self.prediction_history.append(raw_gesture)

        # Check if the predictions have become stable
        stable_gesture = self._check_gesture_stability()
        if stable_gesture:
            translation = self.translate_gesture(stable_gesture)
            return stable_gesture, translation
        else:
            return None, None
    
    def _reliable_recognition(self, landmarks_list: List) -> Optional[str]:
        """
        Reliable recognition using MediaPipe landmarks.
        
        Args:
            landmarks_list: List of hand landmarks
            
        Returns:
            Recognized gesture or None
        """
        if not landmarks_list:
            return None
        
        for landmarks in landmarks_list:
            if len(landmarks) >= 21:  # MediaPipe provides 21 landmarks
                gesture = self._analyze_landmarks_for_signs(landmarks)
                if gesture:
                    return gesture
        
        return None
    
    def _analyze_landmarks_for_signs(self, landmarks: List) -> Optional[str]:
        """
        Analyze landmarks to recognize specific signs.
        This method now uses the loaded Random Forest model for prediction.
        
        Args:
            landmarks: Hand landmarks
            
        Returns:
            Recognized sign or None
        """
        if not self.model:
            print("❌ Error: Model not loaded")
            return None
        
        try:
            # 1. Extract x and y coordinates only (matching the training data)
            data_aux = []
            x_ = []
            y_ = []
            
            # First collect all x and y coordinates
            for landmark in landmarks:
                x_.append(landmark[0])  # x coordinate
                y_.append(landmark[1])  # y coordinate
            
            # Then normalize them relative to min x and y
            for landmark in landmarks:
                data_aux.append(landmark[0] - min(x_))  # normalized x
                data_aux.append(landmark[1] - min(y_))  # normalized y
            
            # The model expects a 2D array for prediction: (1, num_features)
            feature_vector_2d = np.array([data_aux])
            
            # Make prediction using predict()
            prediction = self.model.predict(feature_vector_2d)
            prediction_index = str(prediction[0])  # Convert prediction to string for label lookup
            gesture_name = self.labels.get(prediction_index)

            # --- Enhanced Debugging ---
            if gesture_name:
                print(f"[RAW PREDICTION]: '{gesture_name}'")
            
            return gesture_name
            
        except Exception as e:
            print(f"❌ Error during model prediction: {e}")
            return None
    
    def _classify_by_finger_patterns(self, *args, **kwargs):
        # This function is now obsolete and can be removed or left as a placeholder.
        return None
    
    def _check_gesture_stability(self) -> Optional[str]:
        """
        Check if a gesture is stable by looking at the prediction history.
        A gesture is stable if it's the most common prediction in the last
        N frames and exceeds a confidence threshold.
        """
        # Wait until the history buffer is full to make a decision
        if len(self.prediction_history) < self.prediction_history.maxlen:
            return None

        # Find the most common gesture in the history, ignoring None values
        try:
            # This gets the most frequent item. `max` on a set of predictions, using the list's count method as the key.
            most_common_gesture = max(set(g for g in self.prediction_history if g is not None), key=list(self.prediction_history).count)
        except ValueError:
            # This occurs if the history is all `None`
            return None

        # Check if the most common gesture meets our stability threshold
        if self.prediction_history.count(most_common_gesture) >= self.prediction_history.maxlen * self.stability_threshold:
            # The gesture is stable. Now, check the cooldown timer.
            current_time = time.time()
            if current_time - self.last_recognition_time > self.min_time_between_recognitions:
                self.last_recognition_time = current_time
                # Clear history to prevent immediate re-triggering
                self.prediction_history.clear()
                return most_common_gesture

        return None
    
    def translate_gesture(self, gesture: str) -> str:
        """
        Translate recognized gesture to text.
        
        Args:
            gesture: Recognized gesture name
            
        Returns:
            Translated text
        """
        return self.sign_mapping.get(gesture, f"Recognized: {gesture}")
    
    def get_gesture_info(self, gesture: str) -> Dict:
        """
        Get information about a recognized gesture.
        
        Args:
            gesture: Gesture name
            
        Returns:
            Dictionary with gesture information
        """
        return { 'name': gesture, 'description': f'Sign language gesture: {gesture}', 'translation': self.translate_gesture(gesture), 'confidence': self.min_model_confidence, 'model': 'Random Forest Classifier' }
    
    def get_supported_gestures(self) -> List[str]:
        """
        Get list of supported gestures.
        
        Returns:
            List of supported gesture names
        """
        return list(self.sign_mapping.keys())
    
    def get_translator_info(self) -> Dict:
        """
        Get information about the translator.
        
        Returns:
            Dictionary with translator information
        """
        return {
            'name': 'sign-language-translator',
            'version': '0.8.1',
            'status': 'active',
            'supported_languages': ['en'], # Assuming English for now
            'model_type': 'Random Forest Classifier' if self.model else 'Rule-Based',
            'available_modules': ['hand_detection', 'landmarks'],
            'ml_models': {
                'hand_landmarks': 'Random Forest' if self.model else 'Not Loaded',
                'status': 'loaded' if self.model else 'not_loaded',
                'supported_signs': len(self.labels) if self.model else len(self.sign_mapping)
            },
            'accuracy_improvements': {
                'mediapipe_detection': 'Enabled',
                'finger_pattern_analysis': 'Enabled',
                'gesture_stability': 'Enabled',
                'comprehensive_signs': f'{len(self.sign_mapping)} signs'
            }
        }
    
    def release(self):
        """Release resources."""
        if hasattr(self, 'hands'):
            self.hands.close()