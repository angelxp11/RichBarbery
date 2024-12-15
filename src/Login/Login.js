import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth } from '../firebase'; // Ajusta la ruta según la ubicación de tu archivo firebase.js
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './Login.css';
import HomeAdmin from '../Home/homeAdmin'; // Importa el componente HomeAdmin
import HomeUser from '../HomeUser/homeUser'; // Importa el componente HomeUser
import Register from '../Register/Register'; // Importa el componente HomeUser
import LoadingScreen from '../Resources/LoadingScreen/LoadingScreen.js'; // Importa el componente LoadingScreen

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Controla si el usuario está logueado
  const [isRegisterIn, setIsRegisterIn] = useState(false); // Controla si el usuario está en el formulario de registro
  const [isAdmin, setIsAdmin] = useState(false); // Controla si el usuario es admin
  const [adminName, setAdminName] = useState(''); // Guarda el nombre del administrador
  const [loading, setLoading] = useState(false); // Controla la pantalla de carga

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Muestra la pantalla de carga

    try {
      // Establece la persistencia de la sesión a 'local' para mantener la sesión por 15 días
      await setPersistence(auth, browserLocalPersistence);

      // Inicia sesión con email y contraseña
      await signInWithEmailAndPassword(auth, email, password);

      // Obtén la instancia de Firestore
      const db = getFirestore();

      // Verifica si el usuario es un administrador en la colección "administradores"
      const adminDocRef = doc(db, 'administradores', email);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        setIsAdmin(true);
        const data = adminDocSnap.data();
        setAdminName(data.name || ''); // Guarda el nombre del administrador
      } else {
        setIsAdmin(false);
      }

      // Una vez obtenidos los datos del usuario, muestra el contenido
      setTimeout(() => {
        setIsLoggedIn(true);
        setLoading(false); // Oculta la pantalla de carga
      }, 2000); // Mantiene la pantalla de carga durante 2 segundos adicionales después de obtener el nombre
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      toast.error('No se pudo iniciar sesión');
      setLoading(false);
    }
  };

  // Maneja el clic en "Regístrate"
  const handleRegisterClick = () => {
    setIsRegisterIn(true); // Cambia el estado para mostrar el componente de registro
  };

  // Renderiza el componente correspondiente si el usuario está logueado y autenticado
  if (isLoggedIn) {
    // Si el nombre del administrador es "Juan", solo mostrar "Citas"
    if (isAdmin && adminName === 'Juan') {
      return <HomeAdmin />;
    } else {
      return isAdmin ? <HomeAdmin /> : <HomeUser />;
    }
  }

  // Renderiza el formulario de Login o el formulario de registro
  if (isRegisterIn) {
    return <Register />; // Si está en el formulario de registro, renderiza el componente Register
  }

  // Muestra la pantalla de carga mientras el estado de "loading" es verdadero
  return (
    <div className="login-container-login">
      {loading && <LoadingScreen />} {/* Muestra la pantalla de carga cuando loading es true */}

      <form className="login-form-login" onSubmit={handleSubmit}>
        <h2 className="login-title-login">Iniciar sesión</h2>
        
        <div className="input-group-login">
          <label htmlFor="email" className="input-label-login">Correo electrónico</label>
          <input
            type="email"
            id="email"
            placeholder="Ingrese su correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input-login"
            required
          />
        </div>
        
        <div className="input-group-login">
          <label htmlFor="password" className="input-label-login">Contraseña</label>
          <div className="password-container-login">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input-password-toggle"
              required
            />
            <span
              className="password-toggle-icon-login"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>
        </div>
        
        <button type="submit" className="login-button-login">Iniciar sesión</button>
        
        <p className="register-link-login">
  ¿No tienes una cuenta? <button className="login-submitbutton" onClick={handleRegisterClick}>Regístrate</button>
</p>


      </form>

      {/* Contenedor de Toast */} 
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
