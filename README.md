# MetricMail

A full-stack Gmail campaign and analytics dashboard. Connect your Gmail account, send email campaigns to a CSV recipient list, and track delivery, opens, bounces, and replies in real time. Also includes a Gmail inbox organizer that auto-classifies and manages emails by category (Promotions, Social, Jobs, OTP and more).

## Features

- **Campaign management** — create campaigns, upload recipients via CSV, and send bulk personalized emails through your own Gmail account
- **Real-time analytics** — track sent, delivered, bounced, opened, clicked, and replied stats per campaign, synced live from Gmail
- **Inbox labels & cleanup** — auto-classify inbox emails into 7 categories and bulk trash/archive by rule
- **Gmail-native tracking** — bounce and reply detection powered directly by the Gmail API, no third-party ESP required
- **JWT authentication** with optional Google Sign-In

## Tech Stack

- **Frontend:** React, React Router, Recharts, Axios, Vite
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT, bcrypt, Google OAuth 2.0
- **Email:** Gmail API
- **File Handling:** Multer, CSV Parser
- **Deployment:** Vercel (frontend), Render (backend)
