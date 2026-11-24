# Smart Community Health Monitoring & Disease Early Warning System (HealthGuard AI)
## Comprehensive Technical Documentation & Architecture Specification

---

## 1. Executive Summary & Project Purpose

### 1.1 Overview
**HealthGuard AI** is an intelligent, full-stack community health surveillance and early warning platform designed to detect, track, and prevent infectious disease outbreaks before they escalate into widespread public health emergencies. 

Traditional public health reporting in developing regions relies on delayed manual hospital registers, leading to a critical 1-to-2 week time lag before epidemiological authorities recognize disease clusters. HealthGuard AI bridges this gap through **crowdsourced citizen symptom reporting**, **environmental sensor aggregation**, **Random Forest machine learning risk inference**, **rolling time-window cluster detection**, **human-in-the-loop doctor verification**, and **automated real Gmail SMTP emergency notifications**.

### 1.2 Core Objectives
- **Decentralized Early Detection:** Empower citizens, ASHA workers, and local clinics to report health anomalies immediately via text or speech.
- **Automated AI/ML Triaging:** Infer epidemic probability (Low, Medium, High) in real time using a trained machine learning model.
- **Dynamic 24-Hour Rolling Window:** Continuously evaluate disease concentration over a configurable rolling timeframe (default: 24 hours) rather than arbitrary calendar days.
- **Automated Emergency Dispatch:** Immediately dispatch real, branded SMTP alert emails to all registered community members when High Risk thresholds are exceeded.
- **Geographic Information System (GIS) Surveillance:** Map infection hotspots across states, districts, and taluks using interactive geospatial visualizations.
- **Inclusive Multilingual Accessibility:** Provide native language accessibility in **English**, **Kannada (ಕನ್ನಡ)**, and **Hindi (हिंदी)** with instantaneous runtime switching.

---

## 2. What the Project Does & How It Works

```mermaid
flowchart TD
    A[Citizen / ASHA Worker / Clinic] -->|1. Submit Symptom Observation via Web or Voice| B[FastAPI Backend Gateway]
    B -->|2. Store Raw Report| C[(PostgreSQL Database)]
    B -->|3. Feature Vector Extraction| D[Random Forest ML Model]
    D -->|4. Risk Probability & Confidence| E[Risk Assessment Engine]
    E -->|5. Rolling 24-Hour Window Query| F{Active Report Threshold Evaluator}
    F -->|1 Report in 24h| G[LOW RISK: Baseline Monitoring]
    F -->|2 Reports in 24h| H[MEDIUM RISK: Surveillance Advisory]
    F -->|3+ Reports in 24h| I[HIGH RISK: Outbreak Warning Triggered]
    I -->|6. Auto-Generate Alert Record| J[(PostgreSQL Alerts Table)]
    I -->|7. Deduplication Check| K{email_alert_log Table}
    K -->|Not Dispatched Yet| L[Gmail SMTP Service: port 587 TLS]
    L -->|8. Real Email Dispatch| M[All Registered Community Emails]
    I -->|9. In-App Notification| N[User Inboxes & Push Notifications]
    J -->|10. Triage Queue| O[Doctor / Health Officer Verification]
    O -->|11. Clinical Decision| P[Verified Warning / Dismissed / Field Investigation]
    P -->|12. Real-Time Update| Q[Interactive GIS Map & SaaS Analytics Dashboard]
```

### 2.1 Detailed System Workflow

#### Step 1: Health Observation Submission
- A user logs in (or submits as a community node) and selects their geographic location through an India Local Government Directory (LGD) hierarchy: **State → District → Taluk → Village/Locality → PIN Code**.
- Symptoms can be entered via:
  - **Structured Form:** Predefined quick tags (fever, joint pain, diarrhea, retro-orbital pain, chills, vomiting).
  - **Speech-to-Text Input:** Uses the HTML5 Web Speech API with native Kannada (`kn-IN`), Hindi (`hi-IN`), and English (`en-IN`) acoustic models.
  - **Automated Environmental Telemetry:** Ambient temperature, rainfall, humidity, water pH, and water turbidity are ingested alongside the report.

