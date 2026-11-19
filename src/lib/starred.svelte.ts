import { createSubscriber } from "svelte/reactivity";
import {
	parseStarred,
	STARRED_KEY,
	type StarredFile,
	toggleStarred,
} from "./starred";

function readStorage(): StarredFile[] {
	try {
		return parseStarred(localStorage.getItem(STARRED_KEY));
	} catch {
		// No storage on the server, and it can be blocked, as in some private windows.
		return [];
	}
}

// One store per page, shared by every island, and kept in sync with other tabs through storage events.
// Islands should show stars only after they mount, since the server renders none.
class StarredStore {
	#files = $state.raw<StarredFile[]>(readStorage());
	#subscribe = createSubscriber((update) => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== STARRED_KEY) return;
			this.#files = parseStarred(event.newValue);
			update();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	});

	get files(): StarredFile[] {
		this.#subscribe();
		return this.#files;
	}

	has(path: string): boolean {
		return this.files.some((file) => file.path === path);
	}

	toggle(file: Omit<StarredFile, "starredAt">) {
		// Storage is the source of truth. A tab with no islands left stops hearing storage events, so its copy can be stale.
		let current = this.#files;
		try {
			current = parseStarred(localStorage.getItem(STARRED_KEY));
		} catch {
			// Keep the copy in memory.
		}
		this.#save(toggleStarred(current, file, Date.now()));
	}

	clear() {
		this.#save([]);
	}

	#save(files: StarredFile[]) {
		this.#files = files;
		try {
			localStorage.setItem(STARRED_KEY, JSON.stringify(files));
		} catch {
			// The change still shows until the page changes.
		}
	}
}

const starred = new StarredStore();

export { starred };
