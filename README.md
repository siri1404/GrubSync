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
## Demo Video

Check out the demo video of GrubSync in action:

[Watch the Demo](https://github.com/siri1404/GrubSync/blob/main/Demo.mp4)


## Prerequisites
Docker & Docker Compose

Node.js ≥ 16.x & npm

Python 3.8+ & pip

MongoDB instance (local or Atlas)

Redis instance (local or managed)

## Docker Setup (Local Dev)
Create a docker-compose.yml in the repo root:

docker-compose up -d

## Getting Started

1. **Clone the Repository**  
    ```bash
    git clone https://github.com/siri1404/GrubSync-BigData.git
    cd GrubSync-BigData
    ```

2. **Configure Environment**  
    Update the following variables in the `.env` file:
    ```env
    MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/grubsync?retryWrites=true&w=majority
    JWT_SECRET=your_jwt_secret
    REDIS_URL=redis://localhost:6379
    DASK_SCHEDULER=tcp://localhost:8786
    YELP_API_KEY=your_yelp_api_key
    GOOGLE_API_KEY=your_google_maps_key

    # Server
    PORT=3001

    # Batch training output
    MODEL_OUTPUT=./models
    ```

3. **Install Dependencies**  
    Install dependencies for both the backend and frontend:  
    ```bash
    npm install
    ```
    Install Python dependencies for the pipeline:  
    ```bash
    pip install -r requirements.txt
    ```

4. **Running Services**  
    - **Backend API**  
      Start the backend server:  
      ```bash
      cd server
      npm run dev
      ```
      The backend will be available at: [http://localhost:3001](http://localhost:3001)

    - **Frontend App**  
      Start the frontend application:  
      ```bash
      cd src
      npm run dev
      ```
      The frontend will be available at: [http://localhost:5173](http://localhost:5173)
