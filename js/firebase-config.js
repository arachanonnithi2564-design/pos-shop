/* ============================================================
   Firebase Config + Initialization
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyArL7sB2GrQWRW8N6nJEgyRaT3ArquuVGo",
  authDomain: "pos-shop-4d399.firebaseapp.com",
  projectId: "pos-shop-4d399",
  storageBucket: "pos-shop-4d399.firebasestorage.app",
  messagingSenderId: "324338549646",
  appId: "1:324338549646:web:c8c905a51b218e1fc1dadf"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  console.warn('Persistence error:', err.code);
});

let currentUser = null;
let currentUserId = null;