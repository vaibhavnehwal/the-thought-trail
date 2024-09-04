import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {

    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

    authDomain: "the-thought-trail.firebaseapp.com",

    projectId: "the-thought-trail",

    storageBucket: "the-thought-trail.appspot.com",

    messagingSenderId: "275761395005",

    appId: "1:275761395005:web:4203429889be68badc0154"

};


const app = initializeApp(firebaseConfig);

// google auth

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {

    let user = null;

    await signInWithPopup(auth, provider)
        .then((result) => {
            user = result.user
        })
        .catch((err) => {
            console.log(err)
        })

    return user;
}