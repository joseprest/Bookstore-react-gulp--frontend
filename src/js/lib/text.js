import Polyglot from 'node-polyglot';

import defaultTexts from '../../data/text.json';

const polyglot = new Polyglot({
    phrases: defaultTexts[Object.keys(defaultTexts)[0]],
});

const Text = {
    polyglot,
    locale: polyglot.currentLocale,

    t(...args) {
        return polyglot.t(...args);
    },

    setPhrases(phrases) {
        polyglot.replace(phrases);
    },

    clearPhrases() {
        polyglot.clear();
    },

    setLocale(locale) {
        Text.locale = locale;
        polyglot.locale(locale);
    },
};

export default Text;
