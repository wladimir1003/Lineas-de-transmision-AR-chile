const DB = {
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(APP_CONFIG.db.name, APP_CONFIG.db.version);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(APP_CONFIG.db.storeName)) {
          db.createObjectStore(APP_CONFIG.db.storeName, { keyPath: "id" });
        }
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  },

  async save(id, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(APP_CONFIG.db.storeName, "readwrite");
      tx.objectStore(APP_CONFIG.db.storeName).put({
        id,
        data,
        fecha: new Date().toISOString()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = e => reject(e.target.error);
    });
  },

  async get(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(APP_CONFIG.db.storeName, "readonly");
      const req = tx.objectStore(APP_CONFIG.db.storeName).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = e => reject(e.target.error);
    });
  },

  deleteDatabase() {
    return new Promise(resolve => {
      const req = indexedDB.deleteDatabase(APP_CONFIG.db.name);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
      req.onblocked = () => resolve(false);
    });
  }
};
