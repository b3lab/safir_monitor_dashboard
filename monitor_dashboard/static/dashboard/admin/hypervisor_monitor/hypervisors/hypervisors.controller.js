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
        .module('horizon.dashboard.admin.hypervisor_monitor.hypervisors')
        .controller('HypervisorMonitorController', HypervisorMonitorController);

    HypervisorMonitorController.$inject = [
        'horizon.app.core.openstack-service-api.monitor',
        'horizon.dashboard.admin.hypervisor_monitor.hypervisors.actions.rowActions'
    ];

    /**
     * @ngdoc controller
     * @name HypervisorMonitorController
     *
     * @description
     * Controller for the HypervisorMonitor Samples
     * @param api The Monitor service API.
     * @param rowActions The row actions service.
     * @returns undefined

     */
    function HypervisorMonitorController(api, rowActions) {

        var ctrl = this;
        ctrl.rowActions = rowActions;

        init();

        ////////////////////////////////
        function init() {
            ctrl.hostList = [];

            ctrl.allselected = true;
            ctrl.toggled = 1;
            ctrl.toggledTime = 1;

            ctrl.from_date = getYesterday().toISOString();
            ctrl.to_date = new Date().toISOString();

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

            configCharts();
            nv.models.tooltip().duration(0);

            ctrl.totalHostCpuData = [];
            ctrl.totalHostRamData = [];
            ctrl.totalHostDiskData = [];
            ctrl.totalHostIncomingNetworkData = [];
            ctrl.totalHostOutgoingNetworkData = [];

            api.getHosts().then(getHosts);
        }

        function getHosts(response) {
            console.time('getHosts');

            for (var i = 0; i < response.data.items.length; i++) {
                var host = {
                    id: response.data.items[i].id,
                    hypervisor_hostname: response.data.items[i].hypervisor_hostname,
                    hypervisor_type: response.data.items[i].hypervisor_type,
                    host_ip: response.data.items[i].host_ip,
                    state: response.data.items[i].state,
                    status: response.data.items[i].status,
                    running_vms: response.data.items[i].running_vms,
                    vcpus: response.data.items[i].vcpus,
                    memory_mb: response.data.items[i].memory_mb,
                    local_gb: response.data.items[i].local_gb,
                    color: response.data.items[i].color,
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
                    selected: true
                };

                ctrl.hostList.push(host);
                getUtilizationData(host.hypervisor_hostname)
            }
            console.timeEnd('getHosts');
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

            ctrl.totalHostCpuData = [];
            ctrl.totalHostRamData = [];
            ctrl.totalHostDiskData = [];
            ctrl.totalHostIncomingNetworkData = [];
            ctrl.totalHostOutgoingNetworkData = [];

            for (var i = 0; i < ctrl.hostList.length; i++) {
                var host = ctrl.hostList[i];
                host.cpuUsage = [];
                host.ramUsage = [];
                host.diskUsage = [];
                host.incomingNetworkUsage = [];
                host.outgoingNetworkUsage = [];

                getUtilizationData(host.hypervisor_hostname);
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

        function getUtilizationData(hostname) {
            api.getHardwareMeasures('hardware.cpu.util', hostname, ctrl.from_date, ctrl.to_date).success(getHardwareMeasures);
            api.getHardwareMeasures('hardware.memory.util', hostname, ctrl.from_date, ctrl.to_date).success(getHardwareMeasures);
            api.getHardwareMeasures('hardware.disk.util', hostname, ctrl.from_date, ctrl.to_date).success(getHardwareMeasures);
            api.getHardwareMeasures('hardware.network.incoming.bytes.rate', hostname, ctrl.from_date, ctrl.to_date).success(getHardwareMeasures);
            api.getHardwareMeasures('hardware.network.outgoing.bytes.rate', hostname, ctrl.from_date, ctrl.to_date).success(getHardwareMeasures);
        }

       function getHardwareMeasures(response) {
            if (response.metric_name != undefined &&
                response.hostname != undefined &&
                response.measures != undefined) {

                var hostname = response.hostname;

                for (var i = 0; i < response.measures.length; ++i) {
                    var util_data = response.measures[i];
                    var utils = [];
                    for (var j = 0; j < util_data.length; j++) {
                        var timestamp = new Date(util_data[j][0]);
                        var volume = parseFloat(util_data[j][1]);
                        utils.push({x: timestamp, y: volume});
                    }

                    if (utils.length > 0) {
                        var k = 0;
                        var found = false;
                        while (k < ctrl.hostList.length) {
                            if (ctrl.hostList[k].hypervisor_hostname == hostname) {
                                var keyname = hostname;
                                setUtilData(ctrl.hostList[k],
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

        function setUtilData (host, utils, metric_name, keyname) {
            var color = host.color;
            var host_data = '';
            var total_data = '';

            if (metric_name == 'hardware.cpu.util') {
                host_data = 'cpuUsage';
                total_data = 'totalHostCpuData';
            }
            else if (metric_name == 'hardware.memory.util') {
                host_data = 'ramUsage';
                total_data = 'totalHostRamData';
            }
            else if (metric_name == 'hardware.disk.util') {
                host_data = 'diskUsage';
                total_data = 'totalHostDiskData';
            }
            else if (metric_name == 'hardware.network.incoming.bytes.rate') {
                host_data = 'incomingNetworkUsage';
                total_data = 'totalHostIncomingNetworkData';
            }
            else if (metric_name == 'hardware.network.outgoing.bytes.rate') {
                host_data = 'outgoingNetworkUsage';
                total_data = 'totalHostOutgoingNetworkData';
            }

            host[host_data].push({'keyname': keyname,
                                  'utils': utils});

            if (utils.length > 1) {
                ctrl[total_data].push({
                    values: utils,
                    key: keyname,
                    color: color
                });
            }

            if (utils.length > 0) {
                if (host_data == "cpuUsage") {
                    host.currentCpuUsage = utils[utils.length - 1].y;
                } else if (host_data == "ramUsage") {
                    host.currentRamUsage = utils[utils.length - 1].y;
                } else if (host_data == "diskUsage") {
                    host.currentDiskUsage = utils[utils.length - 1].y;

                    // if we get disks' utilization separately we need to calculate mean usage
                    // if (host.currentDiskUsage == null) {
                    //     host.currentDiskUsage = utils[utils.length - 1].y;
                    // } else {
                    //     var cnt = host[diskUsage].length;
                    //     host.currentDiskUsage =
                    //         ((host.currentDiskUsage * (cnt - 1)) +  utils[utils.length - 1].y) / cnt;
                    // }
                } else if (host_data == "incomingNetworkUsage") {
                    if (host.currentIncomingNetworkUsage == null) {
                        host.currentIncomingNetworkUsage = utils[utils.length - 1].y;
                    } else {
                        host.currentIncomingNetworkUsage =
                            host.currentIncomingNetworkUsage + utils[utils.length - 1].y;
                    }
                } else if (host_data == "outgoingNetworkUsage") {
                    if (host.currentOutgoingNetworkUsage == null) {
                        host.currentOutgoingNetworkUsage = utils[utils.length - 1].y;
                    } else {
                        host.currentOutgoingNetworkUsage =
                            host.currentOutgoingNetworkUsage + utils[utils.length - 1].y;
                    }
                }
            }
        }

        ctrl.filterUtils = function () {
            resetChart();
        };
        ctrl.selectAll = function () {
            for (var i = 0; i < ctrl.hostList.length; i++) {
                ctrl.hostList[i].selected = ctrl.allselected;
            }
            resetChart();
        };
        function resetChart() {
            ctrl.totalHostCpuData = [];
            ctrl.totalHostRamData = [];
            ctrl.totalHostDiskData = [];
            ctrl.totalHostIncomingNetworkData = [];
            ctrl.totalHostOutgoingNetworkData = [];

            // We collect selected hosts' cpu, ram and disk usage data
            for (var i = 0; i < ctrl.hostList.length; i++) {
                var host = ctrl.hostList[i];
                if (host.selected) {
                    var host = ctrl.hostList[i];
                    showUsage(host, 'cpuUsage', 'totalHostCpuData');
                    showUsage(host, 'ramUsage', 'totalHostRamData');
                    showUsage(host, 'diskUsage', 'totalHostDiskData');
                    showUsage(host, 'incomingNetworkUsage', 'totalHostIncomingNetworkData');
                    showUsage(host, 'outgoingNetworkUsage', 'totalHostOutgoingNetworkData');
                }
            }
        }

        function showUsage(host, host_data, total_data) {
            for (var i = 0; i < host[host_data].length; i++) {
                if (host[host_data][i]['utils'].length > 1)
                    ctrl[total_data].push({
                        values: host[host_data][i]['utils'],
                        key: host[host_data][i]['keyname'],
                        color: host.color
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
            ctrl.networkChartOptions.chart.lines2.forceY = [];
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

