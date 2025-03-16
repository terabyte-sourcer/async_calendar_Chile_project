# Async Calendar

Async Calendar is a comprehensive calendar management system designed for teams working across different time zones. It allows users to synchronize multiple calendars, manage availability, and schedule meetings efficiently.

## Features

- **Multiple Calendar Integration**: Connect and sync with Google Calendar, Microsoft Outlook, and CalDAV calendars
- **Team Management**: Create and manage teams for collaborative scheduling
- **Availability Management**: Set your available hours for each day of the week
- **Meeting Scheduling**: Schedule meetings with team members based on availability
- **User Authentication**: Secure login, registration, and email verification
- **Route Time Preferences**: Set preferences for travel time calculations
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Architecture

The project consists of two main components:

1. **Backend**: A FastAPI application providing RESTful API endpoints
2. **Frontend**: A React application with Material-UI for the user interface

## Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy ORM**: SQL toolkit and Object-Relational Mapping
- **PostgreSQL**: Robust, production-ready relational database
- **JWT Authentication**: JSON Web Tokens for secure authentication
- **Pydantic**: Data validation and settings management
- **Google API Client, CalDAV**: For calendar integration
- **Alembic**: Database migration tool
- **Pytest**: Testing framework

### Frontend
- **React 18**: JavaScript library for building user interfaces
- **Material-UI 5**: React UI framework with Material Design
- **React Router 6**: Declarative routing for React
- **Axios**: Promise-based HTTP client
- **React Big Calendar**: Calendar component for React
- **Date-fns**: JavaScript date utility library
- **Context API**: For state management

## Getting Started

### Prerequisites

- **Python 3.11+**: Required for the backend
- **Node.js 14+**: Required for the frontend
- **PostgreSQL 13+**: Required for the database
- **Git**: For version control

### Database Setup

The application supports both SQLite (for development) and PostgreSQL (for production):

#### Using PostgreSQL (Recommended)

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database:
   ```bash
   psql -U postgres -c "CREATE DATABASE async_calendar"
   ```
3. Update the `.env` file to use PostgreSQL:
   ```
   USE_SQLITE=false
   POSTGRES_SERVER=localhost
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=async_calendar
   ```

#### Using SQLite (Development Only)

1. Update the `.env` file to use SQLite:
   ```
   USE_SQLITE=true
   ```

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/async-calendar.git
cd async-calendar

# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000, and the API documentation at http://localhost:8000/docs.

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```

The frontend will be available at http://localhost:3000.

## Environment Variables

### Backend (.env file in backend directory)

```
# Database settings
USE_SQLITE=false  # Set to true for SQLite, false for PostgreSQL
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=async_calendar

# Security
SECRET_KEY=your-secret-key-for-jwt-tokens-should-be-very-long-and-secure

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Email settings
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.example.com
SMTP_USER=user@example.com
SMTP_PASSWORD=your-smtp-password
EMAILS_FROM_EMAIL=info@example.com
EMAILS_FROM_NAME=Async Calendar

# Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
```

### Frontend (.env file in frontend directory)

```
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
async-calendar/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── deps.py       # Dependencies
│   │   │   └── routes/       # API endpoints
│   │   ├── core/             # Core functionality
│   │   │   ├── config.py     # Configuration
│   │   │   └── security.py   # Security utilities
│   │   ├── db/               # Database
│   │   │   ├── base.py       # Base model
│   │   │   ├── models.py     # SQLAlchemy models
│   │   │   └── session.py    # Database session
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── .env                  # Environment variables
│   ├── requirements.txt      # Python dependencies
│   └── app.db                # SQLite database (if used)
├── frontend/                 # React frontend
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # React contexts
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── utils/            # Utility functions
│   │   ├── App.js            # Main App component
│   │   └── index.js          # Entry point
│   ├── .env                  # Environment variables
│   └── package.json          # Node.js dependencies
└── README.md                 # Project documentation
```

## API Documentation

The API documentation is available at http://localhost:8000/docs when the backend server is running. It provides detailed information about all available endpoints, request/response schemas, and authentication requirements.

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: Users can register with email, password, and name
2. **Email Verification**: Users receive a verification email to confirm their account
3. **Login**: Users can log in with email and password to receive a JWT token
4. **Token Usage**: The JWT token is included in the Authorization header for authenticated requests

## Database Models

The application uses the following main database models:

- **User**: User accounts and authentication
- **Calendar**: Connected calendar services
- **Availability**: User availability settings
- **Team**: Team management
- **Meeting**: Meeting scheduling

## Development Guidelines

### Backend

- Follow PEP 8 style guide for Python code
- Use type hints for function parameters and return values
- Write docstrings for all functions and classes
- Use Pydantic for data validation
- Write tests for all API endpoints

### Frontend

- Use functional components with hooks
- Use Material-UI for consistent styling
- Use React Router for navigation
- Use Axios for API requests
- Use Context API for state management

## Deployment

### Docker Deployment

```bash
# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

### Manual Deployment

#### Backend

```bash
# Install production dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Serve the build directory with a static file server
npx serve -s build
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check the database credentials in the `.env` file
- Verify that the database exists

### Email Sending Issues

- Check the SMTP settings in the `.env` file
- Ensure the SMTP server is accessible

### API Connection Issues

- Verify that the backend server is running
- Check the CORS settings in the backend
- Ensure the `REACT_APP_API_URL` is set correctly in the frontend

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License. 