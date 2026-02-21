# API Documentation - NestJS Backend

This document provides an overview of all available API endpoints and instructions on how to test them.

## Base URL
`http://localhost:3000`

---

## 1. Authentication (Public)
| Method | Route | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new user | `{ "name": "...", "email": "...", "password": "...", "role": "patient/doctor/admin" }` |
| `POST` | `/auth/login` | Login and get JWT | `{ "email": "...", "password": "..." }` |
| `GET` | `/auth/verify-email` | Verify email with token | Query: `?token=...` |
| `POST` | `/auth/forgot-password` | Request password reset | `{ "email": "..." }` |
| `POST` | `/auth/reset-password` | Reset password with token | `{ "token": "...", "newPassword": "..." }` |

---

## 2. Patient Routes
*Requires header: `Authorization: Bearer <token>`*

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/appointments/book` | Book a new appointment |
| `PUT` | `/appointments/reschedule/:id` | Update appointment time |
| `DELETE` | `/appointments/cancel/:id` | Cancel an appointment |
| `GET` | `/appointments/my` | View logged-in patient's appointments |
| `POST` | `/chat` | Chat with the medical chatbot service |
| `POST` | `/reports/upload` | Upload medical report (PDF/Images) |
| `GET` | `/reports/my` | View all uploaded reports |
| `DELETE` | `/reports/:id` | Delete a specific report |

---

## 3. Medical Reports (Patients Only)
*Requires header: `Authorization: Bearer <token>` and `patient` role*

### Upload Report
**POST** `/reports/upload`
- **Body**: `multipart/form-data`
- **Field**: `file` (PDF, JPG, PNG - max 5MB)

### View My Reports
**GET** `/reports/my`
- Returns a list of all reports uploaded by the patient.

### Delete Report
**DELETE** `/reports/:id`
- Deletes the report record and the physical file.

---

## 4. Chat Bot Service (Patients Only)
*Requires header: `Authorization: Bearer <token>` and `patient` role*

| Method | Route | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Forward message to external chatbot service | `{ "message": "...", "patient_name": "..." }` |

Response format:
```json
{
  "reply": "string (response from chatbot service)"
}
```

---

## 5. Doctor Routes
*Requires header: `Authorization: Bearer <token>` and `doctor` role*

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/doctor/appointments` | View appointments assigned to the doctor |
| `PUT` | `/doctor/availability` | Update weekly work schedule |

---

## 6. Admin Routes
*Requires header: `Authorization: Bearer <token>` and `admin` role*

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/admin/doctors` | Create a new doctor profile |
| `GET` | `/admin/doctors` | List all doctors |
| `PUT` | `/admin/doctors/:id` | Update doctor info |
| `DELETE` | `/admin/doctors/:id` | Remove a doctor |
| `GET` | `/admin/appointments` | View all appointments in the system |

---

---

## How to Test

### Step 1: Register
**POST** `/auth/signup`
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "patient"
}
```

### Step 2: Login
**POST** `/auth/login`
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "access_token": "eyJhbG..."
}
```

### Step 3: Access Protected Route
**GET** `/appointments/my`
*   **Header**: `Authorization`: `Bearer <paste_token_here>`

---

## API Test Case Data

### 1. Authentication
- **Signup (Doctor)**:
  `POST /auth/signup`
  ```json
  {
    "name": "Dr. Smith",
    "email": "smith@hospital.com",
    "password": "password123",
    "role": "doctor"
  }
  ```
- **Forgot Password**:
  `POST /auth/forgot-password`
  ```json
  {
    "email": "test@example.com"
  }
  ```
- **Reset Password**:
  `POST /auth/reset-password`
  ```json
  {
    "token": "token_from_email",
    "newPassword": "newpassword456"
  }
  ```

### 2. Appointments (Patient)
- **Book Appointment**:
  `POST /appointments/book`
  ```json
  {
    "patient_name": "Test User",
    "phone_number": "+1234567890",
    "doctor_name": "Dr. Smith",
    "appointment_date": "2026-02-10",
    "appointment_time": "10:00 AM",
    "appointment_id": "unique_apt_id_123"
  }
  ```
- **Reschedule**:
  `PUT /appointments/reschedule/:id`
  ```json
  {
    "appointment_date": "2026-02-11",
    "appointment_time": "11:30 AM"
  }
  ```

### 3. Medical Reports (Patient)
- **Upload Report**:
  `POST /reports/upload`
  - Body: `form-data`
  - Key: `file`, Type: `File`, Value: `report.pdf` or `image.png`
- **Delete Report**:
  `DELETE /reports/65b5... (mongo_id)`

### 4. Chat Bot
- **Message**:
  `POST /chat`
  ```json
  {
    "message": "I have been feeling dizzy lately.",
    "patient_name": "Test User"
  }
  ```

### 5. Doctor Actions
- **Update Availability**:
  `PUT /doctor/availability`
  ```json
  {
    "availability": [
      {
        "day": "Monday",
        "timeSlots": ["09:00 AM", "10:00 AM", "11:00 AM"]
      },
      {
        "day": "Wednesday",
        "timeSlots": ["02:00 PM", "03:00 PM"]
      }
    ]
  }
  ```

### 6. Admin Actions
- **Create Doctor Profile**:
  `POST /admin/doctors`
  ```json
  {
    "name": "Dr. Smith",
    "email": "smith@hospital.com",
    "specialization": "Cardiology",
    "experience": 10,
    "description": "Expert in heart health.",
    "availability": [
      {
        "day": "Monday",
        "timeSlots": ["09:00 AM", "10:00 AM"]
      }
    ]
  }
  ```
