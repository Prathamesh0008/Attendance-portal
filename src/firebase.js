import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrlXdtAGIvm0gT4U_9ispdTZerA4ngN5E",
  authDomain: "nova-attendance-1bf55.firebaseapp.com",
  projectId: "nova-attendance-1bf55",
  storageBucket: "nova-attendance-1bf55.appspot.com",
  messagingSenderId: "1059401009724",
  appId: "1:1059401009724:web:a39aeb314635d6e4571139",
  measurementId: "G-9SNLK3SHJZ",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
