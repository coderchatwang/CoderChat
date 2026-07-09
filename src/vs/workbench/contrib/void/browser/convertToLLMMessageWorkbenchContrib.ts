/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { IVoidModelService } from '../common/voidModelService.js';
import { ISkillService } from '../common/skillService.js';

class ConvertContribWorkbenchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.void.convertcontrib'
	_serviceBrand: undefined;

	constructor(
		@IVoidModelService private readonly voidModelService: IVoidModelService,
		@IWorkspaceContextService private readonly workspaceContext: IWorkspaceContextService,
		@ISkillService private readonly skillService: ISkillService,
	) {
		super()

		const initializeURI = (uri: URI) => {
			this.workspaceContext.getWorkspace()
			// Initialize .voidrules file
			const voidRulesURI = URI.joinPath(uri, '.voidrules')
			this.voidModelService.initializeModel(voidRulesURI)
			// Initialize AGENTS.md file (same function as .voidrules, for compatibility with common conventions)
			const agentsMdURI = URI.joinPath(uri, 'AGENTS.md')
			this.voidModelService.initializeModel(agentsMdURI)
			// Ensure .gitignore contains .coderchat-editor/
			this.skillService.ensureGitignore(uri)
		}

		// call
		this._register(this.workspaceContext.onDidChangeWorkspaceFolders((e) => {
			[...e.changed, ...e.added].forEach(w => { initializeURI(w.uri) })
		}))
		this.workspaceContext.getWorkspace().folders.forEach(w => { initializeURI(w.uri) })
	}
}


registerWorkbenchContribution2(ConvertContribWorkbenchContribution.ID, ConvertContribWorkbenchContribution, WorkbenchPhase.BlockRestore);
