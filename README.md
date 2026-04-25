# 🛡 SafeAlert — Emergency SOS Web App

A full-stack emergency SOS system with real-time alerting, GPS location, admin dashboard, and contact management.

---

## 📁 Project Structure

```
safealert/
├── backend/
│   ├── server.js          ← Express API server
│   └── package.json
└── frontend/
    └── public/
        ├── index.html     ← Main HTML (all 4 pages)
        ├── css/
        │   └── style.css  ← Full stylesheet
        └── js/
            └── app.js     ← All frontend logic + API calls
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd safealert/backend
npm install
```

### 2. Start the Server

```bash
node server.js
```

### 3. Open the App

Visit → **http://localhost:3000**

That's it! The backend serves the frontend automatically.

---

## 🌐 API Endpoints

| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| POST   | `/api/sos`                   | Send SOS alert           |
| GET    | `/api/alerts`                | Get all alerts           |
| GET    | `/api/alerts?status=new`     | Filter by status         |
| PUT    | `/api/alerts/:id`            | Update alert status      |
| DELETE | `/api/alerts/:id`            | Delete alert             |
| GET    | `/api/contacts`              | List contacts            |
| POST   | `/api/contacts`              | Add contact              |
| DELETE | `/api/contacts/:id`          | Remove contact           |
| PATCH  | `/api/contacts/:id/toggle`   | Toggle contact active    |
| GET    | `/api/stats`                 | Dashboard statistics     |

### POST /api/sos — Request Body

```json
{
  "userId": "user-123",
  "userName": "Rahul Sharma",
  "latitude": 19.8762,
  "longitude": 75.3433,
  "address": "Aurangabad, Maharashtra",
  "accuracy": 12,
  "message": "Emergency SOS triggered"
}
```

### Response

```json
{
  "success": true,
  "alertId": "uuid-here",
  "message": "Alert sent to 4 contacts",
  "notifiedContacts": ["Mom", "Rahul", "Priya", "Hospital"],
  "timestamp": "2025-04-25T10:30:00.000Z",
  "formattedTime": "25 Apr 2025, 10:30:00 AM"
}
```

---

## 📱 App Pages

| Tab | What it does |
|-----|-------------|
| **SOS** | Big SOS button, live stats, contacts, recent alerts |
| **Map** | Google Maps iframe with live GPS coordinates |
| **Admin** | All alerts, filter by status, respond/resolve/delete |
| **Contacts** | Add/remove/toggle emergency contacts |

---

## 🌍 Deploy to Vercel (Free Hosting)

1. Push both `frontend/` and `backend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import repo
3. Set root to `/backend`, build command: `npm install`, output: empty
4. Add environment variable: `PORT=3000`
5. Get your live URL: `https://safealert.vercel.app`

> **Or use Render.com** (easier for Node.js backends):
> 1. Connect GitHub repo
> 2. Set start command: `node server.js`
> 3. Free tier available

---

## 🔧 Production Upgrades

| Feature | What to add |
|---------|-------------|
| Real SMS alerts | Twilio API |
| Real push notifications | Firebase FCM |
| Database | MongoDB Atlas or PostgreSQL |
| Auth | JWT tokens |
| Real-time updates | Socket.io |
| Better maps | Google Maps JS API |

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "uuid": "^9.0.0"
}
```

No database needed to run — uses in-memory storage out of the box.
