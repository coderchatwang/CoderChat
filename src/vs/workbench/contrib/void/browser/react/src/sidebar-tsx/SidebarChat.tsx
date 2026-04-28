/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { ButtonHTMLAttributes, FormEvent, FormHTMLAttributes, Fragment, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';


import { useAccessor, useChatThreadsState, useChatThreadsStreamState, useSettingsState, useActiveURI, useCommandBarState, useFullChatThreadsStreamState } from '../util/services.js';
import { useVoidChatI18n } from '../util/i18n.js';
import { ScrollType } from '../../../../../../../editor/common/editorCommon.js';

import { ChatMarkdownRender, ChatMessageLocation, getApplyBoxId } from '../markdown/ChatMarkdownRender.js';
import { URI } from '../../../../../../../base/common/uri.js';
import { IDisposable } from '../../../../../../../base/common/lifecycle.js';
import { ErrorDisplay } from './ErrorDisplay.js';
import { BlockCode, TextAreaFns, VoidCustomDropdownBox, VoidInputBox2, VoidSlider, VoidSwitch, VoidDiffEditor } from '../util/inputs.js';
import { ModelDropdown, } from '../void-settings-tsx/ModelDropdown.js';
import { PastThreadsList } from './SidebarThreadSelector.js';
import { VOID_CTRL_L_ACTION_ID } from '../../../actionIDs.js';
import { VOID_OPEN_SETTINGS_ACTION_ID } from '../../../voidSettingsPane.js';
import { ChatMode, displayInfoOfProviderName, FeatureName, isFeatureNameDisabled } from '../../../../../../../workbench/contrib/void/common/voidSettingsTypes.js';
import { ICommandService } from '../../../../../../../platform/commands/common/commands.js';
import { WarningBox } from '../void-settings-tsx/WarningBox.js';
import { getModelCapabilities, getIsReasoningEnabledState } from '../../../../common/modelCapabilities.js';
import { AlertTriangle, File, Ban, Check, ChevronRight, Dot, FileIcon, Pencil, Undo, Undo2, X, Flag, Copy as CopyIcon, Info, CirclePlus, Ellipsis, CircleEllipsis, Folder, ALargeSmall, TypeOutline, Text } from 'lucide-react';
import { ChatMessage, CheckpointEntry, ImageAttachment, StagingSelectionItem, ToolMessage } from '../../../../common/chatThreadServiceTypes.js';
import { approvalTypeOfBuiltinToolName, BuiltinToolCallParams, BuiltinToolName, BuiltinToolResultType, ToolName, LintErrorItem, ToolApprovalType, toolApprovalTypes } from '../../../../common/toolsServiceTypes.js';
import { CopyButton, EditToolAcceptRejectButtonsHTML, IconShell1, JumpToFileButton, JumpToTerminalButton, StatusIndicator, StatusIndicatorForApplyButton, useApplyStreamState, useEditToolStreamState } from '../markdown/ApplyBlockHoverButtons.js';
import { IsRunningType } from '../../../chatThreadService.js';
import { acceptAllBg, acceptBorder, buttonFontSize, buttonTextColor, rejectAllBg, rejectBg, rejectBorder } from '../../../../common/helpers/colors.js';
import { builtinToolNames, isABuiltinToolName, MAX_FILE_CHARS_PAGE, MAX_TERMINAL_INACTIVE_TIME } from '../../../../common/prompt/prompts.js';
import { RawToolCallObj } from '../../../../common/sendLLMMessageTypes.js';
import ErrorBoundary from './ErrorBoundary.js';
import { ToolApprovalTypeSwitch } from '../void-settings-tsx/Settings.js';

import { persistentTerminalNameOfId } from '../../../terminalToolService.js';
import { removeMCPToolNamePrefix } from '../../../../common/mcpServiceTypes.js';



export const IconX = ({ size, className = '', ...props }: { size: number, className?: string } & React.SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			className={className}
			{...props}
		>
			<path
				strokeLinecap='round'
				strokeLinejoin='round'
				d='M6 18 18 6M6 6l12 12'
			/>
		</svg>
	);
};

const IconArrowUp = ({ size, className = '' }: { size: number, className?: string }) => {
	return (
		<svg
			width={size}
			height={size}
			className={className}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill="black"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
			></path>
		</svg>
	);
};


const IconSquare = ({ size, className = '' }: { size: number, className?: string }) => {
	return (
		<svg
			className={className}
			stroke="black"
			fill="black"
			strokeWidth="0"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="2" y="2" width="20" height="20" rx="4" ry="4" />
		</svg>
	);
};


export const IconWarning = ({ size, className = '' }: { size: number, className?: string }) => {
	return (
		<svg
			className={className}
			stroke="currentColor"
			fill="currentColor"
			strokeWidth="0"
			viewBox="0 0 16 16"
			width={size}
			height={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.7L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z"
			/>
		</svg>
	);
};


export const IconLoading = ({ className = '' }: { className?: string }) => {

	const [loadingText, setLoadingText] = useState('.');

	useEffect(() => {
		let intervalId;

		// Function to handle the animation
		const toggleLoadingText = () => {
			if (loadingText === '...') {
				setLoadingText('.');
			} else {
				setLoadingText(loadingText + '.');
			}
		};

		// Start the animation loop
		intervalId = setInterval(toggleLoadingText, 300);

		// Cleanup function to clear the interval when component unmounts
		return () => clearInterval(intervalId);
	}, [loadingText, setLoadingText]);

	return <div className={`${className}`}>{loadingText}</div>;

}



// SLIDER ONLY:
const ReasoningOptionSlider = ({ featureName }: { featureName: FeatureName }) => {
	const accessor = useAccessor()
	const t = useVoidChatI18n()

	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidSettingsState = useSettingsState()

	const modelSelection = voidSettingsState.modelSelectionOfFeature[featureName]
	const overridesOfModel = voidSettingsState.overridesOfModel

	if (!modelSelection) return null

	const { modelName, providerName } = modelSelection
	const { reasoningCapabilities } = getModelCapabilities(providerName, modelName, overridesOfModel)
	const { canTurnOffReasoning, reasoningSlider: reasoningBudgetSlider } = reasoningCapabilities || {}

	const modelSelectionOptions = voidSettingsState.optionsOfModelSelection[featureName][providerName]?.[modelName]
	const isReasoningEnabled = getIsReasoningEnabledState(featureName, providerName, modelName, modelSelectionOptions, overridesOfModel)

	if (canTurnOffReasoning && !reasoningBudgetSlider) { // if it's just a on/off toggle without a power slider
		return <div className='flex items-center gap-x-2'>
			<span className='text-void-fg-3 text-xs pointer-events-none inline-block w-10 pr-1'>{t.reasoning()}</span>
			<VoidSwitch
				size='xxs'
				value={isReasoningEnabled}
				onChange={(newVal) => {
					const isOff = canTurnOffReasoning && !newVal
					voidSettingsService.setOptionsOfModelSelection(featureName, modelSelection.providerName, modelSelection.modelName, { reasoningEnabled: !isOff })
				}}
			/>
		</div>
	}

	if (reasoningBudgetSlider?.type === 'budget_slider') { // if it's a slider
		const { min: min_, max, default: defaultVal } = reasoningBudgetSlider

		const nSteps = 8 // only used in calculating stepSize, stepSize is what actually matters
		const stepSize = Math.round((max - min_) / nSteps)

		const valueIfOff = min_ - stepSize
		const min = canTurnOffReasoning ? valueIfOff : min_
		const value = isReasoningEnabled ? voidSettingsState.optionsOfModelSelection[featureName][modelSelection.providerName]?.[modelSelection.modelName]?.reasoningBudget ?? defaultVal
			: valueIfOff

		return <div className='flex items-center gap-x-2'>
			<span className='text-void-fg-3 text-xs pointer-events-none inline-block w-10 pr-1'>{t.reasoning()}</span>
			<VoidSlider
				width={50}
				size='xs'
				min={min}
				max={max}
				step={stepSize}
				value={value}
				onChange={(newVal) => {
					const isOff = canTurnOffReasoning && newVal === valueIfOff
					voidSettingsService.setOptionsOfModelSelection(featureName, modelSelection.providerName, modelSelection.modelName, { reasoningEnabled: !isOff, reasoningBudget: newVal })
				}}
			/>
			<span className='text-void-fg-3 text-xs pointer-events-none'>{isReasoningEnabled ? `${value} tokens` : t.reasoningDisabled()}</span>
		</div>
	}

	if (reasoningBudgetSlider?.type === 'effort_slider') {
		const { values, default: defaultVal } = reasoningBudgetSlider

		const min = canTurnOffReasoning ? -1 : 0
		const max = values.length - 1

		const currentEffort = voidSettingsState.optionsOfModelSelection[featureName][modelSelection.providerName]?.[modelSelection.modelName]?.reasoningEffort ?? defaultVal
		const valueIfOff = -1
		const value = isReasoningEnabled && currentEffort ? values.indexOf(currentEffort) : valueIfOff

		const currentEffortCapitalized = currentEffort.charAt(0).toUpperCase() + currentEffort.slice(1, Infinity)

		return <div className='flex items-center gap-x-2'>
			<span className='text-void-fg-3 text-xs pointer-events-none inline-block w-10 pr-1'>{t.reasoning()}</span>
			<VoidSlider
				width={30}
				size='xs'
				min={min}
				max={max}
				step={1}
				value={value}
				onChange={(newVal) => {
					const isOff = canTurnOffReasoning && newVal === valueIfOff
					voidSettingsService.setOptionsOfModelSelection(featureName, modelSelection.providerName, modelSelection.modelName, { reasoningEnabled: !isOff, reasoningEffort: values[newVal] ?? undefined })
				}}
			/>
			<span className='text-void-fg-3 text-xs pointer-events-none'>{isReasoningEnabled ? `${currentEffortCapitalized}` : t.reasoningDisabled()}</span>
		</div>
	}

	return null
}



const getNameOfChatMode = (t: ReturnType<typeof useVoidChatI18n>) => ({
	'normal': t.chatModeNameChat(),
	'gather': t.chatModeNameGather(),
	'agent': t.chatModeNameAgent(),
})

const getDetailOfChatMode = (t: ReturnType<typeof useVoidChatI18n>) => ({
	'normal': t.chatModeNormal(),
	'gather': t.chatModeGather(),
	'agent': t.chatModeAgent(),
})


const ChatModeDropdown = ({ className }: { className: string }) => {
	const accessor = useAccessor()
	const t = useVoidChatI18n()

	const voidSettingsService = accessor.get('IVoidSettingsService')
	const settingsState = useSettingsState()

	const options: ChatMode[] = useMemo(() => ['normal', 'gather', 'agent'], [])
	const nameOfChatMode = useMemo(() => getNameOfChatMode(t), [t])
	const detailOfChatMode = useMemo(() => getDetailOfChatMode(t), [t])

	const onChangeOption = useCallback((newVal: ChatMode) => {
		voidSettingsService.setGlobalSetting('chatMode', newVal)
	}, [voidSettingsService])

	return <VoidCustomDropdownBox
		className={className}
		options={options}
		selectedOption={settingsState.globalSettings.chatMode}
		onChangeOption={onChangeOption}
		getOptionDisplayName={(val) => nameOfChatMode[val]}
		getOptionDropdownName={(val) => nameOfChatMode[val]}
		getOptionDropdownDetail={(val) => detailOfChatMode[val]}
		getOptionsEqual={(a, b) => a === b}
	/>

}





// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<{ base64: string; mediaType: string }> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			// Remove data URL prefix to get just the base64 data
			const base64 = result.split(',')[1]
			resolve({ base64, mediaType: file.type })
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}

// Generate unique ID for images
const generateImageId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

interface VoidChatAreaProps {
	// Required
	children: React.ReactNode; // This will be the input component

	// Form controls
	onSubmit: () => void;
	onAbort: () => void;
	isStreaming: boolean;
	isDisabled?: boolean;
	divRef?: React.RefObject<HTMLDivElement | null>;

	// UI customization
	className?: string;
	showModelDropdown?: boolean;
	showSelections?: boolean;
	showProspectiveSelections?: boolean;
	loadingIcon?: React.ReactNode;

	selections?: StagingSelectionItem[]
	setSelections?: (s: StagingSelectionItem[]) => void

	// Image support
	images?: ImageAttachment[]
	setImages?: (images: ImageAttachment[]) => void
	supportsVision?: boolean // whether the current model supports vision/image inputs

	onClickAnywhere?: () => void;
	// Optional close button
	onClose?: () => void;

	featureName: FeatureName;
}

// Image upload button component
const ImageUploadButton: React.FC<{
	onImageSelect: (files: File[]) => void
	disabled?: boolean
}> = ({ onImageSelect, disabled }) => {
	const t = useVoidChatI18n()
	const inputRef = useRef<HTMLInputElement>(null)

	const handleClick = () => {
		inputRef.current?.click()
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		const imageFiles = files.filter(f => f.type.startsWith('image/'))
		if (imageFiles.length > 0) {
			onImageSelect(imageFiles)
		}
		// Reset input so the same file can be selected again
		e.target.value = ''
	}

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				onChange={handleChange}
				className="hidden"
			/>
			<button
				type="button"
				onClick={handleClick}
				disabled={disabled}
				className={`
					p-1 rounded
					text-void-fg-3 hover:text-void-fg-1
					hover:bg-void-bg-2
					transition-colors
					${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
				`}
				title={t.uploadImageTitle()}
			>
				<svg
					width={18}
					height={18}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<circle cx="8.5" cy="8.5" r="1.5" />
					<polyline points="21,15 16,10 5,21" />
				</svg>
			</button>
		</>
	)
}

// Image preview component
// Image Lightbox component for viewing full-size images
const ImageLightbox: React.FC<{
	image: ImageAttachment
	onClose: () => void
}> = ({ image, onClose }) => {
	const t = useVoidChatI18n()
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	// Handle Escape key to close
	useEffect(() => {
		const handleKeyDown = (e: globalThis.KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onClose])

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
			onClick={handleBackdropClick}
		>
			<div className="relative max-w-[90vw] max-h-[90vh]">
				<img
					src={`data:${image.mediaType};base64,${image.base64}`}
					alt={image.fileName || t.imageAlt()}
					className="max-w-full max-h-[90vh] object-contain rounded-lg"
				/>
				<button
					type="button"
					onClick={onClose}
					className="
						absolute -top-2 -right-2
						w-8 h-8
						flex items-center justify-center
						bg-void-bg-1 border border-void-border-2 rounded-full
						text-void-fg-3 hover:text-void-fg-1
						cursor-pointer
						shadow-lg
					"
				>
					<IconX size={14} />
				</button>
			</div>
		</div>
	)
}

const ImagePreview: React.FC<{
	image: ImageAttachment
	onRemove: () => void
}> = ({ image, onRemove }) => {
	const t = useVoidChatI18n()
	const [showLightbox, setShowLightbox] = useState(false)

	return (
		<>
			<div className="relative group inline-block">
				<img
					src={`data:${image.mediaType};base64,${image.base64}`}
					alt={image.fileName || t.imageAlt()}
					className="h-16 w-16 object-cover rounded border border-void-border-2 cursor-pointer hover:opacity-80 transition-opacity"
					onClick={() => setShowLightbox(true)}
				/>
				<button
					type="button"
					onClick={onRemove}
					className="
						absolute -top-1 -right-1
						w-5 h-5
						flex items-center justify-center
						bg-void-bg-1 border border-void-border-2 rounded-full
						text-void-fg-3 hover:text-void-fg-1
						opacity-0 group-hover:opacity-100
						transition-opacity
						cursor-pointer
					"
				>
					<IconX size={10} />
				</button>
			</div>
			{showLightbox && (
				<ImageLightbox image={image} onClose={() => setShowLightbox(false)} />
			)}
		</>
	)
}

