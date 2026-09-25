import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { initializeFirestore as initClientFirestore, Firestore } from 'firebase/firestore';
import { initializeApp as initAdminApp, getApps as getAdminApps, App as AdminApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let clientDb: Firestore | null = null;
let adminApp: AdminApp | null = null;
let authService: Auth | null = null;

export function getDb(): Firestore {
  if (!clientDb) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let config: any = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    const app = getClientApps().length === 0 ? initClientApp(config) : getClientApps()[0];
    clientDb = initClientFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, config.firestoreDatabaseId);
    console.log(`Firestore initialized successfully with database: ${config.firestoreDatabaseId || '(default)'}`);
  }
  return clientDb;
}

export function getAuthService(): Auth {
  if (!authService) {
    if (getAdminApps().length === 0) {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      let projectId = undefined;
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        projectId = config.projectId;
      }
      adminApp = initAdminApp({ projectId });
    } else {
      adminApp = getAdminApps()[0];
    }
    authService = getAuth(adminApp);
  }
  return authService;
}
