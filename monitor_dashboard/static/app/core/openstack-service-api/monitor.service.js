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
        .module('horizon.app.core.openstack-service-api')
        .factory('horizon.app.core.openstack-service-api.monitor', monitorAPI);

    monitorAPI.$inject = [
        'horizon.framework.util.http.service',
        'horizon.framework.widgets.toast.service'
    ];

    /**
     * @ngdoc service
     * @name horizon.app.core.openstack-service-api.monitor
     * @description Provides direct pass through to ceilometer API NO abstraction.
     * @param apiService The horizon core API service.
     * @param toastService The horizon toast service.
     * @returns The monitor service API.
     */

    function monitorAPI(apiService, toastService) {
        var service = {
            getSamples: getSamples,
            getInstanceCPUUtilization: getInstanceCPUUtilization,
            getInstanceRamUtilization: getInstanceRamUtilization,
            getInstanceDiskUtilization: getInstanceDiskUtilization,
            getInstanceNetworkUtilization: getInstanceNetworkUtilization,
            getHostCPUUtilization: getHostCPUUtilization,
            getHostRAMUtilization: getHostRAMUtilization,
            getHostDiskUtilization: getHostDiskUtilization,
            getHostNetworkUtilization: getHostNetworkUtilization,
            getHosts: getHosts,
            getInstances: getInstances,
            getAlarms: getAlarms,
            getInstanceAlarms: getInstanceAlarms,
            launchAlarm: launchAlarm,
            deleteAlarm: deleteAlarm,
        };

        return service;

        ///////////////

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getSamples
         * @description
         * Get a list of samples
         * @param {string} meter_name
         * Ceilometer sample name
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} limit
         * Sample count limit
         * The listing result is a json object with telemetry samples
         */
        function getSamples(meter_name, resource_id, from_date, to_date, limit) {
            console.log('getting samples');
            return apiService.get('/api/ceilometer/samples/' + meter_name + '/'
                + resource_id + '/'
                + from_date + '/'
                + to_date + '/'
                + limit + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve telemetry samples.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getInstanceCPUUtilization
         * @description
         * Get a list of instance cpu utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * @param {string} limit
         * Max sample count
         * The listing result is a json object with cpu utilizations
         */
        function getInstanceCPUUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/instance/cpuutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve instance CPU utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getInstanceRamUtilization
         * @description
         * Get a list of instance ram utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} limit
         * Max sample count
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * The listing result is a json object with instance ram utilizations
         */
        function getInstanceRamUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/instance/ramutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve instance RAM utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getInstanceDiskUtilization
         * @description
         * Get a list of instance disk utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} limit
         * Max sample count
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * The listing result is a json object with instance disk utilizations
         */
        function getInstanceDiskUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/instance/diskutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve instance disk utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getInstanceNetworkUtilization
         * @description
         * Get a list of instance network utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} limit
         * Max sample count
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * The listing result is a json object with instance network utilizations
         */
        function getInstanceNetworkUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/instance/networkutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve instance network utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getHostCPUUtilization
         * @description
         * Get a list of host cpu utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} limit
         * Max sample count
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * The listing result is a json object with host cpu utilizations
         */
        function getHostCPUUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/host/cpuutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve host CPU utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getHostRAMUtilization
         * @description
         * Get a list of host ram utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * @param {string} limit
         * Max sample count
         * The listing result is a json object with host ram utilizations
         */
        function getHostRAMUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/host/ramutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve host RAM utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getHostDiskUtilization
         * @description
         * Get a list of host disk utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * @param {string} limit
         * Max sample count
         * The listing result is a json object with host disk utilizations
         */
        function getHostDiskUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/host/diskutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve host disk utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getHostNetworkUtilization
         * @description
         * Get a list of host network utilization samples
         * @param {string} from_date
         * Samples from this date
         * @param {string} to_date
         * Samples until this date
         * @param {string} resource_id
         * Ceilometer sample resource ID
         * @param {string} limit
         * Max sample count
         * The listing result is a json object with host network utilizations
         */
        function getHostNetworkUtilization(from_date, to_date, limit, resource_id) {
            return apiService.get('/api/ceilometer/host/networkutilization/' + from_date + '/'
                + to_date + '/'
                + limit + '/'
                + resource_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve host network utilizations.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.gethosts
         * @description
         * Get host list
         */
        function getHosts() {
            return apiService.get('/api/instancemonitor/hostlist/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve host list.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getInstances
         * @description
         * Get a list of instances
         * @param {string} project_id
         * Project ID of Instance
         * @param {boolean} all_tenants
         * control admin project or other project
         * The listing result is a json object with instance list
         */
        function getInstances(project_id, all_tenants) {
            return apiService.get('/api/instancemonitor/instances/' + project_id + '/' + all_tenants + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve instance list.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getAlarms
         * @description
         * Get a list of alarms of the instances
         * The listing result is a json object with alarm list
         */
        function getAlarms() {
            return apiService.get('/api/ceilometer/alarms/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve alarm list.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getInstanceAlarms
         * @description
         * @param {string} instance_id
         * instance id
         * Get a list of alarms of the given instance
         * The listing result is a json object with alarm list
         */
        function getInstanceAlarms(instance_id) {
            return apiService.get('/api/ceilometer/instancealarms/' + instance_id + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve instance alarm list.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.launchAlarm
         * @description
         * Launch an alarm with the given parameters
         */
        function launchAlarm(alarm) {
            return apiService.put('/api/ceilometer/alarms/', alarm)
                .error(function () {
                    toastService.add('error', gettext('Unable to launch alarm.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.deleteAlarm
         * @description
         * Delete an alarm
         */
        function deleteAlarm(alarm) {
            return apiService.put('/api/ceilometer/deletealarm/', alarm)
                .error(function () {
                    toastService.add('error', gettext('Unable to delete alarm.'));
                });
        }
    }
})();
