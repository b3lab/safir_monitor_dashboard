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

    describe('DeleteAlarmModalController', function () {
        var $controller, monitorAPI, modalInstance;

        function fakedeleteAlarmAPIwithonFailure() {
            return {
                then: function(onSuccess,onFailure) {
                        onFailure();
                }
            };
        }

        function fakedeleteAlarmAPIwithOnSuccess() {
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
            expect(ctrl.saving).toEqual(false)
            expect(ctrl.alarmlist).toBeDefined();
            expect(ctrl.alarmlist[0].key).toEqual('alarm1')
            expect(ctrl.selectedAlarm).toBeDefined();
            expect(ctrl.selectedAlarm.key).toEqual('alarm1')

        });
        it('should dismiss modal on cancel', function () {
            var ctrl = createController(modalInstance);
            ctrl.cancel();
            expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
        });

        it('should close modal on successful save', function () {
            spyOn(monitorAPI, 'deleteAlarm').and.callFake(fakedeleteAlarmAPIwithOnSuccess);
            var ctrl = createController(modalInstance);
            ctrl.save();
            var alarm = {alarm_id: 'alarm1'}
            expect(monitorAPI.deleteAlarm).toHaveBeenCalledWith(alarm);
            expect(modalInstance.close).toHaveBeenCalled();
            expect(ctrl.saving).toEqual(true)
        });
        it('when deleteAlarm API faliure, saving should be false', function () {
            spyOn(monitorAPI, 'deleteAlarm').and.callFake(fakedeleteAlarmAPIwithonFailure);
            var ctrl = createController(modalInstance);
            ctrl.save();
            var alarm = {alarm_id: 'alarm1'}
            expect(monitorAPI.deleteAlarm).toHaveBeenCalledWith(alarm);
            expect(ctrl.saving).toEqual(false)
        });

        function createController() {
            return $controller('DeleteAlarmModalController', {
                '$modalInstance': modalInstance,
                'horizon.app.core.openstack-service-api.monitor': monitorAPI,
                'alarms': {alarm1: 'alarm1'},
            });
        }
    });
})();