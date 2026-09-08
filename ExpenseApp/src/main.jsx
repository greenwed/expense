import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CategoryProvider } from './context/CategoryContext';
import { BackHandlerProvider } from './context/BackHandlerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CategoryProvider>
          <BackHandlerProvider>
            <App />
          </BackHandlerProvider>
        </CategoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
