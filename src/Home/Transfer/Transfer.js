import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaChevronDown } from "react-icons/fa"; // Import FaChevronDown icon
import { db } from "../../firebase"; // Ensure your firebase.js is configured
import { collection, addDoc, doc, updateDoc, increment, getDoc, setDoc, onSnapshot } from "firebase/firestore"; // Import necessary Firestore functions
import { getAuth } from "firebase/auth"; // Import getAuth
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./transfer.css";

function Transfer({ adminName, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    paymentMethod: "",
    from: "", // Add from to formData
    to: "", // Add to to formData
    days: [] // Change days to an array
  });
  const [loading, setLoading] = useState(false); // Add loading state
  const [paymentMethods, setPaymentMethods] = useState([]); // Add state for payment methods
  const [availableDays, setAvailableDays] = useState([]); // Add state for available days
  const [showDayDetails, setShowDayDetails] = useState({}); // Add state for showing day details
  const [dayAmounts, setDayAmounts] = useState({}); // Add state for day amounts
  const [transferOption, setTransferOption] = useState(""); // Change initial state to empty
  

  useEffect(() => {
    const unsubscribeMethods = onSnapshot(collection(db, "MetodosDePago"), (snapshot) => {
      const methodsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentMethods(methodsList);
    });
    return () => unsubscribeMethods();
  }, []);

  useEffect(() => {
    if (formData.from) {
      const fetchDays = async () => {
        const fromRef = doc(db, "MetodosDePago", formData.from);
        const fromDoc = await getDoc(fromRef);
        if (fromDoc.exists()) {
          const days = Object.keys(fromDoc.data()).sort((a, b) => b.localeCompare(a)); // Sort days from newest to oldest
          setAvailableDays(days);
        }
      };
      fetchDays();
    } else {
      setAvailableDays([]);
    }
  }, [formData.from]);

  useEffect(() => {
    const fetchDayAmounts = async () => {
      if (formData.from) {
        const fromRef = doc(db, "MetodosDePago", formData.from);
        const fromDoc = await getDoc(fromRef);
        if (fromDoc.exists()) {
          const data = fromDoc.data();
          const amounts = {};
          availableDays.forEach(day => {
            const amount = data[day]?.amount;
            amounts[day] = isNaN(amount) ? 0 : amount; // Ensure amount is a number, default to 0 if NaN
          });
          setDayAmounts(amounts);
        }
      }
    };
    fetchDayAmounts();
  }, [formData.from, availableDays]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (day) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      days: prevFormData.days.includes(day)
        ? prevFormData.days.filter(d => d !== day)
        : [...prevFormData.days, day]
    }));
  };

  const toggleDayDetails = (day) => {
    setShowDayDetails((prevDetails) => ({
      ...prevDetails,
      [day]: !prevDetails[day],
    }));
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    const now = new Date();
    let selectedDays = [];
  
    if (value === "HOY") {
      selectedDays = [`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`];
    } else if (value === "SEMANA") {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        selectedDays.push(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
      }
    } else if (value === "QUINCENA") {
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        selectedDays.push(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
      }
    } else if (value === "MES") {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        selectedDays.push(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
      }
    }
  
    setFormData({ ...formData, days: selectedDays });
  };
  

  const handleSelectAllDays = (e) => {
    if (e.target.checked) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        days: availableDays
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        days: []
      }));
    }
  };

  const handleTransferOptionChange = (e) => {
    setTransferOption(e.target.value);
  };

  // Custom function to format price
  const formatPrice = (value) => {
    const numericValue = value.replace(/\D/g, ""); // Remove any non-numeric characters
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Add thousands separator
    return `$ ${formattedValue}`; // Add currency symbol
  };

  const formatDate = (dateString) => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const year = dateString.substring(0, 4);
    const month = months[parseInt(dateString.substring(4, 6)) - 1];
    const day = parseInt(dateString.substring(6, 8));
    return `${day} de ${month} ${year}`;
  };

  const calculateTotalAmount = () => {
    const baseAmount = formData.days.reduce((total, day) => total + (dayAmounts[day] || 0), 0);
    switch (transferOption) {
      case "GANANCIAS":
        return baseAmount * 0.4;
      case "BARBERO":
        return baseAmount * 0.6;
      case "AMBAS":
        return baseAmount;
      default:
        return baseAmount;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const now = new Date();
        const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const movimientoId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        const isGanancia = transferOption === "GANANCIAS";
        const tipoMovimiento = isGanancia ? "Ganancia" : "Egreso"; // Cambio aquí: "Gasto" → "Egreso"

        const calculateAdjustedAmount = (amount) => {
            switch (transferOption) {
                case "GANANCIAS":
                    return amount * 0.4;
                case "BARBERO":
                    return amount * 0.6;
                case "AMBAS":
                    return amount;
                default:
                    return amount;
            }
        };

        const dayValues = formData.days.map(day => ({
            fecha: day,
            valor: calculateAdjustedAmount(
                parseInt(dayAmounts[day]?.toString().replace(/[$.,]/g, ""), 10) || 0
            )
        }));

        const getAmountFromFirestore = async (method, date) => {
            const docRef = doc(db, "MetodosDePago", method);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() && docSnap.data()[date]?.amount !== undefined
                ? parseInt(docSnap.data()[date].amount, 10)
                : 0;
        };

        const updateAmountInFirestore = async (method, date, newAmount) => {
            const docRef = doc(db, "MetodosDePago", method);
            await setDoc(docRef, { [date]: { amount: newAmount } }, { merge: true });
        };

        const sourceMethod = formData.from.toUpperCase();
        const destinationMethod = formData.to.toUpperCase();
        let totalTransferred = 0;

        for (const { fecha, valor } of dayValues) {
            if (valor > 0) {
                const sourceAmount = await getAmountFromFirestore(sourceMethod, fecha);

                // **Validar que haya saldo suficiente antes de transferir**
                if (sourceAmount < valor) {
                    toast.error(`Saldo insuficiente en ${sourceMethod} para transferir ${valor} el ${fecha}`);
                    setLoading(false);
                    return; // Cancela toda la operación si un día no tiene saldo suficiente
                }

                const destinationAmount = await getAmountFromFirestore(destinationMethod, fecha);

                await updateAmountInFirestore(sourceMethod, fecha, sourceAmount - valor);
                await updateAmountInFirestore(destinationMethod, fecha, destinationAmount + valor);

                totalTransferred += valor; // Acumular el total transferido
            }
        }

        // **Registrar el movimiento en Firestore**
        if (totalTransferred > 0) {
            const movimientoData = {
                date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                time: formattedTime,
                value: totalTransferred, // Monto total transferido
                type: tipoMovimiento.toUpperCase(), // Se guardará como "EGRESO"
                responsible: adminName, // Nombre del administrador que realiza la transferencia
                paymentMethod: sourceMethod, // Método de pago desde donde se transfiere
                description: `Transferencia de dinero desde ${sourceMethod} a ${destinationMethod}` // Descripción personalizada
            };

            await setDoc(doc(db, "Caja", "Movimientos"), { [movimientoId]: movimientoData }, { merge: true });

            toast.success(`Movimiento registrado: ${formatPrice(formData.amount)}`, {
                autoClose: 2000,
                onClose: onClose
            });
        }

        setLoading(false);
        onClose();

    } catch (error) {
        toast.error("Hubo un error en la transferencia.");
        setLoading(false);
    }
};



  if (!isOpen) return null;

  return (
    <div className="transfer-modal" onClick={onClose}>
      <div className="transfer-content" onClick={(e) => e.stopPropagation()}>
        <h2>Transferir Para Pago de Barberos</h2>
        <form onSubmit={handleSubmit}>
        <label>
              Desde:
              <select name="from" value={formData.from} onChange={handleChange} required>
                <option value="">Seleccione origen</option>
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>{method.id}</option>
                ))}
              </select>
            </label>
            <label>
              Hasta:
              <select name="to" value={formData.to} onChange={handleChange} required>
                <option value="">Seleccione destino</option>
                {paymentMethods
                  .filter(method => method.id !== formData.from) // Eliminar el método seleccionado en "Desde"
                  .map(method => (
                    <option key={method.id} value={method.id}>{method.id}</option>
                  ))}
              </select>
            </label>
          <label>
            Días:
            <div className="days-checkboxes">
              <select onChange={handleDateRangeChange}>
                <option value="">Seleccione rango de días</option>
                <option value="HOY">Hoy</option>
                <option value="SEMANA">Semana</option>
                <option value="QUINCENA">Quincena</option>
                <option value="MES">Mes</option>
              </select>
              <div className="transfer-days-container">
                {availableDays.map(day => (
                  <div className={`day-item ${dayAmounts[day] === 0 ? 'zero-amount' : ''}`} key={day}>
                    <div className="day-top">
                      <label className="day-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.days.includes(day)}
                          onChange={() => handleCheckboxChange(day)}
                        />
                        {formatDate(day)}
                      </label>
                      <button type="button" className="day-chevron-btn" onClick={() => toggleDayDetails(day)}>
                        <FaChevronDown />
                      </button>
                    </div>
                    {showDayDetails[day] && (
                      <div className="day-details">
                        <p>Valor del día: {formatPrice(dayAmounts[day].toString())}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <label className="day-checkbox-label">
                <input
                  type="checkbox"
                  onChange={handleSelectAllDays}
                  checked={formData.days.length === availableDays.length && availableDays.length > 0}
                />
                Seleccionar todos los días
              </label>
              <div className="transfer-options">
                <input
                  type="radio"
                  id="ganancias"
                  name="transferOption"
                  value="GANANCIAS"
                  checked={transferOption === "GANANCIAS"}
                  onChange={handleTransferOptionChange}
                />
                <label htmlFor="ganancias">Ganancias</label>
                
                <input
                  type="radio"
                  id="barbero"
                  name="transferOption"
                  value="BARBERO"
                  checked={transferOption === "BARBERO"}
                  onChange={handleTransferOptionChange}
                />
                <label htmlFor="barbero">Barbero</label>
                
                <input
                  type="radio"
                  id="ambas"
                  name="transferOption"
                  value="AMBAS"
                  checked={transferOption === "AMBAS"}
                  onChange={handleTransferOptionChange}
                />
                <label htmlFor="ambas">Ambas</label>
              </div>
            </div>
          </label>
          <div className="total-amount">
            <h3>Total a Transferir: {formatPrice(calculateTotalAmount().toString())}</h3>
          </div>
          <button type="submit" disabled={loading} className="button-full-width">
            {loading ? "Procesando..." : <><FaCheck /> Añadir</>}
          </button>
        </form>
        <button onClick={onClose} disabled={loading} className="button-full-width">
          <FaTimes /> Cerrar
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Transfer;
