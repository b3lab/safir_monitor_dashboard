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
            ctrl.toggledTime = 1;

            ctrl.from_date = getYesterday().toISOString();
            ctrl.to_date = new Date().toISOString();

            ctrl.currentProject = '';
            keystoneapi.getCurrentUserSession().then(getCurrentUserSession);

            configCharts();
            nv.models.tooltip().duration(0);

            ctrl.toggleTimeButtonOptions = [
                {label: gettext('Daily'), value: 1},
                {label: gettext('Weekly'), value: 2},
                {label: gettext('Monthly'), value: 3}
            ];
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
                                currentCpuUsage: null,
                                currentRamUsage: null,
                                currentDiskUsage: null,
                                currentIncomingNetworkUsage: null,
                                currentOutgoingNetworkUsage: null,
                                selected:true,
                                color:response.items[i].color,
                                host:response.items[i].host,
                                zone:response.items[i].zone,
                                full_flavor:response.items[i].full_flavor
                               };
                ctrl.instancesCache[instance.project_id][instance.id] = instance;
                updateInstanceList([instance]);

                getUtilizationData(instance.project_id, instance.id);
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

        ctrl.timeChanged = function () {
            console.log('Time Changed');
            if (ctrl.toggledTime == 1) {
                ctrl.from_date = getYesterday().toISOString();
            } else if (ctrl.toggledTime == 2) {
                ctrl.from_date = getLastWeek().toISOString();
            } else {
                ctrl.from_date = getLastMonth().toISOString();
            }

            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];

            for (var project_id in ctrl.instancesCache){
                if (ctrl.instancesCache.hasOwnProperty(project_id)) {
                    for (var instance_id in ctrl.instancesCache[project_id]) {
                        if (ctrl.instancesCache[project_id].hasOwnProperty(instance_id)) {
                            var instance = ctrl.instancesCache[project_id][instance_id];
                            instance.cpuUsage = [];
                            instance.ramUsage = [];
                            instance.diskUsage = [];
                            instance.incomingNetworkUsage = [];
                            instance.outgoingNetworkUsage = [];

                            getUtilizationData(project_id, instance_id);
                        }
                    }
                }
            }
        };

        function getYesterday() {
            return new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
        }

        function getLastWeek() {
            var today = new Date();
            return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        }

        function getLastMonth() {
            var today = new Date();
            return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
        }

        function getUtilizationData(project_id, instance_id) {

            api.getMeasures('cpu_util',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
            api.getMeasures('memory_util',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
            api.getMeasures('disk_util',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
            api.getMeasures('network.incoming.bytes.rate',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
            api.getMeasures('network.outgoing.bytes.rate',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
        }

       function getMeasures(response) {
            if (response.metric_name != undefined &&
                response.project_id != undefined &&
                response.instance_id != undefined &&
                response.measures != undefined) {

                var project_id = response.project_id;
                var instance_id = response.instance_id;


                for (var i = 0; i < response.measures.length; ++i) {
                    var resource_id = response.measures[i].resource_id;
                    var util_data = response.measures[i].utils;
                    var utils = [];
                    for (var j = 0; j < util_data.length; j++) {
                        var timestamp = new Date(util_data[j][0]);
                        var volume = parseFloat(util_data[j][2]);
                        utils.push({x: timestamp, y: volume});
                    }

                    if (ctrl.instancesCache.hasOwnProperty(project_id) &&
                        ctrl.instancesCache[project_id].hasOwnProperty(instance_id)) {

                        var keyname = makeKeyName(response.metric_name,
                                                  instance_id,
                                                  ctrl.instancesCache[project_id][instance_id].name,
                                                  resource_id);
                        setUtilData(ctrl.instancesCache[project_id][instance_id],
                                    utils,
                                    response.metric_name,
                                    keyname);
                    }
                }

            }
        }

        function makeKeyName(metric_name, instance_id, instance_name, resource_id) {
            // resource id is the instance id for cpu and memory metrics but,
            // like 9cf62206-8d20-4711-a505-147a5c17ebe6-vda for disk metrics, and
            // instance-00000006-9cf62206-8d20-4711-a505-147a5c17ebe6-tapbeddb63b-19 for network metrics
            // for a user-friendly view we will convert them to be like
            // instance_name or instance_name-vda or instance_name-tapbeddb63b-19
            if (resource_id == instance_id) {
                return instance_name;
            }

            if (metric_name.indexOf("network") !== -1) {
                resource_id = resource_id.substring(resource_id.indexOf(instance_id));
                return resource_id.replace(instance_id, instance_name);
            }

            if (metric_name.indexOf("disk") !== -1) {
                return resource_id.replace(instance_id, instance_name);
            }
        }

        function setUtilData (instance, utils, metric_name, keyname) {
            var color = instance.color;
            var instance_data = '';
            var total_data = '';

            if (metric_name == 'cpu_util') {
                instance_data = 'cpuUsage';
                total_data = 'totalCpuData';
            }
            else if (metric_name == 'memory_util') {
                instance_data = 'ramUsage';
                total_data = 'totalRamData';
            }
            else if (metric_name == 'disk_util') {
                instance_data = 'diskUsage';
                total_data = 'totalDiskData';
            }
            else if (metric_name == 'network.incoming.bytes.rate') {
                instance_data = 'incomingNetworkUsage';
                total_data = 'totalIncomingNetworkData';
            }
            else if (metric_name == 'network.outgoing.bytes.rate') {
                instance_data = 'outgoingNetworkUsage';
                total_data = 'totalOutgoingNetworkData';
            }

            instance[instance_data].push({'keyname': keyname,
                                          'utils': utils});

            if (utils.length > 1) {
                ctrl[total_data].push({
                    values: utils,
                    key: keyname,
                    color: color
                });
            }

            if (utils.length > 0) {
                if (instance_data == "cpuUsage") {
                    instance.currentCpuUsage = utils[utils.length - 1].y;
                } else if (instance_data == "ramUsage") {
                    instance.currentRamUsage = utils[utils.length - 1].y;
                } else if (instance_data == "diskUsage") {
                    instance.currentDiskUsage = utils[utils.length - 1].y;

                    // if we get disks' utilization separately we need to calculate mean usage
                    // if (instance.currentDiskUsage == null) {
                    //     instance.currentDiskUsage = utils[utils.length - 1].y;
                    // } else {
                    //     var cnt = instance[diskUsage].length;
                    //     instance.currentDiskUsage =
                    //         ((instance.currentDiskUsage * (cnt - 1)) +  utils[utils.length - 1].y) / cnt;
                    // }
                } else if (instance_data == "incomingNetworkUsage") {
                    if (instance.currentIncomingNetworkUsage == null) {
                        instance.currentIncomingNetworkUsage = utils[utils.length - 1].y;
                    } else {
                        instance.currentIncomingNetworkUsage =
                            instance.currentIncomingNetworkUsage + utils[utils.length - 1].y;
                    }
                } else if (instance_data == "outgoingNetworkUsage") {
                    if (instance.currentOutgoingNetworkUsage == null) {
                        instance.currentOutgoingNetworkUsage = utils[utils.length - 1].y;
                    } else {
                        instance.currentOutgoingNetworkUsage =
                            instance.currentOutgoingNetworkUsage + utils[utils.length - 1].y;
                    }
                }
            }
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
                        showUsage(instance, 'cpuUsage', 'totalCpuData');
                        showUsage(instance, 'ramUsage', 'totalRamData');
                        showUsage(instance, 'diskUsage', 'totalDiskData');
                        showUsage(instance, 'incomingNetworkUsage', 'totalIncomingNetworkData');
                        showUsage(instance, 'outgoingNetworkUsage', 'totalOutgoingNetworkData');
                    }
                }
            }
        }

        function showUsage(instance, instance_data, total_data) {
            for (var i = 0; i < instance[instance_data].length; i++) {
                if (instance[instance_data][i]['utils'].length > 1)
                    ctrl[total_data].push({
                        values: instance[instance_data][i]['utils'],
                        key: instance[instance_data][i]['keyname'],
                        color: instance.color
                    });
            }
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
                        "bottom": 20,
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
                    "focusMargin": {
                      "top": 10,
                      "right": 20,
                      "bottom": 0,
                      "left": 40
                    },
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

