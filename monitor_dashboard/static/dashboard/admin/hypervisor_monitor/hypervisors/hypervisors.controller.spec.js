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

    describe('horizon.dashboard.admin.hypervisor_monitor.hypervisors controller ', function () {
        beforeEach(module('horizon.app.core'));
        beforeEach(module('horizon.app.core.openstack-service-api'));
        beforeEach(module('horizon.framework'));
        beforeEach(module('horizon.dashboard.admin.hypervisor_monitor.hypervisors'));
        beforeEach(module(function ($provide) {
            $provide.value('$uibModal', {});
        }));
        describe('HypervisorMonitorController', function () {
            var $scope, monitorAPI, controller , from_date, to_date ;
            var hostList = [{
                'id': 1,
                'hypervisor_hostname': 'host1'
            }];
            var hostCpuUsage = [
                    ["2017-09-11T13:40:00+00:00", 300.0, 0.28],
                    ["2017-09-11T13:45:00+00:00", 300.0, 0.23]
            ];

            function fakeGetHostsAPI() {
                return {
                    then: function (getHosts) {
                        getHosts({data: {items: hostList}})
                    }
                };
            }
            function fakeGetHardwareMeasuresAPI() {
                return {
                    success: function (getHardwareMeasures) {
                        getHardwareMeasures({metric_name: 'hardware.cpu.util',
                                             hostname: 'host1',
                                             measures: [{'resource_id': 'host1',
                                                        'utils': hostCpuUsage}] })
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
                spyOn(monitorAPI, 'getHosts').and.callFake(fakeGetHostsAPI);
                spyOn(monitorAPI, 'getHardwareMeasures').and.callFake(fakeGetHardwareMeasuresAPI);
            }));

            function createController() {
                return controller('HypervisorMonitorController', {
                    $scope: $scope,
                    monitorAPI: monitorAPI
                });
            }

            it('properties should be defined', function () {
                var ctrl = createController();
                expect(ctrl.rowActions).toBeDefined();
                expect(ctrl.hostList).toBeDefined();
                expect(ctrl.allselected).toBeDefined();
                expect(ctrl.allselected).toEqual(true);
                expect(ctrl.toggleButtonOptions).toBeDefined();
                expect(ctrl.toggled).toBeDefined();
                expect(ctrl.toggled).toEqual(1);
                expect(ctrl.totalHostCpuData).toBeDefined();
                expect(ctrl.totalHostRamData).toBeDefined();
                expect(ctrl.totalHostDiskData).toBeDefined();
                expect(ctrl.totalHostIncomingNetworkData).toBeDefined();
                expect(ctrl.totalHostOutgoingNetworkData).toBeDefined();
                expect(ctrl.config).toBeDefined();
                expect(ctrl.chartOptions).toBeDefined();
                expect(ctrl.networkChartOptions).toBeDefined();
            });
            it('should retrieve host list properly', function () {
                var ctrl = createController();
                expect(monitorAPI.getHosts).toHaveBeenCalled();
                expect(ctrl.hostList.length).toBe(1);
            });
            it('should retrieve CPU measures of the given host properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString();
                expect(monitorAPI.getHardwareMeasures).toHaveBeenCalledWith('hardware.cpu.util', 'host1', from_date, to_date);
                expect(ctrl.totalHostCpuData[0].values[0].y).toEqual(hostCpuUsage[0][2]);
            });
        });

    });
})();

