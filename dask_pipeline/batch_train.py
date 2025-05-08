import os
import json
import pickle
from datetime import datetime
from pymongo import MongoClient
from dask.distributed import Client
import dask.dataframe as dd
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

# ——————————————————————————————————————————————————————————————
# 1) Setup
# ——————————————————————————————————————————————————————————————
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/grubsync")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_default_database()

# Dask cluster
client = Client(os.environ.get("DASK_SCHEDULER", "tcp://localhost:8786"))

# ——————————————————————————————————————————————————————————————
# 2) Load historical events into a Dask DataFrame
# ——————————————————————————————————————————————————————————————
def load_history(collection_name: str = "preferences") -> dd.DataFrame:
    """
    Reads all preference events from MongoDB and returns a Dask DataFrame.
    """
    cursor = db[collection_name].find({}, projection={"_id":0})
    df = pd.DataFrame(list(cursor))
    # Normalize any nested fields
    df["cuisine"] = df["cuisines"].apply(lambda x: x[0] if x else None)
    return dd.from_pandas(df, npartitions=4)

# ——————————————————————————————————————————————————————————————
# 3) Feature engineering & model training
# ——————————————————————————————————————————————————————————————
def train_ranking_model():
    ddf = load_history()
    # Example: build a simple regression to predict star rating preference
    ddf = ddf.dropna(subset=["userId","cuisine","budget", "rating"])
    df = ddf.compute()

    # Convert categorical to numeric
    df["budget_level"] = df["budget"].map({"$":1,"$$":2,"$$$":3})
    X = pd.get_dummies(df[["cuisine","budget_level"]])
    y = df["rating"]  # assume you stored a numeric rating

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    print(f"Trained model R²: {model.score(X_test, y_test):.3f}")

    # Persist model artifact
    output_path = os.environ.get("MODEL_OUTPUT", "./models")
    os.makedirs(output_path, exist_ok=True)
    artifact = os.path.join(output_path, f"rank_model_{datetime.utcnow().isoformat()}.pkl")
    with open(artifact, "wb") as f:
        pickle.dump(model, f)
    print(f"Saved model to {artifact}")

if __name__ == "__main__":
    train_ranking_model()