export const VoidChatArea: React.FC<VoidChatAreaProps> = ({
	children,
	onSubmit,
	onAbort,
	onClose,
	onClickAnywhere,
	divRef,
	isStreaming = false,
	isDisabled = false,
	className = '',
	showModelDropdown = true,
	showSelections = false,
	showProspectiveSelections = false,
	selections,
	setSelections,
	images,
	setImages,
	supportsVision = false,
	featureName,
	loadingIcon,
}) => {
	const t = useVoidChatI18n()
	const [isDragging, setIsDragging] = useState(false)

	// Handle file drop
	const handleDrop = useCallback(async (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)

		if (!setImages || isStreaming) return

		const files = Array.from(e.dataTransfer.files)
		const imageFiles = files.filter(f => f.type.startsWith('image/'))

		if (imageFiles.length === 0) return

		const newImages: ImageAttachment[] = []
		for (const file of imageFiles) {
			try {
				const { base64, mediaType } = await fileToBase64(file)
				newImages.push({
					id: generateImageId(),
					base64,
					mediaType,
					fileName: file.name
				})
			} catch (err) {
				console.error('Failed to read image file:', err)
			}
		}

		if (newImages.length > 0) {
			setImages([...(images || []), ...newImages])
		}
	}, [setImages, images, isStreaming])

	// Handle drag over
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		if (!isStreaming) {
			setIsDragging(true)
		}
	}, [isStreaming])

	// Handle drag leave
	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}, [])

	// Handle image selection from button
	const handleImageSelect = useCallback(async (files: File[]) => {
		if (!setImages || isStreaming) return

		const newImages: ImageAttachment[] = []
		for (const file of files) {
			try {
				const { base64, mediaType } = await fileToBase64(file)
				newImages.push({
					id: generateImageId(),
					base64,
					mediaType,
					fileName: file.name
				})
			} catch (err) {
				console.error('Failed to read image file:', err)
			}
		}

		if (newImages.length > 0) {
			setImages([...(images || []), ...newImages])
		}
	}, [setImages, images, isStreaming])

	// Handle paste event for images
	const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
		if (!setImages || isStreaming) return

		const items = Array.from(e.clipboardData.items)
		const imageItems = items.filter(item => item.type.startsWith('image/'))

		if (imageItems.length === 0) return

		const newImages: ImageAttachment[] = []
		for (const item of imageItems) {
			const file = item.getAsFile()
			if (!file) continue

			try {
				const { base64, mediaType } = await fileToBase64(file)
				newImages.push({
					id: generateImageId(),
					base64,
					mediaType,
					fileName: 'pasted-image'
				})
			} catch (err) {
				console.error('Failed to read pasted image:', err)
			}
		}

		if (newImages.length > 0) {
			setImages([...(images || []), ...newImages])
		}
	}, [setImages, images, isStreaming])

	// Remove image
	const handleRemoveImage = useCallback((imageId: string) => {
		if (!setImages || !images) return
		setImages(images.filter(img => img.id !== imageId))
	}, [setImages, images])

	return (
		<div
			ref={divRef}
			className={`
				gap-x-1
                flex flex-col p-2 relative input text-left shrink-0
                rounded-md
                bg-void-bg-1
				transition-all duration-200
				border border-void-border-3 focus-within:border-void-border-1 hover:border-void-border-1
				max-h-[80vh] overflow-y-auto
				${isDragging ? 'border-void-border-1 bg-void-bg-2' : ''}
                ${className}
            `}
			onClick={(e) => {
				onClickAnywhere?.()
			}}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onPaste={handlePaste}
		>
			{/* Selections section */}
			{showSelections && selections && setSelections && (
				<SelectedFiles
					type='staging'
					selections={selections}
					setSelections={setSelections}
					showProspectiveSelections={showProspectiveSelections}
				/>
			)}

			{/* Images section */}
			{images && images.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-2">
					{images.map(image => (
						<ImagePreview
							key={image.id}
							image={image}
							onRemove={() => handleRemoveImage(image.id)}
						/>
					))}
				</div>
			)}

			{/* Drag overlay */}
			{isDragging && (
				<div className="absolute inset-0 bg-void-bg-2 bg-opacity-80 flex items-center justify-center z-10 rounded-md pointer-events-none">
					<div className="text-void-fg-2 text-sm">
						{t.dropImagePlaceholder()}
					</div>
				</div>
			)}

			{/* Input section */}
			<div className="relative w-full">
				{children}

				{/* Close button (X) if onClose is provided */}
				{onClose && (
					<div className='absolute -top-1 -right-1 cursor-pointer z-1'>
						<IconX
							size={12}
							className="stroke-[2] opacity-80 text-void-fg-3 hover:brightness-95"
							onClick={onClose}
						/>
					</div>
				)}
			</div>

			{/* Bottom row */}
			<div className='flex flex-row justify-between items-end gap-1'>
				{showModelDropdown && (
					<div className='flex flex-col gap-y-1'>
						<ReasoningOptionSlider featureName={featureName} />

						<div className='flex items-center flex-wrap gap-x-2 gap-y-1 text-nowrap '>
							{featureName === 'Chat' && <ChatModeDropdown className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-2 rounded py-0.5 px-1' />}
							<ModelDropdown featureName={featureName} className='text-xs text-void-fg-3 bg-void-bg-1 rounded' />
						</div>
					</div>
				)}

				<div className="flex items-center gap-2">
					{/* Image upload button - only show if model supports vision */}
					{setImages && supportsVision && (
						<ImageUploadButton
							onImageSelect={handleImageSelect}
							disabled={isStreaming}
						/>
					)}

					{isStreaming && loadingIcon}

					{isStreaming ? (
						<ButtonStop onClick={onAbort} />
					) : (
						<ButtonSubmit
							onClick={onSubmit}
							disabled={isDisabled}
						/>
					)}
				</div>

			</div>
		</div>
	);
};




type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
const DEFAULT_BUTTON_SIZE = 22;
export const ButtonSubmit = ({ className, disabled, ...props }: ButtonProps & Required<Pick<ButtonProps, 'disabled'>>) => {

	return <button
		type='button'
		className={`rounded-full flex-shrink-0 flex-grow-0 flex items-center justify-center
			${disabled ? 'bg-vscode-disabled-fg cursor-default' : 'bg-white cursor-pointer'}
			${className}
		`}
		// data-tooltip-id='void-tooltip'
		// data-tooltip-content={'Send'}
		// data-tooltip-place='left'
		{...props}
	>
		<IconArrowUp size={DEFAULT_BUTTON_SIZE} className="stroke-[2] p-[2px]" />
	</button>
}

export const ButtonStop = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
	return <button
		className={`rounded-full flex-shrink-0 flex-grow-0 cursor-pointer flex items-center justify-center
			bg-white
			${className}
		`}
		type='button'
		{...props}
	>
		<IconSquare size={DEFAULT_BUTTON_SIZE} className="stroke-[3] p-[7px]" />
	</button>
}



const scrollToBottom = (divRef: { current: HTMLElement | null }) => {
	if (divRef.current) {
		divRef.current.scrollTop = divRef.current.scrollHeight;
	}
};



const ScrollToBottomContainer = ({ children, className, style, scrollContainerRef }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, scrollContainerRef: React.MutableRefObject<HTMLDivElement | null> }) => {
	const [isAtBottom, setIsAtBottom] = useState(true); // Start at bottom

	const divRef = scrollContainerRef

	const onScroll = () => {
		const div = divRef.current;
		if (!div) return;

		const isBottom = Math.abs(
			div.scrollHeight - div.clientHeight - div.scrollTop
		) < 4;

		setIsAtBottom(isBottom);
	};

	// When children change (new messages added)
	useEffect(() => {
		if (isAtBottom) {
			scrollToBottom(divRef);
		}
	}, [children, isAtBottom]); // Dependency on children to detect new messages

	// Initial scroll to bottom
	useEffect(() => {
		scrollToBottom(divRef);
	}, []);

	return (
		<div
			ref={divRef}
			onScroll={onScroll}
			className={className}
			style={style}
		>
			{children}
		</div>
	);
};

export const getRelative = (uri: URI, accessor: ReturnType<typeof useAccessor>) => {
	const workspaceContextService = accessor.get('IWorkspaceContextService')
	let path: string
	const isInside = workspaceContextService.isInsideWorkspace(uri)
	if (isInside) {
		const f = workspaceContextService.getWorkspace().folders.find(f => uri.fsPath?.startsWith(f.uri.fsPath))
		if (f) { path = uri.fsPath.replace(f.uri.fsPath, '') }
		else { path = uri.fsPath }
	}
	else {
		path = uri.fsPath
	}
	return path || undefined
}

export const getFolderName = (pathStr: string) => {
	// 'unixify' path
	pathStr = pathStr.replace(/[/\\]+/g, '/') // replace any / or \ or \\ with /
	const parts = pathStr.split('/') // split on /
	// Filter out empty parts (the last element will be empty if path ends with /)
	const nonEmptyParts = parts.filter(part => part.length > 0)
	if (nonEmptyParts.length === 0) return '/' // Root directory
	if (nonEmptyParts.length === 1) return nonEmptyParts[0] + '/' // Only one folder
	// Get the last two parts
	const lastTwo = nonEmptyParts.slice(-2)
	return lastTwo.join('/') + '/'
}

export const getBasename = (pathStr: string, parts: number = 1) => {
	// 'unixify' path
	pathStr = pathStr.replace(/[/\\]+/g, '/') // replace any / or \ or \\ with /
	const allParts = pathStr.split('/') // split on /
	if (allParts.length === 0) return pathStr
	return allParts.slice(-parts).join('/')
}



// Open file utility function
export const voidOpenFileFn = (
	uri: URI,
	accessor: ReturnType<typeof useAccessor>,
	range?: [number, number]
) => {
	const commandService = accessor.get('ICommandService')
	const editorService = accessor.get('ICodeEditorService')

	// Get editor selection from CodeSelection range
	let editorSelection = undefined;

	// If we have a selection, create an editor selection from the range
	if (range) {
		editorSelection = {
			startLineNumber: range[0],
			startColumn: 1,
			endLineNumber: range[1],
			endColumn: Number.MAX_SAFE_INTEGER,
		};
	}

	// open the file
	commandService.executeCommand('vscode.open', uri).then(() => {

		// select the text
		setTimeout(() => {
			if (!editorSelection) return;

			const editor = editorService.getActiveCodeEditor()
			if (!editor) return;

			editor.setSelection(editorSelection)
			editor.revealRange(editorSelection, ScrollType.Immediate)

		}, 50) // needed when document was just opened and needs to initialize

	})

};


export const SelectedFiles = (
	{ type, selections, setSelections, showProspectiveSelections, messageIdx, }:
		| { type: 'past', selections: StagingSelectionItem[]; setSelections?: undefined, showProspectiveSelections?: undefined, messageIdx: number, }
		| { type: 'staging', selections: StagingSelectionItem[]; setSelections: ((newSelections: StagingSelectionItem[]) => void), showProspectiveSelections?: boolean, messageIdx?: number }
) => {

	const accessor = useAccessor()
	const t = useVoidChatI18n()
	const commandService = accessor.get('ICommandService')
	const modelReferenceService = accessor.get('IVoidModelService')




	// state for tracking prospective files
	const { uri: currentURI } = useActiveURI()
	const [recentUris, setRecentUris] = useState<URI[]>([])
	const maxRecentUris = 10
	const maxProspectiveFiles = 3
	useEffect(() => { // handle recent files
		if (!currentURI) return
		setRecentUris(prev => {
			const withoutCurrent = prev.filter(uri => uri.fsPath !== currentURI.fsPath) // remove duplicates
			const withCurrent = [currentURI, ...withoutCurrent]
			return withCurrent.slice(0, maxRecentUris)
		})
	}, [currentURI])
	const [prospectiveSelections, setProspectiveSelections] = useState<StagingSelectionItem[]>([])


	// handle prospective files
	useEffect(() => {
		const computeRecents = async () => {
			const prospectiveURIs = recentUris
				.filter(uri => !selections.find(s => s.type === 'File' && s.uri.fsPath === uri.fsPath))
				.slice(0, maxProspectiveFiles)

			const answer: StagingSelectionItem[] = []
			for (const uri of prospectiveURIs) {
				answer.push({
					type: 'File',
					uri: uri,
					language: (await modelReferenceService.getModelSafe(uri)).model?.getLanguageId() || 'plaintext',
					state: { wasAddedAsCurrentFile: false },
				})
			}
			return answer
		}

		// add a prospective file if type === 'staging' and if the user is in a file, and if the file is not selected yet
		if (type === 'staging' && showProspectiveSelections) {
			computeRecents().then((a) => setProspectiveSelections(a))
		}
		else {
			setProspectiveSelections([])
		}
	}, [recentUris, selections, type, showProspectiveSelections])


	const allSelections = [...selections, ...prospectiveSelections]

	if (allSelections.length === 0) {
		return null
	}

	return (
		<div className='flex items-center flex-wrap text-left relative gap-x-0.5 gap-y-1 pb-0.5'>

			{allSelections.map((selection, i) => {

				const isThisSelectionProspective = i > selections.length - 1

				const thisKey = selection.type === 'CodeSelection' ? selection.type + selection.language + selection.range + selection.state.wasAddedAsCurrentFile + selection.uri.fsPath
					: selection.type === 'File' ? selection.type + selection.language + selection.state.wasAddedAsCurrentFile + selection.uri.fsPath
						: selection.type === 'Folder' ? selection.type + selection.language + selection.state + selection.uri.fsPath
							: i

				const SelectionIcon = (
					selection.type === 'File' ? File
						: selection.type === 'Folder' ? Folder
							: selection.type === 'CodeSelection' ? Text
								: (undefined as never)
				)

				return <div // container for summarybox and code
					key={thisKey}
					className={`flex flex-col space-y-[1px]`}
				>
					{/* tooltip for file path */}
					<span className="truncate overflow-hidden text-ellipsis"
						data-tooltip-id='void-tooltip'
						data-tooltip-content={getRelative(selection.uri, accessor)}
						data-tooltip-place='top'
						data-tooltip-delay-show={3000}
					>
						{/* summarybox */}
						<div
							className={`
								flex items-center gap-1 relative
								px-1
								w-fit h-fit
								select-none
								text-xs text-nowrap
								border rounded-sm
								${isThisSelectionProspective ? 'bg-void-bg-1 text-void-fg-3 opacity-80' : 'bg-void-bg-1 hover:brightness-95 text-void-fg-1'}
								${isThisSelectionProspective
									? 'border-void-border-2'
									: 'border-void-border-1'
								}
								hover:border-void-border-1
								transition-all duration-150
							`}
							onClick={() => {
								if (type !== 'staging') return; // (never)
								if (isThisSelectionProspective) { // add prospective selection to selections
									setSelections([...selections, selection])
								}
								else if (selection.type === 'File') { // open files
									voidOpenFileFn(selection.uri, accessor);

									const wasAddedAsCurrentFile = selection.state.wasAddedAsCurrentFile
									if (wasAddedAsCurrentFile) {
										// make it so the file is added permanently, not just as the current file
										const newSelection: StagingSelectionItem = { ...selection, state: { ...selection.state, wasAddedAsCurrentFile: false } }
										setSelections([
											...selections.slice(0, i),
											newSelection,
											...selections.slice(i + 1)
										])
									}
								}
								else if (selection.type === 'CodeSelection') {
									voidOpenFileFn(selection.uri, accessor, selection.range);
								}
								else if (selection.type === 'Folder') {
									// TODO!!! reveal in tree
								}
							}}
						>
							{<SelectionIcon size={10} />}

							{ // file name and range
								getBasename(selection.uri.fsPath)
								+ (selection.type === 'CodeSelection' ? ` (${selection.range[0]}-${selection.range[1]})` : '')
							}

							{selection.type === 'File' && selection.state.wasAddedAsCurrentFile && messageIdx === undefined && currentURI?.fsPath === selection.uri.fsPath ?
								<span className={`text-[8px] 'void-opacity-60 text-void-fg-4`}>
									{t.currentFile()}
								</span>
								: null
							}

							{type === 'staging' && !isThisSelectionProspective ? // X button
								<div // box for making it easier to click
									className='cursor-pointer z-1 self-stretch flex items-center justify-center'
									onClick={(e) => {
										e.stopPropagation(); // don't open/close selection
										if (type !== 'staging') return;
										setSelections([...selections.slice(0, i), ...selections.slice(i + 1)])
									}}
								>
									<IconX
										className='stroke-[2]'
										size={10}
									/>
								</div>
								: <></>
							}
						</div>
					</span>
				</div>

			})}


		</div>

	)
}


