# Vote Tracker Dashboard

A comprehensive vote tracking dashboard with real-time data visualization for election monitoring.

## Features

- **Real-time Dashboard**: View overall voting statistics including total votes, registered voters, voting centers, and turnout percentage
- **Candidate Leaderboard**: See candidates ranked by vote count with visual indicators for the leading candidate
- **Data Visualization**: Interactive bar and pie charts showing vote distribution among candidates
- **Ward-level Analysis**: Drill down into specific wards to view localized voting data
- **Voting Center Details**: View performance metrics for individual voting centers
- **Admin Panel**: Add new candidates, wards, centers, and vote entries

## Color Scheme

The application uses a red-based color scheme with the following palette:
- Primary: Red (`--chart-1`)
- Secondary colors: Black (`--chart-2`), Green (`--chart-3`), White (`--chart-4`)

## Charts

The dashboard includes two main charts for data visualization:

1. **Bar Chart**: Shows the number of votes each candidate has received
2. **Pie Chart**: Displays the percentage distribution of votes among candidates

Both charts use the predefined color scheme and are responsive to different screen sizes.

## Tech Stack

- Next.js 15.2.4 with App Router
- React 19
- TypeScript
- Tailwind CSS v4.1.9
- Recharts for data visualization
- Firebase Firestore for data storage
- Radix UI components

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

To deploy the application:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Update the environment variables in `.env.local` with your Firebase configuration
4. Deploy Firestore rules from `firestore.rules` file

## Folder Structure

```
app/              # Next.js app router pages
components/       # Reusable UI components
lib/              # Business logic and utilities
public/           # Static assets
```

## Environment Variables

Create a `.env.local` file with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```