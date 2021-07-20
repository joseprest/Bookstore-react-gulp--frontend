import React from 'react';
import isObject from 'lodash/isObject';

import KeyboardLayout from './Layout';
import Keys from './keys';

const keys = {
    default: [
        Keys.numbers.map(it => (isObject(it) && typeof it.shift !== 'undefined' ? it.label : it)),
        Keys.qwerty1.map(it => (isObject(it) && typeof it.alternates !== 'undefined' ? it.label : it)),
        [
            ...Keys.qwerty2
                .map(it => (isObject(it) && typeof it.alternates !== 'undefined' ? it.label : it))
                .slice(0, -2)
                .slice(2),
            'spacer-2',
        ],
        Keys.qwerty3Email,
        [
            '@',
            {
                label: '@gmail.com',
                shift: '@gmail.com',
            },
            {
                label: '@yahoo.com',
                shift: '@yahoo.com',
            },
            {
                label: '@hotmail.com',
                shift: '@hotmail.com',
            },
            {
                label: '.com',
                shift: '.com',
            },
        ],
    ],
    ubo: [
        Keys.numbers.map(it => (isObject(it) && typeof it.shift !== 'undefined' ? it.label : it)),
        Keys.azerty1.map(it => (isObject(it) && typeof it.alternates !== 'undefined' ? it.label : it)),
        [
            ...Keys.azerty2
                .map(it => (isObject(it) && typeof it.alternates !== 'undefined' ? it.label : it))
                .slice(0, -1)
                .slice(2),
        ],
        Keys.azerty3Email,
        [
            '@',
            {
                label: '@gmail.com',
                shift: '@gmail.com',
            },
            {
                label: '@etudiant.univ-brest.fr',
                shift: '@etudiant.univ-brest.fr',
            },
            {
                label: '.fr',
                shift: '.fr',
            },
        ],
    ],
    azerty: [
        Keys.numbers.map(it => (isObject(it) && typeof it.shift !== 'undefined' ? it.label : it)),
        Keys.azerty1.map(it => (isObject(it) && typeof it.alternates !== 'undefined' ? it.label : it)),
        [
            ...Keys.azerty2
                .map(it => (isObject(it) && typeof it.alternates !== 'undefined' ? it.label : it))
                .slice(0, -1)
                .slice(2),
        ],
        Keys.azerty3Email,
        [
            '@',
            {
                label: '@gmail.com',
                shift: '@gmail.com',
            },
            {
                label: '@yahoo.fr',
                shift: '@yahoo.fr',
            },
            {
                label: '@hotmail.fr',
                shift: '@hotmail.fr',
            },
            {
                label: '.fr',
                shift: '.fr',
            },
        ],
    ],
};

const KeyboardLayoutEmail = props => <KeyboardLayout keys={keys} {...props} />;

export default KeyboardLayoutEmail;
