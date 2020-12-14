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
            getHosts: getHosts,
            getInstances: getInstances,
            getMeasures: getMeasures,
            getHardwareMeasures: getHardwareMeasures
        };

        return service;

        ///////////////

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
         * @name horizon.app.core.openstack-service-api.monitor.getMeasures
         * @description
         * Get a list of measures for the given metric of the instance
         * @param {string} metric_name
         * @param {string} instance_id
         * @param {string} project_id
         * @param {string} start
         * @param {string} end
         * The listing result is a json object with measure list
         */
        function getMeasures(metric_name, instance_id, project_id, start, end) {
            return apiService.get('/api/monasca/measures/' + metric_name + '/'
                + instance_id + '/'
                + project_id + '/'
                + start + '/'
                + end + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve monasca meaures.'));
                });
        }

        /**
         * @name horizon.app.core.openstack-service-api.monitor.getHardwareMeasures
         * @description
         * Get a list of measures for the given metric of the hypervisor host
         * @param {string} metric_name
         * @param {string} hostname
         * @param {string} start
         * @param {string} end
         * The listing result is a json object with measure list
         */
        function getHardwareMeasures(metric_name, hostname, start, end) {
            return apiService.get('/api/monasca/hardware_measures/' + metric_name + '/'
                + hostname + '/'
                + start + '/'
                + end + '/')
                .error(function () {
                    toastService.add('error', gettext('Unable to retrieve monasca hardware meaures.'));
                });
        }
    }
})();

