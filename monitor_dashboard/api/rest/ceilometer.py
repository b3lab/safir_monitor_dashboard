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
from monitor_dashboard.api import ceilometer
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

import datetime
import time
import uuid
# sample count of an instance for one week if collected every ten minutes
# TODO!: This value should be configurable
default_api_limit = 1008
bps_to_mbps = 0.000001


def make_hardware_query(from_date=None, to_date=None, resource_id=None):
    query = []

    if from_date is not None and from_date != 'undefined':
        try:
            d = datetime.datetime.strptime(from_date, "%Y-%m-%dT%H:%M:%S.%fZ")
            query.append(dict(field='timestamp',
                              op='gt',
                              value=d))
        except ValueError as e:
            print('ERROR: ' + e.message)
            from_date = None
        except AttributeError as e:
            print('ERROR: ' + e.message)
            from_date = None

    if to_date is not None and to_date != 'undefined':
        try:
            d = datetime.datetime.strptime(to_date, "%Y-%m-%dT%H:%M:%S.%fZ")
            query.append(dict(field='timestamp',
                              op='lt',
                              value=d))
        except ValueError as e:
            print('ERROR: ' + e.message)
            to_date = None
        except AttributeError as e:
            print('ERROR: ' + e.message)
            to_date = None

    if resource_id is not None and resource_id != 'undefined':
        query.append(dict(field='resource_id',
                          op='eq',
                          value=resource_id))

    return query


def make_query(from_date=None, to_date=None, resource_id=None):
    query = []

    if from_date is not None and from_date != 'undefined':
        try:
            d = datetime.datetime.strptime(from_date, "%Y-%m-%dT%H:%M:%S.%fZ")
            query.append(dict(field='timestamp',
                              op='gt',
                              value=d))
        except ValueError as e:
            print('ERROR: ' + e.message)
            from_date = None
        except AttributeError as e:
            print('ERROR: ' + e.message)
            from_date = None

    if to_date is not None and to_date != 'undefined':
        try:
            d = datetime.datetime.strptime(to_date, "%Y-%m-%dT%H:%M:%S.%fZ")
            query.append(dict(field='timestamp',
                              op='lt',
                              value=d))
        except ValueError as e:
            print('ERROR: ' + e.message)
            to_date = None
        except AttributeError as e:
            print('ERROR: ' + e.message)
            to_date = None

    if resource_id is not None and resource_id != 'undefined':
        query.append(dict(field='metadata.instance_id',
                          op='eq',
                          value=resource_id))

    return query


@urls.register
class Samples(generic.View):
    """ API for ceilometer samples
    """
    url_regex = r'ceilometer/samples/' \
                r'(?P<meter_name>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, meter_name, resource_id, from_date, to_date, limit):
        """Get a detailed list of ceilometer samples of the system.

        Example GET:
        http://localhost/api/ceilometer/samples?meter_name=cpu_util

        :param meter_name: Ceilometer meter name, includes options
               such as cpu_utils, compute.node.cpu.percent
        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param resource_id: Resource ID
        :param limit: Max sample count

        """
        query = make_query(resource_id, from_date, to_date)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        # query = [dict(field='timestamp', op='gt',
        #  value='2017-03-02T13:25:09')]
        samples = ceilometer.sample_list(request,
                                         meter_name=meter_name,
                                         query=query,
                                         limit=limit)

        return {'items': samples}


