# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import logging

from ceilometerclient import client as ceilometer_client
from django.conf import settings  # noqa

from openstack_dashboard.api import base

LOG = logging.getLogger(__name__)


class Sample(base.APIResourceWrapper):
    """ Represents one Ceilometer sample.
    """
    def __init__(self, sample):
        self.resource_id = sample.resource_id
        if 'instance_id' in sample.resource_metadata:
            self.instance_id = sample.resource_metadata['instance_id']
        self.counter_name = sample.counter_name
        self.counter_volume = sample.counter_volume
        self.counter_type = sample.counter_type
        self.timestamp = sample.timestamp
        self.project_id = sample.project_id

    @property
    def id(self):
        # TODO!(ecelik): This will raise exception if
        # two sample's timestamp are equal
        return self.timestamp


class Alarm(base.APIResourceWrapper):
    """ Represents one Ceilometer alarm.
    """
    def __init__(self, alarm):
        self.alarm_id = alarm.alarm_id
        self.name = alarm.name
        self.instance_id = ''
        for q in alarm.threshold_rule['query']:
            if q['field'] == 'resource_id':
                self.instance_id = q['value']
        self.str = ''
        self.description = alarm.description
        self.enabled = alarm.enabled
        self.meter_name = alarm.threshold_rule['meter_name']
        self.threshold = alarm.threshold_rule['threshold']
        self.comparison_operator = alarm.threshold_rule['comparison_operator']
        self.period = alarm.threshold_rule['period']
        self.evaluation_periods = alarm.threshold_rule['evaluation_periods']
        self.project_id = alarm.project_id
        self.state = alarm.state

    @property
    def id(self):
        return self.alarm_id


def ceilometerclient(request):
    """ Initialization of Ceilometer client.
    """

    endpoint = base.url_for(request, 'metering')
    insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
    cacert = getattr(settings, 'OPENSTACK_SSL_CACERT', None)
    LOG.debug('ceilometerclient connection created using token "%s" '
              'and endpoint "%s"' % (request.user.token.id, endpoint))
    return ceilometer_client.Client('2', endpoint,
                                    token=(lambda: request.user.token.id),
                                    insecure=insecure,
                                    ca_file=cacert)


def sample_list(request, meter_name, query=None, limit=None):
    """List the samples for this meters."""
    samples = ceilometerclient(request).samples.list(meter_name=meter_name,
                                                     q=query,
                                                     limit=limit)
    return [Sample(s).__dict__ for s in samples]


def alarm_list(request):
    alarms = ceilometerclient(request).alarms.list()
    return [Alarm(a).__dict__ for a in alarms]


def create_alarm(request, name, description, meter_name,
                 threshold, comparison_operator,
                 statistic, period, evaluation_periods,
                 alarm_actions, ok_actions,
                 resource_id, project_id):
    alarm = ceilometerclient(request).alarms.create(
        name=name,
        description=description,
        meter_name=meter_name,
        threshold=threshold,
        comparison_operator=comparison_operator,
        statistic=statistic,
        period=period,
        evaluation_periods=evaluation_periods,
        alarm_actions=alarm_actions,
        ok_actions=ok_actions,
        matching_metadata={'resource_id': resource_id},
        project_id=project_id)
    return alarm


def delete_alarm(request, alarm_id):
    ceilometerclient(request).alarms.delete(alarm_id=alarm_id)
