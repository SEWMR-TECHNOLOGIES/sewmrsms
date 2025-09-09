from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.routes import subscription, sms_templates, sms, contacts, sender_id, cron, auth, plans, payments

app = FastAPI(title="SEWMR SMS API", version="1.0.0")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",          # dev
        "https://app.sewmrsms.co.tz",     # production frontend
        "https://sewmrsms.co.tz"          # production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

# Root route
@app.get("/")
def root():
    return {"message": "Welcome to SEWMR SMS"}

# Include routers
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(plans.router, prefix=f"{API_PREFIX}/plans", tags=["Plans"])
app.include_router(sender_id.router, prefix=f"{API_PREFIX}/sender-ids", tags=["Sender IDs"])
app.include_router(subscription.router, prefix=f"{API_PREFIX}/subscriptions", tags=["Subscriptions"])
app.include_router(sms_templates.router, prefix=f"{API_PREFIX}/templates", tags=["Templates"])
app.include_router(sms.router, prefix=f"{API_PREFIX}/sms", tags=["Messaging"])
app.include_router(payments.router, prefix=f"{API_PREFIX}/payments", tags=["Payments"])
app.include_router(contacts.router, prefix=f"{API_PREFIX}/contacts", tags=["Contacts"])
app.include_router(cron.router, prefix=f"{API_PREFIX}/cron", tags=["Cron Jobs"])

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
