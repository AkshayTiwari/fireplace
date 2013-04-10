/*
`mv` this file to hearth/media/js/settings_local.js (remove the .dist)
*/

define('settings', ['settings_base', 'underscore'], function(settings_base, _) {
    // Override settings here!
    settings_base = _.defaults({
        api_url: 'http://chimney.paas.allizom.org'
    }, settings_base);
    return settings_base;
});
