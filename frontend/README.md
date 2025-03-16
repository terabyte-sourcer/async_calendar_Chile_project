# Async Calendar Frontend

This is the frontend application for the Async Calendar project, built with React and Material-UI.

## Features

- User authentication (login, registration, profile management)
- Calendar view with multiple calendar integration
- Meeting scheduling and management
- Team management
- Availability management
- Calendar connections to external providers (Google, Outlook, CalDAV)

## Technologies Used

- React 18
- Material-UI 5
- React Router 6
- Axios for API communication
- JWT for authentication
- React Big Calendar for calendar views
- Date-fns for date manipulation

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```

The application will be available at http://localhost:3000.

### Building for Production

To build the application for production:

```
npm run build
```

This will create a `build` directory with optimized production files.

## Docker

The frontend can be built and run using Docker:

```
docker build -t async-calendar-frontend .
docker run -p 80:80 async-calendar-frontend
```

## Project Structure

- `src/components/` - Reusable UI components
- `src/contexts/` - React context providers
- `src/pages/` - Page components
- `src/services/` - API services
- `public/` - Static assets

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:8000
```

## License

This project is licensed under the MIT License. 