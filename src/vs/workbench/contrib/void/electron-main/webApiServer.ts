/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as http from 'http'
import { URL } from 'url'
import { StorageScope } from '../../../../platform/storage/common/storage.js'
import { IApplicationStorageMainService } from '../../../../platform/storage/electron-main/storageMainService.js'
import { CHAT_THREAD_DATA_PREFIX } from '../common/storageKeys.js'
import { ThreadDetail, ApiResponse, WebApiConfig } from '../common/chatThreadApiTypes.js'
import { URI } from '../../../../base/common/uri.js'

export class WebApiServer {
	private _server: http.Server | null = null
	private _storageService: IApplicationStorageMainService
	private _config: WebApiConfig

	constructor(
		storageService: IApplicationStorageMainService,
		config: WebApiConfig
	) {
		this._storageService = storageService
		this._config = config
	}

	async start(): Promise<void> {
		if (this._server) {
			console.log('[WebApiServer] Already running')
			return
		}

		return new Promise((resolve, reject) => {
			this._server = http.createServer((req, res) => {
				this._handleRequest(req, res)
			})

			this._server.on('error', (err) => {
				console.error('[WebApiServer] Error:', err)
				reject(err)
			})

			this._server.listen(this._config.port, this._config.host, () => {
				console.log(`[WebApiServer] Started on http://${this._config.host}:${this._config.port}`)
				console.log(`[WebApiServer] API endpoints:`)
				console.log(`  - GET /api/health       - Health check`)
				console.log(`  - GET /api/threads/:id  - Get thread detail`)
				resolve()
			})
		})
	}

	async stop(): Promise<void> {
		if (!this._server) return

		return new Promise((resolve) => {
			this._server!.close(() => {
				this._server = null
				console.log('[WebApiServer] Stopped')
				resolve()
			})
		})
	}

	private _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
		// CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
		res.setHeader('Content-Type', 'application/json')

		// Handle preflight
		if (req.method === 'OPTIONS') {
			res.writeHead(204)
			res.end()
			return
		}

		const url = new URL(req.url || '/', `http://${req.headers.host}`)
		const pathname = url.pathname

		try {
			// Route: GET /api/health
			if (pathname === '/api/health' && req.method === 'GET') {
				this._sendResponse(res, 200, {
					success: true,
					data: { status: 'ok', timestamp: Date.now() },
					timestamp: Date.now()
				})
				return
			}

			// Route: GET /api/threads/:id
			const threadMatch = pathname.match(/^\/api\/threads\/([a-f0-9-]+)$/)
			if (threadMatch && req.method === 'GET') {
				const threadId = threadMatch[1]
				const result = this._getThread(threadId)
				this._sendResponse(res, result.success ? 200 : 404, result)
				return
			}

			// 404 for unknown routes
			this._sendResponse(res, 404, {
				success: false,
				error: `Not found: ${pathname}`,
				timestamp: Date.now()
			})

		} catch (e) {
			this._sendResponse(res, 500, {
				success: false,
				error: e instanceof Error ? e.message : String(e),
				timestamp: Date.now()
			})
		}
	}

	private _sendResponse(res: http.ServerResponse, statusCode: number, data: any): void {
		res.writeHead(statusCode)
		res.end(JSON.stringify(data, null, 2))
	}

	/** 获取单个会话详情 */
	private _getThread(threadId: string): ApiResponse<ThreadDetail> {
		try {
			const threadData = this._readThreadFromStorage(threadId)
			if (!threadData) {
				return { success: false, error: `Thread not found: ${threadId}`, timestamp: Date.now() }
			}

			const detail: ThreadDetail = {
				id: threadData.metadata.id,
				title: this._extractTitle(threadData.messages),
				createdAt: threadData.metadata.createdAt,
				lastModified: threadData.metadata.lastModified,
				messageCount: threadData.messages?.length || 0,
				projectId: threadData.metadata.projectId,
				messages: this._serializeMessages(threadData.messages || [])
			}

			return { success: true, data: detail, timestamp: Date.now() }
		} catch (e) {
			return {
				success: false,
				error: e instanceof Error ? e.message : String(e),
				timestamp: Date.now()
			}
		}
	}

	/** 从 Storage 读取单个会话数据 */
	private _readThreadFromStorage(threadId: string): Record<string, any> | null {
		const threadKey = `${CHAT_THREAD_DATA_PREFIX}.${threadId}`
		const threadStr = this._storageService.get(threadKey, StorageScope.APPLICATION)
		if (!threadStr) return null

		const threadData = this._convertThreadDataFromStorage(threadStr)
		return {
			metadata: threadData.metadata,
			messages: threadData.messages
		}
	}

	/** 转换存储数据 */
	private _convertThreadDataFromStorage(threadsStr: string): Record<string, any> {
		return JSON.parse(threadsStr, (key, value) => {
			if (value && typeof value === 'object' && value.$mid === 1) {
				return URI.from(value)
			}
			return value
		})
	}

	/** 提取标题 */
	private _extractTitle(messages: any[]): string | undefined {
		if (!messages || messages.length === 0) return undefined
		const firstUserMsg = messages.find(m => m.role === 'user')
		if (firstUserMsg?.displayContent) {
			return firstUserMsg.displayContent.slice(0, 50).trim() +
				(firstUserMsg.displayContent.length > 50 ? '...' : '')
		}
		return undefined
	}

	/** 序列化消息 */
	private _serializeMessages(messages: any[]): any[] {
		return JSON.parse(JSON.stringify(messages, (key, value) => {
			if (value instanceof URI) return value.toString()
			return value
		}))
	}
}
