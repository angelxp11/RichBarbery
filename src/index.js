import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Apps from './Servicios/Servicios'; 
import Login from './Login/Login'; 
import reportWebVitals from './reportWebVitals';

function App() {
  return (
    <div>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Apps />} />
        </Routes>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();


//import Apps from './Home/homeAdmin';
//import Apps from './HomeUser/homeUser';
//import Apps from "./Login/Login";