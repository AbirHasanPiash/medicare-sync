import { AlertTriangle, AlertCircle, X, Loader2 } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Dynamic styling based on the action type
  const config = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-red-100',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'text-white',
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-100',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
      buttonText: 'text-white',
    },
  };

  const currentConfig = config[type] || config.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      {/* Modal Container with entrance animation */}
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200">
        
        {/* Header (Hidden close button for accessibility, though we have a cancel button below) */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 transition-colors rounded-full hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col items-center text-center">
            
            {/* Dynamic Icon */}
            <div className={`flex items-center justify-center w-16 h-16 mb-6 rounded-full ${currentConfig.iconBg}`}>
              {currentConfig.icon}
            </div>
            
            <h3 className="mb-2 text-2xl font-extrabold text-slate-900">
              {title}
            </h3>
            
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              {message}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col-reverse w-full gap-3 sm:flex-row">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full px-6 py-3.5 text-sm font-bold text-slate-700 transition-colors bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                {cancelText}
              </button>
              
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`w-full px-6 py-3.5 text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-md rounded-xl disabled:opacity-70 disabled:hover:-translate-y-0 hover:-translate-y-0.5 ${currentConfig.buttonBg} ${currentConfig.buttonText}`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Processing...' : confirmText}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;