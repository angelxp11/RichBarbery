import React, { useEffect, useState } from 'react';
import './Navbar.css'; // Asegúrate de tener este archivo CSS para estilizar el navbar
import { signOut } from 'firebase/auth'; // Importa la función de cerrar sesión de Firebase
import { auth } from '../../firebase'; // Asegúrate de que auth esté configurado correctamente
import homeUser from '../../HomeUser/homeUser'; 
import homeAdmin from '../../Home/homeAdmin'; // Importa la función de cerrar sesión de Firebase
import homeAnonimus from '../../Servicios/Servicios'; // Importa la función de cerrar sesión de Firebase



function Navbar() {
  const [user, setUser] = useState(null); // Estado para almacenar el usuario autenticado

  // Se ejecuta cuando el componente se monta para verificar el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Si hay un usuario, se guarda en el estado
    });

    return () => unsubscribe(); // Limpiar el suscriptor cuando el componente se desmonta
  }, []);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth); // Cierra la sesión del usuario
      console.log('Usuario desconectado');
      // Aquí puedes agregar lógica para redirigir al usuario a otra página si es necesario
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-menu">
        <button className="menu-button">☰ Inicio</button>
      </div>
      <div className="navbar-buttons">
        {user && (  // Verifica si hay un usuario autenticado
          <button className="logout-button" onClick={handleSignOut}>
            Cerrar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
