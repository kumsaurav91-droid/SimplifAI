<div align="center">

# 📋 Requirements Document

<img src="https://img.shields.io/badge/Project-AI%20Code%20Explainer-FF9900?style=for-the-badge&logo=amazonaws"/>
<img src="https://img.shields.io/badge/Team-AI²%20(AI%20Square)-7B2FFF?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Hackathon-AWS%20AI%20for%20Bharat-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>
<img src="https://img.shields.io/badge/Theme-AI%20for%20Learning%20%26%20Dev%20Productivity-00b894?style=for-the-badge"/>

<br/>

> **"Logic wahi, andaaz apna."**
>
> *Hinglish-first AI code explanations for India's next million developers.*

</div>

---

## 📋 Table of Contents

| # | Section |
|---|---|
| 1 | [Problem Statement](#1-problem-statement) |
| 2 | [Proposed Solution](#2-proposed-solution) |
| 3 | [Target Users](#3-target-users) |
| 4 | [Functional Requirements](#4-functional-requirements) |
| 5 | [Non-Functional Requirements](#5-non-functional-requirements) |
| 6 | [Constraints](#6-constraints) |
| 7 | [Success Metrics](#7-success-metrics) |
| 8 | [Future Enhancements](#8-future-enhancements) |
| 9 | [Stakeholders](#9-stakeholders) |

---

## 1. Problem Statement

India has **millions of aspiring developers** from Tier 2 and Tier 3 cities who struggle — not because of lack of intelligence, but because **programming education is delivered almost entirely in English**.

```
"Sirf English mein samjhaya jaata hai — aur confusion wahi se shuru hoti hai."
```

### Key Challenges

| # | Challenge | Real Impact |
|---|---|---|
| 🔴 | **Language Barrier** | Most documentation, tutorials, and error messages are English-only |
| 🔴 | **High Cognitive Load** | Students mentally translate before they can even understand logic |
| 🔴 | **Low Retention** | Fear of cryptic error messages causes early dropouts |
| 🔴 | **No Cultural Context** | Existing AI tools explain code *technically*, not *relatably* |

---

## 2. Proposed Solution

**AI Code Explainer** is a Hinglish-first, serverless AI tool that explains programming logic using **Indian cultural analogies**.

```
Code paste karo  →  Theme chuno  →  Hinglish mein samjho!
```

The system converts user-submitted code into **friendly, line-by-line Hinglish explanations** using analogies from:

| Theme | Examples |
|---|---|
| 🏏 **Cricket** | Loops = overs, Arrays = batting lineup, Functions = bowling action |
| 🎬 **Bollywood** | Conditions = plot twist, Class = production house, Loop = dance rehearsal |
| 🍛 **Recipe** | Functions = recipe steps, Arrays = ingredient list, Variables = dabba |

> **"Logic wahi, andaaz apna."**
>
> Same programming logic — explained in a way every Indian student already understands.

---

## 3. Target Users

| User Type | Profile | Pain Point Solved |
|---|---|---|
| 🎓 **Engineering Students** | 1st–3rd year, beginner to intermediate | English-only textbooks and docs |
| 💻 **Self-Learners** | Learning JS / Python / Java from scratch | No cultural context in existing AI tools |
| 🏙️ **Tier 2 / Tier 3 Students** | Cities where English fluency is limited | Language barrier in programming education |
| 🌱 **First-Gen Programmers** | No prior exposure to coding culture | Intimidating error messages and jargon |

---

## 4. Functional Requirements

---

### 4.1 Code Explanation

**Goal:** Accept code input and return line-by-line Hinglish explanations with cultural analogies.

> **User Story:**
> *"As a Hindi-speaking programming student, I want code explanations in Hinglish with cultural context, so that I can understand technical concepts without the English barrier."*

**Scope:**
- Accept source code as text input
- Support JavaScript, Python, and Java (+ Auto Detect)
- Provide line-by-line explanations in Hinglish
- Explain variables, loops, functions, and logic flow
- Provide expandable sections for deeper detail

#### ✅ Acceptance Criteria

| # | Condition | Expected Behaviour |
|---|---|---|
| AC-1.1 | WHEN code is submitted | THE `Code_Explainer` SHALL generate line-by-line explanations in Hinglish |
| AC-1.2 | FOR all technical terms | THE `Hinglish_Translator` SHALL convert jargon to culturally appropriate Hinglish |
| AC-1.3 | WHEN explaining any concept | THE `Cultural_Analogy_Engine` SHALL generate relevant Cricket / Bollywood / Recipe analogy |
| AC-1.4 | FOR every explanation | THE System SHALL provide expandable sections for detailed breakdown |
| AC-1.5 | WHEN user needs clarification | THE System SHALL provide additional context in simple Hinglish on request |

---

### 4.2 Cultural Analogy Engine

**Goal:** Map programming concepts to familiar Indian cultural contexts that students already know and love.

> **User Story:**
> *"As a student familiar with Indian culture, I want programming concepts explained through familiar analogies, so that I can relate to and remember the concepts better."*

**Supported Themes:**

```
🏏  Cricket Mode   →  Loops, arrays, conditions explained via cricket scenarios
🎬  Bollywood Mode →  Functions, classes, recursion explained via film industry
🍛  Recipe Mode    →  Variables, loops, functions explained via cooking steps
```

#### ✅ Acceptance Criteria

| # | Condition | Expected Behaviour |
|---|---|---|
| AC-2.1 | WHEN explaining loops | THE `Cultural_Analogy_Engine` SHALL use cricket overs or Bollywood dance rehearsal analogies |
| AC-2.2 | WHEN explaining functions | THE `Cultural_Analogy_Engine` SHALL use recipe ingredient or cooking step analogies |
| AC-2.3 | WHEN explaining data structures | THE `Cultural_Analogy_Engine` SHALL use Indian contexts like family trees or cricket team formations |
| AC-2.4 | FOR all generated analogies | THE System SHALL ensure content is culturally appropriate and respectful |
| AC-2.5 | WHEN user selects a theme | THE `Theme_Engine` SHALL prioritize analogies from that domain across ALL outputs |

---

### 4.3 Galti Se Mistake Debugger

**Goal:** Detect errors and explain them with an encouraging, friendly Hinglish tone — no intimidating messages ever.

> **User Story:**
> *"As a beginner programmer, I want friendly debugging help when my code has errors, so that I can learn from mistakes without feeling discouraged."*

**Tone Design:**

```
❌  Standard Error:  "SyntaxError: invalid syntax at line 3"

✅  Our Debugger:    "Koi baat nahi! Ek chhoti si galti hai —
                     line 3 mein colon (:) bhool gaye.
                     Aisa fix karo:  for i in range(10):"
```

#### ✅ Acceptance Criteria

| # | Condition | Expected Behaviour |
|---|---|---|
| AC-3.1 | WHEN code contains syntax errors | THE `Galti_Debugger` SHALL identify and explain in encouraging Hinglish |
| AC-3.2 | WHEN logic errors are detected | THE `Galti_Debugger` SHALL suggest fixes using cultural analogy examples |
| AC-3.3 | FOR all error messages | THE `Galti_Debugger` SHALL use *"Koi baat nahi"* and *"Galti se mistake ho gaya"* tone |
| AC-3.4 | WHEN providing corrections | THE System SHALL explain *why* the error occurred using simple examples |
| AC-3.5 | AFTER repeated similar mistakes | THE `Galti_Debugger` SHALL proactively offer tips to prevent the same mistake |

---

### 4.4 Theme-Based Learning

**Goal:** Let students choose the analogy theme that resonates most with them — and switch anytime.

> **User Story:**
> *"As a learner with specific interests, I want to choose learning themes that resonate with me, so that I can stay engaged while learning programming."*

#### ✅ Acceptance Criteria

| # | Condition | Expected Behaviour |
|---|---|---|
| AC-4.1 | AT launch | THE `Theme_Engine` SHALL offer Cricket, Bollywood, and Recipe as selectable themes |
| AC-4.2 | WHEN Cricket theme is selected | THE System SHALL use cricket terminology and match scenarios in ALL explanations |
| AC-4.3 | WHEN Bollywood theme is selected | THE System SHALL use film industry and entertainment analogies consistently |
| AC-4.4 | WHEN Recipe theme is selected | THE System SHALL use cooking and food preparation analogies consistently |
| AC-4.5 | DURING any session | THE System SHALL allow theme switching without losing current explanation context |

---

### 4.5 Session Management

**Goal:** Remember user preferences and explanation history across visits for a personalized experience.

> **User Story:**
> *"As a regular learner, I want the system to remember my preferences and progress, so that I can have a personalized learning experience each time I return."*

#### ✅ Acceptance Criteria

| # | Condition | Expected Behaviour |
|---|---|---|
| AC-5.1 | ACROSS sessions | THE System SHALL track and restore user theme preferences |
| AC-5.2 | WHEN user returns | THE System SHALL restore their previous learning context automatically |
| AC-5.3 | FOR each user | THE System SHALL maintain a history of explained code snippets |
| AC-5.4 | OVER time | THE System SHALL provide analytics on learning progress and engagement |
| AC-5.5 | AFTER quiz completion | THE System SHALL track comprehension metrics and surface weak areas |

---

## 5. Non-Functional Requirements

---

### 5.1 Performance

| Metric | Target | Strategy |
|---|---|---|
| **Response Time** | < 2 seconds end-to-end | CloudFront CDN + DynamoDB explanation cache + parallel Lambda |
| **Concurrent Users** | Up to 10,000 simultaneous | Lambda auto-scaling + API Gateway throttling |
| **Cache Hit Rate** | > 60% for repeat queries | DynamoDB 30-day TTL cache on code hash |

---

### 5.2 Scalability

| Requirement | Implementation |
|---|---|
| **Serverless architecture** | AWS Lambda — zero server management |
| **Auto-scale with demand** | Lambda concurrency scales automatically with traffic |
| **No manual infrastructure** | AWS SAM manages all provisioning via IaC |

---

### 5.3 Availability

| Requirement | Target | Implementation |
|---|---|---|
| **Uptime** | 99.9% | Multi-AZ Lambda + DynamoDB replication |
| **AI failure fallback** | Graceful degradation | Cached responses served when Bedrock is unavailable |
| **Module isolation** | Partial failure OK | One Lambda down does not affect other features |

---

### 5.4 Security

| Requirement | Implementation |
|---|---|
| **HTTPS for all traffic** | Enforced via CloudFront + API Gateway — no HTTP |
| **Encryption in transit** | TLS 1.2+ on all endpoints |
| **Encryption at rest** | DynamoDB SSE + S3 server-side encryption |
| **No permanent code storage** | Code hashed — never stored raw without consent |
| **IAM access control** | Least-privilege IAM role per Lambda function |

---

### 5.5 Accessibility

| Requirement | Implementation |
|---|---|
| **Low-bandwidth networks** | Optimized asset sizes + CloudFront compression |
| **Mobile-friendly UI** | Responsive React.js design — tested on small screens |
| **Distraction-free interface** | Minimal UI — code in, explanation out |

---

## 6. Constraints

| Constraint | Detail |
|---|---|
| **Language Scope** | Initial version supports Hinglish (Hindi + English) only |
| **Code Length Limit** | Maximum 500 lines per submission |
| **Internet Required** | AI generation requires active internet connection |
| **Pilot Scale** | Designed and tested for hackathon-scale usage initially |
| **Supported Languages** | Python, JavaScript, Java (Auto Detect for others) |

---

## 7. Success Metrics

| Metric | How We Measure | Target |
|---|---|---|
| **Explanation Speed** | Time from code submit to explanation display | < 2 seconds |
| **Comprehension Rate** | Average quiz score after explanation | > 70% correct |
| **Session Engagement** | Avg. number of explanations per session | > 3 per session |
| **Dropout Reduction** | Users who return after first visit | > 50% return rate |
| **Theme Adoption** | % of users who select a custom theme | > 40% |
| **Bug Fix Success** | Users who fix their code after debugger suggestion | > 65% |

---

## 8. Future Enhancements

| Phase | Enhancement | Description |
|---|---|---|
| **Phase 2** | 🌏 Regional Language Support | Tamil, Marathi, Bengali, Gujarati with locale detection |
| **Phase 3** | 💻 VS Code Extension | Real-time *"Explain in Hinglish"* inside the editor via right-click |
| **Phase 4** | 📴 Offline Mode | Service Worker caches last 10 explanations for zero-internet use |
| **Phase 5** | 📊 Learning Analytics Dashboard | Student progress over time, weak concept tracking, teacher view |
| **Phase 6** | 🔊 Voice Output | Text-to-speech Hinglish for differently-abled learners |
| **Phase 7** | 🏫 Institution Accounts | School/college-level dashboards and student progress reports |

---

## 9. Stakeholders

| Stakeholder | Role | Interest |
|---|---|---|
| 🎓 **Students & Learners** | Primary Users | Learn programming in their natural language |
| ⚖️ **Hackathon Judges** | Evaluators | Technical innovation + social impact for Bharat |
| ☁️ **AWS AI for Bharat Program** | Sponsor & Platform | Showcase of AWS AI services for Indian use cases |
| 🏫 **Educational Institutions** | Adopters | Tool for teachers to supplement English-heavy curriculum |
| 👨‍💻 **Team AI²** | Builders | Vivek Maurya & Saurav Kumar — ship a product that matters |

---

<div align="center">

**Team AI²** &nbsp;·&nbsp; Vivek Maurya & Saurav Kumar &nbsp;·&nbsp; Made with ❤️ in India 🇮🇳

*AWS AI for Bharat Hackathon 2026 &nbsp;·&nbsp; Theme: AI for Learning & Developer Productivity*

</div>
