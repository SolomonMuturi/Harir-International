import type { SVGProps } from 'react';

export function FreshTraceLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Your original paths, just cleaned up */}
      <path d="M12 2L2 7l10 5 10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M12 9l-3.5 6a1.5 1.5 0 102.6 1.5l3.5-6a1.5 1.5 0 10-2.6-1.5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function FreshViewLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Your original paths */}
      <path d="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      <path d="M15 9l2 1-2 1" />
      <path d="M9 15l-2-1 2-1" />
      <path d="M18 12v5l-2.5-1.5" />
    </svg>
  );
}