import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, getDocs, collection, getDoc } from 'firebase/firestore';
import './Dinero.css';
import NequiIcon from '../../Resources/NEQUI.svg';
import DaviplataIcon from '../../Resources/DAVIPLATA.svg';
import TarjetaIcon from '../../Resources/TARJETA.svg';
import EfectivoIcon from '../../Resources/EFECTIVO.svg';
import ItauIcon from '../../Resources/itau.svg'; // Import ItauIcon


const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

function Dinero() {
  const [balance, setBalance] = useState(0);
  const [period, setPeriod] = useState('HOY');
  const [earnings, setEarnings] = useState(0); // New state for earnings
  const [barberEarnings, setBarberEarnings] = useState([]); // New state for barber earnings
  const [selectedBarber, setSelectedBarber] = useState(''); // New state for selected barber
  const [barbersList, setBarbersList] = useState([]); // New state for list of barbers
  const [paymentMethods, setPaymentMethods] = useState([]); // New state for payment methods
  const [saldo, setSaldo] = useState(0); // New state for saldo
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchBalance = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const currentDate = `${year}${month}${day}`;
      const currentMonthYear = `${monthNames[date.getMonth()]}${year}`;
      const docRef = doc(db, 'Caja', currentMonthYear);

      const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let total = 0;

          if (period === 'HOY') {
            total = data[currentDate]?.serviceValue || 0;
          } else if (period === 'SEMANA') {
            for (let i = 0; i < 7; i++) {
              const pastDate = new Date(date);
              pastDate.setDate(date.getDate() - i);
              const pastYear = pastDate.getFullYear();
              const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
              const pastDay = String(pastDate.getDate()).padStart(2, '0');
              const pastDateString = `${pastYear}${pastMonth}${pastDay}`;
              const pastMonthYear = `${monthNames[pastDate.getMonth()]}${pastYear}`;
              const pastDocRef = doc(db, 'Caja', pastMonthYear);
              const pastDocSnap = await getDoc(pastDocRef);
              if (pastDocSnap.exists()) {
                const pastData = pastDocSnap.data();
                total += pastData[pastDateString]?.serviceValue || 0;
              }
            }
          } else if (period === 'MES') {
            for (let i = 1; i <= 31; i++) {
              const dayString = String(i).padStart(2, '0');
              const dateString = `${year}${month}${dayString}`;
              total += data[dateString]?.serviceValue || 0;
            }
          } else if (period === 'AÑO') {
            const promises = [];
            for (let m = 0; m < 12; m++) {
              const monthYear = `${monthNames[m]}${year}`;
              const monthDocRef = doc(db, 'Caja', monthYear);
              promises.push(getDoc(monthDocRef));
            }
            const monthDocs = await Promise.all(promises);
            monthDocs.forEach((monthDocSnap) => {
              if (monthDocSnap.exists()) {
                const monthData = monthDocSnap.data();
                for (const key in monthData) {
                  if (monthData[key]?.serviceValue) {
                    total += monthData[key].serviceValue;
                  }
                }
              }
            });
          }

          setBalance(total);
        }
      });

      return () => unsubscribe();
    };

    fetchBalance();
  }, [period, currentYear]);

  useEffect(() => {
    const fetchEarnings = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const currentDate = `${year}${month}${day}`;
      const docRef = doc(db, 'Caja', 'Ganancias');

      const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let total = 0;

          if (period === 'HOY') {
            total = data[currentDate]?.amount || 0;
          } else if (period === 'SEMANA') {
            for (let i = 0; i < 7; i++) {
              const pastDate = new Date(date);
              pastDate.setDate(date.getDate() - i);
              const pastYear = pastDate.getFullYear();
              const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
              const pastDay = String(pastDate.getDate()).padStart(2, '0');
              const pastDateString = `${pastYear}${pastMonth}${pastDay}`;
              total += data[pastDateString]?.amount || 0;
            }
          } else if (period === 'MES') {
            for (let i = 1; i <= 31; i++) {
              const dayString = String(i).padStart(2, '0');
              const dateString = `${year}${month}${dayString}`;
              total += data[dateString]?.amount || 0;
            }
          } else if (period === 'AÑO') {
            for (const key in data) {
              if (key.startsWith(year.toString())) {
                total += data[key]?.amount || 0;
              }
            }
          }

          setEarnings(total);
        }
      });

      return () => unsubscribe();
    };

    fetchEarnings();
  }, [period, currentYear]);

  useEffect(() => {
    const fetchBarbers = async () => {
      const barbersSnapshot = await getDocs(collection(db, "Barberos"));
      const barbers = barbersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        surname: doc.data().surname,
        photo: doc.data().photoUrl // Add photo field
      }));
      setBarbersList(barbers);
      setSelectedBarber(''); // Set default selected barber to "Todos"
    };

    fetchBarbers();
  }, []);

  useEffect(() => {
    const fetchBarberEarnings = async () => {
      if (!selectedBarber) {
        const allBarberEarnings = [];
        for (const barber of barbersList) {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const currentDate = `${year}${month}${day}`;

          const barberCajaRef = doc(db, "Caja", barber.id);
          const barberCajaDoc = await getDoc(barberCajaRef);
          if (barberCajaDoc.exists()) {
            const data = barberCajaDoc.data();
            let totalAmount = 0;
            let totalTip = 0;

            if (period === 'HOY') {
              totalAmount = data[currentDate]?.amount || 0;
              totalTip = data[currentDate]?.tip || 0;
            } else if (period === 'SEMANA') {
              for (let i = 0; i < 7; i++) {
                const pastDate = new Date(date);
                pastDate.setDate(date.getDate() - i);
                const pastYear = pastDate.getFullYear();
                const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
                const pastDay = String(pastDate.getDate()).padStart(2, '0');
                const pastDateString = `${pastYear}${pastMonth}${pastDay}`;
                totalAmount += data[pastDateString]?.amount || 0;
                totalTip += data[pastDateString]?.tip || 0;
              }
            } else if (period === 'MES') {
              for (let i = 1; i <= 31; i++) {
                const dayString = String(i).padStart(2, '0');
                const dateString = `${year}${month}${dayString}`;
                totalAmount += data[dateString]?.amount || 0;
                totalTip += data[dateString]?.tip || 0;
              }
            } else if (period === 'AÑO') {
              for (const key in data) {
                if (key.startsWith(year.toString())) {
                  totalAmount += data[key]?.amount || 0;
                  totalTip += data[key]?.tip || 0;
                }
              }
            }

            allBarberEarnings.push({
              photo: barber.photo,
              total: totalAmount + totalTip
            });
          }
        }
        setBarberEarnings(allBarberEarnings);
      } else {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const currentDate = `${year}${month}${day}`;

        const barberCajaRef = doc(db, "Caja", selectedBarber);

        const unsubscribe = onSnapshot(barberCajaRef, (barberCajaDoc) => {
          if (barberCajaDoc.exists()) {
            const data = barberCajaDoc.data();
            let totalAmount = 0;
            let totalTip = 0;

            if (period === 'HOY') {
              totalAmount = data[currentDate]?.amount || 0;
              totalTip = data[currentDate]?.tip || 0;
            } else if (period === 'SEMANA') {
              for (let i = 0; i < 7; i++) {
                const pastDate = new Date(date);
                pastDate.setDate(date.getDate() - i);
                const pastYear = pastDate.getFullYear();
                const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
                const pastDay = String(pastDate.getDate()).padStart(2, '0');
                const pastDateString = `${pastYear}${pastMonth}${pastDay}`;
                totalAmount += data[pastDateString]?.amount || 0;
                totalTip += data[pastDateString]?.tip || 0;
              }
            } else if (period === 'MES') {
              for (let i = 1; i <= 31; i++) {
                const dayString = String(i).padStart(2, '0');
                const dateString = `${year}${month}${dayString}`;
                totalAmount += data[dateString]?.amount || 0;
                totalTip += data[dateString]?.tip || 0;
              }
            } else if (period === 'AÑO') {
              for (const key in data) {
                if (key.startsWith(year.toString())) {
                  totalAmount += data[key]?.amount || 0;
                  totalTip += data[key]?.tip || 0;
                }
              }
            }

            setBarberEarnings([{
              photo: barbersList.find(barber => barber.id === selectedBarber)?.photo,
              total: totalAmount + totalTip
            }]);
          }
        });

        return () => unsubscribe();
      }
    };

    fetchBarberEarnings();
  }, [period, selectedBarber, barbersList]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const currentDate = `${year}${month}${day}`;

      const unsubscribe = onSnapshot(collection(db, 'MetodosDePago'), async (snapshot) => {
        const data = {};
        snapshot.forEach(doc => {
          data[doc.id] = doc.data();
        });

        const calculateTotal = (period) => {
          let total = {};
          if (period === 'HOY') {
            for (const method in data) {
              total[method] = data[method][currentDate]?.amount || 0;
            }
          } else if (period === 'SEMANA') {
            for (let i = 0; i < 7; i++) {
              const pastDate = new Date(date);
              pastDate.setDate(date.getDate() - i);
              const pastYear = pastDate.getFullYear();
              const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
              const pastDay = String(pastDate.getDate()).padStart(2, '0');
              const pastDateString = `${pastYear}${pastMonth}${pastDay}`;
              for (const method in data) {
                total[method] = (total[method] || 0) + (data[method][pastDateString]?.amount || 0);
              }
            }
          } else if (period === 'MES') {
            for (let i = 1; i <= 31; i++) {
              const dayString = String(i).padStart(2, '0');
              const dateString = `${year}${month}${dayString}`;
              for (const method in data) {
                total[method] = (total[method] || 0) + (data[method][dateString]?.amount || 0);
              }
            }
          } else if (period === 'AÑO') {
            for (const method in data) {
              total[method] = 0;
              for (const key in data[method]) {
                if (key.startsWith(year.toString())) {
                  total[method] += data[method][key]?.amount || 0;
                }
              }
            }
          }
          return total;
        };

        setPaymentMethods(calculateTotal(period));
      });

      return () => unsubscribe();
    };

    fetchPaymentMethods();
  }, [period]);

  useEffect(() => {
    const fetchSaldo = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const currentDate = `${year}${month}${day}`;
      const docRef = doc(db, 'Caja', 'Saldo');

      const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let total = 0;

          if (period === 'HOY') {
            total = data[currentDate]?.amount || 0;
          } else if (period === 'SEMANA') {
            for (let i = 0; i < 7; i++) {
              const pastDate = new Date(date);
              pastDate.setDate(date.getDate() - i);
              const pastYear = pastDate.getFullYear();
              const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
              const pastDay = String(pastDate.getDate()).padStart(2, '0');
              const pastDateString = `${pastYear}${pastMonth}${pastDay}`;
              total += data[pastDateString]?.amount || 0;
            }
          } else if (period === 'MES') {
            for (let i = 1; i <= 31; i++) {
              const dayString = String(i).padStart(2, '0');
              const dateString = `${year}${month}${dayString}`;
              total += data[dateString]?.amount || 0;
            }
          } else if (period === 'AÑO') {
            for (const key in data) {
              if (key.startsWith(year.toString())) {
                total += data[key]?.amount || 0;
              }
            }
          }

          setSaldo(total);
        }
      });

      return () => unsubscribe();
    };

    fetchSaldo();
  }, [period, currentYear]);

  const formatValue = (value) => {
    return value ? `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : '$0';
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'NEQUI':
        return <img src={NequiIcon} alt="Nequi" className="payment-icon" />;
      case 'DAVIPLATA':
        return <img src={DaviplataIcon} alt="Daviplata" className="payment-icon" />;
      case 'TARJETA':
        return <img src={TarjetaIcon} alt="Tarjeta" className="payment-icon" />;
      case 'EFECTIVO':
        return <img src={EfectivoIcon} alt="Efectivo" className="payment-icon" />;
      case 'ITAU':
        return <img src={ItauIcon} alt="Itau" className="payment-icon" />;
      default:
        return null;
    }
  };

  return (
    <div className="dinero-container">
      <div className="header-row">
        <h1 className="header-title">Dinero</h1> {/* New header */}
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="HOY">HOY</option>
          <option value="SEMANA">SEMANA</option>
          <option value="MES">MES</option>
          <option value="AÑO">AÑO</option>
        </select>
      </div>
      <div className="table-container">
        <div className="content-row">
          <div className="left-section">
            <h2>Ventas</h2>
            <p className="dinero-balance">{formatValue(balance)}</p>
          </div>
          <div className="center-section">
            <h2>Saldo</h2>
            <p className="dinero-balance">{formatValue(saldo)}</p>
          </div>
          <div className="center-section">
            <h2>Ganancias</h2>
            <p className="dinero-balance">{formatValue(earnings)}</p>
          </div>
          <div className="right-section">
            <select className="select-barber-dropdown" value={selectedBarber} onChange={(e) => setSelectedBarber(e.target.value)}>
              <option value="">Todos</option>
              {barbersList.map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name} {barber.surname}</option>
              ))}
            </select>
            {barberEarnings.map((barber, index) => (
              <div key={index} className="barber-earnings-row">
                <img src={barber.photo} alt="Barber" className="barber-photo" />
                <p className="dinero-balance">{formatValue(barber.total)}</p>
              </div>
            ))}
          </div>
          <div className="right-section">
            <h2>Metodos de Pago</h2>
            {Object.entries(paymentMethods).map(([method, amount], index) => (
              <div key={index} className="payment-method-row">
                {getPaymentMethodIcon(method)}
                <p className="dinero-balance">{formatValue(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dinero;