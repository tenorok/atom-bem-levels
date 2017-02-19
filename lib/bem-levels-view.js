'use babel';

import path from 'path';
import { CompositeDisposable } from 'atom';
import { $, SelectListView } from 'atom-space-pen-views';
import bemWalk from 'bem-walk';
import BemConfig from 'bem-config';

const levelMap = BemConfig().levelMapSync();

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

        if (this._lastQuery) {
            this.filterEditorView.setText(this._lastQuery);
        }

        this.panel.show();
        this.focusFilterEditor();
    }

    populateList() {
        this.setLoading(' ');
        this.list.empty();

        let list = [];
        let query = this.getFilterQuery();
        let tech = query.split('.').slice(1).join('.');
        let entityName = path.basename(query, '.' + tech);
        let disposables = new CompositeDisposable();
        // TODO: Stop the previous stream when starting a new.
        return bemWalk(this._levels, { levels: levelMap })
            .on('data', (file) => {
                if (
                    (tech && file.tech !== tech) ||
                    (file.entity.block !== entityName)
                ) {
                    return;
                }

                let itemView = $(this.viewForItem(this.getRelativePath(file.level)));

                let relativePath = this.getRelativePath(file.path);
                itemView.data('select-list-item', relativePath);

                const fileIcon = itemView.find('.icon')[0];
                disposables.add(this._addIcon(fileIcon, relativePath));

                this.list.append(itemView);
                list.push(relativePath);
            })
            // TODO: Handle an errors.
            .on('end', () => {
                this.setLoading();
                // TODO: Create option for caching result.
                // TODO: Create command for invalidate cache.
                this._lastQuery = query;
                this._lastList = list;
                disposables.dispose();
            });
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

    destroy() {
        this.panel.destroy();
    }
}
