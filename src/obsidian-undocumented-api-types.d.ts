import "obsidian";

declare module "obsidian" {
	interface App {
		statusBar: {
			containerEl: HTMLElement;
		};
		commands: {
			executeCommandById: (commandId: string) => void;
		};
	}
	interface Vault {
		getConfig: (key: string) => string | boolean;
	}
}
