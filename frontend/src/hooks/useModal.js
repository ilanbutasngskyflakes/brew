import { useState } from 'react';

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false,
  });

  const showModal = (type, title, message, onConfirm = null, confirmText = "OK", showCancel = false) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel,
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: "info",
      title: "",
      message: "",
      onConfirm: null,
      confirmText: "OK",
      showCancel: false,
    });
  };

  return { modal, showModal, closeModal };
};