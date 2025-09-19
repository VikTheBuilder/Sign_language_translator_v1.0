import pickle
import cv2
import mediapipe as mp
import numpy as np

# Load the trained model
model_dict = pickle.load(open('./model.p', 'rb'))
model = model_dict['model']

# Initialize webcam and MediaPipe Hands
cap = cv2.VideoCapture(0)
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Note: The `static_image_mode=False` argument is better for video streams
# It uses tracking between frames, which is more efficient.
hands = mp_hands.Hands(static_image_mode=False, min_detection_confidence=0.3, min_tracking_confidence=0.5)

labels_dict = {0: "Hello", 1: "Help", 2: "Thank You" , 3: "GoodBye" , 4: "Happy" , 5: "Stop" , 6: "Sorry" , 7: "Angry" , 8: "Food" , 9: "Good" , 10: "Please" , 11: "You" , 12: "No" , 13:"One" , 14: "Two"}

while True:
    ret, frame = cap.read()
    H, W, _ = frame.shape
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    # Check if any hands are detected
    if results.multi_hand_landmarks:
        # Loop through EACH detected hand
        for hand_landmarks in results.multi_hand_landmarks:
            # Re-initialize lists for EACH hand
            data_aux = []
            x_ = []
            y_ = []

            # 1. Draw landmarks for the current hand
            mp_drawing.draw_landmarks(
                frame,  # image to draw
                hand_landmarks,  # model output
                mp_hands.HAND_CONNECTIONS,  # hand connections
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style())
            
            # 2. Extract landmark coordinates for the current hand
            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                x_.append(x)
                y_.append(y)
            
            # 3. Normalize the coordinates for the current hand
            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                data_aux.append(x - min(x_))
                data_aux.append(y - min(y_))

            # 4. Calculate bounding box for the current hand
            x1 = int(min(x_) * W) - 10
            y1 = int(min(y_) * H) - 10
            x2 = int(max(x_) * W) + 10  # Added +10 to the max to make the box bigger
            y2 = int(max(y_) * H) + 10

            # 5. Classify the current hand's data
            try:
                # The model expects a 2D array, so we wrap data_aux in a list
                prediction = model.predict([np.asarray(data_aux)])
                predicted_character = labels_dict[int(prediction[0])]

                # 6. Draw the bounding box and text for the current hand
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 0), 4)
                cv2.putText(frame, predicted_character, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 0, 0), 3, cv2.LINE_AA)

            except ValueError as e:
                # This catches the error if the input has the wrong size
                # This can happen if a hand is only partially visible
                print(f"Error during prediction: {e}")

    # Display the final frame
    cv2.imshow('frame', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()