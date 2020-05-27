import React from 'react';
import ReactDOM from 'react-dom';

import './Backdrop.css';

const backdrop = ({open, onClick}) =>
  ReactDOM.createPortal(
    <div
      className={['backdrop', open ? 'open' : ''].join(' ')}
      onClick={onClick}
    />,
    document.getElementById('backdrop-root')
  );

export default backdrop;
