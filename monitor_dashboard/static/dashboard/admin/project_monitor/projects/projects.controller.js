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

    angular
        .module('horizon.dashboard.admin.project_monitor.projects')
        .controller('ProjectMonitorController', ProjectMonitorController);

    ProjectMonitorController.$inject = [
        '$scope',
        'horizon.app.core.openstack-service-api.monitor',
        'horizon.app.core.openstack-service-api.keystone',
        'horizon.dashboard.admin.project_monitor.projects.actions.rowActions'
    ];

    /**
     * @ngdoc controller
     * @name ProjectMonitorController
     *
     * @description
     * Controller for the Project Monitor samples.
     * @param $scope An Execution for ProjectMonitorController AngularJs Expressions
     * @param api The Monitor service API.
     * @param keystoneapi The identity service api
     * @param rowActions The row actions service.
     * @returns undefined
     */
    function ProjectMonitorController($scope, api, keystoneapi, rowActions) {

        var ctrl = this;
        ctrl.rowActions = rowActions;

        init();

        ////////////////////////////////
        function init() {
            ctrl.instancesCache = {};

            ctrl.selectedProjects = [];
            ctrl.projectList = [];

            ctrl.instanceList = [];
            ctrl.allselected = true;
            ctrl.toggled = 1;

            ctrl.currentProject = '';
            keystoneapi.getCurrentUserSession().then(getCurrentUserSession);

            configCharts();
            nv.models.tooltip().duration(0);

            ctrl.toggleButtonOptions = [
                {label: gettext('CPU Usage'), value: 1},
                {label: gettext('RAM Usage'), value: 2},
                {label: gettext('Disk Usage'), value: 3},
                {label: gettext('Incoming Network Bandwidth'), value: 4},
                {label: gettext('Outgoing Network Bandwidth'), value: 5}
            ];
        }

        function getCurrentUserSession (response) {
            ctrl.currentProject = response.data.project_name;
            keystoneapi.getProjects().then(getProjects);
        }

        function getProjects(response) {
            ctrl.projectList = [];
            for (var i = 0; i < response.data.items.length; i++) {
                if (response.data.items[i].enabled == true) {
                    ctrl.projectList.push({
                            'id': response.data.items[i].id,
                            'name': response.data.items[i].name
                        });

                    if (response.data.items[i].name == ctrl.currentProject) {
                        ctrl.selectedProjects.push({
                                'id': response.data.items[i].id,
                                'name': response.data.items[i].name
                            });
                        $scope.selectProjects();
                    }
                }
            }
        }

        function getProjectName(project_id) {
            var project_name = '';
            var found = false;
            var i = 0;
            while (i < ctrl.projectList.length &&
                   found == false) {
                if (ctrl.projectList[i].id == project_id) {
                    project_name = ctrl.projectList[i].name;
                    found = true;
                }
                i += 1;
            }
            return project_name;
        }

        $scope.selectProjects = function () {
            ctrl.instanceList = [];
            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];
            for (var i = 0; i < ctrl.selectedProjects.length; i++) {
                var project_id = ctrl.selectedProjects[i].id;
                getInstancesOfProject(project_id);
            }

            resetChart();
        };

        function getInstancesOfProject(project_id) {
            if (ctrl.instancesCache.hasOwnProperty(project_id)) {
                updateInstanceList(ctrl.instancesCache[project_id]);
            } else {
                ctrl.instancesCache[project_id] = {};
                api.getInstances(project_id, 1).success(getInstances);
            }
        }

        function getInstances(response) {
            console.time('getInstances');
            for (var i = 0; i < response.items.length; i++) {
                var instance = {id:response.items[i].id,
                                name:response.items[i].name,
                                status:response.items[i].status,
                                created:response.items[i].created,
                                project_id:response.items[i].tenant_id,
                                project_name:getProjectName(response.items[i].tenant_id),
                                cpuUsage:[],
                                ramUsage:[],
                                diskUsage:[],
                                incomingNetworkUsage:[],
                                outgoingNetworkUsage:[],
                                selected:true,
                                color:response.items[i].color,
                                host:response.items[i].host,
                                zone:response.items[i].zone,
                                full_flavor:response.items[i].full_flavor
                               };
                ctrl.instancesCache[instance.project_id][instance.id] = instance;
                updateInstanceList([instance]);

                getUtilizationData(instance.id);
            }

            console.timeEnd('getInstances');
        }

        function updateInstanceList(instances) {
            for (var key in instances) {
                if (instances.hasOwnProperty(key)) {
                    ctrl.instanceList.push(instances[key]);
                }
            }
        }

        function getUtilizationData(instance_id) {
            // sample count for one instance per day if collected every ten minutes = 144
            var limit = 144;
            var from_date = getYesterday().toISOString();
            var to_date = new Date().toISOString();

            api.getInstanceCPUUtilization(from_date, to_date, limit, instance_id).success(fillCpuUtilization);
            api.getInstanceRamUtilization(from_date, to_date, limit, instance_id).success(fillMemoryUtilization);
            api.getInstanceDiskUtilization(from_date, to_date, limit, instance_id).success(fillDiskUtilization);
            api.getInstanceNetworkUtilization(from_date, to_date, limit, instance_id).success(fillNetworkUtilization);
        }

        function fillCpuUtilization(response) {
            console.time('fillCpuUtilization');
            if (response.items != undefined) {
                addUtilization(response.items,
                    'cpuUsage');
            }
            console.timeEnd('fillCpuUtilization');
        }

        function fillMemoryUtilization(response) {
            console.time('fillMemoryUtilization');
            if (response.items != undefined) {
                addUtilization(response.items,
                    'ramUsage');
            }
            console.timeEnd('fillMemoryUtilization');
        }

        function fillDiskUtilization(response) {
            console.time('fillDiskUtilization');
            if (response.items != undefined) {
                addUtilization(response.items,
                    'diskUsage');
            }
            console.timeEnd('fillDiskUtilization');
        }

        function fillNetworkUtilization(response) {
            console.time('fillNetworkUtilization');
            var incomingtraffic = response.incomingtraffic;
            var outgoingtraffic = response.outgoingtraffic;

            if (incomingtraffic != undefined) {
                addUtilization(incomingtraffic,
                    'incomingNetworkUsage');
            }
            if (outgoingtraffic != undefined) {
                addUtilization(outgoingtraffic,
                    'outgoingNetworkUsage');
            }

            console.timeEnd('fillNetworkUtilization');
        }

        function addUtilization(data, instance_data) {
            for (var project_id in data) {
                if (data.hasOwnProperty(project_id)) {
                    for (var instance_id in data[project_id]) {
                        if (data[project_id].hasOwnProperty(instance_id)) {
                            var util_data = data[project_id][instance_id].data;
                            var utils = [];

                            for (var i = 0; i < util_data.length; i++) {
                                var timestamp = new Date(util_data[i].timestamp);
                                var volume = parseFloat(util_data[i].counter_volume);
                                utils.push({x: timestamp, y: volume});
                            }
                            if (ctrl.instancesCache.hasOwnProperty(project_id) &&
                                ctrl.instancesCache[project_id].hasOwnProperty(instance_id) &&
                                ctrl.instancesCache[project_id][instance_id].hasOwnProperty(instance_data)) {
                                ctrl.instancesCache[project_id][instance_id][instance_data] = utils;
                            }
                        }
                    }
                }
            }
            resetChart();
        }

        ctrl.filterUtils = function () {
            resetChart();
        };

        ctrl.selectAll = function () {
            for (var i = 0; i < ctrl.instanceList.length; i++) {
                ctrl.instanceList[i].selected = ctrl.allselected;
            }
            resetChart();
        };

        function resetChart() {
            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];

            for (var i = 0; i < ctrl.instanceList.length; i++) {
                if (ctrl.instanceList[i].selected) {
                    var instance_id = ctrl.instanceList[i].id;
                    var project_id = ctrl.instanceList[i].project_id;

                    if (ctrl.instancesCache.hasOwnProperty(project_id) &&
                        ctrl.instancesCache[project_id].hasOwnProperty(instance_id)) {

                        var instance = ctrl.instancesCache[project_id][instance_id];
                        if (instance.cpuUsage.length > 1)
                            ctrl.totalCpuData.push({
                                values: instance.cpuUsage,
                                key: instance.name,
                                color: instance.color
                            });
                        if (instance.ramUsage.length > 1)
                            ctrl.totalRamData.push({
                                values: instance.ramUsage,
                                key: instance.name,
                                color: instance.color
                            });
                        if (instance.diskUsage.length > 1)
                            ctrl.totalDiskData.push({
                                values: instance.diskUsage,
                                key: instance.name,
                                color: instance.color
                            });
                        if (instance.incomingNetworkUsage.length > 1)
                            ctrl.totalIncomingNetworkData.push({
                                values: instance.incomingNetworkUsage,
                                key: instance.name,
                                color: instance.color
                            });
                        if (instance.outgoingNetworkUsage.length > 1)
                            ctrl.totalOutgoingNetworkData.push({
                                values: instance.outgoingNetworkUsage,
                                key: instance.name,
                                color: instance.color
                            });
                    }
                }
            }
        }

        function getLastWeek() {
            var today = new Date();
            var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            return lastWeek;
        }

        function getYesterday() {
            return new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
        }

        function configCharts() {
            // Line chart config
            ctrl.config = getChartConfig();

            //line chart options
            ctrl.chartOptions = getChartOptions();

            ctrl.networkChartOptions = getChartOptions();
            ctrl.networkChartOptions.chart.yAxis.tickFormat = function (d) {
                return d3.format('.1')(d) + ' Mbps';
            };
            ctrl.networkChartOptions.chart.lines.forceY = [];
            ctrl.networkChartOptions.chart.lines.forceY = [0,];
            ctrl.networkChartOptions.chart.lines2.forceY = [0,];
            ctrl.networkChartOptions.chart.margin.left = 70;
        }

        function getChartConfig() {
            return {
                visible: true, // default: true
                extended: false, // default: false
                disabled: false, // default: false
                refreshDataOnly: true, // default: true
                deepWatchOptions: true, // default: true
                deepWatchData: true, // default: true
                deepWatchDataDepth: 2, // default: 2
                debounce: 10,
                responsive: true// default: 10
            };
        }

        function getChartOptions() {
            return {
                chart: {
                    "type": 'lineWithFocusChart',
                    "height": 450,
                    "margin": {
                        "top": 20,
                        "right": 20,
                        "bottom": 60,
                        "left": 40
                    },
                    "duration": 100,
                    "useInteractiveGuideline": true,
                    x: function (d) {
                        return d.x;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    "xAxis": {
                        "showMaxMin": false,
                        "tickFormat": function (d) {
                            return d3.time.format('%d %b %H:%M')(new Date(d));
                        }
                    },
                    "x2Axis": {
                        "showMaxMin": false,
                        "tickFormat": function (d) {
                            return null;
                        }
                    },
                    "yAxis": {
                        "tickFormat": function (d) {
                            return d3.format('.1')(d) + '%';
                        }
                    },
                    "lines": {
                        "forceX": [],
                        "forceY": [0, 100]
                    },
                    "lines2": {
                        "forceX": [],
                        "forceY": [0, 100]
                    },
                    "noData": 'Waiting for metrics...',
                    "showLegend": false
                },
                title: {
                    enable: false
                },
                subtitle: {
                    enable: false
                },
                caption: {
                    enable: false
                }
            };
        }
    }

})();

