import React from 'react';

const variants = {
  success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/40',
  error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800/40',
  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800/40',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800/40',
};

const icons = { success: '✅', error: '⚠️', info: 'ℹ️', warning: '⚠️' };

const Alert = ({ type = 'info', title, children, onClose }) => {
  return (
    <div className={`w-full border rounded-xl px-3 py-2 flex items-start gap-2 animate-fade-in ${variants[type]}`}>
      <div className="text-lg leading-none mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && <div className="font-bold text-sm mb-0.5">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-sm">✕</button>
      )}
    </div>
  );
};

export default Alert;
