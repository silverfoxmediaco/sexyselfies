import React from 'react';

// Simple SVG icon components to replace MUI icons
export const FavoriteIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
  </svg>
);

export const LockIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z' />
  </svg>
);

export const BoltIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C15.54 14.04 13.01 17.76 11 21z' />
  </svg>
);

export const ShieldIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z' />
  </svg>
);

export const VerifiedIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7 3.1 5.52l.34 3.69L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z' />
  </svg>
);

export const TrendingUpIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z' />
  </svg>
);

export const PeopleIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63c-.34-1.02-1.29-1.37-2.32-1.37-.549 0-1.048.115-1.485.32l-5.94 2.28c-.3.1-.411.44-.341.75.07.3.33.4.63.4H12a1 1 0 0 1 1 1v1c0 1.1-.9 2-2 2h-1v8h10zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm1.5 1h-2C3.57 7 2.46 7.89 2.05 9.11L0 16h2.5v6h4v-6H8.5l-1.94-5.89C6.36 9.68 6 9.38 5.5 9z' />
  </svg>
);

export const ScheduleIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z' />
    <path d='M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z' />
  </svg>
);

export const RocketLaunchIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M9.19 6.35c-2.04 2.29-3.44 5.58-3.44 5.58s3.29-1.4 5.58-3.44L9.19 6.35zM11.17 17.35c-1.53-.49-2.87-1.47-3.86-2.72L5.42 16.52l6.52 6.52 1.89-1.89c-1.25-.99-2.23-2.33-2.72-3.86l.06.06zM4.93 17.93L10.52 23.52c.39.39 1.02.39 1.41 0l2.09-2.09L8.6 16.01l-1.89 1.89c-.39.39-.39 1.02 0 1.41l-.02.02z' />
    <path d='M22.23 2.69c-.39-.39-1.02-.39-1.41 0L18.7 4.81c-3.22.78-6.35 2.76-8.84 5.25L8.35 8.54c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.06 1.06c-.63 1.07-1.07 2.25-1.24 3.44L5.52 13.21c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.24 1.24c1.19-.17 2.37-.61 3.44-1.24l1.06 1.06c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-1.51-1.51c2.49-2.49 4.47-5.62 5.25-8.84l2.12-2.12c.39-.39.39-1.02 0-1.41l.06.04z' />
  </svg>
);

export const SwipeRightAltIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M13.9 11H8c-.55 0-1 .45-1 1s.45 1 1 1h5.9l-1.45 1.45c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l3.54-3.54c.39-.39.39-1.02 0-1.41L13.86 7.37c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41L13.9 11z' />
  </svg>
);

export const ChatBubbleOutlineIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z' />
  </svg>
);

export const ExpandMoreIcon = ({ className = '', ...props }) => (
  <svg
    className={`icon ${className}`}
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z' />
  </svg>
);
