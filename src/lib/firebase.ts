import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

async function updateUserDocument(user: User) {
  if (!db) return;
  
  console.log("Updating user document in Firestore...");
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Tempo limite esgotado ao salvar dados no Firestore. Verifique se o banco de dados Firestore foi criado no console.")), 10000)
  );

  const role = user.email === 'edergrp@gmail.com' ? 'admin' : 'student';

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData: any = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: role,
      isSubscribed: role === 'admin',
      updatedAt: serverTimestamp(),
    };

    if (!userDoc.exists()) {
      userData.createdAt = serverTimestamp();
    }

    const firestorePromise = setDoc(userRef, userData, { merge: true });
    await Promise.race([firestorePromise, timeoutPromise]);
    console.log("User document updated successfully");
  } catch (error) {
    console.error("Error in updateUserDocument:", error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string, name: string) {
  if (!auth) return null;
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    await updateUserDocument(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error signing up with email:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  if (!auth) return null;
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await updateUserDocument(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with email:", error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  if (!auth) return;
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

export async function signInWithGoogle() {
  if (!auth || !db) {
    console.error("Firebase Auth or DB not initialized");
    return null;
  }
  try {
    console.log("Starting Google Sign In popup...");
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("Google Sign In successful, user:", user.email);
    
    await updateUserDocument(user);
    
    return user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function signInWithFacebook() {
  if (!auth || !db) {
    console.error("Firebase Auth or DB not initialized");
    return null;
  }
  try {
    console.log("Starting Facebook Sign In popup...");
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    console.log("Facebook Sign In successful, user:", user.email);
    
    await updateUserDocument(user);
    
    return user;
  } catch (error: any) {
    console.error("Error signing in with Facebook:", error);
    throw error;
  }
}
