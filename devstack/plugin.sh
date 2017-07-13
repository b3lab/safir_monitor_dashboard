function monitor_dashboard_install {
    setup_develop $MONITOR_DASHBOARD_DIR
}

function monitor_dashboard_configure {
    cp -t  $HORIZON_DIR/openstack_dashboard/local/enabled/ \
        $MONITOR_DASHBOARD_ENABLE_FILE_USER_PROJECT_MONITOR \
        $MONITOR_DASHBOARD_ENABLE_FILE_ADMIN_HYPERVISOR_MONITOR \
        $MONITOR_DASHBOARD_ENABLE_FILE_ADMIN_PROJECT_MONITOR \
}

if is_service_enabled horizon; then
    if [[ "$1" == "stack" && "$2" == "install" ]]; then
        # Perform installation of service source
        echo_summary "Installing monitor-dashboard"
        monitor_dashboard_install
    elif [[ "$1" == "stack" && "$2" == "post-config" ]]; then
        echo_summary "Configuring monitor-dashboard"
        monitor_dashboard_configure
    elif [[ "$1" == "stack" && "$2" == "extra" ]]; then
        # Initialize and start the monitor service
        echo_summary "Initializing monitor-dashboard"
    fi
fi

if [[ "$1" == "unstack" ]]; then
    # Shut down monitor dashboard services
    :
fi

if [[ "$1" == "clean" ]]; then
    # Remove state and transient data
    # Remember clean.sh first calls unstack.sh

    # Remove monitor-dashboard enabled files and pyc
    rm -f ${MONITOR_DASHBOARD_ENABLE_FILE_USER_PROJECT_MONITOR}*
    rm -f ${MONITOR_DASHBOARD_ENABLE_FILE_ADMIN_HYPERVISOR_MONITOR}*
    rm -f ${MONITOR_DASHBOARD_ENABLE_FILE_ADMIN_PROJECT_MONITOR}*

fi
