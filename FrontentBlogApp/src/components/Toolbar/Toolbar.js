import React from 'react';

import './Toolbar.css';

const toolbar = ({ children }) => (
    <div className="toolbar">
       {children}
    </div>
);

export default toolbar;