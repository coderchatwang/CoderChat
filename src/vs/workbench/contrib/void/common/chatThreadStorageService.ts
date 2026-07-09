/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js'
import { ChatMessage, StagingSelectionItem, ImageAttachment, CodespanLocationLink } from './chatThreadServiceTypes.js'
import { ChatMode } from './voidSettingsTypes.js'

// ========== 存储版本号 ==========
export const CHAT_THREAD_STORAGE_VERSION = 1

// ========== 无工作区会话的项目标识 ==========
export const GLOBAL_PROJECT_ID = 'global'

// ========== 会话元数据（轻量，用于列表展示）==========
export type ThreadMetadata = {
	id: string
	createdAt: string
	lastModified: string
	projectId: string

	// 用于列表展示的摘要信息
	title: string | null  // 首条用户消息的截断
	messageCount: number
	lastMessageRole: 'user' | 'assistant' | 'tool' | null
	chatMode: ChatMode

	// 状态标记
	hasError: boolean
	isStreaming: boolean

	// 预留扩展字段
	reserved1: string | null
	reserved2: string | null
}

// ========== 会话持久化状态（排除运行时状态）==========
export type ThreadPersistState = {
	currCheckpointIdx: number | null
	stagingSelections: StagingSelectionItem[]
	stagingImages: ImageAttachment[]
	focusedMessageIdx: number | undefined
	linksOfMessageIdx: {
		[messageIdx: number]: {
			[codespanName: string]: CodespanLocationLink
		}
	}
	chatMode: ChatMode
}

// ========== 会话完整数据（用于存储）==========
export type ThreadData = {
	version: number  // 数据版本，便于迁移
	metadata: ThreadMetadata
	messages: ChatMessage[]
	state: ThreadPersistState
	filesWithUserChanges: string[]  // Set 不能序列化，改为数组
}

// ========== 项目会话索引 ==========
export type ProjectThreadIndex = {
	projectId: string
	threadIds: string[]
	lastAccessed: string
}

export interface IChatThreadStorageService {
	readonly _serviceBrand: undefined

	// ========== 元数据操作 ==========
	// 获取项目的所有会话元数据
	getThreadMetadatas(projectId: string): ThreadMetadata[]

	// 保存单个会话元数据（增量更新）
	saveThreadMetadata(metadata: ThreadMetadata): void

	// 删除会话元数据
	deleteThreadMetadata(threadId: string, projectId: string): void

	// ========== 会话数据操作 ==========
	// 获取单个会话完整数据
	getThreadData(threadId: string): ThreadData | null

	// 保存会话数据（增量更新，只保存变化的会话）
	saveThreadData(threadData: ThreadData): void

	// 删除会话数据
	deleteThreadData(threadId: string): void

	// ========== 批量操作 ==========
	// 获取多个会话数据（并行加载）
	getThreadDatas(threadIds: string[]): Map<string, ThreadData>

	// 获取当前项目和 global 的会话元数据
	getVisibleThreadMetadatas(projectId: string | undefined): ThreadMetadata[]

	// 获取当前项目和 global 的会话数据
	getVisibleThreadDatas(projectId: string | undefined): Map<string, ThreadData>

	// ========== 迁移与维护 ==========
	// 从旧版本迁移数据（返回是否需要迁移）
	needsMigration(): boolean

	// 执行迁移
	migrateFromVersion0(): Map<string, ThreadData>

	// 刷新脏数据到存储
	flush(): void
}

export const IChatThreadStorageService = createDecorator<IChatThreadStorageService>('chatThreadStorageService')
