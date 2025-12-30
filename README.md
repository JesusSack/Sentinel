# 🛡️ SENTINEL - Automated Threat Intelligence Platform (ATIP)

![Status](https://img.shields.io/badge/status-production_ready-success)
![Version](https://img.shields.io/badge/version-3.1.1-blueviolet)
![Deploy](https://img.shields.io/badge/deploy-Docker_Compose-2496ED)
![AI Powered](https://img.shields.io/badge/AI-TextBlob_Analysis-orange)
![Security](https://img.shields.io/badge/security-Firebase_Auth-red)

> **A turnkey, full-stack Intelligence Module designed for autonomous data ingestion, NLP sentiment analysis, and operational reporting.**

---

## 📋 Executive Summary

**Sentinel** is a pre-built, modular software solution for Security Operations Centers (SOC) and Intelligence Analysts. Unlike simple aggregators, Sentinel features a **Background Service Layer** that autonomously scans, analyzes, and categorizes threats without human intervention.

It consolidates **HUMINT** (Manual Entry), **OSINT** (RSS/Web), and **SOCMINT** (Reddit/Social) into a unified ecosystem backed by Google Firestore. It is fully containerized with **Docker** for immediate deployment.

---

## 🚀 Enterprise Capabilities

### 🧠 AI & Data Processing (`/service`)
* **NLP Sentiment Analysis:** Uses `TextBlob` to automatically score the sentiment (Positive/Negative/Neutral) of every incoming finding.
* **Risk Calculation:** Algorithmic determination of risk levels based on keywords and sentiment score.
* **Data Normalization:** Powered by `Pandas` to clean, deduplicate, and structure unstructured web data.

### 🤖 Autonomous Automation
* **Task Scheduling:** Integrated `APScheduler` (`scheduler.py`) ensures feeds are polled at configurable intervals (e.g., every 15 minutes) without manual triggers.
* **Orchestrator Script:** Includes `run_scanner.py` for headless deployment (server-side workers).

### 📡 Multi-Source Ingestion (`/scrapers`)
* **RSS/XML Feeds:** Universal scraper (`rss_scraper.py`) for standard threat feeds (CISA, CERTs).
* **Social Media:** Dedicated `social_media.py` connector utilizing `PRAW` for Reddit API monitoring.
* **Captcha Handling:** Hybrid solver (`test_captcha.py` / `utils`) managing simulation vs. real 2Captcha resolution.

### 📊 Management & Reporting
* **Executive Reports:** Built-in `FPDF` engine to generate downloadable PDF situation reports.
* **Admin Dashboard:** Real-time KPI monitoring, audit logs, and system health checks.
* **Hard Deletion:** GDPR-compliant data removal with audit trails.

---

## 🛠️ Technology Stack

| Component | Key Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, **Tailwind CSS**, Axios |
| **Authentication** | **Firebase Auth** (Secure Email/Password Strategy) |
| **Backend API** | **FastAPI**, Uvicorn, Python-Multipart |
| **Intelligence Engine** | **TextBlob** (NLP), **Pandas** (Data), **APScheduler** (Cron) |
| **Infrastructure** | **Docker**, Docker Compose (Orchestration) |
| **Database** | **Google Cloud Firestore** (NoSQL Real-time DB) |
| **Reporting** | FPDF (PDF Generation), CSV module |

---

## 📂 Project Architecture

Engineered for scalability, separating the API from the Intelligence Workers.

```text
sentinel-osint/
├── docker-compose.yml       # Container Orchestration
├── backend/                 # Python Intelligence Core
│   ├── Dockerfile           # Backend Image
│   ├── run_scanner.py       # CLI Orchestrator for background scanning
│   ├── app/
│   │   ├── api/v1/          # REST Endpoints
│   │   │   ├── admin.py     # Logs & KPIs
│   │   │   ├── endpoints.py # CRUD & Workflow
│   │   │   └── reports.py   # PDF/CSV Export Engines
│   │   ├── models/          # Data Structures
│   │   ├── scrapers/        # Ingestion Layer
│   │   │   ├── base.py      
│   │   │   ├── rss_scraper.py
│   │   │   ├── social_media.py
│   │   │   └── test_captcha.py
│   │   ├── service/         # Intelligence Layer
│   │   │   ├── analyzer.py  # NLP & Risk Logic (TextBlob)
│   │   │   └── scheduler.py # Background Jobs (APScheduler)
│   │   ├── utils/           # Helpers (Captcha)
│   │   ├── auth.py          # JWT Security
│   │   └── main.py          # FastAPI Entry Point
│   ├── requirements.txt     # Dependencies
│   └── serviceAccountKey.json (Secrets)
│
├── frontend/                # React Client
│   ├── Dockerfile           # Frontend Image
│   ├── index.html           # Application Entry Point (Vite)
│   ├── src/
│   │   ├── App.jsx          # Main Dashboard Logic
│   │   ├── firebase.js      # Auth Config
│   │   └── main.jsx         # React DOM Root
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md

⚙️ Installation & Setup
Prerequisites
Docker & Docker Compose

Google Firebase Credentials

🐳 Option A: Docker Deployment (Recommended)
Launch the entire stack with a single command. Ideal for production or quick demos.

1.Configure Secrets:

Place serviceAccountKey.json in /backend.

Update .env or docker-compose.yml with your Firebase public keys.

2.Launch:
  docker-compose up --build

3. Access:

Dashboard: http://localhost:5173

API Documentation: http://localhost:8000/docs


🐍 Option B: Manual Setup (Dev Mode)
1. Backend (API & Workers)

cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run API
uvicorn app.main:app --reload

# (Optional) Run Background Scanner
python run_scanner.py

2. Frontend (Dashboard)

cd frontend
npm install
# Configure .env with VITE_API_URL=http://localhost:8000
npm run dev

🛡️ Security Model
Authentication: Managed via Firebase Authentication using secure Email/Password tokens.

Role-Based Access: Distinction between Analyst (View/Edit) and Admin (Delete/Audit).

Sanitization: All HTML inputs are stripped to prevent XSS attacks before storage.

📄 License & Transfer
Commercial Proprietary Software. Full source code ownership transfer upon acquisition. No encrypted binaries.