'use strict';

export default class LocalStorage {
  static isSupported() {
    try {
      return !!self.localStorage && Number.isInteger(self.localStorage.length);
    } catch(e) {
      return false;
    }
  }

  /**
   * Gets all items from the specified store.
   *
   * @param {string} storeKey Key of the store to retrieve all items from.
   * @return {Promise.<Array>}
   */
  getAll(storeKey) {
    const serializedStore = localStorage.getItem(storeKey);

    return Promise.resolve(
      serializedStore ?
        Array.from((new Map(JSON.parse(serializedStore))).values()) : []
    );
  }

  /**
   * Returns single item from the store by item's key.
   *
   * @param {string} storeKey Key of the store to retrieve item from.
   * @param {string} itemKey Key of the item to retrieve.
   * @return {*}
   */
  getByKey(storeKey, itemKey) {
    const serializedStore = localStorage.getItem(storeKey);
    const store = new Map(serializedStore ? JSON.parse(serializedStore) : []);

    if (!store.has(itemKey)) {
      return Promise.reject(
        new Error(`There is no item (${itemKey}) in the store (${storeKey}).`)
      );
    }

    return Promise.resolve(store.get(itemKey));
  }

  /**
   * Adds/updates item to/in specified store.
   *
   * @param {string} storeKey Key of the store to save item to.
   * @param {string} itemKey Key of the item to save.
   * @param {*} itemData Item data to save.
   * @return {Promise}
   */
  set(storeKey, itemKey, itemData) {
    const serializedStore = localStorage.getItem(storeKey);

    const store = new Map(serializedStore ? JSON.parse(serializedStore) : []);
    store.set(itemKey, itemData);

    localStorage.setItem(storeKey, JSON.stringify(Array.from(store.entries())));

    return Promise.resolve();
  }

  /**
   * Removes item from the specified store.
   *
   * @param {string} storeKey Key of the store to remove item from.
   * @param {string} itemKey Key of the item to remove.
   * @return {Promise}
   */
  remove(storeKey, itemKey) {
    const serializedStore = localStorage.getItem(storeKey);

    if (serializedStore) {
      const store = new Map(JSON.parse(serializedStore));
      store.delete(itemKey);

      localStorage.setItem(
        storeKey, JSON.stringify(Array.from(store.entries()))
      );
    }

    return Promise.resolve();
  }

  /**
   * Entirely clears specified store.
   *
   * @param {string} storeKey Key of the store to clear.
   * @return {Promise}
   */
  clear(storeKey) {
    localStorage.removeItem(storeKey);

    return Promise.resolve();
  }

  /**
   * Clears all available stores.
   *
   * @return {Promise}
   */
  clearAll() {
    localStorage.clear();
    return Promise.resolve();
  }
}
