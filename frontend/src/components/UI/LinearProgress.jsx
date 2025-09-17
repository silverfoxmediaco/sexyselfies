import React from 'react';

const LinearProgress = ({
  value,
  variant = 'indeterminate',
  color = 'primary',
  className = '',
  ...props
}) => {
  const classes = [
    'linear-progress',
    `linear-progress-${variant}`,
    `linear-progress-${color}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      <div
        className='linear-progress-bar'
        style={{ width: variant === 'determinate' ? `${value}%` : undefined }}
      />
    </div>
  );
};

export default LinearProgress;
