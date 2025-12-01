# FantaRoncola

Fanta-system for Roncola d'Oro. This application allows users to create and manage fantasy teams for the Roncola d'Oro singing contest.

## Project Structure

The project is divided into two main parts:

- **Frontend**: A Vue 3 application using Vite, TailwindCSS, and Pinia.
- **Backend**: A Node.js/Express application using PostgreSQL for the database.

## Features

- **User Authentication**: Register and Login without email confirmation.
- **Team Management**: Create a fantasy team by selecting singers within a budget.
- **Singer Market**: View available singers and their costs.
- **Leaderboard**: View the current standings of users.

## Tech Stack

- **Frontend**:
  - Vue 3 (Composition API)
  - Vite
  - TailwindCSS (v4)
  - Pinia (State Management)
  - Vue Router

- **Backend**:
  - Node.js
  - Express.js
  - PostgreSQL
  - JWT (JSON Web Tokens) for authentication
  - bcryptjs for password hashing

- **Infrastructure**:
  - Docker
  - Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine.

### Installation & Running

1. **Clone the repository** (if you haven't already).

2. **Run with Docker Compose**:
   The entire stack (frontend, backend, database) is containerized. You can start everything with a single command:

   ```bash
   docker-compose up --build
   ```

   This will start:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **Database**: PostgreSQL on port 5432

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`.

### Development

- **Frontend**: The `frontend` directory contains the Vue source code. Changes are reflected immediately via Hot Module Replacement (HMR).
- **Backend**: The `backend` directory contains the API source code. It uses `nodemon` to restart the server on file changes.
- **Database**: Data is persisted in a Docker volume `postgres_data`.

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user.
  - Body: `{ "username": "youruser", "password": "yourpassword" }`
- `POST /api/auth/login`: Login.
  - Body: `{ "username": "youruser", "password": "yourpassword" }`
- `GET /api/auth/me`: Get current user info (Requires `x-auth-token` header).
