import {
	MarkdownView,
	Notice,
	Plugin,
	WorkspaceLeaf,
	WorkspaceSidedock,
	parseYaml,
} from "obsidian";

interface PseudometaPersonalPluginSettings {
	rightSidebar: {
		isLongform: {
			leafToOpen: string;
			widthPx: number;
			flexGrowHeight: number[];
		};
		notLongform: {
			leafToOpen: string;
			widthPx: number;
			flexGrowHeight: number[];
		};
	};
	writingPlugins: string[];
}

// CONFIG
const SETTINGS_PATH = "Meta/personal-plugin-settings.yml";

//──────────────────────────────────────────────────────────────────────────────

export default class PseudometaPersonalPlugin extends Plugin {
	statusbar?: HTMLElement;
	lazyloadDone = false;
	config?: PseudometaPersonalPluginSettings;

	override async onload() {
		console.info(this.manifest.name + " Plugin loaded.");

		try {
			this.config = parseYaml(await this.app.vault.adapter.read(SETTINGS_PATH));
		} catch (_error) {
			new Notice(`Could not load settings at ${SETTINGS_PATH}.`);
			return;
		}

		// statusbar initialization
		this.statusbar = this.addStatusBarItem();
		this.showSpellcheckIndicator();

		// longform or writing actions
		this.registerEvent(
			this.app.workspace.on("file-open", () => this.switchWhenWritingOrLongformNote()),
		);
		// delay due to longform plugin loading slowly, thus making the check
		// whether the note is a longform note failing if loading too early
		setTimeout(() => this.switchWhenWritingOrLongformNote(), 2500);
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
		const conf = this.config?.rightSidebar;
		if (!conf) return;

		// determine leaves in right sidebar
		const rightSplit = this.app.workspace.rightSplit as WorkspaceSidedock;
		const rightRoot = rightSplit.getRoot();
		const rightSideLeaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((l) => {
			if (l.getRoot() === rightRoot) rightSideLeaves.push(l);
		});

		// open leaf
		const leafToOpen = conf[isLongform ? "isLongform" : "notLongform"].leafToOpen;
		const theLeaf = rightSideLeaves.find((l) => Object.keys(l.view).includes(leafToOpen));
		if (!theLeaf) {
			new Notice(`Could not find sidebar pane for "${leafToOpen}".`);
			return;
		}
		this.app.workspace.revealLeaf(theLeaf);

		// set size
		const widthPx = conf[isLongform ? "isLongform" : "notLongform"].widthPx;
		rightSplit.setSize(widthPx);

		const flexGrowHeight = conf[isLongform ? "isLongform" : "notLongform"].flexGrowHeight;
		for (let i = 0; i < rightSplit.children.length; i++) {
			const tabgroup = rightSplit.children[i];
			tabgroup?.setDimension(flexGrowHeight[i] || 1);
		}
	}

	// lazy-load writing plugins, since they are only rarely used and also slow to load
	lazyloadWritingPlugins(isWritingOrLongformNote: boolean) {
		if (this.lazyloadDone || !isWritingOrLongformNote) return;
		const writingPlugins = this.config?.writingPlugins;
		if (!writingPlugins) return;

		for (const pluginId of writingPlugins) {
			this.app.plugins.enablePlugin(pluginId);
		}
		new Notice("Writing plugins lazy-loaded.", 1000);
		this.lazyloadDone = true;
	}
}
