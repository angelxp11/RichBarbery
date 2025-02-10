import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './Dashboard.css';
import arrowImage from '../../Resources/flecha.png';
import Dinero from '../Dinero/Dinero.js'; // Import the Dinero component
import LoadingScreen from '../../Resources/LoadingScreen/LoadingScreen'; // Import LoadingScreen component

function Dashboard({ adminName, adminPhoto }) {
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true); // Add loading state
  const movementsPerPage = 10; // Change to 10 movements per page

  useEffect(() => {
    const docRef = doc(db, 'Caja', 'Movimientos');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const movementsData = docSnap.data();
        const movementsList = Object.keys(movementsData).map(key => ({
          ...movementsData[key],
          id: key
        }));
        movementsList.sort((a, b) => b.id.localeCompare(a.id)); // Sort by custom date format in descending order
        setMovements(movementsList);
        setLoading(false); // Set loading to false after data is fetched
      }
    });

    return () => unsubscribe();
  }, []);

  const formatValue = (value) => {
    return value ? `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : '$0';
  };

  const filteredMovements = movements.filter(movement => {
    return movement.responsible && typeof movement.responsible === 'string' && movement.responsible.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const groupMovementsByDate = (movements) => {
    return movements.reduce((acc, movement) => {
      const date = movement.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(movement);
      return acc;
    }, {});
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    } else {
      return `${parseInt(day)} de ${monthNames[parseInt(month) - 1]} de ${year}`;
    }
  };

  const totalPages = Math.ceil(filteredMovements.length / movementsPerPage);
  const currentMovements = filteredMovements.slice((currentPage - 1) * movementsPerPage, currentPage * movementsPerPage);
  const groupedMovements = groupMovementsByDate(currentMovements); // Group only the current page movements

  const renderPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage > totalPages - 3) {
        pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pageNumbers;
  };

  if (loading) {
    return <LoadingScreen />; // Render LoadingScreen while loading
  }

  return (
    <div className="dashboard-main-content">
      <h1>Bienvenido a RichBarbery {adminName}</h1>
      {adminPhoto && (
        <div className="admin-photo-container">
          <img src={adminPhoto} alt="Admin" className="admin-photo" />
        </div>
      )}
      <p>Welcome to the RichBarbery Dashboard!</p>

      {/* Add Dinero component here */}
      <Dinero />

      <div className="movements-container">
        <h2>Movimientos</h2>
        <div className="filter-container">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="movements-list">
          {Object.keys(groupedMovements).map(date => (
            <div key={date}>
              <h3>{formatDate(date)}</h3>
              <ul>
                {groupedMovements[date].map((movement, index) => (
                  <li key={index} className={movement.type === 'INGRESO' ? 'ingreso' : movement.type === 'EGRESO' ? 'egreso' : ''}>
                    <div className="movement-info">
                      {movement.type === 'INGRESO' && <img src={arrowImage} alt="Arrow Up" className="arrow-up" />}
                      {movement.type === 'EGRESO' && <img src={arrowImage} alt="Arrow Down" className="arrow-down" style={{ transform: 'rotate(180deg)' }} />}
                      <span className="responsible"><b>{movement.responsible}</b></span>
                    </div>
                    <span className="movement-value">{formatValue(movement.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            &lt;
          </button>
          {renderPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              className={currentPage === page ? 'active' : ''}
              disabled={typeof page !== 'number'}
            >
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;