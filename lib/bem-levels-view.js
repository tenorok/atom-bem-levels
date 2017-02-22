'use babel';

import path from 'path';
import { CompositeDisposable } from 'atom';
import { $, SelectListView } from 'atom-space-pen-views';
import bemWalk from 'bem-walk';
import bemNaming from '@bem/naming';
import BemEntityName from '@bem/entity-name';

export default class BemLevelsView extends SelectListView {
    inputThrottle = 100

    initialize() {
        super.initialize();

        this.addClass('bem-levels');

        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        });
        this.projectPaths = atom.project.getPaths();

        this._lastQuery = '';
        this._lastTech = '';
        this._lastList = [];
    }

    /**
     * @param {string[]} levels - absolute paths to levels with blocks
     */
    setLevels(levels) {
        this._levels = levels;
    }

    /**
     * @param {Function} service - method from file-icons package
     * @see https://github.com/file-icons/atom/blob/v2.0.15/lib/service/icon-service.js#L30
     */
    setIconsService(service) {
        this._addIcon = service;
    }

    viewForItem(item) {
        return `
            <li>
                <div class="file icon">${item}</div>
            </li>`;
    }

    confirmed(item) {
        atom.workspace.open(item);
    }

    cancelled() {
        this.panel.hide();
    }

    show(levels) {
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

        let list = [];

        const query = this.getFilterQuery();
        const tech = query.split('.').slice(1).join('.');
        const entityName = path.basename(query, '.' + tech);
        const entityObj = bemNaming.parse(entityName);

        // When given not complete BEM-entity, nothing to do.
        if (!entityObj) { return; }

        const entity = new BemEntityName(entityObj);

        // TODO: Stop the previous stream when starting a new.
        return bemWalk(this._levels)
            .on('data', (file) => {
                if (tech && file.tech !== tech) { return; }

                const fileEntity = new BemEntityName(file.entity);
                if (!fileEntity.isEqual(entity)) { return; }

                list.push({
                    levelPath: file.level,
                    relativeLevelPath: this.getRelativePath(file.level),
                    filePath: this.getRelativePath(file.path)
                });
            })
            // TODO: Handle an errors.
            .on('end', () => {
                this.setLoading();
                this._lastQuery = query;
                this._lastTech = tech;
                this._lastList = this.sortFilesByLevels(list);
                this.showLastList();

                // TODO: Create option for caching result.
                // TODO: Create command for invalidate cache.
            });
    }

    showLastList() {
        const disposables = new CompositeDisposable();

        for (const fileInfo of this._lastList) {
            const itemView = $(this.viewForItem(fileInfo.relativeLevelPath));

            // TODO: Highlight current file in the list.

            itemView.data('select-list-item', fileInfo.filePath);

            // TODO: Set special icon for *.bemhtml.js
            const fileIcon = itemView.find('.icon')[0];
            disposables.add(this._addIcon(fileIcon, fileInfo.filePath));

            this.list.append(itemView);
        }

        disposables.dispose();
    }

    /**
     * Sort files accordance with project levels.
     * @param {Object[]} fileList
     * @returns {string[]}
     */
    sortFilesByLevels(fileList) {
        let sortedFiles = [];
        for (const levelPath of this._levels) {
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
     * Returns the path relative to the project on the basis of absolute path.
     * @param {string} absolutePath - absolute path to the directory or file
     * @returns {string}
     */
    getRelativePath(absolutePath) {
        for (let projectPath of this.projectPaths) {
            if (absolutePath.startsWith(projectPath)) {
                return path.relative(projectPath, absolutePath);
            }
        }
    }

    /**
     * Returns name of current open file in the editor.
     * Filters non-project files: dot-files, files without extension and other: json, yml, etc.
     * @returns {string}
     */
    getActiveFileName() {
        const activePanelItem = atom.workspace.getActivePaneItem();
        // Atom returns undefined when there are no open tabs.
        if (!activePanelItem) {
            return '';
        }

        const basename = path.basename(activePanelItem.buffer.file.path);
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

    destroy() {
        this.panel.destroy();
    }
}
