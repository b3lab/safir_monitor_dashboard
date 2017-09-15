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

    describe('horizon.dashboard.admin.project_monitor.projects controller', function () {

        beforeEach(module('horizon.app.core'));
        beforeEach(module('horizon.app.core.openstack-service-api'));
        beforeEach(module('horizon.framework'));
        beforeEach(module('horizon.dashboard.admin.project_monitor.projects'));
        beforeEach(module(function ($provide) {
            $provide.value('$uibModal', {});
        }));
        describe('ProjectMonitorController', function () {
            var $scope, monitorAPI, keystoneAPI, controller, from_date, to_date ;
            var projectList = [{
                'id': 'project-1',
                'name': 'project1',
                'enabled': true
            }];
            var instanceList = [{
                'id': 'instance-1',
                'name': 'instance1',
                'color': 'yellow',
                'tenant_id': 'project-1',
                'selected': true,
                'cpuUsage': [],
                'ramUsage': [],
                'diskUsage': [],
                'incomingNetworkUsage': [],
                'outgoingNetworkUsage': []
            }];
            var instanceCpuUsage = [
                    ["2017-09-11T13:40:00+00:00", 300.0, 4.00],
                    ["2017-09-11T13:45:00+00:00", 300.0, 5.00]
            ];

            function fakeGetMeasuresAPI() {
                return {
                    success: function (getMeasures) {
                        getMeasures({metric_name: 'cpu_util',
                                     project_id: 'project-1',
                                     instance_id: 'instance-1',
                                     measures: [{'resource_id': 'instance-1',
                                                'utils': instanceCpuUsage}] })
                    }
                };
            }
            function fakeGetCurrentUserSessionAPI() {
                return {
                    then: function (getCurrentUserSession) {
                        getCurrentUserSession({data: {project_name: 'project-1'}})
                    }
                };
            }
            function fakeGetProjectAPI() {
                return {
                    then: function (getProjects) {
                        getProjects({data: {items: projectList}})
                    }
                }
            }
            function fakeGetInstancesAPI() {
                return {
                    success: function (getInstances) {
                        getInstances({items: instanceList})
                    }
                };
            }

            function getYesterday() {
                return new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
            }

            beforeEach(inject(function ($injector) {
                keystoneAPI = $injector.get('horizon.app.core.openstack-service-api.keystone');
                monitorAPI = $injector.get('horizon.app.core.openstack-service-api.monitor');
                controller = $injector.get('$controller');
                $scope = $injector.get('$rootScope').$new();
                spyOn(keystoneAPI, 'getProjects').and.callFake(fakeGetProjectAPI);
                spyOn(keystoneAPI, 'getCurrentUserSession').and.callFake(fakeGetCurrentUserSessionAPI);
                spyOn(monitorAPI, 'getInstances').and.callFake(fakeGetInstancesAPI);
                spyOn(monitorAPI, 'getMeasures').and.callFake(fakeGetMeasuresAPI);

            }));
            function createController() {
                return controller('ProjectMonitorController', {
                    $scope: $scope,
                    monitorAPI: monitorAPI,
                    keystoneAPI: keystoneAPI
                });
            }
            it('properties should be defined', function () {
                var ctrl = createController();
                expect(ctrl.rowActions).toBeDefined();
                expect(ctrl.projectList).toBeDefined();
                expect(ctrl.instancesCache).toBeDefined();
                expect(ctrl.allselected).toBeDefined();
                expect(ctrl.allselected).toEqual(true);
                expect(ctrl.toggleButtonOptions).toBeDefined();
                expect(ctrl.toggled).toBeDefined();
                expect(ctrl.toggled).toEqual(1);
                expect(ctrl.config).toBeDefined();
                expect(ctrl.chartOptions).toBeDefined();
                expect(ctrl.networkChartOptions).toBeDefined();
            });

            it('should retrieve project list properly ', function () {
                var ctrl = createController();
                expect(keystoneAPI.getProjects).toHaveBeenCalled();
                expect(ctrl.projectList.length).toBe(1);
            });
            it('should retrieve instance list of given project  properly ', function () {
                var ctrl = createController();
                ctrl.selectedProjects = ctrl.projectList;
                $scope.selectProjects();
                expect(monitorAPI.getInstances).toHaveBeenCalledWith(ctrl.projectList[0].id,1);
                expect(ctrl.instanceList.length).toBe(1);
            });
            it('should retrieve CPU measures of instances of the given project properly', function () {
                var ctrl = createController();
                ctrl.selectedProjects = ctrl.projectList;
                $scope.selectProjects();
                expect(monitorAPI.getMeasures).toHaveBeenCalledWith('cpu_util', 'instance-1', 'project-1', ctrl.from_date, ctrl.to_date);
                expect(ctrl.totalCpuData[0].values[0].y).toEqual(instanceCpuUsage[0][2]);
            });
        });
    });
})();
