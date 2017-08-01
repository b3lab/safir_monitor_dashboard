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
     * @param $timeout  AngularJS's wrapper for window.setTimeout
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
            ctrl.selectedProjects = [];
            ctrl.projectList = [];
            ctrl.projectCache = [];

            ctrl.instanceList = [];
            ctrl.allselected = true;
            ctrl.toggled = 1;

            keystoneapi.getProjects().then(getProjects);

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

        function getProjects(response) {
            ctrl.projectList = [];
            for (var i = 0; i < response.data.items.length; i++) {
                if (response.data.items[i].enabled == true) {
                    var current_project = {
                            'id': response.data.items[i].id,
                            'name': response.data.items[i].name,
                            'instances': []
                        };
                    ctrl.projectList.push({
                            'id': response.data.items[i].id,
                            'name': response.data.items[i].name
                        });
                    ctrl.projectCache.push({
                        'id': response.data.items[i].id,
                        'name': response.data.items[i].name,
                        'instances': []
                    });
                    if (response.data.items[i].name == 'admin') {
                        ctrl.selectedProjects.push(current_project);
                    }
                }
            }
        }

        function getProjectIdx(project_id) {
            var i = 0;
            var found = false;
            var idx = -1;
            while (i < ctrl.projectCache.length && !found) {
                if (ctrl.projectCache[i].id == project_id) {
                    idx = i;
                    found = true;
                }
                i += 1;
            }
            return idx;
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
                var idx = getProjectIdx(project_id);
                if (idx >= 0) {
                    if (ctrl.projectCache[idx].instances.length == 0) {
                        api.getInstances(project_id, 1).success(getInstances);
                    }
                    else {
                        ctrl.instanceList = ctrl.projectCache[idx].instances.concat(ctrl.instanceList);
                        resetChart();
                    }
                }
            }
        };

        function getInstances(response) {
            console.time('getInstances');

            // sample count for one instance per day if collected every ten minutes = 144
            var limit = 144;
            var from_date = getYesterday().toISOString();
            var to_date = new Date().toISOString();

            for (var i = 0; i < response.items.length; i++) {
                var idx = getProjectIdx(response.items[i].tenant_id);
                if (idx >= 0) {
                    response.items[i].tenant_name = ctrl.projectCache[idx].name;
                    ctrl.projectCache[idx].instances.push(response.items[i]);
                }
                ctrl.instanceList.push(response.items[i]);

                api.getInstanceCPUUtilization(from_date, to_date, limit, response.items[i].id).success(fillCpuUtilization);
                api.getInstanceRamUtilization(from_date, to_date, limit, response.items[i].id).success(fillMemoryUtilization);
                api.getInstanceDiskUtilization(from_date, to_date, limit, response.items[i].id).success(fillDiskUtilization);
                api.getInstanceNetworkUtilization(from_date, to_date, limit, response.items[i].id).success(fillNetworkUtilization);
            }

            console.timeEnd('getInstances');
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
            var utils = [];

            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var uuid = key;
                    utils[uuid] = [];
                    for (var i = 0; i < data[key].data.length; i++) {
                        var timestamp = new Date(data[key].data[i].timestamp);
                        var volume = data[key].data[i].counter_volume;
                        utils[uuid].push({x: timestamp, y: volume});
                    }
                }
            }

            // Find the instance from instance list and set usage data
            Object.keys(utils).forEach(function (id) {
                var idx = ctrl.instanceList.map(function (x) {
                    return x.id;
                }).indexOf(id);
                if (idx >= 0) {
                    var instancename = ctrl.instanceList[idx].name;
                    var color = ctrl.instanceList[idx].color;
                    var uuid = ctrl.instanceList[idx].id;
                    ctrl.instanceList[idx][instance_data] = utils[uuid];

                    var project_idx = getProjectIdx(ctrl.instanceList[idx].tenant_id);
                    if (project_idx >= 0) {
                        var found = false;
                        var i = 0;
                        while (i < ctrl.projectCache[project_idx].instances.length) {
                            if (ctrl.projectCache[project_idx].instances[i].id == uuid) {
                                ctrl.projectCache[project_idx].instances[i][instance_data] = utils[uuid];
                                found = true;
                            }
                            i += 1;
                        }
                    }

                    resetChart();
                }
            });
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
                    "dispatch": {
                        stateChange: function (t, u) {
                            console.log('stateChange');
                        },
                        changeState: function (e) {
                            console.log('changeState');
                        },
                        tooltipShow: function (e) {
                            console.log('tooltipShow');
                        },
                        tooltipHide: function (e) {
                            console.log('tooltipHide');
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
                        "orient": 'bottom',
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
                        "orient": 'bottom',
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
                        "orient": 'left',
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
                        "orient": 'right',
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
                        "interpolate": 'linear',
                        "xScale": d3.time.scale()
                    },
                    "interactiveLayer": {
                        "dispatch": {},
                        "tooltip": {
                            "duration": 0,
                            "gravity": 'w',
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
                            "id": 'nvtooltip-48782'
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
                        "id": 'nvtooltip-66661'
                    },
                    "width": null,
                    "interpolate": 'linear',
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
                    "legendPosition": 'top',
                    "showXAxis": true,
                    "showYAxis": true,
                    "focusEnable": true,
                    "focusShowAxisX": false,
                    "focusShowAxisY": false,
                    "brushExtent": null,
                    "defaultState": null,
                    "noData": 'Waiting for metrics...',
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