@urls.register
class CpuUtilization(generic.View):
    """ API for CPU utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/instance/cpuutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall CPU utilization of the system for the given
        time period.

        Example GET:
        http://localhost/api/ceilometer/cpuutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID
        """
        start_time = time.time()
        query = make_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='cpu_util',
                                         query=query,
                                         limit=limit)

        samples.sort(key=lambda d: d['timestamp'])

        utils = {}

        for data in samples:
            project_id = data['project_id']
            instance_id = data['instance_id']

            if project_id not in utils:
                utils[project_id] = {}

            if instance_id not in utils[project_id]:
                utils[project_id][instance_id] = {}
                utils[project_id][instance_id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[project_id][instance_id]['data'].append(data)

        print("--- CpuUtilization %s seconds ---" % (time.time() - start_time))
        return {'items': utils}


@urls.register
class RamUtilization(generic.View):
    """ API for RAM utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/instance/ramutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)' \
                r'/(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall RAM utilization of the system
           for the given time period.

        Example GET:
        http://localhost/api/ceilometer/ramutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID

        NOTE!: Add the following source and sink to Ceilometer's
        pipeline.yaml configuration file

        sources:
          - name: memory_source
            interval: 600
            meters:
              - "memory.usage"
            sinks:
              - memory_sink
        sinks:
          - name: memory_sink
            transformers:
              - name: "arithmetic"
                parameters:
                  target:
                    name: "memory_util"
                    unit: "%"
                    type: "gauge"
                    expr: "100.0 * $(memory.usage) /
                    ($(memory.usage).resource_metadata.memory_mb)"

        """
        start_time = time.time()
        query = make_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='memory_util',
                                         query=query,
                                         limit=limit)

        samples.sort(key=lambda d: d['timestamp'])

        utils = {}

        for data in samples:
            project_id = data['project_id']
            instance_id = data['instance_id']

            if project_id not in utils:
                utils[project_id] = {}

            if instance_id not in utils[project_id]:
                utils[project_id][instance_id] = {}
                utils[project_id][instance_id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[project_id][instance_id]['data'].append(data)

        print("--- RamUtilization %s seconds ---" % (time.time() -
                                                     start_time))
        return {'items': utils}


@urls.register
class DiskUtilization(generic.View):
    """ API for DISK utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/instance/diskutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)' \
                r'/(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall DISK utilization of the system
           for the given time period.

        Example GET:
        http://localhost/api/ceilometer/diskutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID

        NOTE!: Add the following source and sink to Ceilometer's
        pipeline.yaml configuration file

        sources:
          - name: disk_util_source
            interval: 600
            meters:
              - "disk.capacity"
              - "disk.allocation"
            sinks:
              - disk_util_sink
        sinks:
          - name: disk_util_sink
            transformers:
              - name: "arithmetic"
                parameters:
                  target:
                    name: "disk_util"
                    unit: "%"
                    type: "gauge"
                    expr: "100 * $(disk.allocation) / $(disk.capacity)"

        """
        start_time = time.time()
        query = make_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='disk_util',
                                         query=query,
                                         limit=limit)

        samples.sort(key=lambda d: d['timestamp'])

        utils = {}

        for data in samples:
            project_id = data['project_id']
            instance_id = data['instance_id']

            if project_id not in utils:
                utils[project_id] = {}

            if instance_id not in utils[project_id]:
                utils[project_id][instance_id] = {}
                utils[project_id][instance_id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[project_id][instance_id]['data'].append(data)

        print("--- DiskUtilization %s seconds ---"
              % (time.time() - start_time))
        return {'items': utils}


@urls.register
class NetworkUtilization(generic.View):
    """ API for Network utilization monitor
    """
    url_regex = r'ceilometer/instance/networkutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)' \
                r'/(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall Network utilization of the system
           for the given query parameters.

        Example GET:
        http://localhost/api/ceilometer/networkutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID
        """
        start_time = time.time()
        query = make_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        incomingtraffic = ceilometer.sample_list(request,
                                                 meter_name='network.'
                                                            'incoming.'
                                                            'bytes.'
                                                            'rate',
                                                 query=query,
                                                 limit=limit)

        outgoingtraffic = ceilometer.sample_list(request,
                                                 meter_name='network.'
                                                            'outgoing.'
                                                            'bytes.'
                                                            'rate',
                                                 query=query,
                                                 limit=limit)

        if len(incomingtraffic) == 0 and len(outgoingtraffic) == 0:
            return {'items': []}

        incomingtraffic.sort(key=lambda d: d['timestamp'])
        outgoingtraffic.sort(key=lambda d: d['timestamp'])

        incomingutils = {}
        outgoingutils = {}

        for data in incomingtraffic:
            project_id = data['project_id']
            instance_id = data['instance_id']

            if project_id not in incomingutils:
                incomingutils[project_id] = {}

            if instance_id not in incomingutils[project_id]:
                incomingutils[project_id][instance_id] = {}
                incomingutils[project_id][instance_id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                float(data['counter_volume']) * 8.0 * bps_to_mbps)
            incomingutils[project_id][instance_id]['data'].append(data)

        for data in outgoingtraffic:
            project_id = data['project_id']
            instance_id = data['instance_id']

            if project_id not in outgoingutils:
                outgoingutils[project_id] = {}

            if instance_id not in outgoingutils[project_id]:
                outgoingutils[project_id][instance_id] = {}
                outgoingutils[project_id][instance_id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                float(data['counter_volume']) * 8.0 * bps_to_mbps)
            outgoingutils[project_id][instance_id]['data'].append(data)

        print("--- NetworkUtilization %s seconds ---" % (time.time() -
                                                         start_time))
        return {'incomingtraffic': incomingutils,
                'outgoingtraffic': outgoingutils}


@urls.register
class Alarms(generic.View):
    """ API for launching aodh alarm
    """
    url_regex = r'ceilometer/alarms/$'

    @rest_utils.ajax()
    def get(self, request):
        """Get alarms defined for the project"""

        alarms = ceilometer.alarm_list(request)

        alarmlist = {}
        for alarm in alarms:
            alarm_str = ''
            if alarm['meter_name'] == 'cpu_util':
                alarm_str += "CPU "
            elif alarm['meter_name'] == 'memory_util':
                alarm_str += "RAM "
            elif alarm['meter_name'] == 'disk_util':
                alarm_str += "Disk "
            elif alarm['meter_name'] == 'network.incoming.bytes.rate':
                alarm_str += "Incoming Network Traffic "
            elif alarm['meter_name'] == 'network.outgoing.bytes.rate':
                alarm_str += "Outgoing Network Traffic "

            if alarm['comparison_operator'] == 'lt':
                alarm_str += "less than "
            elif alarm['comparison_operator'] == 'le':
                alarm_str += "less than or equal to "
            elif alarm['comparison_operator'] == 'eq':
                alarm_str += "equal to "
            elif alarm['comparison_operator'] == 'ne':
                alarm_str += "not equal to "
            elif alarm['comparison_operator'] == 'ge':
                alarm_str += "greater than or equal to "
            elif alarm['comparison_operator'] == 'gt':
                alarm_str += "greater than "

            alarm_str += str(alarm['threshold'])
            alarm_str += ' during ' + str(alarm['evaluation_periods']) + ' x '\
                         + str(alarm['period']) + 's'

            alarm['str'] = alarm_str

            if alarm['instance_id'] in alarmlist.keys():
                alarmlist[alarm['instance_id']].append(alarm)
            else:
                alarmlist[alarm['instance_id']] = []
                alarmlist[alarm['instance_id']].append(alarm)

        return {'alarmlist': alarmlist}

    @rest_utils.ajax()
    def put(self, request, data_required=True):
        """Launch an Aodh alarm with the received parameters
        """
        project_id = request.user.project_id
        email = request.DATA['notification_email']
        resource_type = request.DATA['resource_type']
        threshold = request.DATA['threshold']
        comparison_operator = request.DATA['comparison_operator']
        period = request.DATA['period']
        evaluation_periods = request.DATA['evaluation_periods']
        resource_id = request.DATA['resource_id']

        name = str(uuid.uuid4())

        meter_name = ''
        if resource_type == 'cpu':
            meter_name = 'cpu_util'
        elif resource_type == 'ram':
            meter_name = 'memory_util'
        elif resource_type == 'disk':
            meter_name = 'disk_util'
        elif resource_type == 'incoming_network':
            meter_name = 'network.incoming.bytes.rate'
        elif resource_type == 'outgoing_network':
            meter_name = 'network.outgoing.bytes.rate'

        statistic = 'avg'

        alarm_actions = settings.AODH_ALARM_ACTIONS
        ok_actions = settings.AODH_OK_ACTIONS

        ceilometer.create_alarm(request,
                                name=name,
                                # used to send email notification
                                #  by safir_alarm_service
                                description=email,
                                meter_name=meter_name,
                                threshold=threshold,
                                comparison_operator=comparison_operator,
                                statistic=statistic,
                                period=period,
                                evaluation_periods=evaluation_periods,
                                alarm_actions=alarm_actions,
                                ok_actions=ok_actions,
                                resource_id=resource_id,
                                project_id=project_id)


@urls.register
class DeleteAlarm(generic.View):
    """ API for launching aodh alarm
    """
    url_regex = r'ceilometer/deletealarm/$'

    @rest_utils.ajax()
    def put(self, request, data_required=True):
        """Delete an Aodh alarm"""
        alarm_id = request.DATA['alarm_id']
        ceilometer.delete_alarm(request, alarm_id)


@urls.register
class InstanceAlarms(generic.View):
    """ API for launching aodh alarm
    """
    url_regex = r'ceilometer/instancealarms/(?P<instance_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, instance_id):
        """Get alarms defined for the givem instance"""
        alarms = ceilometer.alarm_list(request)

        items = {}
        for alarm in alarms:
            if alarm['instance_id'] == instance_id:
                alarm_str = ''

                if alarm['meter_name'] == 'cpu_util':
                    alarm_str += "CPU "
                elif alarm['meter_name'] == 'memory_util':
                    alarm_str += "RAM "
                elif alarm['meter_name'] == 'disk_util':
                    alarm_str += "Disk "
                elif alarm['meter_name'] == 'network.incoming.bytes.rate':
                    alarm_str += "Incoming Network Traffic "
                elif alarm['meter_name'] == 'network.outgoing.bytes.rate':
                    alarm_str += "Outgoing Network Traffic "

                if alarm['comparison_operator'] == 'lt':
                    alarm_str += "less than "
                elif alarm['comparison_operator'] == 'le':
                    alarm_str += "less than or equal to "
                elif alarm['comparison_operator'] == 'eq':
                    alarm_str += "equal to "
                elif alarm['comparison_operator'] == 'ne':
                    alarm_str += "not equal to "
                elif alarm['comparison_operator'] == 'ge':
                    alarm_str += "greater than or equal to "
                elif alarm['comparison_operator'] == 'gt':
                    alarm_str += "greater than "

                alarm_str += str(alarm['threshold'])
                alarm_str += ' during ' + str(alarm['evaluation_periods']) \
                             + ' x ' \
                             + str(alarm['period']) + 's'

                items[alarm['alarm_id']] = alarm_str
        return {'items': items}


##############################################################################
# You can use the following apis to get snmp-based meters.                   #
#                                                                            #
# In order to use snmp-based meters you should add hardware meters           #
#  to the pipeline.yaml configuration file                                   #
#                                                                            #
#   sources:                                                                 #
#       - name: meter_snmp                                                   #
#         interval: 600                                                      #
#         resources:                                                         #
#            - snmp://<hypervisor1 hostname>                                 #
#            - snmp://<hypervisor2 hostname>                                 #
#                        .                                                   #
#                        .                                                   #
#         meters:                                                            #
#             - "hardware.cpu*"                                              #
#             - "hardware.memory*"                                           #
#             - "hardware.disk*"                                             #
#             - "hardware.network*"                                          #
#         sinks:                                                             #
#             - meter_sink                                                   #
##############################################################################

@urls.register
class HardwareCpuUtilization(generic.View):
    """ API for CPU utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/host/cpuutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall CPU utilization of the system
         for the given time period.

        Example GET:
        http://localhost/api/ceilometer/host/cpuutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID
        """
        start_time = time.time()
        query = make_hardware_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='hardware.cpu.util',
                                         query=query,
                                         limit=limit
                                         )

        samples.sort(key=lambda d: d['timestamp'])
        utils = {}

        for data in samples:
            uuid = data['resource_id']

            if uuid not in utils:
                utils[uuid] = {}
                utils[uuid]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[uuid]['data'].append(data)

        print("--- HardwareCpuUtilization %s seconds ---" % (time.time() -
                                                             start_time))

        return {'items': utils}


@urls.register
class HardwareMemoryUtilization(generic.View):
    """ API for Memory utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/host/ramutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall Memory utilization of the system
         for the given time period.

        Example GET:
        http://localhost/api/ceilometer/host/ramutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID

        NOTE!: Add the following source and sink to Ceilometer's
        pipeline.yaml configuration file

        sources:
            - name: hardware_memory_source
              interval: 600
              resources:
            - snmp://<hostname or Ip>
              meters:
                 - "hardware.memory.total"
                 - "hardware.memory.used"
              sinks:
                 - hardware_memory_sink

        sinks:
             - name: hardware_memory_sink
               transformers:
                  - name: "arithmetic"
                    parameters:
                        target:
                            name: "hardware.memory.util"
                            unit: "%"
                            type: "gauge"
                            expr: "100 * $(hardware.memory.used) /
                            $(hardware.memory.total)"
               publishers:
                   - notifier://
                   - gnocchi://

        """
        start_time = time.time()
        query = make_hardware_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='hardware.memory.util',
                                         query=query,
                                         limit=limit
                                         )

        samples.sort(key=lambda d: d['timestamp'])

        utils = {}

        for data in samples:
            uuid = data['resource_id']
            if uuid not in utils:
                utils[uuid] = {}
                utils[uuid]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[uuid]['data'].append(data)
        print("--- HardwareMemoryUtilization %s seconds ---" % (time.time() -
                                                                start_time))

        return {'items': utils}


@urls.register
class HardwareSwapUtilization(generic.View):
    """ API for Swap utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/host/swaputilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall Swap utilization of the system
         for the given time period.

        Example GET:
        http://localhost/api/ceilometer/host/swaputilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID

        NOTE!: Add the following source and sink to Ceilometer's
        pipeline.yaml configuration file

        sources:
            - name: hardware_swap_source
              interval: 600
              resources:
            - snmp://<hostname or Ip>
              meters:
                 - "hardware.memory.swap.total"
                 - "hardware.memory.swap.avail"
              sinks:
                 - hardware_swap_sink

        sinks:
             - name: hardware_swap_sink
               transformers:
                  - name: "arithmetic"
                    parameters:
                        target:
                            name: "hardware_swap_util"
                            unit: "%"
                            type: "gauge"
                            expr: "100 * ( $(hardware.memory.swap.total) -
                            $(hardware.memory.swap.avail) ) /
                             $(hardware.memory.swap.total)"
               publishers:
                   - notifier://
                   - gnocchi://

        """
        start_time = time.time()
        query = make_hardware_query(from_date, to_date, resource_id)

        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='hardware.swap.util',
                                         query=query,
                                         limit=limit
                                         )

        samples.sort(key=lambda d: d['timestamp'])
        utils = {}

        for data in samples:
            uuid = data['resource_id']
            if uuid not in utils:
                utils[uuid] = {}
                utils[uuid]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[uuid]['data'].append(data)
        print("--- HardwareSwapUtilization %s seconds ---" % (time.time() -
                                                              start_time))

        return {'items': utils}


@urls.register
class HardwareNetworkUtilization(generic.View):
    """ API for Network utilization monitor
    """
    url_regex = r'ceilometer/host/networkutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/' \
                r'(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall Network utilization of the system
           for the given query parameters.

        Example GET:
        http://localhost/api/ceilometer/host/networkutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID
        """
        start_time = time.time()

        hostname = None
        if resource_id is not None and resource_id != 'undefined':
            hostname = resource_id
            if settings.PROVIDER_NETWORK_INTERFACE is not None:
                resource_id = resource_id + "." +\
                    settings.PROVIDER_NETWORK_INTERFACE

        query = make_hardware_query(from_date, to_date, resource_id)
        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        incomingtraffic = ceilometer.sample_list(request,
                                                 meter_name='hardware.'
                                                            'network.'
                                                            'incoming.'
                                                            'bytes.'
                                                            'rate',
                                                 query=query,
                                                 limit=limit)

        outgoingtraffic = ceilometer.sample_list(request,
                                                 meter_name='hardware.'
                                                            'network.'
                                                            'outgoing.'
                                                            'bytes.'
                                                            'rate',
                                                 query=query,
                                                 limit=limit)

        if len(incomingtraffic) == 0 and len(outgoingtraffic) == 0:
            return {'items': []}

        incomingtraffic.sort(key=lambda d: d['timestamp'])
        outgoingtraffic.sort(key=lambda d: d['timestamp'])

        incomingutils = {}
        outgoingutils = {}

        for data in incomingtraffic:
            if hostname is not None:
                id = hostname
            else:
                id = data['resource_id']

            if id not in incomingutils:
                incomingutils[id] = {}
                incomingutils[id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                float(data['counter_volume']) * 8.0 * bps_to_mbps)
            incomingutils[id]['data'].append(data)

        for data in outgoingtraffic:
            if hostname is not None:
                id = hostname
            else:
                id = data['resource_id']

            if id not in outgoingutils:
                outgoingutils[id] = {}
                outgoingutils[id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                float(data['counter_volume']) * 8.0 * bps_to_mbps)
            outgoingutils[id]['data'].append(data)

        print("--- Hardware NetworkUtilization %s seconds ---" % (time.time() -
                                                                  start_time))
        return {'incomingtraffic': incomingutils,
                'outgoingtraffic': outgoingutils}


