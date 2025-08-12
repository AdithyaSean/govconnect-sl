
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from '@/lib/firebase';


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as User);
                } else {
                    console.warn(`No Firestore profile found for user: ${currentUser.uid}`);
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching Firestore user profile:", error);
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                 getDoc(doc(db, "users", firebaseUser.uid)).then(userDoc => {
                    if (userDoc.exists()) {
                        setUser({ id: userDoc.id, ...userDoc.data() } as User);
                    } else {
                        setUser(null);
                    }
                 }).catch(error => {
                    console.error("Error fetching user document:", error);
                    setUser(null);
                 }).finally(() => {
                    setLoading(false);
                 });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return { user, loading, refetch: fetchUser };
}
