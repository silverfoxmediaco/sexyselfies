import React, { useState } from 'react';

const Accordion = ({
  children,
  defaultExpanded = false,
  className = '',
  ...props
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`accordion ${className}`} {...props}>
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          expanded,
          onToggle: () => setExpanded(!expanded),
        })
      )}
    </div>
  );
};

const AccordionSummary = ({
  children,
  expandIcon,
  onToggle,
  expanded,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`accordion-summary ${expanded ? 'expanded' : ''} ${className}`}
      onClick={onToggle}
      {...props}
    >
      <div className='accordion-summary-content'>{children}</div>
      {expandIcon && (
        <div className={`accordion-expand-icon ${expanded ? 'expanded' : ''}`}>
          {expandIcon}
        </div>
      )}
    </div>
  );
};

const AccordionDetails = ({ children, expanded, className = '', ...props }) => {
  return (
    <div
      className={`accordion-details ${expanded ? 'expanded' : ''} ${className}`}
      {...props}
    >
      <div className='accordion-details-content'>{children}</div>
    </div>
  );
};

export { Accordion, AccordionSummary, AccordionDetails };
export default Accordion;
