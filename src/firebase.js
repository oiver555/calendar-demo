// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // if using Firestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDiH2CgGqh0UCiVoUoRnvVDANj8DKUvCvY",
  authDomain: "hwv---booking-plugin.firebaseapp.com",
  projectId: "hwv---booking-plugin",
  storageBucket: "hwv---booking-plugin.firebasestorage.app",
  messagingSenderId: "719495287161",
  appId: "1:719495287161:web:3b8ef3c89f90368cd15fa8",
  measurementId: "G-K592KCZRM8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);