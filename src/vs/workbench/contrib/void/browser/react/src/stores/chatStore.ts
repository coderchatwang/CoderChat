/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { ChatMessage } from '../../../../common/chatThreadServiceTypes.js'

// ============ Types ============

export interface ThreadMetadata {
	id: string
	createdAt: string
	lastModified: string
	title?: string
	messageCount: number
}

export type IsRunningType =
	| 'LLM' // the LLM is currently streaming
	| 'tool' // whether a tool is currently running
	| 'awaiting_user' // awaiting user call
	| 'idle' // nothing is running now, but the chat should still appear like it's going (used in-between calls)
	| undefined

export interface StreamState {
	isRunning: IsRunningType
	error?: { message: string; fullError: Error | null }
	llmInfo?: {
		displayContentSoFar: string
		reasoningSoFar: string
		toolCallSoFar: any | null
	}
	toolInfo?: {
		toolName: string
		toolParams: any
		id: string
		content: string
		rawParams: any
		mcpServerName: string | undefined
	}
	interrupt?: Promise<() => void> | 'not_needed'
}

export interface ThreadState {
	currCheckpointIdx: number | null
	stagingSelections: any[]
	stagingImages: any[]
	focusedMessageIdx: number | undefined
	linksOfMessageIdx: {
		[messageIdx: number]: {
			[codespanName: string]: any
		}
	}
	mountedInfo?: {
		whenMounted: Promise<any>
		_whenMountedResolver: (res: any) => void
		mountedIsResolvedRef: { current: boolean }
	}
}

export interface ChatStore {
	// ====== State ======

	// 消息按线程分开存储（细粒度订阅的关键）
	messagesByThread: Record<string, ChatMessage[]>

	// 线程元数据（用于列表显示，不包含完整消息）
	threadMetadata: Record<string, ThreadMetadata>

	// 当前线程 ID
	currentThreadId: string | null

	// 流式状态按线程分开
	streamStateByThread: Record<string, StreamState | undefined>

	// 线程状态（checkpoint、staging 等）
	threadStateByThread: Record<string, ThreadState>

	// 文件变更追踪
	filesWithUserChangesByThread: Record<string, Set<string>>

	// ====== Actions ======

	// 消息操作
	addMessage: (threadId: string, message: ChatMessage) => void
	updateMessage: (threadId: string, messageIdx: number, message: ChatMessage) => void
	setMessages: (threadId: string, messages: ChatMessage[]) => void
	deleteMessagesAfterIdx: (threadId: string, messageIdx: number) => void

	// 线程操作
	setCurrentThread: (threadId: string) => void
	createThread: (thread: { id: string; createdAt: string }) => void
	deleteThread: (threadId: string) => void
	duplicateThread: (threadId: string, newThreadId: string) => void
	updateThreadMetadata: (threadId: string, metadata: Partial<ThreadMetadata>) => void

	// 流式状态操作
	setStreamState: (threadId: string, state: StreamState | undefined) => void
	updateStreamLLMInfo: (threadId: string, llmInfo: Partial<NonNullable<StreamState['llmInfo']>>) => void
	clearStreamState: (threadId: string) => void

	// 线程状态操作
	setThreadState: (threadId: string, state: Partial<ThreadState>) => void

	// 批量操作（用于初始化和持久化恢复）
	batchSetMessages: (messagesByThread: Record<string, ChatMessage[]>) => void
	batchSetThreadMetadata: (metadata: Record<string, ThreadMetadata>) => void
	batchSetThreadState: (threadStateByThread: Record<string, ThreadState>) => void

	// 完整状态替换（用于从 VSCode Service 同步）
	setFullState: (state: {
		messagesByThread: Record<string, ChatMessage[]>
		threadMetadata: Record<string, ThreadMetadata>
		currentThreadId: string | null
		threadStateByThread: Record<string, ThreadState>
		filesWithUserChangesByThread: Record<string, Set<string>>
	}) => void

	// 获取完整状态（用于持久化）
	getFullState: () => {
		messagesByThread: Record<string, ChatMessage[]>
		threadMetadata: Record<string, ThreadMetadata>
		currentThreadId: string | null
		threadStateByThread: Record<string, ThreadState>
		filesWithUserChangesByThread: Record<string, Set<string>>
	}
}

// ============ Default Values ============

const defaultThreadState = (): ThreadState => ({
	currCheckpointIdx: null,
	stagingSelections: [],
	stagingImages: [],
	focusedMessageIdx: undefined,
	linksOfMessageIdx: {},
})

// ============ Store Creation ============

