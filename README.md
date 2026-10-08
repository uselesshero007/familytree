# Family Tree

A private family tree and family history app. The existing tree editor works locally in the browser and can optionally sync each signed-in user's family to their own Firestore path.

## Run locally

Install dependencies and start the Vite development server:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Firebase's npm SDK is bundled by Vite; opening `index.html` directly or serving this project with Python's static server will not resolve its npm imports.

## Add Firebase Google sign-in and cloud sync

The Firebase Web App configuration is in `js/firebase-config.js`. To enable real Google authentication and per-user Firestore sync:

1. In **Authentication → Sign-in method**, enable **Google**. Add `localhost` and your deployed website's hostname to **Authorized domains**.
2. Create the Firestore database.
3. Publish the rules from `firestore.rules` in **Firestore → Rules**. The rules limit every family-member read/write to the authenticated matching UID.
4. Host the app over HTTPS for production. Google sign-in popups and service workers require a secure context (localhost is accepted for local testing).

After configuration, **Sign in with Google** opens Firebase's real Google sign-in flow. The app reads and writes members at `users/{uid}/familyMembers/{memberId}`. Relationship records are stored on the document for their `from` member. Signed-in local cache keys are UID-specific; signing out clears the displayed private tree.

The user's display name and profile photo are shown after authentication. Browser-local, UID-specific family data remains available as a fallback when Firestore cannot be reached.

## Family data and PDF

Add, edit, or delete people from the member dialog/profile. A member can be linked to a father, mother, child, spouse, sibling, or other relative. The tree, member list, profiles, timeline, and photo view update from the same family data.

The **Download Family Tree PDF** action opens the browser's print dialog with a print-ready report containing the tree, members, relationships, key details, export timestamp, and the requested courtesy footer. Choose **Save as PDF** in the print dialog to download the PDF. The report uses the browser's installed Bengali fonts.

Create a production build and serve it locally for a production-style check:

```powershell
npm run build
npm run preview
```

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
