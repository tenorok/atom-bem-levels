'use babel';

// @flow

import path from 'path';
import BemLevelsView from './bem-levels-view';
import { CompositeDisposable } from 'atom';

export default {
    bemLevelsView: null,
    subscriptions: null,

    activate() {
        this.bemLevelsView = new BemLevelsView();
        this.subscriptions = new CompositeDisposable();

        // Waiting on plugin 'local-config' initialization for taking project configuration.
        atom.packages.onDidActivatePackage((packageInfo) => {
            if (packageInfo.name === 'local-config') {
                this._onLocalConfigActivate();
            }
        });
    },

    _onLocalConfigActivate() {
        const configLevels = atom.config.get('bem-levels.levels');
        const projectPaths = atom.project.getPaths();

        this.bemLevelsView.setTargetTechs(atom.config.get('bem-levels.targetTechs'));

        for (const project in configLevels) {
            if (!configLevels.hasOwnProperty(project)) { continue; }

            let absoluteLevels = [];
            for (const projectPath of projectPaths) {
                for (const levelName of configLevels[project]) {
                    absoluteLevels.push(path.join(projectPath, levelName));
                }
            }

            this.bemLevelsView.setLevels(project, absoluteLevels);

            this.subscriptions.add(atom.commands.add('atom-workspace', {
                // Lazy initing is impossible, because 'activationCommands' can store only static names.
                [`bem-levels:${project}`]: () => {
                    this.bemLevelsView.show(project);
                }
            }));
        }
    },

    deactivate() {
        this.bemLevelsView.destroy();
        this.subscriptions.dispose();
    },

    consumeElementIcons(service /*:typeof fileIcons$addIconToElement*/) {
        this.bemLevelsView.setIconsService(service);
    }
};
