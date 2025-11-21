// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIrguSmKo3vlIY3z1CnKojuOGxxNL0zKk",
  authDomain: "shop-ad5e2.firebaseapp.com",
  projectId: "shop-ad5e2",
  storageBucket: "shop-ad5e2.firebasestorage.app",
  messagingSenderId: "368378342486",
  appId: "1:368378342486:web:8381dab984f2bae9d7dff7"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);