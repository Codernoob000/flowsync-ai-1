import pickle
import pandas as pd

# Load trained model
try:
    model = pickle.load(open("model.pkl", "rb"))
except:
    model = None

# Sample input (you can change this)
input_data = {
    "traffic": ["high"],
    "weather": ["rain"],
    "distance": [12],
    "time_of_day": ["evening"]
}

df = pd.DataFrame(input_data)

# Convert to same format as training
df = pd.get_dummies(df)

# Match columns with training data
model_columns = model.feature_names_in_

for col in model_columns:
    if col not in df:
        df[col] = 0

df = df[model_columns]

# Prediction
prediction = model.predict(df)[0]
probability = model.predict_proba(df)[0][1]

# Risk logic
if probability < 0.3:
    risk = "Low"
elif probability < 0.7:
    risk = "Medium"
else:
    risk = "High"

# Output
print("Prediction (0=No Delay, 1=Delay):", prediction)
print("Delay Probability:", round(probability, 2))
print("Risk Level:", risk)
