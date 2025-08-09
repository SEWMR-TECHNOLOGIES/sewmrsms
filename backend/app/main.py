from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from api.routes import user, subscription

app = FastAPI()

# Root route
@app.get("/")
def root():
    return {"message": "Welcome to SERWMR Bulk SMS API"}

# Include routers
app.include_router(user.router, prefix="/user", tags=["Users"])
app.include_router(subscription.router, prefix="/subscription", tags=["Subscriptions"])

# Custom HTTPException handler for uniform error responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "data": None
        }
    )