type ToolHeaderParams = {
	icon?: React.ReactNode;
	title: React.ReactNode;
	desc1: React.ReactNode;
	desc1OnClick?: () => void;
	desc2?: React.ReactNode;
	isError?: boolean;
	info?: string;
	desc1Info?: string;
	isRejected?: boolean;
	numResults?: number;
	hasNextPage?: boolean;
	children?: React.ReactNode;
	bottomChildren?: React.ReactNode;
	onClick?: () => void;
	desc2OnClick?: () => void;
	isOpen?: boolean;
	className?: string;
}

const ToolHeaderWrapper = ({
	icon,
	title,
	desc1,
	desc1OnClick,
	desc1Info,
	desc2,
	numResults,
	hasNextPage,
	children,
	info,
	bottomChildren,
	isError,
	onClick,
	desc2OnClick,
	isOpen,
	isRejected,
	className, // applies to the main content
}: ToolHeaderParams) => {

	const t = useVoidChatI18n()
	const [isOpen_, setIsOpen] = useState(false);
	const isExpanded = isOpen !== undefined ? isOpen : isOpen_

	const isDropdown = children !== undefined // null ALLOWS dropdown
	const isClickable = !!(isDropdown || onClick)

	const isDesc1Clickable = !!desc1OnClick

	const desc1HTML = <span
		className={`text-void-fg-4 text-xs italic truncate ml-2
			${isDesc1Clickable ? 'cursor-pointer hover:brightness-125 transition-all duration-150' : ''}
		`}
		onClick={desc1OnClick}
		{...desc1Info ? {
			'data-tooltip-id': 'void-tooltip',
			'data-tooltip-content': desc1Info,
			'data-tooltip-place': 'top',
			'data-tooltip-delay-show': 1000,
		} : {}}
	>{desc1}</span>

	return (<div className=''>
		<div className={`w-full border border-void-border-3 rounded px-2 py-1 bg-void-bg-3 overflow-hidden ${className}`}>
			{/* header */}
			<div className={`select-none flex items-center min-h-[24px]`}>
				<div className={`flex items-center w-full gap-x-2 overflow-hidden justify-between ${isRejected ? 'line-through' : ''}`}>
					{/* left */}
					<div // container for if desc1 is clickable
						className='ml-1 flex items-center overflow-hidden'
					>
						{/* title eg "> Edited File" */}
						<div className={`
							flex items-center min-w-0 overflow-hidden grow
							${isClickable ? 'cursor-pointer hover:brightness-125 transition-all duration-150' : ''}
						`}
							onClick={() => {
								if (isDropdown) { setIsOpen(v => !v); }
								if (onClick) { onClick(); }
							}}
						>
							{isDropdown && (<ChevronRight
								className={`
								text-void-fg-3 mr-0.5 h-4 w-4 flex-shrink-0 transition-transform duration-100 ease-[cubic-bezier(0.4,0,0.2,1)]
								${isExpanded ? 'rotate-90' : ''}
							`}
							/>)}
							<span className="text-void-fg-3 flex-shrink-0">{title}</span>

							{!isDesc1Clickable && desc1HTML}
						</div>
						{isDesc1Clickable && desc1HTML}
					</div>

					{/* right */}
					<div className="flex items-center gap-x-2 flex-shrink-0">

						{info && <CircleEllipsis
							className='ml-2 text-void-fg-4 opacity-60 flex-shrink-0'
							size={14}
							data-tooltip-id='void-tooltip'
							data-tooltip-content={info}
							data-tooltip-place='top-end'
						/>}

						{isError && <AlertTriangle
							className='text-void-warning opacity-90 flex-shrink-0'
							size={14}
							data-tooltip-id='void-tooltip'
							data-tooltip-content={t.toolError()}
							data-tooltip-place='top'
						/>}
						{isRejected && <Ban
							className='text-void-fg-4 opacity-90 flex-shrink-0'
							size={14}
							data-tooltip-id='void-tooltip'
							data-tooltip-content={t.toolCancelled()}
							data-tooltip-place='top'
						/>}
						{desc2 && <span className="text-void-fg-4 text-xs" onClick={desc2OnClick}>
							{desc2}
						</span>}
						{numResults !== undefined && (
							<span className="text-void-fg-4 text-xs ml-auto mr-1">
								{t.resultsCount(numResults, !!hasNextPage)}
							</span>
						)}
					</div>
				</div>
			</div>
			{/* children */}
			{<div
				className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'opacity-100 py-1' : 'max-h-0 opacity-0'}
					text-void-fg-4 rounded-sm overflow-x-auto
				  `}
			//    bg-black bg-opacity-10 border border-void-border-4 border-opacity-50
			>
				{children}
			</div>}
		</div>
		{bottomChildren}
	</div>);
};



const EditTool = ({ toolMessage, threadId, messageIdx, content }: Parameters<ResultWrapper<'edit_file' | 'rewrite_file'>>[0] & { content: string }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const isError = false
	const isRejected = toolMessage.type === 'rejected'

	const title = getTitle(toolMessage, t)

	const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
	const icon = null

	const { rawParams, params, name } = toolMessage
	const desc1OnClick = () => voidOpenFileFn(params.uri, accessor)
	const componentParams: ToolHeaderParams = { title, desc1, desc1OnClick, desc1Info, isError, icon, isRejected, }


	const editToolType = toolMessage.name === 'edit_file' ? 'diff' : 'rewrite'
	if (toolMessage.type === 'running_now' || toolMessage.type === 'tool_request') {
		componentParams.children = <ToolChildrenWrapper className='bg-void-bg-3'>
			<EditToolChildren
				uri={params.uri}
				code={content}
				type={editToolType}
			/>
		</ToolChildrenWrapper>
		// JumpToFileButton removed in favor of FileLinkText
	}
	else if (toolMessage.type === 'success' || toolMessage.type === 'rejected' || toolMessage.type === 'tool_error') {
		// add apply box
		const applyBoxId = getApplyBoxId({
			threadId: threadId,
			messageIdx: messageIdx,
			tokenIdx: 'N/A',
		})
		componentParams.desc2 = <EditToolHeaderButtons
			applyBoxId={applyBoxId}
			uri={params.uri}
			codeStr={content}
			toolName={name}
			threadId={threadId}
		/>

		// add children
		componentParams.children = <ToolChildrenWrapper className='bg-void-bg-3'>
			<EditToolChildren
				uri={params.uri}
				code={content}
				type={editToolType}
			/>
		</ToolChildrenWrapper>

		if (toolMessage.type === 'success' || toolMessage.type === 'rejected') {
			const { result } = toolMessage
			componentParams.bottomChildren = <BottomChildren title={t.lintErrors()}>
				{result?.lintErrors?.map((error, i) => (
					<div key={i} className='whitespace-nowrap'>{t.lineRange(error.startLineNumber, error.endLineNumber)}：{error.message}</div>
				))}
			</BottomChildren>
		}
		else if (toolMessage.type === 'tool_error') {
			// error
			const { result } = toolMessage
			componentParams.bottomChildren = <BottomChildren title={t.error()}>
				<CodeChildren>
					{result}
				</CodeChildren>
			</BottomChildren>
		}
	}

	return <ToolHeaderWrapper {...componentParams} />
}

const SimplifiedToolHeader = ({
	title,
	children,
}: {
	title: string;
	children?: React.ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const isDropdown = children !== undefined;
	return (
		<div>
			<div className="w-full">
				{/* header */}
				<div
					className={`select-none flex items-center min-h-[24px] ${isDropdown ? 'cursor-pointer' : ''}`}
					onClick={() => {
						if (isDropdown) { setIsOpen(v => !v); }
					}}
				>
					{isDropdown && (
						<ChevronRight
							className={`text-void-fg-3 mr-0.5 h-4 w-4 flex-shrink-0 transition-transform duration-100 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'rotate-90' : ''}`}
						/>
					)}
					<div className="flex items-center w-full overflow-hidden">
						<span className="text-void-fg-3">{title}</span>
					</div>
				</div>
				{/* children */}
				{<div
					className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0'} text-void-fg-4`}
				>
					{children}
				</div>}
			</div>
		</div>
	);
};




const UserMessageComponent = ({ chatMessage, messageIdx, isCheckpointGhost, currCheckpointIdx, _scrollToBottom }: { chatMessage: ChatMessage & { role: 'user' }, messageIdx: number, currCheckpointIdx: number | undefined, isCheckpointGhost: boolean, _scrollToBottom: (() => void) | null }) => {

	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService')
	const voidSettingsState = useSettingsState()

	// Get current model's vision support
	const modelSelection = voidSettingsState.modelSelectionOfFeature['Chat']
	const overridesOfModel = voidSettingsState.overridesOfModel
	let supportsVision = false
	if (modelSelection) {
		const { modelName, providerName } = modelSelection
		supportsVision = getModelCapabilities(providerName, modelName, overridesOfModel).supportsVision ?? false
	}

	// global state
	let isBeingEdited = false
	let stagingSelections: StagingSelectionItem[] = []
	let setIsBeingEdited = (_: boolean) => { }
	let setStagingSelections = (_: StagingSelectionItem[]) => { }

	if (messageIdx !== undefined) {
		const _state = chatThreadsService.getCurrentMessageState(messageIdx)
		isBeingEdited = _state.isBeingEdited
		stagingSelections = _state.stagingSelections
		setIsBeingEdited = (v) => chatThreadsService.setCurrentMessageState(messageIdx, { isBeingEdited: v })
		setStagingSelections = (s) => chatThreadsService.setCurrentMessageState(messageIdx, { stagingSelections: s })
	}

	// local state for images during edit
	const [stagingImages, setStagingImages] = useState<ImageAttachment[]>([])

	// local state
	const mode: ChatBubbleMode = isBeingEdited ? 'edit' : 'display'
	const [isFocused, setIsFocused] = useState(false)
	const [isHovered, setIsHovered] = useState(false)
	const [isDisabled, setIsDisabled] = useState(false)
	const [textAreaRefState, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null)
	const textAreaFnsRef = useRef<TextAreaFns | null>(null)
	// initialize on first render, and when edit was just enabled
	const _mustInitialize = useRef(true)
	const _justEnabledEdit = useRef(false)
	useEffect(() => {
		const canInitialize = mode === 'edit' && textAreaRefState
		const shouldInitialize = _justEnabledEdit.current || _mustInitialize.current
		if (canInitialize && shouldInitialize) {
			setStagingSelections(
				(chatMessage.selections || []).map(s => { // quick hack so we dont have to do anything more
					if (s.type === 'File') return { ...s, state: { ...s.state, wasAddedAsCurrentFile: false, } }
					else return s
				})
			)

			// Initialize images from the original message
			setStagingImages(chatMessage.images || [])

			if (textAreaFnsRef.current)
				textAreaFnsRef.current.setValue(chatMessage.displayContent || '')

			textAreaRefState.focus();

			_justEnabledEdit.current = false
			_mustInitialize.current = false
		}

	}, [chatMessage, mode, _justEnabledEdit, textAreaRefState, textAreaFnsRef.current, _justEnabledEdit.current, _mustInitialize.current])

	const onOpenEdit = () => {
		setIsBeingEdited(true)
		chatThreadsService.setCurrentlyFocusedMessageIdx(messageIdx)
		_justEnabledEdit.current = true
	}
	const onCloseEdit = () => {
		setIsFocused(false)
		setIsHovered(false)
		setIsBeingEdited(false)
		chatThreadsService.setCurrentlyFocusedMessageIdx(undefined)

	}

	const EditSymbol = mode === 'display' ? Pencil : X

	// state for viewing full-size image in edit mode
	const [viewingImage, setViewingImage] = useState<ImageAttachment | null>(null)

	let chatbubbleContents: React.ReactNode
	if (mode === 'display') {
		// In display mode, clicking anywhere (including images) opens edit mode
		chatbubbleContents = <>
			<SelectedFiles type='past' messageIdx={messageIdx} selections={chatMessage.selections || []} />
			{/* Display images if present */}
			{chatMessage.images && chatMessage.images.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-2">
					{chatMessage.images.map(image => (
						<img
							key={image.id}
							src={`data:${image.mediaType};base64,${image.base64}`}
							alt={image.fileName || t.imageAlt()}
							className="h-16 w-16 object-cover rounded border border-void-border-2 cursor-pointer hover:opacity-80 transition-opacity"
						/>
					))}
				</div>
			)}
			<span className='px-0.5'>{chatMessage.displayContent}</span>
		</>
	}
	else if (mode === 'edit') {

		const onSubmit = async () => {

			if (isDisabled) return;
			if (!textAreaRefState) return;
			if (messageIdx === undefined) return;

			// cancel any streams on this thread
			const threadId = chatThreadsService.state.currentThreadId

			await chatThreadsService.abortRunning(threadId)

			// update state
			setIsBeingEdited(false)
			chatThreadsService.setCurrentlyFocusedMessageIdx(undefined)

			// stream the edit (pass current images state)
			const userMessage = textAreaRefState.value;
			try {
				await chatThreadsService.editUserMessageAndStreamResponse({ userMessage, messageIdx, threadId, _chatImages: stagingImages })
			} catch (e) {
				console.error('Error while editing message:', e)
			}
			await chatThreadsService.focusCurrentChat()
			requestAnimationFrame(() => _scrollToBottom?.())
		}

		const onAbort = async () => {
			const threadId = chatThreadsService.state.currentThreadId
			await chatThreadsService.abortRunning(threadId)
		}

		const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Escape') {
				onCloseEdit()
			}
			if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
				onSubmit()
			}
		}

		if (!chatMessage.content) { // don't show if empty and not loading (if loading, want to show).
			return null
		}

		chatbubbleContents = <VoidChatArea
			featureName='Chat'
			onSubmit={onSubmit}
			onAbort={onAbort}
			isStreaming={false}
			isDisabled={isDisabled}
			showSelections={true}
			showProspectiveSelections={false}
			selections={stagingSelections}
			setSelections={setStagingSelections}
			images={stagingImages}
			setImages={setStagingImages}
			supportsVision={supportsVision}
		>
			<VoidInputBox2
				enableAtToMention
				ref={setTextAreaRef}
				className='min-h-[81px] max-h-[500px] px-0.5'
				placeholder={t.editMessagePlaceholder()}
				onChangeText={(text) => setIsDisabled(!text)}
				onFocus={() => {
					setIsFocused(true)
					chatThreadsService.setCurrentlyFocusedMessageIdx(messageIdx);
				}}
				onBlur={() => {
					setIsFocused(false)
				}}
				onKeyDown={onKeyDown}
				fnsRef={textAreaFnsRef}
				multiline={true}
			/>
		</VoidChatArea>
	}

	const isMsgAfterCheckpoint = currCheckpointIdx !== undefined && currCheckpointIdx === messageIdx - 1

	return <div
		// align chatbubble accoridng to role
		className={`
        relative ml-auto
        ${mode === 'edit' ? 'w-full max-w-full'
				: mode === 'display' ? `self-end w-fit max-w-full whitespace-pre-wrap` : '' // user words should be pre
			}

        ${isCheckpointGhost && !isMsgAfterCheckpoint ? 'opacity-50 pointer-events-none' : ''}
    `}
		onMouseEnter={() => setIsHovered(true)}
		onMouseLeave={() => setIsHovered(false)}
	>
		<div
			// style chatbubble according to role
			className={`
            text-left rounded-lg max-w-full
            ${mode === 'edit' ? ''
					: mode === 'display' ? 'p-2 flex flex-col bg-void-bg-1 text-void-fg-1 overflow-x-auto cursor-pointer' : ''
				}
        `}
			onClick={() => { if (mode === 'display') { onOpenEdit() } }}
		>
			{chatbubbleContents}
		</div>



		<div
			className="absolute -top-1 -right-1 translate-x-0 -translate-y-0 z-1"
		// data-tooltip-id='void-tooltip'
		// data-tooltip-content='Edit message'
		// data-tooltip-place='left'
		>
			<EditSymbol
				size={18}
				className={`
                    cursor-pointer
                    p-[2px]
                    bg-void-bg-1 border border-void-border-1 rounded-md
                    transition-opacity duration-200 ease-in-out
                    ${isHovered || (isFocused && mode === 'edit') ? 'opacity-100' : 'opacity-0'}
                `}
				onClick={() => {
					if (mode === 'display') {
						onOpenEdit()
					} else if (mode === 'edit') {
						onCloseEdit()
					}
				}}
			/>
		</div>


	</div>

}

