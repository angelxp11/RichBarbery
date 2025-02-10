import React, { useState } from 'react'; 
import './Register.css'; 
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import LoadingScreen from '../Resources/LoadingScreen/LoadingScreen.js'; 
import HomeUser from '../HomeUser/homeUser'; 
import Login from '../Login/Login'; // Importa el componente HomeUser
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa los iconos de ojo

function Register() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State for loading
  const [isRegistered, setIsRegistered] = useState(false); // State for registration completion
  const [redirect, setRedirect] = useState(false); // State for redirection
  const [isLoginIn, setIsLoginIn] = useState(false); // State to show login form

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

  const handleTelefonoChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("3") && !value.startsWith("+57 ")) {
      value = "+57 " + value;
    }
    if (value.length > 14) {
      value = value.substring(0, 14);
    }
    setTelefono(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length <= 6) {
      toast.error('La contraseña debe tener más de 6 caracteres');
      return;
    }
    if (telefono.length !== 14) {
      toast.error('El teléfono debe tener 13 caracteres en el formato +57 3152849268');
      return;
    }

    const auth = getAuth();
    setIsLoading(true); // Muestra la pantalla de carga

    try {
      // Verificar si el correo ya está registrado
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        toast.error('Este correo electrónico ya está registrado');
        setIsLoading(false);
        return;
      }

      // Crear usuario en Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);

      // Crear un documento en Firestore con los detalles del usuario
      const docRef = doc(db, "Clientes", email);
      await setDoc(docRef, {
        name: nombre,
        surname: apellido,
        phone: telefono
      });

      toast.success('¡Te has registrado correctamente!');
      setTimeout(() => {
        setRedirect(true); // Cambiar el estado de redirección
        setIsLoading(false); // Ocultar la pantalla de carga
      }, 2000); // Mantén la pantalla de carga durante 2 segundos adicionales antes de redirigir

    } catch (error) {
      console.error(error);
      toast.error('Error al registrarse, intenta nuevamente');
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    setIsLoginIn(true); // Cambia el estado para mostrar el componente de inicio de sesión
  };

  // Render the LoadingScreen if isLoading is true, otherwise show HomeUser after registration
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (redirect) {
    return <HomeUser />; // Redirect to HomeUser after registration
  }

  if (isLoginIn) {
    return <Login />; // Render the Login component if isLoginIn is true
  }

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2 className="register-title">Registrarse</h2>

        <div className="register-input-group">
          <label className="register-label">Nombre</label>
          <input
            type="text"
            className="register-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ingrese su nombre"
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Apellido</label>
          <input
            type="text"
            className="register-input"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
            placeholder="Ingrese su apellido"
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Teléfono</label>
          <input
            type="tel"
            className="register-input"
            value={telefono}
            onChange={handleTelefonoChange}
            required
            placeholder="+57 3152849268"
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Correo electrónico</label>
          <input
            type="email"
            className="register-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Ingrese su correo electrónico"
          />
        </div>

        <div className="input-group-login">
          <label htmlFor="password" className="input-label-login">Contraseña</label>
          <div className="password-container-login">
            <input
              type={passwordVisible ? 'text' : 'password'}
              id="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
              required
            />
            <span
              className="password-toggle-icon-login"
              onClick={togglePasswordVisibility}
              style={{ position: 'absolute', right: '10px', cursor: 'pointer' }} // Adjust position
            >
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <div className="input-group-login">
          <label htmlFor="confirmPassword" className="input-label-login">Confirmar Contraseña</label>
          <div className="password-container-login">
            <input
              type={confirmPasswordVisible ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="register-input"
              required
            />
            <span
              className="password-toggle-icon-login"
              onClick={toggleConfirmPasswordVisibility}
              style={{ position: 'absolute', right: '10px', cursor: 'pointer' }} // Adjust position
            >
              {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <button type="submit" className="register-submit-button">Registrarse</button>
        <p className="register-link-login">
          ¿tienes una cuenta? <button className="login-submitbutton" onClick={handleLoginClick}>Ingresar</button>
        </p>
      </form>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default Register;
