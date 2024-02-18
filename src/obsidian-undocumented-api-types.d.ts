import "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById: (commandId: string) => void;
		};
		isMobile: boolean;
		plugins: {
			enablePlugin: (pluginId: string) => void;
		}
	}
	interface Vault {
		getConfig: (key: string) => string | boolean;
	}
	interface WorkspaceSidedock {
		setSize: (size: number) => void;
	}
}
