import React from 'react';

import KeyboardLayout from './Layout';
import Keys from './keys';

const keys = {
    default: [
        Keys.numbers,
        Keys.qwerty1,
        Keys.qwerty2,
        Keys.qwerty3,
        [
            {
                label: 'Espace',
                shift: 'Espace',
                key: 'space',
            },
        ],
    ],
    ubo: [
        Keys.numbersAzerty,
        Keys.azerty1,
        Keys.azerty2,
        Keys.azerty3,
        [
            {
                label: 'Espace',
                shift: 'Espace',
                key: 'space',
            },
        ],
    ],
    azerty: [
        Keys.numbersAzerty,
        Keys.azerty1,
        Keys.azerty2,
        Keys.azerty3,
        [
            {
                label: 'Espace',
                shift: 'Espace',
                key: 'space',
            },
        ],
    ],
};

const KeyboardLayoutName = props => <KeyboardLayout keys={keys} {...props} />;

export default KeyboardLayoutName;
