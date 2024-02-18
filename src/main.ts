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
		this.registerEvent(
			this.app.workspace.on("file-open", () => this.switchWhenWritingOrLongformNote()),
		);
		// delay due to longform plugin loading slowly, thus making the check
		// whether the not is a longform note delay
		setTimeout(() => this.switchWhenWritingOrLongformNote(), 2000);
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

	// lazy-load writing plugins, since they are only rarely used and also slow to load
	lazyloadWritingPlugins(isWritingOrLongformNote: boolean) {
		if (this.lazyloadDone || !isWritingOrLongformNote) return;

		// CONFIG
		const writingPlugins = [
			"nl-syntax-highlighting",
			"obsidian-textgenerator-plugin",
			"commentator",
			"obsidian-languagetool-plugin",
			"obsidian-footnotes",
			// INFO not longform plugin, as its pane position is otherwise not
			// saved correctly, and since it needs to be loaded to apply the
			// `longform-leaf` class, which in turn is needed to determine which
			// notes are longform notes
		];

		for (const pluginId of writingPlugins) {
			this.app.plugins.enablePlugin(pluginId);
		}
		new Notice("Writing plugins lazy-loaded.", 1000);
		this.lazyloadDone = true;
	}
}
