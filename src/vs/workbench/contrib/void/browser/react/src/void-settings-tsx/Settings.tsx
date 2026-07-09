/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'; // Added useRef import just in case it was missed, though likely already present
import { ProviderName, SettingName, displayInfoOfSettingName, providerNames, VoidStatefulModelInfo, customSettingNamesOfProvider, RefreshableProviderName, refreshableProviderNames, displayInfoOfProviderName, nonlocalProviderNames, localProviderNames, GlobalSettingName, featureNames, displayInfoOfFeatureName, isProviderNameDisabled, FeatureName, hasDownloadButtonsOnModelsProviderNames, subTextMdOfProviderName, DefaultLang, ResponseLanguage, defaultResponseLanguagePromptOfLanguage, compatibleApiProviderNames } from '../../../../common/voidSettingsTypes.js'
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js'
import { VoidButtonBgDarken, VoidCustomDropdownBox, VoidInputBox2, VoidSimpleInputBox, VoidSwitch } from '../util/inputs.js'
import { useAccessor, useIsDark, useIsOptedOut, useRefreshModelListener, useRefreshModelState, useSettingsState, useSkillServiceState } from '../util/services.js'
import { X, RefreshCw, Loader2, Check, Asterisk, Plus, ChevronDown, ChevronUp, Settings as SettingsIcon, Trash2, Pencil, Copy } from 'lucide-react'
import { URI } from '../../../../../../../base/common/uri.js'
import { ModelDropdown } from './ModelDropdown.js'
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js'
import { WarningBox } from './WarningBox.js'
import { os } from '../../../../common/helpers/systemInfo.js'
import { IconLoading } from '../sidebar-tsx/SidebarChat.js'
import { ToolApprovalType, toolApprovalTypes } from '../../../../common/toolsServiceTypes.js'
import Severity from '../../../../../../../base/common/severity.js'
import { getModelCapabilities, modelOverrideKeys, ModelOverrides } from '../../../../common/modelCapabilities.js';
import { TransferEditorType, TransferFilesInfo } from '../../../extensionTransferTypes.js';
import { MCPServer } from '../../../../common/mcpServiceTypes.js';
import { useMCPServiceState } from '../util/services.js';
import { OPT_OUT_KEY } from '../../../../common/storageKeys.js';
import { StorageScope, StorageTarget } from '../../../../../../../platform/storage/common/storage.js';
import { useVoidChatI18n } from '../util/i18n.js';
import { createNotificationHelper } from '../../../../common/helpers/notificationHelper.js';

type Tab =
	| 'models'
	| 'compatibleApiProviders'
	| 'localProviders'
	| 'providers'
	| 'featureOptions'
	| 'skills'
	| 'mcp'
	| 'general'
	| 'all';


const ButtonLeftTextRightOption = ({ text, leftButton }: { text: string, leftButton?: React.ReactNode }) => {

	return <div className='flex items-center text-void-fg-3 px-3 py-0.5 rounded-sm overflow-hidden gap-2'>
		{leftButton ? leftButton : null}
		<span>
			{text}
		</span>
	</div>
}

// models
const RefreshModelButton = ({ providerName }: { providerName: RefreshableProviderName }) => {
	const t = useVoidChatI18n();

	const refreshModelState = useRefreshModelState()

	const accessor = useAccessor()
	const refreshModelService = accessor.get('IRefreshModelService')
	const metricsService = accessor.get('IMetricsService')

	const [justFinished, setJustFinished] = useState<null | 'finished' | 'error'>(null)

	useRefreshModelListener(
		useCallback((providerName2, refreshModelState) => {
			if (providerName2 !== providerName) return
			const { state } = refreshModelState[providerName]
			if (!(state === 'finished' || state === 'error')) return
			// now we know we just entered 'finished' state for this providerName
			setJustFinished(state)
			const tid = setTimeout(() => { setJustFinished(null) }, 2000)
			return () => clearTimeout(tid)
		}, [providerName])
	)

	const { state } = refreshModelState[providerName]

	const { title: providerTitle } = displayInfoOfProviderName(providerName)

	return <ButtonLeftTextRightOption

		leftButton={
			<button
				className='flex items-center'
				disabled={state === 'refreshing' || justFinished !== null}
				onClick={() => {
					refreshModelService.startRefreshingModels(providerName, { enableProviderOnSuccess: false, doNotFire: false })
					metricsService.capture('Click', { providerName, action: 'Refresh Models' })
				}}
			>
				{justFinished === 'finished' ? <Check className='stroke-green-500 size-3' />
					: justFinished === 'error' ? <X className='stroke-red-500 size-3' />
						: state === 'refreshing' ? <Loader2 className='size-3 animate-spin' />
							: <RefreshCw className='size-3' />}
			</button>
		}

		text={justFinished === 'finished' ? t.modelsAreUpToDate(providerTitle)
			: justFinished === 'error' ? t.providerNotFound(providerTitle)
				: t.manuallyRefreshModels(providerTitle)}
	/>
}

const RefreshableModels = () => {
	const settingsState = useSettingsState()


	const buttons = refreshableProviderNames.map(providerName => {
		if (!settingsState.settingsOfProvider[providerName]._didFillInProviderSettings) return null
		return <RefreshModelButton key={providerName} providerName={providerName} />
	})

	return <>
		{buttons}
	</>

}



export const AnimatedCheckmarkButton = ({ text, className }: { text?: string, className?: string }) => {
	const [dashOffset, setDashOffset] = useState(40);

	useEffect(() => {
		const startTime = performance.now();
		const duration = 500; // 500ms animation

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const newOffset = 40 - (progress * 40);

			setDashOffset(newOffset);

			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		const animationId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationId);
	}, []);

	return <div
		className={`flex items-center gap-1.5 w-fit
			${className ? className : `px-2 py-0.5 text-xs text-zinc-900 bg-zinc-100 rounded-sm`}
		`}
	>
		<svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M5 13l4 4L19 7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				style={{
					strokeDasharray: 40,
					strokeDashoffset: dashOffset
				}}
			/>
		</svg>
		{text}
	</div>
}


const AddButton = ({ disabled, text = 'Add', ...props }: { disabled?: boolean, text?: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {

	return <button
		disabled={disabled}
		className={`bg-[#0e70c0] px-3 py-1 text-white rounded-sm ${!disabled ? 'hover:bg-[#1177cb] cursor-pointer' : 'opacity-50 cursor-not-allowed bg-opacity-70'}`}
		{...props}
	>{text}</button>

}

// ConfirmButton prompts for a second click to confirm an action, cancels if clicking outside
const ConfirmButton = ({ children, onConfirm, className }: { children: React.ReactNode, onConfirm: () => void, className?: string }) => {
	const t = useVoidChatI18n();
	const [confirm, setConfirm] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!confirm) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setConfirm(false);
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [confirm]);
	return (
		<div ref={ref} className={`inline-block`}>
			<VoidButtonBgDarken className={className} onClick={() => {
				if (!confirm) {
					setConfirm(true);
				} else {
					onConfirm();
					setConfirm(false);
				}
			}}>
				{confirm ? t.confirmReset() : children}
			</VoidButtonBgDarken>
		</div>
	);
};

// ---------------- Add Model Dialog ------------------

// Special marker object for unset values - used to distinguish from actual values
// This object is unique and can be used as a special option in dropdowns
const UNSET_MARKER = { __unset: true } as const
type UnsetMarker = typeof UNSET_MARKER

// Default model configuration values shown in UI (for display purposes only)
const defaultModelConfigDisplay = {
	contextWindow: 128000,
	reservedOutputTokenSpace: 4096,
	supportsSystemMessage: 'system-role' as const,
	specialToolFormat: 'none' as const,
	supportsVision: false,
	supportsFIM: false,
	supportsReasoning: true,
	canTurnOffReasoning: false,
	canIOReasoning: false,
}

// Initial config state - all values are unset by default
const initialModelConfig = {
	contextWindow: UNSET_MARKER as number | UnsetMarker,
	reservedOutputTokenSpace: UNSET_MARKER as number | UnsetMarker,
	supportsSystemMessage: UNSET_MARKER as 'false' | 'system-role' | 'developer-role' | 'separated' | UnsetMarker,
	specialToolFormat: UNSET_MARKER as 'none' | 'openai-style' | 'anthropic-style' | UnsetMarker,
	supportsVision: UNSET_MARKER as boolean | UnsetMarker,
	supportsFIM: UNSET_MARKER as boolean | UnsetMarker,
	supportsReasoning: UNSET_MARKER as boolean | UnsetMarker,
	canTurnOffReasoning: UNSET_MARKER as boolean | UnsetMarker,
	canIOReasoning: UNSET_MARKER as boolean | UnsetMarker,
}

// Helper function to check if a value is unset
const isUnset = (value: any): boolean => value === UNSET_MARKER

