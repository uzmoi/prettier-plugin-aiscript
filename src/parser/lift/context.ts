import { LinesAndColumns } from "lines-and-columns";

export class LiftContext {
	lines;
	constructor(readonly source: string) {
		this.lines = new LinesAndColumns(source);
	}
}
