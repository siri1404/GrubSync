import json
from dask.distributed import Client
from streamz import Stream
from streamz.redis import Redis as RedisSource
import dask.dataframe as dd
import pandas as pd
from utils import rank_restaurants  # you’ll port your ranking logic here

# 1. Connect to Dask
client = Client('tcp://localhost:8786')

# 2. Source stream from Redis
src = Stream.from_redis(url='redis://localhost:6379', stream='preferences', decode=True)

# 3. Parse and window
def parse(x):
    return {
      'userId': x['userId'],
      'groupId': x['groupId'],
      **json.loads(x['cuisines']),
      **json.loads(x['dietary'])
    }
batched = src.map(parse).timed_window(5)  # 5‑second micro‑batch

# 4. Into Dask DataFrame
def to_ddf(records):
    pdf = pd.DataFrame(records)
    return dd.from_pandas(pdf, npartitions=1)

ddf_stream = batched.map(to_ddf)

# 5. Compute recommendations per group
def compute(df):
    # df is a pandas.DataFrame for one window
    results = rank_restaurants(df)  # implement your logic
    return results

recs = ddf_stream.map(lambda ddf: ddf.groupby('groupId').apply(compute, meta=('recs', 'object')))
recs.sink(lambda x: write_to_redis(x))  # implement write_to_redis below

# 6. Write to Redis for serving
import redis
r = redis.Redis()
def write_to_redis(group_recs):
    for groupId, rec_list in group_recs.items():
        r.hset('group_recs', groupId, json.dumps(rec_list))
