# GrubSync

An intelligent, group‑centric restaurant recommender that helps friends to find the best compromise when choosing where to eat. GrubSync collects each member’s cuisine preferences, dietary restrictions, budget, and real‑time location, then processes those events at scale with Redis Streams, Dask, and MongoDB to surface curated dining options.

## Features

User Authentication: Sign up, log in, JWT‑based sessions

Group Management: Create groups, invite codes, join by code

Preference Collection: Submit/update cuisines, dietary restrictions, budget

Real‑Time Pipeline: Redis Streams → Streamz + Dask → low‑latency serving

Batch Analytics & ML: Nightly Dask job trains a ranking model on full history

Responsive UI: React + Vite frontend styled with Tailwind CSS

## Tech Stack
Frontend: React (Vite), TypeScript, Tailwind CSS

Backend: Node.js + Express, MongoDB via Mongoose

Event Broker: Redis Streams

Streaming & Batch Compute: Dask Distributed, Streamz, Pandas

ML & Analytics: scikit‑learn, Dask DataFrame

Orchestration: cron or Airflow/Prefect for nightly jobs

Dev Tools: Docker Compose, ESLint, Prettier

## Prerequisites
Docker & Docker Compose

Node.js ≥ 16.x & npm

Python 3.8+ & pip

MongoDB instance (local or Atlas)

Redis instance (local or managed)

## Docker Setup (Local Dev)
Create a docker-compose.yml in the repo root:

yaml
Copy
Edit
version: '3.8'
services:
  redis:
    image: redis:7
    ports: ['6379:6379']

  dask-scheduler:
    image: daskdev/dask:latest
    command: dask-scheduler
    ports: ['8786:8786','8787:8787']

  dask-worker:
    image: daskdev/dask:latest
    command: >
      dask-worker tcp://dask-scheduler:8786
      --nthreads 2 --memory-limit 4GB
    depends_on:
      - dask-scheduler
To spin up Redis & Dask locally:

bash
Copy
Edit
docker-compose up -d

## Getting Started
1. Clone the Repo
bash
Copy
Edit
git clone https://github.com/siri1404/GrubSync‑BigData.git
cd GrubSync‑BigData
2. Configure Environment
Copy and edit:

bash
Copy
Edit
cp .env.example .env
ini
Copy
Edit
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/grubsync?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_jwt_secret

# Redis
REDIS_URL=redis://localhost:6379

# Dask
DASK_SCHEDULER=tcp://localhost:8786

# APIs (if still using Yelp/Google in fallback)
YELP_API_KEY=your_yelp_api_key
GOOGLE_API_KEY=your_google_maps_key

# Server
PORT=3001

# Batch training output
MODEL_OUTPUT=./models
3. Install Dependencies
bash
Copy
Edit
# Backend & frontend
npm install

# Python pipeline
pip install -r requirements.txt
🏃 Running Services
Backend API
bash
Copy
Edit
cd server
npm run dev
# → http://localhost:3001
Frontend App
bash
Copy
Edit
cd src
npm run dev
# → http://localhost:5173



This script will:

Consume events from Redis Streams (preferences, location, group_events).

Window them via Streamz, convert to Dask DataFrames.

Call dask_pipeline/utils.rank_restaurants() per group window.

Write top‑K recommendations into Redis hash group_recs.


## Environment Variables
Key	Description
MONGODB_URI	MongoDB connection string
JWT_SECRET	JWT signing secret
REDIS_URL	Redis Streams & Hash storage URL
DASK_SCHEDULER	Dask scheduler address (e.g. tcp://…)
YELP_API_KEY	(Optional) Yelp Fusion API key
GOOGLE_API_KEY	(Optional) Google Maps API key
PORT	Express server port
MODEL_OUTPUT	Directory for batch‑trained models

