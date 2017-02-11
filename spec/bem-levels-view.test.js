'use babel';

import path from 'path';
import { assert } from 'chai';
import sinon from 'sinon';
import BemLevelsView from '../lib/bem-levels-view';

describe('BemLevelsView', () => {
    const levels = [
        path.join(__dirname, 'fixtures/lib1/common.blocks/'),
        path.join(__dirname, 'fixtures/lib1/desktop.blocks/'),
        path.join(__dirname, 'fixtures/lib2/common.blocks/'),
        path.join(__dirname, 'fixtures/lib2/touch.blocks/'),
        path.join(__dirname, 'fixtures/common.blocks/'),
        path.join(__dirname, 'fixtures/touch-phone.blocks/')
    ];

    let sandbox;
    let bemLevelsView;

    beforeEach(() => {
        bemLevelsView = new BemLevelsView();
        bemLevelsView.show(levels);

        sandbox = sinon.sandbox.create();
        sandbox.stub(bemLevelsView, 'projectPaths', [path.resolve(__dirname, '..')]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('getRelativePath()', () => {
        assert.strictEqual(bemLevelsView.getRelativePath(__filename), 'spec/bem-levels-view.test.js');
    });

    describe('populateList()', () => {
        it('searching of block "a"', (done) => {
            sandbox.stub(bemLevelsView, 'getFilterQuery', () => 'a');
            bemLevelsView.populateList().on('end', () => {
                assert.deepEqual(bemLevelsView._lastList, [
                    'spec/fixtures/lib1/common.blocks/a/a.js',
                    'spec/fixtures/lib1/desktop.blocks/a/a.js',
                    'spec/fixtures/lib2/touch.blocks/a/a.js',
                    'spec/fixtures/common.blocks/a/a.js'
                ]);
                done();
            });
        });
    });
});