const SmallProseWrapper = ({ children }: { children: React.ReactNode }) => {
	return <div className='
text-void-fg-4
prose
prose-sm
break-words
max-w-none
leading-snug
text-[13px]

[&>:first-child]:!mt-0
[&>:last-child]:!mb-0

prose-h1:text-[14px]
prose-h1:my-4

prose-h2:text-[13px]
prose-h2:my-4

prose-h3:text-[13px]
prose-h3:my-3

prose-h4:text-[13px]
prose-h4:my-2

prose-p:my-2
prose-p:leading-snug
prose-hr:my-2

prose-ul:my-2
prose-ul:pl-4
prose-ul:list-outside
prose-ul:list-disc
prose-ul:leading-snug


prose-ol:my-2
prose-ol:pl-4
prose-ol:list-outside
prose-ol:list-decimal
prose-ol:leading-snug

marker:text-inherit

prose-blockquote:pl-2
prose-blockquote:my-2

prose-code:text-void-fg-3
prose-code:text-[12px]
prose-code:before:content-none
prose-code:after:content-none

prose-pre:text-[12px]
prose-pre:p-2
prose-pre:my-2

prose-table:text-[13px]
'>
		{children}
	</div>
}

const ProseWrapper = ({ children }: { children: React.ReactNode }) => {
	return <div className='
text-void-fg-2
prose
prose-sm
break-words
prose-p:block
prose-hr:my-4
prose-pre:my-2
marker:text-inherit
prose-ol:list-outside
prose-ol:list-decimal
prose-ul:list-outside
prose-ul:list-disc
prose-li:my-0
prose-code:before:content-none
prose-code:after:content-none
prose-headings:prose-sm
prose-headings:font-bold

prose-p:leading-normal
prose-ol:leading-normal
prose-ul:leading-normal

max-w-none
'
	>
		{children}
	</div>
}
const AssistantMessageComponent = ({ chatMessage, isCheckpointGhost, isCommitted, messageIdx }: { chatMessage: ChatMessage & { role: 'assistant' }, isCheckpointGhost: boolean, messageIdx: number, isCommitted: boolean }) => {

	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService')

	const reasoningStr = chatMessage.reasoning?.trim() || null
	const hasReasoning = !!reasoningStr
	const isDoneReasoning = !!chatMessage.displayContent
	const thread = chatThreadsService.getCurrentThread()


	const chatMessageLocation: ChatMessageLocation = {
		threadId: thread.id,
		messageIdx: messageIdx,
	}

	const isEmpty = !chatMessage.displayContent && !chatMessage.reasoning
	if (isEmpty) return null

	return <>
		{/* reasoning token */}
		{hasReasoning &&
			<div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
				<ReasoningWrapper isDoneReasoning={isDoneReasoning} isStreaming={!isCommitted}>
					<SmallProseWrapper>
						<ChatMarkdownRender
							string={reasoningStr}
							chatMessageLocation={chatMessageLocation}
							isApplyEnabled={false}
							isLinkDetectionEnabled={true}
						/>
					</SmallProseWrapper>
				</ReasoningWrapper>
			</div>
		}

		{/* assistant message */}
		{chatMessage.displayContent &&
			<div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
				<ProseWrapper>
					<ChatMarkdownRender
						string={chatMessage.displayContent || ''}
						chatMessageLocation={chatMessageLocation}
						isApplyEnabled={true}
						isLinkDetectionEnabled={true}
					/>
				</ProseWrapper>
			</div>
		}
	</>

}

// Thinking/Reasoning icon for the reasoning wrapper
const IconThinking = ({ className = '' }: { className?: string }) => {
	return (
		<svg
			className={className}
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	);
};

const ReasoningWrapper = ({
	isDoneReasoning,
	isStreaming,
	children,
	thinkingDuration,
}: {
	isDoneReasoning: boolean;
	isStreaming: boolean;
	children: React.ReactNode;
	thinkingDuration?: string;
}) => {
	const t = useVoidChatI18n()
	const isDone = isDoneReasoning || !isStreaming;
	const isWriting = !isDone;
	const [isOpen, setIsOpen] = useState(isWriting);

	useEffect(() => {
		if (!isWriting) setIsOpen(false); // if just finished reasoning, close
	}, [isWriting]);

	// Calculate time display
	const timeDisplay = thinkingDuration ? (
		<span className="text-[12px] ml-1 opacity-60">{thinkingDuration}</span>
	) : null;

	return (
		<div className="thought-process mb-4">
			{/* Header - clickable to expand/collapse */}
			<div
				className="thought-header flex items-center cursor-pointer select-none"
				onClick={() => setIsOpen((v) => !v)}
			>
				<IconThinking className={`mr-1.5 flex-shrink-0 ${isWriting ? 'animate-pulse' : ''}`} />
				<span className="text-void-fg-4 text-xs">{t.deepThinking()}</span>
				{timeDisplay}
				{/* Chevron arrow with rotation animation */}
				<svg
					className={`chevron ml-1 w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
						isOpen ? 'rotate-0' : '-rotate-90'
					}`}
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>

			{/* Content with left timeline border */}
			<div
				className={`thought-content border-l-2 border-void-border-3 ml-[7px] pl-4 transition-all duration-200 ${
					isOpen ? 'opacity-100 max-h-[2000px]' : 'max-h-0 opacity-0 overflow-hidden'
				}`}
			>
				{children}
			</div>
		</div>
	);
};


// should either be past or "-ing" tense, not present tense. Eg. when the LLM searches for something, the user expects it to say "I searched for X" or "I am searching for X". Not "I search X".

const loadingTitleWrapper = (item: React.ReactNode): React.ReactNode => {
	return <span className='flex items-center flex-nowrap'>
		{item}
		<IconLoading className='w-3 text-[34px]' />
	</span>
}

const getTitleOfBuiltinToolName = (t: ReturnType<typeof useVoidChatI18n>) => ({
	'read_file': { done: t.toolReadFileDone(), proposed: t.toolReadFileProposed(), running: loadingTitleWrapper(t.toolReadFileRunning('')) },
	'ls_dir': { done: t.toolLsDirDone(), proposed: t.toolLsDirProposed(), running: loadingTitleWrapper(t.toolLsDirRunning('')) },
	'get_dir_tree': { done: t.toolGetDirTreeDone(), proposed: t.toolGetDirTreeProposed(), running: loadingTitleWrapper(t.toolGetDirTreeRunning('')) },
	'search_pathnames_only': { done: t.toolSearchPathnamesDone(), proposed: t.toolSearchPathnamesProposed(), running: loadingTitleWrapper(t.toolSearchPathnamesRunning('')) },
	'search_for_files': { done: t.toolSearchForFilesDone(), proposed: t.toolSearchForFilesProposed(), running: loadingTitleWrapper(t.toolSearchForFilesRunning('')) },
	'create_file_or_folder': { done: t.toolCreateFileOrFolderDone(), proposed: t.toolCreateFileOrFolderProposed(), running: loadingTitleWrapper(t.toolCreateFileOrFolderRunning('')) },
	'delete_file_or_folder': { done: t.toolDeleteFileOrFolderDone(), proposed: t.toolDeleteFileOrFolderProposed(), running: loadingTitleWrapper(t.toolDeleteFileOrFolderRunning('')) },
	'edit_file': { done: t.toolEditFileDone(), proposed: t.toolEditFileProposed(), running: loadingTitleWrapper(t.toolEditFileRunning('')) },
	'rewrite_file': { done: t.toolRewriteFileDone(), proposed: t.toolRewriteFileProposed(), running: loadingTitleWrapper(t.toolRewriteFileRunning('')) },
	'run_command': { done: t.toolRunCommandDone(), proposed: t.toolRunCommandProposed(), running: loadingTitleWrapper(t.toolRunCommandRunning('')) },
	'run_persistent_command': { done: t.toolRunCommandDone(), proposed: t.toolRunCommandProposed(), running: loadingTitleWrapper(t.toolRunCommandRunning('')) },
	'open_persistent_terminal': { done: t.toolRunCommandDone(), proposed: t.toolRunCommandProposed(), running: loadingTitleWrapper(t.toolRunCommandRunning('')) },
	'kill_persistent_terminal': { done: t.toolRunCommandDone(), proposed: t.toolRunCommandProposed(), running: loadingTitleWrapper(t.toolRunCommandRunning('')) },
	'read_lint_errors': { done: t.lintErrors(), proposed: t.lintErrors(), running: loadingTitleWrapper(t.lintErrors()) },
	'search_in_file': { done: t.toolSearchForFilesDone(), proposed: t.toolSearchForFilesProposed(), running: loadingTitleWrapper(t.toolSearchForFilesRunning('')) },
	'xml_escape': { done: t.toolReadFileDone(), proposed: t.toolReadFileProposed(), running: loadingTitleWrapper(t.toolReadFileRunning('')) },
	'ask_user_question': { done: t.toolReadFileDone(), proposed: t.toolReadFileProposed(), running: loadingTitleWrapper(t.toolReadFileRunning('')) },
}) as const;


const getTitle = (toolMessage: Pick<ChatMessage & { role: 'tool' }, 'name' | 'type' | 'mcpServerName'>, t: ReturnType<typeof useVoidChatI18n>): React.ReactNode => {
	const msg = toolMessage

	// non-built-in title
	if (!builtinToolNames.includes(msg.name as BuiltinToolName)) {
		// descriptor of Running or Ran etc
		const descriptor =
			msg.type === 'success' ? t.toolRunCommandDone()
				: msg.type === 'running_now' ? t.toolRunCommandRunning('')
					: msg.type === 'tool_request' ? t.toolRunCommandProposed()
						: msg.type === 'rejected' ? t.toolCancelled()
							: msg.type === 'invalid_params' ? t.toolCancelled()
								: msg.type === 'tool_error' ? t.toolCancelled()
									: t.toolRunCommandProposed()


		const title = `${descriptor} ${toolMessage.mcpServerName || 'MCP'}`
		if (msg.type === 'running_now' || msg.type === 'tool_request')
			return loadingTitleWrapper(title)
		return title
	}

	// built-in title
	else {
		const toolName = msg.name as BuiltinToolName
		const toolTitles = getTitleOfBuiltinToolName(t)
		if (msg.type === 'success') return toolTitles[toolName].done
		if (msg.type === 'running_now') return toolTitles[toolName].running
		return toolTitles[toolName].proposed
	}
}


const toolNameToDesc = (toolName: BuiltinToolName, _toolParams: BuiltinToolCallParams[BuiltinToolName] | undefined, accessor: ReturnType<typeof useAccessor>): {
	desc1: React.ReactNode,
	desc1Info?: string,
} => {

	if (!_toolParams) {
		return { desc1: '', };
	}

	const x = {
		'read_file': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['read_file']
			return {
				desc1: getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			};
		},
		'ls_dir': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['ls_dir']
			return {
				desc1: getFolderName(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			};
		},
		'search_pathnames_only': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['search_pathnames_only']
			return {
				desc1: `"${toolParams.query}"`,
			}
		},
		'search_for_files': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['search_for_files']
			return {
				desc1: `"${toolParams.query}"`,
			}
		},
		'search_in_file': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['search_in_file'];
			return {
				desc1: `"${toolParams.query}"`,
				desc1Info: getRelative(toolParams.uri, accessor),
			};
		},
		'create_file_or_folder': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['create_file_or_folder']
			return {
				desc1: toolParams.isFolder ? getFolderName(toolParams.uri.fsPath) ?? '/' : getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'delete_file_or_folder': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['delete_file_or_folder']
			return {
				desc1: toolParams.isFolder ? getFolderName(toolParams.uri.fsPath) ?? '/' : getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'rewrite_file': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['rewrite_file']
			return {
				desc1: getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'edit_file': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['edit_file']
			return {
				desc1: getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'run_command': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['run_command']
			return {
				desc1: `"${toolParams.command}"`,
			}
		},
		'run_persistent_command': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['run_persistent_command']
			return {
				desc1: `"${toolParams.command}"`,
			}
		},
		'open_persistent_terminal': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['open_persistent_terminal']
			return { desc1: '' }
		},
		'kill_persistent_terminal': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['kill_persistent_terminal']
			return { desc1: toolParams.persistentTerminalId }
		},
		'get_dir_tree': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['get_dir_tree']
			return {
				desc1: getFolderName(toolParams.uri.fsPath) ?? '/',
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'read_lint_errors': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['read_lint_errors']
			return {
				desc1: getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'xml_escape': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['xml_escape']
			return {
				desc1: getBasename(toolParams.uri.fsPath),
				desc1Info: getRelative(toolParams.uri, accessor),
			}
		},
		'ask_user_question': () => {
			const toolParams = _toolParams as BuiltinToolCallParams['ask_user_question']
			return {
				desc1: toolParams.questions.length > 0 ? toolParams.questions[0].header : '',
				desc1Info: undefined,
			}
		}
	}

	try {
		return x[toolName]?.() || { desc1: '' }
	}
	catch {
		return { desc1: '' }
	}
}

// Checkbox icon for multi-select
const CheckboxIcon = ({ checked }: { checked: boolean }) => (
	<span className={`
		w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
		transition-all duration-150
		${checked
			? 'bg-[var(--vscode-checkbox-background)] border-[var(--vscode-checkbox-background)]'
			: 'bg-transparent border-[var(--vscode-checkbox-border)]'
		}
	`}>
		{checked && (
			<svg className="w-3 h-3 text-[var(--vscode-checkbox-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
				<path d="M5 12l5 5L20 7" />
			</svg>
		)}
	</span>
)

// Radio icon for single-select (solid circle when selected)
const RadioIcon = ({ checked }: { checked: boolean }) => (
	<span className={`
		w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
		transition-all duration-150
		bg-transparent
		${checked
			? 'border-[var(--vscode-foreground)]'
			: 'border-[var(--vscode-radio-border)]'
		}
	`}>
		{checked && (
			<span className="w-2.5 h-2.5 rounded-full bg-[var(--vscode-foreground)]" />
		)}
	</span>
)

