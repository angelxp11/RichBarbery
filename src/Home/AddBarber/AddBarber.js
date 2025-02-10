import React, { useState, useEffect } from "react";
import "./AddBarber.css"; // Asegúrate de tener estos estilos configurados
import { db } from "../../firebase"; // Importa la instancia de Firestore
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, increment, setDoc, onSnapshot } from "firebase/firestore"; // Importa funciones de Firestore
import { toast, ToastContainer } from "react-toastify"; // Importa toast y ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Importa los estilos de toast
import { FaPlus, FaTrash, FaArrowLeft, FaEdit, FaMoneyBillWave, FaChevronDown } from "react-icons/fa"; // Importa iconos
import LoadingScreen from "../../Resources/LoadingScreen/LoadingScreen"; // Import LoadingScreen
import NequiIcon from '../../Resources/NEQUI.svg';
import DaviplataIcon from '../../Resources/DAVIPLATA.svg';
import TarjetaIcon from '../../Resources/TARJETA.svg';
import EfectivoIcon from '../../Resources/EFECTIVO.svg';
import ItauIcon from '../../Resources/itau.svg'; // Import ItauIcon

const AddBarber = ({ adminName, isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [skills, setSkills] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editBarberId, setEditBarberId] = useState(null); // Add state for editBarberId
  const [paymentBarber, setPaymentBarber] = useState(null); // Add state for paymentBarber
  const [showPaymentDetails, setShowPaymentDetails] = useState(false); // Add state for showing payment details
  const [selectedDates, setSelectedDates] = useState([]); // Add state for selected dates
  const [paymentMethods, setPaymentMethods] = useState([]); // Add state for payment methods
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Add state for showing payment modal
  const [paymentAmount, setPaymentAmount] = useState(0); // Add state for payment amount
  const [movements, setMovements] = useState({}); // Add state for movements
  const [currentPage, setCurrentPage] = useState(1); // Add state for current page
  const [daysPerPage, setDaysPerPage] = useState(7); // Add state for days per page
  const [selectAll, setSelectAll] = useState(false); // Add state for select all checkbox
  const [status, setStatus] = useState("enable"); // Add state for status
  const [showLoading, setShowLoading] = useState(false); // Add state for loading screen
  const paymentsPerPage = 7; // Number of payments per page

  const totalPages = paymentBarber ? Math.ceil(Object.keys(paymentBarber.caja).length / daysPerPage) : 1;
  const currentPayments = paymentBarber ? Object.keys(paymentBarber.caja).reverse().slice((currentPage - 1) * daysPerPage, currentPage * daysPerPage) : [];

  useEffect(() => {
    if (showDelete) {
      const unsubscribe = onSnapshot(collection(db, "Barberos"), (snapshot) => {
        const barbersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBarbers(barbersList);
      });
      return () => unsubscribe();
    }
  }, [showDelete]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "MetodosDePago"), (snapshot) => {
      const methodsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentMethods(methodsList);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Movimientos"), (snapshot) => {
      const movementsData = snapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});
      setMovements(movementsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectAll) {
      setSelectedDates(currentPayments);
    } else {
      setSelectedDates([]);
    }
  }, [selectAll, currentPayments.length]);

  const fetchBarbers = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Barberos"));
    const barbersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBarbers(barbersList);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteBarber = async (id) => {
    setIsSubmitting(true);
    await deleteDoc(doc(db, "Barberos", id));
    toast.success("Barbero eliminado con éxito!", {
      onClose: () => {
        fetchBarbers();
        setConfirmDelete(null);
        onClose();
      }
    });
    setIsSubmitting(false);
  };

  const handleEdit = (barber) => {
    setEditBarberId(barber.id);
    setPhotoUrl(barber.photoUrl);
    setName(barber.name);
    setSurname(barber.surname);
    setSkills(barber.skills);
    setStatus(barber.status); // Set status when editing
    setShowForm(true);
  };

  const handlePayment = async (barber) => {
    setLoading(true);
    const barberCajaRef = doc(db, "Caja", barber.id);
    const barberCajaDoc = await getDoc(barberCajaRef);
    if (barberCajaDoc.exists()) {
      setPaymentBarber({ ...barber, caja: barberCajaDoc.data() });
    } else {
      setPaymentBarber({ ...barber, caja: {} });
    }
    setLoading(false);
  };

  const handleAddBarberClick = () => {
    setPhotoUrl("");
    setName("");
    setSurname("");
    setSkills("");
    setEditBarberId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const barberData = {
        name,
        surname,
        skills,
        photoUrl,
        status, // Include status in barber data
      };

      if (editBarberId) {
        await updateDoc(doc(db, "Barberos", editBarberId), barberData);
        toast.success("Barbero actualizado con éxito!", {
          autoClose: 400, // Set toast duration to 1 second
          onClose: () => {
            fetchBarbers();
            setShowForm(false); // Close the form after editing
          },
        });
      } else {
        await addDoc(collection(db, "Barberos"), barberData);
        toast.success("Barbero agregado con éxito!", {
          autoClose: 1000, // Set toast duration to 1 second
          onClose: () => {
            fetchBarbers();
            setShowForm(false); // Close the form after adding
          },
        });
      }

      // Reset form
      setPhotoUrl("");
      setName("");
      setSurname("");
      setSkills("");
      setEditBarberId(null);
    } catch (error) {
      toast.error("Error al agregar/actualizar barbero.");
    }
    setIsSubmitting(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('addBarber-modal-overlay')) {
      onClose();
    }
  };

  const togglePaymentDetails = (e) => {
    const paymentInfo = e.currentTarget.closest('.addBarber-payment-item').querySelector('.addBarber-payment-info');
    if (paymentInfo) {
      paymentInfo.classList.toggle('show');
      e.currentTarget.classList.toggle('rotate');
    }
  };

  const handleCheckboxChange = (date) => {
    setSelectedDates(prevSelectedDates =>
      prevSelectedDates.includes(date)
        ? prevSelectedDates.filter(d => d !== date)
        : [...prevSelectedDates, date]
    );
  };

  const handleDaysPerPageChange = (e) => {
    const value = e.target.value;
    if (value === "SEMANAL") {
      setDaysPerPage(7);
    } else if (value === "QUINCENAL") {
      setDaysPerPage(15);
    } else if (value === "MENSUAL") {
      setDaysPerPage(30);
    }
    setCurrentPage(1); // Reset to the first page
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePayTip = () => {
    if (selectedDates.length === 0) {
      toast.error("Seleccione al menos una fecha.");
      return;
    }
    for (const date of selectedDates) {
      if (paymentBarber.caja[date].tippaid) {
        toast.error(`La propina del ${formatDate(date)} ya fue pagada. Deselecciónala para proceder con el pago.`);
        return;
      }
    }
    setPaymentAmount(totals.totalTip);
    setShowPaymentModal(true);
  };

  const handlePayDay = () => {
    if (selectedDates.length === 0) {
      toast.error("Seleccione al menos una fecha.");
      return;
    }
    for (const date of selectedDates) {
      if (paymentBarber.caja[date].amountpaid) {
        toast.error(`El monto del ${formatDate(date)} ya fue pagado. Deselecciónala para proceder con el pago.`);
        return;
      }
    }
    setPaymentAmount(totals.totalAmount);
    setShowPaymentModal(true);
  };

  const handlePayBoth = () => {
    if (selectedDates.length === 0) {
      toast.error("Seleccione al menos una fecha.");
      return;
    }
    for (const date of selectedDates) {
      if (paymentBarber.caja[date].tippaid || paymentBarber.caja[date].amountpaid) {
        toast.error(`El monto o la propina del ${formatDate(date)} ya fueron pagados. Deselecciónala para proceder con el pago.`);
        return;
      }
    }
    setPaymentAmount(totals.totalBoth);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodClick = async (method, description) => {
    setShowLoading(true); // Show loading screen
    const now = new Date();
    const paymentMethodRef = doc(db, "MetodosDePago", method.id);

    try {
      for (const date of selectedDates) {
        const paymentMethodDoc = await getDoc(paymentMethodRef);
        const availableAmount = paymentMethodDoc.data()[date]?.amount || 0;

        if (availableAmount < paymentAmount / selectedDates.length) {
          toast.error(`Fondos insuficientes en el método de pago seleccionado para la fecha ${formatDate(date)}.`);
          setShowLoading(false); // Hide loading screen
          return;
        }
      }

      // Disable cursor to prevent multiple clicks
      document.body.style.cursor = 'not-allowed';

      for (const date of selectedDates) {
        await updateDoc(paymentMethodRef, {
          [`${date}.amount`]: increment(-paymentAmount / selectedDates.length)
        });

        const saldoRef = doc(db, "Caja", "Saldo");
        await updateDoc(saldoRef, {
          [`${date}.amount`]: increment(-paymentAmount / selectedDates.length)
        });

        const barberCajaRef = doc(db, "Caja", paymentBarber.id);
        // Si la propina es 0, marcar tippaid como true
        if (totals.totalTip === 0) {
          await updateDoc(barberCajaRef, {
            [`${date}.tippaid`]: true
          });
        }

        if (paymentAmount === totals.totalTip) {
          await updateDoc(barberCajaRef, {
            [`${date}.tippaid`]: true
          });
        } else if (paymentAmount === totals.totalAmount) {
          await updateDoc(barberCajaRef, {
            [`${date}.amountpaid`]: true
          });
        } else if (paymentAmount === totals.totalBoth) {
          await updateDoc(barberCajaRef, {
            [`${date}.tippaid`]: true,
            [`${date}.amountpaid`]: true
          });
        }
      }

      // Registrar movimiento en Movimientos
      const movimientoId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const movimientoData = {
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, // Fecha actual
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Hora actual
        value: paymentAmount, // Valor del pago
        type: "EGRESO",
        responsible: adminName, // Admin responsable
        paymentMethod: method.id, // Método de pago usado
        description: description // Descripción del pago
      };

      await setDoc(doc(db, "Caja", "Movimientos"), { [movimientoId]: movimientoData }, { merge: true });

      setShowPaymentModal(false);
      toast.success("Pago realizado con éxito!");
      fetchBarbers(); // Actualiza la UI después del pago
      setPaymentBarber(null); // Reinicia el estado del barbero
      setSelectedDates([]); // Desmarca todas las fechas
    } catch (error) {
      toast.error("Error al realizar el pago.");
    } finally {
      // Re-enable cursor
      document.body.style.cursor = 'default';
      setShowLoading(false); // Hide loading screen
    }
  };

  const calculateTotals = (caja, selectedDates) => {
    let totalAmount = 0;
    let totalTip = 0;

    selectedDates.forEach(date => {
      if (caja[date]) {
        totalAmount += caja[date].amount;
        totalTip += caja[date].tip;
      }
    });

    return {
      totalAmount,
      totalTip,
      totalBoth: totalAmount + totalTip
    };
  };

  const formatDate = (dateString) => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const year = dateString.substring(0, 4);
    const month = months[parseInt(dateString.substring(4, 6)) - 1];
    const day = parseInt(dateString.substring(6, 8));
    return `${day} De ${month} ${year}`;
  };

  const getPaymentStatusClass = (paid) => (paid ? 'paid' : 'unpaid');

  const getPaymentItemStyle = (amountPaid, tipPaid) => {
    if (!amountPaid && !tipPaid) {
      return { backgroundColor: 'var(--color-sinpagar)' };
    } else if (amountPaid && !tipPaid) {
      return { background: 'linear-gradient(to right, var(--color-pagado) 50%, var(--color-sinpagar) 50%)' };
    } else if (!amountPaid && tipPaid) {
      return { background: 'linear-gradient(to right, var(--color-sinpagar) 50%, var(--color-pagado) 50%)' };
    } else if (amountPaid && tipPaid) {
      return { backgroundColor: 'var(--color-pagado)' };
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'NEQUI':
        return <img src={NequiIcon} alt="Nequi" className="payment-icons" />;
      case 'DAVIPLATA':
        return <img src={DaviplataIcon} alt="Daviplata" className="payment-icons" />;
      case 'TARJETA':
        return <img src={TarjetaIcon} alt="Tarjeta" className="payment-icons" />;
      case 'EFECTIVO':
        return <img src={EfectivoIcon} alt="Efectivo" className="payment-icons" />;
      case 'ITAU':
        return <img src={ItauIcon} alt="Itau" className="payment-icons" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const totals = paymentBarber ? calculateTotals(paymentBarber.caja, selectedDates) : { totalAmount: 0, totalTip: 0, totalBoth: 0 };

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

  return (
    <div className="addBarber-modal-overlay" onClick={handleOverlayClick}>
      {showLoading && <LoadingScreen />} {/* Show loading screen */}
      <div className="addBarber-modal-container addBarber-animated-modal">
        {!showForm && !showDelete && !paymentBarber ? (
          <div className="addBarber-button-group centered">
            <button className="addBarber-animated-btn" onClick={handleAddBarberClick}>
              <FaPlus /> Agregar Barbero
            </button>
            <button className="addBarber-animated-btn" onClick={() => setShowDelete(true)}>
              <FaTrash /> Borrar Barbero
            </button>
          </div>
        ) : showForm ? (
          <div className="addBarber-form-container">
            <div className="addBarber-header">
              <button className="addBarber-back-btn" onClick={() => setShowForm(false)}>
                <FaArrowLeft />
              </button>
              <h2>{editBarberId ? "Editar Barbero" : "Agregar Barbero"}</h2> {/* Update header */}
            </div>
            <form className="addBarber-form-content" onSubmit={handleSubmit}>
              <div className="addBarber-input-group">
                <label htmlFor="photo-url" className="addBarber-upload-icon">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="addBarber-photo-preview" />
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
              <div className="addBarber-input-group">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="addBarber-input-group">
                <label htmlFor="surname">Apellido</label>
                <input
                  type="text"
                  id="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
              <div className="addBarber-input-group">
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
              <div className="addBarber-input-group">
                <label htmlFor="status">Estado</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="enable">Activado</option>
                  <option value="disable">Desactivado</option>
                </select>
              </div>
              <div className="addBarber-form-actions">
                <button type="button" onClick={onClose} className="addBarber-cancel-btn">
                  Cancelar
                </button>
                <button type="submit" className="addBarber-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Procesando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        ) : paymentBarber ? (
          <div className="addBarber-form-container">
            <div className="addBarber-header">
              <button className="addBarber-back-btn" onClick={() => setPaymentBarber(null)}>
                <FaArrowLeft />
              </button>
              <h2>Pago a {paymentBarber.name} {paymentBarber.surname}</h2>
            </div>
            <div className="addBarber-payment-controls">
              <select onChange={handleDaysPerPageChange} value={daysPerPage === 7 ? "SEMANAL" : daysPerPage === 15 ? "QUINCENAL" : "MENSUAL"}>
                <option value="SEMANAL">SEMANAL</option>
                <option value="QUINCENAL">QUINCENAL</option>
                <option value="MENSUAL">MENSUAL</option>
              </select>
            </div>
            <div className="addBarber-payment-details" style={{ maxHeight: '400px', overflowY: 'scroll', overflowX: 'hidden', backgroundColor: 'var(--color-muy-claro)' }}>
              {currentPayments.map(date => (
                <div key={date} className="addBarber-payment-item" style={getPaymentItemStyle(paymentBarber.caja[date].amountpaid, paymentBarber.caja[date].tippaid)}>
                  <div className="addBarber-payment-top">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(date)}
                        onChange={() => handleCheckboxChange(date)}
                        disabled={paymentBarber.caja[date].tippaid && paymentBarber.caja[date].amountpaid} // Disable if both tip and amount are paid
                      />
                      {formatDate(date)}
                    </label>
                    <button className="addBarber-chevron-btn" onClick={togglePaymentDetails}>
                      <FaChevronDown />
                    </button>
                  </div>
                  <div className="addBarber-payment-info">
                    <div className="addBarber-payment-amount-tip">
                      {getPaymentMethodIcon(paymentBarber.caja[date].paymentMethod)} {/* Add payment method icon */}
                      <div className={getPaymentStatusClass(paymentBarber.caja[date].amountpaid)}>
                        Amount: ${formatNumber(paymentBarber.caja[date].amount)}
                      </div>
                      <div className={getPaymentStatusClass(paymentBarber.caja[date].tippaid)}>
                        Tip: ${formatNumber(paymentBarber.caja[date].tip)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <label className="addBarber-select-all">
              <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
              Seleccionar toda la página
            </label>
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
            <div className="addBarber-payment-actions">
              <div className="addBarber-total-container">
                <div>Total Amount: ${formatNumber(totals.totalAmount)}</div>
                <div>Total Tip: ${formatNumber(totals.totalTip)}</div>
                <div>Total Both: ${formatNumber(totals.totalBoth)}</div>
              </div>
              <div className="addBarber-payment-buttons">
                <button className="addBarber-payment-btn" onClick={handlePayTip}>Pagar Propina</button>
                <button className="addBarber-payment-btn" onClick={handlePayDay}>Pagar Día</button>
                <button className="addBarber-payment-btn" onClick={handlePayBoth}>Pagar Ambos</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="addBarber-header">
              <button className="addbarberbutton" onClick={() => setShowDelete(false)}>
                <FaArrowLeft />
              </button>
              <h2>Barberos Disponibles</h2> {/* También dentro del modal */}
            </div>
            {loading ? (
              <div className="addBarber-loader">Cargando...</div>
            ) : (
              <ul className="addBarber-barber-list">
                {barbers.map(barber => (
                  <li key={barber.id} className="addBarber-barber-item">
                    <img src={barber.photoUrl} alt="Barber" className="addBarber-barber-photo" />
                    <div className="addBarber-barber-details">
                      {barber.name} {barber.surname}
                    </div>
                    <div className="addBarber-action-buttons">
                      <button className="addBarber-edit-btn" onClick={() => handleEdit(barber)} disabled={isSubmitting}>
                        <FaEdit />
                      </button>
                      <button className="addBarber-delete-btn" onClick={() => handleDelete(barber.id)} disabled={isSubmitting}>
                        <FaTrash />
                      </button>
                      <button className="addBarber-payment-btn" onClick={() => handlePayment(barber)} disabled={isSubmitting}>
                        <FaMoneyBillWave />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {confirmDelete && (
        <>
          <div className="addBarber-modal-overlay"></div>
          <div className="addBarber-confirm-modal addBarber-animated-modal">
            <h3>¿Estás seguro de que deseas eliminar este barbero?</h3>
            <div className="addBarber-confirm-actions">
              <button className="addBarber-confirm-btn" onClick={() => confirmDeleteBarber(confirmDelete)} disabled={isSubmitting}>Sí</button>
              <button className="addBarber-confirm-btn" onClick={() => setConfirmDelete(null)} disabled={isSubmitting}>No</button>
            </div>
          </div>
        </>
      )}
      {showPaymentModal && (
        <>
          <div className="addBarber-modal-overlay"></div>
          <div className="addBarber-payment-modal addBarber-animated-modal">
            <h3>Seleccione un método de pago</h3>
            <ul className="addBarber-payment-methods">
              {paymentMethods.map(method => (
                <li key={method.id} onClick={() => handlePaymentMethodClick(method, paymentAmount === totals.totalTip ? "Pago de Propina" : paymentAmount === totals.totalAmount ? "Pago de Día" : "Pago de Ambos")}>
                  {getPaymentMethodIcon(method.id)}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowPaymentModal(false)}>Cancelar</button>
          </div>
        </>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddBarber;
