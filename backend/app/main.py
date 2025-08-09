from fastapi import FastAPI
from api.routes import user 

app = FastAPI()

# Root route
@app.get("/")
def root():
    return {"message": "Welcome to SERWMR Bulk SMS API"}

# Include routers
app.include_router(user.router, prefix="/user", tags=["Users"])
