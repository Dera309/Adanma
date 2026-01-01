import LoadingSpinner from './LoadingSpinner';
import './PageLoader.css';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading...',
  fullScreen = false,
  overlay = false
}) => {
  const containerClass = `page-loader ${fullScreen ? 'page-loader-fullscreen' : ''} ${overlay ? 'page-loader-overlay' : ''}`;

  return (
    <div className={containerClass}>
      <div className="page-loader-content">
        <LoadingSpinner size="large" />
        <p className="page-loader-message">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;