# Firebase Setup Instructions

## Current Configuration
The project is already configured with Firebase credentials in the `.env.local` file.

## Setting Up Firestore Rules

For development purposes, the project includes a `firestore.rules` file with public read/write access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Deploying Rules

To deploy these rules to your Firebase project, you'll need to:

1. Install the Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to your Firebase account:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init firestore
   ```
   - Select your project from the list
   - Accept the default Firestore rules file location

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Important Security Note

The current rules allow public read/write access, which is suitable for development but NOT for production. For production, you should implement proper authentication and authorization rules.

Example of more secure rules with authentication:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Dashboard Features

The dashboard now includes enhanced data visualization features:

- Interactive bar charts showing vote counts per candidate
- Pie charts displaying vote distribution percentages
- Color-coded visualizations using the red-based theme
- Responsive design that works across different screen sizes

All charts are implemented using the Recharts library and follow the application's color scheme defined in the CSS variables.