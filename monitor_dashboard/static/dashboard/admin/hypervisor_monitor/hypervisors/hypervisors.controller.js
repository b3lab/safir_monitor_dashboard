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
        '$scope',
        'horizon.app.core.openstack-service-api.monitor',
        'horizon.dashboard.admin.hypervisor_monitor.hypervisors.actions.rowActions'
    ];

    /**
     * @ngdoc controller
     * @name HypervisorMonitorController
     *
     * @description
     * Controller for the HypervisorMonitor Samples
     * @param $scope An Execution for HypervisorMonitorController AngularJs Expressions
     * @param api The Monitor service API.
     * @param rowActions The row actions service.
     * @returns undefined

     */
    function HypervisorMonitorController($scope, api, rowActions) {

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
            ctrl.hostList = response.data.items;

            var from_date = getYesterday().toISOString();
            var to_date = new Date().toISOString();
            // sample count for one host per day if collected every ten minutes = 144
            ctrl.hostLimit = ctrl.hostList.length * 144
            for (var i = 0; i < ctrl.hostList.length; i++) {
                var hostname = ctrl.hostList[i].hypervisor_hostname;
                api.getHostCPUUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostCpuUtilization);
                api.getHostRAMUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostRamUtilization);
                api.getHostNetworkUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostNetworkUtilization);
                api.getHostDiskUtilization(from_date, to_date, ctrl.hostLimit, hostname).success(fillHostDiskUtilization);
            }
            console.timeEnd('getHosts');
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
            var utils = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var hostname = key;
                    utils[hostname] = [];
                    for (var i = 0; i < data[key].data.length; i++) {
                        var timestamp = new Date(data[key].data[i].timestamp);
                        var volume = data[key].data[i].counter_volume;
                        utils[hostname].push({x: timestamp, y: volume});
                    }
                }
            }
            // Find the host from host list and set usage data
            Object.keys(utils).forEach(function (id) {
                var idx = ctrl.hostList.map(function (x) {
                    return x.hypervisor_hostname;
                }).indexOf(id);
                if (idx >= 0) {
                    var hostname = ctrl.hostList[idx].hypervisor_hostname;

                    ctrl.hostList[idx][host_data] = utils[hostname];

                    if (utils[hostname].length > 1) {
                        ctrl[total_data].push({
                            values: utils[hostname],
                            key: hostname
                        });
                    }
                }
            });
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
                            key: host.hypervisor_hostname
                        });
                    if (host.ramUsage.length > 1)
                        ctrl.totalHostRamData.push({
                            values: host.ramUsage,
                            key: host.hypervisor_hostname
                        });
                    if (host.diskUsage.length > 1)
                        ctrl.totalHostDiskData.push({
                            values: host.diskUsage,
                            key: host.hypervisor_hostname
                        });
                    if (host.incomingNetworkUsage.length > 1)
                        ctrl.totalHostIncomingNetworkData.push({
                            values: host.incomingNetworkUsage,
                            key: host.hypervisor_hostname
                        });
                    if (host.outgoingNetworkUsage.length > 1)
                        ctrl.totalHostOutgoingNetworkData.push({
                            values: host.outgoingNetworkUsage,
                            key: host.hypervisor_hostname
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
                    callback: function (chart) {
                        // alert(chart.container)
                        // chart.container.setAttribute('width','0');
                        $('rect.left').css('width');

                    },
                    "duration": 100,
                    "useInteractiveGuideline": true,
                    x: function (d) {
                        return d.x;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    "dispatch": {
                        stateChange: function (t, u) {
                            console.log("stateChange");
                        },
                        changeState: function (e) {
                            console.log("changeState");
                        },
                        tooltipShow: function (e) {
                            console.log("tooltipShow");
                        },
                        tooltipHide: function (e) {
                            console.log("tooltipHide");
                        }
                    },
                    "xAxis": {
                        "axisLabel": null,
                        "dispatch": {},
                        "axisLabelDistance": 0,
                        "staggerLabels": false,
                        "rotateLabels": 0,
                        "rotateYLabel": true,
                        "showMaxMin": false,
                        "height": 60,
                        "ticks": null,
                        "width": 75,
                        "margin": {
                            "top": 0,
                            "right": 0,
                            "bottom": 0,
                            "left": 0
                        },
                        "duration": 250,
                        "orient": "bottom",
                        "tickValues": null,
                        "tickFormat": function (d) {
                            return d3.time.format('%d %b %H:%M')(new Date(d));
                        },
                        "tickSubdivide": 0,
                        "tickSize": 6,
                        "tickPadding": 7,
                        "domain": [
                            0,
                            1
                        ],
                        "range": [
                            0,
                            1
                        ]
                    },
                    "x2Axis": {
                        "dispatch": {},
                        "axisLabelDistance": 0,
                        "staggerLabels": false,
                        "rotateLabels": 0,
                        "rotateYLabel": true,
                        "showMaxMin": false,
                        "axisLabel": null,
                        "height": 60,
                        "ticks": null,
                        "width": 75,
                        "margin": {
                            "top": 0,
                            "right": 0,
                            "bottom": 0,
                            "left": 0
                        },
                        "duration": 100,
                        "orient": "bottom",
                        "tickValues": null,
                        "tickFormat": function (d) {
                            return null;
                        },
                        "tickSubdivide": 0,
                        "tickSize": 6,
                        "tickPadding": 5,
                        "domain": [
                            0,
                            1
                        ],
                        "range": [
                            0,
                            1
                        ]
                    },
                    "yAxis": {
                        "axisLabel": null,
                        "rotateYLabel": false,
                        "dispatch": {},
                        "axisLabelDistance": 0,
                        "staggerLabels": false,
                        "rotateLabels": 0,
                        "showMaxMin": true,
                        "height": 60,
                        "ticks": null,
                        "width": 75,
                        "margin": {
                            "top": 0,
                            "right": 0,
                            "bottom": 0,
                            "left": 0
                        },
                        "duration": 100,
                        "orient": "left",
                        "tickValues": null,
                        "tickFormat": function (d) {
                            return d3.format('.1')(d) + '%';
                        },
                        "tickSubdivide": 0,
                        "tickSize": 6,
                        "tickPadding": 3,
                        "domain": [
                            0,
                            1
                        ],
                        "range": [
                            0,
                            1
                        ]
                    },
                    "y2Axis": {
                        "dispatch": {},
                        "axisLabelDistance": 0,
                        "staggerLabels": false,
                        "rotateLabels": 0,
                        "rotateYLabel": true,
                        "showMaxMin": true,
                        "axisLabel": null,
                        "height": 100,
                        "ticks": null,
                        "width": 75,
                        "margin": {
                            "top": 0,
                            "right": 0,
                            "bottom": 0,
                            "left": 0
                        },
                        "duration": 250,
                        "orient": "right",
                        "tickValues": null,
                        "tickFormat": function (d) {
                            return null;
                        },
                        "tickSubdivide": 0,
                        "tickSize": 6,
                        "tickPadding": 3,
                        "domain": [
                            0,
                            1
                        ],
                        "range": [
                            0,
                            1
                        ]
                    },
                    "lines": {
                        "dispatch": {},
                        "width": 960,
                        "height": 500,
                        "xDomain": null,
                        "yDomain": null,
                        "pointDomain": [
                            16,
                            256
                        ],
                        "xRange": null,
                        "yRange": null,
                        "pointRange": null,
                        "forceX": [],
                        "forceY": [0, 100],
                        "forcePoint": [],
                        "interactive": true,
                        "padDataOuter": 0.1,
                        "padData": false,
                        "clipEdge": true,
                        "clipVoronoi": true,
                        "showVoronoi": false,
                        "id": 49319,
                        "interactiveUpdateDelay": 300,
                        "showLabels": false,
                        "margin": {
                            "top": 0,
                            "right": 0,
                            "bottom": 0,
                            "left": 0
                        },
                        "duration": 0,
                        "useVoronoi": true,
                        "interpolate": "linear",
                        "xScale": d3.time.scale()
                    },
                    "lines2": {
                        "dispatch": {},
                        "width": 960,
                        "height": 500,
                        "xDomain": null,
                        "yDomain": null,
                        "pointDomain": [
                            16,
                            256
                        ],
                        "xRange": null,
                        "yRange": null,
                        "pointRange": null,
                        "forceX": [],
                        "forceY": [0, 100],
                        "forcePoint": [],
                        "interactive": false,
                        "padDataOuter": 0.1,
                        "padData": false,
                        "clipEdge": false,
                        "clipVoronoi": true,
                        "showVoronoi": false,
                        "id": 29557,
                        "interactiveUpdateDelay": 300,
                        "showLabels": false,
                        "margin": {
                            "top": 0,
                            "right": 0,
                            "bottom": 0,
                            "left": 0
                        },
                        "duration": 250,
                        "useVoronoi": true,
                        "interpolate": "linear",
                        "xScale": d3.time.scale()
                    },
                    "interactiveLayer": {
                        "dispatch": {},
                        "tooltip": {
                            "duration": 0,
                            "gravity": "w",
                            "distance": 25,
                            "snapDistance": 0,
                            "classes": null,
                            "chartContainer": null,
                            "enabled": true,
                            "hideDelay": 0,
                            "headerEnabled": true,
                            "fixedTop": null,
                            "hidden": false,
                            "data": null,
                            "id": "nvtooltip-48782"
                        },
                        "margin": {
                            "left": 40,
                            "top": 30
                        },
                        "width": null,
                        "height": null,
                        "showGuideLine": true,
                        "svgContainer": null
                    },
                    "tooltip": {
                        "duration": 100,
                        "gravity": "w",
                        "distance": 25,
                        "snapDistance": 0,
                        "classes": null,
                        "chartContainer": null,
                        "enabled": true,
                        "hideDelay": 200,
                        "headerEnabled": true,
                        "fixedTop": null,
                        "hidden": true,
                        "data": null,
                        "id": "nvtooltip-66661"
                    },
                    "width": null,
                    "interpolate": "linear",
                    "clipEdge": true,
                    "clipVoronoi": true,
                    "forcePoint": [],
                    "forceX": [],
                    "interactive": true,
                    "interactiveUpdateDelay": 100,
                    "padData": false,
                    "padDataOuter": 0.1,
                    "pointDomain": [
                        16,
                        256
                    ],
                    "pointRange": null,
                    "showLabels": false,
                    "showVoronoi": false,
                    "useVoronoi": true,
                    "xDomain": null,
                    "xRange": null,
                    "yDomain": null,
                    "yRange": null,
                    "showLegend": false,
                    "legendPosition": "top",
                    "showXAxis": true,
                    "showYAxis": true,
                    "focusEnable": true,
                    "focusShowAxisX": false,
                    "focusShowAxisY": false,
                    "brushExtent": null,
                    "defaultState": null,
                    "noData": "Waiting for metrics...",
                    "focusMargin": {
                        "top": 0,
                        "right": 20,
                        "bottom": 20,
                        "left": 60
                    },
                    "rightAlignYAxis": false
                },
                title: {
                    enable: false,
                    text: ''
                },
                subtitle: {
                    enable: false,
                    text: '',
                    css: {
                        'text-align': 'center',
                        'margin': '10px 13px 0px 7px'
                    }
                },
                caption: {
                    enable: false,
                    html: '<b>Figure 1.</b>',
                    css: {
                        'text-align': 'justify',
                        'margin': '10px 13px 0px 7px'
                    }
                }
            };
        }
    }

})();

