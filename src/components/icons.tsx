
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
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
        <path d="M15.21 8.85a1.5 1.5 0 0 0-2.42 0l-4.5 7.5a1.5 1.5 0 0 0 2.42 2.3l4.5-7.5a1.5 1.5 0 0 0 0-2.3Z" />
        <path d="M22 10.5V12l-10 5-10-5v-1.5" />
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
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
      <path d="M15.5 8.5L18 10l-2.5 1.5"></path>
      <path d="M22 12v5l-2.5-1.5"></path>
      <path d="M8.5 15.5L6 14l2.5-1.5"></path>
    </svg>
  );
}
