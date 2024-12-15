import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import "./ViewDate.css";

const ViewDate = ({ isOpen, onClose }) => {
  const [appointments, setAppointments] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");

  const db = getFirestore();

  const fetchAppointments = async () => {
    if (!isOpen) return;

    try {
      let q = collection(db, "Reservaciones");
      q = query(q, orderBy("date", sortOrder));

      const querySnapshot = await getDocs(q);
      const fetchedAppointments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrar las citas para excluir las canceladas
      const filteredAppointments = fetchedAppointments.filter(appointment => appointment.status !== "Cancelada");

      setAppointments(filteredAppointments);
    } catch (error) {
      console.error("Error fetching appointments: ", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isOpen, sortOrder]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isPastAppointment = (appointmentDate) => {
    const now = new Date();
    const appointmentDateObj = new Date(appointmentDate);
    return appointmentDateObj < now;
  };

  const handleStatusChange = async (appointmentId, newStatus, clientName) => {
    try {
      const appointmentRef = doc(db, "Reservaciones", appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });

      toast.success(`Cita de ${clientName} ${newStatus.toLowerCase()}`);

      // Actualizar la lista de citas después del cambio
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment status: ", error);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <h2>Ver Citas</h2>
        <button onClick={onClose} className="close-btn">Cerrar</button>

        <div className="controls">
          <label htmlFor="sortOrder">Ordenar por fecha:</label>
          <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Próximas a últimas</option>
            <option value="desc">Últimas a próximas</option>
          </select>
        </div>

        <div className="appointments-list">
          {appointments.length === 0 ? (
            <p>No hay citas programadas.</p>
          ) : (
            <ul>
  {appointments.map((appointment) => (
    <li
      key={appointment.id}
      className={`appointment-item 
        ${isPastAppointment(appointment.date) ? "past-appointment" : ""} 
        ${appointment.status === "Comenzada" ? "started-appointment" : ""}`}
    >
      <p><strong>Fecha:</strong> {formatDate(appointment.date)}</p>
      <p><strong>Hora:</strong> {appointment.time}</p>
      <p><strong>Cliente:</strong> {appointment.clientName}</p>
      <p><strong>Servicio:</strong> {appointment.serviceName}</p>
      <p><strong>Estado:</strong> {appointment.status}</p>

      <div className="appointment-actions">
        <button
          className="cancel-btn"
          onClick={() => handleStatusChange(appointment.id, "Cancelada", appointment.clientName)}
        >
          Cancelado
        </button>
        <button
          className="complete-btn"
          onClick={() => handleStatusChange(appointment.id, "Completada", appointment.clientName)}
        >
          Completado
        </button>
        <button
          className="start-btn"
          onClick={() => handleStatusChange(appointment.id, "Comenzada", appointment.clientName)}
        >
          Comenzado
        </button>
      </div>
    </li>
  ))}
</ul>

          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ViewDate;
