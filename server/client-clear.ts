import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function clearData() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('Missing config file');
    process.exit(1);
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

  console.log('Initializing Firebase Web SDK...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app); // Uses default if not specified, but let's be explicit if we can

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
    'shifts'
  ];

  console.log('Starting data clear (Client SDK)...');

  for (const colName of collections) {
    console.log(`Clearing collection: ${colName}`);
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`  Found ${snapshot.size} documents in ${colName}`);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, colName, d.id)));
      await Promise.all(deletePromises);
      
      console.log(`  Cleared ${snapshot.size} documents.`);
    } catch (e) {
      console.error(`  Failed to clear ${colName}:`, e);
    }
  }

  console.log('Data clear completed.');
}

clearData().catch(console.error);
