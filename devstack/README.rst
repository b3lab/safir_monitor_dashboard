=================================
Monitor dashboard devstack plugin
=================================

This directory contains the monitor-dashboard devstack plugin.

To enable the plugin, add the following to your local.conf:

    enable_plugin monitor-dashboard https://github.com/b3lab/safir-monitor-dashboard.git

Configuration
=============

* Set the following configuration settings in {HORIZON_DIR}/openstack_dashboard/local/local_settings.py

.. sourcecode:: cfg

    AODH_ALARM_ACTIONS = ['<ALARM-SERVICE-URL>']
    AODH_OK_ACTIONS = ['<ALARM-SERVICE-URL>']

    PROVIDER_NETWORK_INTERFACE = "<network-interface>"
    MONITOR_DISK_DEVICE = "<disk-device>"

    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST =
    EMAIL_HOST_USER =
    EMAIL_HOST_PASSWORD =
    EMAIL_PORT =
    EMAIL_USE_TLS =

* Collect Safir Monitor Dashboard static files on Horizon and restart Apache2 server

.. sourcecode:: console

    $ python {HORIZON_DIR}/manage.py collectstatic
    $ python {HORIZON_DIR}/manage.py compress  # if compress enabled
    $ sudo service apache2 restart

* Configure Nova service to monitor compute instances like the following example and restart the service

.. sourcecode:: cfg

    notify_on_state_change = vm_and_task_state
    instance_usage_audit_period = hour
    instance_usage_audit = True
    compute_monitors = nova.compute.monitors.cpu.virt_driver

* Configure Ceilometer service to collect utilization data as shown in the
  {SAFIR_MONITOR_DASHBOARD_DIR}/pipeline.yaml.controller_example file

* Install SNMP server to compute nodes to monitor them.

