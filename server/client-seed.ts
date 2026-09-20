import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, initializeFirestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function clientSeed() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('Config file not found');
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  };

  const app = initializeApp(firebaseConfig);
  
  const dbIds = [config.firestoreDatabaseId, '(default)', undefined];
  let db: any = null;
  
  for (const dbId of dbIds) {
    if (!dbId && dbId !== undefined) continue;
    try {
      console.log(`Attempting to connect to database: ${dbId || 'default'}`);
      const testDb = getFirestore(app, dbId === '(default)' ? undefined : dbId);
      // Test write
      await setDoc(doc(testDb, '_seed_test', 'status'), { timestamp: new Date().toISOString() });
      console.log(`Successfully connected to and wrote to database: ${dbId || 'default'}`);
      db = testDb;
      break;
    } catch (err) {
      console.error(`Failed to connect to database ${dbId || 'default'}:`, err);
    }
  }

  if (!db) {
    console.error('Failed to connect to any database');
    return;
  }

  const blueprintPath = path.join(process.cwd(), 'firebase-blueprint.json');
  const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

  console.log('Starting client-side seeding...');

  for (const col of blueprint.collections) {
    console.log(`Seeding collection: ${col.name}`);
    for (const d of col.documents) {
      const { id, ...data } = d;
      await setDoc(doc(db, col.name, id), data);
      console.log(`  Seeded document: ${id}`);
    }
  }

  console.log('Client-side seeding complete.');
}

clientSeed().catch(err => {
  console.error('Client seed failed:', err);
  process.exit(1);
});
