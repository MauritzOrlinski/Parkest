import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

FIXED_SEARCH_TIME = 2.5
TIME_PER_SPOT = 1.2
TIME_PENALTY = 10


class ParkingCapacityEstimator:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.model = None
        self.preprocessor = None

        self._load_and_train()

    def _load_and_train(self):
        df = pd.read_csv(self.csv_path)

        features = ["day_type", "hour", "total_capacity", "latitude", "longitude"]
        target = "occupancy_rate"

        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

        features = [
            "day_type",
            "total_capacity",
            "latitude",
            "longitude",
            "hour_sin",
            "hour_cos",
        ]

        X = df[features]
        y = df[target]

        self.preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore"), ["day_type"]),
                (
                    "num",
                    "passthrough",
                    ["total_capacity", "latitude", "longitude", "hour_sin", "hour_cos"],
                ),
            ]
        )

        self.model = Pipeline(
            [
                ("preprocessor", self.preprocessor),
                (
                    "regressor",
                    RandomForestRegressor(
                        n_estimators=300, max_depth=12, random_state=42
                    ),
                ),
            ]
        )
        self.model.fit(X, y)

    def predict(self, day_type, hour, total_capacity, latitude, longitude):
        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)

        X_new = pd.DataFrame(
            [
                {
                    "day_type": day_type,
                    "total_capacity": total_capacity,
                    "latitude": latitude,
                    "longitude": longitude,
                    "hour_sin": hour_sin,
                    "hour_cos": hour_cos,
                }
            ]
        )

        return float(self.model.predict(X_new)[0])

    def predict_search_time(self, day_type, hour, total_capacity, latitude, longitude):
        p_occupied = self.predict(day_type, hour, total_capacity, latitude, longitude)

        p_free = 1 - p_occupied

        if p_free < 1e-3:
            expected_spots = total_capacity * 2
        else:
            expected_spots = 1 / p_free
        total_time = expected_spots * TIME_PER_SPOT + FIXED_SEARCH_TIME
        if p_free < 0.05:
            total_time += TIME_PENALTY

        return total_time


if __name__ == "__main__":
    # use like this:
    estimator = ParkingCapacityEstimator("data/synthetic_parking_occupancy.csv")

    prediction = estimator.predict_search_time(
        day_type="SA",
        hour=18,
        total_capacity=100,
        latitude=48.13974710476859,
        longitude=11.540635988637927,
    )

    print("Predicted search time:", prediction)
