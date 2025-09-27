# CM with MN Learning Platform

This is a learning platform for Combined Maths with Madushan Neranjan. The platform includes:
- Student login with Google authentication
- Admin dashboard for managing student access
- Lesson management with YouTube video embedding
- Firebase integration for authentication and data storage

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication and select Google as a sign-in method
4. Create a Firestore database in test mode
5. Register your web app in Firebase project settings
6. Copy the Firebase configuration (apiKey, authDomain, etc.)
7. Replace the placeholder configuration in `app.js` with your actual Firebase config

```javascript
// Replace this in app.js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Firestore Database Structure

The application uses the following collections:

- **users**: Stores user information
  - Document ID: User's email
  - Fields: email, displayName, photoURL, lastLogin

- **admins**: Identifies admin users
  - Document ID: Admin's email
  - Fields: email, role (set to "admin")

- **lessons**: Stores lesson information
  - Document ID: `{year}-{month}-{type}`
  - Fields: month, year, type, videoUrl, updatedAt

- **access**: Maps students to lessons they can access
  - Document ID: `{studentEmail}-{lessonId}`
  - Fields: studentEmail, lessonId, grantedBy, grantedAt

### 3. Admin Setup

The default admin password is `phy123`. You can change this in the `app.js` file:

```javascript
// Change this in app.js
const ADMIN_PASSWORD = 'phy123';
```

To make a user an admin, manually create a document in the "admins" collection with the user's email as the document ID.

### 4. Running the Application

Simply open the `index.html` file in a web browser. For production use, deploy to a web hosting service like Firebase Hosting.

## Usage

### Student Access

1. Students log in with their Google account
2. They can view lessons that have been assigned to them
3. Each lesson includes a YouTube video and description

### Admin Access

1. Click "Are you an admin? Login here" on the login page
2. Enter the admin password (`phy123`)
3. Use the admin dashboard to:
   - Assign lessons to students by email
   - View a list of students with access

## Customization

- Edit the CSS in `styles.css` to change the appearance
- Modify the lesson description in `app.js` (createLessonCard function)
- Update the logo in `logo.svg`