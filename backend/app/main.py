from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from api.routes import user, subscription, sms_templates, messaging, contacts, sender_id, cron_jobs, auth

app = FastAPI(title="SEWMR SMS API", version="1.0.0")

API_PREFIX = "/api/v1"

# Root route
@app.get("/")
def root():
    return {"message": "Welcome to SEWMR SMS"}

# Include routers with versioned prefix
app.include_router(user.router, prefix=f"{API_PREFIX}/users", tags=["Users"])
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(sender_id.router, prefix=f"{API_PREFIX}/sender-ids", tags=["Sender IDs"])
app.include_router(subscription.router, prefix=f"{API_PREFIX}/subscriptions", tags=["Subscriptions"])
app.include_router(sms_templates.router, prefix=f"{API_PREFIX}/templates", tags=["Templates"])
app.include_router(messaging.router, prefix=f"{API_PREFIX}/messagings", tags=["Messaging"])
app.include_router(contacts.router, prefix=f"{API_PREFIX}/contacts", tags=["Contacts"])
app.include_router(cron_jobs.router, prefix=f"{API_PREFIX}/cron-jobs", tags=["Cron Jobs"])

# Custom HTTPException handler
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
