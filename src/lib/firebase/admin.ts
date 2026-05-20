import * as admin from 'firebase-admin';

let app: admin.app.App;

if (admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const options: admin.AppOptions = {
    projectId: projectId || 'ciudadalerta-dev',
  };

  if (projectId && clientEmail && privateKey) {
    options.credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  app = admin.initializeApp(options);
} else {
  app = admin.apps[0]!;
}

export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export const adminMessaging = admin.messaging(app);
export { app as adminApp };
