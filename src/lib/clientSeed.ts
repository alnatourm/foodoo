import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { SEED_DATA } from './seedData';

export async function seedDatabase() {
  console.log('Starting client-side seed...');
  const batch = writeBatch(db);

  for (const [colName, docs] of Object.entries(SEED_DATA)) {
    console.log(`Queueing collection: ${colName}`);
    docs.forEach((docData: any) => {
      const { id, ...data } = docData;
      const docRef = doc(db, colName, id);
      batch.set(docRef, data);
    });
  }

  await batch.commit();
  console.log('Client-side seed successful!');
}
