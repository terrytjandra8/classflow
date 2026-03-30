
import React from 'react';

import { parseMath } from '../../../../utils/mappers';

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="section-header">
        <h3 dangerouslySetInnerHTML={{ __html: parseMath(title) }} />
    </div>
);