// Ask User Question UI Component
const AskUserQuestionUI = ({ threadId, questions }: { threadId: string, questions: { question: string, header: string, options: { label: string, description: string }[], multiSelect: boolean }[] }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const chatThreadService = accessor.get('IChatThreadService')

	// State for each question's answer(s)
	const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({})
	const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})
	const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

	const handleSelectOption = (header: string, label: string, multiSelect: boolean) => {
		if (multiSelect) {
			// Multi-select: toggle the label in the array (other is independent)
			const current = (selectedAnswers[header] as string[] | undefined) || []
			const isSelected = current.includes(label)
			const newSelection = isSelected
				? current.filter(l => l !== label)
				: [...current, label]
			setSelectedAnswers(prev => ({ ...prev, [header]: newSelection }))
		} else {
			// Single select: set the label and hide custom input (mutually exclusive with "other")
			setSelectedAnswers(prev => ({ ...prev, [header]: label }))
			setShowCustomInput(prev => ({ ...prev, [header]: false }))
			setCustomAnswers(prev => ({ ...prev, [header]: '' }))
		}
	}

	const handleCustomInput = (header: string, multiSelect: boolean) => {
		if (multiSelect) {
			// Multi-select: toggle "other" option independently, keep existing selections
			const currentShow = showCustomInput[header]
			setShowCustomInput(prev => ({ ...prev, [header]: !currentShow }))
			if (currentShow) {
				// Clear custom answer when unchecking "other"
				setCustomAnswers(prev => ({ ...prev, [header]: '' }))
			}
		} else {
			// Single select: "other" is mutually exclusive with regular options
			setShowCustomInput(prev => ({ ...prev, [header]: true }))
			setSelectedAnswers(prev => ({ ...prev, [header]: '' }))
		}
	}

	const handleCustomAnswerChange = (header: string, value: string, multiSelect: boolean) => {
		setCustomAnswers(prev => ({ ...prev, [header]: value }))
		// For single-select, update selectedAnswers; for multi-select, keep array intact
		if (!multiSelect) {
			setSelectedAnswers(prev => ({ ...prev, [header]: value }))
		}
	}

	// Check if a question has a valid answer
	const hasValidAnswer = (q: { header: string, multiSelect: boolean }) => {
		const answer = selectedAnswers[q.header]
		const customAns = customAnswers[q.header]

		if (q.multiSelect) {
			const arr = (answer as string[] | undefined) || []
			const hasOptions = arr.length > 0
			const hasCustom = showCustomInput[q.header] && customAns && customAns.trim() !== ''
			return hasOptions || hasCustom
		} else {
			// Single select: either a regular option is selected, or "other" has content
			if (showCustomInput[q.header]) {
				return customAns && customAns.trim() !== ''
			}
			return typeof answer === 'string' && answer !== ''
		}
	}

	const handleSubmit = () => {
		// Check if all questions have valid answers
		const allHaveAnswers = questions.every(q => hasValidAnswer(q))

		if (!allHaveAnswers) {
			// No valid selection, treat as cancel
			handleCancel()
			return
		}

		// For multi-select with custom input, include custom answer in the array
		const finalAnswers: Record<string, string | string[]> = {}
		for (const q of questions) {
			const answer = selectedAnswers[q.header]
			if (q.multiSelect) {
				const arr = (answer as string[] | undefined) || []
				const customAns = customAnswers[q.header]
				if (showCustomInput[q.header] && customAns && customAns.trim()) {
					finalAnswers[q.header] = [...arr, customAns.trim()]
				} else {
					finalAnswers[q.header] = arr
				}
			} else {
				finalAnswers[q.header] = answer || ''
			}
		}
		chatThreadService.approveAskUserQuestion(threadId, finalAnswers)
	}

	const handleCancel = () => {
		// User rejected to answer - submit default rejection message for all questions
		const rejectionAnswers: Record<string, string | string[]> = {}
		for (const q of questions) {
			rejectionAnswers[q.header] = t.userRefusedToAnswer()
		}
		chatThreadService.approveAskUserQuestion(threadId, rejectionAnswers)
	}

	return (
		<div className="p-4 rounded-lg bg-[var(--vscode-editor-background)] border border-[var(--vscode-widget-border)] space-y-5">
			{/* Title */}
			<div className="flex items-center gap-2 pb-2 border-b border-[var(--vscode-widget-border)]">
				<CircleEllipsis size={16} className="text-[var(--vscode-foreground)]" />
				<span className="text-sm font-medium text-[var(--vscode-foreground)]">{t.needYourAnswer()}</span>
			</div>

			{questions.map((q, qIdx) => {
				// For multi-select: "other" is checked if custom input is shown
				// For single-select: "other" is checked if custom input is shown AND has content (mutually exclusive with options)
				const selectedAnswer = selectedAnswers[q.header]
				const customAns = customAnswers[q.header]

				// Determine if "other" option should appear checked
				const isOtherChecked = q.multiSelect
					? showCustomInput[q.header]
					: (showCustomInput[q.header] && (!selectedAnswer || selectedAnswer === customAns))

				return (
				<div key={qIdx} className="space-y-3">
					{/* Question header and type indicator */}
					<div className="flex items-center gap-2">
						<span className="px-2 py-0.5 text-xs rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] font-medium">
							{q.header}
						</span>
						<span className="text-xs text-[var(--vscode-descriptionForeground)]">
							({q.multiSelect ? t.multiSelectHint() : t.singleSelectHint()})
						</span>
					</div>

					{/* Question text */}
					<div className="text-sm text-[var(--vscode-foreground)] leading-relaxed">
						{q.question}
					</div>

					{/* Options */}
					<div className="space-y-2">
						{q.options.map((opt, optIdx) => {
							// For single-select: option is selected only if it matches AND "other" is not active
							// For multi-select: option is selected if it's in the array
							const isSelected = q.multiSelect
								? ((selectedAnswer as string[] | undefined)?.includes(opt.label) ?? false)
								: (selectedAnswer === opt.label && !showCustomInput[q.header])

							return (
								<button
									key={optIdx}
									onClick={() => handleSelectOption(q.header, opt.label, q.multiSelect)}
									className={`
										w-full px-3 py-2.5 rounded-md text-left
										flex items-start gap-3
										transition-all duration-150 cursor-pointer
										border
										${isSelected
											? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] border-transparent'
											: 'bg-[var(--vscode-input-background)] border-[var(--vscode-input-border)] hover:bg-[var(--vscode-list-hoverBackground)] text-[var(--vscode-foreground)]'
										}
									`}
								>
									{/* Selection indicator */}
									<span className="mt-0.5">
										{q.multiSelect
											? <CheckboxIcon checked={isSelected} />
											: <RadioIcon checked={isSelected} />
										}
									</span>

									{/* Option content */}
									<div className="flex flex-col min-w-0">
										<span className="font-medium">{opt.label}</span>
										{opt.description && (
											<span className={`text-xs mt-0.5 ${isSelected ? 'opacity-90' : 'text-[var(--vscode-descriptionForeground)] opacity-80'}`}>
												{opt.description}
											</span>
										)}
									</div>
								</button>
							)
						})}

						{/* Other option */}
						<button
							onClick={() => handleCustomInput(q.header, q.multiSelect)}
							className={`
								w-full px-3 py-2.5 rounded-md text-left
								flex items-center gap-3
								transition-all duration-150 cursor-pointer
								border
								${isOtherChecked
									? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] border-transparent'
									: 'bg-[var(--vscode-input-background)] border-[var(--vscode-input-border)] hover:bg-[var(--vscode-list-hoverBackground)] text-[var(--vscode-foreground)]'
								}
							`}
						>
							<span className="mt-0.5">
								{q.multiSelect
									? <CheckboxIcon checked={isOtherChecked} />
									: <RadioIcon checked={isOtherChecked} />
								}
							</span>
							<span className="font-medium">{t.otherOption()}</span>
						</button>

						{/* Custom input field */}
						{showCustomInput[q.header] && (
							<input
								type="text"
								value={customAnswers[q.header] || ''}
								onChange={(e) => handleCustomAnswerChange(q.header, e.target.value, q.multiSelect)}
								placeholder={t.customAnswerPlaceholder()}
								className="w-full px-3 py-2 rounded-md text-sm bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] focus:border-[var(--vscode-focusBorder)] outline-none placeholder:text-[var(--vscode-input-placeholderForeground)]"
								autoFocus
							/>
						)}
					</div>
				</div>
			)})}

			{/* Submit and Cancel buttons */}
			<div className="flex gap-2 pt-3 border-t border-[var(--vscode-widget-border)]">
				<button
					onClick={handleSubmit}
					className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] transition-all duration-150 cursor-pointer flex items-center gap-2"
				>
					<Check size={14} />
					{t.submit()}
				</button>
				<button
					onClick={handleCancel}
					className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] transition-all duration-150 cursor-pointer flex items-center gap-2"
				>
					<X size={14} />
					{t.cancel()}
				</button>
			</div>
		</div>
	)
}

const ToolRequestAcceptRejectButtons = ({ toolName }: { toolName: ToolName }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService')
	const metricsService = accessor.get('IMetricsService')
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidSettingsState = useSettingsState()

	// ask_user_question has its own UI with submit/cancel buttons, and should never show auto-approve toggle
	const isAskUserQuestion = toolName === 'ask_user_question'
	if (isAskUserQuestion) {
		return null
	}

	const onAccept = useCallback(() => {
		try { // this doesn't need to be wrapped in try/catch anymore
			const threadId = chatThreadsService.state.currentThreadId
			chatThreadsService.approveLatestToolRequest(threadId)
			metricsService.capture('Tool Request Accepted', {})
		} catch (e) { console.error('Error while approving message in chat:', e) }
	}, [chatThreadsService, metricsService])

	const onReject = useCallback(() => {
		try {
			const threadId = chatThreadsService.state.currentThreadId
			chatThreadsService.rejectLatestToolRequest(threadId)
		} catch (e) { console.error('Error while approving message in chat:', e) }
		metricsService.capture('Tool Request Rejected', {})
	}, [chatThreadsService, metricsService])

	const approveButton = (
		<button
			onClick={onAccept}
			className={`
                px-2 py-1
                bg-[var(--vscode-button-background)]
                text-[var(--vscode-button-foreground)]
                hover:bg-[var(--vscode-button-hoverBackground)]
                rounded
                text-sm font-medium
            `}
		>
			{t.approve()}
		</button>
	)

	const cancelButton = (
		<button
			onClick={onReject}
			className={`
                px-2 py-1
                bg-[var(--vscode-button-secondaryBackground)]
                text-[var(--vscode-button-secondaryForeground)]
                hover:bg-[var(--vscode-button-secondaryHoverBackground)]
                rounded
                text-sm font-medium
            `}
		>
			{t.cancel()}
		</button>
	)

	const approvalType = (isABuiltinToolName(toolName) ? approvalTypeOfBuiltinToolName[toolName] : 'MCP tools') as ToolApprovalType | undefined
	const approvalToggle = approvalType ? <div key={approvalType} className="flex items-center ml-2 gap-x-1">
		<ToolApprovalTypeSwitch size='xs' approvalType={approvalType} desc={t.autoApproveDesc(approvalType)} />
	</div> : null

	return <div className="flex gap-2 mx-0.5 items-center">
		{approveButton}
		{cancelButton}
		{approvalToggle}
	</div>
}

export const ToolChildrenWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
	return <div className={`${className ? className : ''} cursor-default select-none`}>
		<div className='px-2 min-w-full overflow-hidden'>
			{children}
		</div>
	</div>
}
export const CodeChildren = ({ children, className }: { children: React.ReactNode, className?: string }) => {
	return <div className={`${className ?? ''} p-1 rounded-sm overflow-auto text-sm`}>
		<div className='!select-text cursor-auto'>
			{children}
		</div>
	</div>
}

export const ListableToolItem = ({ name, onClick, isSmall, className, showDot }: { name: React.ReactNode, onClick?: () => void, isSmall?: boolean, className?: string, showDot?: boolean }) => {
	return <div
		className={`
			${onClick ? 'hover:brightness-125 hover:cursor-pointer transition-all duration-200 ' : ''}
			flex items-center flex-nowrap whitespace-nowrap
			${className ? className : ''}
			`}
		onClick={onClick}
	>
		{showDot === false ? null : <div className="flex-shrink-0"><svg className="w-1 h-1 opacity-60 mr-1.5 fill-current" viewBox="0 0 100 40"><rect x="0" y="15" width="100" height="10" /></svg></div>}
		<div className={`${isSmall ? 'italic text-void-fg-4 flex items-center' : ''}`}>{name}</div>
	</div>
}



const EditToolChildren = ({ uri, code, type }: { uri: URI | undefined, code: string, type: 'diff' | 'rewrite' }) => {

	const content = type === 'diff' ?
		<VoidDiffEditor uri={uri} searchReplaceBlocks={code} />
		: <ChatMarkdownRender string={`\`\`\`\n${code}\n\`\`\``} codeURI={uri} chatMessageLocation={undefined} />

	return <div className='!select-text cursor-auto'>
		<SmallProseWrapper>
			{content}
		</SmallProseWrapper>
	</div>

}


const LintErrorChildren = ({ lintErrors }: { lintErrors: LintErrorItem[] }) => {
	const t = useVoidChatI18n()
	return <div className="text-xs text-void-fg-4 opacity-80 border-l-2 border-void-warning px-2 py-0.5 flex flex-col gap-0.5 overflow-x-auto whitespace-nowrap">
		{lintErrors.map((error, i) => (
			<div key={i}>{t.lineRange(error.startLineNumber, error.endLineNumber)}：{error.message}</div>
		))}
	</div>
}

