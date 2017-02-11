'use babel';

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
        const config = atom.config.get('bem-levels');
        const projectPaths = atom.project.getPaths();

        for (let project in config) {
            if (!config.hasOwnProperty(project)) { continue; }

            let absoluteLevels = [];
            for (let projectPath of projectPaths) {
                for (let levelName of config[project]) {
                    absoluteLevels.push(path.join(projectPath, levelName));
                }
            }

            this.subscriptions.add(atom.commands.add('atom-workspace', {
                // Lazy initing is impossible, because 'activationCommands' can store only static names.
                [`bem-levels:${project}`]: () => {
                    this.bemLevelsView.show(absoluteLevels);
                }
            }));
        }
    },

    deactivate() {
        this.bemLevelsView.destroy();
        this.subscriptions.dispose();
    }
};
