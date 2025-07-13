import React from 'react';

const InternalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default InternalErrorBoundary;