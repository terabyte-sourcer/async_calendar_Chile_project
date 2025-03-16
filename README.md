# Async Calendar

Async Calendar is a comprehensive calendar management system designed for teams working across different time zones. It allows users to synchronize multiple calendars, manage availability, and schedule meetings efficiently.

## Features

- **Multiple Calendar Integration**: Connect and sync with Google Calendar, Microsoft Outlook, and CalDAV calendars
- **Team Management**: Create and manage teams for collaborative scheduling
- **Availability Management**: Set your available hours for each day of the week
- **Meeting Scheduling**: Schedule meetings with team members based on availability
- **User Authentication**: Secure login, registration, and profile management
- **Route Time Preferences**: Set preferences for travel time calculations

## Architecture

The project consists of two main components:

1. **Backend**: A FastAPI application providing RESTful API endpoints
2. **Frontend**: A React application with Material-UI for the user interface

## Technologies Used

### Backend
- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- JWT Authentication
- Pydantic for data validation
- Google API Client, CalDAV for calendar integration

### Frontend
- React 18
- Material-UI 5
- React Router 6
- Axios for API communication
- JWT for authentication
- React Big Calendar for calendar views

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 14+ and npm (for local development)
- Python 3.9+ (for local development)

### Running with Docker Compose

The easiest way to run the entire application is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/async-calendar.git
cd async-calendar

# Start the application
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Email Testing UI (MailHog): http://localhost:8025

### Local Development

For local development, you can run the frontend and backend separately:

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=async_calendar
DATABASE_URL=postgresql://postgres:postgres@db:5432/async_calendar

# Security
SECRET_KEY=your_secret_key_here

# Email
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply@asynccalendar.com

# Frontend
FRONTEND_URL=http://localhost
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
async-calendar/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core functionality
│   │   ├── db/            # Database models and session
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic services
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## License

This project is licensed under the MIT License. 