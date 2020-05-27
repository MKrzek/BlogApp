import React from 'react';
import { Link } from 'react-router-dom';

import './Button.css';

const button = ({link, loading, onClick, disabled, children, type, mode, design}) =>
  !link ? (
    <button
      className={[
        'button',
        `button--${design}`,
        `button--${mode}`
      ].join(' ')}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? 'Loading...' : children}
    </button>
  ) : (
    <Link
      className={[
        'button',
        `button--${design}`,
        `button--${mode}`
      ].join(' ')}
      to={link}
    >
      {children}
    </Link>
  );

export default button;
