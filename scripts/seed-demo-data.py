#!/usr/bin/env python3
"""
Demo Data Seeder for NGX Pulse
Generates realistic demo data for sales demonstrations and testing
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from supabase import create_client, Client
    import asyncio
except ImportError:
    print("❌ Missing dependencies. Install with: pip install supabase asyncio")
    sys.exit(1)

class DemoDataSeeder:
    """Generate realistic demo data for NGX Pulse"""
    
    def __init__(self):
        # Load environment variables
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            print("❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
            sys.exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.demo_users = []
        
    def create_demo_users(self) -> List[Dict[str, Any]]:
        """Create demo user profiles"""
        users = [
            {
                "email": "alice.johnson@demo.ngxpulse.com",
                "name": "Alice Johnson",
                "profile": {
                    "age": 28,
                    "gender": "female",
                    "fitness_level": "intermediate",
                    "goals": ["weight_loss", "strength_building"],
                    "health_conditions": ["none"],
                    "activity_level": "active"
                }
            },
            {
                "email": "carlos.rodriguez@demo.ngxpulse.com", 
                "name": "Carlos Rodriguez",
                "profile": {
                    "age": 34,
                    "gender": "male",
                    "fitness_level": "advanced",
                    "goals": ["muscle_gain", "performance"],
                    "health_conditions": ["none"],
                    "activity_level": "very_active"
                }
            },
            {
                "email": "sarah.chen@demo.ngxpulse.com",
                "name": "Sarah Chen",
                "profile": {
                    "age": 42,
                    "gender": "female", 
                    "fitness_level": "beginner",
                    "goals": ["general_health", "stress_management"],
                    "health_conditions": ["hypertension"],
                    "activity_level": "lightly_active"
                }
            }
        ]
        
        print("👥 Creating demo users...")
        created_users = []
        
        for user_data in users:
            try:
                # Create auth user (this would normally be done through Supabase Auth)
                user_id = str(uuid.uuid4())
                
                # Insert user profile
                profile_data = {
                    "id": user_id,
                    "email": user_data["email"],
                    "name": user_data["name"],
                    **user_data["profile"],
                    "created_at": datetime.utcnow().isoformat(),
                    "is_demo": True
                }
                
                # Insert into users table (adjust table name as needed)
                result = self.supabase.table('user_profiles').insert(profile_data).execute()
                created_users.append({**profile_data, "id": user_id})
                
                print(f"✅ Created user: {user_data['name']}")
                
            except Exception as e:
                print(f"⚠️ Failed to create user {user_data['name']}: {e}")
        
        return created_users
    
    def generate_health_data(self, user_id: str, days: int = 30) -> None:
        """Generate realistic health data for a user"""
        print(f"📊 Generating {days} days of health data for user {user_id[:8]}...")
        
        base_date = datetime.now() - timedelta(days=days)
        health_records = []
        
        # Base values (simulate individual variation)
        base_weight = random.uniform(60, 90)
        base_heart_rate = random.randint(60, 80)
        base_steps = random.randint(6000, 12000)
        base_sleep = random.uniform(6.5, 8.5)
        
        for day in range(days):
            current_date = base_date + timedelta(days=day)
            
            # Add realistic daily variation
            daily_weight = base_weight + random.uniform(-0.5, 0.5)
            daily_hr = base_heart_rate + random.randint(-10, 15)
            daily_steps = base_steps + random.randint(-2000, 3000)
            daily_sleep = base_sleep + random.uniform(-1, 1)
            
            # Simulate weekend patterns
            if current_date.weekday() >= 5:  # Weekend
                daily_steps = int(daily_steps * random.uniform(0.7, 1.3))
                daily_sleep += random.uniform(0, 1)
            
            health_record = {
                "user_id": user_id,
                "date": current_date.date().isoformat(),
                "weight_kg": round(daily_weight, 1),
                "resting_heart_rate": max(50, daily_hr),
                "steps": max(0, daily_steps),
                "sleep_hours": round(max(4, daily_sleep), 1),
                "calories_burned": random.randint(1800, 2800),
                "active_minutes": random.randint(20, 90),
                "stress_level": random.randint(1, 10),
                "mood_score": random.randint(3, 10),
                "created_at": current_date.isoformat()
            }
            
            health_records.append(health_record)
        
        # Batch insert health data
        try:
            self.supabase.table('health_data').insert(health_records).execute()
            print(f"✅ Inserted {len(health_records)} health records")
        except Exception as e:
            print(f"⚠️ Failed to insert health data: {e}")
    
    def generate_workout_data(self, user_id: str, days: int = 30) -> None:
        """Generate realistic workout data"""
        print(f"💪 Generating workout data for user {user_id[:8]}...")
        
        workout_types = [
            {"name": "Push Workout", "muscle_groups": ["chest", "shoulders", "triceps"]},
            {"name": "Pull Workout", "muscle_groups": ["back", "biceps"]},
            {"name": "Leg Workout", "muscle_groups": ["quadriceps", "hamstrings", "glutes"]},
            {"name": "Cardio Session", "muscle_groups": ["cardiovascular"]},
            {"name": "Full Body", "muscle_groups": ["full_body"]}
        ]
        
        exercises = {
            "chest": ["Bench Press", "Push-ups", "Chest Fly", "Incline Press"],
            "back": ["Pull-ups", "Rows", "Lat Pulldown", "Deadlift"],
            "legs": ["Squats", "Lunges", "Leg Press", "Calf Raises"],
            "shoulders": ["Shoulder Press", "Lateral Raises", "Front Raises"],
            "arms": ["Bicep Curls", "Tricep Dips", "Hammer Curls"]
        }
        
        base_date = datetime.now() - timedelta(days=days)
        workouts = []
        
        # Generate 3-4 workouts per week
        workout_days = []
        for week in range(days // 7):
            week_start = week * 7
            # Pick 3-4 random days of the week
            days_this_week = random.sample(range(7), random.randint(3, 4))
            workout_days.extend([week_start + day for day in days_this_week])
        
        for day_offset in workout_days:
            if day_offset >= days:
                continue
                
            workout_date = base_date + timedelta(days=day_offset)
            workout_type = random.choice(workout_types)
            
            workout = {
                "user_id": user_id,
                "date": workout_date.date().isoformat(),
                "workout_name": workout_type["name"],
                "duration_minutes": random.randint(30, 90),
                "calories_burned": random.randint(200, 600),
                "notes": f"Great {workout_type['name'].lower()} session!",
                "created_at": workout_date.isoformat()
            }
            
            workouts.append(workout)
        
        # Insert workout data
        try:
            self.supabase.table('workouts').insert(workouts).execute()
            print(f"✅ Inserted {len(workouts)} workout records")
        except Exception as e:
            print(f"⚠️ Failed to insert workout data: {e}")
    
    def generate_nutrition_data(self, user_id: str, days: int = 30) -> None:
        """Generate realistic nutrition data"""
        print(f"🍎 Generating nutrition data for user {user_id[:8]}...")
        
        meals = {
            "breakfast": [
                {"name": "Oatmeal with berries", "calories": 350, "protein": 12, "carbs": 65, "fat": 8},
                {"name": "Scrambled eggs with toast", "calories": 420, "protein": 25, "carbs": 35, "fat": 18},
                {"name": "Greek yogurt with granola", "calories": 380, "protein": 20, "carbs": 45, "fat": 12}
            ],
            "lunch": [
                {"name": "Chicken salad", "calories": 450, "protein": 35, "carbs": 20, "fat": 25},
                {"name": "Quinoa bowl", "calories": 520, "protein": 18, "carbs": 75, "fat": 15},
                {"name": "Sandwich and soup", "calories": 480, "protein": 22, "carbs": 55, "fat": 18}
            ],
            "dinner": [
                {"name": "Salmon with vegetables", "calories": 580, "protein": 40, "carbs": 25, "fat": 35},
                {"name": "Chicken stir-fry", "calories": 510, "protein": 38, "carbs": 45, "fat": 20},
                {"name": "Pasta with marinara", "calories": 620, "protein": 20, "carbs": 85, "fat": 18}
            ]
        }
        
        base_date = datetime.now() - timedelta(days=days)
        nutrition_records = []
        
        for day in range(days):
            current_date = base_date + timedelta(days=day)
            daily_nutrition = {
                "user_id": user_id,
                "date": current_date.date().isoformat(),
                "total_calories": 0,
                "total_protein": 0,
                "total_carbs": 0,
                "total_fat": 0,
                "meals": [],
                "water_intake_ml": random.randint(1500, 3000),
                "created_at": current_date.isoformat()
            }
            
            # Add meals for the day
            for meal_type in ["breakfast", "lunch", "dinner"]:
                if random.random() > 0.1:  # 90% chance of having each meal
                    meal = random.choice(meals[meal_type])
                    daily_nutrition["total_calories"] += meal["calories"]
                    daily_nutrition["total_protein"] += meal["protein"]
                    daily_nutrition["total_carbs"] += meal["carbs"]
                    daily_nutrition["total_fat"] += meal["fat"]
                    daily_nutrition["meals"].append({
                        "type": meal_type,
                        "name": meal["name"],
                        "calories": meal["calories"],
                        "time": f"{random.randint(7,22):02d}:{random.randint(0,59):02d}"
                    })
            
            nutrition_records.append(daily_nutrition)
        
        # Insert nutrition data
        try:
            self.supabase.table('nutrition_logs').insert(nutrition_records).execute()
            print(f"✅ Inserted {len(nutrition_records)} nutrition records")
        except Exception as e:
            print(f"⚠️ Failed to insert nutrition data: {e}")
    
    def generate_ai_insights(self, user_id: str) -> None:
        """Generate AI coaching insights"""
        print(f"🤖 Generating AI insights for user {user_id[:8]}...")
        
        insights = [
            {
                "user_id": user_id,
                "type": "recommendation",
                "title": "Improve Sleep Quality",
                "message": "Your sleep duration has been inconsistent. Try establishing a regular bedtime routine.",
                "priority": "medium",
                "category": "sleep",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "user_id": user_id,
                "type": "achievement",
                "title": "Step Goal Achieved!",
                "message": "Congratulations! You've reached your daily step goal 5 days in a row.",
                "priority": "low",
                "category": "activity",
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
            },
            {
                "user_id": user_id,
                "type": "alert",
                "title": "Hydration Reminder",
                "message": "Your water intake has been below target. Consider setting hourly reminders.",
                "priority": "high",
                "category": "nutrition",
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
            }
        ]
        
        try:
            self.supabase.table('ai_insights').insert(insights).execute()
            print(f"✅ Inserted {len(insights)} AI insights")
        except Exception as e:
            print(f"⚠️ Failed to insert AI insights: {e}")
    
    def run_seeder(self, days: int = 30) -> None:
        """Run the complete demo data seeding process"""
        print("🌱 Starting NGX Pulse Demo Data Seeder...")
        print(f"📅 Generating {days} days of historical data")
        print("-" * 50)
        
        try:
            # Create demo users
            users = self.create_demo_users()
            
            if not users:
                print("❌ No users created. Aborting seed process.")
                return
            
            # Generate data for each user
            for user in users:
                user_id = user["id"]
                print(f"\n📋 Processing user: {user['name']}")
                
                # Generate different types of data
                self.generate_health_data(user_id, days)
                self.generate_workout_data(user_id, days)
                self.generate_nutrition_data(user_id, days)
                self.generate_ai_insights(user_id)
                
                print(f"✅ Completed data generation for {user['name']}")
            
            print("\n" + "=" * 50)
            print("🎉 Demo data seeding completed successfully!")
            print(f"👥 Created {len(users)} demo users")
            print(f"📊 Generated {days} days of comprehensive health data")
            print("🔑 Demo user credentials:")
            for user in users:
                print(f"   - {user['email']} (Password: demo123)")
            
        except Exception as e:
            print(f"❌ Seeding failed: {e}")
            sys.exit(1)

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed demo data for NGX Pulse')
    parser.add_argument('--days', type=int, default=30, help='Number of days of historical data to generate')
    parser.add_argument('--clean', action='store_true', help='Clean existing demo data first')
    
    args = parser.parse_args()
    
    seeder = DemoDataSeeder()
    
    if args.clean:
        print("🧹 Cleaning existing demo data...")
        try:
            # Clean demo data (be careful in production!)
            seeder.supabase.table('health_data').delete().eq('user_id', 'demo').execute()
            seeder.supabase.table('workouts').delete().eq('user_id', 'demo').execute()
            seeder.supabase.table('nutrition_logs').delete().eq('user_id', 'demo').execute()
            seeder.supabase.table('ai_insights').delete().eq('user_id', 'demo').execute()
            print("✅ Demo data cleaned")
        except Exception as e:
            print(f"⚠️ Clean failed: {e}")
    
    seeder.run_seeder(args.days)

if __name__ == "__main__":
    main()