#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL
Run this script to create the database tables after setting up your PostgreSQL connection.
"""

from main import create_app
from database import db
from models import Project, Timer

def init_database():
    """Initialize the database with all tables"""
    app = create_app()
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Test the connection
            result = db.session.execute(db.text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version}")
            
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            print("\nMake sure:")
            print("1. PostgreSQL is running")
            print("2. The database exists (create it if needed)")
            print("3. The credentials in .env are correct")
            print("4. The user has proper permissions")
        
        finally:
            db.session.close()

if __name__ == "__main__":
    init_database()
