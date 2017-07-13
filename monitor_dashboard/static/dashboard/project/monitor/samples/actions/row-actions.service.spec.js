/* Copyright 2017 TUBITAK, BILGEM, B3LAB
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use self file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
(function () {
    'use strict';

    describe('Project Monitor  Samples Row Actions Service', function () {
        var actions;

        beforeEach(module('horizon.framework.util'));
        beforeEach(module('horizon.framework.conf'));
        beforeEach(module('horizon.framework.widgets'));
        beforeEach(module('horizon.app.core.openstack-service-api'));
        beforeEach(module('horizon.dashboard.project.monitor.samples'));
        beforeEach(module(function ($provide) {
            $provide.value('$uibModal', {});
        }));
        beforeEach(module('horizon.dashboard.project.monitor', function ($provide) {
            $provide.constant('horizon.dashboard.project.monitor.basePath', '/a/sample/path/');
        }));

        beforeEach(inject(function ($injector) {
            var rowActionsService = $injector.get(
                'horizon.dashboard.project.monitor.samples.actions.rowActions');
            actions = rowActionsService.actions();
        }));

        it('should define correct table row actions', function () {
            expect(actions.length).toBe(3);
            expect(actions[0].template.text).toBe('Launch Alarm');
            expect(actions[1].template.text).toBe('Delete Alarm');
            expect(actions[2].template.text).toBe('Export Metrics');
        });

        it('should have the "allowed" and "perform" functions', function () {
            actions.forEach(function (action) {
                expect(action.service.allowed).toBeDefined();
                expect(action.service.perform).toBeDefined();
            });
        });

    });
})();