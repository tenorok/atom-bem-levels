'use babel';

// @flow

/*::
type fileInfo = {
    levelPath: string,
    relativeLevelPath: string,
    filePath: string,
    relativeFilePath: string,
    fileName: string
};

type BemWalk$File = {
    entity: {
        block: string,
        elem?: string,
        modName?: string,
        modVal?: string
    },
    level: string,
    path: string,
    tech: string
};
 */

import path from 'path';
import { CompositeDisposable } from 'atom';
import { $, SelectListView } from 'atom-space-pen-views';
import bemWalk from '@bem/walk';
import bemNaming from '@bem/naming';
import BemEntityName from '@bem/entity-name';

export default class BemLevelsView extends SelectListView {
    inputThrottle /*:number*/ = 100;

    _levels /*:{ [string]: string[] }*/ = {};
    _lastQuery /*:string*/ = '';
    _lastTech /*:string*/ = '';
    _lastList /*:fileInfo[]*/ = [];
    _lastWalk /*:stream$Readable*/;
    _lastProject /*:string*/ = '';
    _targetTechs /*:RegExp*/;

    initialize() {
        super.initialize();

        this.addClass('bem-levels');

        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        });
        this.projectPaths = atom.project.getPaths();
    }

    /**
     * Set absolute paths to levels with blocks by project.
     */
    setLevels(project /*:string*/, levels /*:string[]*/) {
        this._levels[project] = levels;
    }

    /**
     * Set techs of files for searching.
     */
    setTargetTechs(targetTechs /*:string*/) {
        this._targetTechs = new RegExp(targetTechs);
    }

    setIconsService(service /*:typeof fileIcons$addIconToElement*/) {
        this._addIcon = service;
    }

    viewForItem(fileInfo /*:fileInfo*/) {
        return `
            <li>
                <span class="file icon">${fileInfo.relativeLevelPath}</span>
                <span class="bem-levels__filename">${fileInfo.fileName}</span>
            </li>`;
    }

    viewForActiveItem(fileInfo /*:fileInfo*/) {
        fileInfo.relativeLevelPath = `<b>${fileInfo.relativeLevelPath}</b>`;
        return this.viewForItem(fileInfo);
    }

    confirmed(item /*:string*/) {
        atom.workspace.open(item);
    }

    cancelled() {
        this.panel.hide();
    }

    show(project /*:string*/) {
        this._lastProject = project;
        this.setLoading();

        const activeFileName = this.getActiveFileName();
        if (activeFileName) {
            this.filterEditorView.setText(activeFileName);
        } else if (this._lastQuery) {
            this.filterEditorView.setText(this._lastQuery);
        }

        this.panel.show();
        this.focusFilterEditor();
    }

    populateList() {
        this.setLoading(' ');
        this.list.empty();

        let list /*:fileInfo[]*/ = [];

        const query = this.getFilterQuery();
        const tech = query.split('.').slice(1).join('.');
        const entityName = path.basename(query, '.' + tech);
        const entityObj = bemNaming.parse(entityName);

        // When given not complete BEM-entity, nothing to do.
        if (!entityObj) { return; }

        const entity = new BemEntityName(entityObj);

        // TODO: Stop the previous stream when starting a new when it will be possible.
        // https://github.com/bem-sdk/bem-walk/issues/14#issuecomment-283458157
        return this._lastWalk = bemWalk(this._levels[this._lastProject])
            .on('data', (file /*:BemWalk$File*/) => {
                if (tech && file.tech !== tech) { return; }

                const fileEntity = new BemEntityName(file.entity);
                if (!fileEntity.isEqual(entity)) { return; }

                if (!file.tech.match(this._targetTechs)) { return; }

                list.push({
                    levelPath: file.level,
                    relativeLevelPath: this.getRelativePath(file.level),
                    filePath: file.path,
                    relativeFilePath: this.getRelativePath(file.path),
                    fileName: path.basename(file.path)
                });
            })
            .on('error', (err /*:ErrnoError*/) => {
                atom.notifications.addError('bem-levels', {
                    description: err.message
                });
            })
            .on('end', () => {
                this.setLoading();
                this._lastQuery = query;
                this._lastTech = tech;
                this._lastList = this.sortFilesByLevels(list);
                this.showLastList();
            });
    }

    showLastList() {
        const disposables = new CompositeDisposable();
        const activeFilePath = this.getActiveFilePath();

        for (const fileInfo of this._lastList) {
            const itemView = activeFilePath && activeFilePath === fileInfo.filePath
                ? $(this.viewForActiveItem(fileInfo))
                : $(this.viewForItem(fileInfo));

            const fileIcon = itemView.find('.icon')[0];
            disposables.add(this._addIcon(fileIcon, this.getExtForIcon(fileInfo.relativeFilePath)));

            itemView.data('select-list-item', fileInfo.relativeFilePath);
            this.list.append(itemView);
        }

        disposables.dispose();
    }

    /**
     * Get extension for icon.
     * For visible difference in icons list, replace BEM-specific files extensions to other.
     */
    getExtForIcon(filePath /*:string*/) /*:string*/ {
        const customExtensions = {
            '.deps.js': '.apib',
            '.bemhtml.js': '.bemjson.js',
            '.priv.js': '.node'
        };

        for (const ext in customExtensions) {
            if (customExtensions.hasOwnProperty(ext) && filePath.endsWith(ext)) {
                return customExtensions[ext];
            }
        }

        return filePath;
    }

    /**
     * Sort files accordance with project levels.
     */
    sortFilesByLevels(fileList /*:fileInfo[]*/) /*:fileInfo[]*/ {
        let sortedFiles = [];
        for (const levelPath of this._levels[this._lastProject]) {
            for (const fileInfo of fileList) {
                if (fileInfo.levelPath === levelPath) {
                    sortedFiles.push(fileInfo);
                    if (this._lastTech) { break; }
                }
            }
        }
        return sortedFiles;
    }

    /**
     * Get path relative to the project on the basis of absolute path.
     */
    getRelativePath(absolutePath /*:string*/) /*:string*/ {
        for (let projectPath of this.projectPaths) {
            if (absolutePath.startsWith(projectPath)) {
                return path.relative(projectPath, absolutePath);
            }
        }
        return '';
    }

    /**
     * Get name of current open file in the editor.
     * Filters non-project files: dot-files, files without extension and other: json, yml, etc.
     */
    getActiveFileName() /*:string*/ {
        const activeFilePath = this.getActiveFilePath();
        if (!activeFilePath) {
            return '';
        }

        const basename = path.basename(activeFilePath);
        let ext = basename.split('.').slice(1).join('.');

        // Detection dot-files.
        if ('.' + ext === basename) {
            ext = '';
        }

        const exceptionalExts = [
            '',
            'json',
            'cson',
            'md',
            'yml',
            'yaml',
            'conf',
            'lock',
            'properties'
        ];

        if (~exceptionalExts.indexOf(ext)) {
            return '';
        }

        return basename;
    }

    getActiveFilePath() /*:string*/ {
        const activePanelItem = atom.workspace.getActivePaneItem();
        // Atom returns undefined when there are no open tabs.
        // Buffer contain a TextBuffer which present only in text files.
        if (!activePanelItem || !activePanelItem.buffer) {
            return '';
        }

        return activePanelItem.buffer.file.path;
    }

    destroy() {
        this.panel.destroy();
    }
}
