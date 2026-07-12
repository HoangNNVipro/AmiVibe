# AmiVibe E-Commerce System

## 1. Introduction

AmiVibe is a full-stack e-commerce platform that provides online shopping functionalities, including product management, shopping cart, order processing, online payment, real-time chat, and AI-powered virtual try-on features.

The system consists of multiple modules:

* Frontend (Customer Website)
* Admin Dashboard
* Backend API Server
* AI Try-On Frontend
* AI Try-On Backend

---

## 2. Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT Authentication
* Cloudinary

### Payment Integration

* Stripe
* Razorpay

### AI Module

* Gemini API
* React + TypeScript
* Express + TypeScript

---

## 3. Project Structure

```text
AmiVibe/
│
├── frontend/                # Customer Website
├── admin/                   # Admin Dashboard
├── backend/                 # Backend API Server
│
├── aitryon/
│   ├── frontend/            # AI Try-On Frontend
│   └── backend/             # AI Try-On Backend
│
└── README.md
```

---

## 4. Environment Configuration

Before running the project, create the required `.env` files for each module.

### Backend

Create:

```text
backend/.env
```

Example:

```env
MONGODB_URI = 
CLOUDINARY_API_KEY = 
CLOUDINARY_SECRET_KEY = 
CLOUDINARY_NAME = 
JWT_SECRET = 
ADMIN_EMAIL = 
ADMIN_PASSWORD = 
STRIPE_SECRET_KEY = 
RAZORPAY_KEY_SECRET = 
RAZORPAY_KEY_ID = 
```

### Frontend

Create:

```text
frontend/.env
```

Example:

```env
VITE_BACKEND_URL = 
VITE_RAZORPAY_KEY_ID = 
```

### Admin

Create:

```text
admin/.env
```

Example:

```env
VITE_BACKEND_URL = 
VITE_AI_VIRTUAL_TRY_ON_URL= 
```

### AI Try-On Frontend

Create:

```text
aitryon/frontend/.env
```

Example:

```env
VITE_BACKEND_URL=
ADMIN_URL=
```

### AI Try-On Backend

Create:

```text
aitryon/backend/.env
```

Example:

```env
MONGODB_URI =
CLOUDINARY_NAME =
CLOUDINARY_API_KEY =
CLOUDINARY_SECRET_KEY =
GEMINI_API_KEY =
GEMINI_MODEL =
FRONTEND_URL =
JWT_SECRET =
```

---

## 5. Clone Repository

```bash
git clone https://github.com/HoangNNVipro/AmiVibe.git
cd AmiVibe
```

---

## 6. Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Admin

```bash
cd admin
npm install
```

### Backend

```bash
cd backend
npm install
```

### AI Try-On Frontend

```bash
cd aitryon/frontend
npm install
```

### AI Try-On Backend

```bash
cd aitryon/backend
npm install
```

---

## 7. Run the Project

### Start Backend

```bash
cd backend
npm run start
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Start Admin Dashboard

```bash
cd admin
npm run dev
```

### Start AI Try-On Frontend

```bash
cd aitryon/frontend
npm run dev
```

### Start AI Try-On Backend

```bash
cd aitryon/backend
npm run dev
```

---

## 8. Verification

After all services are started successfully:

* Frontend website is accessible.
* Admin dashboard is accessible.
* Backend API is running.
* MongoDB connection is established.
* AI Try-On module is available.
* Real-time chat functions correctly.
* Payment integration is configured correctly.

---

## 9. Notes

* Ensure all required `.env` files are created before running the project.
* Install dependencies for every module before starting the application.
* Start the backend service before running frontend and admin modules.
* Verify that all third-party services are configured properly.

---

## 10. Authors

Graduation Project – AmiVibe E-Commerce System

Developed by the AmiVibe Team.
