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
        .module('horizon.dashboard.project.monitor.samples')
        .controller('MonitorSamplesTableController', MonitorSamplesTableController);

    MonitorSamplesTableController.$inject = [
        '$scope',
        '$timeout',
        'horizon.app.core.openstack-service-api.monitor',
        'horizon.dashboard.project.monitor.samples.actions.rowActions'
    ];

    /**
     * @ngdoc controller
     * @name MonitorSamplesTableController
     *
     * @description
     * Controller for the Monitor Samples table. Serves as the focal point for table actions.
     * @param $scope An Execution for MonitorSamplesTableController AngularJs Expressions
     * @param $timeout  AngularJS's wrapper for window.setTimeout
     * @param api The Monitor service API.
     * @param rowActions The row actions service.
     * @returns undefined
     */

    function MonitorSamplesTableController($scope,
                                           $timeout,
                                           api,
                                           rowActions) {

        var ctrl = this;
        ctrl.rowActions = rowActions;


        init();
        ////////////////////////////////

        function init() {
            ctrl.instanceList = [];

            ctrl.instanceStates = {
                ACTIVE: 0,
                ERROR: 0
            };
            ctrl.instanceStatesChartData = [];

            ctrl.instanceUsages = {
                IDLE: 0,
                IDEAL: 0,
                CRITICAL: 0
            };
            ctrl.instanceUsagesChartData = [];

            /*
            ctrl.alarmStates = {
                OK: 0,
                ALARM: 0,
                INSUFFICIENT_DATA: 0
            };
            ctrl.alarmStatesChartData = [];
            */

            ctrl.allselected = true;
            ctrl.toggled = 1;
            ctrl.toggledTime = 1;

            ctrl.from_date = getYesterday().toISOString();
            ctrl.to_date = new Date().toISOString();

            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];

            api.getInstances(-1, 0).success(getInstances);

            nv.models.tooltip().duration(0);

            configCharts();

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

        ctrl.timeChanged = function () {
            console.log('Time Changed');
            if (ctrl.toggledTime == 1) {
                ctrl.from_date = getYesterday().toISOString();
            } else if (ctrl.toggledTime == 2) {
                ctrl.from_date = getLastWeek().toISOString();
            } else {
                ctrl.from_date = getLastMonth().toISOString();
            }
            getUtilizationData();
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

        function getInstances(response) {
            console.time('getInstances');

            for (var i = 0; i < response.items.length; ++i) {
                var instance = {
                    id: response.items[i].id,
                    name: response.items[i].name,
                    status: response.items[i].status,
                    created: response.items[i].created,
                    project_id: response.items[i].tenant_id,
                    cpuUsage: [],
                    ramUsage: [],
                    diskUsage: [],
                    incomingNetworkUsage: [],
                    outgoingNetworkUsage: [],
                    currentCpuUsage: null,
                    currentRamUsage: null,
                    currentDiskUsage: null,
                    currentIncomingNetworkUsage: null,
                    currentOutgoingNetworkUsage: null,
                    selected: true,
                    color: response.items[i].color,
                    host: response.items[i].host,
                    zone: response.items[i].zone,
                    full_flavor: response.items[i].full_flavor,
                    highestUsagePeriod: ''
                };
                ctrl.instanceList.push(instance);
            }
            getUtilizationData();
            console.timeEnd('getInstances');
        }

        function getUtilizationData() {

            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];

            for (var i = 0; i < ctrl.instanceList.length; i++) {
                var instance = ctrl.instanceList[i];
                instance.cpuUsage = [];
                instance.ramUsage = [];
                instance.diskUsage = [];
                instance.incomingNetworkUsage = [];
                instance.outgoingNetworkUsage = [];

                var instance_id = instance.id;
                var project_id = instance.project_id;
                api.getMeasures('cpu_util',instance_id, project_id, ctrl.from_date, ctrl.to_date, instance.full_flavor.vcpus).success(getMeasures);
                api.getMeasures('memory_util',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
                api.getMeasures('disk_util',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
                api.getMeasures('network.incoming.bytes.rate',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
                api.getMeasures('network.outgoing.bytes.rate',instance_id, project_id, ctrl.from_date, ctrl.to_date).success(getMeasures);
            }

            fillInstanceStatesChartData();

            //api.getAlarms().then(getAlarms);
        }

        function fillInstanceStatesChartData() {

            for (var i = 0; i < ctrl.instanceList.length; i++) {
                if (ctrl.instanceStates.hasOwnProperty(ctrl.instanceList[i].status)) {
                    ctrl.instanceStates[ctrl.instanceList[i].status] += 1;
                } else {
                    ctrl.instanceStates[ctrl.instanceList[i].status] = 1;
                }
            }

            ctrl.instanceStatesChartData = [{
                key: 'NO_DATA',
                y: 0
            }];
            for (var k in ctrl.instanceStates) {
                if (ctrl.instanceStates.hasOwnProperty(k)) {
                    if (ctrl.instanceStates[k] > 0) {
                        ctrl.instanceStatesChartData.push({
                            key: k,
                            y: ctrl.instanceStates[k],
                            color: getColor(k)
                        });
                    }
                }
            }
        }

        function getMeasures(response) {
            if (response.metric_name != undefined &&
                response.project_id != undefined &&
                response.instance_id != undefined &&
                response.measures != undefined) {


                for (var i = 0; i < response.measures.length; ++i) {
                    var util_data = response.measures[i];
                    var utils = [];
                    for (var j = 0; j < util_data.length; j++) {
                        var timestamp = new Date(util_data[j][0]);
                        var volume = parseFloat(util_data[j][1]);
                        utils.push({x: timestamp, y: volume});
                    }

                    if (utils.length > 0) {
                        var found = false;
                        var k = 0;
                        while (k < ctrl.instanceList.length && found == false) {
                            if (ctrl.instanceList[k].id == response.instance_id) {
                                var keyname = ctrl.instanceList[k].name;
                                setUtilData(ctrl.instanceList[k],
                                            utils,
                                            response.metric_name,
                                            keyname);
                                found = true;
                            }
                            k += 1;
                        }
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

        /*
        function getAlarms(response) {
            Object.keys(response.data.items).forEach(function (id) {
                var idx = ctrl.instanceList.map(function (x) {
                    return x.id;
                }).indexOf(id);
                if (idx >= 0) {

                    var alarms = response.data.items[id];
                    ctrl.instanceList[idx]['alarms'] = alarms;
                    for (var i = 0; i < alarms.length; ++i) {
                        if (alarms[i].state == 'ok') {
                            ctrl.alarmStates['OK'] += 1;
                        } else if (alarms[i].state == 'insufficient data') {
                            ctrl.alarmStates['INSUFFICIENT_DATA'] += 1;
                        } else if (alarms[i].state == 'alarm') {
                            ctrl.alarmStates['ALARM'] += 1;
                        }
                    }
                }
            });

            fillAlarmStatesChartData();
        }

        function fillAlarmStatesChartData() {
            ctrl.alarmStatesChartData = [{
                key: 'NO_DATA',
                y: 0
            }];
            for (var k in ctrl.alarmStates) {
                if (ctrl.alarmStates.hasOwnProperty(k)) {
                    if (ctrl.alarmStates[k] > 0) {
                        ctrl.alarmStatesChartData.push({
                            key: k,
                            y: ctrl.alarmStates[k],
                            color: getColor(k)
                        });
                    }
                }
            }
        }
        */
        
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

                    if (utils[utils.length - 1].y < 20.0) {
                        instance.instanceUsageState = 'IDLE';
                        ctrl.instanceUsages['IDLE'] += 1;
                    }
                    else if (utils[utils.length - 1].y >= 20.0
                        && utils[utils.length - 1].y < 80) {
                        instance.instanceUsageState = 'IDEAL';
                        ctrl.instanceUsages['IDEAL'] += 1;
                    }
                    else {
                        instance.instanceUsageState = 'CRITICAL';
                        ctrl.instanceUsages['CRITICAL'] += 1
                    }
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

            if (instance_data == "cpuUsage") {
                fillInstanceUsageChartData();
            }
        }

        function fillInstanceUsageChartData() {
            ctrl.instanceUsagesChartData = [{
                key: 'NO_DATA',
                y: 0
            }];
            for (var k in ctrl.instanceUsages) {
                if (ctrl.instanceUsages.hasOwnProperty(k)) {
                    if (ctrl.instanceUsages[k] > 0) {
                        ctrl.instanceUsagesChartData.push({
                            key: k,
                            y: ctrl.instanceUsages[k],
                            color: getColor(k)
                        });
                    }
                }
            }
        }

        function getColor(val) {
            if (val.toUpperCase() == 'ACTIVE' ||
                val.toUpperCase() == 'IDEAL' ||
                val.toUpperCase() == 'OK')
                return '#007500';
            else if (val.toUpperCase() == 'ERROR' ||
                val.toUpperCase() == 'CRITICAL' ||
                val.toUpperCase() == 'ALARM')
                return '#750000';
            else if (val.toUpperCase() == 'BUILD' ||
                val.toUpperCase() == 'INSUFFICIENT_DATA')
                return '#dddd00';
            else if (val.toUpperCase() == 'SHUTOFF' ||
                val.toUpperCase() == 'IDLE')
                return '#bbbbbb';
            else return '#' + Math.floor(Math.random() * 16777215).toString(16);
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
            console.log('resetChart called');
            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];

            // We collect selected instances' cpu, ram and disk usage data
            for (var i = 0; i < ctrl.instanceList.length; i++) {
                var instance = ctrl.instanceList[i];
                if (instance.selected) {
                    showUsage(instance, 'cpuUsage', 'totalCpuData');
                    showUsage(instance, 'ramUsage', 'totalRamData');
                    showUsage(instance, 'diskUsage', 'totalDiskData');
                    showUsage(instance, 'incomingNetworkUsage', 'totalIncomingNetworkData');
                    showUsage(instance, 'outgoingNetworkUsage', 'totalOutgoingNetworkData');
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

            ctrl.pieCharOptions = getPieChartOptions();
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

        function getPieChartOptions() {
            return {
                chart: {
                    type: 'pieChart',
                    height: 150,
                    align: 'center',

                    x: function (d) {
                        return d.key;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    showLabels: false,
                    showLegend: false,
                    transitionDuration: 500,
                    tooltips: false,
                    valueFormat: function (d) {
                        return d3.format('.1')(d);
                    },
                    donut: true,
                    duration: 500,
                    legend: {
                        margin: {
                            top: 5,
                            right: 35,
                            bottom: 5,
                            left: 0
                        }
                    }
                }
            }
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
