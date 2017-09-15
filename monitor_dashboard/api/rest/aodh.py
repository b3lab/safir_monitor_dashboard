# Copyright 2017 TUBITAK, BILGEM, B3LAB
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""monitor API over ceilometer
"""

from django.conf import settings
from django.views import generic
from monitor_dashboard.api import aodh
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

import uuid


@urls.register
class Alarms(generic.View):
    """ API for AODH alarms
    """
    url_regex = r'aodh/alarms/$'

    @rest_utils.ajax()
    def get(self, request):
        alarms = aodh.alarm_list(request)

        alarmlist = {}
        for alarm in alarms:
            alarm_str = ''
            metric = alarm['gnocchi_resources_threshold_rule']['metric']
            comparison_operator = alarm[
                'gnocchi_resources_threshold_rule']['comparison_operator']
            threshold = alarm[
                'gnocchi_resources_threshold_rule']['threshold']
            evaluation_periods = alarm[
                'gnocchi_resources_threshold_rule']['evaluation_periods']

            if metric == 'cpu_util':
                alarm_str += "CPU "
            elif metric == 'memory_util':
                alarm_str += "RAM "
            elif metric == 'disk_util':
                alarm_str += "Disk "
            elif metric == 'network.incoming.bytes.rate':
                alarm_str += "Incoming Network Traffic "
            elif metric == 'network.outgoing.bytes.rate':
                alarm_str += "Outgoing Network Traffic "

            if comparison_operator == 'lt':
                alarm_str += "less than "
            elif comparison_operator == 'le':
                alarm_str += "less than or equal to "
            elif comparison_operator == 'eq':
                alarm_str += "equal to "
            elif comparison_operator == 'ne':
                alarm_str += "not equal to "
            elif comparison_operator == 'ge':
                alarm_str += "greater than or equal to "
            elif comparison_operator == 'gt':
                alarm_str += "greater than "

            alarm_str += str(threshold)
            alarm_str += ' during ' + str(evaluation_periods) + ' periods'

            alarm['str'] = alarm_str

            resource_id = alarm['gnocchi_resources_threshold_rule'
                                ]['resource_id']
            if resource_id in alarmlist.keys():
                alarmlist[resource_id].append(alarm)
            else:
                alarmlist[resource_id] = []
                alarmlist[resource_id].append(alarm)

        return {'items': alarmlist}

    @rest_utils.ajax()
    def put(self, request, data_required=True):
        """Launch an Aodh alarm with the received parameters
        """
        name = str(uuid.uuid4())

        alarm = {
            "gnocchi_resources_threshold_rule": {
                "resource_id": request.DATA['resource_id'],
                "metric": request.DATA['metric_name'],
                "evaluation_periods": request.DATA['evaluation_periods'],
                "aggregation_method": "mean",
                "threshold": request.DATA['threshold'],
                "comparison_operator": request.DATA['comparison_operator'],
                "resource_type": "instance"
            },
            "alarm_actions": settings.AODH_ALARM_ACTIONS,
            "ok_actions": settings.AODH_OK_ACTIONS,
            "name": name,
            "project_id": request.user.project_id,
            "type": "gnocchi_resources_threshold",
            "description": request.DATA['notification_email']
        }

        aodh.create_alarm(request, alarm)


@urls.register
class InstanceAlarms(generic.View):
    """ API for launching aodh alarm
    """
    url_regex = r'aodh/alarms/instances/(?P<instance_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, instance_id):
        """Get alarms defined for the given instance"""
        alarms = aodh.alarm_list(request)

        items = {}
        for alarm in alarms:
            if alarm['gnocchi_resources_threshold_rule'
                     ]['resource_id'] == instance_id:
                alarm_str = ''
                metric = alarm['gnocchi_resources_threshold_rule']['metric']
                comparison_operator = alarm['gnocchi_resources_threshold_rule'
                                            ]['comparison_operator']
                threshold = alarm[
                    'gnocchi_resources_threshold_rule']['threshold']
                evaluation_periods = alarm[
                    'gnocchi_resources_threshold_rule']['evaluation_periods']

                if metric == 'cpu_util':
                    alarm_str += "CPU "
                elif metric == 'memory_util':
                    alarm_str += "RAM "
                elif metric == 'disk_util':
                    alarm_str += "Disk "
                elif metric == 'network.incoming.bytes.rate':
                    alarm_str += "Incoming Network Traffic "
                elif metric == 'network.outgoing.bytes.rate':
                    alarm_str += "Outgoing Network Traffic "

                if comparison_operator == 'lt':
                    alarm_str += "less than "
                elif comparison_operator == 'le':
                    alarm_str += "less than or equal to "
                elif comparison_operator == 'eq':
                    alarm_str += "equal to "
                elif comparison_operator == 'ne':
                    alarm_str += "not equal to "
                elif comparison_operator == 'ge':
                    alarm_str += "greater than or equal to "
                elif comparison_operator == 'gt':
                    alarm_str += "greater than "

                alarm_str += str(threshold)
                alarm_str += ' during ' + str(evaluation_periods) + ' periods'

                items[alarm['alarm_id']] = alarm_str
        return {'items': items}


@urls.register
class DeleteAlarm(generic.View):
    """ API for launching aodh alarm
    """
    url_regex = r'aodh/alarms/delete/$'

    @rest_utils.ajax()
    def put(self, request, data_required=True):
        """Delete an Aodh alarm"""
        alarm_id = request.DATA['alarm_id']
        aodh.delete_alarm(request, alarm_id)
