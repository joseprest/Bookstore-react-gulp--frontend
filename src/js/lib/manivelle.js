import $ from 'jquery';

let lastState = {
    direction: 'clockwise', // clockwise or counterclockwise
    value: 0,
    percent: 0,
    end: false,
    deltaValue: 0,
    deltaPercent: 0,
};

function updateData(data) {
    const state = {
        direction: data.direction,
        end: data.end,
        value: lastState.value,
        percent: lastState.percent,
        deltaValue: lastState.deltaValue,
        deltaPercent: lastState.deltaPercent,
    };

    if (data.end) {
        if (data.direction === 'clockwise') {
            state.deltaValue = 1024 - lastState.value;
            state.deltaPercent = 1 - lastState.percent;
            state.value = data.value;
            state.percent = data.percent;
        } else {
            state.deltaValue = 0 - lastState.value;
            state.deltaPercent = 0 - lastState.percent;
            state.value = 1024;
            state.percent = 1;
        }
    } else {
        state.deltaValue = data.value - lastState.value;
        state.deltaPercent = data.percent - lastState.percent;
        state.value = data.value;
        state.percent = data.percent;
    }

    const e = $.Event('manivelle:rotation', {
        manivelle: state,
    });
    $(document).trigger(e);

    lastState = state;
}

export default {
    updateData,
};
