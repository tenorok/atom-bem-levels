'use babel';

import path from 'path';
import { $, SelectListView } from 'atom-space-pen-views';
import bemWalk from 'bem-walk';
import BemConfig from 'bem-config';

const levelMap = BemConfig().levelMapSync();

export default class BemLevelsView extends SelectListView {
    inputThrottle = 100

    initialize() {
        super.initialize();

        this.addClass('bem-levels');

        this.panel = atom.workspace.addModalPanel({ item: this });
        this.projectPaths = atom.project.getPaths();
    }

    viewForItem(item) {
        return `<li>${item}</li>`;
    }

    confirmed(item) {
        atom.workspace.open(item);
    }

    cancelled() {
        this.panel.hide();
    }

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

        let query = this.getFilterQuery();
        bemWalk(this._levels, { levels: levelMap })
            .on('data', file => {
                const block = file.entity.block;

                if (block === query) {
                    let relativePath = this.getRelativePath(file.path);
                    let itemView = $(this.viewForItem(relativePath));
                    itemView.data('select-list-item', relativePath);
                    this.list.append(itemView);
                }
            })
            .on('end', () => {
                this.setLoading();
                this._lastQuery = query;
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
