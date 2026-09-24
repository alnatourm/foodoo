import { getDb } from './firebase.ts';
import { doc, setDoc } from 'firebase/firestore';
import blueprint from '../firebase-blueprint.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

async function seed() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Using Project ID:', config.projectId);
    console.log('Using Database ID:', config.firestoreDatabaseId || '(default)');
  }

  const firestore = getDb();
  console.log('Starting database seeding...');

  for (const collection of blueprint.collections) {
    console.log(`Seeding collection: ${collection.name}`);
    for (const docData of collection.documents) {
      const { id, ...data } = docData;
      await setDoc(doc(firestore, collection.name, id), data);
      console.log(`  Seeded document: ${id}`);
    }
  }

  console.log('Database seeding complete.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
