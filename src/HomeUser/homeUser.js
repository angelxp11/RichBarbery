  import React, { useState, useEffect } from "react";
  import { db } from "../firebase"; // Asegúrate de importar tu configuración de Firebase
  import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore"; // Funciones de Firebase para obtener y actualizar datos
  import { getAuth } from "firebase/auth";
  import "./homeUser.css";
  import Servicios from "../Servicios/Servicios"; // Asegúrate de importar Servicios.js
  import LoadingScreen from "../Resources/LoadingScreen/LoadingScreen"; // Importa la pantalla de carga
  import { ToastContainer, toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';
  


  function HomeUser() {
    const [isViewDateModalOpen, setIsViewDateModalOpen] = useState(false);
    const [showServicios, setShowServicios] = useState(false); // Estado para mostrar Servicios.js
    const [loading, setLoading] = useState(false); // Estado de carga
    const [reservaciones, setReservaciones] = useState([]); // Estado para almacenar las reservaciones
    const [valoracion, setValoracion] = useState(0); // Estado para la valoración (número de estrellas)
    const [comentariosBarbero, setComentariosBarbero] = useState(""); // Comentarios para el barbero
    const [comentariosLugar, setComentariosLugar] = useState(""); // Comentarios para el lugar
    const [isValoracionModalOpen, setIsValoracionModalOpen] = useState(false); // Estado para el modal de valoración
    const [selectedReservacionId, setSelectedReservacionId] = useState(null); // Estado para la reservación seleccionada para valorar
    const [isSecondPage, setIsSecondPage] = useState(false); // Estado para controlar la página del formulario
    const auth = getAuth();
    const userEmail = auth.currentUser ? auth.currentUser.email : null;
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState(""); // Estado para almacenar el nombre del usuario    // Función para obtener las reservaciones del cliente
    const fetchReservaciones = async () => {
      try {
        const reservacionesRef = collection(db, "Reservaciones");
        const q = query(reservacionesRef, where("clientId", "==", userEmail));
        const querySnapshot = await getDocs(q);
    
        if (!querySnapshot.empty) {
          const reservacionesList = querySnapshot.docs.map((doc) => ({
            id: doc.id, // Asegúrate de obtener el ID de la reservación
            ...doc.data(),
          }));
    
          // Ordenar las reservaciones por la fecha de la más nueva a la más antigua
          reservacionesList.sort((a, b) => {
            const dateA = new Date(a.date); // Asumiendo que 'date' es el campo de la fecha
            const dateB = new Date(b.date);
            return dateB - dateA; // Ordenar de la más nueva a la más antigua
          });
    
          setReservaciones(reservacionesList); // Actualiza el estado con las reservaciones ordenadas
        } else {
          console.log("No se encontraron reservaciones para este cliente.");
        }
      } catch (error) {
        console.error("Error al obtener las reservaciones: ", error);
      }
    };
    // Función para obtener el nombre del usuario desde Firestore
  const fetchUserName = async () => {
    if (userEmail) {
      try {
        const userDocRef = doc(db, "Clientes", userEmail); // Referencia al documento del usuario en la colección 'Clientes'
        const userDoc = await getDoc(userDocRef); // Obtener el documento del usuario

        if (userDoc.exists()) {
          const userData = userDoc.data(); // Extrae los datos del documento
          console.log("Nombre del usuario:", userData.name); // Imprimir el nombre en consola
          setUserName(userData.name); // Guardar el nombre en el estado
        } else {
          console.log("No se encontró el documento para el usuario.");
        }
      } catch (error) {
        console.error("Error al obtener el nombre del usuario:", error);
      }
    }
  };
    


    useEffect(() => {
      fetchUserName();
      // Función para obtener las reservaciones del cliente
      const fetchReservaciones = async () => {
        try {
          const reservacionesRef = collection(db, "Reservaciones");
          const q = query(reservacionesRef, where("clientId", "==", userEmail));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const reservacionesList = querySnapshot.docs.map((doc) => ({
              id: doc.id, // Asegúrate de obtener el ID de la reservación
              ...doc.data(),
            }));
            setReservaciones(reservacionesList); // Actualiza el estado con las reservaciones
          } else {
            console.log("No se encontraron reservaciones para este cliente.");
          }
        } catch (error) {
          console.error("Error al obtener las reservaciones: ", error);
        }
      };
      
      if (userEmail) {
        fetchReservaciones(); // Llama a la función para obtener las reservaciones cuando se cargue el componente
      }
    }, [userEmail]);

    const handleViewDateClick = () => {
      setIsViewDateModalOpen(true); // Abre el modal de ViewDate
    };

    const handleCloseDateModal = () => {
      setIsViewDateModalOpen(false); // Cierra el modal de ViewDate
    };

    const handleServiciosClick = () => {
      // Mostrar LoadingScreen inmediatamente
      setLoading(true);
      setShowServicios(false); // No mostrar aún Servicios.js
    
      // Simula el LoadingScreen durante 2 segundos
      setTimeout(() => {
        console.log("Carga finalizada, mostrando servicios...");
        setLoading(false); // Termina la carga
        setShowServicios(true); // Ahora muestra Servicios.js
      }, 20); // Retraso de 2 segundos antes de mostrar los servicios
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0'); // Asegura que el día tenga dos dígitos
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0, por lo que sumamos 1
      const year = date.getFullYear();
      return `${day}/${month}/${year}`; // Formato dd/mm/yyyy
    };

    const handleValoracionChange = (index) => {
      setValoracion(index + 1); // Actualiza la valoración con el índice de la estrella clickeada
    };

    const handleOpenValoracionModal = (reservacionId) => {
      setSelectedReservacionId(reservacionId); // Establece la reservación seleccionada
      setIsValoracionModalOpen(true); // Abre el modal de valoración
    };

    const handleCloseValoracionModal = () => {
      setIsValoracionModalOpen(false); // Cierra el modal de valoración
    };

    const handleNextPage = () => {
      // Asegúrate de que la valoración del barbero esté establecida antes de pasar a la siguiente página
      if (valoracion < 1 || valoracion > 5) {
        alert("Por favor, ingresa una valoración válida entre 1 y 5 para el barbero.");
        return;
      }
    
      // Reinicia la valoración del lugar cuando pasas a la segunda página
      setValoracion(0);  // Resetear valoracion para el lugar
      setIsSecondPage(true); // Pasa a la segunda página
    };

    const handlePreviousPage = () => {
      setIsSecondPage(false); // Vuelve a la primera página
    };

    const handleAddValoracion = async () => {
      // Mostrar pantalla de carga inmediatamente
      setIsLoading(true);
    
      if (valoracion < 1 || valoracion > 5) {
        alert("Por favor, ingresa una valoración válida entre 1 y 5.");
        setIsLoading(false);  // Ocultar pantalla de carga si hay un error
        return;
      }
    
      try {
        // Verificar si ya existe una valoración para esta reservación
        const valoracionesRef = collection(db, "Valoraciones");
        const q = query(valoracionesRef, where("idReservacion", "==", selectedReservacionId));
        const querySnapshot = await getDocs(q);
    
        if (!querySnapshot.empty) {
          alert("Ya has valorado esta reservación.");
          setIsLoading(false);  // Ocultar pantalla de carga
          return; // Si ya existe una valoración, no guardamos nada
        }
    
        // Obtener datos del barbero y cliente
        const reservacionRef = doc(db, "Reservaciones", selectedReservacionId);
        const reservacionSnapshot = await getDoc(reservacionRef);
    
        if (!reservacionSnapshot.exists()) {
          alert("No se pudo obtener la reservación.");
          setIsLoading(false);  // Ocultar pantalla de carga
          return;
        }
    
        const reservacionData = reservacionSnapshot.data();
        const barberId = reservacionData.barberId; // ID del barbero
        const clientId = userEmail; // Usamos el correo del usuario autenticado
    
        // Fecha actual
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
        // Crear un nuevo documento de valoración
        const newValoracion = {
          barberId: barberId,
          clientId: clientId,
          date: currentDate,
          BarberRating: valoracion, // Puntuación de barbero (1 a 5)
          PlaceRating: valoracion,  // Puntuación de lugar (1 a 5)
          Barbercomment: comentariosBarbero, // Comentarios sobre el barbero
          Placecomment: comentariosLugar,   // Comentarios sobre el lugar
          idReservacion: selectedReservacionId,
        };
    
        // Guardar la valoración en Firestore
        await addDoc(valoracionesRef, newValoracion);
    
        // Actualizar la reservación con la valoración y el estado
        await updateDoc(reservacionRef, {
          status: "Valorada ⭐",  // Actualizar el estado de la reservación
        });
    
        // Resetea los campos de valoración y comentarios
        setValoracion(0);
        setComentariosBarbero("");
        setComentariosLugar("");
        handleCloseValoracionModal(); // Cierra el modal de valoración
    
        // Esperar 2 segundos antes de mostrar el toast
          toast.success("Tu valoración ha sido enviada, gracias por ayudarnos a mejorar.");
          
          // Llamar a fetchReservaciones para actualizar la lista de citas
          fetchReservaciones(); // Esto actualizará las reservaciones después de valorar
        
      } catch (error) {
        console.error("Error al actualizar la valoración:", error);
        alert("Hubo un error al enviar tu valoración.");
        setIsLoading(false); // Ocultar pantalla de carga
      } finally {
        // En el caso de un error o éxito, aseguramos que la pantalla de carga se oculte.
        setIsLoading(false);
      }
    };
    

    return (
      <div className="background">
      {/* Mostrar la pantalla de carga si isLoading es true */}
      {isLoading ? (
        <LoadingScreen />  // Asegúrate de que LoadingScreen se está renderizando correctamente
      ) : (
        <>
            {showServicios ? (
              <Servicios /> // Renderiza el componente Servicios cuando showServicios es true
            ) : (
              <>
                <h1 className="welcome-title-admin">Bienvenido a RichBarbery, {userName}</h1>
                <div className="user-container">
                  <div className="user-content">
                    {/* Card para ver citas */}
                    <div className="user-card" onClick={handleViewDateClick}>
                      <div className="calendar-icon">📅</div>
                      <p className="card-title">Ver Mis Citas</p>
                    </div>
    
                    {/* Card para ver servicios */}
                    <div className="user-card" onClick={handleServiciosClick}>
                      <div className="service-icon">💈</div>
                      <p className="card-title">Servicios</p>
                    </div>
                  </div>
                </div>
    
                // Modal ViewDate
  {isViewDateModalOpen && (
    <div className="modal-overlay" onClick={handleCloseDateModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleCloseDateModal}>
          ×
        </button>
        <h2>Calendario de Citas</h2>
        {/* Mostrar las reservaciones del cliente */}
        <div className="reservaciones-list">
          {reservaciones.length > 0 ? (
            reservaciones.map((reservacion, index) => (
              <div key={index} className="reservacion-item">
                <p>{`Fecha: ${formatDate(reservacion.date)}`}</p>
                <p>{`Hora: ${reservacion.time}`}</p>
                <p>{`Servicio: ${reservacion.serviceName}`}</p>
                <p>{`Barbero: ${reservacion.barberName}`}</p>
                <p>{`Estado: ${reservacion.status}`}</p>
                <p>{`Duración: ${reservacion.duration} minutos`}</p>
                <p>{`Precio: $${reservacion.price}`}</p>

                {/* Mostrar el botón "Valoranos" solo si el estado es Completada */}
                {reservacion.status === "Completada" && (
                  <div>
                    <p>{`Valoración: ${reservacion.valoracion || "No valorada"}`}</p>
                    {/* Botón para abrir el modal de valoración */}
                    <button className="valoracion-btn" onClick={() => handleOpenValoracionModal(reservacion.id)}>
                      Valoranos
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No tienes citas.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
    
                {/* Modal de valoración */}
                {isValoracionModalOpen && (
                  <div className="valoracion-modal-overlay">
                    <div className="valoracion-modal-container">
                      <button className="close-btn" onClick={handleCloseValoracionModal}>×</button>
                      <h2>Valora tu experiencia</h2>
    
                      {/* Página 1: Valoración del barbero */}
                      {!isSecondPage ? (
                        <div className="valoracion-section">
                          <p>Valoración del barbero (1 a 5):</p>
                          <div className="stars">
                            {[...Array(5)].map((_, index) => (
                              <span
                                key={index}
                                className={`star ${valoracion > index ? "filled" : ""}`}
                                onClick={() => handleValoracionChange(index)}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <textarea
                            value={comentariosBarbero}
                            onChange={(e) => setComentariosBarbero(e.target.value)}
                            placeholder="Comentarios sobre el barbero"
                          />
                          <button onClick={handleNextPage}>Siguiente Pregunta</button>
                        </div>
                      ) : (
                        // Página 2: Valoración del lugar
                        <div className="valoracion-section">
                          <p>Valoración del lugar (1 a 5):</p>
                          <div className="stars">
                            {[...Array(5)].map((_, index) => (
                              <span
                                key={index}
                                className={`star ${valoracion > index ? "filled" : ""}`}
                                onClick={() => handleValoracionChange(index)}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <textarea
                            value={comentariosLugar}
                            onChange={(e) => setComentariosLugar(e.target.value)}
                            placeholder="Comentarios sobre el lugar"
                          />
                          <button onClick={handlePreviousPage}>Volver</button>
                          <button onClick={handleAddValoracion}>Enviar calificación</button>
                        
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
    
  };

  export default HomeUser;