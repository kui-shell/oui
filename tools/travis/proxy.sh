#!/usr/bin/env bash

set -e
set -o pipefail

if [[ $T = webpack ]]; then
    npm run -s pty:nodejs

    export WSK_CONFIG_FILE=~/.wskprops_${KEY}_${PORT_OFFSET}
    export WSK_CONFIG_FILEb=~/.wskpropsb_${KEY}_${PORT_OFFSET}
    export TEST_SPACE="${TEST_SPACE_PREFIX-ns}${KEY}_${PORT_OFFSET}"
    export TEST_SPACE2="${TEST_SPACE_PREFIX-ns}${KEY}_${PORT_OFFSET}b"

    . ${WSK_CONFIG_FILEb}
    export AUTH2=$AUTH

    . ${WSK_CONFIG_FILE}
    export API_HOST=$APIHOST
    export AUTH=$AUTH
    export __OW_APIGW_TOKEN=$APIGW_ACCESS_TOKEN

    echo "openwhisk config file: $WSK_CONFIG_FILE"
    echo "openwhisk apihost: $API_HOST"
    echo "openwhisk auth: $AUTH"

    (npm run proxy &)
fi
