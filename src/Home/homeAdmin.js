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
import Diary from "./Diary/Diary.js"; // Import Diary component
import CashBox from "./CashBox/CashBox"; // Import CashBox component
import Dashboard from "./Dashboard/Dashboard"; // Import Dashboard component
import { FaUserTie, FaPlus, FaCalendarAlt, FaCashRegister, FaSignOutAlt, FaBookOpen } from 'react-icons/fa'; // Import new icon

function HomeAdmin() {
  const [isAddBarberModalOpen, setIsAddBarberModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isViewDateModalOpen, setIsViewDateModalOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [user] = useAuthState(auth);
  const [showServicios, setShowServicios] = useState(false);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false); // New state for Diary modal
  const [isCashBoxModalOpen, setIsCashBoxModalOpen] = useState(false); // New state for CashBox modal

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
            setIsAdmin(true); // Actualiza el estado de administrador
          } else {
            console.log("Documento de administrador no encontrado.");
            setAdminName(""); // Para garantizar que adminName se establezca
          }
        }
      } catch (error) {
        console.error("Error al obtener los detalles del administrador:", error.message);
        toast.error("Error al cargar los detalles del administrador.");
      } finally {
        setLoadingServices(false); // Siempre finaliza la carga
      }
    };

    fetchAdminDetails();
  }, [user]);

  const handleSignOut = async () => {
    try {
      setLoadingServices(true);
      await signOut(auth);
      toast.success('Usuario desconectado');
      setTimeout(() => {
        setShowServicios(true);
        setLoadingServices(false);
      }, 100);
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

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <ul>
          <li onClick={() => setIsAddBarberModalOpen(true)} title="Ver Barberos">
            <FaUserTie size={24} />
          </li>
          <li onClick={() => setIsAddServiceModalOpen(true)} title="Ver Servicios">
            <FaPlus size={24} />
          </li>
          <li onClick={() => setIsViewDateModalOpen(true)} title="Ver Citas">
            <FaCalendarAlt size={24} />
          </li>
          <li onClick={() => setIsDiaryModalOpen(true)} title="Diario">
            <FaBookOpen size={24} />
            <span className="new-ribbon-icon">NEW</span>
          </li>
          <li onClick={() => setIsCashBoxModalOpen(true)} title="Caja">
            <FaCashRegister size={24} />
            <span className="new-ribbon-icon">NEW</span>
          </li>
          <li onClick={handleSignOut} title="Cerrar Sesión">
            <FaSignOutAlt size={24} />
          </li>
        </ul>
      </div>
      <div className="main-content">
        <Dashboard adminName={adminName} adminPhoto={adminPhoto} /> {/* Pass props to Dashboard */}
      </div>

      {isAddBarberModalOpen && <AddBarber isOpen={isAddBarberModalOpen} onClose={() => setIsAddBarberModalOpen(false)} />}
      {isAddServiceModalOpen && <AddService isOpen={isAddServiceModalOpen} onClose={() => setIsAddServiceModalOpen(false)} />}
      {isViewDateModalOpen && <ViewDate isOpen={isViewDateModalOpen} onClose={() => setIsViewDateModalOpen(false)} />}
      {isDiaryModalOpen && <Diary isOpen={isDiaryModalOpen} onClose={() => setIsDiaryModalOpen(false)} />}
      {isCashBoxModalOpen && <CashBox adminName={adminName} isOpen={isCashBoxModalOpen} onClose={() => setIsCashBoxModalOpen(false)} />}
    </div>
  );
}

export default HomeAdmin;
