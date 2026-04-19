/**
 * services/firebaseService.ts — Orin Builder
 *
 * Uses the IDENTICAL Firebase project as orin-ai-f6798 (www.orinai.org).
 * Same project + Google OAuth = SSO: signing in with the same Google account
 * on either product is seamless.
 *
 * Cross-subdomain SSO path:
 *   Main app → builder.orinai.org?ot=<idToken>
 *   attemptSSOFromUrl() below exchanges the token via Firebase Functions.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  signInWithCustomToken, onAuthStateChanged, signOut, setPersistence,
  browserLocalPersistence, type Auth, type User,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, query,
  where, orderBy, getDocs, addDoc, deleteDoc, serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { UserAccount, BuilderProject } from '../types';
import { FIRESTORE, SSO_PARAM } from '../config';

// ── Same config as Orin AI main app — do NOT change these values ─────────────
const FIREBASE_CONFIG = {
  apiKey:            process.env.FIREBASE_API_KEY ?? 'AIzaSyB5rY4e-_GOkkl4qwDZuvHqwq0_IP9mFmA',
  authDomain:        'orin-ai-f6798.firebaseapp.com',
  projectId:         'orin-ai-f6798',
  storageBucket:     'orin-ai-f6798.firebasestorage.app',
  messagingSenderId: '259788442094',
  appId:             process.env.FIREBASE_APP_ID ?? '1:259788442094:web:4d946378ca1b4d7349a6ff',
  measurementId:     'G-57DHESH4ZJ',
};

class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.app  = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(this.app);
    this.db   = getFirestore(this.app);
    setPersistence(this.auth, browserLocalPersistence).catch(() => {});
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  onAuthChanged(cb: (u: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, cb);
  }

  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      const { user } = await signInWithPopup(this.auth, provider);
      return user;
    } catch (err: any) {
      const blockedCodes = [
        'auth/popup-blocked','auth/popup-closed-by-user',
        'auth/cancelled-popup-request','auth/web-storage-unsupported',
      ];
      if (blockedCodes.includes(err?.code)) {
        await signInWithRedirect(this.auth, provider);
        return null;
      }
      throw err;
    }
  }

  async logout(): Promise<void> { await signOut(this.auth); }

  getCurrentUser(): User | null { return this.auth.currentUser; }

  /**
   * SSO Bridge — called on mount.
   * If the main Orin AI app navigated here with ?ot=<idToken>, exchange it
   * for a custom token via the issueCustomToken Cloud Function.
   *
   * To enable this, add to your functions/index.js:
   *   exports.issueCustomToken = functions.https.onRequest(async (req, res) => {
   *     const { idToken } = req.body;
   *     const decoded = await admin.auth().verifyIdToken(idToken);
   *     const customToken = await admin.auth().createCustomToken(decoded.uid);
   *     res.json({ customToken });
   *   });
   */
  async attemptSSOFromUrl(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const idToken = params.get(SSO_PARAM);
    if (!idToken) return false;
    try {
      const res = await fetch(
        'https://us-central1-orin-ai-f6798.cloudfunctions.net/issueCustomToken',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) },
      );
      if (!res.ok) return false;
      const { customToken } = await res.json();
      await signInWithCustomToken(this.auth, customToken);
      // Remove token from URL
      const clean = new URL(window.location.href);
      clean.searchParams.delete(SSO_PARAM);
      window.history.replaceState({}, '', clean.toString());
      return true;
    } catch { return false; }
  }

  // ── User Profiles ──────────────────────────────────────────────────────────

  async upsertUser(fbUser: User): Promise<UserAccount> {
    const ref  = doc(this.db, FIRESTORE.users, fbUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserAccount;
      // Keep avatar / name fresh
      await updateDoc(ref, { name: fbUser.displayName ?? data.name, avatar: fbUser.photoURL ?? data.avatar });
      return { ...data, name: fbUser.displayName ?? data.name, avatar: fbUser.photoURL ?? undefined };
    }
    const account: UserAccount = {
      id: fbUser.uid, name: fbUser.displayName ?? 'User',
      email: fbUser.email ?? '', avatar: fbUser.photoURL ?? undefined,
      tier: 'Free', plan: 'free',
      dailyUsage: { text: 0, images: 0, videos: 0 },
    };
    await setDoc(ref, { ...account, createdAt: serverTimestamp() });
    return account;
  }

  // ── Builder Projects ───────────────────────────────────────────────────────

  async saveProject(project: BuilderProject): Promise<string> {
    const payload = { ...project, updatedAt: serverTimestamp() };
    if (project.id) {
      await updateDoc(doc(this.db, FIRESTORE.builderProjects, project.id), payload);
      return project.id;
    }
    const ref = await addDoc(collection(this.db, FIRESTORE.builderProjects), {
      ...payload, createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async getUserProjects(userId: string): Promise<BuilderProject[]> {
    const q    = query(
      collection(this.db, FIRESTORE.builderProjects),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as BuilderProject));
  }

  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(this.db, FIRESTORE.builderProjects, id));
  }
}

export const firebaseService = new FirebaseService();
