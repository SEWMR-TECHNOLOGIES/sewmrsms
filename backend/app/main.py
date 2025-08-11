from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from api.routes import user, subscription, sms_templates, messaging  # include both modules

app = FastAPI()

# Root route
@app.get("/")
def root():
    return {"message": "Welcome to SERWMR Bulk SMS API"}

# Include routers
app.include_router(user.router, prefix="/user", tags=["Users"])
app.include_router(subscription.router, prefix="/subscription", tags=["Subscriptions"])
app.include_router(sms_templates.router, prefix="/templates", tags=["Templates"])  # fixed tags as list
app.include_router(messaging.router, prefix="/messaging", tags=["Messaging"])

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

# Uncomment and customize if you want to handle validation errors uniformly
# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     return JSONResponse(
#         status_code=422,
#         content={
#             "success": False,
#             "message": "Invalid request: Please send the correct content type and required fields.",
#             "data": None
#         },
#     )
