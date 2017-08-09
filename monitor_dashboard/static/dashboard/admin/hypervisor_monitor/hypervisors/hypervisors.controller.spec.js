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
            var hostCpuUsage = {
                'host1': {
                    'data': [{
                        'counter_name': 'hardware.cpu.util',
                        'counter_volume': '4.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'hardware.cpu.util',
                            'counter_volume': '5.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var hostRamUsage = {
                'host1': {
                    'data': [{
                        'counter_name': 'hardware.memory.util',
                        'counter_volume': '80.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'hardware.memory.util',
                            'counter_volume': '75.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var hostDiskUsage = {
                'host1': {
                    'data': [{
                        'counter_name': 'hardware.disk.util',
                        'counter_volume': '20.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'hardware.disk.util',
                            'counter_volume': '25.00',
                            'timestamp': '2017-06-12T11:36:48.593000'
                        }
                    ]
                }
            };
            var hostIncomingNetworkUsage = {
                'host1': {
                    'data': [{
                        'counter_name': 'hardware.network.incoming.bytes.rate',
                        'counter_volume': '30.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'hardware.disk.util',
                            'counter_volume': '40.00',
                            'timestamp': 'hardware.network.incoming.bytes.rate'
                        }
                    ]
                }
            };
            var hostOutcomingNetworkUsage = {
                'host1': {
                    'data': [{
                        'counter_name': 'hardware.network.outcoming.bytes.rate',
                        'counter_volume': '50.00',
                        'timestamp': '2017-06-12T11:36:58.593000'
                    },
                        {
                            'counter_name': 'hardware.disk.util',
                            'counter_volume': '60.00',
                            'timestamp': 'hardware.network.outcoming.bytes.rate'
                        }
                    ]
                }
            };

            function fakeGetHostsAPI() {
                return {
                    then: function (getHosts) {
                        getHosts({data: {items: hostList}})
                    }
                };
            }
            function fakegetHostCPUUtilizationAPI() {
                return {
                    success: function (getHostCPUUtilization) {
                        getHostCPUUtilization({items: hostCpuUsage})
                    }
                };
            }
            function fakegetHostRAMUtilizationAPI() {
                return {
                    success: function (getHostRAMUtilization) {
                        getHostRAMUtilization({items: hostRamUsage})
                    }
                };
            }
            function fakegetHostNetworkUtilizationAPI() {
                return {
                    success: function (getHostNetworkUtilization) {
                        getHostNetworkUtilization({incomingtraffic: hostIncomingNetworkUsage,
                                                   outgoingtraffic: hostOutcomingNetworkUsage}
                                                   )
                    }
                };
            }
            function fakegetHostDiskUtilizationAPI() {
                return {
                    success: function (getHostDiskUtilization) {
                        getHostDiskUtilization({items: hostDiskUsage})
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
                spyOn(monitorAPI, 'getHostCPUUtilization').and.callFake(fakegetHostCPUUtilizationAPI);
                spyOn(monitorAPI, 'getHostRAMUtilization').and.callFake(fakegetHostRAMUtilizationAPI);
                spyOn(monitorAPI, 'getHostNetworkUtilization').and.callFake(fakegetHostNetworkUtilizationAPI);
                spyOn(monitorAPI, 'getHostDiskUtilization').and.callFake(fakegetHostDiskUtilizationAPI);
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
            it('should retrieve CPU usage datum of given host properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString();
                expect(monitorAPI.getHostCPUUtilization).toHaveBeenCalledWith(from_date, to_date, ctrl.hostLimit, 'host1');
                expect(ctrl.totalHostCpuData[0].values[0].y).toEqual(hostCpuUsage['host1'].data[0].counter_volume);
            });
            it('should retrieve RAM usage datum of given host properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString();
                expect(monitorAPI.getHostRAMUtilization).toHaveBeenCalledWith(from_date, to_date, ctrl.hostLimit, 'host1');
                expect(ctrl.totalHostRamData[0].values[0].y).toEqual(hostRamUsage['host1'].data[0].counter_volume);
            });
            it('should retrieve Network usage datum of given host properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getHostNetworkUtilization).toHaveBeenCalledWith(from_date, to_date, ctrl.hostLimit, 'host1');
                expect(ctrl.totalHostIncomingNetworkData[0].values[0].y).toEqual(hostIncomingNetworkUsage['host1'].data[0].counter_volume);
                expect(ctrl.totalHostOutgoingNetworkData[0].values[0].y).toEqual(hostOutcomingNetworkUsage['host1'].data[0].counter_volume);
            });
            it('should retrieve Disk usage datum of given host properly', function () {
                var ctrl = createController();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getHostDiskUtilization).toHaveBeenCalledWith(from_date, to_date, ctrl.hostLimit, 'host1');
                expect(ctrl.totalHostDiskData[0].values[0].y).toEqual(hostDiskUsage['host1'].data[0].counter_volume);
            });
        });

    });
})();

