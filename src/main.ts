import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from "obsidian";

export default class PseudometaPersonalPlugin extends Plugin {
	statusbar?: HTMLElement;
	lazyloadDone = false;

	override onload() {
		console.info(this.manifest.name + " Plugin loaded.");

		// statusbar initialization
		this.statusbar = this.addStatusBarItem();
		this.showSpellcheckIndicator();

		// longform or writing actions
		this.switchWhenWritingOrLongformNote();
		this.registerEvent(
			this.app.workspace.on("file-open", () => this.switchWhenWritingOrLongformNote()),
		);
	}

	override onunload() {
		console.info(this.manifest.name + " Plugin unloaded.");
	}

	//───────────────────────────────────────────────────────────────────────────

	// display ✓ if spellcheck is ON, nothing if OFF
	showSpellcheckIndicator(show?: boolean) {
		if (!show) show = this.app.vault.getConfig("spellcheck") as boolean;
		this.statusbar?.setText(show ? "✓" : "");
	}

	switchWhenWritingOrLongformNote() {
		// determine if longform note or writing css class
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) return;
		const isLongformNote = activeView.containerEl.hasClass("longform-leaf");
		const fm = this.app.metadataCache.getFileCache(activeView.file)?.frontmatter;
		const writingCssclass =
			// biome-ignore lint/complexity/useLiteralKeys: required, b/c index class
			fm && (fm["cssclass"] || fm["cssclasses"] || []).includes("writing");

		// ACTIONS
		this.toggleSpellcheck(isLongformNote || writingCssclass);
		this.toggleTabsInRightSidebar(isLongformNote);
		this.lazyloadWritingPlugins(isLongformNote || writingCssclass);
	}

	// spellcheck ON if longform/writing, OFF otherwise
	toggleSpellcheck(isWritingOrLongformNote: boolean) {
		const spellcheckOn = this.app.vault.getConfig("spellcheck");
		if (isWritingOrLongformNote && !spellcheckOn) {
			this.app.commands.executeCommandById("editor:toggle-spellcheck");
			this.showSpellcheckIndicator(true);
		} else if (!isWritingOrLongformNote && spellcheckOn) {
			this.app.commands.executeCommandById("editor:toggle-spellcheck");
			this.showSpellcheckIndicator(false);
		}
	}

	// open longform sidebars if longform, otherwise open outgoing links
	toggleTabsInRightSidebar(isLongform: boolean) {
		if (this.app.isMobile) return;

		// determine leaves in right sidebar
		const rightSplit = this.app.workspace.rightSplit;
		const rightRoot = rightSplit.getRoot();
		const rightSideLeaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((l) => {
			if (l.getRoot() === rightRoot) rightSideLeaves.push(l);
		});

		// open leaf and set size
		const leafToOpen = isLongform ? "explorerView" : "outgoingLink";
		const theLeaf = rightSideLeaves.find((l) => Object.keys(l.view).includes(leafToOpen));
		if (theLeaf) this.app.workspace.revealLeaf(theLeaf);
		else new Notice(`Could not find sidebar pane for "${leafToOpen}".`);
	}

	lazyloadWritingPlugins(isWritingOrLongformNote: boolean) {
		if (this.lazyloadDone || !isWritingOrLongformNote) return;

		// CONFIG
		const writingPlugins = [
			"nl-syntax-highlighting",
			"obsidian-textgenerator-plugin",
			"commentator",
			"obsidian-languagetool-plugin",
			"obsidian-dynamic-highlights",
			// not longform plugin, as its pane position is otherwise not saved correctly
		];

		// enable them all
		for (const pluginId of writingPlugins) {
			this.app.plugins.enablePlugin(pluginId);
		}

		// notify
		const pluginList = writingPlugins.map((p) => this.app.plugins.manifests[p]?.name || p);
		const msg = "Lazyloading writing plugins:\n- " + pluginList.join("\n- ");
		new Notice(msg, pluginList.length * 1000);

		this.lazyloadDone = true;
	}
}
