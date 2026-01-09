import fastf1
import matplotlib.pyplot as plt
import numpy as np
import cv2
import os
import tensorflow as tf
from tensorflow.keras import layers, models

# Configuration
VIS_DIR = "../vision_output"
if not os.path.exists(VIS_DIR):
    os.makedirs(VIS_DIR)

print(f"👁️ F1 Computer Vision - TensorFlow version: {tf.__version__}")

# 1. Generate "Track Fingerprint" from GPS data
def generate_track_map(year, race_name, session_type='R'):
    print(f"📍 Generating track map for {year} {race_name}...")
    try:
        session = fastf1.get_session(year, race_name, session_type)
        session.load(telemetry=True)
        
        # Get fastest lap
        fastest_lap = session.laps.pick_fastest()
        telemetry = fastest_lap.get_telemetry()
        
        x = telemetry['X']
        y = telemetry['Y']
        
        # Create a plot without axes
        fig, ax = plt.subplots(figsize=(5, 5))
        ax.plot(x, y, color='black', lw=5)
        ax.set_axis_off()
        
        output_path = os.path.join(VIS_DIR, f"{race_name.lower()}_map.png")
        plt.savefig(output_path, bbox_inches='tight', pad_inches=0)
        plt.close()
        
        print(f"✅ Saved track image to {output_path}")
        return output_path
    except Exception as e:
        print(f"❌ Error generating map: {e}")
        return None

# 2. Simple CNN for "Track Feature Extraction"
def build_f1_cnn(input_shape=(128, 128, 3)):
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dense(3, activation='softmax') # e.g., Classify: Street, High-Downforce, Power-Circuit
    ])
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

# 3. Process image for CNN
def process_for_cnn(image_path):
    if not image_path or not os.path.exists(image_path):
        return None
    
    img = cv2.imread(image_path)
    img = cv2.resize(img, (128, 128))
    img = img / 255.0  # Normalize
    return np.expand_dims(img, axis=0)

def run_vision_demo():
    # Use a mock run for Brazil 2024 since 2025 might not have all telemetry yet
    img_path = generate_track_map(2024, 'Brazil')
    
    if img_path:
        print("\n🖼️ Passing track map through CNN architecture...")
        model = build_f1_cnn()
        track_data = process_for_cnn(img_path)
        
        # Demo prediction (using unitialized weights for architectural proof)
        prediction = model.predict(track_data)
        classes = ['Street', 'High-Downforce', 'Power-Circuit']
        result = classes[np.argmax(prediction)]
        
        print(f"📊 CNN Classification Result: {result}")
        print("Note: This demonstrates the CNN pipeline as claimed on the resume.")

if __name__ == "__main__":
    run_vision_demo()
