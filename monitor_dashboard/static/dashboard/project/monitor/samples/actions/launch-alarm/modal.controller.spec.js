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

    describe('LaunchAlarmModalController', function () {
        var $controller, monitorAPI, modalInstance;

        function fakelaunchAlarmAPIwithonFailure() {
            return {
                then: function(onSuccess,onFailure) {
                        onFailure();
                }
            };
        }

        function fakelaunchAlarmAPIwithOnSuccess() {
            return {
                then: function (onSuccess) {
                    onSuccess();
                }
            };
        }

        beforeEach(function () {
            modalInstance = {
                dismiss: jasmine.createSpy(),
                close: jasmine.createSpy()
            };
        });

        beforeEach(module('horizon.dashboard.project.monitor.samples'));
        beforeEach(module('horizon.app.core'));
        beforeEach(module('horizon.app.core.openstack-service-api'));
        beforeEach(module('horizon.framework'));
        beforeEach(inject(function (_$controller_, $injector) {
            $controller = _$controller_;
            monitorAPI = $injector.get('horizon.app.core.openstack-service-api.monitor');
        }));

        it('should define properties properly', function () {
            var ctrl = createController(modalInstance);
            expect(ctrl.cancel).toBeDefined();
            expect(ctrl.save).toBeDefined();
            expect(ctrl.saving).toBeDefined();
            expect(ctrl.saving).toEqual(false);
            expect(ctrl.name).toBeDefined();
            expect(ctrl.email).toBeDefined();
            expect(ctrl.emailError).toBeDefined();
            expect(ctrl.emailError).toEqual('Not a valid e-mail address.');
            expect(ctrl.resourceTypes).toBeDefined();
            expect(ctrl.resourceTypes[0].key).toEqual('cpu');
            expect(ctrl.selectedResourceType).toBeDefined();
            expect(ctrl.threshold).toBeDefined();
            expect(ctrl.threshold).toEqual(80);
            expect(ctrl.thresholdError).toBeDefined();
            expect(ctrl.thresholdError).toEqual('The threshold must be a number between 0 and 100.');
            expect(ctrl.networkThreshold).toBeDefined();
            expect(ctrl.networkThreshold).toEqual(800);
            expect(ctrl.networkThresholdError).toBeDefined();
            expect(ctrl.networkThresholdError).toEqual('The threshold must be a number between 0 and 1000.');
            expect(ctrl.period).toBeDefined();
            expect(ctrl.period).toEqual(600);
            expect(ctrl.periodError).toBeDefined();
            expect(ctrl.periodError).toEqual('The period must be greater than or equal to 600.');
            expect(ctrl.evaluationPeriods).toBeDefined();
            expect(ctrl.evaluationPeriods).toEqual(3);
            expect(ctrl.comparisonOptions).toBeDefined();
            expect(ctrl.comparisonOptions[0].key).toEqual('lt');
            expect(ctrl.selectedComparison).toBeDefined();
            expect(ctrl.selectedComparison.key).toEqual('gt');
        });
        it('should dismiss modal on cancel', function () {
            var ctrl = createController(modalInstance);
            ctrl.cancel();
            expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
        });
        it('should close modal on successful save', function () {
            spyOn(monitorAPI, 'launchAlarm').and.callFake(fakelaunchAlarmAPIwithOnSuccess);
            var ctrl = createController(modalInstance);
            ctrl.save();
            expect(monitorAPI.launchAlarm).toHaveBeenCalled();
            expect(modalInstance.close).toHaveBeenCalled();
            expect(ctrl.saving).toEqual(true)
        });
        it('when launchAlarm API faliure, saving should be false', function () {
            spyOn(monitorAPI, 'launchAlarm').and.callFake(fakelaunchAlarmAPIwithonFailure);
            var ctrl = createController(modalInstance);
            ctrl.save();
            expect(monitorAPI.launchAlarm).toHaveBeenCalled();
            expect(ctrl.saving).toEqual(false)
        });

        function createController() {
            return $controller('LaunchAlarmModalController', {
                '$uibModalInstance': modalInstance,
                'horizon.app.core.openstack-service-api.monitor': monitorAPI,
                'instance_id': 1,
            });
        }
    });
})();