export const useChatStore = create<ChatStore>()(
	subscribeWithSelector((set, get) => ({
		// ====== Initial State ======
		messagesByThread: {},
		threadMetadata: {},
		currentThreadId: null,
		streamStateByThread: {},
		threadStateByThread: {},
		filesWithUserChangesByThread: {},

		// ====== Message Actions ======

		addMessage: (threadId, message) => {
			set((state) => {
				const currentMessages = state.messagesByThread[threadId] || []
				const currentMetadata = state.threadMetadata[threadId]
				return {
					messagesByThread: {
						...state.messagesByThread,
						[threadId]: [...currentMessages, message]
					},
					threadMetadata: {
						...state.threadMetadata,
						[threadId]: {
							...currentMetadata,
							id: threadId,
							lastModified: new Date().toISOString(),
							messageCount: currentMessages.length + 1
						} as ThreadMetadata
					}
				}
			})
		},

		updateMessage: (threadId, messageIdx, message) => {
			set((state) => {
				const messages = state.messagesByThread[threadId]
				if (!messages || messageIdx < 0 || messageIdx >= messages.length) return state
				return {
					messagesByThread: {
						...state.messagesByThread,
						[threadId]: [
							...messages.slice(0, messageIdx),
							message,
							...messages.slice(messageIdx + 1)
						]
					},
					threadMetadata: {
						...state.threadMetadata,
						[threadId]: {
							...state.threadMetadata[threadId],
							lastModified: new Date().toISOString(),
						}
					}
				}
			})
		},

		setMessages: (threadId, messages) => {
			set((state) => ({
				messagesByThread: {
					...state.messagesByThread,
					[threadId]: messages
				},
				threadMetadata: {
					...state.threadMetadata,
					[threadId]: {
						...state.threadMetadata[threadId],
						lastModified: new Date().toISOString(),
						messageCount: messages.length
					}
				}
			}))
		},

		deleteMessagesAfterIdx: (threadId, messageIdx) => {
			set((state) => {
				const messages = state.messagesByThread[threadId]
				if (!messages) return state
				const newMessages = messages.slice(0, messageIdx)
				return {
					messagesByThread: {
						...state.messagesByThread,
						[threadId]: newMessages
					},
					threadMetadata: {
						...state.threadMetadata,
						[threadId]: {
							...state.threadMetadata[threadId],
							lastModified: new Date().toISOString(),
							messageCount: newMessages.length
						}
					}
				}
			})
		},

		// ====== Thread Actions ======

		setCurrentThread: (threadId) => {
			set({ currentThreadId: threadId })
		},

		createThread: (thread) => {
			set((state) => ({
				threadMetadata: {
					...state.threadMetadata,
					[thread.id]: {
						id: thread.id,
						createdAt: thread.createdAt,
						lastModified: thread.createdAt,
						messageCount: 0
					}
				},
				messagesByThread: {
					...state.messagesByThread,
					[thread.id]: []
				},
				threadStateByThread: {
					...state.threadStateByThread,
					[thread.id]: defaultThreadState()
				},
				filesWithUserChangesByThread: {
					...state.filesWithUserChangesByThread,
					[thread.id]: new Set()
				},
				currentThreadId: thread.id
			}))
		},

		deleteThread: (threadId) => {
			set((state) => {
				const { [threadId]: _1, ...restMessages } = state.messagesByThread
				const { [threadId]: _2, ...restMetadata } = state.threadMetadata
				const { [threadId]: _3, ...restStreamState } = state.streamStateByThread
				const { [threadId]: _4, ...restThreadState } = state.threadStateByThread
				const { [threadId]: _5, ...restFilesWithChanges } = state.filesWithUserChangesByThread
				return {
					messagesByThread: restMessages,
					threadMetadata: restMetadata,
					streamStateByThread: restStreamState,
					threadStateByThread: restThreadState,
					filesWithUserChangesByThread: restFilesWithChanges
				}
			})
		},

		duplicateThread: (threadId, newThreadId) => {
			set((state) => {
				const originalMessages = state.messagesByThread[threadId]
				const originalMetadata = state.threadMetadata[threadId]
				const originalThreadState = state.threadStateByThread[threadId]
				if (!originalMessages || !originalMetadata) return state

				const now = new Date().toISOString()
				return {
					messagesByThread: {
						...state.messagesByThread,
						[newThreadId]: [...originalMessages]
					},
					threadMetadata: {
						...state.threadMetadata,
						[newThreadId]: {
							...originalMetadata,
							id: newThreadId,
							createdAt: now,
							lastModified: now
						}
					},
					threadStateByThread: {
						...state.threadStateByThread,
						[newThreadId]: originalThreadState ? { ...originalThreadState } : defaultThreadState()
					},
					filesWithUserChangesByThread: {
						...state.filesWithUserChangesByThread,
						[newThreadId]: new Set(originalMessages.length > 0 ? state.filesWithUserChangesByThread[threadId] || [] : [])
					}
				}
			})
		},

		updateThreadMetadata: (threadId, metadata) => {
			set((state) => ({
				threadMetadata: {
					...state.threadMetadata,
					[threadId]: { ...state.threadMetadata[threadId], ...metadata }
				}
			}))
		},

		// ====== Stream State Actions ======

		setStreamState: (threadId, streamState) => {
			set((state) => ({
				streamStateByThread: {
					...state.streamStateByThread,
					[threadId]: streamState
				}
			}))
		},

		updateStreamLLMInfo: (threadId, llmInfo) => {
			set((state) => {
				const current = state.streamStateByThread[threadId]
				if (!current || current.isRunning !== 'LLM') return state
				return {
					streamStateByThread: {
						...state.streamStateByThread,
						[threadId]: {
							...current,
							llmInfo: { ...current.llmInfo, ...llmInfo } as NonNullable<StreamState['llmInfo']>
						}
					}
				}
			})
		},

		clearStreamState: (threadId) => {
			set((state) => {
				const { [threadId]: _, ...rest } = state.streamStateByThread
				return { streamStateByThread: rest }
			})
		},

		// ====== Thread State Actions ======

		setThreadState: (threadId, threadState) => {
			set((state) => ({
				threadStateByThread: {
					...state.threadStateByThread,
					[threadId]: { ...state.threadStateByThread[threadId], ...threadState }
				}
			}))
		},

		// ====== Batch Actions ======

		batchSetMessages: (messagesByThread) => {
			set({ messagesByThread })
		},

		batchSetThreadMetadata: (metadata) => {
			set({ threadMetadata: metadata })
		},

		batchSetThreadState: (threadStateByThread) => {
			set({ threadStateByThread })
		},

		// ====== Full State Sync ======

		setFullState: (newState) => {
			set(newState)
		},

		getFullState: () => {
			const state = get()
			return {
				messagesByThread: state.messagesByThread,
				threadMetadata: state.threadMetadata,
				currentThreadId: state.currentThreadId,
				threadStateByThread: state.threadStateByThread,
				filesWithUserChangesByThread: state.filesWithUserChangesByThread
			}
		}
	}))
)

