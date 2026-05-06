import { CancellationToken } from '../../../../base/common/cancellation.js'
import { URI } from '../../../../base/common/uri.js'
import { IFileService } from '../../../../platform/files/common/files.js'
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js'
import { createDecorator, IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js'
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js'
import { QueryBuilder } from '../../../services/search/common/queryBuilder.js'
import { ISearchService } from '../../../services/search/common/search.js'
import { IEditCodeService } from './editCodeServiceInterface.js'
import { ITerminalToolService } from './terminalToolService.js'
import { LintErrorItem, BuiltinToolCallParams, BuiltinToolResultType, BuiltinToolName, AskUserQuestionItem, AskUserQuestionOption, TodoItem } from '../common/toolsServiceTypes.js'
import { IVoidModelService } from '../common/voidModelService.js'
import { EndOfLinePreference } from '../../../../editor/common/model.js'
import { IVoidCommandBarService } from './voidCommandBarService.js'
import { computeDirectoryTree1Deep, IDirectoryStrService, stringifyDirectoryTree1Deep } from '../common/directoryStrService.js'
import { IMarkerService, MarkerSeverity } from '../../../../platform/markers/common/markers.js'
import { timeout } from '../../../../base/common/async.js'
import { RawToolParamsObj } from '../common/sendLLMMessageTypes.js'
import { MAX_CHILDREN_URIs_PAGE, MAX_FILE_CHARS_PAGE, MAX_TERMINAL_BG_COMMAND_TIME, MAX_TERMINAL_INACTIVE_TIME } from '../common/prompt/prompts.js'
import { IVoidSettingsService } from '../common/voidSettingsService.js'
import { generateUuid } from '../../../../base/common/uuid.js'
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js'
import { IChatThreadService } from './chatThreadService.js'



// Helper function to escape XML text content while preserving tags
const escapeXmlTextContent = (content: string, setCount: (count: number) => void): string => {
	let charactersEscaped = 0
	let result = ''
	let inTag = false
	let i = 0

	while (i < content.length) {
		const char = content[i]

		if (char === '<') {
			inTag = true
			result += char
		} else if (char === '>') {
			inTag = false
			result += char
		} else if (!inTag) {
			// We're in text content, escape special characters
			if (char === '&') {
				// Check if it's already an entity
				if (content.substring(i, i + 5).match(/^&[a-z]+;/) || content.substring(i, i + 3).match(/^&#\d+;/)) {
					result += char
				} else {
					result += '&amp;'
					charactersEscaped++
				}
			} else if (char === '<') {
				result += '&lt;'
				charactersEscaped++
			} else if (char === '>') {
				result += '&gt;'
				charactersEscaped++
			} else if (char === '"') {
				result += '&quot;'
				charactersEscaped++
			} else if (char === "'") {
				result += '&apos;'
				charactersEscaped++
			} else {
				result += char
			}
		} else {
			// We're in a tag, don't escape
			result += char
		}

		i++
	}

	setCount(charactersEscaped)
	return result
}


// tool use for AI
type ValidateBuiltinParams = { [T in BuiltinToolName]: (p: RawToolParamsObj) => BuiltinToolCallParams[T] }
type CallBuiltinTool = { [T in BuiltinToolName]: (p: BuiltinToolCallParams[T]) => Promise<{ result: BuiltinToolResultType[T] | Promise<BuiltinToolResultType[T]>, interruptTool?: () => void }> }
type BuiltinToolResultToString = { [T in BuiltinToolName]: (p: BuiltinToolCallParams[T], result: Awaited<BuiltinToolResultType[T]>) => string }


const isFalsy = (u: unknown) => {
	return !u || u === 'null' || u === 'undefined'
}

const validateStr = (argName: string, value: unknown) => {
	if (value === null) throw new Error(`Invalid LLM output: ${argName} was null.`)
	if (typeof value !== 'string') throw new Error(`Invalid LLM output format: ${argName} must be a string, but its type is "${typeof value}". Full value: ${JSON.stringify(value)}.`)
	return value
}


// We are NOT checking to make sure in workspace
const validateURI = (uriStr: unknown) => {
	if (uriStr === null) throw new Error(`Invalid LLM output: uri was null.`)
	if (typeof uriStr !== 'string') throw new Error(`Invalid LLM output format: Provided uri must be a string, but it's a(n) ${typeof uriStr}. Full value: ${JSON.stringify(uriStr)}.`)

	const uriStrTrimL:string= uriStr.trim()

	// Check if it's already a full URI with scheme (e.g., vscode-remote://, file://, etc.)
	// Look for :// pattern which indicates a scheme is present
	// Examples of supported URIs:
	// - vscode-remote://wsl+Ubuntu/home/user/file.txt (WSL)
	// - vscode-remote://ssh-remote+myserver/home/user/file.txt (SSH)
	// - file:///home/user/file.txt (local file with scheme)
	// - /home/user/file.txt (local file path, will be converted to file://)
	// - C:\Users\file.txt (Windows local path, will be converted to file://)
	if (uriStrTrimL.includes('://')) {
		try {
			const uri = URI.parse(uriStrTrimL)
			return uri
		} catch (e) {
			// If parsing fails, it's a malformed URI
			throw new Error(`Invalid URI format: ${uriStrTrimL}. Error: ${e}`)
		}
	} else {
		// No scheme present, treat as file path
		// This handles regular file paths like /home/user/file.txt or C:\Users\file.txt
		const uri = URI.file(uriStrTrimL)
		return uri
	}
}

const validateOptionalURI = (uriStr: unknown) => {
	if (isFalsy(uriStr)) return null
	return validateURI(uriStr)
}

const validateOptionalStr = (argName: string, str: unknown) => {
	if (isFalsy(str)) return null
	return validateStr(argName, str)
}


const validatePageNum = (pageNumberUnknown: unknown) => {
	if (!pageNumberUnknown) return 1
	const parsedInt = Number.parseInt(pageNumberUnknown + '')
	if (!Number.isInteger(parsedInt)) throw new Error(`Page number was not an integer: "${pageNumberUnknown}".`)
	if (parsedInt < 1) throw new Error(`Invalid LLM output format: Specified page number must be 1 or greater: "${pageNumberUnknown}".`)
	return parsedInt
}

const validateNumber = (numStr: unknown, opts: { default: number | null }) => {
	if (typeof numStr === 'number')
		return numStr
	if (isFalsy(numStr)) return opts.default

	if (typeof numStr === 'string') {
		const parsedInt = Number.parseInt(numStr + '')
		if (!Number.isInteger(parsedInt)) return opts.default
		return parsedInt
	}

	return opts.default
}

const validateProposedTerminalId = (terminalIdUnknown: unknown) => {
	if (!terminalIdUnknown) throw new Error(`A value for terminalID must be specified, but the value was "${terminalIdUnknown}"`)
	const terminalId = terminalIdUnknown + ''
	return terminalId
}

const validateBoolean = (b: unknown, opts: { default: boolean }) => {
	if (typeof b === 'string') {
		if (b === 'true') return true
		if (b === 'false') return false
	}
	if (typeof b === 'boolean') {
		return b
	}
	return opts.default
}


const checkIfIsFolder = (uriStr: string) => {
	uriStr = uriStr.trim()
	if (uriStr.endsWith('/') || uriStr.endsWith('\\')) return true
	return false
}

export interface IToolsService {
	readonly _serviceBrand: undefined;
	validateParams: ValidateBuiltinParams;
	callTool: CallBuiltinTool;
	stringOfResult: BuiltinToolResultToString;
}

export const IToolsService = createDecorator<IToolsService>('ToolsService');

export class ToolsService implements IToolsService {

	readonly _serviceBrand: undefined;

	public validateParams: ValidateBuiltinParams;
	public callTool: CallBuiltinTool;
	public stringOfResult: BuiltinToolResultToString;

	constructor(
		@IFileService fileService: IFileService,
		@IWorkspaceContextService workspaceContextService: IWorkspaceContextService,
		@ISearchService searchService: ISearchService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IVoidModelService voidModelService: IVoidModelService,
		@IEditCodeService editCodeService: IEditCodeService,
		@ITerminalToolService private readonly terminalToolService: ITerminalToolService,
		@IVoidCommandBarService private readonly commandBarService: IVoidCommandBarService,
		@IDirectoryStrService private readonly directoryStrService: IDirectoryStrService,
		@IMarkerService private readonly markerService: IMarkerService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
		@IMainProcessService private readonly mainProcessService: IMainProcessService,
	) {
		const queryBuilder = this.instantiationService.createInstance(QueryBuilder);

		this.validateParams = {
			read_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, start_line: startLineUnknown, end_line: endLineUnknown, page_number: pageNumberUnknown } = params
				const uri = validateURI(uriStr)
				const pageNumber = validatePageNum(pageNumberUnknown)

				let startLine = validateNumber(startLineUnknown, { default: null })
				let endLine = validateNumber(endLineUnknown, { default: null })

				if (startLine !== null && startLine < 1) startLine = null
				if (endLine !== null && endLine < 1) endLine = null

				return { uri, startLine, endLine, pageNumber }
			},
			ls_dir: (params: RawToolParamsObj) => {
				const { uri: uriStr, page_number: pageNumberUnknown } = params

				const uri = validateURI(uriStr)
				const pageNumber = validatePageNum(pageNumberUnknown)
				return { uri, pageNumber }
			},
			get_dir_tree: (params: RawToolParamsObj) => {
				const { uri: uriStr, } = params
				const uri = validateURI(uriStr)
				return { uri }
			},
			search_pathnames_only: (params: RawToolParamsObj) => {
				const {
					query: queryUnknown,
					search_in_folder: includeUnknown,
					page_number: pageNumberUnknown
				} = params

				const queryStr = validateStr('query', queryUnknown)
				const pageNumber = validatePageNum(pageNumberUnknown)
				const includePattern = validateOptionalStr('include_pattern', includeUnknown)

				return { query: queryStr, includePattern, pageNumber }

			},
			search_for_files: (params: RawToolParamsObj) => {
				const {
					query: queryUnknown,
					search_in_folder: searchInFolderUnknown,
					is_regex: isRegexUnknown,
					page_number: pageNumberUnknown
				} = params
				const queryStr = validateStr('query', queryUnknown)
				const pageNumber = validatePageNum(pageNumberUnknown)
				const searchInFolder = validateOptionalURI(searchInFolderUnknown)
				const isRegex = validateBoolean(isRegexUnknown, { default: false })
				return {
					query: queryStr,
					isRegex,
					searchInFolder,
					pageNumber
				}
			},
			search_in_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, query: queryUnknown, is_regex: isRegexUnknown } = params;
				const uri = validateURI(uriStr);
				const query = validateStr('query', queryUnknown);
				const isRegex = validateBoolean(isRegexUnknown, { default: false });
				return { uri, query, isRegex };
			},

			read_lint_errors: (params: RawToolParamsObj) => {
				const {
					uri: uriUnknown,
				} = params
				const uri = validateURI(uriUnknown)
				return { uri }
			},

			// ---

			create_file_or_folder: (params: RawToolParamsObj) => {
				const { uri: uriUnknown } = params
				const uri = validateURI(uriUnknown)
				const uriStr = validateStr('uri', uriUnknown)
				const isFolder = checkIfIsFolder(uriStr)
				return { uri, isFolder }
			},

			delete_file_or_folder: (params: RawToolParamsObj) => {
				const { uri: uriUnknown, is_recursive: isRecursiveUnknown } = params
				const uri = validateURI(uriUnknown)
				const isRecursive = validateBoolean(isRecursiveUnknown, { default: false })
				const uriStr = validateStr('uri', uriUnknown)
				const isFolder = checkIfIsFolder(uriStr)
				return { uri, isRecursive, isFolder }
			},

			rewrite_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, new_content: newContentUnknown } = params
				const uri = validateURI(uriStr)
				const newContent = validateStr('newContent', newContentUnknown)
				return { uri, newContent }
			},

			edit_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, search_replace_blocks: searchReplaceBlocksUnknown } = params
				const uri = validateURI(uriStr)
				const searchReplaceBlocks = validateStr('searchReplaceBlocks', searchReplaceBlocksUnknown)
				return { uri, searchReplaceBlocks }
			},

			// ---

			run_command: (params: RawToolParamsObj) => {
				const { command: commandUnknown, cwd: cwdUnknown } = params
				const command = validateStr('command', commandUnknown)
				const cwd = validateOptionalStr('cwd', cwdUnknown)
				const terminalId = generateUuid()
				return { command, cwd, terminalId }
			},
			run_persistent_command: (params: RawToolParamsObj) => {
				const { command: commandUnknown, persistent_terminal_id: persistentTerminalIdUnknown } = params;
				const command = validateStr('command', commandUnknown);
				const persistentTerminalId = validateProposedTerminalId(persistentTerminalIdUnknown)
				return { command, persistentTerminalId };
			},
			open_persistent_terminal: (params: RawToolParamsObj) => {
				const { cwd: cwdUnknown } = params;
				const cwd = validateOptionalStr('cwd', cwdUnknown)
				// No parameters needed; will open a new background terminal
				return { cwd };
			},
			kill_persistent_terminal: (params: RawToolParamsObj) => {
				const { persistent_terminal_id: terminalIdUnknown } = params;
				const persistentTerminalId = validateProposedTerminalId(terminalIdUnknown);
				return { persistentTerminalId };
			},
			xml_escape: (params: RawToolParamsObj) => {
				const { uri: uriUnknown, escape_all: escapeAllUnknown } = params
				const uri = validateURI(uriUnknown)
				const escapeAll = validateBoolean(escapeAllUnknown, { default: false })
				return { uri, escapeAll }
			},
			ask_user_question: (params: RawToolParamsObj) => {
				const { questions: questionsUnknown, answers: answersUnknown } = params

				// Parse questions if it's a JSON string
				let questionsParsed = questionsUnknown
				if (typeof questionsUnknown === 'string') {
					try {
						questionsParsed = JSON.parse(questionsUnknown)
					} catch (e) {
						throw new Error('Invalid LLM output: questions must be a valid JSON array.')
					}
				}

				// Validate questions array
				if (!questionsParsed || !Array.isArray(questionsParsed)) {
					throw new Error('Invalid LLM output: questions must be an array.')
				}

				if (questionsParsed.length < 1 || questionsParsed.length > 4) {
					throw new Error('Invalid LLM output: questions must have 1-4 items.')
				}

				const questions: AskUserQuestionItem[] = questionsParsed.map((q: any, i: number) => {
					if (!q || typeof q !== 'object') {
						throw new Error(`Invalid LLM output: question ${i + 1} must be an object.`)
					}

					const question = typeof q.question === 'string' ? q.question : ''
					const header = typeof q.header === 'string' ? q.header : `Question ${i + 1}`
					const multiSelect = typeof q.multiSelect === 'boolean' ? q.multiSelect : false

					if (!q.options || !Array.isArray(q.options)) {
						throw new Error(`Invalid LLM output: question ${i + 1} options must be an array.`)
					}

					if (q.options.length < 2 || q.options.length > 4) {
						throw new Error(`Invalid LLM output: question ${i + 1} must have 2-4 options.`)
					}

					const options: AskUserQuestionOption[] = q.options.map((opt: any, j: number) => {
						if (!opt || typeof opt !== 'object') {
							throw new Error(`Invalid LLM output: question ${i + 1} option ${j + 1} must be an object.`)
						}
						return {
							label: typeof opt.label === 'string' ? opt.label : `Option ${j + 1}`,
							description: typeof opt.description === 'string' ? opt.description : ''
						}
					})

					return { question, header, options, multiSelect }
				})

				// Validate answers (can be empty object initially)
				const answers: Record<string, string> = typeof answersUnknown === 'object' && answersUnknown !== null
					? answersUnknown as Record<string, string>
					: {}

				return { questions, answers }
			},

			web_fetch: (params: RawToolParamsObj) => {
				const { url: urlUnknown, prompt: promptUnknown } = params

				const url = validateStr('url', urlUnknown)
				const prompt = validateStr('prompt', promptUnknown)

				// Validate URL format
				if (!url.startsWith('http://') && !url.startsWith('https://')) {
					throw new Error(`Invalid LLM output: URL must start with http:// or https://.`)
				}

				return { url, prompt }
			},

			todo_write: (params: RawToolParamsObj) => {
				const { todos: todosUnknown } = params

				// Parse todos if it's a JSON string
				let todosParsed = todosUnknown
				if (typeof todosUnknown === 'string') {
					try {
						todosParsed = JSON.parse(todosUnknown)
					} catch (e) {
						throw new Error('Invalid LLM output: todos must be a valid JSON array.')
					}
				}

				// Validate todos array
				if (!todosParsed || !Array.isArray(todosParsed)) {
					throw new Error('Invalid LLM output: todos must be an array.')
				}

				const todos: TodoItem[] = todosParsed.map((t: any, i: number) => {
					if (!t || typeof t !== 'object') {
						throw new Error(`Invalid LLM output: todo item ${i + 1} must be an object.`)
					}

					const id = typeof t.id === 'string' ? t.id : generateUuid()
					const task = typeof t.task === 'string' ? t.task : ''
					const status = ['pending', 'in_progress', 'completed', 'failed'].includes(t.status) ? t.status : 'pending'
					const priority = ['high', 'medium', 'low'].includes(t.priority) ? t.priority : undefined

					return { id, task, status, priority }
				})

				return { todos }
			},

			todo_read: (_params: RawToolParamsObj) => {
				return {}
			},
		}


		this.callTool = {
			read_file: async ({ uri, startLine, endLine, pageNumber }) => {
				await voidModelService.initializeModel(uri)
				const { model } = await voidModelService.getModelSafe(uri)
				if (model === null) { throw new Error(`No contents; File does not exist.`) }

				let contents: string
				if (startLine === null && endLine === null) {
					contents = model.getValue(EndOfLinePreference.LF)
				}
				else {
					const startLineNumber = startLine === null ? 1 : startLine
					const endLineNumber = endLine === null ? model.getLineCount() : endLine
					contents = model.getValueInRange({ startLineNumber, startColumn: 1, endLineNumber, endColumn: Number.MAX_SAFE_INTEGER }, EndOfLinePreference.LF)
				}

				const totalNumLines = model.getLineCount()

				const fromIdx = MAX_FILE_CHARS_PAGE * (pageNumber - 1)
				const toIdx = MAX_FILE_CHARS_PAGE * pageNumber - 1
				const fileContents = contents.slice(fromIdx, toIdx + 1) // paginate
				const hasNextPage = (contents.length - 1) - toIdx >= 1
				const totalFileLen = contents.length
				return { result: { fileContents, totalFileLen, hasNextPage, totalNumLines } }
			},

			ls_dir: async ({ uri, pageNumber }) => {
				const dirResult = await computeDirectoryTree1Deep(fileService, uri, pageNumber)
				return { result: dirResult }
			},

			get_dir_tree: async ({ uri }) => {
				const str = await this.directoryStrService.getDirectoryStrTool(uri)
				return { result: { str } }
			},

			search_pathnames_only: async ({ query: queryStr, includePattern, pageNumber }) => {

				const query = queryBuilder.file(workspaceContextService.getWorkspace().folders.map(f => f.uri), {
					filePattern: queryStr,
					includePattern: includePattern ?? undefined,
					sortByScore: true, // makes results 10x better
				})
				const data = await searchService.fileSearch(query, CancellationToken.None)

				const fromIdx = MAX_CHILDREN_URIs_PAGE * (pageNumber - 1)
				const toIdx = MAX_CHILDREN_URIs_PAGE * pageNumber - 1
				const uris = data.results
					.slice(fromIdx, toIdx + 1) // paginate
					.map(({ resource, results }) => resource)

				const hasNextPage = (data.results.length - 1) - toIdx >= 1
				return { result: { uris, hasNextPage } }
			},

			search_for_files: async ({ query: queryStr, isRegex, searchInFolder, pageNumber }) => {
				const searchFolders = searchInFolder === null ?
					workspaceContextService.getWorkspace().folders.map(f => f.uri)
					: [searchInFolder]

				const query = queryBuilder.text({
					pattern: queryStr,
					isRegExp: isRegex,
				}, searchFolders)

				const data = await searchService.textSearch(query, CancellationToken.None)

				const fromIdx = MAX_CHILDREN_URIs_PAGE * (pageNumber - 1)
				const toIdx = MAX_CHILDREN_URIs_PAGE * pageNumber - 1
				const uris = data.results
					.slice(fromIdx, toIdx + 1) // paginate
					.map(({ resource, results }) => resource)

				const hasNextPage = (data.results.length - 1) - toIdx >= 1
				return { result: { queryStr, uris, hasNextPage } }
			},
			search_in_file: async ({ uri, query, isRegex }) => {
				await voidModelService.initializeModel(uri);
				const { model } = await voidModelService.getModelSafe(uri);
				if (model === null) { throw new Error(`No contents; File does not exist.`); }
				const contents = model.getValue(EndOfLinePreference.LF);
				const contentOfLine = contents.split('\n');
				const totalLines = contentOfLine.length;
				const regex = isRegex ? new RegExp(query) : null;
				const lines: number[] = []
				for (let i = 0; i < totalLines; i++) {
					const line = contentOfLine[i];
					if ((isRegex && regex!.test(line)) || (!isRegex && line.includes(query))) {
						const matchLine = i + 1;
						lines.push(matchLine);
					}
				}
				return { result: { lines } };
			},

			read_lint_errors: async ({ uri }) => {
				await timeout(1000)
				const { lintErrors } = this._getLintErrors(uri)
				return { result: { lintErrors } }
			},

			// ---

			create_file_or_folder: async ({ uri, isFolder }) => {
				if (isFolder)
					await fileService.createFolder(uri)
				else {
					await fileService.createFile(uri)
				}
				return { result: {} }
			},

			delete_file_or_folder: async ({ uri, isRecursive }) => {
				await fileService.del(uri, { recursive: isRecursive })
				return { result: {} }
			},

			rewrite_file: async ({ uri, newContent }) => {
				await voidModelService.initializeModel(uri)
				if (this.commandBarService.getStreamState(uri) === 'streaming') {
					throw new Error(`Another LLM is currently making changes to this file. Please stop streaming for now and ask the user to resume later.`)
				}
				await editCodeService.callBeforeApplyOrEdit(uri)
				editCodeService.instantlyRewriteFile({ uri, newContent })
				// at end, get lint errors
				const lintErrorsPromise = Promise.resolve().then(async () => {
					await timeout(2000)
					const { lintErrors } = this._getLintErrors(uri)
					return { lintErrors }
				})
				return { result: lintErrorsPromise }
			},

			edit_file: async ({ uri, searchReplaceBlocks }) => {
				await voidModelService.initializeModel(uri)
				if (this.commandBarService.getStreamState(uri) === 'streaming') {
					throw new Error(`Another LLM is currently making changes to this file. Please stop streaming for now and ask the user to resume later.`)
				}
				await editCodeService.callBeforeApplyOrEdit(uri)
				editCodeService.instantlyApplySearchReplaceBlocks({ uri, searchReplaceBlocks })

				// at end, get lint errors
				const lintErrorsPromise = Promise.resolve().then(async () => {
					await timeout(2000)
					const { lintErrors } = this._getLintErrors(uri)
					return { lintErrors }
				})

				return { result: lintErrorsPromise }
			},
			// ---
			run_command: async ({ command, cwd, terminalId }) => {
				const { resPromise, interrupt } = await this.terminalToolService.runCommand(command, { type: 'temporary', cwd, terminalId })
				return { result: resPromise, interruptTool: interrupt }
			},
			run_persistent_command: async ({ command, persistentTerminalId }) => {
				const { resPromise, interrupt } = await this.terminalToolService.runCommand(command, { type: 'persistent', persistentTerminalId })
				return { result: resPromise, interruptTool: interrupt }
			},
			open_persistent_terminal: async ({ cwd }) => {
				const persistentTerminalId = await this.terminalToolService.createPersistentTerminal({ cwd })
				return { result: { persistentTerminalId } }
			},
			kill_persistent_terminal: async ({ persistentTerminalId }) => {
				// Close the background terminal by sending exit
				await this.terminalToolService.killPersistentTerminal(persistentTerminalId)
				return { result: {} }
			},
			xml_escape: async ({ uri, escapeAll }) => {
				await voidModelService.initializeModel(uri)
				const { model } = await voidModelService.getModelSafe(uri)
				if (model === null) { throw new Error(`No contents; File does not exist.`) }

				const originalContent = model.getValue(EndOfLinePreference.LF)
				const originalLength = originalContent.length

				let escapedContent: string
				let charactersEscaped = 0

				if (escapeAll) {
					// Escape all special characters
					escapedContent = originalContent
						.replace(/&/g, () => { charactersEscaped++; return '&amp;' })
						.replace(/</g, () => { charactersEscaped++; return '&lt;' })
						.replace(/>/g, () => { charactersEscaped++; return '&gt;' })
						.replace(/"/g, () => { charactersEscaped++; return '&quot;' })
						.replace(/'/g, () => { charactersEscaped++; return '&apos;' })
				} else {
					// Intelligent escaping: only escape text content, preserve tags
					// This is a simplified version - a full implementation would parse XML/HTML
					escapedContent = escapeXmlTextContent(originalContent, (count) => {
						charactersEscaped = count
					})
				}

				const escapedLength = escapedContent.length

				return { result: { escapedContent, originalLength, escapedLength, charactersEscaped } }
			},
			ask_user_question: async ({ questions, answers }) => {
				// This tool requires user interaction through the UI
				// The answers will be collected by the permission component and passed back
				// For now, we return the answers that were passed in
				// In a full implementation, this would trigger a UI prompt and wait for user response
				return { result: { answers } }
			},
			web_fetch: async ({ url, prompt }) => {
				// Use IPC channel to make request from main process with proxy support
				// This bypasses CORS restrictions and uses VSCode's proxy settings
				try {
					const channel = this.mainProcessService.getChannel('void-channel-webFetch')
					const result = await channel.call('fetch', { url, timeout: 30000 }) as {
						content: string
						statusCode: number
						url: string
					}

					// Truncate content if too long
					const maxContentLength = MAX_FILE_CHARS_PAGE
					if (result.content.length > maxContentLength) {
						result.content = result.content.substring(0, maxContentLength)
					}

					return { result }
				} catch (fetchError) {
					const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
					return { result: { content: `Failed to fetch URL: ${errorMessage}`, statusCode: 0, url } }
				}
			},
			todo_write: async ({ todos }) => {
				// Simply return the todos - they will be stored in the tool message history
				return { result: { todos } }
			},
			todo_read: async () => {
				// Find the latest todo_write result from the current thread's message history
				const todos = this._getLatestTodosFromHistory()
				return { result: { todos } }
			},
		}


		const nextPageStr = (hasNextPage: boolean) => hasNextPage ? '\n\n(more on next page...)' : ''

		const stringifyLintErrors = (lintErrors: LintErrorItem[]) => {
			return lintErrors
				.map((e, i) => `Error ${i + 1}:\nLines Affected: ${e.startLineNumber}-${e.endLineNumber}\nError message:${e.message}`)
				.join('\n\n')
				.substring(0, MAX_FILE_CHARS_PAGE)
		}

		// given to the LLM after the call for successful tool calls
		this.stringOfResult = {
			read_file: (params, result) => {
				return `${params.uri.fsPath}\n\`\`\`\n${result.fileContents}\n\`\`\`${nextPageStr(result.hasNextPage)}${result.hasNextPage ? `\nMore info because truncated: this file has ${result.totalNumLines} lines, or ${result.totalFileLen} characters.` : ''}`
			},
			ls_dir: (params, result) => {
				const dirTreeStr = stringifyDirectoryTree1Deep(params, result)
				return dirTreeStr // + nextPageStr(result.hasNextPage) // already handles num results remaining
			},
			get_dir_tree: (params, result) => {
				return result.str
			},
			search_pathnames_only: (params, result) => {
				return result.uris.map(uri => uri.fsPath).join('\n') + nextPageStr(result.hasNextPage)
			},
			search_for_files: (params, result) => {
				return result.uris.map(uri => uri.fsPath).join('\n') + nextPageStr(result.hasNextPage)
			},
			search_in_file: (params, result) => {
				const { model } = voidModelService.getModel(params.uri)
				if (!model) return '<Error getting string of result>'
				const lines = result.lines.map(n => {
					const lineContent = model.getValueInRange({ startLineNumber: n, startColumn: 1, endLineNumber: n, endColumn: Number.MAX_SAFE_INTEGER }, EndOfLinePreference.LF)
					return `Line ${n}:\n\`\`\`\n${lineContent}\n\`\`\``
				}).join('\n\n');
				return lines;
			},
			read_lint_errors: (params, result) => {
				return result.lintErrors ?
					stringifyLintErrors(result.lintErrors)
					: 'No lint errors found.'
			},
			// ---
			create_file_or_folder: (params, result) => {
				return `URI ${params.uri.fsPath} successfully created.`
			},
			delete_file_or_folder: (params, result) => {
				return `URI ${params.uri.fsPath} successfully deleted.`
			},
			edit_file: (params, result) => {
				const lintErrsString = (
					this.voidSettingsService.state.globalSettings.includeToolLintErrors ?
						(result.lintErrors ? ` Lint errors found after change:\n${stringifyLintErrors(result.lintErrors)}.\nIf this is related to a change made while calling this tool, you might want to fix the error.`
							: ` No lint errors found.`)
						: '')

				return `Change successfully made to ${params.uri.fsPath}.${lintErrsString}`
			},
			rewrite_file: (params, result) => {
				const lintErrsString = (
					this.voidSettingsService.state.globalSettings.includeToolLintErrors ?
						(result.lintErrors ? ` Lint errors found after change:\n${stringifyLintErrors(result.lintErrors)}.\nIf this is related to a change made while calling this tool, you might want to fix the error.`
							: ` No lint errors found.`)
						: '')

				return `Change successfully made to ${params.uri.fsPath}.${lintErrsString}`
			},
			run_command: (params, result) => {
				const { resolveReason, result: result_, } = result
				// success
				if (resolveReason.type === 'done') {
					return `${result_}\n(exit code ${resolveReason.exitCode})`
				}
				// normal command
				if (resolveReason.type === 'timeout') {
					return `${result_}\nTerminal command ran, but was automatically killed by CoderChat after ${MAX_TERMINAL_INACTIVE_TIME}s of inactivity and did not finish successfully. To try with more time, open a persistent terminal and run the command there.`
				}
				throw new Error(`Unexpected internal error: Terminal command did not resolve with a valid reason.`)
			},

			run_persistent_command: (params, result) => {
				const { resolveReason, result: result_, } = result
				const { persistentTerminalId } = params
				// success
				if (resolveReason.type === 'done') {
					return `${result_}\n(exit code ${resolveReason.exitCode})`
				}
				// bg command
				if (resolveReason.type === 'timeout') {
					return `${result_}\nTerminal command is running in terminal ${persistentTerminalId}. The given outputs are the results after ${MAX_TERMINAL_BG_COMMAND_TIME} seconds.`
				}
				throw new Error(`Unexpected internal error: Terminal command did not resolve with a valid reason.`)
			},

			open_persistent_terminal: (_params, result) => {
				const { persistentTerminalId } = result;
				return `Successfully created persistent terminal. persistentTerminalId="${persistentTerminalId}"`;
			},
			kill_persistent_terminal: (params, _result) => {
				return `Successfully closed terminal "${params.persistentTerminalId}".`;
			},
			xml_escape: (params, result) => {
				return `Successfully escaped ${result.charactersEscaped} characters in ${params.uri.fsPath}. Original length: ${result.originalLength}, Escaped length: ${result.escapedLength}.`
			},
			ask_user_question: (params, result) => {
				const answersStr = Object.entries(result.answers)
					.map(([header, answer]) => `${header}: ${Array.isArray(answer) ? answer.join(', ') : answer}`)
					.join('\n')
				return `User answers:\n${answersStr}`
			},
			web_fetch: (params, result) => {
				const truncatedSuffix = result.content.length >= MAX_FILE_CHARS_PAGE ? '\n\n(Content was truncated due to size limit)' : ''
				const statusStr = result.statusCode >= 200 && result.statusCode < 300
					? `Successfully fetched from ${result.url} (HTTP ${result.statusCode})`
					: `Failed to fetch from ${result.url} (HTTP ${result.statusCode})`
				return `${statusStr}\n\nFetched content:\n\`\`\`\n${result.content}${truncatedSuffix}\n\`\`\`\n\nPrompt for processing: ${params.prompt}`
			},
			todo_write: (_params, result) => {
				if (result.todos.length === 0) {
					return 'Todo list cleared successfully.'
				}
				const todosStr = result.todos.map((t, i) => {
					const priorityStr = t.priority ? ` [${t.priority}]` : ''
					return `${i + 1}. [${t.status}]${priorityStr} ${t.task}`
				}).join('\n')
				return `Todo list updated:\n${todosStr}`
			},
			todo_read: (_params, result) => {
				if (result.todos.length === 0) {
					return 'No todos found. The todo list is empty.'
				}
				const todosStr = result.todos.map((t, i) => {
					const priorityStr = t.priority ? ` [${t.priority}]` : ''
					return `${i + 1}. [${t.status}]${priorityStr} ${t.task}`
				}).join('\n')
				return `Current todo list:\n${todosStr}`
			},
		}



	}

	/**
	 * Get the latest todos from the current thread's message history
	 * This ensures todos persist across sessions and are visible in history
	 */
	private _getLatestTodosFromHistory(): TodoItem[] {
		try {
			// Use instantiationService to get IChatThreadService lazily to avoid circular dependency
			const chatThreadService = this.instantiationService.invokeFunction(accessor => accessor.get(IChatThreadService))
			const thread = chatThreadService.getCurrentThread()
			const messages = thread.messages

			// Iterate backwards through messages to find the most recent todo_write success
			for (let i = messages.length - 1; i >= 0; i--) {
				const message = messages[i]

				// Check if this is a tool message
				if (message.role === 'tool' && message.name === 'todo_write' && message.type === 'success') {
					const result = (message as { result: unknown }).result
					if (result && typeof result === 'object' && 'todos' in result) {
						return (result as { todos: TodoItem[] }).todos
					}
				}
			}
		} catch (e) {
			// If we can't get the current thread, return empty array
		}

		return []
	}

	private _getLintErrors(uri: URI): { lintErrors: LintErrorItem[] | null } {
		const lintErrors = this.markerService
			.read({ resource: uri })
			.filter(l => l.severity === MarkerSeverity.Error || l.severity === MarkerSeverity.Warning)
			.slice(0, 100)
			.map(l => ({
				code: typeof l.code === 'string' ? l.code : l.code?.value || '',
				message: (l.severity === MarkerSeverity.Error ? '(error) ' : '(warning) ') + l.message,
				startLineNumber: l.startLineNumber,
				endLineNumber: l.endLineNumber,
			} satisfies LintErrorItem))

		if (!lintErrors.length) return { lintErrors: null }
		return { lintErrors, }
	}


}

registerSingleton(IToolsService, ToolsService, InstantiationType.Eager);
