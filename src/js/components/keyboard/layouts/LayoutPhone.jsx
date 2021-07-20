import React from 'react';

import KeyboardLayout from './Layout';

const keys = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    {
        align: 'right',
        keys: [
            0,
            {
                code: 8,
                key: 'backspace',
                icon: 'backspace',
            },
        ],
    },
];

const KeyboardLayoutPhone = props => <KeyboardLayout keys={keys} {...props} />;

export default KeyboardLayoutPhone;
