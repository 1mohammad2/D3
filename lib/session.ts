import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

export async function getCurrentSession() {
  return await getServerSession(authOptions);
}
