<div align="center">

# ⚡ SimplifAI

### *India ka Pehla AI-Powered Hinglish Code Mentor*
<img src="https://img.shields.io/badge/Project-AI%20Code%20Explainer-FF9900?style=for-the-badge&logo=amazonaws"/>
<img src="https://img.shields.io/badge/Team-AI²%20(AI%20Square)-7B2FFF?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Hackathon-AWS%20AI%20for%20Bharat-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>
<img src="https://img.shields.io/badge/Theme-AI%20for%20Learning%20%26%20Dev%20Productivity-00b894?style=for-the-badge"/>

<br/>

> **"Logic wohi, andaaz bilkul apna"**
>
> SimplifAI explains code in **Hinglish** using cricket, biryani, and Bollywood analogies — built for India's Tier 2/3 students where English documentation is a barrier.

</div>

---

# 🇮🇳 About the Project

**SimplifAI** is an AI-powered code explanation tool built specifically for Indian developers and students who find it easier to learn in **Hinglish** (Hindi + English). Unlike generic AI tools, SimplifAI uses relatable **Indian cultural analogies** to make complex programming concepts stick.

### 💡 The Problem We Solve

| Problem | SimplifAI's Solution |
|---|---|
| English-only documentation is hard for many Indian students | Explanations delivered in natural Hinglish |
| Abstract CS concepts don't connect with learners | Cricket, Bollywood & food analogies make concepts relatable |
| No visual complexity understanding | Animated Big-O chart visualizer built-in |
| Passive reading doesn't test understanding | Auto-generated 5-question MCQ quiz after every explanation |
| No shareable learning artifact | One-click professional PDF report generator |

### 🎯 Target Audience

Students and developers from **Tier 2 and Tier 3 cities** — Jaipur, Patna, Lucknow — where the primary medium of thought is Hindi, not English. SimplifAI bridges the language gap without compromising on technical depth.

---

# ✨ Features

### 🗣️ Hinglish-First Explanations
Code explanations in natural Hinglish — the way a dost (friend) would explain it, not a textbook.

### 🏏 Indian Analogies Engine
- **Arrays** → IPL team roster
- **Loops** → Cricket overs (har ball ek iteration)
- **Functions** → Biryani recipe (ek baar likhao, baar baar use karo)
- **Classes** → Bollywood film family

### 📊 Complexity Visualizer
Animated **Big-O chart** showing Time & Space complexity — O(1), O(n), O(n²) — with best/average/worst case breakdowns.

### 🧩 Instant Quiz Generator
After every explanation, **5 MCQ questions** are auto-generated based on *your specific code* — not generic questions. Instant Hinglish feedback with grade (S/A/B/C).

### 📄 PDF Report Generator
One-click **4-page professional PDF** containing:
- Cover page with language, complexity score, and quiz grade
- Submitted code with line numbers
- Full Hinglish explanation
- Complexity analysis with Big-O scale
- Complete quiz results with per-question breakdown

### 🔍 Multi-Language Support
Dedicated support for **Python, JavaScript, Java, C++, SQL** — plus Auto Detect for TypeScript, Go, Rust, PHP, Swift, Kotlin, and more.

### 🎚️ Skill Levels
Choose your depth: 
- **🌱 Beginner** (no jargon) 
- **⚡ Intermediate** (patterns & logic) 
- **🔥 Advanced** (edge cases & best practices)

---

