import React from 'react';

export function AppLogo({ className = 'w-8 h-8', size = 60 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      className={className}
      fill="none"
    >
      <rect x="6" y="6" width="48" height="48" rx="10" fill="#18181B" />
      <path
        d="M22 20h16M22 40h16M25 20l5 9 5-9M25 40l5-9 5 9"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="40" r="7" fill="#18181B" />
      <path
        d="M37 40l2 2 4-4"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
