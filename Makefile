.PHONY: build init format release

# build & open dev-vault (if on macOS)
build:
	VAULT_NAME="Development" ; \
	node esbuild.config.mjs && \
	if [[ "$$OSTYPE" =~ darwin* ]] ; then open "obsidian://open?vault=$$VAULT_NAME" ; fi

# assumes `$VAULT_PATH` is set, e.g. in `.zshenv`
transfer-to-regular-vault:
	PLUGIN_PATH="$$VAULT_PATH/.obsidian/plugins/my-personal-plugin" && \
	node esbuild.config.mjs && \
	cp -f "main.js" "$$PLUGIN_PATH/main.js" && \
	cp -f "manifest.json" "$$PLUGIN_PATH/manifest.json"

format:
	npx biome format --write "$$(git rev-parse --show-toplevel)"
	npx markdownlint-cli --fix --ignore="node_modules" "$$(git rev-parse --show-toplevel)"

check:
	zsh ./.githooks/pre-commit

# install dependencies, build, enable git hooks
init:
	npm install && \
	node esbuild.config.mjs
	git config core.hooksPath .githooks
