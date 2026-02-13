
import React from 'react';

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="section-header">
        <h3>{title}</h3>
    </div>
);
