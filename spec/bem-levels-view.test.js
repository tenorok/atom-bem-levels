'use babel';

import path from 'path';
import { config, assert } from 'chai';
import sinon from 'sinon';
import { Disposable } from 'atom';
import BemLevelsView from '../lib/bem-levels-view';

// For complete diff between two arrays.
config.truncateThreshold = 0;

describe('BemLevelsView', () => {
    const levelsFirst = [
        path.join(__dirname, 'fixtures/lib1/common.blocks/'),
        path.join(__dirname, 'fixtures/lib1/desktop.blocks/'),
        path.join(__dirname, 'fixtures/lib2/common.blocks/'),
        path.join(__dirname, 'fixtures/lib2/touch.blocks/'),
        path.join(__dirname, 'fixtures/common.blocks/'),
        path.join(__dirname, 'fixtures/touch-phone.blocks/')
    ];

    const levelsSecond = [
        path.join(__dirname, 'fixtures/common.blocks/'),
        path.join(__dirname, 'fixtures/touch-phone.blocks/')
    ];

    let sandbox;
    let bemLevelsView;

    beforeEach(() => {
        bemLevelsView = new BemLevelsView();
        bemLevelsView.setIconsService(() => new Disposable());
        bemLevelsView.setLevels('project-first', levelsFirst);
        bemLevelsView.setLevels('project-second', levelsSecond);

        sandbox = sinon.sandbox.create();
        sandbox.stub(bemLevelsView, 'projectPaths', [path.resolve(__dirname, '..')]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getRelativePath()', () => {
        it('directory', () => {
            assert.strictEqual(bemLevelsView.getRelativePath(__dirname), 'spec');
        });

        it('file', () => {
            assert.strictEqual(bemLevelsView.getRelativePath(__filename), 'spec/bem-levels-view.test.js');
        });
    });

    describe('populateList()', () => {
        it('searching of block "a"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView._lastProject = 'project-first';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/common.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib1/common.blocks/a/a.js',
                    'spec/fixtures/lib1/desktop.blocks/a/a.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.css',
                    'spec/fixtures/lib2/touch.blocks/a/a.js',
                    'spec/fixtures/common.blocks/a/a.css',
                    'spec/fixtures/common.blocks/a/a.js',
                    'spec/fixtures/common.blocks/a/a.priv.js',
                    'spec/fixtures/touch-phone.blocks/a/a.deps.js',
                    'spec/fixtures/touch-phone.blocks/a/a.test.js'
                ]);
                done();
            });
        });

        it('searching of block "a" in second project', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView._lastProject = 'project-second';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/common.blocks/a/a.css',
                    'spec/fixtures/common.blocks/a/a.js',
                    'spec/fixtures/common.blocks/a/a.priv.js',
                    'spec/fixtures/touch-phone.blocks/a/a.deps.js',
                    'spec/fixtures/touch-phone.blocks/a/a.test.js'
                ]);
                done();
            });
        });

        it('searching of block "a" only in "js" technology', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a.js');
            bemLevelsView._lastProject = 'project-first';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/common.blocks/a/a.js',
                    'spec/fixtures/lib1/desktop.blocks/a/a.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.js',
                    'spec/fixtures/common.blocks/a/a.js'
                ]);
                done();
            });
        });

        it('searching of block "a" only in "bemhtml.js" technology', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a.bemhtml.js');
            bemLevelsView._lastProject = 'project-first';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/common.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.bemhtml.js'
                ]);
                done();
            });
        });

        it('searching of element "a__b"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a__b');
            bemLevelsView._lastProject = 'project-first';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/desktop.blocks/a/__b/a__b.css',
                    'spec/fixtures/common.blocks/a/__b/a__b.css'
                ]);
                done();
            });
        });

        it('searching of block modifier "a_z_x"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a_z_x');
            bemLevelsView._lastProject = 'project-first';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib2/common.blocks/a/_z/a_z_x.js'
                ]);
                done();
            });
        });

        it('searching of element modifier "a__b_z_x"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a__b_z_x');
            bemLevelsView._lastProject = 'project-first';
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/desktop.blocks/a/__b/_z/a__b_z_x.css'
                ]);
                done();
            });
        });
    });

    describe('show()', () => {
        beforeEach(() => {
            sandbox.stub(bemLevelsView, '_lastQuery', 'last-file.js');
        });

        it('should set name of active file to the search input', () => {
            sandbox.stub(atom.workspace, 'getActivePaneItem', () => {
                return { buffer: { file: { path: '/path/to/a__b.css' }}};
            });
            bemLevelsView.show();
            assert.strictEqual(bemLevelsView.filterEditorView.getText(), 'a__b.css');
        });

        it('should set last query when active file name is ".gitignore"', () => {
            sandbox.stub(atom.workspace, 'getActivePaneItem', () => {
                return { buffer: { file: { path: '/path/to/.gitignore' }}};
            });
            bemLevelsView.show();
            assert.strictEqual(bemLevelsView.filterEditorView.getText(), 'last-file.js');
        });

        it('should set last query when active file name is ".bemhint.js"', () => {
            sandbox.stub(atom.workspace, 'getActivePaneItem', () => {
                return { buffer: { file: { path: '/path/to/.bemhint.js' }}};
            });
            bemLevelsView.show();
            assert.strictEqual(bemLevelsView.filterEditorView.getText(), 'last-file.js');
        });

        it('should set last query when active file name is "Makefile"', () => {
            sandbox.stub(atom.workspace, 'getActivePaneItem', () => {
                return { buffer: { file: { path: '/path/to/Makefile' }}};
            });
            bemLevelsView.show();
            assert.strictEqual(bemLevelsView.filterEditorView.getText(), 'last-file.js');
        });

        it('should set last query when active file name is "*.json"', () => {
            sandbox.stub(atom.workspace, 'getActivePaneItem', () => {
                return { buffer: { file: { path: '/path/to/package.json' }}};
            });
            bemLevelsView.show();
            assert.strictEqual(bemLevelsView.filterEditorView.getText(), 'last-file.js');
        });
    });

    describe('option targetTechs', () => {
        beforeEach(() => {
            bemLevelsView._lastProject = 'project-first';
        });

        it('with value "css"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView.setTargetTechs('css');
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib2/touch.blocks/a/a.css',
                    'spec/fixtures/common.blocks/a/a.css'
                ]);
                done();
            });
        });

        it('with value "bemhtml.js"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView.setTargetTechs('bemhtml.js');
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/common.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.bemhtml.js'
                ]);
                done();
            });
        });

        it('with value "css|bemhtml.js"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView.setTargetTechs('css|bemhtml.js');
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/common.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.css',
                    'spec/fixtures/common.blocks/a/a.css'
                ]);
                done();
            });
        });

        it('with value "^js|bemhtml.js"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView.setTargetTechs('^js|bemhtml.js');
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList.map(item => item.relativeFilePath), [
                    'spec/fixtures/lib1/common.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib1/common.blocks/a/a.js',
                    'spec/fixtures/lib1/desktop.blocks/a/a.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.bemhtml.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.js',
                    'spec/fixtures/common.blocks/a/a.js'
                ]);
                done();
            });
        });
    });
});
