import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-[#D97706] mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-[#F5F5F5] mb-4">
          Page Not Found
        </h2>
        <p className="text-[#A3A3A3] mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="primary" size="medium">
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
