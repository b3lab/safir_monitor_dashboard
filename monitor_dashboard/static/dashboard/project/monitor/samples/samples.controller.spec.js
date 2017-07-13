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
                'name': 'instance1',
                'color': 'yellow',
                'tenant_id': 1,
                'status': 'ACTIVE'
            }];
            var alarmList = [{
                'alarm_id': 'instance-1',
                'name': 'alarm1',
                'instance_id': 'instance-1',
                'description': 'fake-alarm',
                'state': 'ok'
            }];
            var instanceCpuUsage = {
                'instance-1': {
                    'data': [{
                        'counter_name': 'cpu.util',
                        'counter_volume': '4.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'cpu.util',
                            'counter_volume': '5.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var instanceRamUsage = {
                'instance-1': {
                    'data': [{
                        'counter_name': 'memory.util',
                        'counter_volume': '80.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'memory.util',
                            'counter_volume': '75.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var instanceDiskUsage = {
                'instance-1': {
                    'data': [{
                        'counter_name': 'disk.util',
                        'counter_volume': '20.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'disk.util',
                            'counter_volume': '25.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var instanceIncomingNetworkUsage = {
                'instance-1': {
                    'data': [{
                        'counter_name': 'network.incoming.bytes.rate',
                        'counter_volume': '30.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'network.incoming.bytes.rate',
                            'counter_volume': '40.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var instanceOutcomingNetworkUsage = {
                'instance-1': {
                    'data': [{
                        'counter_name': 'network.outcoming.bytes.rate',
                        'counter_volume': '50.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'network.outcoming.bytes.rate',
                            'counter_volume': '60.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };

            function fakeGetInstanceCPUUtilizationAPI() {
                return {
                    success: function (getInstanceCPUUtilization) {
                        getInstanceCPUUtilization({items: instanceCpuUsage})
                    }
                };
            }

            function fakeGetInstanceRamUtilizationAPI() {
                return {
                    success: function (getInstanceRamUtilization) {
                        getInstanceRamUtilization({items: instanceRamUsage})
                    }
                };
            }

            function fakeGetInstanceNetworkUtilizationAPI() {
                return {
                    success: function (getInstanceNetworkUtilization) {
                        getInstanceNetworkUtilization({
                                incomingtraffic: instanceIncomingNetworkUsage,
                                outgoingtraffic: instanceOutcomingNetworkUsage
                            }
                        )
                    }
                };
            }

            function fakeGetInstanceDiskUtilizationAPI() {
                return {
                    success: function (getInstanceDiskUtilization) {
                        getInstanceDiskUtilization({items: instanceDiskUsage})
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
                        getAlarms({data: {alarmlist: alarmList}})
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
                spyOn(monitorAPI, 'getInstanceCPUUtilization').and.callFake(fakeGetInstanceCPUUtilizationAPI);
                spyOn(monitorAPI, 'getInstanceRamUtilization').and.callFake(fakeGetInstanceRamUtilizationAPI);
                spyOn(monitorAPI, 'getInstanceNetworkUtilization').and.callFake(fakeGetInstanceNetworkUtilizationAPI);
                spyOn(monitorAPI, 'getInstanceDiskUtilization').and.callFake(fakeGetInstanceDiskUtilizationAPI);
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
                expect(ctrl.instanceUsages.IDLE).toEqual(1);
                expect(ctrl.instanceUsages.IDEAL).toEqual(0);
                expect(ctrl.instanceUsages.CRITICAL).toEqual(0);
            });
            it('should retrieve alarm list properly ', function () {
                var ctrl = createController();
                expect(monitorAPI.getAlarms).toHaveBeenCalled();
                // expect( ctrl.alarmStates['OK']).toEqual(1);
            });
             it('should retrieve CPU usage datum properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getInstanceCPUUtilization).toHaveBeenCalledWith(from_date, to_date, 144);
                expect(ctrl.totalCpuData[0].values[0].y).toEqual(instanceCpuUsage['instance-1'].data[0].counter_volume);
            });
            it('should retrieve RAM usage datum properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString();
                expect(monitorAPI.getInstanceRamUtilization).toHaveBeenCalledWith(from_date, to_date, 144);
                expect(ctrl.totalRamData[0].values[0].y).toEqual(instanceRamUsage['instance-1'].data[0].counter_volume);
            });
            it('should retrieve Network usage datum properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getInstanceNetworkUtilization).toHaveBeenCalledWith(from_date, to_date, 144);
                expect(ctrl.totalIncomingNetworkData[0].values[0].y).toEqual(instanceIncomingNetworkUsage['instance-1'].data[0].counter_volume);
                expect(ctrl.totalOutgoingNetworkData[0].values[0].y).toEqual(instanceOutcomingNetworkUsage['instance-1'].data[0].counter_volume);
            });
            it('should retrieve Disk usage datum properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getInstanceDiskUtilization).toHaveBeenCalledWith(from_date, to_date, 144);
                expect(ctrl.totalDiskData[0].values[0].y).toEqual(instanceDiskUsage['instance-1'].data[0].counter_volume);
            });


        });

    });
})();