const AddModelDialog = ({
	isOpen,
	onClose,
	providersToShow,
	getDetailForProvider,
}: {
	isOpen: boolean
	onClose: () => void
	providersToShow: ProviderName[]
	getDetailForProvider: (providerName: ProviderName) => string
}) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const settingsStateService = accessor.get('IVoidSettingsService')
	const settingsState = useSettingsState()

	// Sort providers: configured ones first, unconfigured ones last
	const sortedProvidersToShow = useMemo(() => {
		return [...providersToShow].sort((a, b) => {
			const aConfigured = settingsState.settingsOfProvider[a]?._didFillInProviderSettings ?? false
			const bConfigured = settingsState.settingsOfProvider[b]?._didFillInProviderSettings ?? false
			// Configured providers come first (1 means b comes first, -1 means a comes first)
			if (aConfigured && !bConfigured) return -1
			if (!aConfigured && bConfigured) return 1
			return 0
		})
	}, [providersToShow, settingsState.settingsOfProvider])

	// Basic fields
	const [providerName, setProviderName] = useState<ProviderName | null>(null)
	const [modelName, setModelName] = useState('')
	const [errorString, setErrorString] = useState('')
	const [showAdvanced, setShowAdvanced] = useState(false)

	// Config fields - initialize with UNSET_MARKER to distinguish from actual values
	const [contextWindow, setContextWindow] = useState(initialModelConfig.contextWindow)
	const [reservedOutputTokenSpace, setReservedOutputTokenSpace] = useState(initialModelConfig.reservedOutputTokenSpace)
	const [supportsSystemMessage, setSupportsSystemMessage] = useState<typeof initialModelConfig.supportsSystemMessage>(initialModelConfig.supportsSystemMessage)
	const [specialToolFormat, setSpecialToolFormat] = useState<typeof initialModelConfig.specialToolFormat>(initialModelConfig.specialToolFormat)
	const [supportsVision, setSupportsVision] = useState(initialModelConfig.supportsVision)
	const [supportsFIM, setSupportsFIM] = useState(initialModelConfig.supportsFIM)
	const [supportsReasoning, setSupportsReasoning] = useState(initialModelConfig.supportsReasoning)
	const [canTurnOffReasoning, setCanTurnOffReasoning] = useState(initialModelConfig.canTurnOffReasoning)
	const [canIOReasoning, setCanIOReasoning] = useState(initialModelConfig.canIOReasoning)

	// Reset when dialog opens
	useEffect(() => {
		if (isOpen) {
			setProviderName(null)
			setModelName('')
			setErrorString('')
			setShowAdvanced(false)
			// Reset all config fields to UNSET_MARKER
			setContextWindow(initialModelConfig.contextWindow)
			setReservedOutputTokenSpace(initialModelConfig.reservedOutputTokenSpace)
			setSupportsSystemMessage(initialModelConfig.supportsSystemMessage)
			setSpecialToolFormat(initialModelConfig.specialToolFormat)
			setSupportsVision(initialModelConfig.supportsVision)
			setSupportsFIM(initialModelConfig.supportsFIM)
			setSupportsReasoning(initialModelConfig.supportsReasoning)
			setCanTurnOffReasoning(initialModelConfig.canTurnOffReasoning)
			setCanIOReasoning(initialModelConfig.canIOReasoning)
		}
	}, [isOpen])

	const handleAddModel = async () => {
		if (!providerName) {
			setErrorString(t.pleaseSelectProvider())
			return
		}
		if (!modelName) {
			setErrorString(t.pleaseEnterModelName())
			return
		}

		// Check if provider is configured
		const providerSettings = settingsState.settingsOfProvider[providerName]
		if (!providerSettings._didFillInProviderSettings) {
			const providerTitle = displayInfoOfProviderName(providerName).title
			setErrorString(t.providerNotConfigured(providerTitle))
			return
		}

		// Check if model already exists
		if (settingsState.settingsOfProvider[providerName].models.find(m => m.modelName === modelName)) {
			setErrorString(t.modelAlreadyExists())
			return
		}

		// Build overrides - only include values that have been explicitly set (not UNSET_MARKER)
		let overrides: Partial<ModelOverrides> = {}

		// Basic config - only add if set
		if (!isUnset(contextWindow)) {
			overrides.contextWindow = contextWindow as number
		}
		if (!isUnset(reservedOutputTokenSpace)) {
			overrides.reservedOutputTokenSpace = reservedOutputTokenSpace as number
		}
		if (!isUnset(specialToolFormat) && specialToolFormat !== 'none') {
			overrides.specialToolFormat = specialToolFormat as 'openai-style' | 'anthropic-style'
		}
		if (!isUnset(supportsVision)) {
			overrides.supportsVision = supportsVision as boolean
		}

		// Advanced config - only when shown and set
		if (showAdvanced) {
			if (!isUnset(supportsSystemMessage)) {
				overrides.supportsSystemMessage = supportsSystemMessage === 'false' ? false : supportsSystemMessage as 'system-role' | 'developer-role' | 'separated'
			}
			if (!isUnset(supportsFIM)) {
				overrides.supportsFIM = supportsFIM as boolean
			}
			if (!isUnset(supportsReasoning)) {
				if (supportsReasoning) {
					overrides.reasoningCapabilities = {
						supportsReasoning: true,
						canTurnOffReasoning: !isUnset(canTurnOffReasoning) ? (canTurnOffReasoning as boolean) : false,
						canIOReasoning: !isUnset(canIOReasoning) ? (canIOReasoning as boolean) : false,
					}
				} else {
					overrides.reasoningCapabilities = false
				}
			}
		}

		// Add model
		settingsStateService.addModel(providerName, modelName)
		// Only save overrides if there are any set values
		if (Object.keys(overrides).length > 0) {
			await settingsStateService.setOverridesOfModel(providerName, modelName, overrides)
		}
		onClose()
	}

	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999999]"
		>
			<div
				className="bg-void-bg-1 rounded-lg p-6 max-w-lg w-full shadow-xl overflow-y-auto max-h-[90vh] border border-void-border-2"
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-2xl font-light text-void-fg-1">{t.addModelDialogTitle()}</h3>
					<button onClick={onClose} className="text-void-fg-3 hover:text-void-fg-1 transition-colors">
						<X className="size-5" />
					</button>
				</div>

				{/* Description */}
				<div className="text-sm text-void-fg-3 mb-4 opacity-80">{t.addModelDialogDesc()}</div>

				{/* Provider Selection */}
				<div className="mb-4 flex items-center gap-3">
					<label className="text-sm font-medium min-w-[100px] text-void-fg-3">{t.providerName()}</label>
					<ErrorBoundary>
						<VoidCustomDropdownBox
							options={sortedProvidersToShow}
							selectedOption={providerName}
							onChangeOption={(pn) => setProviderName(pn)}
							getOptionDisplayName={(pn) => pn ? displayInfoOfProviderName(pn).title : t.providerName()}
							getOptionDropdownName={(pn) => pn ? displayInfoOfProviderName(pn).title : t.providerName()}
							getOptionDropdownDetail={(pn) => pn ? getDetailForProvider(pn) : ''}
							getOptionsEqual={(a, b) => a === b}
							className="flex-1 resize-none bg-void-bg-1 text-void-fg-1 placeholder:text-void-fg-3 border border-void-border-2 focus:border-void-border-1 py-2 px-3 rounded"
							arrowTouchesText={false}
							zIndex={99999999}
						/>
					</ErrorBoundary>
				</div>

				{/* Model Name */}
				<div className="mb-4 flex items-center gap-3">
					<label className="text-sm font-medium min-w-[100px] text-void-fg-3">{t.modelName()}</label>
					<ErrorBoundary>
						<VoidSimpleInputBox
							value={modelName}
							onChangeValue={setModelName}
							placeholder={t.modelName()}
							className='flex-1'
						/>
					</ErrorBoundary>
				</div>

				{/* Basic Configuration - moved out of advanced */}
				<div className="border border-void-border-2 rounded-md p-4 mb-4 space-y-4 bg-void-bg-2/30">
					<div className="text-sm font-medium text-void-fg-2 mb-2">{t.basicConfig()}</div>

					{/* Context Window */}
					<div className="flex items-center gap-3">
						<label className="text-sm min-w-[100px] text-void-fg-3">{t.contextWindow()}</label>
						<ErrorBoundary>
							<VoidSimpleInputBox
								value={isUnset(contextWindow) ? '' : contextWindow.toString()}
								onChangeValue={(v) => {
									if (v === '') {
										setContextWindow(UNSET_MARKER)
									} else {
										const parsed = parseInt(v)
										if (!isNaN(parsed)) {
											setContextWindow(parsed)
										}
									}
								}}
								placeholder={`${defaultModelConfigDisplay.contextWindow} (${t.systemDefault()})`}
								className='flex-1'
							/>
						</ErrorBoundary>
					</div>

					{/* Reserved Output Tokens */}
					<div className="flex items-center gap-3">
						<label className="text-sm min-w-[100px] text-void-fg-3">{t.reservedOutputTokens()}</label>
						<ErrorBoundary>
							<VoidSimpleInputBox
								value={isUnset(reservedOutputTokenSpace) ? '' : reservedOutputTokenSpace.toString()}
								onChangeValue={(v) => {
									if (v === '') {
										setReservedOutputTokenSpace(UNSET_MARKER)
									} else {
										const parsed = parseInt(v)
										if (!isNaN(parsed)) {
											setReservedOutputTokenSpace(parsed)
										}
									}
								}}
								placeholder={`${defaultModelConfigDisplay.reservedOutputTokenSpace} (${t.systemDefault()})`}
								className='flex-1'
							/>
						</ErrorBoundary>
					</div>

					{/* Special Tool Format */}
					<div className="flex items-center gap-3">
						<label className="text-sm min-w-[100px] text-void-fg-3">{t.specialToolFormat()}</label>
						<ErrorBoundary>
							<VoidCustomDropdownBox
								options={['none', 'openai-style', 'anthropic-style'] as const}
								selectedOption={(isUnset(specialToolFormat) ? 'none' : specialToolFormat) as 'none' | 'openai-style' | 'anthropic-style'}
								onChangeOption={(v) => setSpecialToolFormat(v)}
								getOptionDisplayName={(v) => v === 'none' ? t.specialToolFormatNone() : v}
								getOptionDropdownName={(v) => v === 'none' ? t.specialToolFormatNone() : v}
								getOptionsEqual={(a, b) => a === b}
								className="flex-1 resize-none bg-void-bg-1 text-void-fg-1 border border-void-border-2 focus:border-void-border-1 py-2 px-3 rounded"
								arrowTouchesText={false}
								zIndex={99999999}
							/>
						</ErrorBoundary>
					</div>

					{/* Supports Vision */}
					<div className="flex items-center gap-3">
						<VoidSwitch size='sm' value={supportsVision === true} onChange={(v) => setSupportsVision(v ? true : UNSET_MARKER)} />
						<span className="text-sm text-void-fg-3">{t.supportsVision()}</span>
						{isUnset(supportsVision) && <span className="text-xs text-void-fg-4">({t.notSet()})</span>}
					</div>
				</div>

				{/* Advanced Config Toggle */}
				<div className="mb-4">
					<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-void-fg-3 hover:text-void-fg-1">
						{showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
						<span className="text-sm">{t.advancedConfig()}</span>
					</button>
					<div className="text-xs text-void-fg-4 mt-1">{t.advancedConfigDesc()}</div>
				</div>

				{/* Advanced Config Fields */}
				{showAdvanced && (
					<div className="border border-void-border-2 rounded-md p-4 mb-4 space-y-4">
						{/* Supports System Message */}
						<div className="flex items-center gap-3">
							<label className="text-sm min-w-[100px] text-void-fg-3">{t.supportsSystemMessage()}</label>
							<ErrorBoundary>
								<VoidCustomDropdownBox
									options={['false', 'system-role', 'developer-role', 'separated'] as const}
									selectedOption={(isUnset(supportsSystemMessage) ? defaultModelConfigDisplay.supportsSystemMessage : supportsSystemMessage) as 'false' | 'system-role' | 'developer-role' | 'separated'}
									onChangeOption={(v) => setSupportsSystemMessage(v)}
									getOptionDisplayName={(v) => v === 'false' ? t.supportsSystemMessageNone() : v}
									getOptionDropdownName={(v) => v === 'false' ? t.supportsSystemMessageNone() : v}
									getOptionsEqual={(a, b) => a === b}
									className="flex-1 resize-none bg-void-bg-1 text-void-fg-1 border border-void-border-2 focus:border-void-border-1 py-2 px-3 rounded"
									arrowTouchesText={false}
									zIndex={99999999}
								/>
							</ErrorBoundary>
						</div>

						{/* Supports FIM */}
						<div className="flex items-center gap-3">
							<VoidSwitch size='sm' value={supportsFIM === true} onChange={(v) => setSupportsFIM(v ? true : UNSET_MARKER)} />
							<span className="text-sm text-void-fg-3">{t.supportsFIM()}</span>
							{isUnset(supportsFIM) && <span className="text-xs text-void-fg-4">({t.notSet()})</span>}
						</div>

						{/* Reasoning Capabilities */}
						<div className="border-t border-void-border-2 pt-4 mt-4">
							<div className="flex items-center gap-3 mb-3">
								<VoidSwitch size='sm' value={supportsReasoning === true} onChange={(v) => setSupportsReasoning(v ? true : UNSET_MARKER)} />
								<span className="text-sm font-medium text-void-fg-3">{t.reasoningCapabilities()}</span>
								{isUnset(supportsReasoning) && <span className="text-xs text-void-fg-4">({t.notSet()})</span>}
							</div>

							{supportsReasoning === true && (
								<div className="pl-6 space-y-3">
									{/* Can Turn Off Reasoning */}
									<div className="flex items-center gap-3">
										<VoidSwitch size='xs' value={canTurnOffReasoning === true} onChange={(v) => setCanTurnOffReasoning(v ? true : UNSET_MARKER)} />
										<span className="text-sm text-void-fg-3">{t.canTurnOffReasoning()}</span>
										{isUnset(canTurnOffReasoning) && <span className="text-xs text-void-fg-4">({t.notSet()})</span>}
									</div>

									{/* Can IO Reasoning */}
									<div className="flex items-center gap-3">
										<VoidSwitch size='xs' value={canIOReasoning === true} onChange={(v) => setCanIOReasoning(v ? true : UNSET_MARKER)} />
										<span className="text-sm text-void-fg-3">{t.canIOReasoning()}</span>
										{isUnset(canIOReasoning) && <span className="text-xs text-void-fg-4">({t.notSet()})</span>}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Error Message */}
				{errorString && <div className="text-amber-400 mb-4 text-sm opacity-80">{errorString}</div>}

				{/* Footer */}
				<div className="flex justify-end gap-3 mt-6">
					<button
						onClick={onClose}
						className="px-6 py-2 rounded text-void-fg-3 opacity-80 hover:opacity-100 transition-all"
					>
						{t.cancel()}
					</button>
					<button
						onClick={handleAddModel}
						className={`px-6 py-2 rounded transition-all ${
							!modelName || !providerName
								? 'bg-zinc-100/40 cursor-not-allowed text-black/40'
								: 'bg-zinc-100 hover:bg-zinc-100/80 text-black'
						}`}
						disabled={!modelName || !providerName}
					>
						{t.addAModel()}
					</button>
				</div>
			</div>
		</div>
	)
}

// ---------------- Simplified Model Settings Dialog ------------------

// keys of ModelOverrides we allow the user to override



// This new dialog replaces the verbose UI with a single JSON override box.
const SimpleModelSettingsDialog = ({
	isOpen,
	onClose,
	modelInfo,
}: {
	isOpen: boolean;
	onClose: () => void;
	modelInfo: { modelName: string; providerName: ProviderName; type: 'autodetected' | 'custom' | 'default' } | null;
}) => {
	const t = useVoidChatI18n();
	if (!isOpen || !modelInfo) return null;

	const { modelName, providerName, type } = modelInfo;
	const accessor = useAccessor()
	const settingsState = useSettingsState()
	const mouseDownInsideModal = useRef(false); // Ref to track mousedown origin
	const settingsStateService = accessor.get('IVoidSettingsService')

	// current overrides and defaults
	const defaultModelCapabilities = getModelCapabilities(providerName, modelName, undefined);
	const currentOverrides = settingsState.overridesOfModel?.[providerName]?.[modelName] ?? undefined;
	const { recognizedModelName, isUnrecognizedModel } = defaultModelCapabilities

	// Create the placeholder with the default values for allowed keys
	const partialDefaults: Partial<ModelOverrides> = {};
	for (const k of modelOverrideKeys) { if (defaultModelCapabilities[k]) partialDefaults[k] = defaultModelCapabilities[k] as any; }
	const placeholder = JSON.stringify(partialDefaults, null, 2);

	const [overrideEnabled, setOverrideEnabled] = useState<boolean>(() => !!currentOverrides);

	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

	// reset when dialog toggles
	useEffect(() => {
		if (!isOpen) return;
		const cur = settingsState.overridesOfModel?.[providerName]?.[modelName];
		setOverrideEnabled(!!cur);
		setErrorMsg(null);
	}, [isOpen, providerName, modelName, settingsState.overridesOfModel, placeholder]);

	const onSave = async () => {
		// if disabled override, reset overrides
		if (!overrideEnabled) {
			await settingsStateService.setOverridesOfModel(providerName, modelName, undefined);
			onClose();
			return;
		}

		// enabled overrides
		// parse json
		let parsedInput: Record<string, unknown>

		if (textAreaRef.current?.value) {
			try {
				parsedInput = JSON.parse(textAreaRef.current.value);
			} catch (e) {
				setErrorMsg('Invalid JSON');
				return;
			}
		} else {
			setErrorMsg('Invalid JSON');
			return;
		}

		// only keep allowed keys
		const cleaned: Partial<ModelOverrides> = {};
		for (const k of modelOverrideKeys) {
			if (!(k in parsedInput)) continue
			const isEmpty = parsedInput[k] === '' || parsedInput[k] === null || parsedInput[k] === undefined;
			if (!isEmpty) {
				cleaned[k] = parsedInput[k] as any;
			}
		}
		await settingsStateService.setOverridesOfModel(providerName, modelName, cleaned);
		onClose();
	};

	const sourcecodeOverridesLink = `https://github.com/coderchatwang/CoderChat/blob/f1beb3fe70eccdcaff9f75b0c64c83d904f787d1/src/vs/workbench/contrib/void/common/modelCapabilities.ts#L210-L254`

	return (
		<div // Backdrop
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999999]"
			onMouseDown={() => {
				mouseDownInsideModal.current = false;
			}}
			onMouseUp={() => {
				if (!mouseDownInsideModal.current) {
					onClose();
				}
				mouseDownInsideModal.current = false;
			}}
		>
			{/* MODAL */}
			<div
				className="bg-void-bg-1 rounded-md p-4 max-w-xl w-full shadow-xl overflow-y-auto max-h-[90vh]"
				onClick={(e) => e.stopPropagation()} // Keep stopping propagation for normal clicks inside
				onMouseDown={(e) => {
					mouseDownInsideModal.current = true;
					e.stopPropagation();
				}}
			>
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-medium">
						Change Defaults for {modelName} ({displayInfoOfProviderName(providerName).title})
					</h3>
					<button
						onClick={onClose}
						className="text-void-fg-3 hover:text-void-fg-1"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Display model recognition status */}
				<div className="text-sm text-void-fg-3 mb-4">
					{type === 'default' ? `${modelName} comes packaged with CoderChat, so you shouldn't need to change these settings.`
						: isUnrecognizedModel
							? `Model not recognized by CoderChat.`
							: `CoderChat recognizes ${modelName} ("${recognizedModelName}").`}
				</div>


				{/* override toggle */}
				<div className="flex items-center gap-2 mb-4">
					<VoidSwitch size='xs' value={overrideEnabled} onChange={setOverrideEnabled} />
					<span className="text-void-fg-3 text-sm">{t.overrideModelDefaults()}</span>
				</div>

				{/* Informational link */}
				{overrideEnabled && <div className="text-sm text-void-fg-3 mb-4">
					<ChatMarkdownRender string={`See the [sourcecode](${sourcecodeOverridesLink}) for a reference on how to set this JSON (advanced).`} chatMessageLocation={undefined} />
				</div>}

				<textarea
					key={overrideEnabled + ''}
					ref={textAreaRef}
					className={`w-full min-h-[200px] p-2 rounded-sm border border-void-border-2 bg-void-bg-2 resize-none font-mono text-sm ${!overrideEnabled ? 'text-void-fg-3' : ''}`}
					defaultValue={overrideEnabled && currentOverrides ? JSON.stringify(currentOverrides, null, 2) : placeholder}
					placeholder={placeholder}
					readOnly={!overrideEnabled}
				/>
				{errorMsg && (
					<div className="text-red-500 mt-2 text-sm">{errorMsg}</div>
				)}


				<div className="flex justify-end gap-2 mt-4">
					<VoidButtonBgDarken onClick={onClose} className="px-3 py-1">
						{t.cancel()}
					</VoidButtonBgDarken>
					<VoidButtonBgDarken
						onClick={onSave}
						className="px-3 py-1 bg-[#0e70c0] text-white"
					>
						{t.save()}
					</VoidButtonBgDarken>
				</div>
			</div>
		</div>
	);
}




