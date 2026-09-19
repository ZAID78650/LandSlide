from database import SessionLocal
from models import User, Role

db = SessionLocal()
user = db.query(User).filter(User.email == "szaid8364@eng.rizvi.edu.in").first()
admin_role = db.query(Role).filter(Role.name == "SUPER_ADMIN").first()

if user and admin_role:
    user.role_id = admin_role.id
    db.commit()
    print("User upgraded to SUPER_ADMIN successfully!")
else:
    print(f"User found: {user is not None}, Admin Role found: {admin_role is not None}")
db.close()
