import os
import json
import numpy as np
import pandas as pd
from pymongo import MongoClient

# ——————————————————————————————————————————————————————————————
# 1) Database connection (reuse for batch & streaming)
# ——————————————————————————————————————————————————————————————
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_default_database()

# ——————————————————————————————————————————————————————————————
# 2) Ranking logic (ported from your existing recommendation.py)
# ——————————————————————————————————————————————————————————————
def rank_restaurants(df: pd.DataFrame, top_k: int = 10) -> dict:
    """
    Given a pandas DataFrame of preference records for a single group window,
    compute a ranked list of restaurants (by their Yelp IDs).
    Returns a dict { groupId: [ { 'id': ..., 'score': ..., 'meta': {...} }, … ] }.
    """
    if df.empty:
        return []

    # Example: majority‐vote cuisines
    top_cuisines = (
        df["cuisines"]
        .explode()
        .value_counts()
        .head(3)
        .index
        .tolist()
    )

    # Example: collect common dietary restrictions
    restrictions = (
        df["dietary"]
        .explode()
        .dropna()
        .unique()
        .tolist()
    )

    # Example: budget median
    budgets = df["budget"].map({"$":1, "$$":2, "$$$":3}).dropna()
    budget_level = int(np.round(budgets.median())) if not budgets.empty else 2

    # Fetch candidates from Yelp (this is synchronous—batch your own API wrapper or mock)
    from yelp_client import fetch_restaurants  # your existing module
    candidates = fetch_restaurants(
        cuisines=top_cuisines,
        dietary=restrictions,
        budget=budget_level,
        location=df["location"].iloc[0]
    )

    # Score: simple matching count across preferences
    scored = []
    for r in candidates:
        score = 0
        score += len(set(r["categories"]) & set(top_cuisines)) * 2
        score += 1 if r.get("price_level", 2) == budget_level else 0
        score -= len(set(r.get("dietary_flags", [])) ^ set(restrictions))
        scored.append({ **r, "score": score })

    # Sort & take top_k
    top = sorted(scored, key=lambda x: x["score"], reverse=True)[:top_k]
    return top

# ——————————————————————————————————————————————————————————————
# 3) Helper for writing to Redis (for streaming)
# ——————————————————————————————————————————————————————————————
import redis
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
redis_client = redis.Redis.from_url(REDIS_URL)

def write_to_redis(group_id: str, recs: list):
    """
    Store the recommendations list in Redis hash keyed by group_id.
    """
    redis_client.hset("group_recs", group_id, json.dumps(recs))
