import React from 'react';
import { cn } from '../../../lib/utils';

interface SetupCardProps {
  children: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export const SetupCard: React.FC<SetupCardProps> = ({
  children,
  title,
  description,
  className
}) => {
  return (
    <div
      className={cn(
        "w-full max-w-4xl bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-blue-100/50 overflow-hidden",
        className
      )}
    >
      <div className="bg-primary p-8 md:p-12 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{title}</h2>
        <p className="text-primary-foreground/80 text-lg font-bold opacity-60">{description}</p>
      </div>
      <div className="p-8 md:p-12">
        {children}
      </div>
    </div>
  );
};
