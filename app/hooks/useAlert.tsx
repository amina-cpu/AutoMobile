import { useState } from 'react';

export function useAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
  });

  const showAlert = (type, title, message, duration = 4000) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      duration,
    });
  };

  const showSuccess = (title, message, duration = 4000) => {
    showAlert('success', title, message, duration);
  };

  const showError = (title, message, duration = 4000) => {
    showAlert('error', title, message, duration);
  };

  const showWarning = (title, message, duration = 4000) => {
    showAlert('warning', title, message, duration);
  };

  const showInfo = (title, message, duration = 4000) => {
    showAlert('info', title, message, duration);
  };

  const dismiss = () => {
    setAlertConfig(prev => ({
      ...prev,
      visible: false,
    }));
  };

  return {
    alertConfig,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismiss,
  };
}