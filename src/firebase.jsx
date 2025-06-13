// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database'; // ✅ ADD this

const firebaseConfig = {
 
  apiKey: "AIzaSyAzSQD5tPZQz5Q2DfId4lsyoD9hGsUxfqs",
  authDomain: "smart-home-4f289.firebaseapp.com",
  databaseURL: "https://smart-home-4f289-default-rtdb.firebaseio.com", // ✅ THIS is correct
  projectId: "smart-home-4f289",
  storageBucket: "smart-home-4f289.appspot.com",
  messagingSenderId: "60255822609",
  appId: "1:60255822609:web:0717020da2e4a6ba9962b0",
  measurementId: "G-5J0PB0N09S"


};
// databaseURL:'https://console.firebase.google.com/u/0/project/smart-home-4f289/database/smart-home-4f289-default-rtdb/data/~2F'
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // ✅ ADD this

export { auth, db }; // ✅ Export the database
