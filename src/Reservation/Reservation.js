import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './Reservation.css';
import LoadingScreen from '../Resources/LoadingScreen/LoadingScreen';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';



const Reservation = ({ service, onClose }) => {
  const [barbers, setBarbers] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [noBarberSelected, setNoBarberSelected] = useState(false);
  const [occupiedTimes, setOccupiedTimes] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [ratings, setRatings] = useState({});

  const auth = getAuth();
  const db = getFirestore();

  const calcularPromedioValoraciones = async (barberId) => {
    const valoracionesRef = collection(db, "Valoraciones");
    const q = query(valoracionesRef, where("barberId", "==", barberId));

    try {
      const querySnapshot = await getDocs(q);
      let sumaValoraciones = 0;
      let totalValoraciones = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sumaValoraciones += data.BarberRating;
        totalValoraciones++;
      });

      const promedio = totalValoraciones > 0 ? (sumaValoraciones / totalValoraciones).toFixed(1) : null;

      return { promedio, total: totalValoraciones };
    } catch (error) {
      console.error("Error al calcular la valoración: ", error);
      return { promedio: null, total: 0 };
    }
  };

  const fetchRatings = async (barbersList) => {
    const ratings = {};
    for (let barber of barbersList) {
      const { promedio, total } = await calcularPromedioValoraciones(barber.id);
      ratings[barber.id] = { promedio, total };
    }
    setRatings(ratings);
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const email = user.email;
          const clientRef = doc(db, 'Clientes', email);
          const clientSnap = await getDoc(clientRef);
      
          if (clientSnap.exists()) {
            setClientData(clientSnap.data());
            setClientId(clientSnap.id);
          } else {
            console.log('No se encontraron datos del cliente');
          }
        } else {
          console.log('Usuario no autenticado');
        }

        const barbersCollection = collection(db, 'Barberos');
        const barbersSnapshot = await getDocs(barbersCollection);
        const barbersList = barbersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBarbers(barbersList);

        const activeBarbers = barbersList.filter((barber) => barber.status === 'enable').length;

        const reservationsCollection = collection(db, 'Reservaciones');
        const reservationsSnapshot = await getDocs(reservationsCollection);
        const barberDates = {};

        reservationsSnapshot.forEach((doc) => {
          const { barberId, date } = doc.data();
          if (!barberDates[date]) {
            barberDates[date] = 0;
          }
          barberDates[date] += 1;
        });

        const disabledDatesSet = new Set();
        Object.keys(barberDates).forEach((date) => {
          if (barberDates[date] >= activeBarbers * 11) {
            disabledDatesSet.add(date);
          }
        });

        setDisabledDates([...disabledDatesSet]);

        await fetchRatings(barbersList);
    
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const fetchOccupiedTimes = async () => {
      if (selectedBarber && selectedDate) {
        const reservationsCollection = collection(db, 'Reservaciones');
        const reservationsQuery = query(
          reservationsCollection,
          where('barberId', '==', selectedBarber.id),
          where('date', '==', selectedDate)
        );
        const reservationsSnapshot = await getDocs(reservationsQuery);
        const times = reservationsSnapshot.docs.map((doc) => doc.data().time);
        setOccupiedTimes(times);
      }
    };

    fetchOccupiedTimes();
  }, [selectedBarber, selectedDate]);

  const handleDateChange = (e) => {
    const selected = e.target.value;
    const date = new Date(selected);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // Ensure we only compare the date part without time
    date.setHours(0, 0, 0, 0);
  
    // Allow selecting today and future dates
    if (date.getDay() === 6) {
      alert('No se puede seleccionar un domingo. Por favor, elige otra fecha.');
      setSelectedDate(''); // Clear selection if it's a Sunday
    } else if (disabledDates.includes(selected)) {
      alert('La fecha seleccionada está completa para todos los barberos. Por favor, elige otra fecha.');
      setSelectedDate(''); // Clear selection if date is disabled
    } else {
      setSelectedDate(selected); // Set selected date if valid
    }
  };
  
  

  const getTimeSlots = () => {
    const timeSlots = Array.from({ length: 12 }, (_, i) => `${10 + i}:00`);
    const today = new Date();
    const currentTime = today.getHours();
    
    if (selectedDate === today.toISOString().split('T')[0]) {
      return timeSlots.filter((timeSlot) => {
        const hour = parseInt(timeSlot.split(':')[0], 10);
        return hour > currentTime;
      });
    }

    return timeSlots;
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleBarberChange = (barber) => {
    setSelectedBarber(barber);
  };

  const handleConfirmClick = async () => {
    if (!selectedDate || !selectedTime || (!selectedBarber && !noBarberSelected)) {
      alert('Por favor, seleccione una fecha, un horario y un barbero.');
      return;
    }
  
    if (!clientData || !clientId) {
      alert('No se encontró información del cliente. Por favor, inicie sesión y verifique sus datos.');
      return;
    }
  
    try {
      const reservationData = {
        date: selectedDate,
        time: selectedTime,
        barberId: noBarberSelected ? null : selectedBarber.id,
        barberName: noBarberSelected ? 'Sin barbero' : selectedBarber.name,
        serviceName: service.serviceName,
        duration: service.duration,
        price: service.price,
        clientName: `${clientData.name} ${clientData.surname}`,
        clientPhone: clientData.phone,
        clientId: clientId,
        status: "PorConfirmar",
      };
  
      await addDoc(collection(db, 'Reservaciones'), reservationData);
  
      // Mostrar el toast de reservación exitosa
      toast.success('Reserva creada exitosamente.');
  
      // Cerrar el overlay después de un pequeño retraso para que el toast sea visible
      setTimeout(() => {
        onClose();
      }, 2000); // 2000 ms para que el toast sea visible antes de cerrar el overlay
  
    } catch (error) {
      console.error('Error al crear la reserva:', error);
      alert('Hubo un error al crear la reserva. Inténtalo de nuevo más tarde.');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="star-rating">
        {Array(fullStars).fill().map((_, index) => (
          <span key={`full-${index}`} className="star full">★</span>
        ))}
        {hasHalfStar && <span className="star half">☆</span>}
        {Array(emptyStars).fill().map((_, index) => (
          <span key={`empty-${index}`} className="star empty">☆</span>
        ))}
      </div>
    );
  };

  const minDate = new Date();
  const minDateString = minDate.toISOString().split('T')[0];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES').format(price);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="reservation-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Reserva para: {service.serviceName}</h2>
        <div className="reservation-details">
          <p>Duración: {service.duration} minutos</p>
          <p>Precio: ${formatPrice(service.price)}</p>
        </div>
        <div className="barber-selection">
          <label>Selecciona un barbero:</label>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="no-barber-checkbox"
              checked={noBarberSelected}
              onChange={() => setNoBarberSelected(!noBarberSelected)}
            />
            <label htmlFor="no-barber-checkbox" className="checkbox-label">No tengo barbero</label>
          </div>
  
          {!noBarberSelected && (
            <div className="barber-list">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className={`barber-card ${selectedBarber === barber ? 'selected' : ''} ${barber.status === 'disable' ? 'disabled' : ''}`}
                  onClick={() => barber.status === 'enable' && handleBarberChange(barber)}
                  style={barber.status === 'disable' ? { backgroundColor: '#d3d3d3' } : {}}
                >
                  {barber.photoUrl ? (
                    <img src={barber.photoUrl} alt={barber.name} className="barber-photo" />
                  ) : (
                    <div className="no-photo">Sin foto</div>
                  )}
                  <p className="barber-name">{barber.name}</p>
                  <div className="star-rating">
                    {ratings[barber.id] && renderStars(ratings[barber.id].promedio)}
                  </div>
                  <p>({ratings[barber.id] ? ratings[barber.id].total : 0})</p>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="date-selection">
          <label htmlFor="date-select">Selecciona una fecha:</label>
          <input
            type="date"
            id="date-select"
            value={selectedDate}
            onChange={handleDateChange}
            min={minDateString}
            disabled={disabledDates.includes(selectedDate)}
          />
        </div>
  
        <div className="time-selection">
          <label htmlFor="time-select">Selecciona un horario:</label>
          <select id="time-select" value={selectedTime} onChange={handleTimeChange}>
            <option value="">Selecciona un horario</option>
            {getTimeSlots().map((time, index) => (
              <option key={index} value={time} disabled={occupiedTimes.includes(time)}>
                {time}
              </option>
            ))}
          </select>
        </div>
  
        <button className="cancel-button" onClick={onClose}>Cancelar</button>
        <button className="confirm-button" onClick={handleConfirmClick}>Confirmar Reserva</button>
      </div>
      <ToastContainer />
    </div>
  );
  
};

export default Reservation;
