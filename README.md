# BioZackTeam Fitness Platform

A coaching and community fitness platform built with React + TypeScript + Tailwind CSS, with Firebase Authentication.

## What This Project Does

This is a **fitness coaching platform** with 3 user roles:

| Role | What they can do |
|---|---|
| **Coach** | Manage clients, review weekly check-ins, assign workouts, send messages, post to community, manage video library |
| **Coaching Client** | Submit weekly check-ins (macros, weight, photos), view assigned workouts, message coach, access community |
| **Community Member** | Access free video library, view workouts, participate in community feed |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom clay/glassmorphism design system
- **Auth**: Firebase Authentication (email/password)
- **Data**: localStorage (temporary — will migrate to Firestore later)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Bilingual**: English + Arabic (RTL support)

## Project Structure

```
src/
├── lib/firebase.ts          # Firebase app + auth init
├── context/
│   ├── AuthContext.tsx       # Firebase Auth (sign in/out, session)
│   ├── DataContext.tsx       # All data state (localStorage for now)
│   └── LanguageContext.tsx   # EN/AR bilingual support
├── pages/
│   ├── Login.tsx             # Sign-in only (no self-registration)
│   ├── Dashboard.tsx         # Role-based dashboard router
│   ├── CheckIn.tsx           # Client weekly check-in form
│   ├── CoachReview.tsx       # Coach reviews client check-ins
│   ├── Clients.tsx           # Coach manages client list
│   ├── Messages.tsx          # Coach ↔ Client messaging
│   ├── Community.tsx         # Community feed (posts, likes, comments)
│   ├── VideoLibrary.tsx      # Video library with lock/unlock
│   ├── Workouts.tsx          # 100+ training programs + custom workouts
│   └── Profile.tsx           # User profile page
├── components/
│   ├── layout/Layout.tsx     # Sidebar navigation + background
│   ├── dashboard/            # Role-specific dashboard components
│   └── checkin/              # Check-in sub-components
├── data/                     # 100+ pre-built training programs (static)
├── types/index.ts            # All TypeScript interfaces
└── AppRoutes.tsx             # Protected routes with role-based access
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase
Create a `.env.local` file in the project root:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication → Email/Password** sign-in method
3. Create the coach account manually in Firebase Console → Authentication → Users → Add User

### 4. Run
```bash
npm run dev
```

## Authentication Flow

- **Login page**: Sign-in ONLY (no self-registration)
- **Coach account**: Created manually in Firebase Console (protected)
- **Client accounts**: Coach creates them from the admin panel
- **No one can create a Coach account** through the app — the role is hardcoded and protected
- Future: Payment (Stripe) integration will auto-provision accounts based on subscription tier

## Current Status

### ✅ Working
- Firebase Authentication (email/password sign-in)
- Role-based access control (coach/coaching/community)
- Full coaching workflow (check-ins → review → advance)
- 100+ pre-built training programs
- Community feed (posts, likes, comments)
- Private messaging (coach ↔ client)
- Video library with lock/unlock
- Bilingual support (EN/AR with RTL)
- Responsive design (mobile + desktop)

### 🔲 Coming Next
- Migrate data from localStorage to Firebase Firestore
- Firebase Storage for progress photos
- Stripe payment integration
- Real-time messaging
- Professional UI/UX redesign