@urls.register
class HardwareDiskUtilization(generic.View):
    """ API for DISK utilization monitor for the given parameters
    """
    url_regex = r'ceilometer/host/diskutilization/' \
                r'(?P<from_date>[^/]+)/' \
                r'(?P<to_date>[^/]+)/' \
                r'(?P<limit>[^/]+)/(?P<resource_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, from_date, to_date, limit, resource_id):
        """Get an overall DISK utilization of the system
           for the given time period.

        Example GET:
        http://localhost/api/ceilometer/host/diskutilization/

        :param fromdate: Timestamp of the beginning of utilization
        :param todate: Timestamp of of the end of utilization
        :param limit: Max sample count
        :param resource_id: Resource ID

        NOTE!: Add the following source and sink to Ceilometer's
        pipeline.yaml configuration file

        sources:
          - name: hardware_disk_source
            interval: 600
            resources:
              - snmp//<Host Name or IP>
            meters:
              - "hardware.disk.size.total"
              - "hardware.disk.size.used"
            sinks:
              - hardware_disk_sink
        sinks:
          - name: hardware_disk_sink
            transformers:
              - name: "arithmetic"
                parameters:
                  target:
                    name: "hardware_disk_util"
                    unit: "%"
                    type: "gauge"
                    expr: "100 * $(hardware.disk.size.used)
                    / $(hardware.disk.size.total)"

        """
        start_time = time.time()

        hostname = None
        if resource_id is not None and resource_id != 'undefined':
            hostname = resource_id
            if settings.MONITOR_DISK_DEVICE is not None:
                resource_id = resource_id + "." + settings.MONITOR_DISK_DEVICE

        query = make_hardware_query(from_date, to_date, resource_id)
        if limit == 'undefined':
            limit = default_api_limit
        else:
            limit = int(limit)

        samples = ceilometer.sample_list(request,
                                         meter_name='hardware.disk.util',
                                         query=query,
                                         limit=limit)
        samples.sort(key=lambda d: d['timestamp'])
        utils = {}

        for data in samples:
            if hostname is not None:
                id = hostname
            else:
                id = data['resource_id']

            if id not in utils:
                utils[id] = {}
                utils[id]['data'] = []

            data['counter_volume'] = "{0:.2f}".format(
                data['counter_volume'])
            utils[id]['data'].append(data)

        print("--- DiskUtilization %s seconds ---" % (time.time() -
                                                      start_time))
        return {'items': utils}
