// Keeps a reader's PDF annotations in this browser, one record per paper.
// IndexedDB rather than localStorage, because annotations can hold dates and binary data.

const DB_NAME = "pyqs";
const STORE = "annotations";

let dbPromise: Promise<IDBDatabase> | undefined;

function openDb(): Promise<IDBDatabase> {
	dbPromise ??= new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	return dbPromise;
}

async function run<T>(
	mode: IDBTransactionMode,
	action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const request = action(db.transaction(STORE, mode).objectStore(STORE));
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

// Storage can be blocked, as in some private windows. The viewer then works as before, without saving.
async function loadAnnotations<T>(key: string): Promise<T[]> {
	try {
		return ((await run("readonly", (store) => store.get(key))) as T[]) ?? [];
	} catch {
		return [];
	}
}

async function saveAnnotations<T>(key: string, items: T[]): Promise<void> {
	try {
		if (items.length > 0) {
			await run("readwrite", (store) => store.put(items, key));
		} else {
			await run("readwrite", (store) => store.delete(key));
		}
	} catch {
		// See loadAnnotations.
	}
}

export { loadAnnotations, saveAnnotations };
