import React from 'react';
import './LoadingScreen.css';
import logo from '../logo.png'; // Asegúrate de que la ruta sea correcta

function LoadingScreen() {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <img src={logo} alt="Logo de carga" className="loading-logo" />
        <div className="loading-text">Cargando...</div>
      </div>
    </div>
  );
}

export default LoadingScreen;
