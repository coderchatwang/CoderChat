/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React from 'react'
import { X } from 'lucide-react'
import { useVoidChatI18n } from '../util/i18n.js'

interface AlertDialogProps {
	isOpen: boolean
	title?: string
	message: string
	buttonText?: string
	onClose: () => void
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
	isOpen,
	title,
	message,
	buttonText,
	onClose,
}) => {
	const t = useVoidChatI18n()

	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999999]"
		>
			<div
				className="bg-void-bg-1 rounded-lg p-6 max-w-sm w-full shadow-xl border border-void-border-2"
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-2xl font-light text-void-fg-1">{title ?? t.alertDialogTitle()}</h3>
					<button
						onClick={onClose}
						className="text-void-fg-3 hover:text-void-fg-1 transition-colors"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Content */}
				<div className="text-void-fg-2 text-base mb-6">
					{message}
				</div>

			{/* Footer */}
				<div className="flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
					>
						{buttonText ?? t.alertDialogConfirm()}
					</button>
				</div>
			</div>
		</div>
	)
}
