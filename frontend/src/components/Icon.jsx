import React from 'react';

const Icon = ({ name, size = 24, color = 'currentColor', className = '' }) => {
  const icons = {
    // Actions
    like: '/icons/actions/like.svg',
    pass: '/icons/actions/pass.svg',
    superLike: '/icons/actions/super-like.svg',
    message: '/icons/actions/message.svg',
    camera: '/icons/actions/camera.svg',

    // Navigation
    home: '/icons/nav/home.svg',
    discover: '/icons/nav/discover.svg',
    matches: '/icons/nav/matches.svg',
    profile: '/icons/nav/profile.svg',
  };

  const iconPath = icons[name] || icons.home;

  return (
    <img
      src={iconPath}
      alt={name}
      width={size}
      height={size}
      className={`icon icon-${name} ${className}`}
      style={{ color }}
    />
  );
};

export default Icon;
