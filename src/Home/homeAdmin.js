import React, { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase"; 
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./homeAdmin.css";
import AddBarber from "./AddBarber/AddBarber";
import AddService from "./AddService/AddService";
import ViewDate from "./ViewDate/ViewDate";
import LoadingScreen from "../Resources/LoadingScreen/LoadingScreen.js"; 
import { signOut } from 'firebase/auth';
import Servicio from "../Servicios/Servicios.js"; 

function HomeAdmin() {
  const [isAddBarberModalOpen, setIsAddBarberModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isViewDateModalOpen, setIsViewDateModalOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);  // Inicialmente en true
  const [user] = useAuthState(auth);
  const [showServicios, setShowServicios] = useState(false);

  useEffect(() => {
    const fetchAdminDetails = async () => {
      if (!user) return;

      try {
        const db = getFirestore();
        const user = auth.currentUser;

        if (user) {
          const adminDocRef = doc(db, "administradores", user.email);
          const adminDocSnap = await getDoc(adminDocRef);

          if (adminDocSnap.exists()) {
            const data = adminDocSnap.data();
            setAdminName(data.name || "Usuario");
            setAdminPhoto(data.photo || "");
            setIsAdmin(adminDocSnap.exists());  // Asegura que el estado se actualiza
            setLoadingServices(false); // Termina la carga
          } else {
            console.log("Documento de administrador no encontrado.");
            setLoadingServices(false);  // Termina la carga aunque no se encuentre el documento
          }
        }
      } catch (error) {
        console.error("Error al obtener los detalles del administrador:", error.message);
        toast.error("Error al cargar los detalles del administrador.");
        setLoadingServices(false);  // Termina la carga en caso de error
      }
    };

    fetchAdminDetails();
  }, [user]);

  const handleAddBarberClick = () => setIsAddBarberModalOpen(true);
  const handleAddServiceClick = () => setIsAddServiceModalOpen(true);
  const handleViewDateClick = () => setIsViewDateModalOpen(true);
  const handleCloseBarberModal = () => setIsAddBarberModalOpen(false);
  const handleCloseServiceModal = () => setIsAddServiceModalOpen(false);
  const handleCloseViewDateModal = () => setIsViewDateModalOpen(false);

  const handleGoHome = async () => {
    if (!user) {
      toast.error("No hay usuario autenticado.");
      return;
    }

    setLoadingServices(true);

    try {
      const email = user.email;
      const db = getFirestore();
      const adminDocRef = doc(db, "administradores", email);
      const adminDocSnap = await getDoc(adminDocRef);

      setIsAdmin(adminDocSnap.exists());
      setTimeout(() => {
        setIsLoggedIn(true);
        setLoadingServices(false);
      }, 1000);
    } catch (error) {
      console.error("Error al verificar administrador:", error.message);
      toast.error("Error al iniciar sesión.");
      setLoadingServices(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoadingServices(true);
      await signOut(auth);
      toast.success('Usuario desconectado');
      setTimeout(() => {
        setShowServicios(true);
        setLoadingServices(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
      setLoadingServices(false);
    }
  };

  if (loadingServices) {
    return <LoadingScreen />;
  }

  if (showServicios) {
    return <Servicio />;
  }

  const renderAdminCards = () => {
    if (adminName === "Juan") {
      return (
        <div className="admin-card-admin" onClick={handleViewDateClick}>
          <div className="plus-symbol-admin">+</div>
          <p className="card-title-admin">Citas</p>
        </div>
      );
    }

    return (
      <>
        <div className="admin-card-admin" onClick={handleAddBarberClick}>
          <div className="plus-symbol-admin">+</div>
          <p className="card-title-admin">Agregar Barbero</p>
        </div>
        <div className="admin-card-admin" onClick={handleAddServiceClick}>
          <div className="plus-symbol-admin">+</div>
          <p className="card-title-admin">Agregar Servicio</p>
        </div>
        <div className="admin-card-admin" onClick={handleViewDateClick}>
          <div className="plus-symbol-admin">+</div>
          <p className="card-title-admin">Citas</p>
        </div>
      </>
    );
  };

  return (
    <div className="background-admin">
      {user && (
        <button className="inicio-button" onClick={handleGoHome}>
          ☰ Inicio
        </button>
      )}
      {user && (
        <button className="logout-button" onClick={handleSignOut}>
          Cerrar Sesión
        </button>
      )}
      <h1 className="welcome-title-admin">Bienvenido a RichBarbery {adminName}</h1>
      {adminPhoto && (
        <div className="admin-photo-container">
          <img src={adminPhoto} alt="Admin" className="admin-photo" />
        </div>
      )}
      <div className="admin-container-admin">
        <div className="admin-content-admin">
          {renderAdminCards()}
        </div>
      </div>

      {isAddBarberModalOpen && <AddBarber isOpen={isAddBarberModalOpen} onClose={handleCloseBarberModal} />}
      {isAddServiceModalOpen && <AddService isOpen={isAddServiceModalOpen} onClose={handleCloseServiceModal} />}
      {isViewDateModalOpen && <ViewDate isOpen={isViewDateModalOpen} onClose={handleCloseViewDateModal} />}
    </div>
  );
}

export default HomeAdmin;

