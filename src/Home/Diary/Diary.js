import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { db } from "../../firebase"; // Ensure your firebase.js is configured
import { collection, getDocs, doc, setDoc, updateDoc, increment, addDoc, getDoc } from "firebase/firestore"; // Import addDoc and getDoc
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./diary.css";
import LoadingScreen from "../../Resources/LoadingScreen/LoadingScreen"; // Import LoadingScreen

function Diary({ adminName, isOpen, onClose }) { // Remove authenticatedUser prop
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
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // YYYY-MM-DD format
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`; // YYYYMMDD format

        const docRef = doc(db, "Clientes", formData.correo);
        await setDoc(docRef, {
            name: formData.nombre,
            surname: formData.apellido,
            phone: formData.telefono
        });

        const price = parseFloat(formData.precio.replace(/\./g, "").replace(/[^0-9.-]+/g, ""));
        const tip = formData.propina ? parseFloat(formData.valorPropina.replace(/\./g, "").replace(/[^0-9.-]+/g, "")) : 0;

        const gananciasRef = doc(db, "Caja", "Ganancias");
        await updateDoc(gananciasRef, {
            [`${currentDate}.amount`]: increment(price * 0.4)
        });

        const saldoRef = doc(db, "Caja", "Saldo");
        await updateDoc(saldoRef, {
            [`${currentDate}.amount`]: increment(price + tip)
        });

        const reservationData = {
            date: formattedDate,
            time: formattedTime,
            barberId: barbers.find(barber => barber.name === formData.barbero).id,
            barberName: formData.barbero,
            serviceName: formData.servicio,
            duration: 60,
            price: price,
            clientName: `${formData.nombre} ${formData.apellido}`,
            clientPhone: formData.telefono,
            clientId: formData.correo,
            status: "Completada",
            paymentMethod: formData.metodoPago.toUpperCase()
        };

        await addDoc(collection(db, 'Reservaciones'), reservationData);

        const barberId = reservationData.barberId;
        const barberCajaRef = doc(db, "Caja", barberId);
        await updateDoc(barberCajaRef, {
            [`${currentDate}.amount`]: increment(price * 0.6),
            [`${currentDate}.tip`]: increment(tip),
            [`${currentDate}.tippaid`]: false,
            [`${currentDate}.amountpaid`]: false,
            [`${currentDate}.paymentMethod`]: formData.metodoPago.toUpperCase()
        });

        const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        const currentMonthYear = `${monthNames[now.getMonth()]}${now.getFullYear()}`;
        const monthYearRef = doc(db, "Caja", currentMonthYear);
        await updateDoc(monthYearRef, {
            [`${currentDate}.serviceCount`]: increment(1),
            [`${currentDate}.serviceValue`]: increment(price + tip)
        });

        const movimientoId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const movimientoData = {
            date: formattedDate,
            time: formattedTime,
            value: price + tip,
            type: "INGRESO",
            responsible: adminName,
            paymentMethod: formData.metodoPago.toUpperCase(),
            description: formData.servicio
        };

        await setDoc(doc(db, "Caja", "Movimientos"), { [movimientoId]: movimientoData }, { merge: true });

        const paymentMethodRef = doc(db, "MetodosDePago", formData.metodoPago.toUpperCase());
        await updateDoc(paymentMethodRef, {
            [`${currentDate}.amount`]: increment(price + tip)
        });

        toast.success('Cliente y venta registrada', {
            autoClose: 1000,
            onClose: onClose
        });
    } catch (error) {
        console.error("Error adding document: ", error);
    } finally {
        setLoading(false);
    }
};


  if (!isOpen) return null;

  return (
    <div className="diary-modal" onClick={onClose}>
      {loading && <LoadingScreen />} {/* Show LoadingScreen when loading */}
      <div className="diary-content" onClick={(e) => e.stopPropagation()}>
        <h2>Añadir Servicio Realizado</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre:
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              required 
              placeholder="Ingrese el nombre" 
            />
          </label>
          <label>
            Apellido:
            <input 
              type="text" 
              name="apellido" 
              value={formData.apellido} 
              onChange={handleChange} 
              required 
              placeholder="Ingrese el apellido" 
            />
          </label>
          <label>
            Teléfono:
            <input 
              type="tel" 
              name="telefono" 
              value={formData.telefono} 
              onChange={handleChange} 
              required 
              placeholder="Ingrese el número de teléfono" 
            />
          </label>
          <label>
            Correo:
            <input 
              type="email" 
              name="correo" 
              value={formData.correo} 
              onChange={handleChange} 
              required 
              placeholder="Ingrese el correo electrónico" 
            />
          </label>
          <label>
            Servicio:
            <select name="servicio" value={formData.servicio} onChange={handleChange} required>
              <option value="">Seleccione un servicio</option>
              {services.map((service, index) => (
                <option key={index} value={service.name}>{service.name}</option>
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
              <option value="ITAU">Itaú</option> {/* Add Itaú option */}
            </select>
          </label>
          {formData.metodoPago === "EFECTIVO" && (
            <label>
              Efectivo Recibido:
              <input 
                type="text" 
                name="efectivoRecibido" 
                value={formData.efectivoRecibido} 
                onChange={handleChange} 
                required 
                placeholder="Ingrese el monto recibido"
              />
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
              <input 
                type="text" 
                name="valorPropina" 
                value={formData.valorPropina} 
                onChange={handleChange} 
                required 
                placeholder="Ingrese el valor de la propina"
              />
            </label>
          )}
          
          {/* Checkbox Alimentando */}
          <label className="alimentando-label">
            <input type="checkbox" name="alimentando" checked={formData.alimentando} onChange={handleChange} />
            Alimentando
          </label>
          {formData.alimentando && (
            <label>
              Fecha de Alimentación:
              <input 
                type="date" 
                name="fechaAlimentacion" 
                value={formData.fechaAlimentacion} 
                onChange={handleChange} 
                required 
                className="tablero-input"
              />
            </label>
          )}
  
          <label>
            Precio:
            <input 
              type="text" 
              name="precio" 
              value={formData.precio} 
              onChange={handleChange} 
              className="readonly-input" 
              readOnly 
            />
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