// ============ Selectors (细粒度订阅) ============

// 只订阅当前线程 ID（非常轻量）
export const useCurrentThreadId = () =>
	useChatStore((state) => state.currentThreadId)

// Empty array constant to avoid creating new array on each call
const EMPTY_MESSAGES: ChatMessage[] = []

// 只订阅特定线程的消息
export const useThreadMessages = (threadId: string) =>
	useChatStore((state) => state.messagesByThread[threadId] ?? EMPTY_MESSAGES)

// 只订阅当前线程的消息
export const useCurrentThreadMessages = () => {
	const currentThreadId = useCurrentThreadId()
	return useThreadMessages(currentThreadId || '')
}

// 只订阅特定线程的流式状态
export const useThreadStreamState = (threadId: string) =>
	useChatStore((state) => state.streamStateByThread[threadId])

// 只订阅当前线程的流式状态
export const useCurrentThreadStreamState = () => {
	const currentThreadId = useCurrentThreadId()
	return useThreadStreamState(currentThreadId || '')
}

// 只订阅流式 LLM 信息（流式更新时只触发这个）
export const useThreadLLMInfo = (threadId: string) =>
	useChatStore((state) => state.streamStateByThread[threadId]?.llmInfo)

// 只订阅线程元数据（用于列表显示）
export const useThreadMetadata = (threadId: string) =>
	useChatStore((state) => state.threadMetadata[threadId])

// 订阅所有线程元数据（用于线程列表）- 使用 shallow 比较避免引用变化
export const useAllThreadMetadata = () =>
	useChatStore(useShallow((state) => state.threadMetadata))

// 只订阅特定线程的状态
export const useThreadState = (threadId: string) =>
	useChatStore((state) => state.threadStateByThread[threadId])

// 只订阅当前线程的状态
export const useCurrentThreadState = () => {
	const currentThreadId = useCurrentThreadId()
	return useThreadState(currentThreadId || '')
}

// 消息计数选择器（用于判断是否有新消息）
export const useThreadMessageCount = (threadId: string) =>
	useChatStore((state) => state.messagesByThread[threadId]?.length || 0)

// 当前线程消息计数
export const useCurrentThreadMessageCount = () => {
	const currentThreadId = useCurrentThreadId()
	return useThreadMessageCount(currentThreadId || '')
}

// 获取所有正在运行的线程 ID
export const useRunningThreadIds = () =>
	useChatStore(
		useShallow((state) => {
			const runningIds: string[] = []
			for (const [threadId, streamState] of Object.entries(state.streamStateByThread)) {
				if (streamState?.isRunning) {
					runningIds.push(threadId)
				}
			}
			return runningIds
		})
	)

// 检查特定线程是否在运行
export const useIsThreadRunning = (threadId: string) =>
	useChatStore((state) => {
		const streamState = state.streamStateByThread[threadId]
		return streamState?.isRunning !== undefined && streamState?.isRunning !== null
	})

// 获取所有线程 ID 列表（按最后修改时间排序）
export const useSortedThreadIds = () =>
	useChatStore(
		useShallow((state) => {
			return Object.keys(state.threadMetadata)
				.filter(threadId => (state.threadMetadata[threadId]?.messageCount || 0) > 0)
				.sort((a, b) => {
					const aTime = state.threadMetadata[a]?.lastModified || ''
					const bTime = state.threadMetadata[b]?.lastModified || ''
					return aTime > bTime ? -1 : 1
				})
		})
	)
