// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDrkwgiPqWlYzXVIcNmPzFWgIVL4fAtCv4",
  authDomain: "richbarbery-fe0de.firebaseapp.com",
  projectId: "richbarbery-fe0de",
  storageBucket: "richbarbery-fe0de.firebasestorage.app",
  messagingSenderId: "930479631975",
  appId: "1:930479631975:web:edd572a930109844b02ec2",
  measurementId: "G-1LQP6NS4RZ"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // Asegúrate de exportar `db`