// ---------------- Edit Model Dialog (Graphical) ------------------

const EditModelDialog = ({
	isOpen,
	onClose,
	modelInfo,
}: {
	isOpen: boolean
	onClose: () => void
	modelInfo: { modelName: string; providerName: ProviderName; type: 'autodetected' | 'custom' | 'default' } | null
}) => {
	const t = useVoidChatI18n()
	const accessor = useAccessor()
	const settingsStateService = accessor.get('IVoidSettingsService')
	const settingsState = useSettingsState()
	const mouseDownInsideModal = useRef(false)

	// Get model info with safe defaults (hooks must be called before any early return)
	const modelName = modelInfo?.modelName ?? ''
	const providerName = modelInfo?.providerName
	const type = modelInfo?.type ?? 'default'

	// Get current overrides and default capabilities (only if providerName exists)
	const defaultModelCapabilities = providerName ? getModelCapabilities(providerName, modelName, undefined) : null
	const currentOverrides = providerName ? settingsState.overridesOfModel?.[providerName]?.[modelName] ?? undefined : undefined
	const { recognizedModelName, isUnrecognizedModel } = defaultModelCapabilities ?? { recognizedModelName: '', isUnrecognizedModel: false }

	// State for config fields - initialize with current overrides or defaults
	const [contextWindow, setContextWindow] = useState<number | null>(() =>
		currentOverrides?.contextWindow ?? defaultModelCapabilities?.contextWindow ?? null
	)
	const [reservedOutputTokenSpace, setReservedOutputTokenSpace] = useState<number | null>(() =>
		currentOverrides?.reservedOutputTokenSpace ?? defaultModelCapabilities?.reservedOutputTokenSpace ?? null
	)
	const [specialToolFormat, setSpecialToolFormat] = useState<'none' | 'openai-style' | 'anthropic-style'>(() =>
		(currentOverrides?.specialToolFormat ?? defaultModelCapabilities?.specialToolFormat ?? 'none') as 'none' | 'openai-style' | 'anthropic-style'
	)
	const [supportsVision, setSupportsVision] = useState<boolean>(() =>
		currentOverrides?.supportsVision ?? defaultModelCapabilities?.supportsVision ?? false
	)
	const [supportsFIM, setSupportsFIM] = useState<boolean>(() =>
		currentOverrides?.supportsFIM ?? defaultModelCapabilities?.supportsFIM ?? false
	)
	const [supportsSystemMessage, setSupportsSystemMessage] = useState<'false' | 'system-role' | 'developer-role' | 'separated'>(() =>
		(currentOverrides?.supportsSystemMessage ?? defaultModelCapabilities?.supportsSystemMessage ?? 'system-role') as 'false' | 'system-role' | 'developer-role' | 'separated'
	)

	// Reasoning capabilities
	const defaultReasoning = defaultModelCapabilities?.reasoningCapabilities
	const currentReasoning = currentOverrides?.reasoningCapabilities
	const [supportsReasoning, setSupportsReasoning] = useState<boolean>(() =>
		typeof currentReasoning === 'object' ? true : (typeof defaultReasoning === 'object' ? true : false)
	)
	const [canTurnOffReasoning, setCanTurnOffReasoning] = useState<boolean>(() =>
		typeof currentReasoning === 'object' ? currentReasoning.canTurnOffReasoning : (typeof defaultReasoning === 'object' ? defaultReasoning.canTurnOffReasoning : false)
	)
	const [canIOReasoning, setCanIOReasoning] = useState<boolean>(() =>
		typeof currentReasoning === 'object' ? currentReasoning.canIOReasoning : (typeof defaultReasoning === 'object' ? defaultReasoning.canIOReasoning : false)
	)

	const [showAdvanced, setShowAdvanced] = useState(false)
	const [errorString, setErrorString] = useState('')

	// Reset when dialog opens with current values
	useEffect(() => {
		if (isOpen && modelInfo && modelInfo.providerName) {
			const overrides = settingsState.overridesOfModel?.[modelInfo.providerName]?.[modelInfo.modelName] ?? undefined
			const defaults = getModelCapabilities(modelInfo.providerName, modelInfo.modelName, undefined)

			setContextWindow(overrides?.contextWindow ?? defaults.contextWindow ?? null)
			setReservedOutputTokenSpace(overrides?.reservedOutputTokenSpace ?? defaults.reservedOutputTokenSpace ?? null)
			setSpecialToolFormat((overrides?.specialToolFormat ?? defaults.specialToolFormat ?? 'none') as 'none' | 'openai-style' | 'anthropic-style')
			setSupportsVision(overrides?.supportsVision ?? defaults.supportsVision ?? false)
			setSupportsFIM(overrides?.supportsFIM ?? defaults.supportsFIM ?? false)
			setSupportsSystemMessage((overrides?.supportsSystemMessage ?? defaults.supportsSystemMessage ?? 'system-role') as 'false' | 'system-role' | 'developer-role' | 'separated')

			const reasoning = overrides?.reasoningCapabilities ?? defaults.reasoningCapabilities
			setSupportsReasoning(typeof reasoning === 'object' ? true : false)
			setCanTurnOffReasoning(typeof reasoning === 'object' ? reasoning.canTurnOffReasoning : false)
			setCanIOReasoning(typeof reasoning === 'object' ? reasoning.canIOReasoning : false)

			setShowAdvanced(false)
			setErrorString('')
		}
	}, [isOpen, modelInfo, settingsState.overridesOfModel])

	// Early return after all hooks are called
	if (!isOpen || !modelInfo || !providerName || !defaultModelCapabilities) return null

	const handleSave = async () => {
		const overrides: Partial<ModelOverrides> = {}

		// Always set all values - this ensures old overrides are properly replaced
		// Only include non-null values
		if (contextWindow !== null) {
			overrides.contextWindow = contextWindow
		}
		if (reservedOutputTokenSpace !== null) {
			overrides.reservedOutputTokenSpace = reservedOutputTokenSpace
		}
		// Always set specialToolFormat, even if 'none'
		overrides.specialToolFormat = specialToolFormat === 'none' ? undefined : specialToolFormat
		overrides.supportsVision = supportsVision
		overrides.supportsFIM = supportsFIM
		overrides.supportsSystemMessage = supportsSystemMessage === 'false' ? false : supportsSystemMessage

		// Reasoning capabilities
		if (supportsReasoning) {
			overrides.reasoningCapabilities = {
				supportsReasoning: true,
				canTurnOffReasoning,
				canIOReasoning,
			}
		} else {
			overrides.reasoningCapabilities = false
		}

		// Save overrides - pass undefined if no meaningful overrides to clear any existing ones
		const hasOverrides = Object.keys(overrides).some(key => {
			const val = overrides[key as keyof typeof overrides]
			return val !== undefined && val !== null
		})

		await settingsStateService.setOverridesOfModel(providerName, modelName, hasOverrides ? overrides : undefined)
		onClose()
	}

	const handleReset = async () => {
		await settingsStateService.setOverridesOfModel(providerName, modelName, undefined)
		onClose()
	}

	// Check if any dropdown is currently open
	const isDropdownOpen = () => {
		const dropdowns = document.querySelectorAll('[data-void-dropdown-open="true"]')
		return dropdowns.length > 0
	}

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999999]"
			onMouseDown={() => { mouseDownInsideModal.current = false }}
			onMouseUp={() => {
				if (isDropdownOpen()) {
					return
				}
				if (!mouseDownInsideModal.current) {
					onClose()
				}
				mouseDownInsideModal.current = false
			}}
		>
			<div
				className="bg-void-bg-1 rounded-lg p-6 max-w-lg w-full shadow-xl overflow-y-auto max-h-[90vh] border border-void-border-2"
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => {
					mouseDownInsideModal.current = true
					e.stopPropagation()
				}}
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-2xl font-light text-void-fg-1">{t.editModelDialogTitle()}</h3>
					<button onClick={onClose} className="text-void-fg-3 hover:text-void-fg-1 transition-colors">
						<X className="size-5" />
					</button>
				</div>

				{/* Model Info */}
				<div className="text-sm text-void-fg-3 mb-4 opacity-80">
					<span className="font-medium">{displayInfoOfProviderName(providerName).title}</span> / {modelName}
					{isUnrecognizedModel && <span className="ml-2 text-amber-500">({t.unrecognizedModel()})</span>}
				</div>

				{/* Description */}
				<div className="text-sm text-void-fg-3 mb-4 opacity-80">{t.editModelDialogDesc()}</div>

				{/* Basic Configuration */}
				<div className="border border-void-border-2 rounded-md p-4 mb-4 space-y-4 bg-void-bg-2/30">
					<div className="text-sm font-medium text-void-fg-2 mb-2">{t.basicConfig()}</div>

					{/* Context Window */}
					<div className="flex items-center gap-3">
						<label className="text-sm min-w-[100px] text-void-fg-3">{t.contextWindow()}</label>
						<ErrorBoundary>
							<VoidSimpleInputBox
								value={contextWindow?.toString() ?? ''}
								onChangeValue={(v) => {
									if (v === '') {
										setContextWindow(null)
									} else {
										const parsed = parseInt(v)
										if (!isNaN(parsed)) {
											setContextWindow(parsed)
										}
									}
								}}
								placeholder={`${defaultModelCapabilities.contextWindow ?? 128000}`}
								className='flex-1'
							/>
						</ErrorBoundary>
					</div>

					{/* Reserved Output Tokens */}
					<div className="flex items-center gap-3">
						<label className="text-sm min-w-[100px] text-void-fg-3">{t.reservedOutputTokens()}</label>
						<ErrorBoundary>
							<VoidSimpleInputBox
								value={reservedOutputTokenSpace?.toString() ?? ''}
								onChangeValue={(v) => {
									if (v === '') {
										setReservedOutputTokenSpace(null)
									} else {
										const parsed = parseInt(v)
										if (!isNaN(parsed)) {
											setReservedOutputTokenSpace(parsed)
										}
									}
								}}
								placeholder={`${defaultModelCapabilities.reservedOutputTokenSpace ?? 4096}`}
								className='flex-1'
							/>
						</ErrorBoundary>
					</div>

					{/* Special Tool Format */}
					<div className="flex items-center gap-3">
						<label className="text-sm min-w-[100px] text-void-fg-3">{t.specialToolFormat()}</label>
						<ErrorBoundary>
							<VoidCustomDropdownBox
								options={['none', 'openai-style', 'anthropic-style'] as const}
								selectedOption={specialToolFormat}
								onChangeOption={(v) => setSpecialToolFormat(v)}
								getOptionDisplayName={(v) => v === 'none' ? t.specialToolFormatNone() : v}
								getOptionDropdownName={(v) => v === 'none' ? t.specialToolFormatNone() : v}
								getOptionsEqual={(a, b) => a === b}
								className="flex-1 resize-none bg-void-bg-1 text-void-fg-1 border border-void-border-2 focus:border-void-border-1 py-2 px-3 rounded"
								arrowTouchesText={false}
								zIndex={99999999}
							/>
						</ErrorBoundary>
					</div>

					{/* Supports Vision */}
					<div className="flex items-center gap-3">
						<VoidSwitch size='sm' value={supportsVision} onChange={setSupportsVision} />
						<span className="text-sm text-void-fg-3">{t.supportsVision()}</span>
					</div>
				</div>

				{/* Advanced Config Toggle */}
				<div className="mb-4">
					<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-void-fg-3 hover:text-void-fg-1">
						{showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
						<span className="text-sm">{t.advancedConfig()}</span>
					</button>
					<div className="text-xs text-void-fg-4 mt-1">{t.advancedConfigDesc()}</div>
				</div>

				{/* Advanced Config Fields */}
				{showAdvanced && (
					<div className="border border-void-border-2 rounded-md p-4 mb-4 space-y-4">
						{/* Supports System Message */}
						<div className="flex items-center gap-3">
							<label className="text-sm min-w-[100px] text-void-fg-3">{t.supportsSystemMessage()}</label>
							<ErrorBoundary>
								<VoidCustomDropdownBox
									options={['false', 'system-role', 'developer-role', 'separated'] as const}
									selectedOption={supportsSystemMessage}
									onChangeOption={(v) => setSupportsSystemMessage(v)}
									getOptionDisplayName={(v) => v === 'false' ? t.supportsSystemMessageNone() : v}
									getOptionDropdownName={(v) => v === 'false' ? t.supportsSystemMessageNone() : v}
									getOptionsEqual={(a, b) => a === b}
									className="flex-1 resize-none bg-void-bg-1 text-void-fg-1 border border-void-border-2 focus:border-void-border-1 py-2 px-3 rounded"
									arrowTouchesText={false}
									zIndex={99999999}
								/>
							</ErrorBoundary>
						</div>

						{/* Supports FIM */}
						<div className="flex items-center gap-3">
							<VoidSwitch size='sm' value={supportsFIM} onChange={setSupportsFIM} />
							<span className="text-sm text-void-fg-3">{t.supportsFIM()}</span>
						</div>

						{/* Reasoning Capabilities */}
						<div className="border-t border-void-border-2 pt-4 mt-4">
							<div className="flex items-center gap-3 mb-3">
								<VoidSwitch size='sm' value={supportsReasoning} onChange={setSupportsReasoning} />
								<span className="text-sm font-medium text-void-fg-3">{t.reasoningCapabilities()}</span>
							</div>

							{supportsReasoning && (
								<div className="pl-6 space-y-3">
									{/* Can Turn Off Reasoning */}
									<div className="flex items-center gap-3">
										<VoidSwitch size='xs' value={canTurnOffReasoning} onChange={setCanTurnOffReasoning} />
										<span className="text-sm text-void-fg-3">{t.canTurnOffReasoning()}</span>
									</div>

									{/* Can IO Reasoning */}
									<div className="flex items-center gap-3">
										<VoidSwitch size='xs' value={canIOReasoning} onChange={setCanIOReasoning} />
										<span className="text-sm text-void-fg-3">{t.canIOReasoning()}</span>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Error Message */}
				{errorString && <div className="text-amber-400 mb-4 text-sm opacity-80">{errorString}</div>}

				{/* Footer */}
				<div className="flex justify-between gap-3 mt-6">
					<button
						onClick={handleReset}
						className="px-4 py-2 rounded text-void-fg-3 opacity-80 hover:opacity-100 transition-all border border-void-border-2 hover:border-void-border-1"
					>
						{t.resetToDefaults()}
					</button>
					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="px-6 py-2 rounded text-void-fg-3 opacity-80 hover:opacity-100 transition-all"
						>
							{t.cancel()}
						</button>
						<button
							onClick={handleSave}
							className="px-6 py-2 rounded bg-[#0e70c0] hover:bg-[#1177cb] text-white transition-all"
						>
							{t.save()}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}


// Helper function to extract domain from URL
const extractDomainForSettings = (url: string): string => {
	try {
		const parsed = new URL(url)
		return parsed.hostname
	} catch {
		// If URL parsing fails, try to extract domain manually
		const match = url.match(/^(?:https?:\/\/)?([^\/:?]+)/)
		return match ? match[1] : url
	}
}

export const ModelDump = ({ filteredProviders }: { filteredProviders?: ProviderName[] }) => {
	const t = useVoidChatI18n();
	const accessor = useAccessor()
	const settingsStateService = accessor.get('IVoidSettingsService')
	const settingsState = useSettingsState()

	// Helper function to get display detail for a provider (for OpenAI Compatible series)
	const getDetailForProvider = useCallback((providerName: ProviderName): string => {
		// Check if provider name contains "openAICompatible"
		if (providerName.toLowerCase().includes('openaicompatible')) {
			const endpoint = settingsState.settingsOfProvider[providerName]?.endpoint
			if (endpoint) {
				const domain = extractDomainForSettings(endpoint)
				return `(${domain})`
			}
		}
		return ''
	}, [settingsState.settingsOfProvider])

	// State to track which model's settings dialog is open
	const [openSettingsModel, setOpenSettingsModel] = useState<{
		modelName: string,
		providerName: ProviderName,
		type: 'autodetected' | 'custom' | 'default'
	} | null>(null);

	// State for Add Model Dialog
	const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false)

	// State for Edit Model Dialog
	const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false)
	const [editModelInfo, setEditModelInfo] = useState<{
		modelName: string,
		providerName: ProviderName,
		type: 'autodetected' | 'custom' | 'default'
	} | null>(null)

	// a dump of all the enabled providers' models
	const modelDump: (VoidStatefulModelInfo & { providerName: ProviderName, providerEnabled: boolean })[] = []

	// Use either filtered providers or all providers
	const providersToShow = filteredProviders || providerNames;

	for (let providerName of providersToShow) {
		const providerSettings = settingsState.settingsOfProvider[providerName]
		// if (!providerSettings.enabled) continue
		modelDump.push(...providerSettings.models.map(model => ({ ...model, providerName, providerEnabled: !!providerSettings._didFillInProviderSettings })))
	}

	// sort by hidden
	modelDump.sort((a, b) => {
		return Number(b.providerEnabled) - Number(a.providerEnabled)
	})

	return <div className=''>
		{/* Header row with title and add model entry */}
		<div className='flex items-center justify-between mb-4'>
			<h2 className={`text-3xl`}>{t.models()}</h2>
			{/* Add Model Button - opens dialog */}
			<div
				className="text-void-fg-4 flex flex-nowrap text-nowrap items-center hover:brightness-110 cursor-pointer"
				onClick={() => setIsAddModelDialogOpen(true)}
			>
				<div className="flex items-center gap-1">
					<Plus size={16} />
					<span>{t.addAModel()}</span>
				</div>
			</div>
		</div>

		{modelDump.map((m, i) => {
			const { isHidden, type, modelName, providerName, providerEnabled } = m

			const isNewProviderName = (i > 0 ? modelDump[i - 1] : undefined)?.providerName !== providerName

			const providerTitle = displayInfoOfProviderName(providerName).title

			const disabled = !providerEnabled
			const value = disabled ? false : !isHidden

			const tooltipName = (
				disabled ? t.addToEnable(providerTitle)
					: value === true ? t.showInDropdown()
						: t.hideFromDropdown()
			)


			const detailAboutModel = type === 'autodetected' ?
				<Asterisk size={14} className="inline-block align-text-top brightness-115 stroke-[2] text-[#0e70c0]" data-tooltip-id='void-tooltip' data-tooltip-place='right' data-tooltip-content={t.detectedLocally()} />
				: type === 'custom' ?
					<Asterisk size={14} className="inline-block align-text-top brightness-115 stroke-[2] text-[#0e70c0]" data-tooltip-id='void-tooltip' data-tooltip-place='right' data-tooltip-content={t.customModel()} />
					: undefined

			const hasOverrides = !!settingsState.overridesOfModel?.[providerName]?.[modelName]

			return <div key={`${modelName}${providerName}`}
				className={`flex items-center justify-between gap-4 hover:bg-black/10 dark:hover:bg-gray-300/10 py-1 px-3 rounded-sm overflow-hidden cursor-default truncate group
				`}
			>
				{/* left part is width:full */}
				<div className={`flex flex-grow items-center gap-4`}>
					<span className='w-full max-w-32'>{isNewProviderName ? providerTitle : ''}</span>
					<span className='w-fit max-w-[400px] truncate'>{modelName}</span>
				</div>

				{/* right part is anything that fits */}
				<div className="flex items-center gap-2 w-fit">

					{/* Edit Model button (graphical dialog). Hide entirely when provider/model disabled. */}
					{disabled ? null : (
						<div className="w-5 flex items-center justify-center">
							<button
								onClick={() => {
									setEditModelInfo({ modelName, providerName, type })
									setIsEditModelDialogOpen(true)
								}}
								data-tooltip-id='void-tooltip'
								data-tooltip-place='right'
								data-tooltip-content={t.editModel()}
								className={`${hasOverrides ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
							>
							<SettingsIcon size={14} className="text-void-fg-3 opacity-70 hover:opacity-100" />
							</button>
						</div>
					)}

					{/* Advanced Settings button (JSON). Hide entirely when provider/model disabled. */}
					{disabled ? null : (
						<div className="w-5 flex items-center justify-center">
							<button
								onClick={() => { setOpenSettingsModel({ modelName, providerName, type }) }}
								data-tooltip-id='void-tooltip'
								data-tooltip-place='right'
								data-tooltip-content={t.advancedSettings()}
								className={`${hasOverrides ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
							>
								<Plus size={12} className="text-void-fg-3 opacity-50" />
							</button>
						</div>
					)}

					{/* Blue star */}
					{detailAboutModel}


					{/* Switch */}
					<VoidSwitch
						value={value}
						onChange={() => { settingsStateService.toggleModelHidden(providerName, modelName); }}
						disabled={disabled}
						size='sm'

						data-tooltip-id='void-tooltip'
						data-tooltip-place='right'
						data-tooltip-content={tooltipName}
					/>

					{/* X button */}
					<div className={`w-5 flex items-center justify-center`}>
						{type === 'default' || type === 'autodetected' ? null : <button
							onClick={() => { settingsStateService.deleteModel(providerName, modelName); }}
							data-tooltip-id='void-tooltip'
							data-tooltip-place='right'
							data-tooltip-content={t.delete()}
							className={`${hasOverrides ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
						>
							<X size={12} className="text-void-fg-3 opacity-50" />
						</button>}
					</div>
				</div>
			</div>
		})}

		{/* Add Model Section - bottom entry */}
		<div
			className="text-void-fg-4 flex flex-nowrap text-nowrap items-center hover:brightness-110 cursor-pointer mt-4"
			onClick={() => setIsAddModelDialogOpen(true)}
		>
			<div className="flex items-center gap-1">
				<Plus size={16} />
				<span>{t.addAModel()}</span>
			</div>
		</div>

		{/* Model Settings Dialog */}
		<SimpleModelSettingsDialog
			isOpen={openSettingsModel !== null}
			onClose={() => setOpenSettingsModel(null)}
			modelInfo={openSettingsModel}
		/>

		{/* Add Model Dialog */}
		<AddModelDialog
			isOpen={isAddModelDialogOpen}
			onClose={() => setIsAddModelDialogOpen(false)}
			providersToShow={providersToShow}
			getDetailForProvider={getDetailForProvider}
		/>

		{/* Edit Model Dialog */}
		<EditModelDialog
			isOpen={isEditModelDialogOpen}
			onClose={() => setIsEditModelDialogOpen(false)}
			modelInfo={editModelInfo}
		/>
	</div>
}



// providers

const ProviderSetting = ({ providerName, settingName, subTextMd }: { providerName: ProviderName, settingName: SettingName, subTextMd: React.ReactNode }) => {

	const { title: settingTitle, placeholder, isPasswordField } = displayInfoOfSettingName(providerName, settingName)

	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const settingsState = useSettingsState()

	const settingValue = settingsState.settingsOfProvider[providerName][settingName] as string // this should always be a string in this component
	if (typeof settingValue !== 'string') {
		console.log('Error: Provider setting had a non-string value.')
		return
	}

	// Create a stable callback reference using useCallback with proper dependencies
	const handleChangeValue = useCallback((newVal: string) => {
		voidSettingsService.setSettingOfProvider(providerName, settingName, newVal)
	}, [voidSettingsService, providerName, settingName]);

	// 判断是否是 OpenAI Compatible 系列的 provider（使用 string 类型转换避免 TypeScript 类型检查问题）
	const isOpenAICompatible = (compatibleApiProviderNames as string[]).includes(providerName as string)

	// 为 OpenAI Compatible 系列的 provider 生成 label（带必填标记：* 表示必填）
	const getLabel = (): string | undefined => {
		if (!isOpenAICompatible) return undefined
		if (settingName === 'endpoint') return 'BASE_URL*'  // 必填
		if (settingName === 'apiKey') return 'API_KEY*'        // 必填
		if (settingName === 'headersJSON') return 'HEADERS' // 可选
		return undefined
	}

	return <ErrorBoundary>
		<div className='my-1'>
			<VoidSimpleInputBox
				value={settingValue}
				onChangeValue={handleChangeValue}
				placeholder={`${settingTitle} (${placeholder})`}
				passwordBlur={isPasswordField}
				compact={true}
				label={getLabel()}
			/>
			{!subTextMd ? null : <div className='py-1 px-3 opacity-50 text-sm'>
				{subTextMd}
			</div>}
		</div>
	</ErrorBoundary>
}

// const OldSettingsForProvider = ({ providerName, showProviderTitle }: { providerName: ProviderName, showProviderTitle: boolean }) => {
// 	const voidSettingsState = useSettingsState()

// 	const needsModel = isProviderNameDisabled(providerName, voidSettingsState) === 'addModel'

// 	// const accessor = useAccessor()
// 	// const voidSettingsService = accessor.get('IVoidSettingsService')

// 	// const { enabled } = voidSettingsState.settingsOfProvider[providerName]
// 	const settingNames = customSettingNamesOfProvider(providerName)

// 	const { title: providerTitle } = displayInfoOfProviderName(providerName)

// 	return <div className='my-4'>

// 		<div className='flex items-center w-full gap-4'>
// 			{showProviderTitle && <h3 className='text-xl truncate'>{providerTitle}</h3>}

// 			{/* enable provider switch */}
// 			{/* <VoidSwitch
// 				value={!!enabled}
// 				onChange={
// 					useCallback(() => {
// 						const enabledRef = voidSettingsService.state.settingsOfProvider[providerName].enabled
// 						voidSettingsService.setSettingOfProvider(providerName, 'enabled', !enabledRef)
// 					}, [voidSettingsService, providerName])}
// 				size='sm+'
// 			/> */}
// 		</div>

// 		<div className='px-0'>
// 			{/* settings besides models (e.g. api key) */}
// 			{settingNames.map((settingName, i) => {
// 				return <ProviderSetting key={settingName} providerName={providerName} settingName={settingName} />
// 			})}

// 			{needsModel ?
// 				providerName === 'ollama' ?
// 					<WarningBox text={`Please install an Ollama model. We'll auto-detect it.`} />
// 					: <WarningBox text={`Please add a model for ${providerTitle} (Models section).`} />
// 				: null}
// 		</div>
// 	</div >
// }


export const SettingsForProvider = ({ providerName, showProviderTitle, showProviderSuggestions }: { providerName: ProviderName, showProviderTitle: boolean, showProviderSuggestions: boolean }) => {
	const t = useVoidChatI18n();
	const voidSettingsState = useSettingsState()

	const needsModel = isProviderNameDisabled(providerName, voidSettingsState) === 'addModel'

	// const accessor = useAccessor()
	// const voidSettingsService = accessor.get('IVoidSettingsService')

	// const { enabled } = voidSettingsState.settingsOfProvider[providerName]
	const settingNames = customSettingNamesOfProvider(providerName)

	const { title: providerTitle } = displayInfoOfProviderName(providerName)

	return <div>

		<div className='flex items-center w-full gap-4'>
			{showProviderTitle && <h3 className='text-xl truncate'>{providerTitle}</h3>}

			{/* enable provider switch */}
			{/* <VoidSwitch
				value={!!enabled}
				onChange={
					useCallback(() => {
						const enabledRef = voidSettingsService.state.settingsOfProvider[providerName].enabled
						voidSettingsService.setSettingOfProvider(providerName, 'enabled', !enabledRef)
					}, [voidSettingsService, providerName])}
				size='sm+'
			/> */}
		</div>

		<div className='px-0'>
			{/* settings besides models (e.g. api key) */}
			{settingNames.map((settingName, i) => {

				return <ProviderSetting
					key={settingName}
					providerName={providerName}
					settingName={settingName}
					subTextMd={i !== settingNames.length - 1 ? null
						: <ChatMarkdownRender string={subTextMdOfProviderName(providerName)} chatMessageLocation={undefined} />}
				/>
			})}

			{showProviderSuggestions && needsModel ?
				providerName === 'ollama' ?
					<WarningBox className="pl-2 mb-4" text={`Please install an Ollama model. We'll auto-detect it.`} />
					: <WarningBox className="pl-2 mb-4" text={t.pleaseAddModel(providerTitle)} />
				: null}
		</div>
	</div >
}


export const VoidProviderSettings = ({ providerNames }: { providerNames: ProviderName[] }) => {
	return <>
		{providerNames.map(providerName =>
			<SettingsForProvider key={providerName} providerName={providerName} showProviderTitle={true} showProviderSuggestions={true} />
		)}
	</>
}

// 带折叠功能的 Compatible API Providers 设置组件
// 默认展示前 2 个 provider，其余折叠，点击可展开
export const CollapsibleCompatibleProviders = ({ providerNames }: { providerNames: ProviderName[] }) => {
	const t = useVoidChatI18n();
	const [isExpanded, setIsExpanded] = useState(false);

	// 默认展示前 2 个，折叠其余的
	const visibleCount = 2;
	const visibleProviders = providerNames.slice(0, visibleCount);
	const hiddenProviders = providerNames.slice(visibleCount);
	const hiddenCount = hiddenProviders.length;

	return (
		<div>
			{/* 默认展示的 provider */}
			{visibleProviders.map(providerName =>
				<SettingsForProvider key={providerName} providerName={providerName} showProviderTitle={true} showProviderSuggestions={true} />
			)}

			{/* 折叠的 provider */}
			{hiddenCount > 0 && (
				<div>
					{/* 展开按钮 */}
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex items-center gap-2 text-void-fg-3 hover:text-void-fg-1 cursor-pointer py-2 px-1 my-2 rounded-sm hover:bg-void-bg-2 transition-colors"
					>
						{isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
						<span className="text-sm">
							{isExpanded
								? t.collapseProviders(hiddenCount)
								: t.expandProviders(hiddenCount)}
						</span>
					</button>

					{/* 展开后的内容 */}
					{isExpanded && (
						<div className="pl-2 border-l-2 border-void-border-2 ml-1">
							{hiddenProviders.map(providerName =>
								<SettingsForProvider key={providerName} providerName={providerName} showProviderTitle={true} showProviderSuggestions={true} />
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}


type TabName = 'models' | 'general'
export const AutoDetectLocalModelsToggle = () => {
	const settingName: GlobalSettingName = 'autoRefreshModels'

	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const metricsService = accessor.get('IMetricsService')

	const voidSettingsState = useSettingsState()

	// right now this is just `enabled_autoRefreshModels`
	const enabled = voidSettingsState.globalSettings[settingName]

	return <ButtonLeftTextRightOption
		leftButton={<VoidSwitch
			size='xxs'
			value={enabled}
			onChange={(newVal) => {
				voidSettingsService.setGlobalSetting(settingName, newVal)
				metricsService.capture('Click', { action: 'Autorefresh Toggle', settingName, enabled: newVal })
			}}
		/>}
		text={`Automatically detect local providers and models (${refreshableProviderNames.map(providerName => displayInfoOfProviderName(providerName).title).join(', ')}).`}
	/>


}

export const AIInstructionsBox = () => {
	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidSettingsState = useSettingsState()
	return <VoidInputBox2
		className='min-h-[81px] p-3 rounded-sm'
		initValue={voidSettingsState.globalSettings.aiInstructions}
		placeholder={`Do not change my indentation or delete my comments. When writing TS or JS, do not add ;'s. Write new code using Rust if possible. `}
		multiline
		showBorder
		onChangeText={(newText) => {
			voidSettingsService.setGlobalSetting('aiInstructions', newText)
		}}
	/>
}

const FastApplyMethodDropdown = () => {
	const t = useVoidChatI18n();
	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')

	const options = useMemo(() => [true, false], [])

	const onChangeOption = useCallback((newVal: boolean) => {
		voidSettingsService.setGlobalSetting('enableFastApply', newVal)
	}, [voidSettingsService])

	return <VoidCustomDropdownBox
		className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1'
		options={options}
		selectedOption={voidSettingsService.state.globalSettings.enableFastApply}
		onChangeOption={onChangeOption}
		getOptionDisplayName={(val) => val ? 'Fast Apply' : 'Slow Apply'}
		getOptionDropdownName={(val) => val ? 'Fast Apply' : 'Slow Apply'}
		getOptionDropdownDetail={(val) => val ? t.outputSearchReplace() : t.rewriteWholeFiles()}
		getOptionsEqual={(a, b) => a === b}
	/>

}


export const OllamaSetupInstructions = ({ sayWeAutoDetect }: { sayWeAutoDetect?: boolean }) => {
	return <div className='prose-p:my-0 prose-ol:list-decimal prose-p:py-0 prose-ol:my-0 prose-ol:py-0 prose-span:my-0 prose-span:py-0 text-void-fg-3 text-sm list-decimal select-text'>
		<div className=''><ChatMarkdownRender string={`Ollama Setup Instructions`} chatMessageLocation={undefined} /></div>
		<div className=' pl-6'><ChatMarkdownRender string={`1. Download [Ollama](https://ollama.com/download).`} chatMessageLocation={undefined} /></div>
		<div className=' pl-6'><ChatMarkdownRender string={`2. Open your terminal.`} chatMessageLocation={undefined} /></div>
		<div
			className='pl-6 flex items-center w-fit'
			data-tooltip-id='void-tooltip-ollama-settings'
		>
			<ChatMarkdownRender string={`3. Run \`ollama pull your_model\` to install a model.`} chatMessageLocation={undefined} />
		</div>
		{sayWeAutoDetect && <div className=' pl-6'><ChatMarkdownRender string={`Void automatically detects locally running models and enables them.`} chatMessageLocation={undefined} /></div>}
	</div>
}


const RedoOnboardingButton = ({ className }: { className?: string }) => {
	const t = useVoidChatI18n();
	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	return <div
		className={`text-void-fg-4 flex flex-nowrap text-nowrap items-center hover:brightness-110 cursor-pointer ${className}`}
		onClick={() => { voidSettingsService.setGlobalSetting('isOnboardingComplete', false) }}
	>
		{t.seeOnboardingScreen()}
	</div>

}







export const ToolApprovalTypeSwitch = ({ approvalType, size, desc }: { approvalType: ToolApprovalType, size: "xxs" | "xs" | "sm" | "sm+" | "md", desc: string }) => {
	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidSettingsState = useSettingsState()
	const metricsService = accessor.get('IMetricsService')

	const onToggleAutoApprove = useCallback((approvalType: ToolApprovalType, newValue: boolean) => {
		voidSettingsService.setGlobalSetting('autoApprove', {
			...voidSettingsService.state.globalSettings.autoApprove,
			[approvalType]: newValue
		})
		metricsService.capture('Tool Auto-Accept Toggle', { enabled: newValue })
	}, [voidSettingsService, metricsService])

	return <>
		<VoidSwitch
			size={size}
			value={voidSettingsState.globalSettings.autoApprove[approvalType] ?? false}
			onChange={(newVal) => onToggleAutoApprove(approvalType, newVal)}
		/>
		<span className="text-void-fg-3 text-xs">{desc}</span>
	</>
}



export const OneClickSwitchButton = ({ fromEditor = 'VS Code', className = '' }: { fromEditor?: TransferEditorType, className?: string }) => {
	const t = useVoidChatI18n();
	const accessor = useAccessor()
	const extensionTransferService = accessor.get('IExtensionTransferService')

	const [transferState, setTransferState] = useState<{ type: 'done', error?: string } | { type: | 'loading' | 'justfinished' }>({ type: 'done' })



	const onClick = async () => {
		if (transferState.type !== 'done') return

		setTransferState({ type: 'loading' })

		const errAcc = await extensionTransferService.transferExtensions(os, fromEditor)

		// Even if some files were missing, consider it a success if no actual errors occurred
		const hadError = !!errAcc
		if (hadError) {
			setTransferState({ type: 'done', error: errAcc })
		}
		else {
			setTransferState({ type: 'justfinished' })
			setTimeout(() => { setTransferState({ type: 'done' }); }, 3000)
		}
	}

	return <>
		<VoidButtonBgDarken className={`max-w-48 p-4 ${className}`} disabled={transferState.type !== 'done'} onClick={onClick}>
			{transferState.type === 'done' ? t.transferFrom(fromEditor)
				: transferState.type === 'loading' ? <span className='text-nowrap flex flex-nowrap'>{t.transferring()}<IconLoading /></span>
					: transferState.type === 'justfinished' ? <AnimatedCheckmarkButton text={t.settingsTransferred()} className='bg-none' />
						: null
			}
		</VoidButtonBgDarken>
		{transferState.type === 'done' && transferState.error ? <WarningBox text={transferState.error} /> : null}
	</>
}


// full settings

// MCP Server component
const MCPServerComponent = ({ name, server }: { name: string, server: MCPServer }) => {
	const t = useVoidChatI18n();
	const accessor = useAccessor();
	const mcpService = accessor.get('IMCPService');
	const clipboardService = accessor.get('IClipboardService');

	const voidSettings = useSettingsState()
	const isOn = voidSettings.mcpUserStateOfName[name]?.isOn

	const [commandCopied, setCommandCopied] = useState(false)

	const removeUniquePrefix = (name: string) => name.split('_').slice(1).join('_')

	const handleCopyCommand = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (server.command) {
			await clipboardService.writeText(server.command)
			setCommandCopied(true)
			setTimeout(() => setCommandCopied(false), 2000)
		}
	}

	return (
		<div className="border border-void-border-2 bg-void-bg-1 py-3 px-4 rounded-sm my-2">
			<div className="flex items-center justify-between">
				{/* Left side - status and name */}
				<div className="flex items-center gap-2">
					{/* Status indicator */}
					<div className={`w-2 h-2 rounded-full
						${server.status === 'success' ? 'bg-green-500'
							: server.status === 'error' ? 'bg-red-500'
								: server.status === 'loading' ? 'bg-yellow-500'
									: server.status === 'offline' ? 'bg-void-fg-3'
										: ''}
					`}></div>

					{/* Server name */}
					<div className="text-sm font-medium text-void-fg-1">{name}</div>
				</div>

				{/* Right side - refresh button and power toggle switch */}
				<div className="flex items-center gap-2">
					<button
						onClick={() => mcpService.refreshMCPServer(name)}
						className="p-1.5 hover:bg-void-bg-2 rounded transition-colors"
						title={t.refresh()}
						disabled={server.status === 'loading'}
					>
						<RefreshCw
							size={14}
							className={`text-void-fg-3 hover:text-void-fg-1 ${server.status === 'loading' ? 'animate-spin' : ''}`}
						/>
					</button>
					<VoidSwitch
						value={isOn ?? false}
						size='xs'
						disabled={server.status === 'error'}
						onChange={() => mcpService.toggleServerIsOn(name, !isOn)}
					/>
				</div>
			</div>

			{/* Tools section */}
			{isOn && (
				<div className="mt-3">
					<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
						{(server.tools ?? []).length > 0 ? (
							(server.tools ?? []).map((tool: { name: string; description?: string }) => (
								<span
									key={tool.name}
									className="px-2 py-0.5 bg-void-bg-2 text-void-fg-3 rounded-sm text-xs"

									data-tooltip-id='void-tooltip'
									data-tooltip-content={tool.description || ''}
									data-tooltip-class-name='void-max-w-[300px]'
								>
									{removeUniquePrefix(tool.name)}
								</span>
							))
						) : (
							<span className="text-xs text-void-fg-3">{t.noToolsAvailable()}</span>
						)}
					</div>
				</div>
			)}

			{/* Command badge */}
			{isOn && server.command && (
				<div className="mt-3">
					<div className="text-xs text-void-fg-3 mb-1">{t.command()}</div>
					<div className="flex items-center gap-2">
						<div className="flex-1 px-2 py-1 bg-void-bg-2 text-xs font-mono overflow-x-auto whitespace-nowrap text-void-fg-2 rounded-sm">
							{server.command}
						</div>
						<button
							onClick={handleCopyCommand}
							className="flex-shrink-0 p-1.5 hover:bg-void-bg-2 rounded transition-colors"
							title={t.copyToClipboard()}
						>
							{commandCopied ? (
								<Check size={14} className="text-green-500" />
							) : (
								<Copy size={14} className="text-void-fg-3 hover:text-void-fg-1" />
							)}
						</button>
					</div>
				</div>
			)}

			{/* Error message if present */}
			{server.error && (
				<div className="mt-3">
					<WarningBox text={server.error} multiline />
				</div>
			)}
		</div>
	);
};

// Skill Component
const SkillComponent = ({ name, skill, onEdit, onDelete }: { name: string, skill: { name: string, level: 'project' | 'global', description?: string }, onEdit?: () => void, onDelete?: () => void }) => {
	const t = useVoidChatI18n();
	return (
		<div className="border border-void-border-2 bg-void-bg-1 py-3 px-4 rounded-sm my-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="text-sm font-medium text-void-fg-1">{name}</div>
					<span className="text-xs px-2 py-0.5 bg-void-bg-2 text-void-fg-3 rounded-sm">
						{skill.level === 'project' ? t.skillProject() : t.skillGlobal()}
					</span>
				</div>
				<div className="flex items-center gap-1">
					{onEdit && (
						<button
							onClick={onEdit}
							className="text-void-fg-3 hover:text-blue-500 transition-colors p-1"
							title={t.editSkill()}
						>
							<Pencil size={14} />
						</button>
					)}
					{onDelete && (
						<button
							onClick={onDelete}
							className="text-void-fg-3 hover:text-red-500 transition-colors p-1"
							title={t.delete()}
						>
							<Trash2 size={14} />
						</button>
					)}
				</div>
			</div>
			{skill.description && (
				<div className="mt-2 text-xs text-void-fg-3">{skill.description}</div>
			)}
		</div>
	);
};

// Skills List Component with dropdown menu
const SkillsList = () => {
	const t = useVoidChatI18n();
	const accessor = useAccessor();
	const skillService = accessor.get('ISkillService');
	const skillServiceState = useSkillServiceState();
	const metricsService = accessor.get('IMetricsService');

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [selectedLevel, setSelectedLevel] = useState<'project' | 'global' | null>(null);

	// 点击外部关闭菜单
	useEffect(() => {
		if (!isMenuOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isMenuOpen]);

	// 选择级别后打开文件选择对话框
	useEffect(() => {
		if (selectedLevel) {
			handleFileSelect();
		}
	}, [selectedLevel]);

	const handleFileSelect = async () => {
		if (!selectedLevel) return;

		setIsAdding(true);
		setAddError(null);

		const notificationService = accessor.get('INotificationService');
		const notificationHelper = createNotificationHelper(notificationService);

		try {
			const fileDialogService = accessor.get('IFileDialogService');

			// 弹出文件选择对话框
			const uris = await fileDialogService.showOpenDialog({
				title: t.selectZipFile(),
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: [{ name: 'ZIP', extensions: ['zip'] }]
			});

			if (!uris || uris.length === 0) {
				setIsAdding(false);
				return;
			}

			const filePath = uris[0].fsPath;

			// 调用技能服务添加技能
			const result = await skillService.addSkill(filePath, selectedLevel);

			if (result.success) {
				notificationHelper.info(t.skillAddSuccess().replace('{0}', result.skillName));
				// 记录导入技能事件
				metricsService.capture('Skill Import', {
					skillName: result.skillName,
					location: selectedLevel,
					success: true
				});
			} else {
				notificationHelper.error(t.skillAddFailed().replace('{0}', result.error || 'Unknown error'));
				setAddError(result.error || 'Failed to add skill');
				// 记录导入技能失败事件
				metricsService.capture('Skill Import', {
					location: selectedLevel,
					success: false,
					error: result.error || 'Unknown error'
				});
			}
		} catch (err) {
			notificationHelper.error(t.skillAddFailed().replace('{0}', String(err)));
			setAddError(String(err));
		} finally {
			setIsAdding(false);
			setSelectedLevel(null);
			setIsMenuOpen(false);
		}
	};

	const handleMenuSelect = (level: 'project' | 'global') => {
		setSelectedLevel(level);
	};

	const handleDeleteSkill = async (skillPath: string, location: 'project' | 'global') => {
		const notificationService = accessor.get('INotificationService');
		const notificationHelper = createNotificationHelper(notificationService);

		try {
			const result = await skillService.deleteSkill(skillPath, location);
			if (result.success) {
				notificationHelper.info(t.skillDeleteSuccess());
				// 记录删除技能事件
				metricsService.capture('Skill Delete', {
					location,
					success: true
				});
			} else {
				notificationHelper.error(t.skillDeleteFailed().replace('{0}', result.error || 'Unknown error'));
				// 记录删除技能失败事件
				metricsService.capture('Skill Delete', {
					location,
					success: false,
					error: result.error || 'Unknown error'
				});
			}
		} catch (err) {
			notificationHelper.error(t.skillDeleteFailed().replace('{0}', String(err)));
			// 记录删除技能失败事件
			metricsService.capture('Skill Delete', {
				location,
				success: false,
				error: String(err)
			});
		}
	};

	const skills = skillServiceState.skills;

	return (
		<div className="my-2">
			{addError && (
				<div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
					{addError}
					<button onClick={() => setAddError(null)} className="ml-2 text-red-400 hover:text-red-300">×</button>
				</div>
			)}

			{/* 添加技能按钮 */}
			<div className='my-2 relative w-full max-w-48'>
				<VoidButtonBgDarken 
					className='px-4 py-1 w-full' 
					disabled={isAdding}
					onClick={() => setIsMenuOpen(!isMenuOpen)}
				>
					{isAdding ? '...' : t.addSkill()}
				</VoidButtonBgDarken>

				{/* 下拉菜单 */}
				{isMenuOpen && (
					<div
						ref={menuRef}
						className="absolute left-0 top-full mt-1 bg-void-bg-1 border-void-border-3 border rounded shadow-lg z-50"
					>
						<div className='overflow-auto max-h-80'>
							<div
								className="flex items-center py-1 pl-6 pr-6 cursor-pointer whitespace-nowrap transition-all duration-100 hover:bg-blue-500 hover:text-white/80"
								onClick={() => handleMenuSelect('project')}
							>
								<span>{t.skillProject()}</span>
							</div>
							<div
								className="flex items-center py-1 pl-6 pr-6 cursor-pointer whitespace-nowrap transition-all duration-100 hover:bg-blue-500 hover:text-white/80"
								onClick={() => handleMenuSelect('global')}
							>
								<span>{t.skillGlobal()}</span>
							</div>
						</div>
					</div>
				)}
			</div>

			{skills.length === 0 ? (
				<div className="text-void-fg-3 text-sm mt-2">
					{t.noSkillsAvailable()}
				</div>
			) : (
				skills.map((skill) => (
					<SkillComponent
						key={`${skill.skillPath}-${skill.location}`}
						name={skill.name}
						skill={{ name: skill.name, level: skill.location, description: skill.description }}
						onEdit={() => {
							skillService.openSkillFile(skill.skillPath);
							// 记录编辑技能事件
							metricsService.capture('Skill Edit', {
								skillName: skill.name,
								location: skill.location
							});
						}}
						onDelete={() => handleDeleteSkill(skill.skillPath, skill.location)}
					/>
				))
			)}
		</div>
	);
};

// Main component that renders the list of servers
const MCPServersList = () => {
	const t = useVoidChatI18n();
	const mcpServiceState = useMCPServiceState()

	let content: React.ReactNode
	if (mcpServiceState.error) {
		content = <div className="text-void-fg-3 text-sm mt-2">
			{mcpServiceState.error}
		</div>
	}
	else {
		const entries = Object.entries(mcpServiceState.mcpServerOfName)
		if (entries.length === 0) {
			content = <div className="text-void-fg-3 text-sm mt-2">
				{t.noServersFound()}
			</div>
		}
		else {
			content = entries.map(([name, server]) => (
				<MCPServerComponent key={name} name={name} server={server} />
			))
		}
	}

	return <div className="my-2">{content}</div>
};

export const Settings = () => {
	const t = useVoidChatI18n();
	const isDark = useIsDark()
	// ─── sidebar nav ──────────────────────────
	const [selectedSection, setSelectedSection] =
		useState<Tab>('models');

	const navItems: { tab: Tab; label: string }[] = [
		{ tab: 'models', label: t.models() },
		{ tab: 'compatibleApiProviders', label: t.compatibleApiProviders() },
		{ tab: 'localProviders', label: t.localProviders() },
		{ tab: 'providers', label: t.mainProviders() },
		{ tab: 'featureOptions', label: t.featureOptions() },
		{ tab: 'general', label: t.general() },
		{ tab: 'skills', label: t.skills() },
		{ tab: 'mcp', label: t.mcp() },
		{ tab: 'all', label: t.allSettings() },
	];
	const shouldShowTab = (tab: Tab) => selectedSection === 'all' || selectedSection === tab;
	const accessor = useAccessor()
	const commandService = accessor.get('ICommandService')
	const environmentService = accessor.get('IEnvironmentService')
	const nativeHostService = accessor.get('INativeHostService')
	const settingsState = useSettingsState()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const chatThreadsService = accessor.get('IChatThreadService')
	const notificationService = accessor.get('INotificationService')
	const mcpService = accessor.get('IMCPService')
	const storageService = accessor.get('IStorageService')
	const metricsService = accessor.get('IMetricsService')
	const isOptedOut = useIsOptedOut()

	const onDownload = (t: 'Chats' | 'Settings') => {
		let dataStr: string
		let downloadName: string
		if (t === 'Chats') {
			// Export chat threads
			dataStr = JSON.stringify(chatThreadsService.state, null, 2)
			downloadName = 'void-chats.json'
		}
		else if (t === 'Settings') {
			// Export user settings
			dataStr = JSON.stringify(voidSettingsService.state, null, 2)
			downloadName = 'void-settings.json'
		}
		else {
			dataStr = ''
			downloadName = ''
		}

		const blob = new Blob([dataStr], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = downloadName
		a.click()
		URL.revokeObjectURL(url)
	}


	// Add file input refs
	const fileInputSettingsRef = useRef<HTMLInputElement>(null)
	const fileInputChatsRef = useRef<HTMLInputElement>(null)

	const [s, ss] = useState(0)

	const handleUpload = (t: 'Chats' | 'Settings') => (e: React.ChangeEvent<HTMLInputElement>,) => {
		const files = e.target.files
		if (!files) return;
		const file = files[0]
		if (!file) return

		const reader = new FileReader();
		reader.onload = () => {
			try {
				const json = JSON.parse(reader.result as string);

				if (t === 'Chats') {
					chatThreadsService.dangerousSetState(json as any)
				}
				else if (t === 'Settings') {
					voidSettingsService.dangerousSetState(json as any)
				}

				notificationService.info(`${t} imported successfully!`)
			} catch (err) {
				notificationService.notify({ message: `Failed to import ${t}`, source: err + '', severity: Severity.Error, })
			}
		};
		reader.readAsText(file);
		e.target.value = '';

		ss(s => s + 1)
	}


	return (
		<div className={`@@void-scope ${isDark ? 'void-dark' : ''}`} style={{ height: '100%', width: '100%', overflow: 'auto' }}>
			<div className="flex flex-col md:flex-row w-full gap-6 max-w-[900px] mx-auto mb-32" style={{ minHeight: '80vh' }}>
				{/* ──────────────  SIDEBAR  ────────────── */}

				<aside className="md:w-1/4 w-full p-6 shrink-0">
					{/* vertical tab list */}
					<div className="flex flex-col gap-2 mt-12">
						{navItems.map(({ tab, label }) => (
							<button
								key={tab}
								onClick={() => {
									if (tab === 'all') {
										setSelectedSection('all');
										window.scrollTo({ top: 0, behavior: 'smooth' });
									} else {
										setSelectedSection(tab);
									}
								}}
								className={`
          py-2 px-4 rounded-md text-left transition-all duration-200
          ${selectedSection === tab
										? 'bg-[#0e70c0]/80 text-white font-medium shadow-sm'
										: 'bg-void-bg-2 hover:bg-void-bg-2/80 text-void-fg-1'}
        `}
							>
								{label}
							</button>
						))}
					</div>
				</aside>

				{/* ───────────── MAIN PANE ───────────── */}
				<main className="flex-1 p-6 select-none">



					<div className='max-w-3xl'>

						<h1 className='text-2xl w-full'>{t.settingsTitle()}</h1>

						<div className='w-full h-[1px] my-2' />

						{/* Models section (formerly FeaturesTab) */}
						<ErrorBoundary>
							<RedoOnboardingButton />
						</ErrorBoundary>

						<div className='w-full h-[1px] my-4' />

						{/* All sections in flex container with gap-12 */}
						<div className='flex flex-col gap-12'>
							{/* Models section (formerly FeaturesTab) */}
							<div className={shouldShowTab('models') ? `` : 'hidden'}>
								<ErrorBoundary>
									<ModelDump />
									<div className='w-full h-[1px] my-4' />
									<AutoDetectLocalModelsToggle />
									<RefreshableModels />
								</ErrorBoundary>
							</div>

							{/* Compatible API Providers section */}
							<div className={shouldShowTab('compatibleApiProviders') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t.compatibleApiProviders()}</h2>
									<h3 className={`text-void-fg-3 mb-2`}>
										<ChatMarkdownRender string={t.compatibleApiProvidersDesc()} chatMessageLocation={undefined} />
									</h3>

									<CollapsibleCompatibleProviders providerNames={compatibleApiProviderNames} />
								</ErrorBoundary>
							</div>

							{/* Local Providers section */}
							<div className={shouldShowTab('localProviders') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t.localProviders()}</h2>
									<h3 className={`text-void-fg-3 mb-2`}>{t.localProvidersDesc()}</h3>

									<div className='opacity-80 mb-4'>
										<OllamaSetupInstructions sayWeAutoDetect={true} />
									</div>

									<VoidProviderSettings providerNames={localProviderNames} />
								</ErrorBoundary>
							</div>

							{/* Main Providers section */}
							<div className={shouldShowTab('providers') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t.mainProviders()}</h2>
									<h3 className={`text-void-fg-3 mb-2`}>{t.mainProvidersDesc()}</h3>

									<VoidProviderSettings providerNames={nonlocalProviderNames} />
								</ErrorBoundary>
							</div>

							{/* Feature Options section */}
							<div className={shouldShowTab('featureOptions') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t.featureOptions()}</h2>

									<div className='flex flex-col gap-y-8 my-4'>
										<ErrorBoundary>
											{/* FIM */}
											<div>
												<h4 className={`text-base`}>{displayInfoOfFeatureName('Autocomplete')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>
													<span>
														{t.experimental()}{' '}
													</span>
													<span
														className='hover:brightness-110'
														data-tooltip-id='void-tooltip'
														data-tooltip-content={t.fimModelRecommendation()}
														data-tooltip-class-name='void-max-w-[20px]'
													>
														{t.onlyWorksWithFIM()}
													</span>
												</div>

												<div className='my-2'>
													{/* Enable Switch */}
													<ErrorBoundary>
														<div className='flex items-center gap-x-2 my-2'>
															<VoidSwitch
																size='xs'
																value={settingsState.globalSettings.enableAutocomplete}
																onChange={(newVal) => voidSettingsService.setGlobalSetting('enableAutocomplete', newVal)}
															/>
															<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.enableAutocomplete ? t.enabled() : t.disabled()}</span>
														</div>
													</ErrorBoundary>

													{/* Model Dropdown */}
													<ErrorBoundary>
														<div className={`my-2 ${!settingsState.globalSettings.enableAutocomplete ? 'hidden' : ''}`}>
															<ModelDropdown featureName={'Autocomplete'} className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1' />
														</div>
													</ErrorBoundary>

												</div>

											</div>
										</ErrorBoundary>

										{/* Apply */}
										<ErrorBoundary>

											<div className='w-full'>
												<h4 className={`text-base`}>{displayInfoOfFeatureName('Apply')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>{t.applySettingsDesc()}</div>

												<div className='my-2'>
													{/* Sync to Chat Switch */}
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.syncApplyToChat}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('syncApplyToChat', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.syncApplyToChat ? t.sameAsChatModel() : t.differentModel()}</span>
													</div>

													{/* Model Dropdown */}
													<div className={`my-2 ${settingsState.globalSettings.syncApplyToChat ? 'hidden' : ''}`}>
														<ModelDropdown featureName={'Apply'} className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1' />
													</div>
												</div>


												<div className='my-2'>
													{/* Fast Apply Method Dropdown */}
													<div className='flex items-center gap-x-2 my-2'>
														<FastApplyMethodDropdown />
													</div>
												</div>

											</div>
										</ErrorBoundary>




										{/* Tools Section */}
										<div>
											<h4 className={`text-base`}>{t.tools()}</h4>
											<div className='text-sm text-void-fg-3 mt-1'>{t.toolsDesc()}</div>

											<div className='my-2'>
												{/* Auto Accept Switch */}
												<ErrorBoundary>
													{[...toolApprovalTypes].map((approvalType) => {
														return <div key={approvalType} className="flex items-center gap-x-2 my-2">
															<ToolApprovalTypeSwitch size='xs' approvalType={approvalType} desc={t.autoApprove(approvalType)} />
														</div>
													})}

												</ErrorBoundary>

												{/* Tool Lint Errors Switch */}
												<ErrorBoundary>

													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.includeToolLintErrors}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('includeToolLintErrors', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.includeToolLintErrors ? t.fixLintErrors() : t.fixLintErrors()}</span>
													</div>
												</ErrorBoundary>

												{/* Auto Accept LLM Changes Switch */}
												<ErrorBoundary>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.autoAcceptLLMChanges}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('autoAcceptLLMChanges', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t.autoAcceptLLMChanges()}</span>
													</div>
												</ErrorBoundary>
											</div>
										</div>

										{/* Developer Mode */}
										<div className='w-full'>
											<h4 className={`text-base`}>{t.developerMode()}</h4>
											<div className='text-sm text-void-fg-3 mt-1'>{t.developerModeDesc()}</div>

											<div className='my-2'>
												{/* Show JSON Debug Switch */}
												<ErrorBoundary>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.showJsonDebug}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('showJsonDebug', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t.showJsonDebug()}</span>
													</div>
												</ErrorBoundary>

												{/* Enable Markdown Cache Switch */}
												<ErrorBoundary>
													<div className='text-void-fg-3 text-xs my-1'>{t.enableMarkdownCacheDesc()}</div>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.enableMarkdownCache}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('enableMarkdownCache', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t.enableMarkdownCache()}</span>
														<span className='text-void-fg-4 text-xs'>{t.enableMarkdownCacheRestart()}</span>
													</div>
												</ErrorBoundary>

												{/* Reset Visible On Send Switch */}
												<ErrorBoundary>
													<div className='text-void-fg-3 text-xs my-1'>{t.resetVisibleOnSendDesc()}</div>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.resetVisibleOnSend}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('resetVisibleOnSend', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t.resetVisibleOnSend()}</span>
													</div>
												</ErrorBoundary>

												{/* Show All History Threads Switch */}
												<ErrorBoundary>
													<div className='text-void-fg-3 text-xs my-1'>{t.showAllHistoryThreadsDesc()}</div>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.showAllHistoryThreads}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('showAllHistoryThreads', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t.showAllHistoryThreads()}</span>
													</div>
												</ErrorBoundary>
											</div>

											<div className='text-sm text-void-fg-3 mt-1'>{t.defaultLanguageDesc()}</div>
											<div className='my-2'>
												<ErrorBoundary>
													<VoidCustomDropdownBox
														className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1'
														options={['auto', 'en', 'zh'] as DefaultLang[]}
														selectedOption={settingsState.globalSettings.defaultLang}
														onChangeOption={(newVal) => voidSettingsService.setGlobalSetting('defaultLang', newVal)}
														getOptionDisplayName={(val) => val === 'auto' ? t.defaultLanguageAuto() : val === 'en' ? t.defaultLanguageEn() : t.defaultLanguageZh()}
														getOptionDropdownName={(val) => val === 'auto' ? t.defaultLanguageAuto() : val === 'en' ? t.defaultLanguageEn() : t.defaultLanguageZh()}
														getOptionsEqual={(a, b) => a === b}
													/>
												</ErrorBoundary>
											</div>

											<div className='text-sm text-void-fg-3 mt-3'>{t.responseLanguageDesc()}</div>
											<div className='my-2'>
												<ErrorBoundary>
													<VoidCustomDropdownBox
														className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1'
														options={['auto', 'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'pt'] as ResponseLanguage[]}
														selectedOption={settingsState.globalSettings.responseLanguage}
														onChangeOption={(newVal) => {
															voidSettingsService.setGlobalSetting('responseLanguage', newVal)
															// 当选择新语言时，自动设置对应的默认提示词
															voidSettingsService.setGlobalSetting('responseLanguagePrompt', defaultResponseLanguagePromptOfLanguage[newVal])
														}}
														getOptionDisplayName={(val) => val === 'auto' ? t.responseLanguageAuto() : val === 'zh' ? t.responseLanguageZh() : val === 'en' ? t.responseLanguageEn() : val === 'ja' ? t.responseLanguageJa() : val === 'ko' ? t.responseLanguageKo() : val === 'fr' ? t.responseLanguageFr() : val === 'de' ? t.responseLanguageDe() : val === 'es' ? t.responseLanguageEs() : val === 'ru' ? t.responseLanguageRu() : t.responseLanguagePt()}
														getOptionDropdownName={(val) => val === 'auto' ? t.responseLanguageAuto() : val === 'zh' ? t.responseLanguageZh() : val === 'en' ? t.responseLanguageEn() : val === 'ja' ? t.responseLanguageJa() : val === 'ko' ? t.responseLanguageKo() : val === 'fr' ? t.responseLanguageFr() : val === 'de' ? t.responseLanguageDe() : val === 'es' ? t.responseLanguageEs() : val === 'ru' ? t.responseLanguageRu() : t.responseLanguagePt()}
														getOptionsEqual={(a, b) => a === b}
													/>
												</ErrorBoundary>
											</div>
											{settingsState.globalSettings.responseLanguage !== 'auto' && (
												<div className='my-3'>
													<div className='text-xs text-void-fg-3 mb-1'>{t.responseLanguagePromptDesc()}</div>
													<ErrorBoundary>
														<VoidInputBox2
															className='min-h-[60px] p-2 rounded-sm text-xs'
															initValue={settingsState.globalSettings.responseLanguagePrompt}
															placeholder={defaultResponseLanguagePromptOfLanguage[settingsState.globalSettings.responseLanguage]}
															multiline
															showBorder
															onChangeText={(newText) => {
																voidSettingsService.setGlobalSetting('responseLanguagePrompt', newText)
															}}
														/>
													</ErrorBoundary>
												</div>
											)}
										</div>

										<div className='w-full'>
											<h4 className={`text-base`}>{t.editor()}</h4>
											<div className='text-sm text-void-fg-3 mt-1'>{t.editorSettingsDesc()}</div>

											<div className='my-2'>
												{/* Auto Accept Switch */}
												<ErrorBoundary>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.showInlineSuggestions}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('showInlineSuggestions', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t.showSuggestionsOnSelect()}</span>
													</div>
												</ErrorBoundary>
											</div>
										</div>

										{/* SCM */}
										<ErrorBoundary>

											<div className='w-full'>
												<h4 className={`text-base`}>{displayInfoOfFeatureName('SCM')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>{t.scmSettingsDesc()}</div>

												<div className='my-2'>
													{/* Sync to Chat Switch */}
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.syncSCMToChat}
															onChange={(newVal) => voidSettingsService.setGlobalSetting('syncSCMToChat', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.syncSCMToChat ? t.sameAsChatModel() : t.differentModel()}</span>
													</div>

													{/* Model Dropdown */}
													<div className={`my-2 ${settingsState.globalSettings.syncSCMToChat ? 'hidden' : ''}`}>
														<ModelDropdown featureName={'SCM'} className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1' />
													</div>
												</div>

											</div>
										</ErrorBoundary>
									</div>
								</ErrorBoundary>
							</div>

							{/* General section */}
							<div className={`${shouldShowTab('general') ? `` : 'hidden'} flex flex-col gap-12`}>
								{/* One-Click Switch section */}
								<div>
									<ErrorBoundary>
										<h2 className='text-3xl mb-2'>{t.oneClickSwitch()}</h2>
										<h4 className='text-void-fg-3 mb-4'>{t.oneClickSwitchDesc()}</h4>

										<div className='flex flex-col gap-2'>
											<OneClickSwitchButton className='w-48' fromEditor="VS Code" />
											<OneClickSwitchButton className='w-48' fromEditor="Cursor" />
											<OneClickSwitchButton className='w-48' fromEditor="Windsurf" />
										</div>
									</ErrorBoundary>
								</div>

								{/* Import/Export section */}
								<div>
									<h2 className='text-3xl mb-2'>{t.importExport()}</h2>
									<h4 className='text-void-fg-3 mb-4'>{t.importExportDesc()}</h4>
									<div className='flex flex-col gap-8'>
										{/* Settings Subcategory */}
										<div className='flex flex-col gap-2 max-w-48 w-full'>
											<input key={2 * s} ref={fileInputSettingsRef} type='file' accept='.json' className='hidden' onChange={handleUpload('Settings')} />
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => { fileInputSettingsRef.current?.click() }}>
												{t.importSettings()}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => onDownload('Settings')}>
												{t.exportSettings()}
											</VoidButtonBgDarken>
											<ConfirmButton className='px-4 py-1 w-full' onConfirm={() => { voidSettingsService.resetState(); }}>
												{t.resetSettings()}
											</ConfirmButton>
										</div>

										{/* Chats Subcategory */}
										<div className='flex flex-col gap-2 max-w-48 w-full'>
											<input key={2 * s + 1} ref={fileInputChatsRef} type='file' accept='.json' className='hidden' onChange={handleUpload('Chats')} />
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => { fileInputChatsRef.current?.click() }}>
												{t.importChats()}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => onDownload('Chats')}>
												{t.exportChats()}
											</VoidButtonBgDarken>
											<ConfirmButton className='px-4 py-1 w-full' onConfirm={() => { chatThreadsService.resetState(); }}>
												{t.resetChats()}
											</ConfirmButton>
										</div>
									</div>
								</div>



								{/* Built-in Settings section */}
								<div>
									<h2 className={`text-3xl mb-2`}>{t.builtInSettings()}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>{t.builtInSettingsDesc()}</h4>

									<ErrorBoundary>
										<div className='flex flex-col gap-2 justify-center max-w-48 w-full'>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { commandService.executeCommand('workbench.action.openSettings') }}>
												{t.generalSettings()}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { commandService.executeCommand('workbench.action.openGlobalKeybindings') }}>
												{t.keyboardSettings()}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { commandService.executeCommand('workbench.action.selectTheme') }}>
												{t.themeSettings()}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { nativeHostService.showItemInFolder(environmentService.logsHome.fsPath) }}>
												{t.openLogs()}
											</VoidButtonBgDarken>
										</div>
									</ErrorBoundary>
								</div>


								{/* Metrics section */}
								<div className='max-w-[600px]'>
									<h2 className={`text-3xl mb-2`}>{t.metrics()}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>{t.metricsDesc()}</h4>

									<div className='my-2'>
										{/* Disable All Metrics Switch */}
										<ErrorBoundary>
											<div className='flex items-center gap-x-2 my-2'>
												<VoidSwitch
													size='xs'
													value={isOptedOut}
													onChange={(newVal) => {
														storageService.store(OPT_OUT_KEY, newVal, StorageScope.APPLICATION, StorageTarget.MACHINE)
														metricsService.capture(`Set metrics opt-out to ${newVal}`, {}) // this only fires if it's enabled, so it's fine to have here
													}}
												/>
												<span className='text-void-fg-3 text-xs pointer-events-none'>{t.optOutRequiresRestart()}</span>
											</div>
										</ErrorBoundary>
									</div>
								</div>

								{/* AI Instructions section */}
								<div className='max-w-[600px]'>
									<h2 className={`text-3xl mb-2`}>{t.aiInstructions()}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>
											<ChatMarkdownRender inPTag={true} string={t.aiInstructionsDesc()} chatMessageLocation={undefined} />
									</h4>
									<ErrorBoundary>
										<AIInstructionsBox />
									</ErrorBoundary>
									{/* --- Disable System Message Toggle --- */}
									<div className='my-4'>
										<ErrorBoundary>
											<div className='flex items-center gap-x-2'>
												<VoidSwitch
													size='xs'
													value={!!settingsState.globalSettings.disableSystemMessage}
													onChange={(newValue) => {
														voidSettingsService.setGlobalSetting('disableSystemMessage', newValue);
													}}
												/>
												<span className='text-void-fg-3 text-xs pointer-events-none'>
													{t.disableSystemMessage()}
												</span>
											</div>
										</ErrorBoundary>
										<div className='text-void-fg-3 text-xs mt-1'>
											{t.disableSystemMessageDesc()}
										</div>
									</div>
								</div>

							</div>

							{/* Skills section */}
							<div className={shouldShowTab('skills') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className='text-3xl mb-2'>{t.skills()}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>
										<ChatMarkdownRender inPTag={true} string={t.skillsDesc()} chatMessageLocation={undefined} />
									</h4>
									<ErrorBoundary>
										<SkillsList />
									</ErrorBoundary>
								</ErrorBoundary>
							</div>

							{/* MCP section */}
							<div className={shouldShowTab('mcp') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className='text-3xl mb-2'>{t.mcp()}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>
											<ChatMarkdownRender inPTag={true} string={t.mcpDesc()} chatMessageLocation={undefined} />
									</h4>
									<div className='my-2'>
										<VoidButtonBgDarken className='px-4 py-1 w-full max-w-48' onClick={async () => { await mcpService.revealMCPConfigFile() }}>
											{t.addMCPServer()}
										</VoidButtonBgDarken>
									</div>

									<ErrorBoundary>
										<MCPServersList />
									</ErrorBoundary>
								</ErrorBoundary>
							</div>





						</div>

					</div>
				</main>
			</div>
		</div>
	);
}
