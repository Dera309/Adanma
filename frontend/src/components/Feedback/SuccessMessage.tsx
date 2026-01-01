import './SuccessMessage.css';

interface SuccessMessageProps {
  title: string;
  message?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  icon = '✓',
  action,
  className = ''
}) => {
  return (
    <div className={`success-message ${className}`}>
      <div className="success-icon">
        {icon}
      </div>
      <div className="success-content">
        <h3 className="success-title">{title}</h3>
        {message && (
          <p className="success-text">{message}</p>
        )}
        {action && (
          <button 
            className="success-action"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;