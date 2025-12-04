import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

// Force driver pages to be dynamic
export const dynamic = 'force-dynamic';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userData = await getCurrentUser();

  // Redirect if not authenticated or not a driver
  if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
