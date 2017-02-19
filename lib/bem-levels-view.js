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

    /**
     * @param {string[]} levels - absolute paths to levels with blocks
     */
    show(levels) {
        this._levels = levels;
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
        let disposables = new CompositeDisposable();
        // TODO: Stop the previous stream when starting a new.
        return bemWalk(this._levels, { levels: levelMap })
            .on('data', (file) => {
                const block = file.entity.block;

                if (block === query) {
                    let relativePath = this.getRelativePath(file.path);
                    let itemView = $(this.viewForItem(relativePath));
                    itemView.data('select-list-item', relativePath);

                    const fileIcon = itemView.find('.icon')[0];
                    disposables.add(this._addIcon(fileIcon, relativePath));

                    this.list.append(itemView);
                    list.push(relativePath);
                }
            })
            // TODO: Handle an errors.
            .on('end', () => {
                this.setLoading();
                this._lastQuery = query;
                this._lastList = list;
                disposables.dispose();
            });
    }

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
