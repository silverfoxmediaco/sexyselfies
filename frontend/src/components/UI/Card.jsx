import React from 'react';

const Card = ({ children, className = '', elevated = false, ...props }) => {
  const classes = ['card', elevated && 'card-elevated', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-content ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Card, CardContent };
export default Card;
