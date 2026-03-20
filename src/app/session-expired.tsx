import React from 'react';

export default function SessionExpired() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-8">
      <h1 className="text-3xl font-bold mb-4 text-destructive">Session Expired</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Your session has expired due to inactivity or network loss.<br />Please log in again to continue.
      </p>
      <a href="/" className="px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/80 transition">Go to Login</a>
    </div>
  );
}
