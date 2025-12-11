# Parkest
## Disclaimer:
**This is a project built in a Hackathon in 48 Hours. It is not high-quality code!**

## The application
Parkest is a parking-optimization web application designed to help users find the best parking spot near their chosen destination. The app automatically:

- Guides the user to select a destination via Google Maps Autocomplete.
- Finds nearby parking spots using the backend's geospatial search.
- Estimates expected search times for every parking spot.
- Shows the total trip duration (driving + walking + search time).
- Highlights how much time each parking spot saves compared to others.
- Displays driving and walking routes using Google Maps Directions.
- Allows the user to start navigation in Google Maps.

The goal is to simulate what users do mentally when searching for parking: compare multiple possibilities and pick the optimal one. Parkest makes this automatic, visual, and data-driven.

## Features

- **Google Maps Search** – Autocomplete-based destination input.
- **Parking Discovery** – Finds parking spots within a given radius.
- **Search Time Estimation** – Estimates how long it takes to find parking.
- **Route Visualization** – Driving route to the selected parking + walking route to the final destination.
- **Bottom Sheet (Mobile)** – Details about the selected parking spot: address, estimated search time, total travel time, and time saved compared to other spots.
- **Start Navigation** – Opens Google Maps navigation to the chosen parking spot.

## How to Run

### 1. Start the Backend
From the project **root directory**, run:

```bash
docker-compose up --build
```

This will build and start the API service that:
- Returns nearby parking spots
- Computes search time estimates
- Supports trip history tracking

### 2. Start the Frontend
Navigate to the **frontend directory**:

```bash
cd frontend
```

Install dependencies (first time only):

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173).

## Environment Variables
Make sure the frontend has valid values in `.env` or similar Vite config:

```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_API_BASE_URL=http://localhost:8000
```

## Folder Structure (Simplified)

```
root/
├── backend/ (Dockerized FastAPI backend)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── maps.jsx
│   │   ├── pages/
│   │   │   └── MapPage.jsx
│   │   └── ...
│   └── ...
└── docker-compose.yml
```

## Summary
Parkest speeds up the parking process by:
- Giving users visibility into all nearby parking options
- Estimating search effort
- Computing full trip times
- Showing which spot is truly the fastest option

It reduces guesswork, saves time, and simplifies decision-making for drivers navigating busy urban areas.

## Chart
```mermaid
flowchart LR

    subgraph Client["Mobile-Optimized Frontend (React)"]
        UI["React UI"]
        GoogleAPI["Google Maps / Geocoding APIs"]
        UI --> GoogleAPI
    end

    subgraph Backend["Backend Service (FastAPI)"]
        API["REST API Endpoints"]
        ML["ML Estimator (scikit-learn)"]
        Preproc["Data Preprocessing & Model Loader"]
    end

    subgraph DB["PostgreSQL with PostGIS"]
        DBUsers["Users"]
        DBSpots["Parking Spots"]
        DBEvents["Parking Events"]
    end

    subgraph DataSources["Training Data (Munich Open Data)"]
        CSV["CSV Parking Dataset"]
    end

    %% Client interactions
    UI -->|Request parking estimate| API

    %% Backend to ML
    API -->|Invoke prediction| ML
    ML --> Preproc

    %% Backend to DB
    API -->|GIS nearest spot queries| DBUsers
    API -->|GIS nearest spot queries| DBSpots
    API -->|Fetch events| DBEvents

    %% Frontend uses Google APIs
    UI -->|Geocoding & Routing| GoogleAPI

    %% Training pipeline
    CSV --> Preproc
    Preproc --> ML
```
