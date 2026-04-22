/**
 * services/buildCache.ts — Orin Builder
 *
 * IndexedDB-backed cache for generated builds.
 * Stores the full ArtifactBundle (including HTML) locally so revisiting
 * a project is instant — no Firestore round-trip needed for the heavy content.
 *
 * TTL: 7 days. Max entries: 50. Eviction: LRU on overflow.
 */

import type { ArtifactBundle, BuilderProject } from '../types';

const DB_NAME    = 'orin-builder-cache';
const DB_VERSION = 1;
const STORE_NAME = 'builds';
const TTL_MS     = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ITEMS  = 50;

interface CacheEntry {
  projectId: string;
  bundle:    ArtifactBundle;
  blueprint: BuilderProject['blueprint'];
  databasePlan: BuilderProject['databasePlan'];
  cachedAt:  number;
  accessedAt: number;
}

class BuildCacheService {
  private db: IDBDatabase | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { resolve(); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
          store.createIndex('accessedAt', 'accessedAt');
        }
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      req.onerror = () => resolve(); // non-fatal
    });
  }

  private tx(mode: IDBTransactionMode) {
    return this.db?.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  /** Cache a completed project's heavy data locally. */
  async set(project: BuilderProject): Promise<void> {
    await this.ready;
    if (!this.db || !project.id || !project.bundle?.files?.length) return;
    const entry: CacheEntry = {
      projectId:   project.id,
      bundle:      project.bundle,
      blueprint:   project.blueprint,
      databasePlan: project.databasePlan,
      cachedAt:    Date.now(),
      accessedAt:  Date.now(),
    };
    try {
      await this.idbPut(entry);
      await this.evict();
    } catch { /* non-fatal */ }
  }

  /** Retrieve cached bundle for a project. Returns null on miss/expiry. */
  async get(projectId: string): Promise<Pick<BuilderProject, 'bundle' | 'blueprint' | 'databasePlan'> | null> {
    await this.ready;
    if (!this.db) return null;
    try {
      const entry = await this.idbGet(projectId) as CacheEntry | undefined;
      if (!entry) return null;
      if (Date.now() - entry.cachedAt > TTL_MS) {
        await this.idbDelete(projectId);
        return null;
      }
      // Update access time
      entry.accessedAt = Date.now();
      await this.idbPut(entry);
      return { bundle: entry.bundle, blueprint: entry.blueprint, databasePlan: entry.databasePlan };
    } catch { return null; }
  }

  /** Merge cached heavy data back into a lightweight Firestore project. */
  async hydrate(project: BuilderProject): Promise<BuilderProject> {
    if (!project.id) return project;
    // Already has HTML content — no need to hydrate
    const hasContent = project.bundle?.files?.some(f => f.path === 'index.html' && f.content?.length > 100);
    if (hasContent) return project;

    const cached = await this.get(project.id);
    if (!cached) return project;
    return {
      ...project,
      bundle:      cached.bundle      ?? project.bundle,
      blueprint:   cached.blueprint   ?? project.blueprint,
      databasePlan: cached.databasePlan ?? project.databasePlan,
    };
  }

  async delete(projectId: string): Promise<void> {
    await this.ready;
    if (!this.db) return;
    await this.idbDelete(projectId).catch(() => {});
  }

  async clear(): Promise<void> {
    await this.ready;
    if (!this.db) return;
    const store = this.tx('readwrite');
    store?.clear();
  }

  private evict(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      const store = this.tx('readwrite');
      if (!store) { resolve(); return; }
      const idx = store.index('accessedAt');
      const req = idx.openCursor();
      const toDelete: string[] = [];
      let count = 0;
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) { count++; cursor.continue(); return; }
        // If over limit, remove oldest (first) entries
        if (count > MAX_ITEMS) {
          const excess = count - MAX_ITEMS;
          const req2 = idx.openCursor();
          let deleted = 0;
          req2.onsuccess = (e2) => {
            const c = (e2.target as IDBRequest).result;
            if (c && deleted < excess) {
              c.delete(); deleted++; c.continue();
            } else { resolve(); }
          };
          req2.onerror = () => resolve();
        } else { resolve(); }
      };
      req.onerror = () => resolve();
    });
  }

  private idbPut(value: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.tx('readwrite')?.put(value);
      if (!req) { resolve(); return; }
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private idbGet(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = this.tx('readonly')?.get(key);
      if (!req) { resolve(undefined); return; }
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private idbDelete(key: string): Promise<void> {
    return new Promise((resolve) => {
      const req = this.tx('readwrite')?.delete(key);
      if (!req) { resolve(); return; }
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }
}

export const buildCache = new BuildCacheService();
