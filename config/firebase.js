// Firebase設定
export const firebaseConfig = {
    apiKey: "AIzaSyABTIK8Xwj0fcdWL2T7Z2le9_UDoXdu10U",
    authDomain: "virtual-office-team.firebaseapp.com",
    databaseURL: "https://virtual-office-team-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "virtual-office-team",
    storageBucket: "virtual-office-team.firebasestorage.app",
    messagingSenderId: "904879677778",
    appId: "1:904879677778:web:ac4c511b383b02c4b35a8b"
};

// Firebase初期化
export function initializeFirebase() {
    let database = null;
    let isFirebaseEnabled = false;

    if (firebaseConfig.apiKey !== "your-api-key-here") {
        try {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            isFirebaseEnabled = true;
            console.log('Firebase接続成功 - リアルタイム音声通話が利用可能');
        } catch (error) {
            console.log('Firebase接続失敗、ローカルモードで動作:', error);
        }
    }

    return { database, isFirebaseEnabled };
} 