# Bem-levels package for Atom

[![apm](https://img.shields.io/apm/v/bem-levels.svg?style=flat-square)](https://atom.io/packages/bem-levels)

Handy search BEM-entities from project levels for Atom.

[Atom](https://atom.io/) is a text editor for development.

[BEM](https://en.bem.info) is a component-based approach for web development.

![Bem-levels in action](https://github.com/tenorok/atom-bem-levels/raw/master/preview.gif)

## Features

* Sorting files in the order of project levels.
* Search any BEM-entities in any technologies.
* Search BEM-entity in specified technology.
* Autofilling search field by:
  * name of current active file and highlighting it in the list;
  * last search query when the current active file does not relate with project.
* Support the groups (multiple sets of project levels).

## Usage

### Step 1: Install

```
› apm install bem-levels
```

### Step 2: Configuring project levels

Unfortunately, now Atom has no built-in mechanism for [per-project config settings](https://github.com/atom/atom/issues/5168). Because of this reason bem-levels use [package local-config](https://atom.io/packages/local-config) for store information about project levels.

Format of local config similar to the [Atom global configuration settings](http://flight-manual.atom.io/using-atom/sections/basic-customization/#global-configuration-settings).

Example of `.atom.cson` in project root:

```cson
"*":
  'bem-levels':
    'touch': [
      'lib1/common.blocks/'
      'lib1/touch.blocks/'
      'lib2/touch.blocks/'
      'common.blocks/'
      'touch.blocks/'
    ]
```

In example above specified that for any file (`*`), package `bem-levels` has group `touch`, which consists of levels list.

### Step 3: Setting up key bindings

We already can use bem-levels by invoke command-palette with `shift-cmd-p` shortcut, then type "Bem Levels: Touch" and press enter. This sequence of actions each time can be tedious. Atom allows to [customize key bindings](http://flight-manual.atom.io/using-atom/sections/basic-customization/#customizing-keybindings).

Example of `~/.atom/keymap.cson`:
```cson
'atom-workspace':
  'shift-cmd-i': 'bem-levels:touch'
```

## Development details

### Install

```
› git clone https://github.com/tenorok/atom-bem-levels.git
› cd atom-bem-levels
› npm install
› apm link
```

### Used packages

Package [@bem/walk](https://github.com/bem-sdk/bem-walk) used for work with BEM file structure. Packages [@bem/naming](https://github.com/bem-sdk/bem-naming) and [@bem/entity-name](https://github.com/bem-sdk/bem-entity-name) used for work with BEM entities.

Atom package [file-icons](https://atom.io/packages/file-icons) used for create file icons to list.

For run tests used [mocha](https://mochajs.org) and [chai with assert style](http://chaijs.com/api/assert/).

Also used [flowtype with comment syntax](https://flowtype.org/blog/2015/02/20/Flow-Comments.html) for type checking on precommit hook.
