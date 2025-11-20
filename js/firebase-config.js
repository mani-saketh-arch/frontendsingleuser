/**
 * Firebase Configuration for Admin Panel
 * Initialize Firebase and export authentication functions
 */

console.log('🔥 Firebase config loading...');

// Your Firebase configuration (from Step 1)
const firebaseConfig = {
    apiKey: "AIzaSyBahRdy5417ojz5Od85gvZKRjOXaCbVOUo",
    authDomain: "e-commerce-75f46.firebaseapp.com",
    projectId: "e-commerce-75f46",
    storageBucket: "e-commerce-75f46.firebasestorage.app",
    messagingSenderId: "872626062394",
    appId: "1:872626062394:web:2562956dd206031208a103",
    measurementId: "G-H5SG91RLB8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Auth instance
const auth = firebase.auth();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

console.log('✅ Firebase initialized successfully');

// Export for use in other files
window.FirebaseAuth = {
    auth: auth,
    googleProvider: googleProvider,
    
    /**
     * Sign in with email and password
     */
    signInWithEmail: async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error('❌ Email sign-in failed:', error);
            throw error;
        }
    },
    
    /**
     * Sign in with Google popup
     */
    signInWithGoogle: async () => {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            return result.user;
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            throw error;
        }
    },
    
    /**
     * Sign out
     */
    signOut: async () => {
        try {
            await auth.signOut();
            console.log('✅ Firebase sign-out successful');
        } catch (error) {
            console.error('❌ Firebase sign-out failed:', error);
            throw error;
        }
    },
    
    /**
     * Get current Firebase ID token
     */
    getIdToken: async () => {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user signed in');
        }
        return await user.getIdToken();
    },
    
    /**
     * Check if user is signed in
     */
    isSignedIn: () => {
        return !!auth.currentUser;
    },
    
    /**
     * Get current user
     */
    getCurrentUser: () => {
        return auth.currentUser;
    },
    
    /**
     * Listen to auth state changes
     */
    onAuthStateChanged: (callback) => {
        return auth.onAuthStateChanged(callback);
    }
};

console.log('✅ FirebaseAuth object ready');