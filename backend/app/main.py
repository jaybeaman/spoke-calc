from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base
from .routers import rims, hubs, calculator, builds, users

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Spoke Calculator API",
    description="Spoke length calculator for Scenic Routes Community Bicycle Center",
    version="1.0.0"
)

# CORS configuration
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (auth is now handled by Clerk)
app.include_router(rims.router)
app.include_router(hubs.router)
app.include_router(calculator.router)
app.include_router(builds.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {
        "name": "Spoke Calculator API",
        "version": "1.0.0",
        "shop": "Scenic Routes Community Bicycle Center"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
