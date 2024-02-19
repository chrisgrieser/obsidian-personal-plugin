import "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById: (commandId: string) => void;
		};
		isMobile: boolean;
		plugins: {
			enablePlugin: (pluginId: string) => void;
			manifests: Record<string, { name: string }>;
		};
	}
	interface Vault {
		getConfig: (key: string) => string | boolean;
	}
	interface WorkspaceSidedock {
		setSize: (size: number) => void;
		children: WorkspaceLeaf[];
	}
	interface WorkspaceLeaf {
		parent: WorkspaceLeaf | WorkspaceSidedock;
		setDimension: (percent: number) => void;
		id: string;
	}
}
