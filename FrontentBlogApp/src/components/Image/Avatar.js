import React from 'react';

import Image from './Image';
import './Avatar.css';

const avatar = ({size, image }) => (
  <div
    className="avatar"
    style={{ width: size + 'rem', height: size + 'rem' }}
  >
    <Image imageUrl={image} />
  </div>
);

export default avatar;
