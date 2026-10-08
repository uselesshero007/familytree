# Family Tree

A private family tree and family history app. The existing tree editor works locally in the browser and can optionally sync each signed-in user's family to their own Firestore path.

## Run locally

From this folder, run:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. Use an HTTP server rather than opening `index.html` directly so ES modules, the service worker, and Firebase work.

## Add Firebase Google sign-in and cloud sync

Firebase credentials are not included. To configure the optional real Google authentication and per-user Firestore sync:

1. Create or open a project in the Firebase Console and register a Firebase Web App.
2. Copy the Web App configuration values into `js/firebase-config.js`. Replace each `PASTE_...` placeholder. These are public web-app configuration values, not server credentials.
3. In **Authentication → Sign-in method**, enable **Google**. Add `localhost` and your deployed website's hostname to **Authorized domains**.
4. Create the Firestore database.
5. Publish the rules from `firestore.rules` in **Firestore → Rules**. The rules limit every family-member read/write to the authenticated matching UID.
6. Host the app over HTTPS for production. Google sign-in popups and service workers require a secure context (localhost is accepted for local testing).

After configuration, **Sign in with Google** opens Firebase's real Google sign-in flow. The app reads and writes members at `users/{uid}/familyMembers/{memberId}`. Relationship records are stored on the document for their `from` member. Signed-in local cache keys are UID-specific; signing out clears the displayed private tree.

Without configuration, Google sign-in is unavailable and the app remains usable with browser-local storage, JSON import/export, and printing.

## Family data and PDF

Add, edit, or delete people from the member dialog/profile. A member can be linked to a father, mother, child, spouse, sibling, or other relative. The tree, member list, profiles, timeline, and photo view update from the same family data.

The **Download Family Tree PDF** action opens the browser's print dialog with a print-ready report containing the tree, members, relationships, key details, export timestamp, and the requested courtesy footer. Choose **Save as PDF** in the print dialog to download the PDF. The report uses the browser's installed Bengali fonts.

## Deploying Firebase rules

Use the Firebase Console Rules editor, or install the Firebase CLI and run:

```powershell
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

## SEO domain placeholders

Replace `https://YOUR_DOMAIN.example/` in `index.html`, `robots.txt`, and `sitemap.xml` with the production HTTPS origin before deployment. The `.example` host is a placeholder, not a real domain.
