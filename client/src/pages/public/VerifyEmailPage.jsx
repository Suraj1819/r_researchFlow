import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function VerifyEmailPage() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10 dark:bg-neutral-900">
          <Mail className="h-8 w-8 text-neutral-900 dark:text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Check your email
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {email ? (
            <>
              We sent a verification link to <strong>{email}</strong>. Click the link to activate
              your account.
            </>
          ) : (
            'We sent a verification link to your email. Click the link to activate your account.'
          )}
        </p>
        <div className="mt-8">
          <Link to="/login">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
