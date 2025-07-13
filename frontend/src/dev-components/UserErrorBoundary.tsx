import React from 'react';

const UserErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default UserErrorBoundary;