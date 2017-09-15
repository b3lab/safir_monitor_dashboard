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
        .controller('LaunchAlarmModalController', LaunchAlarmModalController);

    LaunchAlarmModalController.$inject = [
        '$uibModalInstance',
        'horizon.app.core.openstack-service-api.monitor',
        'horizon.framework.util.i18n.gettext',
        // Dependencies injected with resolve by $modal.open
        'instance_id'
    ];

    /**
     * @ngdoc controller
     * @name LaunchAlarmModalController
     * @description
     * Controller used by the modal service for launching an alarm.
     *
     * @param $uibModalInstance The angular bootstrap $uibModalInstance service.
     * @param api The horizon monitor API service.
     * @param gettext The horizon gettext function for translation.
     * @param instance_id The instance id.
     *
     * @returns The Launch Alarm modal controller.
     */

    function LaunchAlarmModalController($uibModalInstance, api, gettext, instance_id) {
        var ctrl = this;

        ctrl.cancel = cancel;
        ctrl.save = save;
        ctrl.saving = false;

        ctrl.name = '';
        ctrl.email = '';
        ctrl.emailError = gettext('Not a valid e-mail address.');

        ctrl.resourceTypes = initResourceTypes();
        ctrl.selectedResourceType = ctrl.resourceTypes[0];

        ctrl.threshold = 80;
        ctrl.thresholdError = gettext('The threshold must be a number between 0 and 100.');
        ctrl.networkThreshold = 800;
        ctrl.networkThresholdError = gettext('The threshold must be a number between 0 and 1000.');

        ctrl.evaluationPeriods = 3;

        ctrl.comparisonOptions = initComparisonOptions();
        ctrl.selectedComparison = ctrl.comparisonOptions[5];

        function save() {
            ctrl.saving = true;

            var metric_name = '';
            if (ctrl.selectedResourceType.key == 'cpu')
                metric_name = 'cpu_util';
            else if (ctrl.selectedResourceType.key == 'ram')
                metric_name = 'memory_util';
            else if (ctrl.selectedResourceType.key == 'disk')
                metric_name = 'disk_util';
            else if (ctrl.selectedResourceType.key == 'incoming_network')
                metric_name = 'network.incoming.bytes.rate';
            else if (ctrl.selectedResourceType.key == 'outgoing_network')
                metric_name = 'network.outgoing.bytes.rate';

            var alarm = {};
            alarm.notification_email =  ctrl.email;
            alarm.metric_name = metric_name;
            alarm.threshold = ctrl.threshold;
            alarm.comparison_operator = ctrl.selectedComparison.key;
            alarm.evaluation_periods = ctrl.evaluationPeriods;
            alarm.resource_id = instance_id;

            launchAlarm(alarm);
        }

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function onSuccess() {
            $uibModalInstance.close();
        }

        function onFailure() {
            ctrl.saving = false;
        }

        function initResourceTypes() {
            var options = [];
            options.push({key: 'cpu', value: 'CPU'});
            options.push({key: 'ram', value: 'RAM'});
            options.push({key: 'disk', value: 'Disk'});
            options.push({key: 'incoming_network', value: 'Incoming Network Traffic'});
            options.push({key: 'outgoing_network', value: 'Outgoing Network Traffic'});
            return options;
        }

        function initComparisonOptions() {
            var options = [];
            options.push({key: 'lt', value: 'Less than'});
            options.push({key: 'le', value: 'Less than or equal to'});
            options.push({key: 'eq', value: 'Equal to'});
            options.push({key: 'ne', value: 'Not equal to'});
            options.push({key: 'ge', value: 'Greater than or equal to'});
            options.push({key: 'gt', value: 'Greater than'});
            return options;
        }

        function launchAlarm(alarm) {
            return api.launchAlarm(alarm).then(onSuccess, onFailure);
        }

    }
})();