'use strict';

import InMemoryStorage from './in-memory-storage';

const STORE_KEY = 'session';
const storage = new InMemoryStorage();

/**
 * Instance of the Defer class is just a handy wrapper around native Promise
 * object intended to provide dedicated 'resolve' and 'reject' methods.
 */
export default class SessionStore {
  /**
   * Returns single item from the session store.
   *
   * @param {string} itemKey Key of the item to retrieve.
   * @return {*}
   */
  static get(itemKey) {
    return storage.getByKey(STORE_KEY, itemKey).catch(() => {
      throw new Error(`There is no item (${itemKey}) in the session store.`);
    });
  }

  /**
   * Adds/updates item to/in session store.
   *
   * @param {string} itemKey Key of the item to save.
   * @param {*} itemData Item data to save.
   * @return {Promise}
   */
  static set(itemKey, itemData) {
    return storage.set(STORE_KEY, itemKey, itemData);
  }

  /**
   * Removes item from the session store.
   *
   * @param {string} itemKey Key of the item to remove.
   * @return {Promise}
   */
  static remove(itemKey) {
    return storage.remove(STORE_KEY, itemKey);
  }
}
