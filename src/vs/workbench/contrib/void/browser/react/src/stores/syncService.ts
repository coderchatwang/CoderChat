/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useChatStore, ThreadMetadata, ThreadState, StreamState } from './chatStore.js'
import { ChatMessage } from '../../../../common/chatThreadServiceTypes.js'
import { ThreadsState, ThreadStreamState, ThreadType } from '../../../chatThreadService.js'

/**
 * 同步服务 - 负责在 VSCode ChatThreadService 和 Zustand Store 之间同步状态
 * 
 * 这个服务作为桥梁，将 VSCode Service 的状态转换为 Zustand 可以使用的细粒度状态
 */

// ============ 类型转换函数 ============

/**
 * 从 ThreadType 提取消息数组
 */
export const extractMessagesFromThread = (thread: ThreadType): ChatMessage[] => {
	return thread.messages
}

/**
 * 从 ThreadType 提取元数据
 */
export const extractMetadataFromThread = (thread: ThreadType): ThreadMetadata => {
	return {
		id: thread.id,
		createdAt: thread.createdAt,
		lastModified: thread.lastModified,
		messageCount: thread.messages.length
	}
}

/**
 * 从 ThreadType 提取线程状态
 */
export const extractThreadStateFromThread = (thread: ThreadType): ThreadState => {
	return {
		currCheckpointIdx: thread.state.currCheckpointIdx,
		stagingSelections: thread.state.stagingSelections,
		stagingImages: thread.state.stagingImages,
		focusedMessageIdx: thread.state.focusedMessageIdx,
		linksOfMessageIdx: thread.state.linksOfMessageIdx,
		mountedInfo: thread.state.mountedInfo
	}
}

/**
 * 将 ThreadStreamState 转换为 StreamState
 */
export const convertStreamState = (streamState: ThreadStreamState[string]): StreamState | undefined => {
	if (!streamState) return undefined

	if (streamState.isRunning === undefined) {
		if (streamState.error) {
			return {
				isRunning: undefined,
				error: streamState.error
			}
		}
		return undefined
	}

	if (streamState.isRunning === 'LLM') {
		return {
			isRunning: 'LLM',
			llmInfo: streamState.llmInfo,
			interrupt: streamState.interrupt
		}
	}

	if (streamState.isRunning === 'tool') {
		return {
			isRunning: 'tool',
			toolInfo: streamState.toolInfo,
			interrupt: streamState.interrupt
		}
	}

	if (streamState.isRunning === 'awaiting_user') {
		return {
			isRunning: 'awaiting_user'
		}
	}

	if (streamState.isRunning === 'idle') {
		return {
			isRunning: 'idle',
			interrupt: streamState.interrupt
		}
	}

	return undefined
}

// ============ 同步函数 ============

/**
 * 同步完整的 ThreadsState 到 Zustand Store
 * 这个函数在 ChatThreadService 状态变化时被调用
 */
export const syncThreadsStateToStore = (threadsState: ThreadsState) => {
	const { allThreads, currentThreadId } = threadsState

	const messagesByThread: Record<string, ChatMessage[]> = {}
	const threadMetadata: Record<string, ThreadMetadata> = {}
	const threadStateByThread: Record<string, ThreadState> = {}
	const filesWithUserChangesByThread: Record<string, Set<string>> = {}

	for (const [threadId, thread] of Object.entries(allThreads)) {
		if (thread) {
			messagesByThread[threadId] = thread.messages
			threadMetadata[threadId] = extractMetadataFromThread(thread)
			threadStateByThread[threadId] = extractThreadStateFromThread(thread)
			filesWithUserChangesByThread[threadId] = thread.filesWithUserChanges
		}
	}

	useChatStore.getState().setFullState({
		messagesByThread,
		threadMetadata,
		currentThreadId,
		threadStateByThread,
		filesWithUserChangesByThread
	})
}

/**
 * 同步单个线程的消息到 Zustand Store
 */
export const syncThreadMessagesToStore = (threadId: string, messages: ChatMessage[]) => {
	useChatStore.getState().setMessages(threadId, messages)
}

/**
 * 添加消息到 Zustand Store
 */
export const addMessageToStore = (threadId: string, message: ChatMessage) => {
	useChatStore.getState().addMessage(threadId, message)
}

/**
 * 更新消息到 Zustand Store
 */
export const updateMessageInStore = (threadId: string, messageIdx: number, message: ChatMessage) => {
	useChatStore.getState().updateMessage(threadId, messageIdx, message)
}

/**
 * 同步当前线程 ID 到 Zustand Store
 */
export const syncCurrentThreadIdToStore = (threadId: string) => {
	useChatStore.getState().setCurrentThread(threadId)
}

/**
 * 同步流式状态到 Zustand Store
 */
export const syncStreamStateToStore = (threadId: string, streamState: ThreadStreamState[string]) => {
	const converted = convertStreamState(streamState)
	useChatStore.getState().setStreamState(threadId, converted)
}

/**
 * 清除线程的流式状态
 */
export const clearStreamStateInStore = (threadId: string) => {
	useChatStore.getState().clearStreamState(threadId)
}

/**
 * 同步线程状态到 Zustand Store
 */
export const syncThreadStateToStore = (threadId: string, threadState: Partial<ThreadState>) => {
	useChatStore.getState().setThreadState(threadId, threadState)
}

/**
 * 创建新线程到 Zustand Store
 */
export const createThreadInStore = (threadId: string, createdAt: string) => {
	useChatStore.getState().createThread({ id: threadId, createdAt })
}

/**
 * 删除线程从 Zustand Store
 */
export const deleteThreadFromStore = (threadId: string) => {
	useChatStore.getState().deleteThread(threadId)
}

/**
 * 复制线程到 Zustand Store
 */
export const duplicateThreadInStore = (threadId: string, newThreadId: string) => {
	useChatStore.getState().duplicateThread(threadId, newThreadId)
}

/**
 * 更新线程元数据到 Zustand Store
 */
export const updateThreadMetadataInStore = (threadId: string, metadata: Partial<ThreadMetadata>) => {
	useChatStore.getState().updateThreadMetadata(threadId, metadata)
}

/**
 * 从 Zustand Store 获取完整状态（用于持久化）
 */
export const getFullStateFromStore = () => {
	return useChatStore.getState().getFullState()
}

/**
 * 获取所有线程数据（用于 VSCode Service 读取）
 */
export const getAllThreadsFromStore = () => {
	const state = useChatStore.getState()
	const allThreads: { [threadId: string]: ThreadType | undefined } = {}

	for (const threadId of Object.keys(state.threadMetadata)) {
		const metadata = state.threadMetadata[threadId]
		const messages = state.messagesByThread[threadId] || []
		const threadState = state.threadStateByThread[threadId]

		if (metadata) {
			allThreads[threadId] = {
				id: metadata.id,
				createdAt: metadata.createdAt,
				lastModified: metadata.lastModified,
				messages,
				state: threadState || {
					currCheckpointIdx: null,
					stagingSelections: [],
					stagingImages: [],
					focusedMessageIdx: undefined,
					linksOfMessageIdx: {}
				},
				filesWithUserChanges: state.filesWithUserChangesByThread[threadId] || new Set()
			}
		}
	}

	return allThreads
}
