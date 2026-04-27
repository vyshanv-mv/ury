import React from 'react';

interface SetupLayoutProps {
  children: React.ReactNode;
}

export const SetupLayout: React.FC<SetupLayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Content */}
      <main className="flex-1 p-6 md:p-12 flex flex-col items-center">
        <div className="my-auto w-full flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
};
