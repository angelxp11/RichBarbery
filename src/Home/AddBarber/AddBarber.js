import React, { useState, useEffect } from "react";
import "./AddBarber.css"; // Asegúrate de tener estos estilos configurados
import { db } from "../../firebase"; // Importa la instancia de Firestore
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"; // Importa funciones de Firestore
import { toast, ToastContainer } from "react-toastify"; // Importa toast y ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Importa los estilos de toast
import { FaPlus, FaTrash, FaArrowLeft, FaEdit } from "react-icons/fa"; // Importa iconos

const AddBarber = ({ isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [skills, setSkills] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editBarberId, setEditBarberId] = useState(null); // Add state for editBarberId

  useEffect(() => {
    if (showDelete) {
      fetchBarbers();
    }
  }, [showDelete]);

  const fetchBarbers = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Barberos"));
    const barbersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBarbers(barbersList);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteBarber = async (id) => {
    setIsSubmitting(true);
    await deleteDoc(doc(db, "Barberos", id));
    toast.success("Barbero eliminado con éxito!", {
      onClose: () => {
        fetchBarbers();
        setConfirmDelete(null);
        onClose();
      }
    });
    setIsSubmitting(false);
  };

  const handleEdit = (barber) => {
    setEditBarberId(barber.id);
    setPhotoUrl(barber.photoUrl);
    setName(barber.name);
    setSurname(barber.surname);
    setSkills(barber.skills);
    setShowForm(true);
  };

  const handleAddBarberClick = () => {
    setPhotoUrl("");
    setName("");
    setSurname("");
    setSkills("");
    setEditBarberId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const barberData = {
        name,
        surname,
        skills,
        photoUrl,
        status: "enable",
      };

      if (editBarberId) {
        await updateDoc(doc(db, "Barberos", editBarberId), barberData);
        toast.success("Barbero actualizado con éxito!", {
          onClose: () => onClose(),
        });
      } else {
        await addDoc(collection(db, "Barberos"), barberData);
        toast.success("Barbero agregado con éxito!", {
          onClose: () => onClose(),
        });
      }

      // Reset form
      setPhotoUrl("");
      setName("");
      setSurname("");
      setSkills("");
      setEditBarberId(null);
    } catch (error) {
      toast.error("Error al agregar/actualizar barbero.");
    }
    setIsSubmitting(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('addBarber-modal-overlay')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="addBarber-modal-overlay" onClick={handleOverlayClick}>
      <div className="addBarber-modal-container addBarber-animated-modal">
        {!showForm && !showDelete ? (
          <div className="addBarber-button-group centered">
            <button className="addBarber-animated-btn" onClick={handleAddBarberClick}>
              <FaPlus /> Agregar Barbero
            </button>
            <button className="addBarber-animated-btn" onClick={() => setShowDelete(true)}>
              <FaTrash /> Borrar Barbero
            </button>
          </div>
        ) : showForm ? (
          <div className="addBarber-form-container">
            <div className="addBarber-header">
              <button className="addBarber-back-btn" onClick={() => setShowForm(false)}>
                <FaArrowLeft />
              </button>
              <h2>Agregar Barbero</h2> {/* Ahora el h2 está dentro de la modal */}
            </div>
            <form className="addBarber-form-content" onSubmit={handleSubmit}>
              <div className="addBarber-input-group">
                <label htmlFor="photo-url" className="addBarber-upload-icon">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="addBarber-photo-preview" />
                  ) : (
                    <span>📷 Ingresa URL de Foto</span>
                  )}
                </label>
                <input
                  type="text"
                  id="photo-url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Ingrese la URL de la foto"
                  required
                />
              </div>
              <div className="addBarber-input-group">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="addBarber-input-group">
                <label htmlFor="surname">Apellido</label>
                <input
                  type="text"
                  id="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
              <div className="addBarber-input-group">
                <label htmlFor="skills">Habilidades</label>
                <textarea
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows="3"
                  placeholder="Ejemplo: Corte, Peinado, Barba"
                  required
                ></textarea>
              </div>
              <div className="addBarber-form-actions">
                <button type="button" onClick={onClose} className="addBarber-cancel-btn">
                  Cancelar
                </button>
                <button type="submit" className="addBarber-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Procesando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="addBarber-header">
              <button className="addbarberbutton" onClick={() => setShowDelete(false)}>
                <FaArrowLeft />
              </button>
              <h2>Barberos Disponibles</h2> {/* También dentro del modal */}
            </div>
            {loading ? (
              <div className="addBarber-loader">Cargando...</div>
            ) : (
              <ul className="addBarber-barber-list">
                {barbers.map(barber => (
                  <li key={barber.id} className="addBarber-barber-item">
                    <img src={barber.photoUrl} alt="Barber" className="addBarber-barber-photo" />
                    {barber.name} {barber.surname}
                    <div className="addBarber-action-buttons">
                      <button className="addBarber-edit-btn" onClick={() => handleEdit(barber)} disabled={isSubmitting}>
                        <FaEdit />
                      </button>
                      <button className="addBarber-delete-btn" onClick={() => handleDelete(barber.id)} disabled={isSubmitting}>
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
        <div className="addBarber-modal-overlay">
          <div className="addBarber-confirm-modal addBarber-animated-modal">
            <h3>¿Estás seguro de que deseas eliminar este barbero?</h3>
            <div className="addBarber-confirm-actions">
              <button className="addBarber-confirm-btn" onClick={() => confirmDeleteBarber(confirmDelete)} disabled={isSubmitting}>Sí</button>
              <button className="addBarber-confirm-btn" onClick={() => setConfirmDelete(null)} disabled={isSubmitting}>No</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddBarber;
