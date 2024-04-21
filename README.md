<!-- vale Google.FirstPerson = NO -->
<!-- LTeX: enabled=false -->
# pseudometa personal plugin
<!-- LTeX: enabled=true -->

Personal Obsidian plugin, containing features customized to my workflow. Do not
expect this plugin to get published. The only reason this is public is so that I
can reference code snippets from it.

## Features
- Auto-spellcheck: When in [longform](https://obsidian.md/plugins?id=longform)
  note or in note has cssclass `writing`, toggles spellcheck **on**, otherwise **off**.
- Status bar item indicating is spellcheck is active.
- Lazy-loads a few "writing-only" plugins only when entering a writing or
  longform note.
- When in [longform](https://obsidian.md/plugins?id=longform)
  note, open the longform sidebar pane. Otherwise, open the
  outgoing-links-sidebar. Also sets specific sizes for the panes.
- Lazy-loads further plugins after a certain delay.

## Settings
The settings for this plugin are saved as yaml file in the users vault, so they
are stored independently of this plugin repo (where a `data.json` would be
stored). The location is hard-coded as `Meta/personal-plugin-settings.yml`.

The yaml file should look like this:

```yml
rightSidebar:
  isLongform:
    leafToOpen: explorerView # = longform pane
    widthPx: 320
    flexGrowHeight: [1, 5] # ratio of pane heights, top to bottom (css flex-grow)
  notLongform:
    leafToOpen: bookmarks
    widthPx: 250
    flexGrowHeight: [3.5, 1]

lazyload:
  delaySecs: 5
  delayedPlugins:
    - obsidian-auto-link-title
  inWritingNotesPlugins:
    - obsidian-footnotes
```
