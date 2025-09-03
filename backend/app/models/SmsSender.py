import requests

class SewmrSMSClient:
    def __init__(self):
        """
        Initialize SewmrSMS client with a predefined access token.
        """
        self.base_url = "https://api.sewmrsms.co.tz/api/v1/"
        # Define your token here
        self.access_token = "YOUR_ACCESS_TOKEN_HERE"
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def send_quick_sms(self, sender_id: str, message: str, recipients: list, schedule: bool = False,
                       scheduled_for: str = None, schedule_name: str = None):
        """
        Send SMS to one or multiple recipients.

        :param sender_id: Sender ID UUID
        :param message: SMS message text
        :param recipients: List of phone numbers
        :param schedule: Whether to schedule the message (true/false)
        :param scheduled_for: Scheduled date-time (YYYY-MM-DD HH:MM:SS) if schedule=True
        :param schedule_name: Optional schedule title
        :return: JSON response from API
        """
        url = f"{self.base_url}sms/quick-send"
        payload = {
            "sender_id": sender_id,
            "message": message,
            "recipients": "\n".join(recipients),
            "schedule": schedule,
        }

        if schedule and scheduled_for:
            payload["scheduled_for"] = scheduled_for
        if schedule_name:
            payload["schedule_name"] = schedule_name

        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()

    def send_group_sms(self, sender_id: str, message: str, group_uuid: str, schedule: bool = False,
                       scheduled_for: str = None, schedule_name: str = None):
        """
        Send SMS to a contact group.

        :param sender_id: Sender ID UUID
        :param message: SMS message text
        :param group_uuid: Contact group UUID (or "all"/"none")
        :param schedule: Whether to schedule the message (true/false)
        :param scheduled_for: Scheduled date-time (YYYY-MM-DD HH:MM:SS) if schedule=True
        :param schedule_name: Optional schedule title
        :return: JSON response from API
        """
        url = f"{self.base_url}sms/quick-send/group"
        payload = {
            "sender_id": sender_id,
            "message": message,
            "group_uuid": group_uuid,
            "schedule": schedule,
        }

        if schedule and scheduled_for:
            payload["scheduled_for"] = scheduled_for
        if schedule_name:
            payload["schedule_name"] = schedule_name

        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()
    
    
    def get_sender_ids(self):
        """
        Fetch a list of sender IDs for the authenticated user.

        :return: JSON response from API
        """
        url = f"{self.base_url}sender-ids"
        response = requests.get(url, headers=self.headers)
        return response.json()


# EXAMPLE USAGE:

# Initialize without passing token
client = SewmrSMSClient()

# 1. Fetch available sender IDs
sender_ids_response = client.get_sender_ids()
print("Sender IDs:", sender_ids_response)

# 2. Send quick SMS
response = client.send_quick_sms(
    sender_id="e8f76c65-3e9b-4d9b-9bb8-01b2e645a3e1",
    message="Hello from SewmrSMS!",
    recipients=["255712345678", "255713456789"]
)
print("Quick SMS Response:", response)

# 3. Send group SMS
response = client.send_group_sms(
    sender_id="e8f76c65-3e9b-4d9b-9bb8-01b2e645a3e1",
    message="Hello Group!",
    group_uuid="1f49d2e4-1a2b-4e8c-9a3b-dbc51b6c9852"
)
print("Group SMS Response:", response)
