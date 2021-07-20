const Theme = {
    updateThemeStylesheet(name, theme) {
        const head = document.getElementsByTagName('head')[0];
        const styles = head.getElementsByTagName('style');
        let currentStyle = null;
        let currentSheet = null;
        let style;
        for (let i = 0, sl = styles.length; i < sl; i += 1) {
            style = styles[i];
            if (style.dataset && style.dataset.theme && style.dataset.theme === name) {
                currentStyle = style;
                currentSheet = style.sheet;
            }
        }
        if (!currentStyle) {
            currentStyle = document.createElement('style');
            currentStyle.type = 'text/css';
            head.appendChild(currentStyle);
            currentSheet = document.styleSheets[document.styleSheets.length - 1];
        }

        console.log(currentSheet);
    },
};

export default Theme;
