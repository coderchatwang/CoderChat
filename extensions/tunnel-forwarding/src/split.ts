/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Transform } from 'stream';

export const splitNewLines = () => new StreamSplitter('\n'.charCodeAt(0));

/**
 * Copied and simplified from src\vs\base\node\nodeStreams.ts
 *
 * Exception: does not include the split character in the output.
 */
export class StreamSplitter extends Transform {
	private buffer: Uint8Array | undefined;

	constructor(private readonly splitter: number) {
		super();
	}

	override _transform(chunk: Uint8Array, _encoding: string, callback: (error?: Error | null, data?: any) => void): void {
		// Convert chunk to Uint8Array if needed
		const chunkArray = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk as ArrayBuffer);
		
		if (!this.buffer) {
			this.buffer = new Uint8Array(chunkArray);
		} else {
			const combined = new Uint8Array(this.buffer.length + chunkArray.length);
			combined.set(this.buffer, 0);
			combined.set(chunkArray, this.buffer.length);
			this.buffer = combined;
		}

		let offset = 0;
		while (offset < this.buffer.length) {
			const index = this.buffer.indexOf(this.splitter, offset);
			if (index === -1) {
				break;
			}

			this.push(Buffer.from(this.buffer.slice(offset, index)));
			offset = index + 1;
		}

		this.buffer = offset === this.buffer.length ? undefined : new Uint8Array(this.buffer.slice(offset));
		callback();
	}

	override _flush(callback: (error?: Error | null, data?: any) => void): void {
		if (this.buffer) {
			this.push(Buffer.from(this.buffer));
		}

		callback();
	}
}