'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Une erreur est survenue</h2>
          <button onClick={() => reset()}>Réessayer</button>
        </div>
      </body>
    </html>
  );
}
