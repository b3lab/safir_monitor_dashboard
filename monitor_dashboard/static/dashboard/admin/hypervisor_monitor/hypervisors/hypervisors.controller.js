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
            ctrl.toggleButtonOptions = [
                {label: gettext('CPU Usage'), value: 1},
                {label: gettext('RAM Usage'), value: 2},
                {label: gettext('Disk Usage'), value: 3},
                {label: gettext('Incoming Network Bandwidth'), value: 4},
                {label: gettext('Outgoing Network Bandwidth'), value: 5}
            ];
            ctrl.toggled = 1;

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
                    selected: true
                };

                ctrl.hostList.push(host);
                getUtilizationData(host.hypervisor_hostname)
            }
            console.timeEnd('getHosts');
        }

        function getUtilizationData(hostname) {

            var from_date = getYesterday().toISOString();
            var to_date = new Date().toISOString();
            // sample count for one host per day if collected every ten minutes = 144
            ctrl.hostLimit = ctrl.hostList.length * 144;

            api.getHostCPUUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostCpuUtilization);
            api.getHostRAMUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostRamUtilization);
            api.getHostNetworkUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostNetworkUtilization);
            api.getHostDiskUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostDiskUtilization);
        }

        function fillHostCpuUtilization(response) {
            console.time('fillHostCpuUtilization');
            if (response.items != undefined) {
                addHostUtilization(response.items,
                    'cpuUsage',
                    'totalHostCpuData');
            }
            console.timeEnd('fillHostCpuUtilization');
        }

        function fillHostRamUtilization(response) {
            console.time('fillHostRamUtilization');
            if (response.items != undefined) {
                addHostUtilization(response.items,
                    'ramUsage',
                    'totalHostRamData');
            }
            console.timeEnd('fillHostRamUtilization');
        }

        function fillHostNetworkUtilization(response) {
            console.time('fillHostNetworkUtilization');
            var incomingtraffic = response.incomingtraffic;
            var outgoingtraffic = response.outgoingtraffic;

            if (incomingtraffic != undefined) {
                addHostUtilization(incomingtraffic,
                    'incomingNetworkUsage',
                    'totalHostIncomingNetworkData');
            }
            if (outgoingtraffic != undefined) {
                addHostUtilization(outgoingtraffic,
                    'outgoingNetworkUsage',
                    'totalHostOutgoingNetworkData');
            }
            console.timeEnd('fillHostNetworkUtilization');
        }

        function fillHostDiskUtilization(response) {
            console.time('fillHostDiskUtilization');
            if (response.items != undefined) {
                addHostUtilization(response.items,
                    'diskUsage',
                    'totalHostDiskData');
            }
            console.timeEnd('fillHostDiskUtilization');
        }

        function addHostUtilization(data, host_data, total_data) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var hostname = key;
                    var utils = [];
                    for (var i = 0; i < data[key].data.length; i++) {
                        var timestamp = new Date(data[key].data[i].timestamp);
                        var volume = parseFloat(data[key].data[i].counter_volume);
                        utils.push({x: timestamp, y: volume});
                    }

                    var found = false;
                    var j = 0;
                    while (j < ctrl.hostList.length) {
                        if (ctrl.hostList[j].hypervisor_hostname == hostname) {
                            ctrl.hostList[j][host_data] = utils;
                            found = true;

                            if (utils.length > 1) {
                                ctrl[total_data].push({
                                    values: utils,
                                    key: hostname,
                                    color: ctrl.hostList[j].color
                                });
                            }
                        }
                        j += 1;
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

            // We collect selected hosts' cpu, ram and disk usage datum
            for (var i = 0; i < ctrl.hostList.length; i++) {
                var host = ctrl.hostList[i];
                if (host.selected) {
                    if (host.cpuUsage.length > 1)
                        ctrl.totalHostCpuData.push({
                            values: host.cpuUsage,
                            key: host.hypervisor_hostname,
                            color: host.color
                        });
                    if (host.ramUsage.length > 1)
                        ctrl.totalHostRamData.push({
                            values: host.ramUsage,
                            key: host.hypervisor_hostname,
                            color: host.color
                        });
                    if (host.diskUsage.length > 1)
                        ctrl.totalHostDiskData.push({
                            values: host.diskUsage,
                            key: host.hypervisor_hostname,
                            color: host.color
                        });
                    if (host.incomingNetworkUsage.length > 1)
                        ctrl.totalHostIncomingNetworkData.push({
                            values: host.incomingNetworkUsage,
                            key: host.hypervisor_hostname,
                            color: host.color
                        });
                    if (host.outgoingNetworkUsage.length > 1)
                        ctrl.totalHostOutgoingNetworkData.push({
                            values: host.outgoingNetworkUsage,
                            key: host.hypervisor_hostname,
                            color: host.color
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

