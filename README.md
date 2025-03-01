# Sniper App

A mobile application where users can "snipe" their friends by taking photos and earning points in a competitive, social environment.

## Features

- 📸 Camera functionality with sniper scope overlay
- 👥 Group management system with invite codes
- 🎯 Target selection from group members
- 📊 Points system for successful snipes
- 🔒 Secure authentication and data storage
- 📱 Local photo storage and direct sharing

## Tech Stack

- React Native with Expo
- Firebase Authentication
- Cloud Firestore
- Expo Router for navigation
- TypeScript for type safety

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Firebase project and enable:

   - Authentication (Email/Password)
   - Cloud Firestore

3. Set up your environment variables:
   Create a `.env` file in the root directory with your Firebase config:

   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

4. Deploy Firestore security rules:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

5. Start the development server:
   ```bash
   npx expo start
   ```

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── _layout.tsx        # Root layout with authentication
│   ├── auth.tsx           # Authentication screen
│   └── index.tsx          # Entry point
├── components/            # Reusable components
├── config/               # Configuration files
├── contexts/             # React contexts
├── hooks/                # Custom hooks
└── services/            # Firebase and business logic
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## Security

- Firebase Authentication handles user management
- Firestore security rules enforce data access control
- Local photo storage for privacy
- Points system protected by server-side rules

## License

MIT
