import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let app: App | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!db) {
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
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let databaseId = undefined;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId) {
        databaseId = config.firestoreDatabaseId;
      }
    }
    db = getFirestore(app, databaseId);
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}
