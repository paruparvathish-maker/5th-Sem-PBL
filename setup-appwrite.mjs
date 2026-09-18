/**
 * Appwrite Setup Script
 * Run once: node setup-appwrite.mjs
 * This creates the database + 4 collections in your Appwrite project.
 */
import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6aacc952002c2884cf3c')
  .setKey(process.env.APPWRITE_API_KEY || '');

const db = new Databases(client);
const DB_ID = 'pbl-db';

const anyPerms = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function setup() {
  // 1. Create Database
  try {
    await db.create(DB_ID, 'PBL Database');
    console.log('✅ Database created');
  } catch (e) {
    console.log('ℹ️ Database already exists, skipping');
  }

  const collections = [
    { id: 'profiles', name: 'Profiles' },
    { id: 'teams', name: 'Teams' },
    { id: 'evaluations', name: 'Evaluations' },
    { id: 'submissions', name: 'Submissions' },
  ];

  for (const col of collections) {
    try {
      await db.createCollection(DB_ID, col.id, col.name, anyPerms);
      console.log(`✅ Collection '${col.name}' created`);
    } catch (e) {
      console.log(`ℹ️ Collection '${col.name}' already exists, skipping`);
    }
  }

  console.log('\n🎉 Appwrite setup complete! Your database is ready to use.');
}

setup().catch(console.error);
