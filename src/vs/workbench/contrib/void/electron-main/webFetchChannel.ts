/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event } from '../../../../base/common/event.js';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export interface WebFetchRequestParams {
	url: string;
	timeout?: number;
}

export interface WebFetchResult {
	content: string;
	statusCode: number;
	url: string;
	error?: string;
}

export interface ProxyConfig {
	proxyUrl: string | undefined;
	proxyStrictSSL: boolean;
}

export class WebFetchChannel implements IServerChannel {

	constructor(
		private readonly configurationService: IConfigurationService,
	) { }

	// Get proxy configuration from VSCode settings
	private getProxyConfig(): ProxyConfig {
		const proxyUrl = this.configurationService.getValue<string>('http.proxy');
		const proxyStrictSSL = this.configurationService.getValue<boolean>('http.proxyStrictSSL');

		return {
			proxyUrl: proxyUrl || undefined,
			proxyStrictSSL: proxyStrictSSL !== false, // default is true
		};
	}

	// browser uses this to listen for changes (not used for web fetch)
	listen(_: unknown, event: string): Event<any> {
		throw new Error(`Event not found: ${event}`);
	}

	// browser uses this to call
	async call(_: unknown, command: string, params: any): Promise<any> {
		if (command === 'fetch') {
			return this._fetch(params as WebFetchRequestParams);
		}
		throw new Error(`Command not found: ${command}`);
	}

	private async _fetch(params: WebFetchRequestParams): Promise<WebFetchResult> {
		const { url, timeout = 30000 } = params;
		const proxyConfig = this.getProxyConfig();

		try {
			const result = await this._doFetch(url, proxyConfig, timeout);
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return { content: `Failed to fetch URL: ${errorMessage}`, statusCode: 0, url };
		}
	}

	private async _doFetch(url: string, proxyConfig: ProxyConfig, timeout: number): Promise<WebFetchResult> {
		return new Promise((resolve) => {
			const parsedUrl = new URL(url);
			const isHttps = parsedUrl.protocol === 'https:';
			const requestModule = isHttps ? https : http;

			const requestOptions: http.RequestOptions = {
				hostname: parsedUrl.hostname,
				port: parsedUrl.port || (isHttps ? 443 : 80),
				path: parsedUrl.pathname + parsedUrl.search,
				method: 'GET',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
					'User-Agent': 'CoderChat/1.0',
					'Accept-Encoding': 'identity', // Disable compression for simpler handling
				},
				timeout: timeout,
			};

			// Configure proxy if available
			if (proxyConfig.proxyUrl) {
				try {
					const proxyAgent = new HttpsProxyAgent(proxyConfig.proxyUrl);
					requestOptions.agent = proxyAgent;

					// If proxyStrictSSL is false, disable certificate verification
					if (!proxyConfig.proxyStrictSSL) {
						process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
					}

					console.log(`[WebFetch] Using proxy: ${proxyConfig.proxyUrl}, strictSSL: ${proxyConfig.proxyStrictSSL}`);
				} catch (proxyError) {
					console.warn(`[WebFetch] Failed to configure proxy: ${proxyError}`);
				}
			} else {
				console.log('[WebFetch] No proxy configured, using direct connection');
			}

			const req = requestModule.request(requestOptions, (res) => {
				let data = '';

				// Handle redirects (3xx status codes with Location header)
				if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
					const redirectUrl = res.headers.location;
					console.log(`[WebFetch] Redirecting to: ${redirectUrl}`);
					this._doFetch(redirectUrl, proxyConfig, timeout).then(resolve);
					return;
				}

				res.on('data', (chunk: Buffer) => {
					data += chunk.toString();
				});

				res.on('end', () => {
					const statusCode = res.statusCode ?? 0;
					resolve({ content: data, statusCode, url });
				});

				res.on('error', (err: Error) => {
					resolve({ content: `Response error: ${err.message}`, statusCode: 0, url });
				});
			});

			req.on('error', (err: Error) => {
				resolve({ content: `Request error: ${err.message}`, statusCode: 0, url });
			});

			req.on('timeout', () => {
				req.destroy();
				resolve({ content: 'Request timed out', statusCode: 0, url });
			});

			req.end();
		});
	}
}
