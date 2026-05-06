/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { marked, Token } from 'marked'

/**
 * Markdown 解析缓存服务
 * 
 * 用于缓存 marked.lexer() 的解析结果，避免重复解析相同的 Markdown 字符串
 * 这对于包含大量消息的历史会话切换时的性能优化非常重要
 */

// 缓存条目类型
interface CacheEntry {
	tokens: Token[]
	string: string
	timestamp: number
}

// 最大缓存条目数
const MAX_CACHE_SIZE = 500

// 缓存淘汰时间（毫秒）- 5 分钟未访问的条目可以被淘汰
const CACHE_TTL = 5 * 60 * 1000

// 全局缓存 Map - 使用内容哈希作为 key
const tokenCache = new Map<string, CacheEntry>()

// 访问顺序记录（用于 LRU 淘汰）
const accessOrder: string[] = []

/**
 * 计算字符串的简单哈希值
 * 用于生成缓存 key
 */
function hashString(str: string): string {
	// 使用简单但快速的哈希算法
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash // Convert to 32bit integer
	}
	return `${hash}_${str.length}`
}

/**
 * 清理过期的缓存条目
 */
function cleanExpiredEntries(): void {
	const now = Date.now()
	const keysToDelete: string[] = []

	for (const [key, entry] of tokenCache.entries()) {
		if (now - entry.timestamp > CACHE_TTL) {
			keysToDelete.push(key)
		}
	}

	for (const key of keysToDelete) {
		tokenCache.delete(key)
		const idx = accessOrder.indexOf(key)
		if (idx !== -1) {
			accessOrder.splice(idx, 1)
		}
	}
}

/**
 * 确保 LRU 淘汰 - 移除最久未使用的条目
 */
function ensureCacheSize(): void {
	// 如果缓存超过最大大小，移除最久未使用的条目
	while (tokenCache.size > MAX_CACHE_SIZE && accessOrder.length > 0) {
		const oldestKey = accessOrder.shift()
		if (oldestKey) {
			tokenCache.delete(oldestKey)
		}
	}
}

/**
 * 更新访问顺序（将 key 移到末尾表示最近使用）
 */
function updateAccessOrder(key: string): void {
	const idx = accessOrder.indexOf(key)
	if (idx !== -1) {
		accessOrder.splice(idx, 1)
	}
	accessOrder.push(key)
}

/**
 * 获取缓存的 tokens，如果不存在则解析并缓存
 * 
 * @param string - 要解析的 Markdown 字符串
 * @returns 解析后的 tokens 数组
 */
export function getCachedTokens(string: string): Token[] {
	// 预处理字符串（与 ChatMarkdownRender 中相同的处理）
	const processedString = string.replaceAll('\n•', '\n\n•')

	// 计算缓存 key
	const cacheKey = hashString(processedString)

	// 尝试从缓存获取
	const cached = tokenCache.get(cacheKey)

	if (cached && cached.string === processedString) {
		// 缓存命中，更新访问时间
		cached.timestamp = Date.now()
		updateAccessOrder(cacheKey)
		return cached.tokens
	}

	// 缓存未命中，解析并缓存
	const tokens = marked.lexer(processedString)

	// 存入缓存
	tokenCache.set(cacheKey, {
		tokens,
		string: processedString,
		timestamp: Date.now()
	})
	accessOrder.push(cacheKey)

	// 检查是否需要清理
	if (tokenCache.size > MAX_CACHE_SIZE) {
		cleanExpiredEntries()
		ensureCacheSize()
	}

	return tokens
}

/**
 * 预热缓存 - 在空闲时预先解析内容
 * 用于后台加载，不阻塞主线程
 * 
 * @param string - 要预解析的 Markdown 字符串
 */
export function prefetchTokens(string: string): void {
	// 使用 requestIdleCallback 在空闲时执行
	if (typeof requestIdleCallback !== 'undefined') {
		requestIdleCallback(() => {
			getCachedTokens(string)
		})
	} else {
		// 降级处理
		setTimeout(() => {
			getCachedTokens(string)
		}, 0)
	}
}

/**
 * 批量预热缓存
 * 用于线程切换时预加载所有消息的 tokens
 * 
 * @param strings - Markdown 字符串数组
 * @param priority - 是否高优先级（立即执行）
 */
export function prefetchTokensBatch(strings: string[], priority: boolean = false): void {
	if (priority) {
		// 高优先级：立即执行（用于即将显示的内容）
		for (const str of strings) {
			getCachedTokens(str)
		}
	} else {
		// 低优先级：分批在空闲时执行
		if (typeof requestIdleCallback !== 'undefined') {
			let index = 0
			const batchSize = 10 // 每次空闲处理 10 个

			const processBatch = (deadline: IdleDeadline) => {
				const end = Math.min(index + batchSize, strings.length)
				while (index < end && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
					getCachedTokens(strings[index])
					index++
				}

				if (index < strings.length) {
					requestIdleCallback(processBatch)
				}
			}

			requestIdleCallback(processBatch)
		} else {
			// 降级处理：分批延迟执行
			let index = 0
			const batchSize = 10

			const processBatch = () => {
				const end = Math.min(index + batchSize, strings.length)
				for (; index < end; index++) {
					getCachedTokens(strings[index])
				}

				if (index < strings.length) {
					setTimeout(processBatch, 0)
				}
			}

			setTimeout(processBatch, 0)
		}
	}
}

/**
 * 清除所有缓存
 * 用于内存清理或重置
 */
export function clearMarkdownCache(): void {
	tokenCache.clear()
	accessOrder.length = 0
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
	size: number
	maxSize: number
	hitRate: number
} {
	return {
		size: tokenCache.size,
		maxSize: MAX_CACHE_SIZE,
		hitRate: 0 // 简化版本不追踪命中率
	}
}
