import {
	MarkdownView,
	Notice,
	Plugin,
	WorkspaceLeaf,
	WorkspaceSidedock,
	parseYaml,
} from "obsidian";

interface PluginSettings {
	rightSidebar?: {
		isLongform: {
			leafToOpen: string;
			widthPx: number;
			flexGrowHeight: number[];
		};
		notLongform: {
			leafToOpen: string;
			widthPx: number;
			flexGrowHeight?: number[];
		};
	};
	lazyload?: {
		notificationDisplaySecs: number; // zero to disable
		delaySecs: number;
		plugins: {
			delayed: string[];
			writing: string[];
		};
	};
}

// CONFIG
const SETTINGS_PATH = "Meta/personal-plugin-settings.yml";

//──────────────────────────────────────────────────────────────────────────────

// biome-ignore lint/style/noDefaultExport: required for Obsidian plugin
export default class PseudometaPersonalPlugin extends Plugin {
	statusbar = this.addStatusBarItem();
	writingLazyloadDone = false;
	config?: PluginSettings;

	override async onload() {
		console.info(this.manifest.name + " Plugin loaded.");

		// load settings from yaml
		try {
			this.config = parseYaml(await this.app.vault.adapter.read(SETTINGS_PATH));
		} catch (_error) {
			new Notice(`Could not load settings at ${SETTINGS_PATH}.`);
			return;
		}

		// statusbar: initialize & update on config change
		this.showSpellcheckIndicator();
		// @ts-ignore: undocumented event
		this.registerEvent(this.app.vault.on("config-changed", () => this.showSpellcheckIndicator()));

		// longform or writing actions
		this.registerEvent(
			this.app.workspace.on("file-open", () => this.switchWhenWritingOrLongformNote()),
		);
		// `resize` event as it is triggered when the right sidebar is toggled
		this.registerEvent(
			this.app.workspace.on("resize", () => this.switchWhenWritingOrLongformNote()),
		);

		// delay due to longform plugin loading slowly, thus making the check
		// whether the note is a longform note failing if loading too early
		this.app.workspace.onLayoutReady(() => {
			setTimeout(() => this.switchWhenWritingOrLongformNote(), 2000);

			const delaySecs = this.config?.lazyload?.delaySecs ?? 5;
			setTimeout(() => this.loadPlugins("delayed"), delaySecs * 1000);
		});
	}

	override onunload() {
		console.info(this.manifest.name + " Plugin unloaded.");
	}

	//───────────────────────────────────────────────────────────────────────────

	// display "✓" icon if spellcheck is ON, and nothing if OFF
	showSpellcheckIndicator() {
		const show = this.app.vault.getConfig("spellcheck") as boolean;
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
	toggleSpellcheck(isWritingOrLongform: boolean) {
		const spellcheckOn = this.app.vault.getConfig("spellcheck");
		if ((isWritingOrLongform && !spellcheckOn) || (!isWritingOrLongform && spellcheckOn)) {
			this.app.commands.executeCommandById("editor:toggle-spellcheck");
		}
	}

	// open longform sidebars if longform, otherwise open outgoing links
	toggleTabsInRightSidebar(isLongform: boolean) {
		// GUARD not when right sidebar is hidden or on mobile
		if (this.app.workspace.rightSplit.collapsed || this.app.isMobile) return;

		// determine the correct config
		const sidebarConf = this.config?.rightSidebar;
		if (!sidebarConf) {
			new Notice('"rightSidebar" not configured in plugin settings.');
			return;
		}
		const conf = sidebarConf[isLongform ? "isLongform" : "notLongform"];

		// determine leaves in right sidebar
		const rightSplit = this.app.workspace.rightSplit as WorkspaceSidedock;
		const rightRoot = rightSplit.getRoot();
		const rightSideLeaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((l) => {
			if (l.getRoot() === rightRoot) rightSideLeaves.push(l);
		});

		// open leaf
		const leafToOpen = conf.leafToOpen;
		if (!leafToOpen) {
			new Notice('"leafToOpen" not configured in plugin settings.');
			return;
		}
		const theLeaf = rightSideLeaves.find((l) => {
			const communityPluginLeaf = Object.keys(l.view).includes(leafToOpen);
			const corePluginLeaf = l.view?.plugin?.id === leafToOpen;
			return communityPluginLeaf || corePluginLeaf;
		});
		if (!theLeaf) {
			new Notice(`Could not find sidebar pane for "${leafToOpen}".`);
			return;
		}
		this.app.workspace.revealLeaf(theLeaf);

		// set size
		const widthPx = conf.widthPx;
		if (!widthPx) {
			new Notice('"widthPx" not configured in plugin settings.');
			return;
		}
		rightSplit.setSize(widthPx);

		const flexGrowHeight = conf.flexGrowHeight;
		if (!flexGrowHeight) {
			new Notice('"flexGrowHeight" not configured in plugin settings.');
			return;
		}
		for (let i = 0; i < rightSplit.children.length; i++) {
			const tabgroup = rightSplit.children[i];
			tabgroup?.setDimension(flexGrowHeight[i] || 1);
		}
	}

	//───────────────────────────────────────────────────────────────────────────

	loadPlugins(whichList: "writing" | "delayed") {
		const config = this.config?.lazyload?.plugins;
		if (!config) return;
		const pluginList = config[whichList];
		if (!pluginList) {
			new Notice(`"lazyload.plugins.${whichList}" not configured in plugin settings.`);
			return;
		}

		for (const pluginId of pluginList) {
			this.app.plugins.enablePlugin(pluginId);
		}

		const displayDuration = (this.config?.lazyload?.notificationDisplaySecs ?? 2) * 1000;
		if (displayDuration > 0) {
			new Notice(`${pluginList.length} ${whichList} plugins lazy-loaded.`, displayDuration);
		}
	}

	lazyloadWritingPlugins(isWritingOrLongformNote: boolean) {
		if (this.writingLazyloadDone || !isWritingOrLongformNote) return;
		this.loadPlugins("writing");
		this.writingLazyloadDone = true;
	}
}
