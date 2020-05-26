import React from 'react';

import NavigationItems from '../NavigationItems/NavigationItems';
import './MobileNavigation.css';

const mobileNavigation = ({open, mobile, onChooseItem, isAuth, onLogout}) => (
  <nav className={['mobile-nav', open ? 'open' : ''].join(' ')}>
    <ul
      className={['mobile-nav__items', mobile ? 'mobile' : ''].join(' ')}
    >
      <NavigationItems
        mobile
        onChoose={onChooseItem}
        isAuth={isAuth}
        onLogout={onLogout}
      />
    </ul>
  </nav>
);

export default mobileNavigation;
