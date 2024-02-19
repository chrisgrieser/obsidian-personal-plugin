<!-- LTeX: enabled=false -->
# pseudometa personal plugin
<!-- LTeX: enabled=true -->

<!-- vale Google.FirstPerson = NO -->
Personal Obsidian plugin, containing features customized to my workflow. Do not
expect this plugin to get published. The only reason this is public is so that I
can reference code snippets from it.

## Features
- Auto-Spellcheck: When in [longform](https://obsidian.md/plugins?id=longform)
  note or in note has cssclass `writing`, toggles spellcheck **on**, otherwise **off**.
- Status bar item indicating is spellcheck is active.
- Lazy-loads a few "writing-only" plugins only when entering a writing or
  longform note (Language Tools, Commentary, Text Generator, Natural Language
  Syntax Highlighting).
- When in [longform](https://obsidian.md/plugins?id=longform)
  note, open the longform sidebar pane. Otherwise, open the
  outgoing-links-sidebar. Also sets specific sizes for the panes.

## Settings
The settings for this plugin are saved as yaml file in the users vault, so they
are stored independently of this plugin repo (where a `data.json` would be
stored). The location is hard-coded as `Meta/personal-plugin-settings.yml`.

The yaml file should look like this:

```yml
rightSidebar:
  isLongform:
    leafToOpen: explorerView # = longform pane
    widthPx: 280
    flexGrowHeight: [1, 5] # ratio of pane heights, top to bottom (css flex-grow)
  notLongform:
    leafToOpen: outgoingLink
    widthPx: 250
    flexGrowHeight: [3, 2]

writingPlugins:
  - nl-syntax-highlighting
  - obsidian-textgenerator-plugin
  - commentator
  - obsidian-languagetool-plugin
  - better-word-count
  - obsidian-footnotes
  # INFO not longform plugin, as its pane position is otherwise not
  # saved correctly, and since it needs to be loaded to apply the
  # `longform-leaf` class, which in turn is needed to determine which
  # notes are longform notes
```
