export type Entry = {
	type: string;
	title: string;
	path: string;
	parent_path?: string;
	entries?: Entry[];
};

export interface Props {
	title: string;
	path: string;
	type: string;
	parent_path: string;
	entries: Entry[];
}
