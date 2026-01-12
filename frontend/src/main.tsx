import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/critical.css';
import './index.css';

// Hide loading screen when React app starts
const loadingElement = document.querySelector('.app-loading');
if (loadingElement) {
  loadingElement.style.display = 'none';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
