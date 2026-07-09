/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useEffect, useMemo, useState } from 'react';
import { CopyButton, IconShell1 } from '../markdown/ApplyBlockHoverButtons.js';
import { useAccessor, useAllThreadMetadata, useSortedThreadIds, useThreadMessages, useThreadStreamState, useSettingsState } from '../util/services.js';
import { Check, Copy, LoaderCircle, MessageCircleQuestion, Trash2, X } from 'lucide-react';
import { useVoidChatI18n } from '../util/i18n.js';


const numInitialThreads = 3

// 获取当前项目ID的hook
const useCurrentProjectId = () => {
	const accessor = useAccessor()
	const workspaceContextService = accessor.get('IWorkspaceContextService')

	const [projectId, setProjectId] = useState<string | undefined>(() => {
		const workspace = workspaceContextService.getWorkspace()
		console.log('[SidebarThreadSelector] initial workspace:', workspace)
		if (workspace.folders.length > 0) {
			return workspace.folders[0].uri.fsPath
		}
		return undefined
	})

	useEffect(() => {
		const updateProjectId = () => {
			const workspace = workspaceContextService.getWorkspace()
			console.log('[SidebarThreadSelector] updateProjectId - workspace:', workspace)
			if (workspace.folders.length > 0) {
				setProjectId(workspace.folders[0].uri.fsPath)
			} else {
				setProjectId(undefined)
			}
		}

		// 初始更新
		updateProjectId()

		// 监听工作区变化
		const disposable = workspaceContextService.onDidChangeWorkspaceFolders(updateProjectId)
		return () => disposable.dispose()
	}, [workspaceContextService])

	return projectId
}

// Format date to display as today, yesterday, or date
const formatDate = (date: Date, t: ReturnType<typeof useVoidChatI18n>) => {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (date >= today) {
		return t.today();
	} else if (date >= yesterday) {
		return t.yesterday();
	} else {
		return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
	}
};

// Format time to 12-hour format
const formatTime = (date: Date) => {
	return date.toLocaleString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
};


const DuplicateButton = ({ threadId }: { threadId: string }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService')
	return <IconShell1
		Icon={Copy}
		className='size-[11px]'
		onClick={() => { chatThreadsService.duplicateThread(threadId); }}
		data-tooltip-id='void-tooltip'
		data-tooltip-place='top'
		data-tooltip-content={t.duplicateThread()}
	>
	</IconShell1>

}

const TrashButton = ({ threadId }: { threadId: string }) => {
	const t = useVoidChatI18n()

	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService')


	const [isTrashPressed, setIsTrashPressed] = useState(false)

	return (isTrashPressed ?
		<div className='flex flex-nowrap text-nowrap gap-1'>
			<IconShell1
				Icon={X}
				className='size-[11px]'
				onClick={() => { setIsTrashPressed(false); }}
				data-tooltip-id='void-tooltip'
				data-tooltip-place='top'
				data-tooltip-content={t.cancel()}
			/>
			<IconShell1
				Icon={Check}
				className='size-[11px]'
				onClick={() => { chatThreadsService.deleteThread(threadId); setIsTrashPressed(false); }}
				data-tooltip-id='void-tooltip'
				data-tooltip-place='top'
				data-tooltip-content={t.confirm()}
			/>
		</div>
		: <IconShell1
			Icon={Trash2}
			className='size-[11px]'
			onClick={() => { setIsTrashPressed(true); }}
			data-tooltip-id='void-tooltip'
			data-tooltip-place='top'
			data-tooltip-content={t.deleteThread()}
		/>
	)
}

