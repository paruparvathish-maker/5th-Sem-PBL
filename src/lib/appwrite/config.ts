import { Client, Databases, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6aacc952002c2884cf3c');

export const databases = new Databases(client);
export { ID, Query };

export const DB_ID = 'pbl-db';
export const COLLECTIONS = {
  PROFILES: 'profiles',
  TEAMS: 'teams',
  EVALUATIONS: 'evaluations',
  SUBMISSIONS: 'submissions',
};
