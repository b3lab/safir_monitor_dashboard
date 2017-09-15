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

    describe('horizon.dashboard.project.monitor.samples controller', function () {

        beforeEach(module('horizon.app.core'));
        beforeEach(module('horizon.app.core.openstack-service-api'));
        beforeEach(module('horizon.framework'));
        beforeEach(module('horizon.dashboard.project.monitor.samples'));
        beforeEach(module(function ($provide) {
            $provide.value('$uibModal', {});
        }));
        beforeEach(module('horizon.dashboard.project.monitor', function ($provide) {
            $provide.constant('horizon.dashboard.project.monitor.basePath', '/a/sample/path/');
        }));
        describe('MonitorSamplesTableController', function () {
            var $scope, monitorAPI, controller, from_date, to_date;

            var instanceList = [{
                'id': 'instance-1',
                'name': 'instance-1',
                'color': 'yellow',
                'tenant_id': 'project-1',
                'status': 'ACTIVE',
                'created': '2017-09-11T13:40:00+00:00',
                'host': 'host-1',
                'zone': 'zone-1',
                'full_flavor': 'm1.tiny'
            }];
            var alarmList = [{
                'alarm_id': 'instance-1',
                'name': 'alarm1',
                'instance_id': 'instance-1',
                'description': 'fake-alarm',
                'state': 'ok'
            }];
            var instanceCpuUsage =  [
                    ["2017-09-11T13:40:00+00:00", 300.0, 4.00],
                    ["2017-09-11T13:45:00+00:00", 300.0, 5.00]
            ];

            function fakeGetMeasures() {
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

            function fakeGetInstancesAPI() {
                return {
                    success: function (getInstances) {
                        getInstances({items: instanceList})
                    }
                };
            }
            function fakeGetAlarmsAPI() {
                return {
                    then: function (getAlarms) {
                        getAlarms({data: {items: alarmList}})
                    }
                };
            }

            function getYesterday() {
                return new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
            }

            beforeEach(inject(function ($injector) {
                monitorAPI = $injector.get('horizon.app.core.openstack-service-api.monitor');
                controller = $injector.get('$controller');
                $scope = $injector.get('$rootScope').$new();
                spyOn(monitorAPI, 'getInstances').and.callFake(fakeGetInstancesAPI);
                spyOn(monitorAPI, 'getMeasures').and.callFake(fakeGetMeasures);
                spyOn(monitorAPI, 'getAlarms').and.callFake(fakeGetAlarmsAPI);

            }));

            function createController() {
                return controller('MonitorSamplesTableController', {
                    $scope: $scope,
                    monitorAPI: monitorAPI
                });
            }

            it('properties should be defined', function () {
                var ctrl = createController();
                expect(ctrl.rowActions).toBeDefined();
                expect(ctrl.instanceList).toBeDefined();
                expect(ctrl.instanceStates).toBeDefined();
                expect(ctrl.instanceStatesChartData).toBeDefined();
                expect(ctrl.instanceUsages).toBeDefined();
                expect(ctrl.instanceUsagesChartData).toBeDefined();
                expect(ctrl.alarmStates).toBeDefined();
                expect(ctrl.alarmStatesChartData).toBeDefined();
                expect(ctrl.allselected).toBeDefined();
                expect(ctrl.allselected).toEqual(true);
                expect(ctrl.totalCpuData).toBeDefined();
                expect(ctrl.totalRamData).toBeDefined();
                expect(ctrl.totalDiskData).toBeDefined();
                expect(ctrl.totalIncomingNetworkData).toBeDefined();
                expect(ctrl.totalOutgoingNetworkData).toBeDefined();
                expect(ctrl.toggleButtonOptions).toBeDefined();
                expect(ctrl.toggled).toBeDefined();
                expect(ctrl.toggled).toEqual(1);
                expect(ctrl.config).toBeDefined();
                expect(ctrl.chartOptions).toBeDefined();
                expect(ctrl.networkChartOptions).toBeDefined();
            });

            it('should retrieve instance list properly ', function () {
                var ctrl = createController();
                expect(monitorAPI.getInstances).toHaveBeenCalledWith(-1, 0);
                expect(ctrl.instanceStates.ACTIVE).toEqual(1);
                expect(ctrl.instanceStates.ERROR).toEqual(0);
                expect(ctrl.instanceList[0].instanceUsageState).toEqual("IDLE");
                expect(ctrl.instanceUsages.IDEAL).toEqual(0);
                expect(ctrl.instanceUsages.CRITICAL).toEqual(0);
            });
            it('should retrieve alarm list properly ', function () {
                var ctrl = createController();
                expect(monitorAPI.getAlarms).toHaveBeenCalled();
                // expect( ctrl.alarmStates['OK']).toEqual(1);
            });
             it('should retrieve CPU measures properly', function () {
                var ctrl = createController();
                expect(monitorAPI.getMeasures).toHaveBeenCalledWith('cpu_util', 'instance-1', 'project-1', ctrl.from_date, ctrl.to_date);
                expect(ctrl.totalCpuData[0].values[0].y).toEqual(instanceCpuUsage[0][2]);
            });
        });

    });
})();
