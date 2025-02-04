import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../firebase"; // Asegúrate de configurar tu archivo firebase.js
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import "./AddService.css";
import { FaPlus, FaTrash, FaArrowLeft, FaEdit } from "react-icons/fa";

const AddService = ({ isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState("");
  const [observations, setObservations] = useState("");
  const [price, setPrice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editServiceId, setEditServiceId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showDelete) {
      fetchServices();
    }
  }, [showDelete]);

  const fetchServices = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Servicios"));
    const servicesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setServices(servicesList);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteService = async (id) => {
    setIsSubmitting(true);
    await deleteDoc(doc(db, "Servicios", id));
    toast.success("Servicio eliminado con éxito!", {
      autoClose: 1000,
      onClose: () => {
        fetchServices();
        setConfirmDelete(null);
        onClose();
      }
    });
    setIsSubmitting(false);
  };

  const handleEdit = (service) => {
    setEditServiceId(service.id);
    setServiceName(service.serviceName);
    setDuration(service.duration);
    setObservations(service.observations);
    setPrice(service.price);
    setShowForm(true);
  };

  const formatPrice = (value) => {
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `$ ${formattedValue}`;
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, ""); // Elimina cualquier caracter no numérico
    const formattedValue = formatPrice(numericValue); // Aplica el formato con puntos
    setPrice(formattedValue); // Actualiza el estado con el valor formateado
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const numericPrice = price.replace(/[^0-9]/g, "");
      const serviceData = {
        serviceName,
        duration: duration,
        observations,
        price: numericPrice,
      };

      if (editServiceId) {
        await updateDoc(doc(db, "Servicios", editServiceId), serviceData);
        toast.success("Servicio actualizado correctamente", {
          autoClose: 1000,
          onClose: () => onClose()
        });
      } else {
        await addDoc(collection(db, "Servicios"), serviceData);
        toast.success("Servicio agregado correctamente", {
          autoClose: 1000,
          onClose: () => onClose()
        });
      }

      // Reiniciar formulario
      setServiceName("");
      setDuration("");
      setObservations("");
      setPrice("");
      setEditServiceId(null);
    } catch (error) {
      console.error("Error al agregar/actualizar el servicio: ", error);
      toast.error("Hubo un error al agregar/actualizar el servicio", { autoClose: 1000 });
    }
    setIsSubmitting(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("addservice-modal-overlay")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="addservice-modal-overlay" onClick={handleOverlayClick}>
      <div className="addservice-modal-container addservice-animated-modal">
        {!showForm && !showDelete ? (
          <div className="addservice-button-group addservice-centered">
            <button className="addservice-animated-btn" onClick={() => setShowForm(true)}>
              <FaPlus /> Agregar Servicio
            </button>
            <button className="addservice-animated-btn" onClick={() => setShowDelete(true)}>
              <FaTrash /> Borrar Servicio
            </button>
          </div>
        ) : showForm ? (
          <div className="addservice-form-container">
            <div className="addservice-header">
              <button className="addservice-back-btn" onClick={() => setShowForm(false)}>
                <FaArrowLeft />
              </button>
              <h2>{editServiceId ? "Editar Servicio" : "Agregar Servicio"}</h2>
            </div>
            <form className="addservice-form-content" onSubmit={handleSubmit}>
            <div className="addservice-input-group">
  <label htmlFor="serviceName">Nombre del servicio</label>
  <input
    type="text"
    id="serviceName"
    value={serviceName}
    onChange={(e) => {
      const inputValue = e.target.value;
      // Solo permite letras y espacios, y evita los números
      if (/^[a-zA-Z\s]*$/.test(inputValue)) {
        setServiceName(inputValue);
      }
    }}
    required
  />
</div>


              <div className="addservice-input-group">
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

              <div className="addservice-input-group">
                <label htmlFor="observations">Observaciones</label>
                <textarea
                  id="observations"
                  className="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows="3"
                  placeholder="Detalles adicionales (opcional)"
                ></textarea>
              </div>

              <div className="addservice-input-group">
                <label htmlFor="price">Precio</label>
                <input
                  type="text"
                  id="price"
                  value={price}
                  onChange={handlePriceChange}
                  required
                />
              </div>

              <div className="addservice-form-actions">
                <button type="button" onClick={onClose} className="addservice-cancel-btn">
                  Cancelar
                </button>
                <button type="submit" className="addservice-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Procesando..." : (editServiceId ? "Actualizar Servicio" : "Agregar Servicio")}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="addservice-header">
              <button className="addservice-back-btn" onClick={() => setShowDelete(false)}>
                <FaArrowLeft />
              </button>
              <h2>Servicios Disponibles</h2>
            </div>
            {loading ? (
              <div className="addservice-loader">Cargando...</div>
            ) : (
              <ul className="addservice-service-list">
                {services.map(service => (
                  <li key={service.id} className="addservice-service-item">
                    {service.serviceName} - {service.duration} min - ${service.price}
                    <div className="addservice-action-buttons">
                      <button className="addservice-edit-btn" onClick={() => handleEdit(service)} disabled={isSubmitting}>
                        <FaEdit />
                      </button>
                      <button className="addservice-delete-btn" onClick={() => handleDelete(service.id)} disabled={isSubmitting}>
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {confirmDelete && (
        <div className="addservice-modal-overlay">
          <div className="addservice-confirm-modal addservice-animated-modal">
            <h3>¿Estás seguro de que deseas eliminar este servicio?</h3>
            <div className="addservice-confirm-actions">
              <button className="addservice-confirm-btn" onClick={() => confirmDeleteService(confirmDelete)} disabled={isSubmitting}>Sí</button>
              <button className="addservice-confirm-btn" onClick={() => setConfirmDelete(null)} disabled={isSubmitting}>No</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={1000} />
    </div>
  );

};

export default AddService;
