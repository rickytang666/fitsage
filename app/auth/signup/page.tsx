import SignUpPage from '@/components/pages/SignUpPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - FitSage',
  description: 'Create your FitSage account to start your fitness journey.',
};

export default function Page() {
  return <SignUpPage />;
}
