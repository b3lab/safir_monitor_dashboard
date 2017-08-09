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

            ctrl.alarmStates = {
                OK: 0,
                ALARM: 0,
                INSUFFICIENT_DATA: 0
            };
            ctrl.alarmStatesChartData = [];

            ctrl.allselected = true;
            ctrl.toggled = 1;
            // get total CPU, MEMORY, DISK and NETWORK usage for all instances this project of last week
            ctrl.totalCpuData = [];
            ctrl.totalRamData = [];
            ctrl.totalDiskData = [];
            ctrl.totalIncomingNetworkData = [];
            ctrl.totalOutgoingNetworkData = [];

            api.getInstances(-1, 0).success(getInstances);

            nv.models.tooltip().duration(0);

            configCharts();

            ctrl.toggleButtonOptions = [
                {label: gettext('CPU Usage'), value: 1},
                {label: gettext('RAM Usage'), value: 2},
                {label: gettext('Disk Usage'), value: 3},
                {label: gettext('Incoming Network Bandwidth'), value: 4},
                {label: gettext('Outgoing Network Bandwidth'), value: 5}
            ];
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
            
            var from_date = getYesterday().toISOString();
            var to_date = new Date().toISOString();
            // sample count for one instance per day if collected every ten minutes = 144
            var limit = ctrl.instanceList.length * 144;

            api.getInstanceCPUUtilization(from_date, to_date, limit).success(fillCpuUtilization);
            api.getInstanceRamUtilization(from_date, to_date, limit).success(fillMemoryUtilization);
            api.getInstanceDiskUtilization(from_date, to_date, limit).success(fillDiskUtilization);
            api.getInstanceNetworkUtilization(from_date, to_date, limit).success(fillNetworkUtilization);
            
            fillInstanceStatesChartData();

            api.getAlarms().then(getAlarms);
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

        function getAlarms(response) {
            Object.keys(response.data.alarmlist).forEach(function (id) {
                var idx = ctrl.instanceList.map(function (x) {
                    return x.id;
                }).indexOf(id);
                if (idx >= 0) {

                    var alarms = response.data.alarmlist[id];
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

        function fillCpuUtilization(response) {
            console.time('fillCpuUtilization');
            if (response.items != undefined) {
                addUtilization(response.items,
                    'cpuUsage',
                    'totalCpuData');
            }
            console.timeEnd('fillCpuUtilization');
        }

        function fillMemoryUtilization(response) {
            console.time('fillMemoryUtilization');
            if (response.items != undefined) {
                addUtilization(response.items,
                    'ramUsage',
                    'totalRamData');
            }
            console.timeEnd('fillMemoryUtilization');
        }

        function fillDiskUtilization(response) {
            console.time('fillDiskUtilization');
            if (response.items != undefined) {
                addUtilization(response.items,
                    'diskUsage',
                    'totalDiskData');
            }
            console.timeEnd('fillDiskUtilization');
        }

        function fillNetworkUtilization(response) {
            console.time('fillNetworkUtilization');
            var incomingtraffic = response.incomingtraffic;
            var outgoingtraffic = response.outgoingtraffic;

            if (incomingtraffic != undefined) {
                addUtilization(incomingtraffic,
                    'incomingNetworkUsage',
                    'totalIncomingNetworkData');
            }
            if (outgoingtraffic != undefined) {
                addUtilization(outgoingtraffic,
                    'outgoingNetworkUsage',
                    'totalOutgoingNetworkData');
            }

            console.timeEnd('fillNetworkUtilization');
        }

        function addUtilization(data, instance_data, total_data) {
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

                            var found = false;
                            var j = 0;
                            while (j < ctrl.instanceList.length && found == false) {
                                if (ctrl.instanceList[j].id == instance_id) {
                                    setUtilData(ctrl.instanceList[j], utils,
                                                instance_data, total_data)
                                    found = true;
                                }
                                j += 1;
                            }
                        }
                    }
                }
            }
        }

        function setUtilData (instance, utils, instance_data, total_data) {
            var instancename = instance.name;
            var color = instance.color;
            instance[instance_data] = utils;

            if (utils.length > 1) {
                ctrl[total_data].push({
                    values: utils,
                    key: instancename,
                    color: color
                });
            }
            if (instance_data == "cpuUsage") {

                if (instance.cpuUsage[instance.cpuUsage.length - 1].y < 20.0) {
                    instance.instanceUsageState = 'IDLE';
                    ctrl.instanceUsages['IDLE'] += 1;
                }
                else if (instance.cpuUsage[instance.cpuUsage.length - 1].y >= 20.0
                    && instance.cpuUsage[instance.cpuUsage.length - 1].y < 80) {
                    instance.instanceUsageState = 'IDEAL';
                    ctrl.instanceUsages['IDEAL'] += 1;
                }
                else {
                    instance.instanceUsageState = 'CRITICAL';
                    ctrl.instanceUsages['CRITICAL'] += 1
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
        
        function sumofUsageData(usagedata) {
            var sumUsage = 0.0;
            for (var i = 0; i < usagedata.length; i++) {
                sumUsage += parseFloat(usagedata[i].y);
            }
            return sumUsage;
        }

        function computeVariance(usagedata, mean) {
            var stdUsageData = 0.0;
            for (var i = 0; i < usagedata.length; i++) {
                stdUsageData += Math.pow(parseFloat(usagedata[i].y) - mean, 2);
            }
            return stdUsageData;
        }

        ctrl.computeBusyUsageTime = function (id, cpuUsage, ramUsage, diskUsage) {
            for (var l = 0; l < ctrl.instanceList.length; l++) {
                if (id == ctrl.instanceList[l].id) {
                    if (ctrl.instanceList[l].highestUsagePeriod.length == 0) {
                        var stdCpu = 0.00;
                        var stdRam = 0.00;
                        var stdDisk = 0.00;
                        var time = [];

                        var sumCpuUsage = sumofUsageData(cpuUsage);
                        var sumRamUsage = sumofUsageData(ramUsage);
                        var sumDiskUsage = sumofUsageData(diskUsage);

                        var meanCpuUsage = (sumCpuUsage / cpuUsage.length).toFixed(5);
                        var meanRamUsage = (sumRamUsage / ramUsage.length).toFixed(5);
                        var meanDiskUsage = (sumDiskUsage / diskUsage.length).toFixed(5);

                        var cpuVariance = computeVariance(cpuUsage, meanCpuUsage);
                        var ramVariance = computeVariance(ramUsage, meanRamUsage);
                        var diskVariance = computeVariance(diskUsage, meanDiskUsage);

                        stdCpu = Math.sqrt(cpuVariance / (cpuUsage.length - 1)).toFixed(3);
                        stdRam = Math.sqrt(ramVariance / (ramUsage.length - 1)).toFixed(3);
                        stdDisk = Math.sqrt(diskVariance / (diskUsage.length - 1)).toFixed(3);

                        if (stdCpu > stdRam && stdCpu > stdDisk) {
                            var highest = parseFloat(stdCpu) + parseFloat(meanCpuUsage);
                            for (var k = 0; k < cpuUsage.length; k++) {
                                if (highest.toFixed(1) <= parseFloat(cpuUsage[k].y).toFixed(1)) {
                                    time.push(cpuUsage[k].x);
                                }
                            }
                        }
                        else if (stdRam > stdCpu && stdRam > stdDisk) {
                            var highest = parseFloat(stdRam) + parseFloat(meanRamUsage);
                            for (var k = 0; k < ramUsage.length; k++) {
                                if (highest.toFixed(1) <= parseFloat(ramUsage[k].y).toFixed(1)) {
                                    time.push(ramUsage[k].x);
                                }
                            }
                        }
                        else {
                            var highest = parseFloat(stdDisk) + parseFloat(meanDiskUsage);
                            for (var k = 0; k < diskUsage.length; k++) {
                                if (highest.toFixed(1) <= parseFloat(diskUsage[k].y).toFixed(1)) {
                                    time.push(diskUsage[k].x);
                                }
                            }
                        }

                        if (time.length > 0) {
                            ctrl.instanceList[l].highestUsagePeriod = time[0].toLocaleString() + "  -  " + time[time.length - 1].toLocaleString()
                        }
                    }
                }
            }
        };

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
        };

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

            // We collect selected instances' cpu, ram and disk usage datum
            for (var i = 0; i < ctrl.instanceList.length; i++) {
                var instance = ctrl.instanceList[i];
                if (instance.selected) {
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