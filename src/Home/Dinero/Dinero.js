// Dinero.js
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './Dinero.css';

function Dinero() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const docRef = doc(db, 'Caja', 'Saldo'); // Cambiar 'Caja' y 'Saldo' según tus especificaciones
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const balanceData = docSnap.data();
        setBalance(balanceData.amount || 0); // El campo 'amount' contiene el saldo
      }
    });

    return () => unsubscribe();
  }, []);

  const formatValue = (value) => {
    return value ? `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : '$0';
  };

  return (
    <div className="dinero-container">
      <h2>Dinero Disponible</h2>
      <p className="dinero-balance">{formatValue(balance)}</p> {/* Muestra el saldo con el formato correcto */}
    </div>
  );
}

export default Dinero;
