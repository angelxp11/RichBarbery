import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { db } from "../../firebase"; // Ensure your firebase.js is configured
import { collection, getDocs, doc, setDoc, updateDoc, increment, addDoc, getDoc } from "firebase/firestore"; // Import addDoc and getDoc
import { getAuth } from "firebase/auth"; // Import getAuth
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./diary.css";

function Diary({ isOpen, onClose }) { // Remove authenticatedUser prop
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    servicio: "",
    precio: "",
    barbero: "", // Add barbero to formData
    metodoPago: "", // Add metodoPago to formData
    efectivoRecibido: "", // Add efectivoRecibido to formData
    propina: false, // Add propina to formData
    valorPropina: "" // Add valorPropina to formData
  });
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]); // Add state for barbers
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "Servicios"));
      const servicesList = querySnapshot.docs.map(doc => ({
        name: doc.data().serviceName,
        price: doc.data().price
      }));
      setServices(servicesList);
    };

    const fetchBarbers = async () => {
      const querySnapshot = await getDocs(collection(db, "Barberos"));
      const barbersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        surname: doc.data().surname
      }));
      setBarbers(barbersList);
    };

    fetchServices();
    fetchBarbers();
  }, []);

  const formatPrice = (value) => {
    return `$${parseInt(value).toLocaleString("es-ES")}`;
  };

  const handleTelefonoChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("3") && !value.startsWith("+57 ")) {
      value = "+57 " + value;
    }
    if (value.length > 14) {
      value = value.substring(0, 14);
    }
    setFormData({ ...formData, telefono: value });
  };

  const handleEfectivoRecibidoChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = formatPrice(value);
    }
    setFormData({ ...formData, efectivoRecibido: value });
  };

  const handleValorPropinaChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = formatPrice(value);
    }
    setFormData({ ...formData, valorPropina: value });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    if (name === "nombre" || name === "apellido") {
      if (/[^a-zA-Z\s]/.test(value)) return;
    } else if (name === "telefono") {
      handleTelefonoChange(e);
      return;
    } else if (name === "correo") {
      if (/[^a-zA-Z0-9@._-]/.test(value)) return;
    } else if (name === "servicio") {
      const selectedService = services.find(service => service.name === value);
      if (selectedService) {
        setFormData({ ...formData, servicio: value, precio: formatPrice(selectedService.price) });
      }
      return;
    } else if (name === "efectivoRecibido") {
      handleEfectivoRecibidoChange(e);
      return;
    } else if (name === "valorPropina") {
      handleValorPropinaChange(e);
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const calculateChange = () => {
    const price = parseFloat(formData.precio.replace(/\./g, "").replace(/[^0-9.-]+/g, ""));
    const received = parseFloat(formData.efectivoRecibido.replace(/\./g, "").replace(/[^0-9.-]+/g, ""));
    return received - price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true on submit
    try {
      const docRef = doc(db, "Clientes", formData.correo);
      await setDoc(docRef, {
        name: formData.nombre,
        surname: formData.apellido,
        phone: formData.telefono
      });

      const price = parseFloat(formData.precio.replace(/\./g, "").replace(/[^0-9.-]+/g, ""));
      const tip = formData.propina ? parseFloat(formData.valorPropina.replace(/\./g, "").replace(/[^0-9.-]+/g, "")) : 0; // Get the tip value

      // Ensure Ganancias document exists
      const gananciasRef = doc(db, "Caja", "Ganancias");
      const gananciasDoc = await getDoc(gananciasRef);
      if (!gananciasDoc.exists()) {
        await setDoc(gananciasRef, { amount: 0 });
      }
      await updateDoc(gananciasRef, {
        amount: increment(price * 0.6) // Añadir el 60% del precio a Ganancias
      });

      // Ensure Saldo document exists
      const saldoRef = doc(db, "Caja", "Saldo");
      const saldoDoc = await getDoc(saldoRef);
      if (!saldoDoc.exists()) {
        await setDoc(saldoRef, { amount: 0 });
      }
      await updateDoc(saldoRef, {
        amount: increment(price + tip) // Añadir el precio completo y la propina a Saldo
      });

      // Crear una reservación con estado "Completada"
      const reservationData = {
        date: new Date().toISOString().split('T')[0], // Fecha actual
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Hora actual
        barberId: barbers.find(barber => barber.name === formData.barbero).id,
        barberName: formData.barbero,
        serviceName: formData.servicio,
        duration: 60, // Duración predeterminada
        price: price,
        clientName: `${formData.nombre} ${formData.apellido}`,
        clientPhone: formData.telefono,
        clientId: formData.correo,
        status: "Completada",
        paymentMethod: formData.metodoPago.toUpperCase() // Save payment method in uppercase
      };

      await addDoc(collection(db, 'Reservaciones'), reservationData);

      // Actualizar o crear documento en Caja para el barbero
      const barberId = reservationData.barberId;
      const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const barberCajaRef = doc(db, "Caja", barberId);
      const barberCajaDoc = await getDoc(barberCajaRef);

      if (!barberCajaDoc.exists()) {
        await setDoc(barberCajaRef, {
          [currentDate]: { amount: price * 0.4, tip: tip } // Añadir el 40% del precio y la propina al documento del barbero
        });
      } else {
        await updateDoc(barberCajaRef, {
          [`${currentDate}.amount`]: increment(price * 0.4), // Añadir el 40% del precio al documento del barbero
          [`${currentDate}.tip`]: increment(tip) // Añadir la propina al documento del barbero
        });
      }

      // Actualizar contador de servicios y valor del servicio en FEBRERO2025
      const febrero2025Ref = doc(db, "Caja", "FEBRERO2025");
      const febrero2025Doc = await getDoc(febrero2025Ref);

      if (!febrero2025Doc.exists()) {
        await setDoc(febrero2025Ref, {
          [`${currentDate}`]: {
            serviceCount: 1,
            serviceValue: price + tip // Añadir el valor total recibido
          }
        });
      } else {
        await updateDoc(febrero2025Ref, {
          [`${currentDate}.serviceCount`]: increment(1),
          [`${currentDate}.serviceValue`]: increment(price + tip) // Añadir el valor total recibido
        });
      }

      // Get the name of the authenticated administrator
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("Authenticated user is not defined or does not have an email");
      }
      const adminRef = doc(db, "Administradores", user.email);
      const adminDoc = await getDoc(adminRef);
      const adminName = adminDoc.exists() && adminDoc.data().name ? adminDoc.data().name : user.email;

      // Register movement in Movimientos
      const now = new Date();
      const movimientoId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const movimientoData = {
        date: now.toISOString().split('T')[0], // Fecha actual
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Hora actual
        value: price + tip, // Set value to the total amount received
        type: "INGRESO",
        responsible: adminName,
        paymentMethod: formData.metodoPago.toUpperCase(), // Save payment method in uppercase
        description: formData.servicio // Add service description
      };
      await setDoc(doc(db, "Caja", "Movimientos"), { [movimientoId]: movimientoData }, { merge: true });

      toast.success('Cliente y venta registrada', {
        autoClose: 1000,
        onClose: onClose // Close the modal after the toast is closed
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setLoading(false); // Set loading to false after processing
    }
  };

  if (!isOpen) return null;

  return (
    <div className="diary-modal" onClick={onClose}>
      <div className="diary-content" onClick={(e) => e.stopPropagation()}>
        <h2>Añadir Servicio Realizado</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre:
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
          </label>
          <label>
            Apellido:
            <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
          </label>
          <label>
            Teléfono:
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required />
          </label>
          <label>
            Correo:
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
          </label>
          <label>
            Servicio:
            <select name="servicio" value={formData.servicio} onChange={handleChange} required>
              <option value="">Seleccione un servicio</option>
              {services.map((service, index) => (
                <option key={index} value={service.name}>{service.name === "BARBA" ? "BARBA" : service.name}</option>
              ))}
            </select>
          </label>
          <label>
            Barbero:
            <select name="barbero" value={formData.barbero} onChange={handleChange} required>
              <option value="">Seleccione un barbero</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.name}>{barber.name} {barber.surname}</option>
              ))}
            </select>
          </label>
          <label>
            Método de Pago:
            <select name="metodoPago" value={formData.metodoPago} onChange={handleChange} required>
              <option value="">Seleccione un método de pago</option>
              <option value="NEQUI">Nequi</option>
              <option value="DAVIPLATA">Daviplata</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </label>
          {formData.metodoPago === "EFECTIVO" && (
            <label>
              Efectivo Recibido:
              <input type="text" name="efectivoRecibido" value={formData.efectivoRecibido} onChange={handleChange} required />
              <div>Vuelto: {calculateChange() >= 0 ? `$${calculateChange().toLocaleString("es-ES")}` : "Monto insuficiente"}</div>
            </label>
          )}
          <label className="propina-label">
            <input type="checkbox" name="propina" checked={formData.propina} onChange={handleChange} />
            Propina
          </label>
          {formData.propina && (
            <label>
              Valor de la Propina:
              <input type="text" name="valorPropina" value={formData.valorPropina} onChange={handleChange} required />
            </label>
          )}
          <label>
            Precio:
            <input type="text" name="precio" value={formData.precio} readOnly className="readonly-input" />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Procesando..." : <><FaCheck /> Servicio Realizado</>}
          </button>
        </form>
        <button onClick={onClose} disabled={loading}>
          <FaTimes /> Cerrar
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Diary;
