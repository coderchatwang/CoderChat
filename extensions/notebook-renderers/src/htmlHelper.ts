/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface TrustedTypePolicy {
	createHTML: (input: string) => string;
	createScript: (input: string) => string;
}

interface TrustedTypes {
	createPolicy: (name: string, options: { createHTML: (value: string) => string, createScript: (value: string) => string }) => TrustedTypePolicy;
}

declare global {
	interface Window {
		trustedTypes?: TrustedTypes;
	}
}

export const ttPolicy = (typeof window !== 'undefined') ?
	window.trustedTypes?.createPolicy('notebookRenderer', {
		createHTML: (value: string) => value,
		createScript: (value: string) => value,
	}) : undefined;
