import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBE_5NvG7cYnw_cssw7YfvVxEHtp4M-Ajc",
  authDomain: "grapixlk-online.firebaseapp.com",
  projectId: "grapixlk-online",
  storageBucket: "grapixlk-online.firebasestorage.app",
  messagingSenderId: "18083338347",
  appId: "1:18083338347:web:258b32ee4fe9c4d2bef92e",
  measurementId: "G-YS4KLHLBL2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
