import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function clearData() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('Missing config file');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log('Initializing Firebase Admin...');
  const app = getApps().length === 0 
    ? initializeApp({ projectId: config.projectId })
    : getApp();

  const db = getFirestore(app, config.firestoreDatabaseId);

  const collections = [
    'tenants',
    'branches',
    'categories',
    'products',
    'ingredients',
    'tables',
    'orders',
    'staff',
    'suppliers',
    'purchase_orders',
    'journal_entries',
    'shifts',
    '_seed_test'
  ];

  console.log('Starting data clear...');

  for (const colName of collections) {
    console.log(`Clearing collection: ${colName}`);
    const snapshot = await db.collection(colName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`  Cleared ${snapshot.size} documents.`);
  }

  console.log('Data clear completed successfully.');
}

clearData().catch(err => {
  console.error('Clear failed:', err);
  process.exit(1);
});
