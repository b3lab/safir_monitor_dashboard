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
                'id': 1,
                'name': 'project1',
                'enabled': true
            }];
            var instanceList = [{
                'id': 'instance-1',
                'name': 'instance1',
                'color': 'yellow',
                'tenant_id': 1,
                'selected': true,
                'cpuUsage': [],
                'ramUsage': [],
                'diskUsage': [],
                'incomingNetworkUsage': [],
                'outgoingNetworkUsage': [],
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
                        getInstanceNetworkUtilization({incomingtraffic: instanceIncomingNetworkUsage,
                                                       outgoingtraffic: instanceOutcomingNetworkUsage}
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
            function fakeKeystoneAPI() {
                return {
                    then: function (getProjects) {
                        getProjects({data: {items: projectList}})
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

            function getYesterday() {
                return new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
            }

            beforeEach(inject(function ($injector) {
                keystoneAPI = $injector.get('horizon.app.core.openstack-service-api.keystone');
                monitorAPI = $injector.get('horizon.app.core.openstack-service-api.monitor');
                controller = $injector.get('$controller');
                $scope = $injector.get('$rootScope').$new();
                spyOn(keystoneAPI, 'getProjects').and.callFake(fakeKeystoneAPI);
                spyOn(monitorAPI, 'getInstances').and.callFake(fakeGetInstancesAPI);
                spyOn(monitorAPI, 'getInstanceCPUUtilization').and.callFake(fakeGetInstanceCPUUtilizationAPI);
                spyOn(monitorAPI, 'getInstanceRamUtilization').and.callFake(fakeGetInstanceRamUtilizationAPI);
                spyOn(monitorAPI, 'getInstanceNetworkUtilization').and.callFake(fakeGetInstanceNetworkUtilizationAPI);
                spyOn(monitorAPI, 'getInstanceDiskUtilization').and.callFake(fakeGetInstanceDiskUtilizationAPI);

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
                expect(ctrl.projectCache).toBeDefined();
                expect(ctrl.instanceList).toBeDefined();
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
                ctrl.selectedProjects = ctrl.projectList
                $scope.selectProjects();
                expect(monitorAPI.getInstances).toHaveBeenCalledWith(ctrl.projectList[0].id,1);
                expect(ctrl.instanceList.length).toBe(1);
            });
            it('should retrieve CPU usage datum of instances of given project properly', function () {
                var ctrl = createController();
                ctrl.selectedProjects = ctrl.projectList
                $scope.selectProjects();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getInstanceCPUUtilization).toHaveBeenCalledWith(from_date, to_date, 144, ctrl.instanceList[0].id);
                expect(ctrl.totalCpuData[0].values[0].y).toEqual(instanceCpuUsage['instance-1'].data[0].counter_volume);
            });
            it('should retrieve RAM usage datum of instances of given project properly', function () {
                var ctrl = createController();
                ctrl.selectedProjects = ctrl.projectList
                $scope.selectProjects();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString();
                expect(monitorAPI.getInstanceRamUtilization).toHaveBeenCalledWith(from_date, to_date, 144, ctrl.instanceList[0].id);
                expect(ctrl.totalRamData[0].values[0].y).toEqual(instanceRamUsage['instance-1'].data[0].counter_volume);
            });
            it('should retrieve Network usage datum of instances of given project properly', function () {
                var ctrl = createController();
                ctrl.selectedProjects = ctrl.projectList
                $scope.selectProjects();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getInstanceNetworkUtilization).toHaveBeenCalledWith(from_date, to_date, 144, ctrl.instanceList[0].id);
                expect(ctrl.totalIncomingNetworkData[0].values[0].y).toEqual(instanceIncomingNetworkUsage['instance-1'].data[0].counter_volume);
                expect(ctrl.totalOutgoingNetworkData[0].values[0].y).toEqual(instanceOutcomingNetworkUsage['instance-1'].data[0].counter_volume);
            });
            it('should retrieve Disk usage datum of instances of given project properly', function () {
                var ctrl = createController();
                ctrl.selectedProjects = ctrl.projectList
                $scope.selectProjects();
                from_date = getYesterday().toISOString();
                to_date = new Date().toISOString()
                expect(monitorAPI.getInstanceDiskUtilization).toHaveBeenCalledWith(from_date, to_date, 144, ctrl.instanceList[0].id);
                expect(ctrl.totalDiskData[0].values[0].y).toEqual(instanceDiskUsage['instance-1'].data[0].counter_volume);
            });
        });

    });
})();
