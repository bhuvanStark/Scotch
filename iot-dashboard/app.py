import pandas as pd
import requests
from flask import Flask, render_template, jsonify
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import os

app = Flask(__name__)

CSV_URL = "https://api.thingspeak.com/channels/2965771/feeds.csv?api_key=I6D9WGROEFOLZJIE&results=100"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/train-models')
def train_models():
    # Load CSV
    df = pd.read_csv(CSV_URL)
    df.dropna(inplace=True)

    # Convert fields to numeric
    for col in df.columns:
        if col.startswith('field'):
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Features: Temp & Humidity => Predict PM2.5, PM10, dB
    X = df[['field7', 'field8']]  # Temp & Humidity
    fields_to_predict = {
        'field4': 'LOUDNESS (dB)',
        'field5': 'PM2.5',
        'field6': 'PM10',
    }

    result = {}
    for field, label in fields_to_predict.items():
        y = df[field]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
        model = LinearRegression()
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        acc = r2_score(y_test, predictions)

        result[field] = {
            "original": X_test.index.tolist(),
            "actual": y_test.tolist(),
            "predicted": predictions.tolist(),
            "accuracy": acc
        }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
