import React, { useState } from "react";
import "./AddBarber.css"; // Asegúrate de tener estos estilos configurados
import { db } from "../../firebase"; // Importa la instancia de Firestore
import { collection, addDoc } from "firebase/firestore"; // Importa funciones de Firestore
import { toast, ToastContainer } from "react-toastify"; // Importa toast y ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Importa los estilos de toast

const AddBarber = ({ isOpen, onClose }) => {
  const [photoUrl, setPhotoUrl] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [skills, setSkills] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Agregar un nuevo documento con un ID generado automáticamente
      await addDoc(collection(db, "Barberos"), {
        name,
        surname,
        skills,
        photoUrl,
        status: "enable", // Campo adicional para indicar el estado

      });
      console.log("Barbero agregado:", { name, surname, skills, photoUrl });
      
      // Mostrar el toast de éxito
      toast.success("Barbero agregado con éxito!");
      
      // Cerrar el modal después de guardar
      onClose();
    } catch (error) {
      console.error("Error al agregar barbero:", error);
      // Mostrar el toast de error
      toast.error("Error al agregar barbero.");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <h2>Agregar Barbero</h2>
        <form className="form-content" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="photo-url" className="upload-icon">
              {photoUrl ? (
                <img src={photoUrl} alt="Preview" className="photo-preview" />
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
          <div className="input-group">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="surname">Apellido</label>
            <input
              type="text"
              id="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
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
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="submit-btn">
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Contenedor de Toast */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddBarber;
