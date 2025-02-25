import React, { useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { db } from "../../firebase"; // Ensure your firebase.js is configured
import { collection, addDoc, doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore"; // Import necessary Firestore functions
import { getAuth } from "firebase/auth"; // Import getAuth
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./cashBox.css";

function CashBox({ adminName,isOpen, onClose }) {
  const [formData, setFormData] = useState({
    type: "Ingreso",
    amount: "",
    description: "",
    paymentMethod: "" // Add paymentMethod to formData
  });
  const [loading, setLoading] = useState(false); // Add loading state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Custom function to format price
  const formatPrice = (value) => {
    const numericValue = value.replace(/\D/g, ""); // Remove any non-numeric characters
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Add thousands separator
    return `$ ${formattedValue}`; // Add currency symbol
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true on submit
    try {
      // Eliminar formato de precio antes de parsear a número
      const rawAmount = formData.amount.replace(/\D/g, ""); // Elimina cualquier carácter no numérico
      const amount = parseFloat(rawAmount);
  
      // Verificar si el tipo es "Egreso" y si el saldo es suficiente
      const saldoRef = doc(db, "Caja", "Saldo");
      const saldoDoc = await getDoc(saldoRef);
  
      if (!saldoDoc.exists()) {
        await setDoc(saldoRef, {});
      }
  
      const today = new Date();
      const dateKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const currentAmount = saldoDoc.data()[dateKey]?.amount || 0;
  
      if (formData.type === "Egreso" && currentAmount < amount) {
        toast.error("No hay suficiente saldo para realizar el egreso.");
        setLoading(false);
        return; // Evitar proceder si no hay suficiente saldo
      }
  
      // Actualizar el saldo según el tipo de movimiento
      await updateDoc(saldoRef, {
        [`${dateKey}.amount`]: increment(formData.type === "Ingreso" ? amount : -amount)
      });
  
      // Usar adminName directamente como responsable
      const responsible = adminName; // Usar el adminName recibido como prop
  
      // Registrar movimiento en Movimientos
      const now = new Date();
      const movimientoId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const movimientoData = {
        date: now.toISOString().split('T')[0], // Fecha actual
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Hora actual
        value: amount,
        type: formData.type.toUpperCase(),
        description: formData.description,
        responsible: responsible, // Usar directamente el adminName como responsable
        paymentMethod: formData.paymentMethod.toUpperCase() // Save payment method in uppercase
      };
  
      await setDoc(doc(db, "Caja", "Movimientos"), { [movimientoId]: movimientoData }, { merge: true });
  
      // Actualizar el documento del método de pago
      const paymentMethodRef = doc(db, "MetodosDePago", formData.paymentMethod.toUpperCase());
      const paymentMethodDoc = await getDoc(paymentMethodRef);
  
      if (!paymentMethodDoc.exists()) {
        await setDoc(paymentMethodRef, {
          [dateKey]: { amount: formData.type === "Ingreso" ? amount : -amount }
        });
      } else {
        await updateDoc(paymentMethodRef, {
          [`${dateKey}.amount`]: increment(formData.type === "Ingreso" ? amount : -amount)
        });
      }
  
      // Actualizar el documento del mes y año
      const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      const currentMonthYear = `${monthNames[now.getMonth()]}${now.getFullYear()}`;
      const monthYearRef = doc(db, "Caja", currentMonthYear);
      const monthYearDoc = await getDoc(monthYearRef);
  
      if (!monthYearDoc.exists()) {
        await setDoc(monthYearRef, {
          [dateKey]: { serviceValue: formData.type === "Ingreso" ? amount : -amount } // Change amount to serviceValue
        });
      } else {
        await updateDoc(monthYearRef, {
          [`${dateKey}.serviceValue`]: increment(formData.type === "Ingreso" ? amount : -amount) // Change amount to serviceValue
        });
      }
  
      setFormData({ type: "Ingreso", amount: "", description: "", paymentMethod: "" });
      toast.success(`Movimiento registrado: ${formatPrice(formData.amount)}`, {
        autoClose: 2000,
        onClose: onClose
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cashBox-modal" onClick={onClose}>
      <div className="cashBox-content" onClick={(e) => e.stopPropagation()}>
        <h2>Movimientos de Caja</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Tipo:
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="Ingreso">Ingreso</option>
              <option value="Egreso">Egreso</option>
            </select>
          </label>
          <label>
            Monto:
            <input
              type="text"
              name="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: formatPrice(e.target.value) })}
              required
            />
          </label>
          <label>
            Descripción:
            <input type="text" name="description" value={formData.description} onChange={handleChange} required />
          </label>
          <label>
            Método de Pago:
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
              <option value="">Seleccione un método de pago</option>
              <option value="NEQUI">Nequi</option>
              <option value="DAVIPLATA">Daviplata</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Procesando..." : <><FaCheck /> Añadir</>}
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

export default CashBox;