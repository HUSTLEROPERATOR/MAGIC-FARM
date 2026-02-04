'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:border-magic-mystic/30 transition-all"
    >
      Esci
    </button>
  );
}