#### Step 2: Machine Learning Risk Inference
- The backend passes the symptom vector and environmental factors into a pre-trained **Random Forest Classifier** (`ml/models/risk_model.joblib`).
- The model outputs an initial prediction and confidence score (`predict_proba`).

#### Step 3: Rolling 24-Hour Window & Unified Report Counting
- HealthGuard AI implements a **single source of truth active rolling window** (`backend/app/core/risk_window.py`).
- Rather than counting unique users (which allows malicious actors or single families to slip beneath threshold rules), **all valid health reports are counted equally**.
- **Threshold Rule (Configurable for Demo & Production):**
  - **1 Report in 24h:** `LOW RISK` (Stable Baseline)
  - **2 Reports in 24h:** `MEDIUM RISK` (Active Surveillance Watch)
  - **3 or More Reports in 24h:** `HIGH RISK` (Epidemic Outbreak Trigger)
- Reports older than 24 hours automatically roll out of the active threat calculation, preserving historical data for long-term epidemiological trend analysis.

#### Step 4: Automated Real Gmail SMTP Alert Dispatch
- When a taluk's active report count reaches 3 or more in the 24-hour window, the backend triggers `email_service.py`.
- **Recipient Retrieval:** Dynamically queries the PostgreSQL database for all registered users having an email address (`SELECT email, full_name FROM users WHERE email IS NOT NULL`).
- **Deduplication Engine:** Checks the `email_alert_log` table for `(alert_id, recipient_email)`. If already sent, duplicates are prevented.
- **Connection & Security:** Authenticates via TLS (`STARTTLS`, port 587) using a secure **Gmail App Password** stored in `backend/.env`.
- **Email Content:** Sends a responsive HTML email containing:
  - Official subject: `🚨 HealthGuard AI – High Disease Risk Alert: [Location]`
  - Risk Level: `HIGH`
  - Active report count in the 24-hour window
  - Suspected condition and clinical symptoms summary
  - Actionable preventive DOs and DON'Ts
  - Toll-free national emergency helplines (104 / 1075)

#### Step 5: Doctor & Health Officer Clinical Verification
- Medical professionals access an **Alert Verification Console**.
- Doctors evaluate symptom clustering, confirm the outbreak warning, mark false alarms (`Rejected`), or dispatch local ASHA field units (`Under Investigation`).
- Every clinical verification generates an immutable audit trail entry (`AlertReview`).

#### Step 6: Interactive GIS Mapping & Real-Time Analytics
- Active infection signals render on an interactive **Leaflet GIS Map**.
- Markers are color-coded:
  - 🟢 Green: Low Risk
  - 🟡 Amber: Medium Risk
  - 🔴 Red: High Risk
- Health workers view active cluster matrices, 7-day disease frequency graphs, and taluk incident breakdowns.

---

## 3. Technology Stack