## 🚀 Live Project Access
* **Live Demo:** [**SimplifAI.dev**](https://d2t805jkc0zu1t.cloudfront.net/)
* **Resources:** [**SimplifAI.dev Resources**](https://drive.google.com/drive/folders/1CPafqG54rqeX4p7IZNYKUBSLJjYbNafc?usp=drive_link)
---

## 💻 Optimal Viewing Experience
> [!IMPORTANT]
> **For the best user experience, it is highly recommended to view the live website in Desktop Mode.** The dashboard's glassmorphism effects and real-time risk charts are optimized for larger screens to provide full clarity of the diagnostic data.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **AI Engine** | Amazon Nova 2 Lite via AWS Bedrock | Code understanding & Hinglish generation |
| **Backend** | AWS Lambda + API Gateway | Serverless scalable backend & AI Integration |
| **Frontend** | Vanilla HTML/CSS/JavaScript | Lightweight, fast-loading UI |
| **PDF Generation** | pdf.js (custom implementation) | Client-side PDF report generation |
| **Hosting** | AWS S3 + Amazon CloudFront | Secure HTTPS delivery with Edge caching |
| **Testing** | Node.js ESM test suite | Bedrock API connectivity tests |

---

## 📁 Project Structure

```
SimplifAI/
│
├── 📂 backend/                     # Serverless / Local testing Backend
│   ├── server.js                   # Express server (For local testing only)
│   ├── test-bedrock.js             # AWS Bedrock connectivity tester
│   ├── package.json                # Node dependencies & scripts
│   ├── .env                        # 🔒 Environment variables (DO NOT COMMIT)
│   └── node_modules/               # Installed dependencies
│
├── 📂 frontend/                    # Static web application
│   ├── index.html                  # Main application page
│   ├── script.js                   # Core application logic (AI calls, quiz, UI)
│   ├── pdf.js                      # PDF report generation engine
│   └── style.css                   # Styling & animations
│
├── 📂 test/                        # Test suite & AWS Lambda Code
│   └── index.mjs                   # Actual AWS Lambda Production Code
│
├── .gitignore                      # Git ignore rules
├── DEPLOYMENT.md                   # Deployment guide
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

```bash
node --version   # v18.0.0 or higher
npm --version    # v8.0.0 or higher
```

You also need an **AWS account** with access to **Amazon Bedrock** and the **Nova 2 Lite** model enabled in your region.

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/vivekmaurya18/AI-Code-Explainer.git
cd AI-Code-Explainer
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Fill in your AWS credentials (see [Environment Variables](#-environment-variables) section below).

Start the backend server:

```bash
node server.js
```

The API will be available at `http://localhost:3000` (or your configured port).

---

### 3️⃣ Frontend Setup

The frontend is **pure static HTML** — no build step required.

**Option A — Open directly in browser:**
```bash
open frontend/index.html
```

**Option B — Serve locally for CORS-safe API calls:**
```bash
# Using Python (comes pre-installed on most systems)
cd frontend
python3 -m http.server 8080

# OR using Node.js live-server
npx live-server frontend/
```

Then visit `http://localhost:8080` in your browser.

---

### 4️⃣ Verify Setup

Run the Bedrock connectivity test to confirm your AWS credentials and model access are working:

```bash
cd backend
node test-bedrock.js
```

You should see a successful response from Amazon Nova 2 Lite. ✅

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` directory with the following keys:

```env
# ─────────────────────────────────────────────
#  SimplifAI — Backend Environment Variables
#  ⚠️  NEVER commit this file to version control
# ─────────────────────────────────────────────

# AWS Credentials (IAM user with Bedrock permissions)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# AWS Region where Bedrock Nova 2 Lite is enabled
# Supported: us-east-1, ap-south-1, us-west-2
AWS_REGION=ap-south-1
```

> **🔒 Security Note:** The `.env` file is listed in `.gitignore` and will never be committed. For production, use **AWS IAM Roles** instead of hardcoded keys — see the [Deployment Guide](DEPLOYMENT.md).

### Required AWS IAM Permissions

Your IAM user/role needs the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
    }
  ]
}
```

---

## 💻 Usage

### Basic Workflow

1. **Choose your language** — Click a language badge (Python, JS, Java, C++, SQL) or use Auto Detect
2. **Select a theme** — 🏏 Cricket / 🎬 Bollywood / 🍛 Khana / 📚 School / ✏️ Plain
3. **Set your level** — 🌱 Beginner / ⚡ Intermediate / 🔥 Advanced
4. **Paste your code** — In the code editor panel, or use a sample snippet
5. **Click "Explain Karo!"** — Wait ~2.4 seconds for your Hinglish explanation
6. **Explore tabs** — Switch between 💬 Explain / 🐛 Debug / 📊 Complexity / 🧩 Quiz
7. **Download PDF** — Click "PDF Report" to get your shareable document

### Sample Code Snippets

Load pre-built examples directly in the UI using the snippet buttons (Loop, Function, Class, O(n²)).

---

## 📡 API Reference

### `POST /`
Sends code to Amazon Nova 2 Lite and returns a Hinglish explanation.

### `POST /run`
Simulates live code execution using Amazon Nova 2 Lite with STDIN input support. Returning console output safely.

**Example Request:**
```json
{
  "code": "for i in range(10):\n    print(i)",
  "language": "python",
  "level": "beginner",
  "analogy": "cricket",
  "outputLanguage": "hinglish"
}
```

**Response:**
```json
{
  "explanation": "Yeh loop ek cricket match ki tarah hai...",
  "complexity": {
    "time": "O(n)",
    "space": "O(1)"
  }
}
```

**Status Codes:**

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad Request — missing `code` field |
| `500` | Internal Server Error — AWS Bedrock call failed |

---

## 👥 Team

**Team AI²** — Built with ❤️ in India 🇮🇳 for the **AWS AI for Bharat Hackathon 2026**

| Member | Links |
|---|---
| **Vivek Maurya** | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vivekma78565) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/vivekmaurya18) |
| **Saurav Kumar** | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kumsaurav91) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/kumsaurav91-droid) |

---

## 📄 License

This project was created for the **AWS AI for Bharat Hackathon 2026** by Team AI².

All rights reserved © 2026 **SimplifAI.dev**

---

<div align="center">

*Built with ❤️ for Bharat · Powered by Amazon Nova 2 Lite on AWS Bedrock*

⭐ **Star this repo if SimplifAI helped you!** ⭐

</div>
