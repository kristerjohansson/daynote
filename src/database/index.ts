import {
  AnniversariesAddArgs,
  AnniversariesDeleteArgs,
  AnniversariesGetArgs,
  AnniversariesIndexes,
  AnniversariesPutArgs,
  AnniversariesWhereQueryType,
  anniversary,
  getAnniversariesId,
} from './anniversaries';
import {
  NotesAddArgs,
  NotesDeleteArgs,
  NotesGetArgs,
  NotesIndexes,
  NotesPutArgs,
  NotesWhereQueryType,
  getNotesId,
  note,
} from './notes';

type RangeQuery<ArgType, ReturnType> = {
  isGreaterThan(arg: ArgType): ReturnType;
  isGreaterThanOrEqualTo(arg: ArgType): ReturnType;
  isLessThan(arg: ArgType): ReturnType;
  isLessThanOrEqualTo(arg: ArgType): ReturnType;
  isBetween(arg: { from: ArgType; to: ArgType }): ReturnType;
  isEqualTo(arg: ArgType): ReturnType;
};

export type SubscriptionEvent<ItemType, PrimaryKeyType> =
  | {
      type: 'add' | 'put';
      data: ItemType;
    }
  | {
      type: 'delete';
      data: PrimaryKeyType;
    };

export type Client<TItem, TAddArgs, TPutArgs, TDeleteArgs, TGetArgs, TIndexes, TWhereQueryType> = {
  subscribe(
    eventName: 'change' | 'add' | 'put' | 'delete',
    callback: (event: SubscriptionEvent<TItem, number>) => void,
  ): void;
  add(
    arg: TAddArgs,
    options?: {
      transaction?: IDBTransaction;
    },
  ): Promise<TItem>;
  put(
    arg: TPutArgs,
    options?: {
      transaction?: IDBTransaction;
    },
  ): Promise<TItem>;
  delete(
    arg: TDeleteArgs,
    options?: {
      transaction?: IDBTransaction;
    },
  ): Promise<void>;
  get(
    arg: TGetArgs,
    options?: {
      transaction?: IDBTransaction;
    },
  ): Promise<TItem>;
  where<IndexName extends TIndexes>(
    indexName: IndexName,
    options?: {
      transaction?: IDBTransaction;
    },
  ): RangeQuery<TWhereQueryType, Promise<ReadonlyArray<TItem>>>;
  sortBy(
    indexName: TIndexes,
    options?: {
      transaction?: IDBTransaction;
      count?: number;
    },
  ): Promise<ReadonlyArray<TItem>>;
};

