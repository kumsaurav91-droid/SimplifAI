# 🚀 SimplifAI — Deployment Guide

[![AWS S3](https://img.shields.io/badge/Frontend-AWS%20S3%20Static%20Hosting-569A31?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![AWS Bedrock](https://img.shields.io/badge/AI%20Engine-Amazon%20Bedrock-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/bedrock/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%2018%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**Complete step-by-step guide to deploy SimplifAI from scratch to production.**

</div>

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Step 1 — AWS Account Setup](#step-1--aws-account-setup)
- [Step 2 — Enable Amazon Bedrock](#step-2--enable-amazon-bedrock)
- [Step 3 — Backend Deployment](#step-3--backend-deployment)
- [Step 4 — Frontend Deployment to S3](#step-4--frontend-deployment-to-s3)
- [Step 5 — Environment Configuration](#step-5--environment-configuration)
- [Step 6 — Verify Deployment](#step-6--verify-deployment)
- [Production Checklist](#-production-checklist)
- [Troubleshooting](#-troubleshooting)
- [Cost Estimation](#-cost-estimation)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                           │
│                  (index.html + script.js)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS S3 — Static Website Hosting                │
│   simplifai-frontend-hackathon-2026.s3-website-...          │
│   Serves: index.html, script.js, pdf.js, style.css          │
└──────────────────────────┬──────────────────────────────────┘
                           │  POST /api/explain
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend (Express API)                  │
│              server.js — Port 3000                          │
│              (EC2 / Lambda / local server)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │  InvokeModel API Call
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Bedrock                                    │
│              Model: amazon.nova-lite-v1:0                   │
│              Region: ap-south-1 (Mumbai)                    │
└─────────────────────────────────────────────────────────────┘
```

**Frontend** is a static site hosted on **AWS S3**.
**Backend** is a Node.js server that can be hosted on EC2, Lambda, or any cloud/local environment.
**AI Engine** is **Amazon Nova 2 Lite** accessed via **AWS Bedrock**.

---

## ✅ Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Check Command |
|---|---|---|
| **Node.js** | v18.0.0 or higher | `node --version` |
| **npm** | v8.0.0 or higher | `npm --version` |
| **AWS CLI** | v2.x | `aws --version` |
| **AWS Account** | Active account with billing | AWS Console |
| **Git** | Any recent version | `git --version` |

Install AWS CLI if not already installed:
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Windows — download from https://aws.amazon.com/cli/
```

---

## Step 1 — AWS Account Setup

### 1.1 Configure AWS CLI

```bash
aws configure
```

Enter your credentials when prompted:

```
AWS Access Key ID [None]: YOUR_ACCESS_KEY_ID
AWS Secret Access Key [None]: YOUR_SECRET_ACCESS_KEY
Default region name [None]: ap-south-1
Default output format [None]: json
```

### 1.2 Create a Dedicated IAM User (Recommended)

> ⚠️ **Never use your root account credentials in application code.**

1. Go to **AWS Console → IAM → Users → Create User**
2. Name it `simplifai-app-user`
3. Select **"Attach policies directly"**
4. Create and attach this custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Go to the user → **Security Credentials** → **Create Access Key**
6. Select "Application running outside AWS"
7. **Download and save** the CSV — you'll only see the secret key once!

---

## Step 2 — Enable Amazon Bedrock

### 2.1 Request Model Access

Amazon Bedrock models require **explicit activation** before use.

1. Open **AWS Console → Amazon Bedrock**
2. In the left sidebar: **Model access → Manage model access**
3. Find **"Amazon Nova Lite"** in the list
4. Click **"Request access"** → **"Submit"**

> ⏱️ Access is typically granted **instantly** for Nova Lite. Check the status column — it should show **"Access granted"**.

### 2.2 Verify Region

SimplifAI is configured for `ap-south-1` (Mumbai). Confirm Nova Lite is available:

```bash
aws bedrock list-foundation-models \
  --region ap-south-1 \
  --query "modelSummaries[?contains(modelId, 'nova-lite')]"
```

Expected output:
```json
[
  {
    "modelId": "amazon.nova-lite-v1:0",
    "modelName": "Nova Lite",
    "providerName": "Amazon",
    "responseStreamingSupported": true
  }
]
```

---

## Step 3 — Backend Deployment

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Create Environment File

```bash
cp .env.example .env   # or create .env manually
```

Edit `.env`:

```env
AWS_ACCESS_KEY_ID=your_iam_user_access_key
AWS_SECRET_ACCESS_KEY=your_iam_user_secret_key
AWS_REGION=ap-south-1
PORT=3000
```

### 3.3 Test Bedrock Connectivity

Before deploying, run the included connectivity test:

```bash
node test-bedrock.js
```

✅ **Success output** looks like:
```
✅ Bedrock connection successful!
Model: amazon.nova-lite-v1:0
Response received in 2.1s
```

❌ **Failure** — see [Troubleshooting](#-troubleshooting).

### 3.4 Start the Server

**Development (with auto-restart):**
```bash
npx nodemon server.js
```

**Production (persistent with PM2):**
```bash
npm install -g pm2
pm2 start server.js --name "simplifai-backend"
pm2 save
pm2 startup   # Auto-start on system reboot
```

**Verify the server is running:**
```bash
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"code":"for i in range(5): print(i)","language":"python","level":"beginner","analogy":"cricket"}'
```

### 3.5 Optional — Deploy Backend on AWS EC2

If you want to host the backend on AWS:

```bash
# Launch EC2 (t2.micro for free tier)
# SSH into instance, then:

sudo apt update && sudo apt install -y nodejs npm git
git clone https://github.com/vivekmaurya18/AI-Code-Explainer.git
cd AI-Code-Explainer/backend
npm install

# Set environment variables via AWS Systems Manager Parameter Store
# OR create .env directly (not recommended for production)

npm install -g pm2
pm2 start server.js --name simplifai
```

> 💡 **Pro tip:** Use **AWS IAM Instance Roles** instead of `.env` files for EC2 deployments — no credentials stored on disk!

---

## Step 4 — Frontend Deployment to S3

### 4.1 Create S3 Bucket

```bash
# Replace with your preferred bucket name
BUCKET_NAME="simplifai-frontend-hackathon-2026"
REGION="us-east-1"

aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION
```

> Note: `us-east-1` does not require `--create-bucket-configuration`. For other regions, add `--create-bucket-configuration LocationConstraint=YOUR_REGION`.

### 4.2 Enable Static Website Hosting

```bash
aws s3 website s3://$BUCKET_NAME/ \
  --index-document index.html \
  --error-document index.html
```

### 4.3 Disable Block Public Access

```bash
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### 4.4 Apply Public Read Bucket Policy

```bash
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*"
      }
    ]
  }'
```

### 4.5 Update API Endpoint in Frontend

Before uploading, update the backend API URL in `frontend/script.js`:

```javascript
// Find this line and update with your backend URL:
const API_BASE_URL = 'http://YOUR_BACKEND_URL:3000';
// Example for EC2:
const API_BASE_URL = 'http://ec2-xx-xx-xx-xx.ap-south-1.compute.amazonaws.com:3000';
// Example for local testing:
const API_BASE_URL = 'http://localhost:3000';
```

### 4.6 Upload Frontend Files

```bash
aws s3 sync frontend/ s3://$BUCKET_NAME/ \
  --exclude "*.DS_Store" \
  --exclude "*.gitignore" \
  --cache-control "max-age=86400"
```

### 4.7 Get Your Website URL

```bash
echo "Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
```

Your site is now live! 🎉

---

## Step 5 — Environment Configuration

### 5.1 CORS Configuration

If your frontend (S3) and backend are on different domains, ensure CORS is enabled in `backend/server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://simplifai-frontend-hackathon-2026.s3-website-us-east-1.amazonaws.com',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

### 5.2 Environment Variable Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | ✅ Yes | IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | ✅ Yes | IAM user secret key | `wJalrXUtnFEMI/...` |
| `AWS_REGION` | ✅ Yes | Bedrock region | `ap-south-1` |
| `PORT` | ⬜ Optional | Server port (default 3000) | `3000` |

---

## Step 6 — Verify Deployment

### Full End-to-End Test

```bash
# 1. Test backend health
curl http://YOUR_BACKEND_URL:3000/health

# 2. Test Bedrock integration
node backend/test-bedrock.js

# 3. Test full API flow
curl -X POST http://YOUR_BACKEND_URL:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def greet(name): return f\"Hello {name}\"",
    "language": "python",
    "level": "beginner",
    "analogy": "cricket",
    "outputLanguage": "hinglish"
  }'

# 4. Open frontend in browser
open http://simplifai-frontend-hackathon-2026.s3-website-us-east-1.amazonaws.com/
```

---

## ✅ Production Checklist

Before going live, verify every item:

### Security
- [ ] `.env` file is in `.gitignore` and NOT committed to git
- [ ] AWS root account credentials are NOT used anywhere
- [ ] IAM user has **minimum required permissions** only
- [ ] No AWS credentials hardcoded in any source file
- [ ] CORS is restricted to known frontend origins only

### Backend
- [ ] `node test-bedrock.js` returns success
- [ ] Server starts without errors (`node server.js`)
- [ ] POST `/api/explain` returns valid response
- [ ] PM2 or equivalent process manager is running

### Frontend
- [ ] `API_BASE_URL` in `script.js` points to correct backend URL
- [ ] S3 bucket has public read policy applied
- [ ] Static website hosting is enabled
- [ ] All files uploaded: `index.html`, `script.js`, `pdf.js`, `style.css`
- [ ] Site loads at S3 website URL

### AWS
- [ ] Amazon Nova Lite model access shows **"Access granted"** in Bedrock console
- [ ] Region is set to `ap-south-1` (or your chosen region)
- [ ] S3 bucket region matches website URL

---

## 🔧 Troubleshooting

### ❌ "AccessDeniedException" from Bedrock

```
AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel
```

**Fix:** Your IAM user doesn't have Bedrock permissions. Re-check Step 1.2 and ensure the policy is attached correctly.

---

### ❌ "Model not found" or "ResourceNotFoundException"

```
ResourceNotFoundException: Could not find model amazon.nova-lite-v1:0
```

**Fix:** You haven't enabled Nova Lite model access. Complete Step 2.1 — request access in the Bedrock console.

---

### ❌ Frontend shows "Failed to fetch" or network error

**Causes & Fixes:**
1. Backend server is not running → Start with `node server.js`
2. Wrong API URL in `script.js` → Update `API_BASE_URL`
3. CORS error → Update allowed origins in backend CORS config
4. Port blocked by firewall → Open port 3000 in EC2 security group

---

### ❌ S3 site shows "403 Forbidden"

**Fix:** Bucket policy wasn't applied. Re-run Steps 4.3 and 4.4.

---

### ❌ `node test-bedrock.js` fails with region error

**Fix:** Ensure `AWS_REGION=ap-south-1` is set in `.env`. Nova 2 Lite availability varies by region.

---

## 💰 Cost Estimation

For a hackathon/prototype with moderate usage:

| Service | Usage | Estimated Cost |
|---|---|---|
| **Amazon Nova Lite** (Bedrock) | ~1,000 API calls/month | ~$0.30/month |
| **AWS S3** (Static Hosting) | ~1 GB storage + ~10K requests | ~$0.03/month |
| **AWS EC2** (Backend, optional) | t2.micro, 24/7 | ~$8.50/month (or free tier) |
| **Data Transfer** | ~1 GB outbound | ~$0.09/month |

> **Total estimated cost: ~$0.40–$9/month** (often within AWS Free Tier for new accounts)

> 💡 Nova 2 Lite is one of the most cost-efficient models on AWS Bedrock, making it perfect for high-volume student projects.

---

<div align="center">

*SimplifAI Deployment Guide · Built for AWS AI for Bharat Hackathon 2026*

**Team AI²** · Vivek Maurya & Saurav Kumar · Made with ❤️ in India 🇮🇳

</div>
