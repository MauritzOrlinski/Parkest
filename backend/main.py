from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta

from models.database import engine, Base
from models import user as user_model
from models import schemas
import auth

from fastapi.middleware.cors import CORSMiddleware

from parking_time_estimators.estimator import ParkingCapacityEstimator

from datetime import datetime

print("Loading parking capacity estimator model...")
estimator = ParkingCapacityEstimator("/app/synthentic_parking_occupancy.csv")
print("Model loaded.")


app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def hello():
    return {"msg": "Hello"}


@app.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    existing = db.query(user_model.User).filter(user_model.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        hashed = auth.get_password_hash(user_in.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    user = user_model.User(email=user_in.email, hashed_password=hashed, name=user_in.name, saved_time=0.0)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.UserRead)
def read_users_me(current_user: user_model.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/parking")
def read_parking(location: str, db: Session = Depends(auth.get_db)):
    if not location:
        return []
    parking_spots = db.query(user_model.Parking).filter(user_model.Parking.address.contains(location)).all()
    return parking_spots

@app.get("/nearest")
def read_nearest(
    latitude: float,
    longitude: float,
    radius_m: float = 500,        # radius in meters
    db: Session = Depends(auth.get_db)
):
    """
    Returns the nearest parking spots within the specified radius.
    Uses PostGIS geography-based distance queries.
    """

    sql = text("""
        SELECT
            id,
            address,
            capacity,
            latitude,
            longitude,
            parking_type,
            ST_Distance(
                geom,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            ) AS distance_m
        FROM parking
        WHERE ST_DWithin(
            geom,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius
        )
        ORDER BY distance_m
        LIMIT 20;
    """)

    results = db.execute(sql, {
        "lat": latitude,
        "lon": longitude,
        "radius": radius_m
    }).fetchall()

    return [
        {
            "id": row.id,
            "address": row.address,
            "capacity": row.capacity,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "parking_type": row.parking_type,
            "distance_m": float(row.distance_m)
        }
        for row in results
    ]

@app.post("/history", response_model=schemas.HistoryEventRead, status_code=status.HTTP_201_CREATED)
def create_history_event(
    event_in: schemas.HistoryEventCreate,
    current_user: user_model.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    event = user_model.HistoryEvent(
        user_id=current_user.id,
        parking_id=event_in.parking_id,
        saved_time=event_in.saved_time
    )

    # add event to DB
    db.add(event)
    db.commit()
    db.refresh(event)

    # update user's total saved time
    current_user.saved_time += event_in.saved_time
    db.commit()
    return event

def get_current_hour_and_day_initial():
    now = datetime.now()
    hour_24 = now.hour

    weekday_idx = now.weekday()
    if weekday_idx < 5:
        day_initial = "WT"
    elif weekday_idx == 5:
        day_initial = "SA"
    else:
        day_initial = "SO"
    
    return hour_24, day_initial

@app.post("/estimate_search_time")
def estimate_search_time(
    input: schemas.EstimateSearchTimeRequest
):
    """
    Estimate parking search time based on input features.
    """
    hour, day_type = get_current_hour_and_day_initial()

    estimated_occupancy = estimator.predict(
        day_type=day_type,
        hour=hour,
        total_capacity=input.total_capacity,
        latitude=input.latitude,
        longitude=input.longitude
    )

    # Simple heuristic: assume search time increases with occupancy rate
    base_time = 5  # base search time in minutes
    occupancy_factor = estimated_occupancy / 100  # convert percentage to factor
    estimated_search_time = base_time * (1 + occupancy_factor)

    return {"estimated_search_time_minutes": estimated_search_time}