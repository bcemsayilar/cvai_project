'use client';

import React from 'react';

export function DebugEnv() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md">
      <h3 className="text-sm font-bold mb-2">Environment Debug</h3>
      <div className="space-y-1 text-xs">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-300">{key}:</span>
            <span className={value ? 'text-green-400' : 'text-red-400'}>
              {value || 'MISSING'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}