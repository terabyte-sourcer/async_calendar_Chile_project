from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import auth, users, calendars, meetings, admin, teams, availability, oauth_settings
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.services.email_service import send_email

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Async Calendar API",
    description="API for calendar synchronization and meeting scheduling",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(calendars.router, prefix="/api", tags=["calendars"])
app.include_router(meetings.router, prefix="/api", tags=["meetings"])
app.include_router(teams.router, prefix="/api", tags=["teams"])
app.include_router(availability.router, prefix="/api", tags=["availability"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(oauth_settings.router, prefix="/api/admin", tags=["admin"])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/send-email")
async def send_test_email():
    send_email("recipient@example.com", "Test Subject", "Test Body")
    return {"message": "Email sent successfully"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred."},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)