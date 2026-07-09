/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js'
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js'
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js'
import { URI } from '../../../../base/common/uri.js'
import {
	IChatThreadStorageService,
	ThreadMetadata,
	ThreadData,
	CHAT_THREAD_STORAGE_VERSION,
	ProjectThreadIndex,
	GLOBAL_PROJECT_ID,
} from '../common/chatThreadStorageService.js'
import { THREAD_STORAGE_KEY, CHAT_THREAD_STORAGE_PREFIX, CHAT_THREAD_META_PREFIX, CHAT_THREAD_DATA_PREFIX, CHAT_THREAD_MIGRATION_FLAG } from '../common/storageKeys.js'
import { ChatMessage } from '../common/chatThreadServiceTypes.js'
import { ChatMode } from '../common/voidSettingsTypes.js'

// ========== 存储键常量 ==========
const STORAGE_KEY_PREFIX = CHAT_THREAD_STORAGE_PREFIX
const META_KEY_PREFIX = CHAT_THREAD_META_PREFIX
const DATA_KEY_PREFIX = CHAT_THREAD_DATA_PREFIX
const MIGRATION_FLAG_KEY = CHAT_THREAD_MIGRATION_FLAG

// ========== 旧版本数据类型（用于迁移）==========
type LegacyChatThreads = {
	[id: string]: undefined | LegacyThreadType
}

type LegacyThreadType = {
	id: string
	createdAt: string
	lastModified: string
	projectId?: string
	messages: ChatMessage[]
	filesWithUserChanges: Set<string>
	state: {
		currCheckpointIdx: number | null
		stagingSelections: any[]
		stagingImages: any[]
		focusedMessageIdx: number | undefined
		linksOfMessageIdx: any
		chatMode: ChatMode
		mountedInfo?: any
	}
}

// 从消息列表计算元数据
const computeMetadataFromMessages = (
	id: string,
	createdAt: string,
	projectId: string,
	messages: ChatMessage[],
	chatMode: ChatMode
): ThreadMetadata => {
	// 查找首条用户消息作为标题
	const firstUserMsg = messages.find(m => m.role === 'user')
	let title: string | null = null
	if (firstUserMsg && firstUserMsg.role === 'user') {
		title = firstUserMsg.displayContent.slice(0, 100) || null
	}

	// 计算消息数量和最后消息角色
	const messageCount = messages.length
	let lastMessageRole: ThreadMetadata['lastMessageRole'] = null
	if (messageCount > 0) {
		const lastMsg = messages[messageCount - 1]
		if (lastMsg.role === 'user' || lastMsg.role === 'assistant' || lastMsg.role === 'tool') {
			lastMessageRole = lastMsg.role
		}
	}

	// 检查是否有错误
	const hasError = messages.some(m =>
		m.role === 'tool' && (m.type === 'tool_error' || m.type === 'invalid_params')
	)

	return {
		id,
		createdAt,
		lastModified: new Date().toISOString(),
		projectId,
		title,
		messageCount,
		lastMessageRole,
		chatMode,
		hasError,
		isStreaming: false,
		reserved1: null,
		reserved2: null,
	}
}

export class ChatThreadStorageService extends Disposable implements IChatThreadStorageService {
	_serviceBrand: undefined

	// 内存缓存：元数据
	private readonly _metadataCache = new Map<string, ThreadMetadata>()
	// 内存缓存：完整数据
	private readonly _dataCache = new Map<string, ThreadData>()
	// 内存缓存：项目索引
	private readonly _projectIndexCache = new Map<string, ProjectThreadIndex>()
	// 脏标记
	private readonly _dirtyThreadIds = new Set<string>()
	private readonly _dirtyProjectIds = new Set<string>()
	// 刷新调度标记
	private _flushScheduled = false

	constructor(
		@IStorageService private readonly _storageService: IStorageService,
	) {
		super()

		// 监听存储变化（多窗口同步）
		this._register(
			this._storageService.onDidChangeValue(StorageScope.APPLICATION, undefined, this._store)(e => {
				if (e.external && e.key.startsWith(STORAGE_KEY_PREFIX)) {
					this._handleExternalChange(e.key)
				}
			})
		)
	}

