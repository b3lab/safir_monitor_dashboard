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

  describe('horizon.dashboard.project.monitor.samples.actions.launch-alarm', function() {
    var service, modal;
    var toastServiceMock = {add: angular.noop};

    beforeEach(module('horizon.dashboard.project.monitor.samples'));
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'))
    beforeEach(module(function($provide) {
      modal = {
        open: function() {
          return {
            result: {
              then: angular.noop
            }
          };
        }
      };
      $provide.value('$uibModal', {});
      $provide.value('$modal', modal);
    }));
    beforeEach(module('horizon.dashboard.project.monitor', function ($provide) {
            $provide.constant('horizon.dashboard.project.monitor.basePath', '/a/sample/path/');
        }));

    beforeEach(inject(function($injector) {
      service = $injector.get('horizon.dashboard.project.monitor.samples.actions.launch-alarm');
      toastServiceMock = $injector.get('horizon.framework.widgets.toast.service');
    }));

    describe('open function tests', function() {
      var func, instance;
      beforeEach(function() {
        func = service.perform;
        instance = {};
      });

      it('calls modal.open', function() {
        spyOn(modal, 'open').and.returnValue({ result: { then: angular.noop } });
        func(instance);
        expect(modal.open).toHaveBeenCalled();
      });

      it('calls modal.open with expected values', function() {
        spyOn(modal, 'open').and.returnValue({ result: { then: angular.noop } });
        instance = { id: 1 };
        func(instance);
        var resolve = modal.open.calls.argsFor(0)[0].resolve;
        expect(resolve).toBeDefined();
        expect(resolve.instance_id).toBeDefined();
        expect(resolve.instance_id()).toEqual(1);
      });

      it('should call toast service', function() {
        spyOn(modal, 'open').and
          .returnValue({
            result: {
              then: function(onModalClose) {
               onModalClose()
              }
            }
          });
        spyOn(toastServiceMock, 'add');
        func(instance);
        expect(toastServiceMock.add).toBeDefined();
        expect(toastServiceMock.add).toHaveBeenCalledWith(
        'success',
        'Launching alarm.'
         );
      });
    });
  });

})();

