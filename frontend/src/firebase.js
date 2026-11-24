// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA6TXpeyl89I3SMkjZWaeMApO7nV86P7zw",
    authDomain: "smart-community-health-6a9ea.firebaseapp.com",
    projectId: "smart-community-health-6a9ea",
    storageBucket: "smart-community-health-6a9ea.firebasestorage.app",
    messagingSenderId: "1003383390612",
    appId: "1:1003383390612:web:1ed23044a09a0355bd8f81",
    measurementId: "G-K5TEY53RZF"
};

const vapidKey = "BBWN59MoQQaQSrU2B6D5hfJwAioht85_q5nX9bW-UL25y5LK0sTtiXTuP7rIoK0XbSR76cLjPQTcrwXV6agKB-4";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);