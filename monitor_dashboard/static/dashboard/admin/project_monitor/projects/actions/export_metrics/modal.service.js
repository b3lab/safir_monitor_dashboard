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
        .factory('horizon.dashboard.admin.project_monitor.projects.actions.export-metrics', exportMetricsService);

    exportMetricsService.$inject = [
        '$q',
        'horizon.framework.widgets.modal.simple-modal.service',
        'horizon.framework.util.i18n.gettext',
        'horizon.framework.util.q.extensions'
    ];

    function exportMetricsService($q, simpleModal, gettext, qExtensions) {

        var labels = {
            title: gettext('Export Metrics'),
            body: gettext('Metrics of this instance will be exported as csv format.' +
                'Do you want to continue?'),
            submit: gettext('Yes'),
            cancel: gettext('No')
        };

        var service = {
            perform: exp,
            allowed: allowed
        };

        return service;

        //////////////

        function exp(instance) {
            return simpleModal.modal(labels).result.then(function do_export() {
                var csvFile = generateCsvFile(instance);
                exportToCsv(instance.name+'_Resource_Usage.csv', csvFile);
            });
        }

        function allowed(instance) {
            return $q.all([
                qExtensions.booleanAsPromise(true)
            ]);
        }

        function generateCsvFile(instance) {
            var processRow = function (row) {
                var finalVal = '';

                var j = 0;
                for (var key in row) {
                    if (key == 'x' || key == 'y') {
                        var innerValue = row[key] === null ? '' : row[key].toString();
                        if (row[key] instanceof Date) {
                            innerValue = row[key].toLocaleString();
                        }
                        var result = innerValue.replace(/"/g, '""');
                        if (result.search(/("|,|\n)/g) >= 0)
                            result = '"' + result + '"';
                        if (j > 0)
                            finalVal += ',';
                        j++;
                        finalVal += result;
                    }
                }

                return finalVal + '\n';
            };

            var processInstanceData = function (csvFile, instance, data_name, heading) {
                for (var i = 0; i < instance[data_name].length; i++) {
                    if (instance[data_name][i]['utils'].length > 1)
                        csvFile = processRows(csvFile,
                                    instance[data_name][i]['utils'],
                                    'TIME,'+instance[data_name][i]['keyname'] + '_' + heading);

                }
                return csvFile;
            };

            var processRows = function (csvFile, rows, header) {
                csvFile += header + '\n';
                for (var i = 0; i < rows.length; i++) {
                    csvFile += processRow(rows[i]);
                }
                csvFile += '\n';
                return csvFile;
            };

            var csvFile = '';

            csvFile = processInstanceData(csvFile, instance, 'cpuUsage', 'CPU_USAGE_(%)');
            csvFile = processInstanceData(csvFile, instance, 'ramUsage', 'RAM_USAGE_(%)');
            csvFile = processInstanceData(csvFile, instance, 'diskUsage', 'DISK_USAGE_(%)');
            csvFile = processInstanceData(csvFile, instance, 'incomingNetworkUsage', 'Incoming_Network_Bandwidth_(Mbps)');
            csvFile = processInstanceData(csvFile, instance, 'outgoingNetworkUsage', 'Outgoing_Network_Bandwidth_(Mbps)');

            return csvFile;
        }


        function exportToCsv(filename, csvFile) {
            var blob = new Blob([csvFile], {type: 'text/csv;charset=utf-8;'});
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, filename);
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }
    }
})();