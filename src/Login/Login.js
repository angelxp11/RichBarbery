import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth } from '../firebase'; // Ajusta la ruta según la ubicación de tu archivo firebase.js
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './Login.css';
import HomeAdmin from '../Home/homeAdmin';
import HomeUser from '../HomeUser/homeUser';
import Register from '../Register/Register';
import LoadingScreen from '../Resources/LoadingScreen/LoadingScreen.js';
import GoogleLogo from '../Resources/google-logo.svg';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterIn, setIsRegisterIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);

  const provider = new GoogleAuthProvider(); // Proveedor de Google

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verifica si el usuario es un administrador
      const db = getFirestore();
      const adminDocRef = doc(db, 'administradores', user.email);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        setIsAdmin(true);
        const data = adminDocSnap.data();
        setAdminName(data.name || '');
      } else {
        setIsAdmin(false);
      }

      // Actualiza el estado para redirigir al usuario
      setIsLoggedIn(true);
      toast.success('Inicio de sesión con Google exitoso');
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error.message);
      toast.error('No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);

      const db = getFirestore();
      const adminDocRef = doc(db, 'administradores', email);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        setIsAdmin(true);
        const data = adminDocSnap.data();
        setAdminName(data.name || '');
      } else {
        setIsAdmin(false);
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      toast.error('No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    setIsRegisterIn(true);
  };

  if (isLoggedIn) {
    if (isAdmin && adminName === 'Miguel') {
      return <HomeAdmin />;
    } else {
      return isAdmin ? <HomeAdmin /> : <HomeUser />;
    }
  }

  if (isRegisterIn) {
    return <Register />;
  }

  return (
    <div className="login-container-login">
      {loading && <LoadingScreen />}

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

      <ToastContainer position="top-right" autoClose={1000} />
    </div>
  );
};

export default Login;