const BottomChildren = ({ children, title }: { children: React.ReactNode, title: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	if (!children) return null;
	return (
		<div className="w-full px-2 mt-0.5">
			<div
				className={`flex items-center cursor-pointer select-none transition-colors duration-150 pl-0 py-0.5 rounded group`}
				onClick={() => setIsOpen(o => !o)}
				style={{ background: 'none' }}
			>
				<ChevronRight
					className={`mr-1 h-3 w-3 flex-shrink-0 transition-transform duration-100 text-void-fg-4 group-hover:text-void-fg-3 ${isOpen ? 'rotate-90' : ''}`}
				/>
				<span className="font-medium text-void-fg-4 group-hover:text-void-fg-3 text-xs">{title}</span>
			</div>
			<div
				className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0'} text-xs pl-4`}
			>
				<div className="overflow-x-auto text-void-fg-4 opacity-90 border-l-2 border-void-warning px-2 py-0.5">
					{children}
				</div>
			</div>
		</div>
	);
}


const EditToolHeaderButtons = ({ applyBoxId, uri, codeStr, toolName, threadId }: { threadId: string, applyBoxId: string, uri: URI, codeStr: string, toolName: 'edit_file' | 'rewrite_file' }) => {
	const t = useVoidChatI18n()
	const { streamState } = useEditToolStreamState({ applyBoxId, uri })
	return <div className='flex items-center gap-1'>
		{/* <StatusIndicatorForApplyButton applyBoxId={applyBoxId} uri={uri} /> */}
		{/* <JumpToFileButton uri={uri} /> */}
		{streamState === 'idle-no-changes' && <CopyButton codeStr={codeStr} toolTipName={t.copy()} />}
		<EditToolAcceptRejectButtonsHTML type={toolName} codeStr={codeStr} applyBoxId={applyBoxId} uri={uri} threadId={threadId} />
	</div>
}



const InvalidTool = ({ toolName, message, mcpServerName }: { toolName: ToolName, message: string, mcpServerName: string | undefined }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const title = getTitle({ name: toolName, type: 'invalid_params', mcpServerName }, t)
	const desc1 = t.invalidParams()
	const icon = null
	const isError = true
	const componentParams: ToolHeaderParams = { title, desc1, isError, icon }

	componentParams.children = <ToolChildrenWrapper>
		<CodeChildren className='bg-void-bg-3'>
			{message}
		</CodeChildren>
	</ToolChildrenWrapper>
	return <ToolHeaderWrapper {...componentParams} />
}

const CanceledTool = ({ toolName, mcpServerName }: { toolName: ToolName, mcpServerName: string | undefined }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const title = getTitle({ name: toolName, type: 'rejected', mcpServerName }, t)
	const desc1 = ''
	const icon = null
	const isRejected = true
	const componentParams: ToolHeaderParams = { title, desc1, icon, isRejected }
	return <ToolHeaderWrapper {...componentParams} />
}


const CommandTool = ({ toolMessage, type, threadId }: { threadId: string } & ({
	toolMessage: Exclude<ToolMessage<'run_command'>, { type: 'invalid_params' }>
	type: 'run_command'
} | {
	toolMessage: Exclude<ToolMessage<'run_persistent_command'>, { type: 'invalid_params' }>
	type: | 'run_persistent_command'
})) => {
	const accessor = useAccessor()
	const t = useVoidChatI18n()

	const commandService = accessor.get('ICommandService')
	const terminalToolsService = accessor.get('ITerminalToolService')
	const toolsService = accessor.get('IToolsService')
	const isError = false
	const title = getTitle(toolMessage, t)
	const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
	const icon = null
	const streamState = useChatThreadsStreamState(threadId)

	const divRef = useRef<HTMLDivElement | null>(null)

	const isRejected = toolMessage.type === 'rejected'
	const { rawParams, params } = toolMessage
	const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }


	const effect = async () => {
		if (streamState?.isRunning !== 'tool') return
		if (type !== 'run_command' || toolMessage.type !== 'running_now') return;

		// wait for the interruptor so we know it's running

		await streamState?.interrupt
		const container = divRef.current;
		if (!container) return;

		const terminal = terminalToolsService.getTemporaryTerminal(toolMessage.params.terminalId);
		if (!terminal) return;

		try {
			terminal.attachToElement(container);
			terminal.setVisible(true)
		} catch {
		}

		// Listen for size changes of the container and keep the terminal layout in sync.
		const resizeObserver = new ResizeObserver((entries) => {
			const height = entries[0].borderBoxSize[0].blockSize;
			const width = entries[0].borderBoxSize[0].inlineSize;
			if (typeof terminal.layout === 'function') {
				terminal.layout({ width, height });
			}
		});

		resizeObserver.observe(container);
		return () => { terminal.detachFromElement(); resizeObserver?.disconnect(); }
	}

	useEffect(() => {
		effect()
	}, [terminalToolsService, toolMessage, toolMessage.type, type]);

	if (toolMessage.type === 'success') {
		const { result } = toolMessage

		// it's unclear that this is a button and not an icon.
		// componentParams.desc2 = <JumpToTerminalButton
		// 	onClick={() => { terminalToolsService.openTerminal(terminalId) }}
		// />

		let msg: string
		if (type === 'run_command') msg = toolsService.stringOfResult['run_command'](toolMessage.params, result)
		else msg = toolsService.stringOfResult['run_persistent_command'](toolMessage.params, result)

		if (type === 'run_persistent_command') {
			componentParams.info = persistentTerminalNameOfId(toolMessage.params.persistentTerminalId)
		}

		componentParams.children = <ToolChildrenWrapper className='whitespace-pre text-nowrap overflow-auto text-sm'>
			<div className='!select-text cursor-auto'>
				<BlockCode initValue={`${msg.trim()}`} language='shellscript' />
			</div>
		</ToolChildrenWrapper>
	}
	else if (toolMessage.type === 'tool_error') {
		const { result } = toolMessage
		componentParams.bottomChildren = <BottomChildren title={t.error()}>
			<CodeChildren>
				{result}
			</CodeChildren>
		</BottomChildren>
	}
	else if (toolMessage.type === 'running_now') {
		if (type === 'run_command')
			componentParams.children = <div ref={divRef} className='relative h-[300px] text-sm' />
	}
	else if (toolMessage.type === 'rejected' || toolMessage.type === 'tool_request') {
	}

	return <>
		<ToolHeaderWrapper {...componentParams} isOpen={type === 'run_command' && toolMessage.type === 'running_now' ? true : undefined} />
	</>
}

type WrapperProps<T extends ToolName> = { toolMessage: Exclude<ToolMessage<T>, { type: 'invalid_params' }>, messageIdx: number, threadId: string }
const MCPToolWrapper = ({ toolMessage }: WrapperProps<string>) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const mcpService = accessor.get('IMCPService')

	const title = getTitle(toolMessage, t)
	const desc1 = removeMCPToolNamePrefix(toolMessage.name)
	const icon = null


	if (toolMessage.type === 'running_now') return null // do not show running

	const isError = false
	const isRejected = toolMessage.type === 'rejected'
	const { rawParams, params } = toolMessage
	const componentParams: ToolHeaderParams = { title, desc1, isError, icon, isRejected, }

	const paramsStr = JSON.stringify(params, null, 2)
	componentParams.desc2 = <CopyButton codeStr={paramsStr} toolTipName={t.copyInput(paramsStr)} />

	componentParams.info = !toolMessage.mcpServerName ? t.mcpToolNotFound() : undefined

	// Add copy inputs button in desc2


	if (toolMessage.type === 'success' || toolMessage.type === 'tool_request') {
		const { result } = toolMessage
		const resultStr = result ? mcpService.stringifyResult(result) : 'null'
		componentParams.children = <ToolChildrenWrapper>
			<SmallProseWrapper>
				<ChatMarkdownRender
					string={`\`\`\`json\n${resultStr}\n\`\`\``}
					chatMessageLocation={undefined}
					isApplyEnabled={false}
					isLinkDetectionEnabled={true}
				/>
			</SmallProseWrapper>
		</ToolChildrenWrapper>
	}
	else if (toolMessage.type === 'tool_error') {
		const { result } = toolMessage
		componentParams.bottomChildren = <BottomChildren title={t.error()}>
			<CodeChildren>
				{result}
			</CodeChildren>
		</BottomChildren>
	}

	return <ToolHeaderWrapper {...componentParams} />

}

type ResultWrapper<T extends ToolName> = (props: WrapperProps<T>) => React.ReactNode

const builtinToolNameToComponent: { [T in BuiltinToolName]: { resultWrapper: ResultWrapper<T>, } } = {
	'read_file': {
		resultWrapper: ({ toolMessage }) => {
			const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')

			const title = getTitle(toolMessage, t)

			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			let range: [number, number] | undefined = undefined
			if (toolMessage.params.startLine !== null || toolMessage.params.endLine !== null) {
				const start = toolMessage.params.startLine === null ? `1` : `${toolMessage.params.startLine}`
				const end = toolMessage.params.endLine === null ? `` : `${toolMessage.params.endLine}`
				const addStr = `(${start}-${end})`
				componentParams.desc1 += ` ${addStr}`
				range = [params.startLine || 1, params.endLine || 1]
			}

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor, range) }
				if (result.hasNextPage && params.pageNumber === 1)  // first page
					componentParams.desc2 = t.truncatedAfter(`${Math.round(MAX_FILE_CHARS_PAGE) / 1000}k`)
				else if (params.pageNumber > 1) // subsequent pages
					componentParams.desc2 = t.partPage(params.pageNumber)
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				// JumpToFileButton removed in favor of FileLinkText
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		},
	},
	'get_dir_tree': {
		resultWrapper: ({ toolMessage }) => {
			const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')

			const title = getTitle(toolMessage, t)
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			if (params.uri) {
				const rel = getRelative(params.uri, accessor)
				if (rel) componentParams.info = t.searchOnlyIn(rel)
			}

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				componentParams.children = <ToolChildrenWrapper>
					<SmallProseWrapper>
						<ChatMarkdownRender
							string={`\`\`\`\n${result.str}\n\`\`\``}
							chatMessageLocation={undefined}
							isApplyEnabled={false}
							isLinkDetectionEnabled={true}
						/>
					</SmallProseWrapper>
				</ToolChildrenWrapper>
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />

		}
	},
	'ls_dir': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')
			const explorerService = accessor.get('IExplorerService')
			const title = getTitle(toolMessage, t)
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			if (params.uri) {
				const rel = getRelative(params.uri, accessor)
				if (rel) componentParams.info = t.searchOnlyIn(rel)
			}

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				componentParams.numResults = result.children?.length
				componentParams.hasNextPage = result.hasNextPage
				componentParams.children = !result.children || (result.children.length ?? 0) === 0 ? undefined
					: <ToolChildrenWrapper>
						{result.children.map((child, i) => (<ListableToolItem key={i}
							name={`${child.name}${child.isDirectory ? '/' : ''}`}
							className='w-full overflow-auto'
							onClick={() => {
								voidOpenFileFn(child.uri, accessor)
								// commandService.executeCommand('workbench.view.explorer'); // open in explorer folders view instead
								// explorerService.select(child.uri, true);
							}}
						/>))}
						{result.hasNextPage &&
							<ListableToolItem name={t.resultsTruncatedRemaining(result.itemsRemaining)} isSmall={true} className='w-full overflow-auto' />
						}
					</ToolChildrenWrapper>
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		}
	},
	'search_pathnames_only': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')
			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const title = getTitle(toolMessage, t)
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			if (params.includePattern) {
				componentParams.info = t.searchOnlyIn(params.includePattern)
			}

			if (toolMessage.type === 'success') {
				const { result, rawParams } = toolMessage
				componentParams.numResults = result.uris.length
				componentParams.hasNextPage = result.hasNextPage
				componentParams.children = result.uris.length === 0 ? undefined
					: <ToolChildrenWrapper>
						{result.uris.map((uri, i) => (<ListableToolItem key={i}
							name={getBasename(uri.fsPath)}
							className='w-full overflow-auto'
							onClick={() => { voidOpenFileFn(uri, accessor) }}
						/>))}
						{result.hasNextPage &&
							<ListableToolItem name={t.resultsTruncated()} isSmall={true} className='w-full overflow-auto' />
						}

					</ToolChildrenWrapper>
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		}
	},
	'search_for_files': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')
			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const title = getTitle(toolMessage, t)
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			if (params.searchInFolder || params.isRegex) {
				let info: string[] = []
				if (params.searchInFolder) {
					const rel = getRelative(params.searchInFolder, accessor)
					if (rel) info.push(t.searchOnlyIn(rel))
				}
				if (params.isRegex) { info.push(t.useRegexSearch()) }
				componentParams.info = info.join('; ')
			}

			if (toolMessage.type === 'success') {
				const { result, rawParams } = toolMessage
				componentParams.numResults = result.uris.length
				componentParams.hasNextPage = result.hasNextPage
				componentParams.children = result.uris.length === 0 ? undefined
					: <ToolChildrenWrapper>
						{result.uris.map((uri, i) => (<ListableToolItem key={i}
							name={getBasename(uri.fsPath)}
							className='w-full overflow-auto'
							onClick={() => { voidOpenFileFn(uri, accessor) }}
						/>))}
						{result.hasNextPage &&
							<ListableToolItem name={t.resultsTruncated()} isSmall={true} className='w-full overflow-auto' />
						}

					</ToolChildrenWrapper>
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}
			return <ToolHeaderWrapper {...componentParams} />
		}
	},

	'search_in_file': {
		resultWrapper: ({ toolMessage }) => {
			const t = useVoidChatI18n()
			const accessor = useAccessor();
			const toolsService = accessor.get('IToolsService');
			const title = getTitle(toolMessage, t);
			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
			const icon = null;

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const { rawParams, params } = toolMessage;
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected };

			const infoarr: string[] = []
			const uriStr = getRelative(params.uri, accessor)
			if (uriStr) infoarr.push(uriStr)
			if (params.isRegex) infoarr.push(t.useRegexSearch())
			componentParams.info = infoarr.join('; ')

			if (toolMessage.type === 'success') {
				const { result } = toolMessage; // result is array of snippets
				componentParams.numResults = result.lines.length;
				componentParams.children = result.lines.length === 0 ? undefined :
					<ToolChildrenWrapper>
						<CodeChildren className='bg-void-bg-3'>
							<pre className='font-mono whitespace-pre'>
								{toolsService.stringOfResult['search_in_file'](params, result)}
							</pre>
						</CodeChildren>
					</ToolChildrenWrapper>
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage;
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />;
		}
	},

	'read_lint_errors': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')

			const title = getTitle(toolMessage, t)

			const { uri } = toolMessage.params ?? {}
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			componentParams.info = getRelative(uri, accessor) // full path

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
				if (result.lintErrors)
					componentParams.children = <LintErrorChildren lintErrors={result.lintErrors} />
				else
					componentParams.children = t.noLintErrors()

			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				// JumpToFileButton removed in favor of FileLinkText
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		},
	},

	// ---

	'create_file_or_folder': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')
			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const title = getTitle(toolMessage, t)
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null


			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			componentParams.info = getRelative(params.uri, accessor) // full path

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
			}
			else if (toolMessage.type === 'rejected') {
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				if (params) { componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) } }
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}
			else if (toolMessage.type === 'running_now') {
				// nothing more is needed
			}
			else if (toolMessage.type === 'tool_request') {
				// nothing more is needed
			}

			return <ToolHeaderWrapper {...componentParams} />
		}
	},
	'delete_file_or_folder': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')
			const isFolder = toolMessage.params?.isFolder ?? false
			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const title = getTitle(toolMessage, t)
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const icon = null

			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			componentParams.info = getRelative(params.uri, accessor) // full path

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
			}
			else if (toolMessage.type === 'rejected') {
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				if (params) { componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) } }
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}
			else if (toolMessage.type === 'running_now') {
				const { result } = toolMessage
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
			}
			else if (toolMessage.type === 'tool_request') {
				const { result } = toolMessage
				componentParams.onClick = () => { voidOpenFileFn(params.uri, accessor) }
			}

			return <ToolHeaderWrapper {...componentParams} />
		}
	},
	'rewrite_file': {
		resultWrapper: (params) => {
			return <EditTool {...params} content={params.toolMessage.params.newContent} />
		}
	},
	'edit_file': {
		resultWrapper: (params) => {
			return <EditTool {...params} content={params.toolMessage.params.searchReplaceBlocks} />
		}
	},

	// ---

	'run_command': {
		resultWrapper: (params) => {
			return <CommandTool {...params} type='run_command' />
		}
	},

	'run_persistent_command': {
		resultWrapper: (params) => {
			return <CommandTool {...params} type='run_persistent_command' />
		}
	},
	'open_persistent_terminal': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const terminalToolsService = accessor.get('ITerminalToolService')

			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const title = getTitle(toolMessage, t)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			const relativePath = params.cwd ? getRelative(URI.file(params.cwd), accessor) : ''
			componentParams.info = relativePath ? t.runningIn(relativePath) : undefined

			if (toolMessage.type === 'success') {
				const { result } = toolMessage
				const { persistentTerminalId } = result
				componentParams.desc1 = persistentTerminalNameOfId(persistentTerminalId)
				componentParams.onClick = () => terminalToolsService.focusPersistentTerminal(persistentTerminalId)
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		},
	},
	'kill_persistent_terminal': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()
			const commandService = accessor.get('ICommandService')
			const terminalToolsService = accessor.get('ITerminalToolService')

			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const title = getTitle(toolMessage, t)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			if (toolMessage.type === 'success') {
				const { persistentTerminalId } = params
				componentParams.desc1 = persistentTerminalNameOfId(persistentTerminalId)
				componentParams.onClick = () => terminalToolsService.focusPersistentTerminal(persistentTerminalId)
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		},
	},
	'xml_escape': {
		resultWrapper: ({ toolMessage }) => {
const t = useVoidChatI18n()
			const accessor = useAccessor()

			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor)
			const title = getTitle(toolMessage, t)
			const icon = null

			if (toolMessage.type === 'tool_request') return null // do not show past requests
			if (toolMessage.type === 'running_now') return null // do not show running

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage
			const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError, icon, isRejected, }

			if (toolMessage.type === 'success') {
				const result = toolMessage.result as Awaited<BuiltinToolResultType['xml_escape']>
				const { escapedContent, originalLength, escapedLength, charactersEscaped } = result
				componentParams.bottomChildren = <BottomChildren title={t.escapedResult()}>
					<CodeChildren>
						{t.escapeSuccess(charactersEscaped, originalLength, escapedLength)}
					</CodeChildren>
				</BottomChildren>
			}
			else if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		},
	},
	'ask_user_question': {
		resultWrapper: ({ toolMessage, threadId }) => {
			const t = useVoidChatI18n()
			const accessor = useAccessor()
			const chatThreadService = accessor.get('IChatThreadService')

			const title = getTitle(toolMessage, t)
			const icon = null

			const isError = false
			const isRejected = toolMessage.type === 'rejected'
			const { rawParams, params } = toolMessage

			// tool_request state - show the question UI
			if (toolMessage.type === 'tool_request') {
				return <AskUserQuestionUI threadId={threadId} questions={params.questions} />
			}

			if (toolMessage.type === 'running_now') return null // do not show running

			// success state - show the answers directly (not collapsed)
			if (toolMessage.type === 'success') {
				const result = toolMessage.result as Awaited<BuiltinToolResultType['ask_user_question']>
				return (
					<div className="p-3 rounded-lg bg-[var(--vscode-editor-background)] border border-[var(--vscode-widget-border)] space-y-3">
						{/* Header */}
						<div className="flex items-center gap-2">
							<Check size={14} className="text-[var(--vscode-foreground)]" />
							<span className="text-sm font-medium text-[var(--vscode-foreground)]">{t.userAnswered()}</span>
						</div>
						{/* Answers - displayed directly without collapsing */}
						<div className="space-y-2">
							{Object.entries(result.answers).map(([header, answer], idx) => (
								<div key={idx} className="text-sm">
									<span className="px-2 py-0.5 text-xs rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] mr-2">
										{header}
									</span>
									<span className="text-[var(--vscode-foreground)]">
										{Array.isArray(answer) ? answer.join(', ') : answer}
									</span>
								</div>
							))}
						</div>
					</div>
				)
			}

			// error or rejected state
			const componentParams: ToolHeaderParams = { title, desc1: t.needYourAnswer(), isError, icon, isRejected, }
			if (toolMessage.type === 'tool_error') {
				const { result } = toolMessage
				componentParams.bottomChildren = <BottomChildren title={t.error()}>
					<CodeChildren>
						{result}
					</CodeChildren>
				</BottomChildren>
			}

			return <ToolHeaderWrapper {...componentParams} />
		},
	},
};


