import React from 'react';

const Typography = ({ 
  children, 
  variant = 'body1',
  component,
  className = '',
  color = 'inherit',
  align = 'inherit',
  gutterBottom = false,
  ...props 
}) => {
  const Component = component || {
    h1: 'h1',
    h2: 'h2', 
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'h6',
    subtitle2: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    button: 'span',
    overline: 'span'
  }[variant] || 'span';

  const classes = [
    'typography',
    `typography-${variant}`,
    color !== 'inherit' && `text-${color}`,
    align !== 'inherit' && `text-${align}`,
    gutterBottom && 'typography-gutterBottom',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export default Typography;