import { Metadata } from 'next';
import SignIn from '@/components/auth/SignIn';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your FitSage account to track your fitness journey.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
          FitSage
        </h1>
        <h2 className="mt-2 text-center text-sm text-gray-600">
          Your personal fitness companion
        </h2>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignIn />
      </div>
    </div>
  );
}

