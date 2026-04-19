/**
 * services/firebaseService.ts — Orin Builder
 *
 * Uses the same Firebase project as orinai.org (orin-ai-f6798).
 * Same project + LOCAL persistence = SSO: any Google account signed in on
 * orinai.org is automatically recognized here.
 *
 * Cross-subdomain SSO (builder.orinai.org):
 *   Main app navigates here with ?ot=<idToken>.
 *   attemptSSOFromUrl() exchanges it via the issueCustomToken Cloud Function.
 *
 * Firestore collections used by this product:
 *   /users/{uid}               — shared with main app (read/merge only)
 *   /builder_projects/{docId}  — owned by this product
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  signInWithCustomToken, onAuthStateChanged, signOut, setPersistence,
  browserLocalPersistence, Auth, User,
} from 'firebase/auth';
import {
  getFirestore, Firestore,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs, addDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { UserAccount, BuilderProject } from '../types';
import { SSO_PARAM, FIRESTORE } from '../config';

// ── Same Firebase config as orinai.org — do NOT change ──────────────────────
const FIREBASE_CONFIG = {
  apiKey:            process.env.FIREBASE_API_KEY ?? 'AIzaSyB5rY4e-_GOkkl4qwDZuvHqwq0_IP9mFmA',
  authDomain:        'orin-ai-f6798.firebaseapp.com',
  projectId:         'orin-ai-f6798',
  storageBucket:     'orin-ai-f6798.firebasestorage.app',
  messagingSenderId: '259788442094',
  appId:             process.env.FIREBASE_APP_ID ?? '1:259788442094:web:4d946378ca1b4d7349a6ff',
  measurementId:     'G-57DHESH4ZJ',
};

// Firestore document fields that are too large to persist (strip before write)
const STRIP_FROM_PERSISTENCE = ['bundle.files'];

function stripLargeFields(project: BuilderProject): Record<string, unknown> {
  // Store the HTML separately to avoid Firestore 1MB document limit
  const { bundle, ...rest } = project as any;
  const safeBundle = bundle ? {
    ...bundle,
    files: (bundle.files ?? []).map((f: any) => ({
      path: f.path,
      language: f.language,
      sizeBytes: f.sizeBytes ?? f.content?.length ?? 0,
      // Omit content — too large for Firestore. Re-fetch from storage if needed.
      contentPreview: f.content?.slice(0, 200),
    })),
    // Keep full SQL and API markdown (small)
    db_schema:     bundle.db_schema,
    api_contracts: bundle.api_contracts,
  } : undefined;

  return { ...rest, bundle: safeBundle };
}

class FirebaseService {
  private app:  FirebaseApp;
  private auth: Auth;
  private db:   Firestore;

  constructor() {
    this.app  = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(this.app);
    this.db   = getFirestore(this.app);
    setPersistence(this.auth, browserLocalPersistence).catch(console.error);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

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
      const BLOCKED = [
        'auth/popup-blocked','auth/popup-closed-by-user',
        'auth/cancelled-popup-request','auth/web-storage-unsupported',
      ];
      if (BLOCKED.includes(err?.code)) {
        await signInWithRedirect(this.auth, provider);
        return null;
      }
      throw err;
    }
  }

  async logout(): Promise<void> { await signOut(this.auth); }

  getCurrentUser(): User | null { return this.auth.currentUser; }

  /**
   * Cross-subdomain SSO:
   * Called on mount when main app navigates here with ?ot=<idToken>.
   * Exchanges the short-lived idToken for a custom token via Cloud Function.
   */
  async attemptSSOFromUrl(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get(SSO_PARAM);
    if (!token) return false;
    try {
      const res = await fetch(
        'https://us-central1-orin-ai-f6798.cloudfunctions.net/issueCustomToken',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) },
      );
      if (!res.ok) return false;
      const { customToken } = await res.json();
      await signInWithCustomToken(this.auth, customToken);
      const clean = new URL(window.location.href);
      clean.searchParams.delete(SSO_PARAM);
      window.history.replaceState({}, '', clean.toString());
      return true;
    } catch (e) {
      console.warn('[firebase] SSO exchange failed:', e);
      return false;
    }
  }

  // ── User Profiles ─────────────────────────────────────────────────────────

  /**
   * Upsert the user document in /users/{uid}.
   * On first Builder login: creates a minimal account (Free tier by default).
   * On subsequent logins: refreshes name and avatar only (preserves tier/plan from main app).
   */
  async upsertUser(fbUser: User): Promise<UserAccount> {
    const ref  = doc(this.db, FIRESTORE.users, fbUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const existing = snap.data() as UserAccount;
      // Non-destructive update: only refresh display fields
      await updateDoc(ref, {
        name:   fbUser.displayName ?? existing.name,
        avatar: fbUser.photoURL    ?? existing.avatar ?? null,
      });
      return {
        ...existing,
        name:   fbUser.displayName ?? existing.name,
        avatar: fbUser.photoURL    ?? existing.avatar,
      };
    }

    // First sign-in on Builder — create minimal account
    const account: UserAccount = {
      id:         fbUser.uid,
      name:       fbUser.displayName ?? 'User',
      email:      fbUser.email       ?? '',
      avatar:     fbUser.photoURL    ?? undefined,
      tier:       'Free',
      plan:       'free',
      dailyUsage: { text: 0, images: 0, videos: 0 },
    };
    await setDoc(ref, { ...account, createdAt: serverTimestamp(), source: 'builder' });
    return account;
  }

  // ── Builder Projects ──────────────────────────────────────────────────────

  /**
   * Save or update a BuilderProject in Firestore.
   * Large HTML content is stripped before writing (Firestore 1MB limit).
   * Returns the Firestore document ID.
   */
  async saveProject(project: BuilderProject): Promise<string> {
    const safe    = stripLargeFields(project);
    const payload = { ...safe, updatedAt: serverTimestamp() };

    if (project.id) {
      await updateDoc(doc(this.db, FIRESTORE.builderProjects, project.id), payload);
      return project.id;
    }

    const ref = await addDoc(
      collection(this.db, FIRESTORE.builderProjects),
      { ...payload, createdAt: serverTimestamp() },
    );
    return ref.id;
  }

  async getUserProjects(userId: string): Promise<BuilderProject[]> {
    const q = query(
      collection(this.db, FIRESTORE.builderProjects),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data() as any;
      // Convert Firestore Timestamps to ISO strings
      return {
        ...data,
        id:        d.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as BuilderProject;
    });
  }

  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(this.db, FIRESTORE.builderProjects, id));
  }
}

export const firebaseService = new FirebaseService();
