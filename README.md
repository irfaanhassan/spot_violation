
# 🚦 Spot Violation Now

A smart traffic violation detection platform that allows citizens to report violations using AI-powered image analysis, integrated with a Supabase backend, FastAPI model inference, and real-time ML scoring.

![Spot Violation Screenshot](https://spot-violation-now.vercel.app/preview.png)

---

## 🔍 Project Overview

**Spot Violation Now** empowers users to:
- 📸 Capture or upload evidence of traffic violations (images or videos)
- 🔍 Detect violations in real-time using YOLO-based ML models
- 🧠 Auto-categorize reports (No Helmet, Triple Riding, Wrong Side, Potholes)
- 📍 Use GPS + Maps to tag exact locations
- 💳 Submit reports, generate challans, and track verification status
- 🏆 Gamify participation via a leaderboard and rewards system

---

## 🚀 Live Demo

🌐 **Frontend (React + Tailwind):**  
[https://spot-violation-now.vercel.app](https://spot-violation-now.vercel.app)

⚙️ **FastAPI ML Inference:**  
Running locally / via Ngrok tunnel during demo (FastAPI serves 4 models)

🗄️ **Supabase Backend:**  
Authentication, storage, database, and Edge Functions

---

## ⚙️ Technology Stack

| Layer         | Stack Used                               |
|--------------|-------------------------------------------|
| Frontend     | React + TypeScript + Tailwind + ShadCN UI |
| ML Backend   | FastAPI + YOLOv8 (Ultralytics)            |
| Storage      | Supabase Buckets (public + secure access) |
| Database     | Supabase Postgres + RLS policies          |
| Edge Logic   | Supabase Edge Functions (Deno)            |
| Payments     | Razorpay integration via Edge Function    |
| Hosting      | Vercel (Frontend), Localhost (FastAPI)    |

---

## 📦 Key Features

- ✅ **4 ML Models:** Helmet, Triple Riding, Wrong Side, Pothole
- 🧠 AI detection using YOLOv8 + PaddleOCR
- 📍 Google Maps API for accurate geolocation
- 📂 Supabase Storage for report images
- 🔒 Auth & RLS using Supabase
- 🧾 Automatic challan generation
- 💳 Razorpay subscription integration
- 🏆 Leaderboard, profile, and reward system
- ⚡ FastAPI + Supabase Edge Functions

---

## 🧠 ML Models Used

All models are integrated in FastAPI and called per report:

| Task              | Model Used        |
|-------------------|-------------------|
| Helmet Detection  | `helmet.pt`       |
| Triple Riding     | `yolov8n.pt`      |
| Wrong Side Route  | `wrong_route.pt`  |
| Potholes          | `potholes.pt`     |
| Plate Reading     | PaddleOCR         |

---

## 🧪 How to Run Locally

### ✅ 1. Clone the Repo

```bash
git clone https://github.com/Majeed016/spot-violation-now.git
cd spot-violation-now
