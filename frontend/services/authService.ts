import {
    signInAnonymously,
    onAuthStateChanged,
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import { useUserStore } from "../store/useUserStore";

export const ensureAnonymousUser = (): Promise<User> => {
    return new Promise((resolve, reject) => {
        if (!firebaseAuth) {
            reject(new Error("Firebase Configuration is missing. Please update your .env file with real credentials from the Firebase Console."));
            return;
        }

        const unsubscribe = onAuthStateChanged(firebaseAuth!, async (user) => {
            if (user) {
                // Sync with store
                useUserStore.getState().setUserId(user.uid, user.isAnonymous);
                unsubscribe();
                resolve(user);
            } else {
                try {
                    const userCredential = await signInAnonymously(firebaseAuth!);
                    useUserStore.getState().setUserId(userCredential.user.uid, true);
                    unsubscribe();
                    resolve(userCredential.user);
                } catch (error) {
                    reject(error);
                }
            }
        });
    });
};

export const signUp = async (email: string, pass: string): Promise<User> => {
    if (!firebaseAuth) throw new Error("Firebase Configuration is missing or invalid. Please update your .env file.");
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    useUserStore.getState().setUserId(userCredential.user.uid, false);
    return userCredential.user;
};

export const loginEmail = async (email: string, pass: string): Promise<User> => {
    if (!firebaseAuth) throw new Error("Firebase Configuration is missing or invalid. Please update your .env file.");
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
    useUserStore.getState().setUserId(userCredential.user.uid, false);
    return userCredential.user;
};

export const logout = async () => {
    if (firebaseAuth) {
        await firebaseAuth.signOut();
        useUserStore.getState().clearUser();
    }
};