	// ========== 元数据操作 ==========

	getThreadMetadatas(projectId: string): ThreadMetadata[] {
		// 先从缓存获取项目索引
		let index = this._projectIndexCache.get(projectId)
		if (!index) {
			index = this._loadProjectIndex(projectId)
		}

		if (!index || index.threadIds.length === 0) {
			return []
		}

		// 加载所有线程的元数据
		const metadatas: ThreadMetadata[] = []
		for (const threadId of index.threadIds) {
			let meta = this._metadataCache.get(threadId)
			if (!meta) {
				// 尝试从数据中加载
				const data = this.getThreadData(threadId)
				if (data) {
					meta = data.metadata
					this._metadataCache.set(threadId, meta)
				}
			}
			if (meta) {
				metadatas.push(meta)
			}
		}

		return metadatas
	}

	saveThreadMetadata(metadata: ThreadMetadata): void {
		this._metadataCache.set(metadata.id, metadata)
		this._dirtyThreadIds.add(metadata.id)
		this._dirtyProjectIds.add(metadata.projectId)
		this._scheduleFlush()
	}

	deleteThreadMetadata(threadId: string, projectId: string): void {
		this._metadataCache.delete(threadId)
		this._dataCache.delete(threadId)
		this._dirtyThreadIds.delete(threadId)

		// 更新项目索引
		const index = this._loadProjectIndex(projectId)
		if (index) {
			index.threadIds = index.threadIds.filter(id => id !== threadId)
			this._projectIndexCache.set(projectId, index)
			this._dirtyProjectIds.add(projectId)
		}

		this._scheduleFlush()
	}

	// ========== 会话数据操作 ==========

	getThreadData(threadId: string): ThreadData | null {
		// 先检查缓存
		const cached = this._dataCache.get(threadId)
		if (cached) return cached

		// 从存储读取
		const key = this._getDataKey(threadId)
		const stored = this._storageService.get(key, StorageScope.APPLICATION)
		if (!stored) return null

		const data = this._deserializeThreadData(stored)
		this._dataCache.set(threadId, data)

		return data
	}

	saveThreadData(threadData: ThreadData): void {
		this._dataCache.set(threadData.metadata.id, threadData)
		this._metadataCache.set(threadData.metadata.id, threadData.metadata)
		this._dirtyThreadIds.add(threadData.metadata.id)
		this._dirtyProjectIds.add(threadData.metadata.projectId)

		// 更新项目索引
		this._ensureThreadInProjectIndex(threadData.metadata.id, threadData.metadata.projectId)

		this._scheduleFlush()
	}

	deleteThreadData(threadId: string): void {
		const key = this._getDataKey(threadId)
		this._storageService.remove(key, StorageScope.APPLICATION)
		this._dataCache.delete(threadId)
		this._metadataCache.delete(threadId)
		this._dirtyThreadIds.delete(threadId)
	}

	// ========== 批量操作 ==========

	getThreadDatas(threadIds: string[]): Map<string, ThreadData> {
		const result = new Map<string, ThreadData>()
		for (const threadId of threadIds) {
			const data = this.getThreadData(threadId)
			if (data) {
				result.set(threadId, data)
			}
		}
		return result
	}

	/**
	 * 获取当前项目和 global 的会话元数据
	 * - 如果 projectId 有值：返回 projectId + global 的会话
	 * - 如果 projectId 为空：只返回 global 的会话
	 */
	getVisibleThreadMetadatas(projectId: string | undefined): ThreadMetadata[] {
		const allMetadatas: ThreadMetadata[] = []

		// 加载当前项目的会话
		if (projectId) {
			const metadatas = this.getThreadMetadatas(projectId)
			allMetadatas.push(...metadatas)
		}

		// 加载 global 会话
		const globalMetadatas = this.getThreadMetadatas(GLOBAL_PROJECT_ID)
		allMetadatas.push(...globalMetadatas)

		// 按最后修改时间降序排序
		allMetadatas.sort((a, b) => {
			const timeA = new Date(a.lastModified).getTime()
			const timeB = new Date(b.lastModified).getTime()
			return timeB - timeA
		})

		return allMetadatas
	}

