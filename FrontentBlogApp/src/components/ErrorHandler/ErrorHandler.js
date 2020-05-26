import React from 'react';

import Backdrop from '../Backdrop/Backdrop';
import Modal from '../Modal/Modal';

const errorHandler = ({onHandle, error}) => (
  <>
    {error && <Backdrop onClick={onHandle} />}
    {error && (
      <Modal
        title="An Error Occurred"
        onCancelModal={onHandle}
        onAcceptModal={onHandle}
        acceptEnabled
      >
        <p>{error.message}</p>
      </Modal>
    )}
  </>
);

export default errorHandler;
