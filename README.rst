Safir Monitor Dashboard
================================

Description
--------------------------------
    Safir Monitor Dashboard which is Openstack horizon plugin developed for visualising collected data on the utilization of the physical and virtual sources
comprising deployed clouds. It persists these data for subsequent retrieval and analysis, and trigger actions when defined criteria are met. These utilization
datas consist of CPU, RAM,disc, incoming network and outgoing network usage datas. Safir monitor dashboard uses Openstack Telemetry service which is called
Ceilometer and Openstack Alarm service which is called aodh.

Installation Guide
--------------------------------

1. How To Use With Devstack
--------------------------------

::
.. sourcecode:: console

    $ sudo apt-get install -y git
    $ git clone http://github.com/openstack-dev/devstack
    $ cd devstack
    $ git checkout stable/mitaka
    $ wget <local_conf_git_address>
    $ ./stack.sh

2. How  To Use With Existing Openstack Installation
---------------------------------------------

Note:
----
We suppose that Openstack Installation minumum consists of keystone, nova, glance, neutron, ceilometer, aodh and horizon.
* Git clone safir monitor dashboard and create source distribution then install it with pip
.. sourcecode:: console
    $ git clone https://github.com/b3lab/safir-monitor-dashboard.git {SAFIR_MONITOR_DASHBOARD_DIR}
    $ cd safir_monitor_dashboard
    $ python setup.py sdist
    $ pip install dist/monitor-dashboard-0.0.1.dev331.tar.gz

* Copy safir monitor dashboard enabled files to openstack local enabled file
.. sourcecode:: console
    $ cp -a {SAFIR_MONITOR_DASHBOARD_DIR}/monitor_dashboard/enabled/_*  {HORIZON_DIR}/openstack_dashboard/local/enabled/

* add below rows to {HORIZON_DIR}/openstack_dashboard/local/local_settings.py
.. sourcecode:: cfg
    AODH_ALARM_ACTIONS=['<ALARM-SERVICE-URL>']
    AODH_OK_ACTIONS=['<ALARM-SERVICE-URL>']
    PROVIDER_NETWORK_INTERFACE="<network-interface>"
    MONITOR_DISK_DEVICE="<disk-device>"
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = ""
    EMAIL_HOST_USER = ""
    EMAIL_HOST_PASSWORD = "
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True

* collect safir monitor dashboard static files on horizon and restart apache2 server
.. sourcecode:: console
    $ python {HORIZON_DIR}/manage.py collectstatic --noinput
    $ sudo service apache2 restart

* add below rows to /etc/nova/nova.conf
.. sourcecode:: cfg
    notify_on_state_change = vm_and_task_state
    instance_usage_audit_period = hour
    instance_usage_audit = True
    compute_monitors = nova.compute.monitors.cpu.virt_driver

* for collecting physical resources usage datas, please install snmp server to compute nodes.

* On controller node, modify /etc/ceilometer/pipeline.yaml file like {SAFIR_MONITOR_DASHBOARD_DIR}/pipeline.yaml.controller_example