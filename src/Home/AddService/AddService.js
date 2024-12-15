import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../firebase"; // Asegúrate de configurar tu archivo firebase.js
import { collection, addDoc } from "firebase/firestore";
import "./AddService.css";

const AddService = ({ isOpen, onClose }) => {
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState("");
  const [observations, setObservations] = useState("");
  const [price, setPrice] = useState("");

  const formatPrice = (value) => {
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `$ ${formattedValue}`;
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, "");
    const formattedValue = formatPrice(numericValue);
    setPrice(formattedValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const numericPrice = price.replace(/[^0-9]/g, "");
      const serviceData = {
        serviceName,
        duration: duration,
        observations,
        price: numericPrice,
      };

      // Agregar el documento a Firestore
      await addDoc(collection(db, "Servicios"), serviceData);

      // Mostrar toast de confirmación
      toast.success("Servicio agregado correctamente");

      // Reiniciar formulario
      setServiceName("");
      setDuration("");
      setObservations("");
      setPrice("");

      // Cerrar el modal
      onClose();
    } catch (error) {
      console.error("Error al agregar el servicio: ", error);
      toast.error("Hubo un error al agregar el servicio");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <h2>Agregar Servicio</h2>
        <form className="form-content" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="serviceName">Nombre del servicio</label>
            <input
              type="text"
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="duration">Duración (en minutos)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="observations">Observaciones</label>
            <textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows="3"
              placeholder="Detalles adicionales (opcional)"
            ></textarea>
          </div>

          <div className="input-group">
            <label htmlFor="price">Precio</label>
            <input
              type="text"
              id="price"
              value={price}
              onChange={handlePriceChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="submit-btn">
              Agregar Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddService;