	/**
	 * 获取当前项目和 global 的会话数据
	 * - 如果 projectId 有值：返回 projectId + global 的会话
	 * - 如果 projectId 为空：只返回 global 的会话
	 */
	getVisibleThreadDatas(projectId: string | undefined): Map<string, ThreadData> {
		const result = new Map<string, ThreadData>()

		// 加载当前项目的会话
		if (projectId) {
			const metadatas = this.getThreadMetadatas(projectId)
			for (const meta of metadatas) {
				const data = this.getThreadData(meta.id)
				if (data) {
					result.set(meta.id, data)
				}
			}
		}

		// 加载 global 会话
		const globalMetadatas = this.getThreadMetadatas(GLOBAL_PROJECT_ID)
		for (const meta of globalMetadatas) {
			const data = this.getThreadData(meta.id)
			if (data) {
				result.set(meta.id, data)
			}
		}

		return result
	}

	// ========== 迁移与维护 ==========

	needsMigration(): boolean {
		// 检查是否已经迁移
		const migrated = this._storageService.get(MIGRATION_FLAG_KEY, StorageScope.APPLICATION)
		if (migrated === 'true') return false

		// 检查是否存在旧版本数据
		const legacyData = this._storageService.get(THREAD_STORAGE_KEY, StorageScope.APPLICATION)
		return !!legacyData
	}

	migrateFromVersion0(): Map<string, ThreadData> {
		const legacyData = this._storageService.get(THREAD_STORAGE_KEY, StorageScope.APPLICATION)
		if (!legacyData) return new Map()

		const result = new Map<string, ThreadData>()

		try {
			const legacyThreads = this._parseLegacyThreads(legacyData)

			for (const [threadId, legacyThread] of Object.entries(legacyThreads)) {
				if (!legacyThread) continue

				const projectId = legacyThread.projectId || GLOBAL_PROJECT_ID

				// 转换为新的数据格式
				const threadData: ThreadData = {
					version: CHAT_THREAD_STORAGE_VERSION,
					metadata: computeMetadataFromMessages(
						legacyThread.id,
						legacyThread.createdAt,
						projectId,
						legacyThread.messages,
						legacyThread.state.chatMode || 'agent'
					),
					messages: legacyThread.messages,
					state: {
						currCheckpointIdx: legacyThread.state.currCheckpointIdx,
						stagingSelections: legacyThread.state.stagingSelections || [],
						stagingImages: legacyThread.state.stagingImages || [],
						focusedMessageIdx: legacyThread.state.focusedMessageIdx,
						linksOfMessageIdx: legacyThread.state.linksOfMessageIdx || {},
						chatMode: legacyThread.state.chatMode || 'agent',
					},
					filesWithUserChanges: Array.from(legacyThread.filesWithUserChanges || []),
				}

				threadData.metadata.lastModified = legacyThread.lastModified

				// 保存到新格式
				this.saveThreadData(threadData)
				result.set(threadId, threadData)
			}

			// 标记已迁移
			this._storageService.store(MIGRATION_FLAG_KEY, 'true', StorageScope.APPLICATION, StorageTarget.USER)

			// 删除旧版本存储数据
			this._storageService.remove(THREAD_STORAGE_KEY, StorageScope.APPLICATION)

			// 刷新到存储
			this.flush()
		} catch (e) {
			console.error('[ChatThreadStorageService] Migration failed:', e)
		}

		return result
	}

	flush(): void {
		this._flushDirtyData()
	}

	// ========== 私有方法 ==========

	private _getMetaKey(projectId: string): string {
		return `${META_KEY_PREFIX}.${projectId}`
	}

