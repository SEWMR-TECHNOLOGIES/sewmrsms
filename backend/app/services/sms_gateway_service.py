import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException
from core.config import API_ID, API_PASSWORD, SMS_CALLBACK_URL

GSM_7BIT_BASIC = (
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
)
GSM_7BIT_EXTENDED = "^{}\\[~]|€"


class SmsGatewayService:
    BASE_URL = "https://api.sprintsmsservice.com/api/SendSMS"
    SMS_TYPE_TRANSACTIONAL = "T"
    ENCODING_UNICODE = "U"
    ENCODING_TEXT = "T"

    def __init__(self, sender_id: str):
        self.api_id = API_ID
        self.api_password = API_PASSWORD
        self.sender_id = sender_id

    @staticmethod
    def count_gsm7_septets(message: str) -> Optional[int]:
        count = 0
        for ch in message:
            if ch in GSM_7BIT_BASIC:
                count += 1
            elif ch in GSM_7BIT_EXTENDED:
                count += 2
            else:
                return None
        return count

    @staticmethod
    def get_sms_parts_and_length(message: str) -> tuple[int, int, str]:
        septets = SmsGatewayService.count_gsm7_septets(message)
        if septets is not None:
            if septets <= 160:
                return 1, 160, "GSM-7"
            parts = (septets + 152) // 153
            return parts, 153, "GSM-7"
        else:
            length = len(message)
            if length <= 70:
                return 1, 70, "UCS-2"
            parts = (length + 66) // 67
            return parts, 67, "UCS-2"

    async def send_sms(
        self,
        phone_number: str,
        message: str,
        uid: Optional[str] = None,
        callback_url: Optional[str] = None,
        templateid: Optional[str] = None,
        validity_seconds: int = 172800,
        pe_id: Optional[str] = None,
        dlt_template_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if callback_url is None:
            callback_url = SMS_CALLBACK_URL

        payload = {
            "api_id": self.api_id,
            "api_password": self.api_password,
            "sms_type": self.SMS_TYPE_TRANSACTIONAL,
            "encoding": self.ENCODING_TEXT,
            "sender_id": self.sender_id,
            "phonenumber": phone_number,
            "textmessage": message,
            "templateid": templateid,
            "ValidityPeriodInSeconds": validity_seconds,
            "uid": uid,
            "callback_url": callback_url,
            "pe_id": pe_id,
            "template_id": dlt_template_id,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.BASE_URL, json=payload, timeout=10)
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "message": f"HTTP error: {e.response.status_code}",
                    "data": {"details": e.response.text},
                }
            except httpx.RequestError as e:
                return {
                    "success": False,
                    "message": "Request error: " + str(e),
                    "data": None,
                }

        if data.get("status") == "S":
            return {
                "success": True,
                "message": "Message sent successfully",
                "data": {
                    "message_id": data.get("message_id"),
                    "uid": data.get("uid"),
                    "remarks": data.get("remarks"),
                },
            }
        else:
            return {
                "success": False,
                "message": "Failed to send message",
                "data": {"error": data.get("remarks", "Unknown error")},
            }

    async def send_sms_with_parts_check(
        self,
        phone_number: str,
        message: str,
        **kwargs,
    ) -> Dict[str, Any]:
        parts, per_part_len, encoding = self.get_sms_parts_and_length(message)
        if parts is None:
            raise HTTPException(status_code=400, detail="Message contains unsupported characters")

        result = await self.send_sms(phone_number, message, **kwargs)
        result["data"] = result.get("data", {})
        result["data"].update(
            {
                "num_parts": parts,
                "encoding": encoding,
                "max_chars_per_part": per_part_len,
                "message_length": len(message),
            }
        )
        return result
