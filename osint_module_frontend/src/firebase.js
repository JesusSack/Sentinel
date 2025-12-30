// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdM9Mxit9yjCN-0zHlleLAONOfcfglLa4",
  authDomain: "osint-demo-e2f58.firebaseapp.com",
  projectId: "osint-demo-e2f58",
  storageBucket: "osint-demo-e2f58.firebasestorage.app",
  messagingSenderId: "474298650482",
  appId: "1:474298650482:web:69cc04a98ea57d058d57eb",
  measurementId: "G-9NSM69P83F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);