function createTableClient<TItem, TAddArgs, TPutArgs, TDeleteArgs, TGetArgs, TIndexes, TWhereQueryType>(
  db: IDBDatabase,
  tableName: string,
  getId: (arg: TGetArgs | TDeleteArgs) => number,
): Client<TItem, TAddArgs, TPutArgs, TDeleteArgs, TGetArgs, TIndexes, TWhereQueryType> {
  class Observable<ItemType, PrimaryKeyType> {
    listeners: Map<string, Map<number, (event: SubscriptionEvent<ItemType, PrimaryKeyType>) => void>> = new Map();

    nextId = 0;

    subscribe(
      eventName: 'change' | 'add' | 'put' | 'delete',
      callback: (event: SubscriptionEvent<ItemType, PrimaryKeyType>) => void,
    ): void {
      if (this.listeners.has(eventName)) {
        this.listeners.get(eventName)?.set?.(this.nextId, callback);
      } else {
        const innerMap: Map<number, (event: SubscriptionEvent<ItemType, PrimaryKeyType>) => void> = new Map();
        innerMap.set(this.nextId, callback);
        this.listeners.set(eventName, innerMap);
      }
      this.nextId += 1;
    }

    _push(eventName: 'delete', data: PrimaryKeyType): void;
    _push(eventName: 'add' | 'put', data: ItemType): void;
    _push(eventName: 'add' | 'put' | 'delete', data: ItemType | PrimaryKeyType): void {
      this.listeners.get('change')?.forEach?.(callback => {
        callback({ type: eventName, data } as SubscriptionEvent<ItemType, PrimaryKeyType>);
      });
      this.listeners.get(eventName)?.forEach?.(callback => {
        callback({ type: eventName, data } as SubscriptionEvent<ItemType, PrimaryKeyType>);
      });
    }
  }

  class ClientImpl extends Observable<TItem, number> {
    add(
      arg: TAddArgs,
      options?: {
        transaction?: IDBTransaction;
      },
    ): Promise<TItem> {
      return new Promise((resolve, reject) => {
        const tx = options?.transaction ?? db.transaction([tableName], 'readwrite');
        const store = tx.objectStore(tableName);
        const DBAddRequest: IDBRequest = store.add({
          ...arg,
        });
        DBAddRequest.onerror = () => {
          if (DBAddRequest != null) {
            reject(DBAddRequest.error);
          } else {
            reject(new Error('Unknown error occurred trying to perform operation'));
          }
        };
        DBAddRequest.onsuccess = () => {
          if (DBAddRequest != null) {
            const mergedResult: TItem = {
              ...arg,
              date: DBAddRequest.result,
            } as TItem;
            this._push('add', mergedResult);
            resolve(mergedResult);
          } else {
            reject(new Error('Operation produced a null result'));
          }
        };
      });
    }

    put(
      arg: TPutArgs,
      options?: {
        transaction?: IDBTransaction;
      },
    ): Promise<TItem> {
      return new Promise((resolve, reject) => {
        const tx = options?.transaction ?? db.transaction([tableName], 'readwrite');
        const store = tx.objectStore(tableName);
        const DBPutRequest: IDBRequest = store.put({
          ...arg,
        });
        DBPutRequest.onerror = () => {
          if (DBPutRequest != null) {
            reject(DBPutRequest.error);
          } else {
            reject(new Error('Unknown error occurred trying to perform operation'));
          }
        };
        DBPutRequest.onsuccess = () => {
          if (DBPutRequest != null) {
            const mergedResult: TItem = {
              ...arg,
              date: DBPutRequest.result,
            } as TItem;
            this._push('put', mergedResult);
            resolve(mergedResult);
          } else {
            reject(new Error('Operation produced a null result'));
          }
        };
      });
    }

    delete(
      arg: TDeleteArgs,
      options?: {
        transaction?: IDBTransaction;
      },
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const tx = options?.transaction ?? db.transaction([tableName], 'readwrite');
        const store = tx.objectStore(tableName);
        const idToDelete = getId(arg);
        const DBDeleteRequest: IDBRequest = store.delete(idToDelete);
        if (DBDeleteRequest != null) {
          DBDeleteRequest.onerror = () => {
            if (DBDeleteRequest != null) {
              reject(DBDeleteRequest.error);
            } else {
              reject(new Error('Unknown error occurred trying to perform operation'));
            }
          };
          DBDeleteRequest.onsuccess = () => {
            this._push('delete', idToDelete);
            resolve(undefined);
          };
        } else {
          reject(new Error('No available index for given query'));
        }
      });
    }

    get(
      arg: TGetArgs,
      options?: {
        transaction?: IDBTransaction;
      },
    ): Promise<TItem> {
      return new Promise((resolve, reject) => {
        const tx = options?.transaction ?? db.transaction([tableName], 'readonly');
        const store = tx.objectStore(tableName);
        let DBGetRequest: IDBRequest | null = null;
        const idToGet = getId(arg);
        DBGetRequest = store.get(idToGet);
        if (DBGetRequest != null) {
          DBGetRequest.onerror = () => {
            if (DBGetRequest != null) {
              reject(DBGetRequest.error);
            } else {
              reject(new Error('Unknown error occurred trying to perform operation'));
            }
          };
          DBGetRequest.onsuccess = () => {
            if (DBGetRequest != null && DBGetRequest.result != null) {
              resolve((DBGetRequest as IDBRequest).result);
            } else {
              reject(new Error('No result found for query'));
            }
          };
        } else {
          reject(new Error('No available index for given query'));
        }
      });
    }

    where<IndexName extends TIndexes>(
      indexName: IndexName,
      options: {
        transaction?: IDBTransaction;
        withJoins: false;
      },
    ): RangeQuery<TWhereQueryType, Promise<ReadonlyArray<TItem>>> {
      const tx = options?.transaction ?? db.transaction([tableName], 'readonly');
      const store = tx.objectStore(tableName);
      const executeQuery = (target: IDBObjectStore | IDBIndex, range: IDBKeyRange) => {
        return new Promise<ReadonlyArray<TItem>>((resolve, reject) => {
          const DBGetRequest: IDBRequest = target.getAll(range);
          if (DBGetRequest != null) {
            DBGetRequest.onerror = () => {
              if (DBGetRequest != null) {
                reject(DBGetRequest.error);
              } else {
                reject(new Error('Unknown error occurred trying to perform operation'));
              }
            };
            DBGetRequest.onsuccess = () => {
              if (DBGetRequest != null && DBGetRequest.result != null) {
                resolve((DBGetRequest as IDBRequest).result);
              } else {
                reject(new Error('No result found for query'));
              }
            };
          } else {
            reject(new Error('No available index for given query'));
          }
        });
      };
      return {
        isGreaterThan(query) {
          switch (indexName) {
            case 'date': {
              return executeQuery(store, IDBKeyRange.lowerBound(query, true));
            }
            default: {
              return Promise.reject(new Error('Trying to run query on unknown index: ' + indexName));
            }
          }
        },
        isGreaterThanOrEqualTo(query) {
          switch (indexName) {
            case 'date': {
              return executeQuery(store, IDBKeyRange.lowerBound(query, false));
            }
            default: {
              return Promise.reject(new Error('Trying to run query on unknown index: ' + indexName));
            }
          }
        },
        isLessThan(query) {
          switch (indexName) {
            case 'date': {
              return executeQuery(store, IDBKeyRange.upperBound(query, true));
            }
            default: {
              return Promise.reject(new Error('Trying to run query on unknown index: ' + indexName));
            }
          }
        },
        isLessThanOrEqualTo(query) {
          switch (indexName) {
            case 'date': {
              return executeQuery(store, IDBKeyRange.upperBound(query, false));
            }
            default: {
              return Promise.reject(new Error('Trying to run query on unknown index: ' + indexName));
            }
          }
        },
        isBetween(query) {
          switch (indexName) {
            case 'date': {
              return executeQuery(store, IDBKeyRange.bound(query.from, query.to, false, false));
            }
            default: {
              return Promise.reject(new Error('Trying to run query on unknown index: ' + indexName));
            }
          }
        },
        isEqualTo(query) {
          switch (indexName) {
            case 'date': {
              return executeQuery(store, IDBKeyRange.only(query));
            }
            default: {
              return Promise.reject(new Error('Trying to run query on unknown index: ' + indexName));
            }
          }
        },
      };
    }

    sortBy(
      indexName: TIndexes,
      options: {
        transaction?: IDBTransaction;
        withJoins: false;
        count?: number;
      },
    ): Promise<ReadonlyArray<TItem>> {
      return new Promise((resolve, reject) => {
        const tx = options?.transaction ?? db.transaction([tableName], 'readonly');
        const store = tx.objectStore(tableName);
        let DBGetRequest: IDBRequest | null = null;
        switch (indexName) {
          case 'date': {
            DBGetRequest = store.getAll(undefined, options?.count);
            break;
          }
          default: {
            throw new Error('Trying to run query on unknown index: ' + indexName);
          }
        }
        if (DBGetRequest != null) {
          DBGetRequest.onerror = () => {
            if (DBGetRequest != null) {
              reject(DBGetRequest.error);
            } else {
              reject(new Error('Unknown error occurred trying to perform operation'));
            }
          };
          DBGetRequest.onsuccess = () => {
            if (DBGetRequest != null && DBGetRequest.result != null) {
              resolve((DBGetRequest as IDBRequest).result);
            } else {
              reject(new Error('No result found for query'));
            }
          };
        } else {
          reject(new Error('No available index for given query'));
        }
      });
    }
  }

  return new ClientImpl();
}