const Checkpoint = ({ message, threadId, messageIdx, isCheckpointGhost, threadIsRunning }: { message: CheckpointEntry, threadId: string; messageIdx: number, isCheckpointGhost: boolean, threadIsRunning: boolean }) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const chatThreadService = accessor.get('IChatThreadService')
	const streamState = useFullChatThreadsStreamState()

	const isRunning = useChatThreadsStreamState(threadId)?.isRunning
	const isDisabled = useMemo(() => {
		if (isRunning) return true
		return !!Object.keys(streamState).find((threadId2) => streamState[threadId2]?.isRunning)
	}, [isRunning, streamState])

	return <div
		className={`flex items-center justify-center px-2 `}
	>
		<div
			className={`
                    text-xs
                    text-void-fg-3
                    select-none
                    ${isCheckpointGhost ? 'opacity-50' : 'opacity-100'}
					${isDisabled ? 'cursor-default' : 'cursor-pointer'}
                `}
			style={{ position: 'relative', display: 'inline-block' }} // allow absolute icon
			onClick={() => {
				if (threadIsRunning) return
				if (isDisabled) return
				chatThreadService.jumpToCheckpointBeforeMessageIdx({
					threadId,
					messageIdx,
					jumpToUserModified: messageIdx === (chatThreadService.state.allThreads[threadId]?.messages.length ?? 0) - 1
				})
			}}
			{...isDisabled ? {
				'data-tooltip-id': 'void-tooltip',
				'data-tooltip-content': isRunning ? t.disabledWhileRunning() : t.disabledBecauseAnotherRunning(),
				'data-tooltip-place': 'top',
			} : {}}
		>
			{t.checkpoint()}
		</div>
	</div>
}


type ChatBubbleMode = 'display' | 'edit'
type ChatBubbleProps = {
	chatMessage: ChatMessage,
	messageIdx: number,
	isCommitted: boolean,
	chatIsRunning: IsRunningType,
	threadId: string,
	currCheckpointIdx: number | undefined,
	_scrollToBottom: (() => void) | null,
}

const ChatBubble = (props: ChatBubbleProps) => {
	return <ErrorBoundary>
		<_ChatBubble {...props} />
	</ErrorBoundary>
}

const _ChatBubble = ({ threadId, chatMessage, currCheckpointIdx, isCommitted, messageIdx, chatIsRunning, _scrollToBottom }: ChatBubbleProps) => {
	const t = useVoidChatI18n()
	const role = chatMessage.role
	const settingsState = useSettingsState()
	const showJsonDebug = settingsState.globalSettings.showJsonDebug

	const isCheckpointGhost = messageIdx > (currCheckpointIdx ?? Infinity) && !chatIsRunning // whether to show as gray (if chat is running, for good measure just dont show any ghosts)

	const [isJsonOpen, setIsJsonOpen] = useState(false)
	const chatMessageJson = useMemo(() => JSON.stringify(chatMessage, null, 2), [chatMessage])

	// Try to parse systemContent as JSON for better display
	const parsedSystemContent = useMemo(() => {
		if (role !== 'system') return null
		const msg = chatMessage as any
		const systemContent = msg?.systemContent
		if (!systemContent) return null
		try {
			const parsed = JSON.parse(systemContent)
			return JSON.stringify(parsed, null, 2)
		} catch {
			return systemContent
		}
	}, [role, chatMessage])

	// For system messages, use parsed JSON for copy if available
	const systemJsonForCopy = useMemo(() => {
		if (role !== 'system') return null
		const msg = chatMessage as any
		const systemContent = msg?.systemContent
		if (!systemContent) return null
		try {
			const parsed = JSON.parse(systemContent)
			return JSON.stringify(parsed, null, 2)
		} catch {
			return JSON.stringify(chatMessage, null, 2)
		}
	}, [role, chatMessage])

	let messageContent: React.ReactNode
	if (role === 'user') {
		messageContent = <UserMessageComponent
			chatMessage={chatMessage}
			isCheckpointGhost={isCheckpointGhost}
			currCheckpointIdx={currCheckpointIdx}
			messageIdx={messageIdx}
			_scrollToBottom={_scrollToBottom}
		/>
	}
	else if (role === 'assistant') {
		messageContent = <AssistantMessageComponent
			chatMessage={chatMessage}
			isCheckpointGhost={isCheckpointGhost}
			messageIdx={messageIdx}
			isCommitted={isCommitted}
		/>
	}
	else if (role === 'tool') {

		if (chatMessage.type === 'invalid_params') {
			messageContent = <div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
				<InvalidTool toolName={chatMessage.name} message={chatMessage.content} mcpServerName={chatMessage.mcpServerName} />
			</div>
		}
		else {
			const toolName = chatMessage.name
			const isBuiltInTool = isABuiltinToolName(toolName)
			const ToolResultWrapper = isBuiltInTool ? builtinToolNameToComponent[toolName]?.resultWrapper as ResultWrapper<ToolName>
				: MCPToolWrapper as ResultWrapper<ToolName>

			if (ToolResultWrapper)
				messageContent = <>
					<div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
						<ToolResultWrapper
							toolMessage={chatMessage}
							messageIdx={messageIdx}
							threadId={threadId}
						/>
					</div>
					{chatMessage.type === 'tool_request' ?
						<div className={`${isCheckpointGhost ? 'opacity-50 pointer-events-none' : ''}`}>
							<ToolRequestAcceptRejectButtons toolName={chatMessage.name} />
						</div> : null}
				</>
			else
				messageContent = null
		}
	}
	else if (role === 'interrupted_streaming_tool') {
		messageContent = <div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
			<CanceledTool toolName={chatMessage.name} mcpServerName={chatMessage.mcpServerName} />
		</div>
	}
	else if (role === 'checkpoint') {
		messageContent = <Checkpoint
			threadId={threadId}
			message={chatMessage}
			messageIdx={messageIdx}
			isCheckpointGhost={isCheckpointGhost}
			threadIsRunning={!!chatIsRunning}
		/>
	}
	else if (role === 'system') {
		messageContent = <div className='text-void-fg-3 text-xs'>
			<div className='flex items-center gap-1 mb-1 text-void-fg-4 font-medium'>
				<Info className='h-3 w-3' />
				<span>{t.system()}</span>
				{chatMessage.title && <span className='text-void-fg-2'>— {chatMessage.title}</span>}
				{chatMessage.modelUsed && <span className='text-void-fg-5'>({chatMessage.modelUsed})</span>}
			</div>
			<pre className='whitespace-pre-wrap text-void-fg-4 max-h-32 overflow-auto'>{parsedSystemContent}</pre>
		</div>
	}
	else {
		messageContent = null
	}

	return <div className={`border border-void-border-1 rounded-md p-2 mb-2 ${isCheckpointGhost ? 'opacity-50' : ''}`}>
		{messageContent}
		{/* JSON collapsible section */}
		{showJsonDebug && <div className='mt-2 border-t border-void-border-1 pt-2'>
			<div className='flex items-center justify-between'>
				<button
					onClick={() => setIsJsonOpen(v => !v)}
					className='flex items-center gap-1 text-void-fg-3 hover:text-void-fg-1 text-xs cursor-pointer'
				>
					<ChevronRight className={`h-3 w-3 transition-transform duration-100 ${isJsonOpen ? 'rotate-90' : ''}`} />
					<span>JSON</span>
					<span className="ml-2 text-void-fg-4 opacity-60">{chatMessage.role}{(chatMessage as any).modelName ? ` · ${(chatMessage as any).modelName}` : ''}</span>
				</button>
				<CopyButton codeStr={role === 'system' ? (systemJsonForCopy || chatMessageJson) : chatMessageJson} toolTipName={t.copyJson()} />
			</div>
			{isJsonOpen && <pre className='mt-1 p-2 bg-void-bg-2 rounded text-void-fg-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap'>{role === 'system' ? (systemJsonForCopy || chatMessageJson) : chatMessageJson}</pre>}
		</div>}
	</div>

}

const CommandBarInChat = () => {
	const t = useVoidChatI18n()
	const { stateOfURI: commandBarStateOfURI, sortedURIs: sortedCommandBarURIs } = useCommandBarState()
	const numFilesChanged = sortedCommandBarURIs.length

	const accessor = useAccessor()
	const editCodeService = accessor.get('IEditCodeService')
	const commandService = accessor.get('ICommandService')
	const chatThreadsState = useChatThreadsState()
	const commandBarState = useCommandBarState()
	const chatThreadsStreamState = useChatThreadsStreamState(chatThreadsState.currentThreadId)

	// (
	// 	<IconShell1
	// 		Icon={CopyIcon}
	// 		onClick={copyChatToClipboard}
	// 		data-tooltip-id='void-tooltip'
	// 		data-tooltip-place='top'
	// 		data-tooltip-content='Copy chat JSON'
	// 	/>
	// )

	const [fileDetailsOpenedState, setFileDetailsOpenedState] = useState<'auto-opened' | 'auto-closed' | 'user-opened' | 'user-closed'>('auto-closed');
	const isFileDetailsOpened = fileDetailsOpenedState === 'auto-opened' || fileDetailsOpenedState === 'user-opened';


	useEffect(() => {
		// close the file details if there are no files
		// this converts 'user-closed' to 'auto-closed'
		if (numFilesChanged === 0) {
			setFileDetailsOpenedState('auto-closed')
		}
		// open the file details if it hasnt been closed
		if (numFilesChanged > 0 && fileDetailsOpenedState !== 'user-closed') {
			setFileDetailsOpenedState('auto-opened')
		}
	}, [fileDetailsOpenedState, setFileDetailsOpenedState, numFilesChanged])


	const isFinishedMakingThreadChanges = (
		// there are changed files
		commandBarState.sortedURIs.length !== 0
		// none of the files are streaming
		&& commandBarState.sortedURIs.every(uri => !commandBarState.stateOfURI[uri.fsPath]?.isStreaming)
	)

	// ======== status of agent ========
	// This icon answers the question "is the LLM doing work on this thread?"
	// assume it is single threaded for now
	// green = Running
	// orange = Requires action
	// dark = Done

	const threadStatus = (
		chatThreadsStreamState?.isRunning === 'awaiting_user' ? { title: t.awaitingApproval(), color: 'yellow', } as const
			: chatThreadsStreamState?.isRunning ? { title: t.running(), color: 'orange', } as const
				: { title: t.completed(), color: 'dark', } as const
	)


	const threadStatusHTML = <StatusIndicator className='mx-1' indicatorColor={threadStatus.color} title={threadStatus.title} />


	// ======== info about changes ========
	// num files changed
	// acceptall + rejectall
	// popup info about each change (each with num changes + acceptall + rejectall of their own)

	const numFilesChangedStr = numFilesChanged === 0 ? t.noFilesChanged()
		: t.filesChanged(sortedCommandBarURIs.length)




	const acceptRejectAllButtons = <div
		// do this with opacity so that the height remains the same at all times
		className={`flex items-center gap-0.5
			${isFinishedMakingThreadChanges ? '' : 'opacity-0 pointer-events-none'}`
		}
	>
		<IconShell1 // RejectAllButtonWrapper
			// text="Reject All"
			// className="text-xs"
			Icon={X}
			onClick={() => {
				sortedCommandBarURIs.forEach(uri => {
					editCodeService.acceptOrRejectAllDiffAreas({
						uri,
						removeCtrlKs: true,
						behavior: "reject",
						_addToHistory: true,
					});
				});
			}}
			data-tooltip-id='void-tooltip'
			data-tooltip-place='top'
			data-tooltip-content={t.rejectAll()}
		/>

		<IconShell1 // AcceptAllButtonWrapper
			// text="Accept All"
			// className="text-xs"
			Icon={Check}
			onClick={() => {
				sortedCommandBarURIs.forEach(uri => {
					editCodeService.acceptOrRejectAllDiffAreas({
						uri,
						removeCtrlKs: true,
						behavior: "accept",
						_addToHistory: true,
					});
				});
			}}
			data-tooltip-id='void-tooltip'
			data-tooltip-place='top'
			data-tooltip-content={t.acceptAll()}
		/>



	</div>


	// !select-text cursor-auto
	const fileDetailsContent = <div className="px-2 gap-1 w-full overflow-y-auto">
		{sortedCommandBarURIs.map((uri, i) => {
			const basename = getBasename(uri.fsPath)

			const { sortedDiffIds, isStreaming } = commandBarStateOfURI[uri.fsPath] ?? {}
			const isFinishedMakingFileChanges = !isStreaming

			const numDiffs = sortedDiffIds?.length || 0

			const fileStatus = (isFinishedMakingFileChanges
				? { title: t.completed(), color: 'dark', } as const
				: { title: t.running(), color: 'orange', } as const
			)

			const fileNameHTML = <div
				className="flex items-center gap-1.5 text-void-fg-3 hover:brightness-125 transition-all duration-200 cursor-pointer"
				onClick={() => voidOpenFileFn(uri, accessor)}
			>
				{/* <FileIcon size={14} className="text-void-fg-3" /> */}
				<span className="text-void-fg-3">{basename}</span>
			</div>




			const detailsContent = <div className='flex px-4'>
				<span className="text-void-fg-3 opacity-80">{t.changesInFile(numDiffs)}</span>
			</div>

			const acceptRejectButtons = <div
				// do this with opacity so that the height remains the same at all times
				className={`flex items-center gap-0.5
					${isFinishedMakingFileChanges ? '' : 'opacity-0 pointer-events-none'}
				`}
			>
				{/* <JumpToFileButton
					uri={uri}
					data-tooltip-id='void-tooltip'
					data-tooltip-place='top'
					data-tooltip-content='Go to file'
				/> */}
				<IconShell1 // RejectAllButtonWrapper
					Icon={X}
					onClick={() => { editCodeService.acceptOrRejectAllDiffAreas({ uri, removeCtrlKs: true, behavior: "reject", _addToHistory: true, }); }}
					data-tooltip-id='void-tooltip'
					data-tooltip-place='top'
					data-tooltip-content={t.rejectFile()}

				/>
				<IconShell1 // AcceptAllButtonWrapper
					Icon={Check}
					onClick={() => { editCodeService.acceptOrRejectAllDiffAreas({ uri, removeCtrlKs: true, behavior: "accept", _addToHistory: true, }); }}
					data-tooltip-id='void-tooltip'
					data-tooltip-place='top'
					data-tooltip-content={t.acceptFile()}
				/>

			</div>

			const fileStatusHTML = <StatusIndicator className='mx-1' indicatorColor={fileStatus.color} title={fileStatus.title} />

			return (
				// name, details
				<div key={i} className="flex justify-between items-center">
					<div className="flex items-center">
						{fileNameHTML}
						{detailsContent}
					</div>
					<div className="flex items-center gap-2">
						{acceptRejectButtons}
						{fileStatusHTML}
					</div>
				</div>
			)
		})}
	</div>

	const fileDetailsButton = (
		<button
			className={`flex items-center gap-1 rounded ${numFilesChanged === 0 ? 'cursor-pointer' : 'cursor-pointer hover:brightness-125 transition-all duration-200'}`}
			onClick={() => isFileDetailsOpened ? setFileDetailsOpenedState('user-closed') : setFileDetailsOpenedState('user-opened')}
			type='button'
			disabled={numFilesChanged === 0}
		>
			<svg
				className="transition-transform duration-200 size-3.5"
				style={{
					transform: isFileDetailsOpened ? 'rotate(0deg)' : 'rotate(180deg)',
					transition: 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)'
				}}
				xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline>
			</svg>
			{numFilesChangedStr}
		</button>
	)

	return (
		<>
			{/* file details */}
			<div className='px-2'>
				<div
					className={`
						select-none
						flex w-full rounded-t-lg bg-void-bg-3
						text-void-fg-3 text-xs text-nowrap

						overflow-hidden transition-all duration-200 ease-in-out
						${isFileDetailsOpened ? 'max-h-24' : 'max-h-0'}
					`}
				>
					{fileDetailsContent}
				</div>
			</div>
			{/* main content */}
			<div
				className={`
					select-none
					flex w-full rounded-t-lg bg-void-bg-3
					text-void-fg-3 text-xs text-nowrap
					border-t border-l border-r border-zinc-300/10

					px-2 py-1
					justify-between
				`}
			>
				<div className="flex gap-2 items-center">
					{fileDetailsButton}
				</div>
				<div className="flex gap-2 items-center">
					{acceptRejectAllButtons}
					{threadStatusHTML}
				</div>
			</div>
		</>
	)
}



