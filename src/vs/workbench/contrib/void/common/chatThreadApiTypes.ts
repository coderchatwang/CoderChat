/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

// ============ API Response Types ============

/** 会话摘要 (列表项) */
export interface ThreadSummary {
	id: string
	title: string | undefined
	createdAt: string
	lastModified: string
	messageCount: number
	projectId: string | undefined
}

/** 会话详情 (包含消息) */
export interface ThreadDetail extends ThreadSummary {
	messages: any[]  // ChatMessage[]
}

/** API 响应包装 */
export interface ApiResponse<T> {
	success: boolean
	data?: T
	error?: string
	timestamp: number
}

/** Web API 配置 */
export interface WebApiConfig {
	enabled: boolean
	port: number
	host: string
}

// ============ IPC Channel ============

export const ChatThreadApiChannelName = 'void-channel-chatThreadApi'

// ============ Default Config ============

export const DEFAULT_WEB_API_CONFIG: WebApiConfig = {
	enabled: true,
	port: 9988,
	host: 'localhost'
}