export type DaynotedataClient = {
  transaction: (storeNames: Array<'notes' | 'anniversaries'>, mode?: IDBTransactionMode) => IDBTransaction;
  notes: Client<
    note,
    NotesAddArgs,
    NotesPutArgs,
    NotesDeleteArgs,
    NotesGetArgs,
    NotesIndexes,
    NotesWhereQueryType<NotesIndexes>
  >;
  anniversaries: Client<
    anniversary,
    AnniversariesAddArgs,
    AnniversariesPutArgs,
    AnniversariesDeleteArgs,
    AnniversariesGetArgs,
    AnniversariesIndexes,
    AnniversariesWhereQueryType<AnniversariesIndexes>
  >;
};

function createDatabaseClient(db: IDBDatabase): DaynotedataClient {
  const notesClient = createTableClient<
    note,
    NotesAddArgs,
    NotesPutArgs,
    NotesDeleteArgs,
    NotesGetArgs,
    NotesIndexes,
    NotesWhereQueryType<NotesIndexes>
  >(db, 'notes', getNotesId);
  const anniversariesClient = createTableClient<
    anniversary,
    AnniversariesAddArgs,
    AnniversariesPutArgs,
    AnniversariesDeleteArgs,
    AnniversariesGetArgs,
    AnniversariesIndexes,
    AnniversariesWhereQueryType<AnniversariesIndexes>
  >(db, 'anniversaries', getAnniversariesId);
  return {
    transaction: (storeNames: Array<'notes' | 'anniversaries'>, mode?: IDBTransactionMode): IDBTransaction => {
      return db.transaction(storeNames, mode);
    },
    notes: notesClient,
    anniversaries: anniversariesClient,
  };
}

