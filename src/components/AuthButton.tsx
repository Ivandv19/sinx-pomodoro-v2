/** @jsxImportSource react */
import React from 'react';
import { authClient } from '../lib/auth-client';

interface Props {
  loginText: string;
  logoutText: string;
  loginUrl: string;
}

export default function AuthButton({ loginText, logoutText, loginUrl }: Props) {
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  if (isPending) {
    return (
      <div className="btn btn-ghost btn-sm loading">
        <span className="loading loading-spinner loading-xs"></span>
      </div>
    );
  }

  if (session) {
    return (
      <button 
        onClick={handleLogout}
        className="btn btn-ghost btn-sm"
      >
        {logoutText}
      </button>
    );
  }

  return (
    <a href={loginUrl} className="btn btn-ghost btn-sm">
      {loginText}
    </a>
  );
}
