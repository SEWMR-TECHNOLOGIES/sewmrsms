# 📄 SEWMR SMS API Documentation

**Base URL:** `https://api.sewmrsms.co.tz/api/v1`

---

## 🔐 Authentication

### Obtaining Your API Token

API tokens are generated from the **SEWMR SMS Dashboard**, not via API.

**Steps to get your API token:**
1. Log in to [SEWMR SMS Dashboard](https://sewmrsms.co.tz/app)
2. Navigate to **Settings → API Tokens**
3. Click **"Generate New Token"**
4. Give your token a name (e.g., "My App Integration")
5. Copy and securely store the token (it will only be shown once)

### Using the Token

Include your token in all API requests:

```
Authorization: Bearer your_api_token_here
```

---

## 📱 Phone Number Format

All recipient phone numbers **must** be Tanzanian numbers in format:
```
255XXXXXXXXX
```
- Must start with `255`
- Followed by `6` or `7`
- Then 8 more digits
- **Example:** `255712345678`

---

## 📝 Sender ID Format

The `sender_id` field accepts **either**:

| Format | Example | Description |
|--------|---------|-------------|
| **Alias (Name)** | `SEWMR SMS` | Your registered sender name/alias |
| **UUID** | `550e8400-e29b-41d4-a716-446655440000` | Unique identifier from dashboard |

> 💡 **Tip:** Using the alias (e.g., `SEWMR SMS`) is often more readable and easier to work with.

---

## 👤 User Endpoints

### Get Current User Info

Retrieve authenticated user's information and SMS balance.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer your_api_token_here
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User authenticated",
  "data": {
    "id": 1,
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "255712345678",
    "remaining_sms": 500
  }
}
```

---

### List API Tokens

View all your API tokens.

**Endpoint:** `GET /auth/api-tokens`

**Headers:**
```
Authorization: Bearer your_api_token_here
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "My App Integration",
      "token_masked": "****-****-****-abc123",
      "created_at": "2025-01-01T10:00:00",
      "expires_at": "2025-01-31T10:00:00",
      "status": "active",
      "last_used": "2025-01-02T15:30:00"
    }
  ]
}
```

---

### Revoke API Token

Deactivate a token without deleting it.

**Endpoint:** `POST /auth/api-tokens/{token_id}/revoke`

**Headers:**
```
Authorization: Bearer your_api_token_here
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token revoked successfully",
  "data": null
}
```

---

### Delete API Token

Permanently delete a token.

**Endpoint:** `DELETE /auth/api-tokens/{token_id}`

**Headers:**
```
Authorization: Bearer your_api_token_here
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token deleted successfully",
  "data": null
}
```

---

## 📤 SMS Endpoints

### Quick Send SMS

Send SMS to multiple recipients with optional scheduling.

**Endpoint:** `POST /sms/quick-send`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer your_api_token_here
```

#### Immediate Send (No Schedule)

**Request Body:**
```json
{
  "sender_id": "SEWMR SMS",
  "message": "Hello! Your order #12345 has been shipped.",
  "recipients": "255712345678\n255723456789\n255734567890",
  "schedule": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sent SMS to 3 recipients. 0 errors.",
  "errors": [],
  "data": {
    "total_sent": 3,
    "total_parts_used": 3,
    "remaining_sms": 497,
    "sent_messages": [
      {
        "recipient": "255712345678",
        "sms_gateway_response": {
          "message_id": "msg_abc123",
          "status": "sent"
        }
      }
    ]
  }
}
```

#### Scheduled Send

**Request Body:**
```json
{
  "sender_id": "SEWMR SMS",
  "message": "Reminder: Your appointment is tomorrow at 10:00 AM.",
  "recipients": "255712345678\n255723456789",
  "schedule": true,
  "scheduled_for": "2025-01-15 09:00:00",
  "schedule_name": "Appointment Reminders"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scheduled SMS to 2 recipients.",
  "errors": [],
  "data": {
    "schedule_uuid": "sch-12345-abcdef",
    "scheduled_for": "2025-01-15T09:00:00",
    "total_recipients": 2,
    "failed_recipients": 0
  }
}
```

---

### Quick Send to Contact Group

Send personalized SMS to a contact group with placeholder support.

