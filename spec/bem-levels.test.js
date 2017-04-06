'use babel';

import { assert } from 'chai';
import sinon from 'sinon';
import { $ } from 'atom-space-pen-views';
import BemLevels from '../lib/bem-levels';

describe('BemLevels', () => {
    let workspaceElement;

    beforeEach((done) => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(atom.config, 'get').withArgs('bem-levels.levels').returns({ project: [] });

        workspaceElement = atom.views.getView(atom.workspace);
        $('body').append(workspaceElement);
        atom.packages.activatePackage('bem-levels').then((info) => {
            info.mainModule._onLocalConfigActivate();
            done();
        });
    });

    afterEach(() => {
        atom.packages.deactivatePackage('bem-levels');
        $(workspaceElement).remove();
        sandbox.restore();
    });

    it('hides and shows the modal panel', () => {
        const panel = $('.bem-levels', workspaceElement);
        assert.isTrue(panel.is(':hidden'), 'panel should be hidden');
        atom.commands.dispatch(workspaceElement, 'bem-levels:project');
        assert.isTrue(panel.is(':visible'), 'panel should appear');
    });
});
