# 🛡️ SENTINEL - Advanced OSINT Threat Intelligence Platform

![Status](https://img.shields.io/badge/status-production_ready-success)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Security](https://img.shields.io/badge/security-Firebase_Auth-red)
![Docker](https://img.shields.io/badge/deploy-Docker_Compose-2496ED)

> **Comprehensive Cyber Intelligence Platform for real-time threat ingestion, normalization, analysis, and management.**

---

## 📋 Project Overview

**Sentinel** has evolved from a simple RSS aggregator into an **Enterprise-Grade** OSINT threat intelligence solution. The system allows security analysts to monitor multiple data sources, manage the alert lifecycle (detection, analysis, escalation), and generate automated executive reports.

Unlike traditional feed readers, Sentinel implements a secure architecture with **Identity Access Management (IAM)**, custom algorithm-based data cleaning, and cloud persistence.

### 🚀 Key Capabilities

* **🔐 Identity-First Security:** Complete authentication system (Login/Register/Recovery) delegated to **Google Firebase Auth**. Routes protected via JWT.
* **🧠 Ingestion & Normalization Engine:** Robust scraper that ingests RSS/XML feeds (CISA, The Hacker News, BBC), eliminates HTML noise ("divs" and styling garbage), and structures the data.
* **⚡ Incident Management:** Operational workflow allowing the analyst to:
    * **Escalate 🔴:** Mark critical threats for immediate investigation.
    * **Discard ❌:** Remove false positives from the workflow.
* **📄 Automated Reporting:** Generation of intelligence reports in **PDF (Executive)** and **CSV (Analytical)** formats with character sanitization and professional formatting.
* **💎 Cyberpunk Glassmorphism UI/UX:** Modern interface developed in React with advanced visual effects, native Dark Mode, and an interactive agent profile.

---

## 🛠️ Tech Stack

| Area | Key Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, **Tailwind CSS**, Axios, Lucide React (Icons) |
| **Backend** | Python 3.10, **FastAPI**, Pandas (Data Analysis), FPDF (Reporting), Feedparser |
| **Database** | **Google Cloud Firestore** (NoSQL Real-time Database) |
| **Auth & Security** | Google Firebase Authentication (Email/Password + JWT) |
| **DevOps** | Docker, Docker Compose (Multi-container Orchestration) |

---

## 🏗️ System Architecture

The data flow follows a modern containerized microservices pipeline:

1.  **Ingestion (Python Worker):** The `run_scanner.py` orchestrator queries configured sources and extracts metadata.
2.  **Processing (Data Cleaning):** Regex filters and HTML Parsing are applied to sanitize dirty feed content.
3.  **Persistence (Firestore):** Findings are stored with an initial `risk_level` calculated by basic NLP.
4.  **Consumption (React Client):** The analyst interacts with the authenticated dashboard.
5.  **Export (Backend API):** On-demand binary generation (PDF/CSV) filtering by criticality.

---

## ⚙️ Installation & Deployment Guide

### Prerequisites
* Docker and Docker Compose installed.
* Active Google Firebase account.

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/sentinel-osint.git](https://github.com/your-username/sentinel-osint.git)
cd sentinel-osint

Here is the professional English translation of your README. It uses technical terminology standard in the cybersecurity and software engineering industry (e.g., "Ingestion," "Sanitization," "Pipeline," "Deploy").

Copy the code block below and replace the content of your README.md.

Markdown

# 🛡️ SENTINEL - Advanced OSINT Threat Intelligence Platform

![Status](https://img.shields.io/badge/status-production_ready-success)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Security](https://img.shields.io/badge/security-Firebase_Auth-red)
![Docker](https://img.shields.io/badge/deploy-Docker_Compose-2496ED)

> **Comprehensive Cyber Intelligence Platform for real-time threat ingestion, normalization, analysis, and management.**

---

## 📋 Project Overview

**Sentinel** has evolved from a simple RSS aggregator into an **Enterprise-Grade** OSINT threat intelligence solution. The system allows security analysts to monitor multiple data sources, manage the alert lifecycle (detection, analysis, escalation), and generate automated executive reports.

Unlike traditional feed readers, Sentinel implements a secure architecture with **Identity Access Management (IAM)**, custom algorithm-based data cleaning, and cloud persistence.

### 🚀 Key Capabilities

* **🔐 Identity-First Security:** Complete authentication system (Login/Register/Recovery) delegated to **Google Firebase Auth**. Routes protected via JWT.
* **🧠 Ingestion & Normalization Engine:** Robust scraper that ingests RSS/XML feeds (CISA, The Hacker News, BBC), eliminates HTML noise ("divs" and styling garbage), and structures the data.
* **⚡ Incident Management:** Operational workflow allowing the analyst to:
    * **Escalate 🔴:** Mark critical threats for immediate investigation.
    * **Discard ❌:** Remove false positives from the workflow.
* **📄 Automated Reporting:** Generation of intelligence reports in **PDF (Executive)** and **CSV (Analytical)** formats with character sanitization and professional formatting.
* **💎 Cyberpunk Glassmorphism UI/UX:** Modern interface developed in React with advanced visual effects, native Dark Mode, and an interactive agent profile.

---

## 🛠️ Tech Stack

| Area | Key Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, **Tailwind CSS**, Axios, Lucide React (Icons) |
| **Backend** | Python 3.10, **FastAPI**, Pandas (Data Analysis), FPDF (Reporting), Feedparser |
| **Database** | **Google Cloud Firestore** (NoSQL Real-time Database) |
| **Auth & Security** | Google Firebase Authentication (Email/Password + JWT) |
| **DevOps** | Docker, Docker Compose (Multi-container Orchestration) |

---

## 🏗️ System Architecture

The data flow follows a modern containerized microservices pipeline:

1.  **Ingestion (Python Worker):** The `run_scanner.py` orchestrator queries configured sources and extracts metadata.
2.  **Processing (Data Cleaning):** Regex filters and HTML Parsing are applied to sanitize dirty feed content.
3.  **Persistence (Firestore):** Findings are stored with an initial `risk_level` calculated by basic NLP.
4.  **Consumption (React Client):** The analyst interacts with the authenticated dashboard.
5.  **Export (Backend API):** On-demand binary generation (PDF/CSV) filtering by criticality.

---

## ⚙️ Installation & Deployment Guide

### Prerequisites
* Docker and Docker Compose installed.
* Active Google Firebase account.

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/sentinel-osint.git](https://github.com/your-username/sentinel-osint.git)
cd sentinel-osint
2. Secrets Configuration
The system requires credentials to function.

Backend: Place your Firebase serviceAccountKey.json file inside the osint_module_backend/ folder.

Frontend: Create a .env file in osint_module_frontend/ with your public keys:
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=...

3. Deployment (Docker)
Launch the full environment with a single command:
 docker-compose up --build
 Dashboard: http://localhost:5173

API Documentation: http://localhost:8000/docs


📖 Operations Manual
Login: Register with a valid email. The system will send a verification email (simulated or real depending on config).

Source Management: Access the Sources ⚙️ menu to add monitoring URLs (e.g., https://www.cisa.gov/uscert/ncas/current-activity.xml).

Analysis:

Monitor news cards on the Dashboard.

Use the Escalate button for serious incidents or Discard for noise.

Deliverable Generation:

Click PDF to download a clean report of critical threats (High/Critical).

Click Excel to download the full dataset for forensic analysis.


## 📂 Project Structure

```text
sentinel-osint/
├── osint_module_backend/    # Python/FastAPI Service
│   ├── app/
│   │   ├── api/            # admin.py, endpoints.py, repost.py
│   │   ├── models/         # finding.py, source.py
│   │   ├── scrapers/       # base.py, rss_scraper.py
│   │   ├── service/        # analyzer.py, schedule.py
│   │   ├── auth.py         # Authentication logic
│   │   └── main.py         # Application entry point
│   ├── Dockerfile
│   └── serviceAccountKey.json (Excluded from repo)
├── osint_module_frontend/   # React/Vite Client
│   ├── public/
│   ├── src/
│   │   ├── assets/         # react.svg
│   │   ├── App.css
│   │   ├── App.jsx         # Main UI Logic
│   │   ├── firebase.js     # Firebase Config
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml       # Container Orchestration
├── .gitignore
└── README.md