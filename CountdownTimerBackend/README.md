# CountdownTimer Backend - PostgreSQL Setup

This backend now uses PostgreSQL instead of SQLite. Follow these steps to set up your database connection.

## Prerequisites

1. **Install PostgreSQL** on your system
2. **Create a database** for the countdown timer application

## Configuration

1. **Update the `.env` file** with your PostgreSQL credentials:

    ```env
    POSTGRES_USER=your_username
    POSTGRES_PASSWORD=your_password
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    POSTGRES_DB=countdown_timer
    ```

2. **Alternative: Use DATABASE_URL** (useful for cloud deployments):
    ```env
    DATABASE_URL=postgresql://username:password@localhost:5432/countdown_timer
    ```

## Setup Steps

1. **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

2. **Create the database** (if it doesn't exist):

    ```sql
    -- Connect to PostgreSQL as a superuser and run:
    CREATE DATABASE countdown_timer;
    ```

3. **Initialize the database tables:**

    ```bash
    python init_db.py
    ```

4. **Run the application:**
    ```bash
    python main.py
    ```

## Database Migration from SQLite

If you have existing data in SQLite that you want to migrate:

1. Export your SQLite data
2. Import it into PostgreSQL using tools like `pgloader` or custom scripts
3. Or start fresh with an empty PostgreSQL database

## Troubleshooting

-   **Connection refused**: Make sure PostgreSQL is running
-   **Database does not exist**: Create the database manually
-   **Authentication failed**: Check your username/password in `.env`
-   **Permission denied**: Ensure your user has proper database permissions

## Environment Variables

| Variable            | Description                                       | Default           |
| ------------------- | ------------------------------------------------- | ----------------- |
| `POSTGRES_USER`     | PostgreSQL username                               | `postgres`        |
| `POSTGRES_PASSWORD` | PostgreSQL password                               | `password`        |
| `POSTGRES_HOST`     | Database host                                     | `localhost`       |
| `POSTGRES_PORT`     | Database port                                     | `5432`            |
| `POSTGRES_DB`       | Database name                                     | `countdown_timer` |
| `DATABASE_URL`      | Full database URL (overrides individual settings) | None              |
