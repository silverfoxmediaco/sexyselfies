import React from 'react';

const Chip = ({
  children,
  variant = 'filled',
  color = 'default',
  size = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const classes = [
    'chip',
    `chip-${variant}`,
    `chip-${color}`,
    `chip-${size}`,
    onClick && 'chip-clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Chip;
