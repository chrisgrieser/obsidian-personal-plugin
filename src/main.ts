import { MarkdownView, Plugin } from "obsidian";

export default class PseudometaPersonalPlugin extends Plugin {
	statusbar?: HTMLElement;

	override onload() {
		console.info(this.manifest.name + " Plugin loaded.");

		// statusbar initialization
		this.statusbar = this.addStatusBarItem();
		this.setSpellcheckStatusbar();

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
	setSpellcheckStatusbar(state?: "ON" | "OFF") {
		const spellcheckOn = this.app.vault.getConfig("spellcheck");
		if (!state) state = spellcheckOn ? "ON" : "OFF";
		const text = state === "ON" ? "✓" : "";
		this.statusbar?.setText(text);
	}

	switchWhenWritingOrLongformNote() {
		// determine if longform note or writing css class
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) return;
		const isLongformNote = activeView.containerEl.hasClass("longform-leaf");
		const fm = this.app.metadataCache.getFileCache(activeView.file)?.frontmatter;
		const writingCssclass =
			// biome-ignore lint/complexity/useLiteralKeys: required, as index class
			fm && (fm["cssclass"] || fm["cssclasses"] || []).includes("writing");

		// ACTIONS
		this.toggleSpellcheck(isLongformNote || writingCssclass);
		this.toggleSidebars(isLongformNote);
	}

	// spellcheck ON if longform/writing, OFF otherwise
	toggleSpellcheck(isWritingOrLongformNote: boolean) {
		const spellcheckOn = this.app.vault.getConfig("spellcheck");
		if (isWritingOrLongformNote && !spellcheckOn) {
			this.app.commands.executeCommandById("editor:toggle-spellcheck");
			this.setSpellcheckStatusbar("ON");
		} else if (!isWritingOrLongformNote && spellcheckOn) {
			this.app.commands.executeCommandById("editor:toggle-spellcheck");
			this.setSpellcheckStatusbar("OFF");
		}
	}

	toggleSidebars(isLongform: boolean) {
		if (isLongform) {
		} else {
		}
	}
}
