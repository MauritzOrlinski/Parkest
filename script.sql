DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS parking;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    saved_time NUMERIC DEFAULT 0,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Optional explicit index (SQLAlchemy's index=True generates this)
CREATE INDEX ix_users_id ON users (id);
CREATE INDEX ix_users_email ON users (email);

CREATE TABLE parking (
    id VARCHAR(200) PRIMARY KEY,
    address VARCHAR(255),
    capacity DECIMAL(10,2),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    parking_type VARCHAR(50)
);

COPY parking (id, address, capacity, latitude, longitude, parking_type)
FROM '/config/data/combined_parking_data.csv'
DELIMITER ','
CSV HEADER;
