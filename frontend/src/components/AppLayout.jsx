import React from 'react';

// DISABLED FOR TESTING - This is a minimal passthrough component
const AppLayout = ({ children }) => {
  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      {children}
    </div>
  );
};

export default AppLayout;