.PHONY: init format release build-to-regular-vault

# assumes `$VAULT_PATH` is set, e.g. in `.zshenv`
# and that the advanced URI plugin is installed
build-to-regular-vault:
	vault_name="main-vault" && \
	plugin_path="$$HOME/main-vault/.obsidian/plugins/my-personal-plugin" && \
	node esbuild.config.mjs && \
	cp -f main.js manifest.json "$$plugin_path" && \
	open "obsidian://open?vault=$$vault_name" && \
	open "obsidian://advanced-uri?vault=$$vault_name&commandid=app%253Areload"

format:
	npx biome format --write "$$(git rev-parse --show-toplevel)"
	npx markdownlint-cli --fix --ignore="node_modules" "$$(git rev-parse --show-toplevel)"

check-all:
	zsh ./.githooks/pre-commit

check-tsc:
	npx tsc --noEmit --skipLibCheck --strict && echo "Typescript OK"

release:
	zsh ./.release.sh

# install dependencies, build, enable git hooks
init:
	npm install && \
	node esbuild.config.mjs ; \
	git config core.hooksPath .githooks
