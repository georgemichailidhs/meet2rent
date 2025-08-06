'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (session) {
    return (
      <>
        <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
          Sign Out
        </Button>
      </>
    );
  }
  return (
    <Link href="/auth/signin">
      <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
        Sign In
      </Button>
    </Link>
  );
}
