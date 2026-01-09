import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import fastf1
import json
import os
from datetime import datetime

# Configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CACHE_FILE = '../data/f1_2025_season_cache.json'

print(f"🚀 F1 Neural Predictor - Device: {DEVICE}")

# 1. Data Loading (Reusing project's caching logic)
def load_data():
    if not os.path.exists(CACHE_FILE):
        print("⚠️ Cache not found. Please run 21brazilXGBoost.py first to populate data.")
        return None
    
    with open(CACHE_FILE, 'r') as f:
        data = json.load(f)
    
    season_results = data['season_results']
    driver_standings = data['driver_standings']
    
    records = []
    for race, results in season_results.items():
        for driver, pos in results.items():
            records.append({
                'Driver': driver,
                'Race': race,
                'Position': pos,
                'Points': driver_standings.get(driver, 0)
            })
    
    df = pd.DataFrame(records)
    # Simple feature engineering for the NN
    df['Points_Scaled'] = df['Points'] / 500.0
    # Add dummy variables for drivers to handle categorical data
    df = pd.get_dummies(df, columns=['Driver'])
    return df

# 2. Model Architecture
class F1Net(nn.Module):
    def __init__(self, input_size):
        super(F1Net, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1) # Predicting Race Position (Regression)
        )
        
    def forward(self, x):
        return self.network(x)

# 3. Training Loop
def train_model():
    df = load_data()
    if df is None: return
    
    # Selection of features (all columns except Race, Position, and original Points if scaled)
    X = df.drop(['Race', 'Position', 'Points'], axis=1).values.astype(np.float32)
    y = df['Position'].values.astype(np.float32).reshape(-1, 1)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    
    # Convert to Tensors
    X_train_t = torch.tensor(X_train).to(DEVICE)
    y_train_t = torch.tensor(y_train).to(DEVICE)
    X_test_t = torch.tensor(X_test).to(DEVICE)
    y_test_t = torch.tensor(y_test).to(DEVICE)
    
    model = F1Net(X_train.shape[1]).to(DEVICE)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("\n⏳ Training Neural Network...")
    for epoch in range(200):
        model.train()
        optimizer.zero_grad()
        outputs = model(X_train_t)
        loss = criterion(outputs, y_train_t)
        loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 50 == 0:
            model.eval()
            with torch.no_grad():
                val_outputs = model(X_test_t)
                val_loss = criterion(val_outputs, y_test_t)
                print(f"Epoch [{epoch+1}/200], Loss: {loss.item():.4f}, Val Loss: {val_loss.item():.4f}")

    print("\n✅ Training Complete!")
    
    # Evaluation
    model.eval()
    with torch.no_grad():
        preds = model(X_test_t).cpu().numpy()
        mae = np.mean(np.abs(preds - y_test))
        print(f"📊 NN Performance - MAE: {mae:.3f} positions")

if __name__ == "__main__":
    train_model()
