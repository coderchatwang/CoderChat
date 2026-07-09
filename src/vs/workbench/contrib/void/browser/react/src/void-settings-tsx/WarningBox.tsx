import { IconWarning } from '../sidebar-tsx/SidebarChat.js';
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useVoidChatI18n } from '../util/i18n.js';
import { useAccessor } from '../util/services.js';

export const WarningBox = ({ text, onClick, className, multiline = false }: { text: string; onClick?: () => void; className?: string; multiline?: boolean }) => {
	const t = useVoidChatI18n();
	const accessor = useAccessor();
	const clipboardService = accessor.get('IClipboardService');
	const [copied, setCopied] = useState(false);

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation();
		await clipboardService.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Check if text contains newlines (multiline error message)
	const hasMultipleLines = multiline || text.includes('\n')

	if (hasMultipleLines) {
		// Multiline mode - better for detailed error messages
		return <div
			className={`
				text-void-warning brightness-90 opacity-90 w-full max-w-full
				text-xs
				${onClick ? `hover:brightness-75 transition-all duration-200 cursor-pointer` : ''}
				${className}
			`}
			onClick={onClick}
		>
			<div className="flex items-start gap-1">
				<IconWarning
					size={14}
					className='flex-shrink-0 mt-0.5'
				/>
				<pre className="whitespace-pre-wrap break-words font-sans flex-1 overflow-auto max-h-40">{text}</pre>
				<button
					onClick={handleCopy}
					className="flex-shrink-0 p-1 hover:bg-void-bg-2 rounded transition-colors"
					title={t.copyToClipboard()}
				>
					{copied ? (
						<Check size={14} className="text-green-500" />
					) : (
						<Copy size={14} className="text-void-fg-3 hover:text-void-fg-1" />
					)}
				</button>
			</div>
		</div>
	}

	// Single line mode (original behavior)
	return <div
		className={`
			text-void-warning brightness-90 opacity-90 w-fit
			text-xs text-ellipsis
			${onClick ? `hover:brightness-75 transition-all duration-200 cursor-pointer` : ''}
			flex items-center flex-nowrap
			${className}
		`}
		onClick={onClick}
	>
		<IconWarning
			size={14}
			className='mr-1 flex-shrink-0'
		/>
		<span>{text}</span>
	</div>
	// return <VoidSelectBox
	// 	options={[{ text: 'Please add a model!', value: null }]}
	// 	onChangeSelection={() => { }}
	// />
}