// 单个线程元素 - 使用细粒度订阅优化性能
const PastThreadElementMemo = ({ threadId, idx, hoveredIdx, setHoveredIdx }: {
	threadId: string,
	idx: number,
	hoveredIdx: number | null,
	setHoveredIdx: (idx: number | null) => void,
}) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService')

	// 细粒度订阅 - 只订阅这个线程的数据
	const metadata = useAllThreadMetadata()[threadId]
	const messages = useThreadMessages(threadId)
	const streamState = useThreadStreamState(threadId)

	const isRunning = streamState?.isRunning

	let firstMsg = null
	const firstUserMsgIdx = messages.findIndex((msg) => msg.role === 'user')

	if (firstUserMsgIdx !== -1) {
		const firstUserMsgObj = messages[firstUserMsgIdx]
		if (firstUserMsgObj.role === 'user') {
			// Check if message has text content
			const hasText = firstUserMsgObj.displayContent && firstUserMsgObj.displayContent.trim().length > 0
			// Check if message has images
			const hasImages = firstUserMsgObj.images && firstUserMsgObj.images.length > 0
			
			if (!hasText && hasImages) {
				// Only images, no text
				firstMsg = t.imageMessage()
			} else if (hasText) {
				// Has text content (possibly with images too)
				// Truncate for display
				const text = firstUserMsgObj.displayContent
				if (text.length > 50) {
					firstMsg = text.substring(0, 50) + '...'
				} else {
					firstMsg = text
				}
			} else {
				firstMsg = t.chatTitle()
			}
		} else {
			firstMsg = '""'
		}
	} else {
		firstMsg = '""'
	}

	const numMessages = messages.filter((msg) => msg.role === 'assistant' || msg.role === 'user').length

	// 获取项目名称（显示项目文件夹名，而不是完整路径）
	const projectName = metadata?.projectId ? metadata.projectId.split(/[/\\]/).pop() : undefined

	const detailsHTML = <span>
		<span className='opacity-60'>{numMessages}</span>
		{` `}
		{formatDate(new Date(metadata?.lastModified || ''), t)}
	</span>

	return <div
		className={`py-1 px-2 rounded text-sm bg-zinc-700/5 hover:bg-zinc-700/10 dark:bg-zinc-300/5 dark:hover:bg-zinc-300/10 cursor-pointer opacity-80 hover:opacity-100`}
		onClick={() => {
			chatThreadsService.switchToThread(threadId)
		}}
		onMouseEnter={() => setHoveredIdx(idx)}
		onMouseLeave={() => setHoveredIdx(null)}
	>
		<div className="flex items-center justify-between gap-1">
			<span className="flex items-center gap-2 min-w-0 overflow-hidden">
				{/* spinner */}
				{isRunning === 'LLM' || isRunning === 'tool' || isRunning === 'idle' ? <LoaderCircle className="animate-spin bg-void-stroke-1 flex-shrink-0 flex-grow-0" size={14} />
					:
					isRunning === 'awaiting_user' ? <MessageCircleQuestion className="bg-void-stroke-1 flex-shrink-0 flex-grow-0" size={14} />
						:
						null}
				{/* name */}
				<span className="truncate overflow-hidden text-ellipsis"
					data-tooltip-id='void-tooltip'
					data-tooltip-content={t.messagesCount(numMessages)}
					data-tooltip-place='top'
				>{firstMsg}</span>
			</span>

			<div className="flex items-center gap-x-1 opacity-60">
				{idx === hoveredIdx ?
					<>
						{/* 消息条数 */}
						<span className='text-xs'>{numMessages}</span>
						{/* 项目名称（调试用） */}
						{projectName && <span className='text-xs text-blue-400'>[{projectName}]</span>}
						{/* duplicate icon */}
						<DuplicateButton threadId={threadId} />
						{/* trash icon */}
						<TrashButton threadId={threadId} />
					</>
					: <>
						{detailsHTML}
					</>
				}
			</div>
		</div>
	</div>
}

export const PastThreadsList = ({ className = '' }: { className?: string }) => {
	const t = useVoidChatI18n()
	const [showAll, setShowAll] = useState(false);

	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

	// 获取当前项目ID
	const currentProjectId = useCurrentProjectId()

	// 获取设置状态
	const settingsState = useSettingsState()
	const showAllHistoryThreads = settingsState.globalSettings.showAllHistoryThreads

	// 使用细粒度选择器
	const sortedThreadIds = useSortedThreadIds()
	const allThreadMetadata = useAllThreadMetadata()

	// 过滤只显示当前项目的会话，以及没有项目ID的旧会话（兼容旧数据）
	// 如果 showAllHistoryThreads 为 true，则显示所有历史会话
	const filteredThreadIds = useMemo(() => {
		// 如果开启了显示所有历史会话，则不过滤
		if (showAllHistoryThreads) {
			return sortedThreadIds
		}
		return sortedThreadIds.filter(threadId => {
			const metadata = allThreadMetadata[threadId]
			// 如果没有项目ID（旧数据或没有项目时创建的），显示在所有项目中
			if (!metadata?.projectId) return true
			// 如果当前没有打开任何项目，显示所有会话
			if (!currentProjectId) return true
			// 如果有项目ID，只显示当前项目的
			return metadata.projectId === currentProjectId
		})
	}, [sortedThreadIds, allThreadMetadata, currentProjectId, showAllHistoryThreads])

	// Get only first 5 threads if not showing all
	const hasMoreThreads = filteredThreadIds.length > numInitialThreads;
	const displayThreads = showAll ? filteredThreadIds : filteredThreadIds.slice(0, numInitialThreads);

	return (
		<div className={`flex flex-col mb-2 gap-2 w-full text-nowrap text-void-fg-3 select-none relative ${className}`}>
			{displayThreads.length === 0 // this should never happen
				? <></>
				: displayThreads.map((threadId, i) => {
					return (
						<PastThreadElementMemo
							key={threadId}
							threadId={threadId}
							idx={i}
							hoveredIdx={hoveredIdx}
							setHoveredIdx={setHoveredIdx}
						/>
					);
				})
			}

			{hasMoreThreads && !showAll && (
				<div
					className="text-void-fg-3 opacity-80 hover:opacity-100 hover:brightness-115 cursor-pointer p-1 text-xs"
					onClick={() => setShowAll(true)}
				>
					{t.showMore(filteredThreadIds.length - numInitialThreads)}
				</div>
			)}
			{hasMoreThreads && showAll && (
				<div
					className="text-void-fg-3 opacity-80 hover:opacity-100 hover:brightness-115 cursor-pointer p-1 text-xs"
					onClick={() => setShowAll(false)}
				>
					{t.showLess()}
				</div>
			)}
		</div>
	);
};
