import type { ImgHTMLAttributes } from 'react';

// Change the component name from FreshTraceLogo to HarirLogo
export function FreshTraceLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/images/Harirlogo.jpeg"
      alt="Harir International"
      {...props}
    />
  );
}

// You can keep FreshViewLogo if you still need it, or remove it
export function FreshViewLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/images/Harirlogo.jpeg" // Or different image for FreshView
      alt="Harir International"
      {...props}
    />
  );
}