// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import getAuth

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyBbR7jhiAx8TVz3BRJre-zIiKRYIIjNBlM",
    authDomain: "inventory-app-cc2f3.firebaseapp.com",
    projectId: "inventory-app-cc2f3",
    storageBucket: "inventory-app-cc2f3.appspot.com",
    messagingSenderId: "853179883034",
    appId: "1:853179883034:web:f78ebbb6897c8be9eebba3",
    measurementId: "G-DXP7PEQ5CB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Conditionally initialize Firebase Analytics only on the client side
let analytics;
if (typeof window !== "undefined") {
    analytics = getAnalytics(app); // Initialize analytics only if window is available
}

// Initialize Firebase Auth
const auth = getAuth(app); // Add this line to initialize auth

export { app, analytics, auth }; // Export auth
