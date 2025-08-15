import requests

def send_password_reset_email(to_email: str, reset_link: str, first_name: str = ""):
    """
    Sends password reset email via PHP API.
    Retains the same behavior as original SMTP function:
      - completes silently on success
      - raises exception on failure
    """
    payload = {
        "to_email": to_email,
        "reset_link": reset_link,
        "first_name": first_name
    }

    try:
        response = requests.post(
            "https://api.sewmrtechnologies.com/mail/sewmrsms/send-password-reset-request",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        if not result.get("success"):
            raise Exception(result.get("message", "Failed to send password reset email"))
    except Exception as e:
        print("Failed to send password reset email:", e)
        raise e
