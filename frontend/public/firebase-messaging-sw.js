importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "smart-community-health-6a9ea",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background notification received:", payload);

    const notificationTitle =
        payload.notification?.title || "HealthGuard AI";

    const notificationOptions = {
        body: payload.notification?.body || "You have a new health notification.",
        icon: "/logo.png"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});