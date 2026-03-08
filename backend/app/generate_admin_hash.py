"""
Generate admin password hash and update the seed SQL.
Run this once to get the hash, then paste it into admin_schema.sql.

Usage:
  cd backend/app
  python3 generate_admin_hash.py
"""
from utils.security import Hasher

password = "Admin@12345"
hashed = Hasher.hash_password(password)

print("=" * 60)
print("Admin Seed Password Hash")
print("=" * 60)
print(f"Password: {password}")
print(f"Hash:     {hashed}")
print("=" * 60)
print()
print("Copy the hash above and replace 'REPLACE_WITH_HASH' in:")
print("  backend/app/db/admin_schema.sql")
print()
print("After deployment, change the password immediately!")
