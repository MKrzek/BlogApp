import React from 'react';
import { NavLink } from 'react-router-dom';

import './NavigationItems.css';

const navItems = [
  { id: 'feed', text: 'Feed', link: '/', auth: true },
  { id: 'login', text: 'Login', link: '/', auth: false },
  { id: 'signup', text: 'Signup', link: '/signup', auth: false }
];

const navigationItems = ({isAuth, mobile,onChoose,onLogout }) => [
  ...navItems.filter(item => item.auth === isAuth).map(item => (
    <li
      key={item.id}
      className={['navigation-item', mobile ? 'mobile' : ''].join(' ')}
    >
      <NavLink to={item.link} exact onClick={onChoose}>
        {item.text}
      </NavLink>
    </li>
  )),
  isAuth && (
    <li className="navigation-item" key="logout">
      <button onClick={onLogout}>Logout</button>
    </li>
  )
];

export default navigationItems;
