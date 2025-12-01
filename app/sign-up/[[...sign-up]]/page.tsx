import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />
    </div>
  );
}
