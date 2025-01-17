/*
based on https://github.com/Borewit/readable-web-to-node-stream
*/

import { Readable } from "node:stream";

class StreamConv extends Readable {
	public bytesRead: number = 0;
	public released = false;
	private reader: ReadableStreamReader;
	private pendingRead!: Promise<any>;

	constructor(stream: ReadableStream) {
		super();
		this.reader = stream.getReader();
	}

	public async _read() {
		if (this.released) {
			this.push(null);
			return;
		}
		this.pendingRead = this.reader.read();
		const data = await this.pendingRead;
		// @ts-ignore
		delete this.pendingRead;
		if (data.done || this.released) {
			this.push(null);
		} else {
			this.bytesRead += data.value.length;
			this.push(data.value);
		}
	}

	public async waitForReadToComplete() {
		if (this.pendingRead) {
			await this.pendingRead;
		}
	}

	public async close(): Promise<void> {
		await this.syncAndRelease();
	}

	private async syncAndRelease() {
		this.released = true;
		await this.waitForReadToComplete();
		await this.reader.releaseLock();
	}
}

export function convert(stream: ReadableStream) {
	return new StreamConv(stream);
}
