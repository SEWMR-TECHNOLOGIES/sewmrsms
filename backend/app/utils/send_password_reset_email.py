import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import FROM_EMAIL, FROM_NAME, SMTP_HOST, SMTP_PASSWORD, SMTP_USER

def send_password_reset_email(to_email: str, reset_link: str, first_name: str = ""):
    from datetime import datetime
    import pytz

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    subject = "Password Reset Request"
    greeting_name = first_name if first_name else "there"

    body = f"""
    <html>
    <head>
      <style>
        body {{
          font-family: Arial, sans-serif;
          background-color: #f4f6f8;
          color: #333333;
          margin: 0;
          padding: 0;
        }}
        .container {{
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          text-align: center;
        }}
        .logo {{
          max-width: 120px;
          margin-bottom: 20px;
        }}
        h2 {{
          background: linear-gradient(135deg, hsl(6, 99%, 64%), hsl(6, 99%, 58%));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 24px;
          margin-bottom: 20px;
        }}
        p {{
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 20px;
        }}
        a.button {{
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, hsl(6, 99%, 64%), hsl(6, 99%, 58%));
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }}
        .footer {{
          font-size: 12px;
          color: #999999;
          margin-top: 30px;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <img src="https://app.sewmrsms.co.tz/assets/logo-C8LRBZc2.png" alt="SEWMR SMS Logo" class="logo"/>
        <h2>Password Reset Request</h2>
        <p>Hi {greeting_name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <p>
          <a href="{reset_link}" class="button" target="_blank" rel="noopener noreferrer">Reset Password</a>
        </p>
        <p>If you did not request this, please ignore this email. This link will expire in 15 minutes.</p>
        <p>Thanks,<br>SEWMR SMS Support Team</p>
        <div class="footer">
          &copy; {now.year} SEWMR SMS. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Reply-To"] = FROM_EMAIL
    msg.attach(MIMEText(body, "html"))

    try:
        server = smtplib.SMTP(SMTP_HOST, smtplib.SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print("Failed to send password reset email:", e)
        raise e