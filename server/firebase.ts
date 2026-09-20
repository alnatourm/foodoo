import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function initializeFirebase() {
  if (getApps().length === 0) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let projectId = undefined;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      projectId = config.projectId;
    }
    // Use Application Default Credentials (ADC) in the Cloud environment
    app = initializeApp({ projectId });
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    const firebaseApp = initializeFirebase();
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let databaseId: string | undefined = undefined;
    
    // Check if we should use the named database or default
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId && !process.env.USE_DEFAULT_DB) {
        databaseId = config.firestoreDatabaseId;
      }
    }

    try {
      db = getFirestore(firebaseApp, databaseId);
      db.settings({ ignoreUndefinedProperties: true });
      console.log(`Firestore initialized with database: ${databaseId || '(default)'}`);
    } catch (err) {
      console.warn('Failed to initialize with named database, falling back to default', err);
      db = getFirestore(firebaseApp);
      db.settings({ ignoreUndefinedProperties: true });
    }
  }
  return db;
}

export function getAuthService(): Auth {
  if (!auth) {
    const firebaseApp = initializeFirebase();
    auth = getAuth(firebaseApp);
  }
  return auth;
}