const EditToolSoFar = ({ toolCallSoFar, }: { toolCallSoFar: RawToolCallObj }) => {
	const t = useVoidChatI18n()

	if (!isABuiltinToolName(toolCallSoFar.name)) return null

	const accessor = useAccessor()

	const uri = toolCallSoFar.rawParams.uri ? URI.file(toolCallSoFar.rawParams.uri) : undefined

	const toolTitles = getTitleOfBuiltinToolName(t)
	const title = toolTitles[toolCallSoFar.name as BuiltinToolName].proposed

	const uriDone = toolCallSoFar.doneParams.includes('uri')
	const desc1 = <span className='flex items-center'>
		{uriDone ?
			getBasename(toolCallSoFar.rawParams['uri'] ?? 'unknown')
			: t.generating()}
		<IconLoading />
	</span>

	const desc1OnClick = () => { uri && voidOpenFileFn(uri, accessor) }

	// If URI has not been specified
	return <ToolHeaderWrapper
		title={title}
		desc1={desc1}
		desc1OnClick={desc1OnClick}
	>
		<EditToolChildren
			uri={uri}
			code={toolCallSoFar.rawParams.search_replace_blocks ?? toolCallSoFar.rawParams.new_content ?? ''}
			type={'rewrite'} // as it streams, show in rewrite format, don't make a diff editor
		/>
		<IconLoading />
	</ToolHeaderWrapper>

}


export const SidebarChat = () => {
	const t = useVoidChatI18n()
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
	const textAreaFnsRef = useRef<TextAreaFns | null>(null)

	const accessor = useAccessor()
	const commandService = accessor.get('ICommandService')
	const chatThreadsService = accessor.get('IChatThreadService')

	const settingsState = useSettingsState()

	// Get current model's vision support
	const modelSelection = settingsState.modelSelectionOfFeature['Chat']
	const overridesOfModel = settingsState.overridesOfModel
	let supportsVision = false
	if (modelSelection) {
		const { modelName, providerName } = modelSelection
		supportsVision = getModelCapabilities(providerName, modelName, overridesOfModel).supportsVision ?? false
	}

	// ----- HIGHER STATE -----

	// threads state
	const chatThreadsState = useChatThreadsState()

	const currentThread = chatThreadsService.getCurrentThread()
	const previousMessages = currentThread?.messages ?? []

	const selections = currentThread.state.stagingSelections
	const setSelections = (s: StagingSelectionItem[]) => { chatThreadsService.setCurrentThreadState({ stagingSelections: s }) }

	const images = currentThread.state.stagingImages
	const setImages = (imgs: ImageAttachment[]) => { chatThreadsService.setCurrentThreadState({ stagingImages: imgs }) }

	// stream state
	const currThreadStreamState = useChatThreadsStreamState(chatThreadsState.currentThreadId)
	const isRunning = currThreadStreamState?.isRunning
	const latestError = currThreadStreamState?.error
	const { displayContentSoFar, toolCallSoFar, reasoningSoFar } = currThreadStreamState?.llmInfo ?? {}

	// this is just if it's currently being generated, NOT if it's currently running
	const toolIsGenerating = toolCallSoFar && !toolCallSoFar.isDone // show loading for slow tools (right now just edit)

	// ----- SIDEBAR CHAT state (local) -----

	// state of current message
	const initVal = ''
	const [instructionsAreEmpty, setInstructionsAreEmpty] = useState(!initVal)

	// Disable if no text AND no images, or if feature is disabled
	const hasNoContent = instructionsAreEmpty && (!images || images.length === 0)
	const isDisabled = hasNoContent || !!isFeatureNameDisabled('Chat', settingsState)

	const sidebarRef = useRef<HTMLDivElement>(null)
	const scrollContainerRef = useRef<HTMLDivElement | null>(null)
	const onSubmit = useCallback(async (_forceSubmit?: string) => {

		if (isDisabled && !_forceSubmit) return
		if (isRunning) return

		const threadId = chatThreadsService.state.currentThreadId

		// send message to LLM
		const userMessage = _forceSubmit || textAreaRef.current?.value || ''

		// Get current images before clearing
		const currentImages = images

		try {
			await chatThreadsService.addUserMessageAndStreamResponse({ userMessage, _chatImages: currentImages, threadId })
		} catch (e) {
			console.error('Error while sending message in chat:', e)
		}

		setSelections([]) // clear staging
		setImages([]) // clear staging images
		textAreaFnsRef.current?.setValue('')
		textAreaRef.current?.focus() // focus input after submit

	}, [chatThreadsService, isDisabled, isRunning, textAreaRef, textAreaFnsRef, setSelections, setImages, images, settingsState])

	const onAbort = async () => {
		const threadId = currentThread.id
		await chatThreadsService.abortRunning(threadId)
	}

	const keybindingString = accessor.get('IKeybindingService').lookupKeybinding(VOID_CTRL_L_ACTION_ID)?.getLabel()

	const threadId = currentThread.id
	const currCheckpointIdx = chatThreadsState.allThreads[threadId]?.state?.currCheckpointIdx ?? undefined  // if not exist, treat like checkpoint is last message (infinity)



	// resolve mount info
	const isResolved = chatThreadsState.allThreads[threadId]?.state.mountedInfo?.mountedIsResolvedRef.current
	useEffect(() => {
		if (isResolved) return
		chatThreadsState.allThreads[threadId]?.state.mountedInfo?._whenMountedResolver?.({
			textAreaRef: textAreaRef,
			scrollToBottom: () => scrollToBottom(scrollContainerRef),
		})

	}, [chatThreadsState, threadId, textAreaRef, scrollContainerRef, isResolved])




	const previousMessagesHTML = useMemo(() => {
		// const lastMessageIdx = previousMessages.findLastIndex(v => v.role !== 'checkpoint')
		// tool request shows up as Editing... if in progress
		return previousMessages.map((message, i) => {
			return <ChatBubble
				key={i}
				currCheckpointIdx={currCheckpointIdx}
				chatMessage={message}
				messageIdx={i}
				isCommitted={true}
				chatIsRunning={isRunning}
				threadId={threadId}
				_scrollToBottom={() => scrollToBottom(scrollContainerRef)}
			/>
		})
	}, [previousMessages, threadId, currCheckpointIdx, isRunning])

	const streamingChatIdx = previousMessagesHTML.length
	const currStreamingMessageHTML = reasoningSoFar || displayContentSoFar || isRunning ?
		<ChatBubble
			key={'curr-streaming-msg'}
			currCheckpointIdx={currCheckpointIdx}
			chatMessage={{
				role: 'assistant',
				displayContent: displayContentSoFar ?? '',
				reasoning: reasoningSoFar ?? '',
				anthropicReasoning: null,
				toolCalls: null,
				rawLLMContent: null,
				modelName: null,
			}}
			messageIdx={streamingChatIdx}
			isCommitted={false}
			chatIsRunning={isRunning}

			threadId={threadId}
			_scrollToBottom={null}
		/> : null


	// the tool currently being generated
	const generatingTool = toolIsGenerating ?
		toolCallSoFar.name === 'edit_file' || toolCallSoFar.name === 'rewrite_file' ? <EditToolSoFar
			key={'curr-streaming-tool'}
			toolCallSoFar={toolCallSoFar}
		/>
			: null
		: null

	const messagesHTML = <ScrollToBottomContainer
		key={'messages' + chatThreadsState.currentThreadId} // force rerender on all children if id changes
		scrollContainerRef={scrollContainerRef}
		className={`
			flex flex-col
			px-4 py-4 space-y-4
			w-full h-full
			overflow-x-hidden
			overflow-y-auto
			${previousMessagesHTML.length === 0 && !displayContentSoFar ? 'hidden' : ''}
		`}
	>
		{/* previous messages */}
		{previousMessagesHTML}
		{currStreamingMessageHTML}

		{/* Generating tool */}
		{generatingTool}

		{/* loading indicator */}
		{isRunning === 'LLM' || isRunning === 'idle' && !toolIsGenerating ? <ProseWrapper>
			{<IconLoading className='opacity-50 text-[34px]' />}
		</ProseWrapper> : null}


		{/* error message */}
		{latestError === undefined ? null :
			<div className='px-2 my-1'>
				<ErrorDisplay
					message={latestError.message}
					fullError={latestError.fullError}
					onDismiss={() => { chatThreadsService.dismissStreamError(currentThread.id) }}
					showDismiss={true}
				/>

				<WarningBox className='text-sm my-2 mx-4' onClick={() => { commandService.executeCommand(VOID_OPEN_SETTINGS_ACTION_ID) }} text={t.openSettings()} />
			</div>
		}
	</ScrollToBottomContainer>


	const onChangeText = useCallback((newStr: string) => {
		setInstructionsAreEmpty(!newStr)
	}, [setInstructionsAreEmpty])
	const onKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
			onSubmit()
		} else if (e.key === 'Escape' && isRunning) {
			onAbort()
		}
	}, [onSubmit, onAbort, isRunning])

	const inputChatArea = <VoidChatArea
		featureName='Chat'
		onSubmit={() => onSubmit()}
		onAbort={onAbort}
		isStreaming={!!isRunning}
		isDisabled={isDisabled}
		showSelections={true}
		// showProspectiveSelections={previousMessagesHTML.length === 0}
		selections={selections}
		setSelections={setSelections}
		images={images}
		setImages={setImages}
		supportsVision={supportsVision}
		onClickAnywhere={() => { textAreaRef.current?.focus() }}
	>
		<VoidInputBox2
			enableAtToMention
			className={`min-h-[81px] px-0.5 py-0.5`}
			placeholder={keybindingString ? t.inputPlaceholderWithKey(keybindingString) : t.inputPlaceholder()}
			onChangeText={onChangeText}
			onKeyDown={onKeyDown}
			onFocus={() => { chatThreadsService.setCurrentlyFocusedMessageIdx(undefined) }}
			ref={textAreaRef}
			fnsRef={textAreaFnsRef}
			multiline={true}
		/>

	</VoidChatArea>


	const isLandingPage = previousMessages.length === 0


	const initiallySuggestedPromptsHTML = <div className='flex flex-col gap-2 w-full text-nowrap text-void-fg-3 select-none'>
		{[
			t.suggestedPrompt1(),
			t.suggestedPrompt2(),
			t.suggestedPrompt3()
		].map((text, index) => (
			<div
				key={index}
				className='py-1 px-2 rounded text-sm bg-zinc-700/5 hover:bg-zinc-700/10 dark:bg-zinc-300/5 dark:hover:bg-zinc-300/10 cursor-pointer opacity-80 hover:opacity-100'
				onClick={() => onSubmit(text)}
			>
				{text}
			</div>
		))}
	</div>



	const threadPageInput = <div key={'input' + chatThreadsState.currentThreadId}>
		<div className='px-4'>
			<CommandBarInChat />
		</div>
		<div className='px-2 pb-2'>
			{inputChatArea}
		</div>
	</div>

	const landingPageInput = <div>
		<div className='pt-8'>
			{inputChatArea}
		</div>
	</div>

	const landingPageContent = <div
		ref={sidebarRef}
		className='w-full h-full max-h-full flex flex-col overflow-auto px-4'
	>
		<ErrorBoundary>
			{landingPageInput}
		</ErrorBoundary>

		{Object.keys(chatThreadsState.allThreads).length > 1 ? // show if there are threads
			<ErrorBoundary>
				<div className='pt-8 mb-2 text-void-fg-3 text-root select-none pointer-events-none'>{t.previousThreads()}</div>
				<PastThreadsList />
			</ErrorBoundary>
			:
			<ErrorBoundary>
				<div className='pt-8 mb-2 text-void-fg-3 text-root select-none pointer-events-none'>{t.suggestions()}</div>
				{initiallySuggestedPromptsHTML}
			</ErrorBoundary>
		}
	</div>


	// const threadPageContent = <div>
	// 	{/* Thread content */}
	// 	<div className='flex flex-col overflow-hidden'>
	// 		<div className={`overflow-hidden ${previousMessages.length === 0 ? 'h-0 max-h-0 pb-2' : ''}`}>
	// 			<ErrorBoundary>
	// 				{messagesHTML}
	// 			</ErrorBoundary>
	// 		</div>
	// 		<ErrorBoundary>
	// 			{inputForm}
	// 		</ErrorBoundary>
	// 	</div>
	// </div>
	const threadPageContent = <div
		ref={sidebarRef}
		className='w-full h-full flex flex-col overflow-hidden'
	>

		<ErrorBoundary>
			{messagesHTML}
		</ErrorBoundary>
		<ErrorBoundary>
			{threadPageInput}
		</ErrorBoundary>
	</div>


	return (
		<Fragment key={threadId} // force rerender when change thread
		>
			{isLandingPage ?
				landingPageContent
				: threadPageContent}
		</Fragment>
	)
}