export function init(): Promise<DaynotedataClient> {
  return new Promise((resolve, reject) => {
    function createObjectStore(db: IDBDatabase, storeName: string, options: IDBObjectStoreParameters): IDBObjectStore {
      if (DBOpenRequest.transaction == null) {
        throw new Error('Error opening database. Open request transaction is null.');
      }
      if (db.objectStoreNames.contains(storeName)) {
        return DBOpenRequest.transaction.objectStore(storeName);
      } else {
        return db.createObjectStore(storeName, options);
      }
    }

    function removeUnusedIndexes(store: IDBObjectStore, indexNames: ReadonlyArray<string>): void {
      for (const indexName of Array.from(store.indexNames)) {
        if (indexNames.includes(indexName) === false) {
          store.deleteIndex(indexName);
        }
      }
    }

    const DBOpenRequest = window.indexedDB.open('daynotedata', 1);

    DBOpenRequest.onerror = () => {
      reject(new Error('Error opening database: daynotedata'));
    };

    DBOpenRequest.onsuccess = () => {
      const db = DBOpenRequest.result;
      resolve(createDatabaseClient(db));
    };

    DBOpenRequest.onupgradeneeded = () => {
      const db = DBOpenRequest.result;
      const notesStore = createObjectStore(db, 'notes', { keyPath: 'date' });
      removeUnusedIndexes(notesStore, []);
      const anniversariesStore = createObjectStore(db, 'anniversaries', { keyPath: 'date' });
      removeUnusedIndexes(anniversariesStore, []);
    };
  });
}
