import Link from 'next/link';
import { Button } from '@repo/ui';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Real Estate Platform</h1>
        <p className="text-muted-foreground mb-8">
          Find your perfect property in Uzbekistan
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
