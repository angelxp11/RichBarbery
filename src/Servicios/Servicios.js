import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Reservation from '../Reservation/Reservation.js';
import Login from '../Login/Login.js';
import LoadingScreen from '../Resources/LoadingScreen/LoadingScreen.js'; // Importa tu componente de pantalla de carga
import './Servicios.css';
import HomeAdmin from '../Home/homeAdmin.js'; // Importa el componente HomeAdmin
import HomeUser from '../HomeUser/homeUser.js'; // Importa el componente HomeUser
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 
import { toast } from 'react-toastify'; 

const Servicios = () => {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true); // Estado para la carga de servicios
  const [user, loadingAuth] = useAuthState(auth);
  const [showReservation, setShowReservation] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [verificacionMessage, setVerificacionMessage] = useState('');
  const [showServicios, setShowServicios] = useState(true);
  const [showLoadingLogin, setShowLoadingLogin] = useState(false); // Estado para mostrar la pantalla de carga al verificar login
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, 'Servicios');
        const serviceSnapshot = await getDocs(servicesCollection);
        const servicesList = serviceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setServices(servicesList);
        setLoadingServices(false);
      } catch (error) {
        console.error('Error al obtener los servicios:', error);
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const handleReserveClick = (service) => {
    verificacion(service);
  };

  const verificacion = (service) => {
    if (user) {
      setVerificacionMessage('Usuario autenticado');
      setSelectedService(service);
      setShowReservation(true);
      setShowServicios(false);
      console.log('hola');
    } else {
      setVerificacionMessage('Usuario no autenticado');
      setShowReservation(false);
      setShowServicios(false);
      console.log('adios');

      // Muestra la pantalla de carga al verificar el login
      setShowLoadingLogin(true);
      setTimeout(() => {
        setShowLoadingLogin(false);
      }, 1000);
    }
  };

  const handleCloseReservation = () => {
    setShowReservation(false);
    setSelectedService(null);
    setVerificacionMessage('');
    setShowServicios(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Usuario desconectado'); // Muestra el toast de éxito
      setShowServicios(true);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión'); // Muestra el toast de error
    }
  };

  const handleGoHome = async () => {
    const auth = getAuth();
    const user = auth.currentUser; // Obtén el usuario autenticado
  
    if (!user) {
      toast.error("No hay usuario autenticado, no se puede proceder."); // Muestra un toast de error
      return; // Si no hay usuario autenticado, simplemente retorna y no hace nada
    }
  
    setLoadingServices(true); // Muestra la pantalla de carga
  
    try {
      const email = user.email; // Usa el correo del usuario autenticado
  
      // Obtén la instancia de Firestore
      const db = getFirestore();
  
      // Verifica si el usuario es un administrador en la colección "administradores"
      const adminDocRef = doc(db, 'administradores', email);
      const adminDocSnap = await getDoc(adminDocRef);
  
      if (adminDocSnap.exists()) {
        setIsAdmin(true); // Si el documento de administrador existe, marca al usuario como administrador
      } else {
        setIsAdmin(false); // Si no es administrador, marca como usuario normal
      }
  
      // Muestra la pantalla de carga por 5 segundos antes de redirigir
      setTimeout(() => {
        setIsLoggedIn(true); // Marca al usuario como logueado
        setLoadingServices(false); // Oculta la pantalla de carga
      }, 5000); // Mantiene la pantalla de carga durante 5 segundos
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      toast.error('No se pudo iniciar sesión'); // Muestra un toast de error
      setLoadingServices(false); // Oculta la pantalla de carga en caso de error
    }
  };
  
  
  
  // Renderiza el componente correspondiente si el usuario está logueado y autenticado
  if (isLoggedIn) {
    return isAdmin ? <HomeAdmin /> : <HomeUser />;
  }
  return (
    <div className="background">
      {loadingServices ? (
        <LoadingScreen /> // Muestra la pantalla de carga mientras se cargan los servicios
      ) : (
        <>
          {showLoadingLogin ? (
            <LoadingScreen /> // Muestra la pantalla de carga al verificar login
          ) : (
            <>
              {showServicios ? (
                <>
                  <h1 className="welcome-title">Bienvenido a RichBarbery</h1>
                  <h1 className="welcome-Subtitle">Servicios</h1>
  
                  {/* Mostrar botón de inicio solo si el usuario está autenticado */}
                  {user && (
                    <button className="inicio-button" onClick={handleGoHome}>
                      ☰ Inicio
                    </button>
                  )}
  
                  {/* Mostrar el botón de cerrar sesión solo si el usuario está autenticado */}
                  {user && (
                    <button className="logout-button" onClick={handleSignOut}>
                      Cerrar Sesión
                    </button>
                  )}
  
                  <div className="services-container">
                    {services.length === 0 ? (
                      <div className="no-services">No hay servicios disponibles.</div>
                    ) : (
                      services.map((service) => (
                        <div className="service-card" key={service.id}>
                          <h3 className="service-name">{service.serviceName}</h3>
                          {service.observations && (
                            <p className="service-observations">{service.observations}</p>
                          )}
                          <p className="service-duration">{service.duration} minutos</p>
                          <p className="service-price">
                            Precio: $ {parseInt(service.price, 10).toLocaleString()}
                          </p>
                          {/* Botón de reserva */}
                          <button
                            className="reserve-button"
                            onClick={() => {
                              if (user) {
                                handleReserveClick(service); // Si el usuario está autenticado, proceder con la reserva
                              } else {
                                handleReserveClick(service); // Mostrar mensaje si no está autenticado
                              }
                            }}
                          >
                            {user ? 'Reservar' : 'Iniciar sesión para reservar'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {verificacionMessage && (
                    <div className="verification-message">{verificacionMessage}</div>
                  )}
                </>
              ) : user && selectedService ? (
                <Reservation service={selectedService} onClose={handleCloseReservation} />
              ) : (
                <div className="login-container">
                  <Login /> {/* Muestra el componente de Login si el usuario no está autenticado */}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
  
  
  
  
};

export default Servicios;
