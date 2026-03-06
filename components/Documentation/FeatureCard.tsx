
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  pro?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, pro }) => (
  <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-pink-500/10 text-pink-500 rounded-lg p-3">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
      {pro && <span className="text-xs font-bold bg-pink-500 text-white px-2 py-1 rounded-full">PRO</span>}
    </div>
    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">{description}</p>
  </div>
);
