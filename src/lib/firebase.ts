
"use client";
import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {getStorage} from 'firebase/storage';

// Your web app's Firebase configuration is automatically provided by Firebase App Hosting.
const firebaseConfig = {
  "projectId": "hackthon-e7xuj",
  "appId": "1:7919745878:web:92f26fb183878dbe3334f7",
  "storageBucket": "hackthon-e7xuj.appspot.com",
  "apiKey": "AIzaSyCXdmf4zicHxUsPkcZxkrHiWq8ks-1IqlY",
  "authDomain": "hackthon-e7xuj.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "7919745878"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
