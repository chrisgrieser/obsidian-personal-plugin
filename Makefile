.PHONY: build init format release

# build & open dev-vault (if on macOS)
build:
	VAULT_NAME="Development" ; \
	node esbuild.config.mjs && \
	if [[ "$$OSTYPE" =~ darwin* ]] ; then open "obsidian://open?vault=$$VAULT_NAME" ; fi

# assumes `$VAULT_PATH` is set, e.g. in `.zshenv`
# and that the advanced URI plugin is installed
transfer-to-regular-vault:
	vault_name="$$(basename "$$VAULT_PATH")" && \
	plugin_path="$$VAULT_PATH/.obsidian/plugins/my-personal-plugin" && \
	node esbuild.config.mjs &>/dev/null && \
	cp -f "main.js" "$$plugin_path" && cp -f "manifest.json" "$$plugin_path" && \
	echo "Plugin transferred to regular vault." && \
	if [[ "$$OSTYPE" =~ darwin* ]] ; then open "obsidian://advanced-uri?vault=$$vault_name&commandid=app%253Areload" ; fi

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