	private _getDataKey(threadId: string): string {
		return `${DATA_KEY_PREFIX}.${threadId}`
	}

	private _scheduleFlush(): void {
		if (this._flushScheduled) return
		this._flushScheduled = true

		// 使用 requestIdleCallback 或 setTimeout 延迟写入
		if (typeof requestIdleCallback !== 'undefined') {
			requestIdleCallback(() => this._flushDirtyData(), { timeout: 100 })
		} else {
			setTimeout(() => this._flushDirtyData(), 100)
		}
	}

	private _flushDirtyData(): void {
		this._flushScheduled = false

		// 1. 刷新脏线程数据
		for (const threadId of this._dirtyThreadIds) {
			const data = this._dataCache.get(threadId)
			if (!data) continue

			const dataKey = this._getDataKey(threadId)
			this._storageService.store(
				dataKey,
				this._serializeThreadData(data),
				StorageScope.APPLICATION,
				StorageTarget.USER
			)
		}

		// 2. 刷新脏项目索引
		for (const projectId of this._dirtyProjectIds) {
			const index = this._projectIndexCache.get(projectId)
			if (!index) continue

			const indexKey = this._getMetaKey(projectId)
			this._storageService.store(
				indexKey,
				JSON.stringify(index),
				StorageScope.APPLICATION,
				StorageTarget.USER
			)
		}

		this._dirtyThreadIds.clear()
		this._dirtyProjectIds.clear()
	}

	private _loadProjectIndex(projectId: string): ProjectThreadIndex {
		const cached = this._projectIndexCache.get(projectId)
		if (cached) return cached

		const key = this._getMetaKey(projectId)
		const stored = this._storageService.get(key, StorageScope.APPLICATION)
		if (!stored) {
			const newIndex: ProjectThreadIndex = {
				projectId,
				threadIds: [],
				lastAccessed: new Date().toISOString(),
			}
			this._projectIndexCache.set(projectId, newIndex)
			return newIndex
		}

		const index: ProjectThreadIndex = JSON.parse(stored)
		this._projectIndexCache.set(projectId, index)
		return index
	}

	private _ensureThreadInProjectIndex(threadId: string, projectId: string): void {
		const index = this._loadProjectIndex(projectId)
		if (!index.threadIds.includes(threadId)) {
			index.threadIds.push(threadId)
		}
		index.lastAccessed = new Date().toISOString()
		this._projectIndexCache.set(projectId, index)
		this._dirtyProjectIds.add(projectId)
	}

	private _serializeThreadData(data: ThreadData): string {
		return JSON.stringify(data, (key, value) => {
			// URI 序列化
			if (value instanceof URI) {
				return { $mid: 1, scheme: value.scheme, path: value.path, query: value.query, fragment: value.fragment }
			}
			return value
		})
	}

	private _deserializeThreadData(str: string): ThreadData {
		return JSON.parse(str, (key, value) => {
			// URI 反序列化
			if (value && typeof value === 'object' && value.$mid === 1) {
				return URI.from(value)
			}
			return value
		})
	}

	private _parseLegacyThreads(str: string): LegacyChatThreads {
		return JSON.parse(str, (key, value) => {
			if (value && typeof value === 'object' && value.$mid === 1) {
				return URI.from(value)
			}
			return value
		})
	}

	private _handleExternalChange(key: string): void {
		// 处理外部变更（其他窗口修改）
		if (key.startsWith(DATA_KEY_PREFIX)) {
			// 清除对应的数据缓存
			const threadId = key.substring(DATA_KEY_PREFIX.length + 1)
			this._dataCache.delete(threadId)
			this._metadataCache.delete(threadId)
		} else if (key.startsWith(META_KEY_PREFIX)) {
			// 清除项目索引缓存
			const projectId = key.substring(META_KEY_PREFIX.length + 1)
			this._projectIndexCache.delete(projectId)
		}
	}
}

registerSingleton(IChatThreadStorageService, ChatThreadStorageService, InstantiationType.Eager)