### 3.1 Architecture Overview
HealthGuard AI is built on a **decoupled Client-Server Architecture** communicating over secure JSON REST APIs.

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Client                       │
│    React 19 + Vite 8 + React-i18next + Leaflet + Recharts   │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTPS / JSON REST
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Server                   │
│    Python 3.11+ / Uvicorn / SQLAlchemy 2.0 / Pydantic 2     │
├──────────────────────────────┬──────────────────────────────┤
│      Machine Learning        │     Notification Engine      │
│  Random Forest / Scikit-Learn│  Gmail SMTP (TLS) / Firebase │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │ SQLAlchemy                   │ SMTP (587)
┌──────────────▼───────────────┐┌─────────────▼───────────────┐
│     PostgreSQL Database      ││     Google Gmail Server     │
│ Relational Surveillance Data ││  Emergency Alert Broadcast  │
└──────────────────────────────┘└─────────────────────────────┘
```

### 3.2 Technologies & Libraries

| Domain | Technology / Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **FastAPI** | `>=0.110.0` | High-performance asynchronous REST API framework |
| **ASGI Server** | **Uvicorn** | `>=0.28.0` | Production ASGI web server running FastAPI |
| **Language** | **Python** | `3.11+` | Core server, business logic, and ML processing |
| **Database** | **PostgreSQL** | `14+ / 16+` | Relational storage for users, reports, alerts, and logs |
| **ORM & Migrations** | **SQLAlchemy** | `>=2.0.28` | Database modeling, session management, and migrations |
| **DB Driver** | **psycopg2-binary** | `>=2.9.9` | High-performance PostgreSQL database adapter |
| **Machine Learning** | **Scikit-learn** | `>=1.4.0` | Random Forest Classifier training & probability prediction |
| **Model Serialization**| **Joblib** | `>=1.3.2` | Persistent serialization of trained model weights |
| **Data Processing** | **Pandas & NumPy** | `Pandas 2.2+, NumPy 1.26+` | Data wrangling, array operations, and feature tensors |
| **Authentication** | **Python-JOSE & Passlib** | `JOSE 3.3+, Bcrypt 4.1+` | JWT token issuing/verification & bcrypt password hashing |
| **Data Validation** | **Pydantic** | `>=2.6.0` | Strict schema validation for requests and responses |
| **Frontend Framework**| **React** | `19.2.8` | Declarative, component-based user interface |
| **Build Tool** | **Vite** | `8.3.1` | Ultra-fast frontend development server and bundler |
| **Routing** | **React Router DOM** | `7.18.4` | Single-page application client-side routing & guards |
| **Internationalization**| **i18next & react-i18next**| `i18next 26+, react-i18next 17+` | Multilingual UI in English, Kannada, and Hindi |
| **GIS Mapping** | **Leaflet & React-Leaflet** | `Leaflet 1.9+, React-Leaflet 5.0+` | Interactive geospatial mapping and threat cluster pins |
| **Data Visualizations**| **Recharts** | `3.10.1` | Responsive SVG charts (disease incidence, risk donuts) |
| **UI Icons** | **Lucide React** | `1.48.0` | Modern, consistent iconography across all pages |
| **HTTP Client** | **Axios** | `1.20.0` | Promise-based HTTP client for backend REST calls |
| **Email Protocol** | **smtplib / STARTTLS** | Built-in Python standard | Real Gmail SMTP dispatch over port 587 |

---

## 4. Database Architecture & Schema Design

The PostgreSQL database follows third-normal-form (3NF) relational design principles with foreign keys, cascading deletes, unique constraints, and B-tree indexes.

```mermaid
erDiagram
    USERS ||--o{ HEALTH_REPORTS : "submits"
    USERS ||--o{ ALERT_REVIEWS : "reviews"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ CHAT_HISTORY : "initiates"
    USERS ||--o{ FCM_TOKENS : "registers"

    LOCATIONS ||--o{ HEALTH_REPORTS : "references"

    HEALTH_REPORTS ||--|| RISK_ASSESSMENTS : "evaluated_by"
    RISK_ASSESSMENTS ||--o{ ALERTS : "triggers"
    ALERTS ||--o{ ALERT_REVIEWS : "verified_by"
    ALERTS ||--o{ NOTIFICATIONS : "dispatches"
    ALERTS ||--o{ EMAIL_ALERT_LOG : "prevents_duplicate"

    USERS {
        int id PK
        string full_name
        string username UK
        string email UK
        string password_hash
        string role
        string preferred_language
        string phone_number UK
        boolean phone_verified
        datetime created_at
    }

    HEALTH_REPORTS {
        int id PK
        int user_id FK
        string disease
        text symptoms
        int cases_count
        float latitude
        float longitude
        string location_name
        string state
        string district
        string taluk
        datetime report_date
        string source
        datetime archived_at
    }

    RISK_ASSESSMENTS {
        int id PK
        int report_id FK
        string risk_level
        float confidence
        string model_version
        datetime assessed_at
    }

    ALERTS {
        int id PK
        int risk_assessment_id FK
        string title
        text message
        string location_name
        string status
        datetime created_at
    }

    ALERT_REVIEWS {
        int id PK
        int alert_id FK
        int reviewer_id FK
        string decision
        text comments
        datetime reviewed_at
    }

    EMAIL_ALERT_LOG {
        int id PK
        int alert_id FK
        string recipient_email
        datetime sent_at
    }
```

### 4.1 Schema Definitions

1. **`users` Table:**
   - Stores credential identities, role-based authorization levels (`community_member`, `health_worker`, `healthcare_professional`, `administrator`), language preferences, and registered contact information.
2. **`health_reports` Table:**
   - Stores citizen and field-submitted health observations with Indian administrative location attributes (`state`, `district`, `taluk`), GPS coordinates, observed case counts, and soft-delete/archive timestamps (`archived_at`).
3. **`risk_assessments` Table:**
   - Stores Random Forest ML outputs (`risk_level`: Low/Medium/High, `confidence`: 0.0-100.0%, and `model_version` VARCHAR(255) containing rolling window metrics).
4. **`alerts` Table:**
   - Active public health warnings generated when clusters breach risk thresholds (`pending`, `verified`, `rejected`, `investigate`).
5. **`alert_reviews` Table:**
   - Audit trail capturing physician decisions (`decision`: verified/rejected/investigate) along with medical advisory comments.
6. **`email_alert_log` Table:**
   - Strict composite unique constraint `(alert_id, recipient_email)` preventing duplicate emails during high-frequency reporting surges.
7. **`fcm_tokens` & `notifications` Tables:**
   - Browser push device tokens and in-app notification inbox records.
8. **`chat_history` Table:**
   - Clinical assistant conversation transcripts recorded with localized language tags.

---

## 5. Key Features & Functional Modules

### 5.1 Unified Healthcare SaaS Dashboard
- **Live Metric Tiles:** Registered Surveillance Nodes, Total Reports Logged, Active Reports in 24-Hour Window, High/Medium/Low counts.
- **24-Hour Rolling Taluk Risk Matrix:** Displays monitored taluks, active report counts, current evaluated threat level, and automatic refresh timestamps.
- **Disease Incidence Breakdown:** Recharts-powered visualization of case frequencies across viral fever, dengue, malaria, typhoid, and cholera.
- **Recent Health Reports Stream:** Real-time log of community submissions with clickable details and ML risk tags.

### 5.2 Community Reporting Center (Text & Speech-to-Text)
- **Hierarchical Location Picker:** State → District → Taluk → Village dropdowns avoiding invalid geographic entries.
- **Interactive Speech Recognition:** Web Speech API integration in Kannada, Hindi, and English with fallback simulation phrases.
- **Symptom Quick-Select Tags:** 1-click addition of clinical terminology to assist citizens who may not know exact disease names.
- **Real-Time SMTP Diagnostic Console:** An in-app diagnostic console allowing operators to test SMTP handshake (`smtp.gmail.com:587`), verify TLS auth, and send live test emails.

### 5.3 Disease Outbreak Alerts & Clinical Protocols
- **Active Alerts Filter:** Tabbed views for All, High Risk, Medium Risk, Clinically Verified, and Pending alerts.
- **Interactive Clinical Knowledge Base:** Select any disease to view verified **DOs** (hydration, bed rest, mosquito netting), **DON'Ts** (avoid NSAIDs/Aspirin in dengue, avoid self-medicating antibiotics), and **When to Seek Immediate Medical Attention** (sunken eyes, dyspnea, extreme abdominal pain).
- **Official Emergency Helplines:** Prominently displays India's national health helpline `104 / 1075 (Toll-Free)`.

### 5.4 Interactive GIS Geographic Map
- **Live Marker Pins:** Color-coded pins with dynamic pulsing halos indicating outbreak intensity.
- **Filter by Risk:** Instant toggle to isolate High Risk Only, Medium Risk, or Low Risk markers.
- **Marker Tooltips & Popups:** Displays observed cases, disease condition, reported date, and clinical symptoms.

### 5.5 AI Clinical Assistant
- **Contextual Health Advice:** Provides non-diagnostic first-aid guidance, ORS mixing instructions, symptom monitoring, and primary health clinic referral.
- **Language Detection:** Responds in English, Kannada, or Hindi matching the user's active session.
- **Safety Disclaimers:** Automated disclaimers highlighting that the AI assistant assists surveillance awareness and does not replace formal clinical diagnosis.

### 5.6 Comprehensive Multilingual Translation Engine
- Fully localized with zero hardcoded English UI strings.
- Accessible via the **Landing Page Top Navigation**, **Hero Section Quick Selector**, **Header Switcher**, and **User Profile Preferences**.
- Instant re-rendering across all mounted pages and child components without page refresh.

---

## 6. Security, Privacy & Reliability Architecture

1. **Zero Credential Exposure:**
   - Gmail App Passwords and database credentials reside exclusively in server-side `backend/.env`.
   - Never exposed through frontend bundles, Git repositories, API responses, or error logs.
2. **Failure Isolation:**
   - The email notification service executes within isolated `try/except` wrappers. If the SMTP server experiences a temporary network blip or rate limit, the report submission and database transaction succeed without returning HTTP 500 to the client.
3. **Database Integrity & Cascading Protection:**
   - Risk assessment length adjusted to `VARCHAR(255)` to safely handle descriptive model descriptors (`RandomForest v1.0 + 24h Rolling (14 active reports)`).
   - Foreign key cascading deletes ensure relational hygiene when reports or alerts are archived.
4. **Role-Based Access Control (RBAC):**
   - Protected Route guards verify JWT claims before rendering administrative or clinical verification pages.

---

## 7. Project Installation & Execution Guide

### 7.1 Prerequisites
- **Python:** 3.11 or higher
- **Node.js:** 18 or 20+
- **PostgreSQL Database:** Running locally or accessible via network
- **Active Gmail Account:** With 2-Step Verification enabled and a 16-character **App Password** generated

### 7.2 Backend Setup
```bash
# 1. Navigate to backend directory
cd c:\smart-community-health-monitoring\backend

# 2. Create and activate Python virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Configure environment variables in backend/.env:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/healthguard_db
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_EMAIL=healthguardai.alerts@gmail.com
# SMTP_PASSWORD=your_16_char_app_password
# RISK_REPORT_WINDOW_HOURS=24
# JWT_SECRET_KEY=your_secure_secret_key

# 5. Run Database Migration & Seeds
python -m app.database.migrations.alter_model_version_length
python -m app.database.seed

# 6. Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7.3 Frontend Setup
```bash
# 1. Navigate to frontend directory
cd c:\smart-community-health-monitoring\frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production verification
npm run build
```

---

## 8. Summary of Demo Accounts for Evaluation

| Role | Username | Password | Intended Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Full system access, user management, RBAC modification, analytics |
| **Doctor / Professional** | `doctor_sharma` | `Doctor@123` | Alert verification, clinical decision broadcasts, surveillance map |
| **Health Worker / ASHA** | `asha_worker` | `Asha@123` | Community monitoring, cluster inspection, taluk incident reports |
| **Community Member** | `citizen_rahul` | `Citizen@123` | Symptom logging, voice input, AI assistant, personal audit trail |

---

*HealthGuard AI — Engineered for proactive community health surveillance, rapid epidemiological outbreak detection, and life-saving early warnings.*