**Endpoint:** `POST /sms/quick-send/group`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer your_api_token_here
```

#### Available Placeholders
Use contact fields as placeholders: `{first_name}`, `{last_name}`, `{phone}`, etc.

#### Immediate Send to Group

**Request Body:**
```json
{
  "sender_id": "SEWMR SMS",
  "message": "Hello {first_name}, your balance is now available!",
  "group_uuid": "grp-12345-abcdef",
  "schedule": false
}
```

**Special `group_uuid` Values:**
| Value | Description |
|-------|-------------|
| `"all"` | Send to all contacts |
| `"none"` | Send to contacts without a group |
| `UUID` | Send to specific group |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sent SMS to 50 recipients. 2 errors.",
  "errors": [
    {"recipient": "255700000000", "error": "Invalid phone number format"}
  ],
  "data": {
    "total_sent": 50,
    "total_parts_used": 50,
    "remaining_sms": 450,
    "sent_messages": [
      {
        "recipient": "255712345678",
        "sms_gateway_response": {
          "message_id": "msg_xyz789",
          "status": "sent"
        }
      }
    ]
  }
}
```

#### Scheduled Send to Group

**Request Body:**
```json
{
  "sender_id": "SEWMR SMS",
  "message": "Hi {first_name}, don't miss our sale this weekend!",
  "group_uuid": "grp-12345-abcdef",
  "schedule": true,
  "scheduled_for": "2025-01-20 08:00:00",
  "schedule_name": "Weekend Sale Promo"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scheduled SMS to 100 recipients.",
  "errors": [],
  "data": {
    "schedule_uuid": "sch-67890-ghijkl",
    "scheduled_for": "2025-01-20T08:00:00",
    "total_recipients": 100,
    "failed_recipients": 0
  }
}
```

---

### Send SMS from File (Bulk Upload)

Send personalized bulk SMS using an Excel or CSV file.

**Endpoint:** `POST /sms/send-from-file`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer your_api_token_here
```

#### Immediate Send from File

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sender_id` | string | ✅ | Sender alias (e.g., `SEWMR SMS`) or UUID |
| `message_template` | string | ✅ | Message with placeholders |
| `template_uuid` | string | ✅ | Template UUID from dashboard |
| `file` | file | ✅ | Excel (.xlsx) or CSV file |
| `update_template` | boolean | ❌ | Update template message (default: false) |
| `schedule_flag` | boolean | ❌ | Enable scheduling (default: false) |
| `scheduled_for` | string | ❌ | Schedule datetime (if scheduling) |
| `schedule_name` | string | ❌ | Name for the schedule |

**Example Request (cURL):**
```bash
curl -X POST "https://api.sewmrsms.co.tz/api/v1/sms/send-from-file" \
  -H "Authorization: Bearer your_api_token_here" \
  -F "sender_id=SEWMR SMS" \
  -F "message_template=Hello {name}, your code is {code}" \
  -F "template_uuid=tmpl-12345-abcdef" \
  -F "file=@contacts.xlsx" \
  -F "schedule_flag=false"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sent 150 SMS messages. 3 errors.",
  "errors": [
    {"row": 5, "phone": "invalid", "error": "Invalid or missing phone number"}
  ],
  "data": {
    "total_sent": 150,
    "total_parts_used": 150,
    "remaining_sms": 350,
    "sent_messages": [...]
  }
}
```

#### Scheduled Send from File

**Form Data (additional fields):**
```
schedule_flag=true
scheduled_for=2025-01-25 10:00:00
schedule_name=Monthly Newsletter
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scheduled 150 personalized SMS messages.",
  "errors": [],
  "data": {
    "schedule_uuid": "sch-bulk-12345",
    "scheduled_for": "2025-01-25 10:00:00",
    "total_recipients": 150,
    "failed_recipients": 0
  }
}
```

---

## ❌ Common Error Responses

| Status | Message | Cause |
|--------|---------|-------|
| `400` | `"sender_id is required"` | Missing sender_id field |
| `400` | `"message is required"` | Missing message field |
| `400` | `"recipients is required"` | Missing recipients field |
| `401` | `"Invalid or expired API token"` | Token is invalid, expired, or revoked |
| `403` | `"Insufficient SMS balance or no active subscription"` | No SMS credits remaining |
| `404` | `"Sender ID not found or not owned by user"` | Invalid sender_id |
| `415` | `"Invalid content type. Expected application/json"` | Wrong Content-Type header |

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description here",
  "data": null
}
```

---

## 📊 Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/me` | GET | Get current user info |
| `/auth/api-tokens` | GET | List all API tokens |
| `/auth/api-tokens/{id}/revoke` | POST | Revoke a token |
| `/auth/api-tokens/{id}` | DELETE | Delete a token |
| `/sms/quick-send` | POST | Send SMS to multiple recipients |
| `/sms/quick-send/group` | POST | Send personalized SMS to contact group |
| `/sms/send-from-file` | POST | Bulk SMS from Excel/CSV file |

---