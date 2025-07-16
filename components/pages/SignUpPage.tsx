import { Metadata } from 'next';
import SignUp from '@/components/auth/SignUp';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your FitSage account to start your fitness journey.',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
          FitSage
        </h1>
        <h2 className="mt-2 text-center text-sm text-gray-600">
          Start your fitness journey today
        </h2>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignUp />
      </div>
    </div>
  );
}
