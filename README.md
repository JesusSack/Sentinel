# 🛡️ Sentinel: OSINT Intelligence Module

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Python](https://img.shields.io/badge/backend-FastAPI-green) ![React](https://img.shields.io/badge/frontend-React%20%7C%20Tailwind-blue) ![Docker](https://img.shields.io/badge/deployment-Docker-2496ED)

> **Full-Stack Open Source Intelligence (OSINT) Platform & Real-Time Threat Monitoring System.**

---

## 📋 Project Overview
**Sentinel** is an automated solution designed for the ingestion, processing, and visualization of cybersecurity intelligence. The system monitors global sources (such as *The Hacker News* and *CISA Alerts*), applies **Natural Language Processing (NLP)** to detect sentiment and classify risk levels, and presents findings in an operational Dashboard for decision-making.

### 🚀 Key Features
* **Automated Ingestion:** Integrated Scheduler that scans RSS/XML feeds every 10 minutes.
* **AI-Powered Analysis:** NLP Engine (`TextBlob`) that calculates sentiment scores and assigns risk levels (LOW, MEDIUM, CRITICAL) automatically.
* **Decoupled Architecture:** Backend (REST API) separated from Frontend (SPA) to ensure maximum scalability.
* **Cloud Persistence:** NoSQL data storage using **Google Cloud Firestore**.
* **Docker Ready:** Containerized infrastructure ready for deployment with a single command.

---

## 🛠️ Tech Stack

| Area | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, **FastAPI**, Uvicorn, APScheduler |
| **Data Processing** | Feedparser, TextBlob (NLP/NLTK), Regex |
| **Frontend** | **React 18**, Vite, Axios, Lucide Icons |
| **UI/Styling** | **Tailwind CSS** (Responsive Design & Dark Mode) |
| **Database** | Google Firebase (Firestore NoSQL) |
| **DevOps** | **Docker**, Docker Compose |

---

## 🏗️ System Architecture

The data flow follows a real-time ETL (Extract, Transform, Load) process:

1.  **Extract:** The `Scheduler` triggers the `Scraper Service` to fetch XMLs from configured sources.
2.  **Transform:** The `Analyzer Service` sanitizes HTML content and evaluates keywords + sentiment.
3.  **Load:** Structured findings are stored in Firestore.
4.  **Visualize:** The user queries the API via the React Dashboard.

---

## ⚙️ Installation & Deployment

### Prerequisites
* **Docker Desktop** installed.
* **Google Firebase Credentials:** You need a `serviceAccountKey.json` file.

### 🐳 Quick Start
The project includes full orchestration. Follow these steps to deploy:

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd osint
    ```

2.  **Setup Credentials:**
    Place your `serviceAccountKey.json` file inside the `osint_module_backend/` directory.
    *(Note: This file is excluded from the repository for security reasons).*

3.  **Launch Services:**
    Run the following command to build and start the containers:
    ```bash
    docker-compose up --build
    ```

Once the containers are running, access the services:

* **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
* **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔌 API Reference
The backend exposes a fully documented RESTful API (Swagger/OpenAPI).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/findings` | Retrieve processed intelligence findings. |
| `POST` | `/api/v1/sources` | Register a new intelligence source (RSS/Atom). |
| `GET` | `/health` | System health check and uptime monitoring. |

---

## 👤 Author
**Jesús** - *AI & Software Developer*

---
*Developed for technical demonstration purposes using modern software engineering practices.*