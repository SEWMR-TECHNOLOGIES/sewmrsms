import base64
from typing import Dict, Any
from fastapi import HTTPException
import httpx
from core.config import CLIENT_ID, CLIENT_SECRET, MERCHANT_CODE, CALLBACK_URL

class PaymentGateway:
    AUTH_URL = "https://api.sasapay.co.tz/api/v1/auth/token/?grant_type=client_credentials"
    PAYMENT_REQUEST_URL = "https://api.sasapay.co.tz/api/v1/payments/request-payment/"
    TRANSACTION_STATUS_URL = "https://api.sasapay.co.tz/api/v1/transactions/status/"
    ACCOUNT_VALIDATION_URL = "https://api.sasapay.co.tz/api/v1/accounts/account-validation/"

    NETWORK_PREFIXES = {
        "76": "VODACOM",
        "75": "VODACOM",
        "74": "VODACOM",
        "65": "TIGO",
        "71": "TIGO",
        "77": "TIGO",
        "67": "TIGO",
        "69": "AIRTEL",
        "68": "AIRTEL",
        "78": "AIRTEL",
        "61": "HALOPESA",
        "62": "HALOPESA",
    }

    NETWORK_CODES = {
        "VODACOM": "VODACOM",
        "TIGO": "TIGO",
        "AIRTEL": "AIRTELMONEYTZ",
        "HALOPESA": "HALOPESA",
    }

    def __init__(self, client_id: str = CLIENT_ID, client_secret: str = CLIENT_SECRET, merchant_code: str = MERCHANT_CODE):
        self.client_id = client_id
        self.client_secret = client_secret
        self.merchant_code = merchant_code

    async def _get_auth_token(self) -> str:
        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {"Authorization": f"Basic {auth_header}"}

        async with httpx.AsyncClient() as client:
            resp = await client.get(self.AUTH_URL, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Sasapay authentication failed.")
            
            token = resp.json().get("access_token")
            if not token:
                raise HTTPException(status_code=401, detail="No access token received from Sasapay.")
            return token

    async def _validate_account(self, channel_code: str, account_number: str) -> Dict[str, Any]:
        token = await self._get_auth_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "merchant_code": self.merchant_code,
            "channel_code": channel_code,
            "account_number": account_number
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(self.ACCOUNT_VALIDATION_URL, json=payload, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Account validation failed with Sasapay.")
            return resp.json()

    async def request_payment(self, phone_number: str, amount: float, description: str, merchant_request_id: str) -> Dict[str, Any]:
        network_code = self._identify_network(phone_number)
        if network_code == "UNKNOWN":
            raise HTTPException(status_code=400, detail="Unsupported phone number network.")

        token = await self._get_auth_token()
        await self._validate_account(network_code, phone_number)

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "MerchantCode": self.merchant_code,
            "NetworkCode": network_code,
            "PhoneNumber": phone_number,
            "TransactionDesc": description,
            "AccountReference": merchant_request_id,
            "Amount": amount,
            "Currency": "TZS",
            "CallBackURL": CALLBACK_URL
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(self.PAYMENT_REQUEST_URL, json=payload, headers=headers)
            data = resp.json()
            if not data.get("status"):
                raise HTTPException(status_code=400, detail=data.get("detail", "Payment request failed."))
            return data

    async def check_transaction_status(self, checkout_request_id: str) -> str:
        token = await self._get_auth_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "MerchantCode": self.merchant_code,
            "CallbackUrl": CALLBACK_URL,
            "CheckoutRequestId": checkout_request_id
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(self.TRANSACTION_STATUS_URL, json=payload, headers=headers)
            if resp.status_code != 200:
                return "PENDING"

            data = resp.json()
            if not data.get("status"):
                return "PENDING"

            if data["data"].get("ResultCode") == "0" and data["data"].get("Paid", False):
                return "PAID"
            return "PENDING"

    @classmethod
    def _identify_network(cls, phone_number: str) -> str:
        phone = phone_number[3:] if phone_number.startswith("255") else phone_number
        provider = cls.NETWORK_PREFIXES.get(phone[:2], "UNKNOWN")
        return cls.NETWORK_CODES.get(provider, "UNKNOWN")
