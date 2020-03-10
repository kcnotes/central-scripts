/**
 * VerifyUser - add Discord handle automatically to user profiles on Fandom.
 * To efficiently perform verification, provide a link in the form
 * https://community.fandom.com/wiki/Special:VerifyUser/<wiki-username>?user=<discord-username>&tag=<discord-tag>
 * 
 * @author Noreplyz
 */
;(function(window, $, mw, Mustache) {
    if (!mw.config.get('wgPageName').match(/^Special:VerifyUser.*/)) return;

    var templates = {}, verifyUser = {};

    /**
     * Trims URL and other fluff from a username
     * @param {String} user the unclean username
     * @returns {String} the cleaned username
     */
    var cleanUser = function (user) {
        if (!user) return '';
        // Trim whitespaces and new lines
        user = user.replace(/^[\s\n]+|[\s\n]+$/g, '');
        // Clean up links
        user = user.replace(/^https?:\/\//g, '');
        user = user.replace(/^.*\.(wikia|fandom|gamepedia)\.(com|org|io)\/(wiki\/)?/g, '');
        user = user.replace(/^(User:|Special:Contributions\/|Special:Contribs\/)/g, '');
        // Replace spaces
        user = user.replace(/(%20|_)/g, ' ');
        // Uppercase first letter of the username
        user = user.charAt(0).toUpperCase() + user.slice(1);
        return user;
    }

    // Main template shown to all users
    templates.main = 
        '<div style="text-align:center;line-height:180%;font-family:\'Rubik\';">' +
        '{{#username}}' + 
            '{{^usernameCompare}}' +
                '<div style="color:#ee1a41;font-weight:bold">' +
                    '{{#i18n}}error-loggedin{{/i18n}}' +
                '</div>' + 
            '{{/usernameCompare}}' +
            '{{#i18n}}verify-instructions{{/i18n}}<br/><br/>' + 
            '<input placeholder="discord#0000" value="{{discordHandle}}" style="padding:8px; width:350px;font-family:\'Rubik\';font-size:20px" id="verify-input"/> ' +
            '<div class="wds-button" type="submit" style="vertical-align:middle;cursor:pointer;" id="verify"><span>{{#i18n}}button-verify{{/i18n}}</span></div>' +
            '<br/><br/><small>{{#i18n}}verify-notice{{/i18n}}</small>' +
        '{{/username}}' + 
        '{{^username}}' + 
            '{{#i18n}}verify-login{{/i18n}} <a href="https://help.gamepedia.com/Discord" class="external">{{#i18n}}verify-gamepedia{{/i18n}}</a><br/><br/>' + 
            '<a href="https://www.fandom.com/signin?redirect={{backlink}}" style="text-decoration:none">' +
                '<div class="wds-button" style="cursor:pointer;"><span>{{#i18n}}button-login{{/i18n}}</span></div>' + 
            '</a>' +
        '{{/username}}' +
        '</div>';
    
    // Template shown after a Discord handle is submitted
    templates.complete =
        '<div style="text-align:center;line-height:180%;font-family:\'Rubik\';">' +
        '{{#i18n}}verify-complete{{/i18n}}<br/><br/>' +
        '<input value="!verify {{username}}" onClick="this.select();" style="padding:8px; width:350px;font-family:\'Rubik\';font-size:20px" readonly/> ' +
        '</div>';
    
    templates.error =
        '<div style="color:#ee1a41;font-weight:bold">' +
            '{{#i18n}}general-error{{/i18n}} <br/>' +
            '{{error}}' +
        '</div>';
    
    verifyUser.servicesHost = 'https://services.fandom.com/';

    verifyUser._setDiscordHandle = function (userid, discordHandle) {
        return $.ajax(verifyUser.servicesHost + 'user-attribute/user/' + userid + '/attr/discordHandle', {
            type: 'PUT',
            format: 'json',
            data: {
                value: discordHandle
            },
            xhrFields: {
                withCredentials: true
            }
        });
    }

    verifyUser.toi18n = function() {
        return function(text, render) {
            return render(mw.html.escape(verifyUser.i18n.msg(text).plain()));
        }
    };
    
    // Starts the script
    verifyUser.init = function (i18n) {
        i18n.loadMessages('VerifyUser').done(function(i18n) {
            verifyUser.i18n = i18n;

            // Update header/title
            $('.page-header__title').text(i18n.msg('title').plain());
            $(document).prop('title', i18n.msg('title').plain() + ' | Fandom');
            var username = mw.config.get('wgUserName'),
                pagename = mw.config.get('wgPageName'),
                discordHandle = '',
                providedUsername = pagename.indexOf('/') > -1 ? pagename.replace(/^.*\//g, '') : '',
                userid = mw.config.get('wgUserId');
            
            if (mw.util.getParamValue('user') && mw.util.getParamValue('tag')) {
                discordHandle = mw.util.getParamValue('user') + '#' + mw.util.getParamValue('tag');
            }
            console.log(cleanUser(providedUsername) === cleanUser(username) || cleanUser(providedUsername) === '');
            // Place the form into the main content section of the page
            $('#mw-content-text').replaceWith(Mustache.render(templates.main, {
                username: username,
                backlink: encodeURIComponent(window.location),
                usernameCompare: cleanUser(providedUsername) === cleanUser(username) || cleanUser(providedUsername) === '',
                discordHandle: discordHandle,
                i18n: verifyUser.toi18n
            }));
    
            $('#verify').on('click', function() {
                $('#WikiaArticle').empty().append(i18n.msg('loading').plain());
                verifyUser._setDiscordHandle(userid, $('#verify-input').val()).done(function (data) {
                    $('#WikiaArticle').empty().append(Mustache.render(templates.complete, {
                        username: username,
                        i18n: verifyUser.toi18n
                    }));
                }).fail(function(e) {
                    $('#WikiaArticle').empty().append(Mustache.render(templates.error, {
                        error: JSON.parse(e.responseText).title,
                        i18n: verifyUser.toi18n
                    }));
                });
            });
    
            $('#verify-input').keypress(function (e) {
                if (e.which === 13) {
                    $('#verify').click();
                }
            });
        })
    };
    
    importArticle({
        type: 'script',
        article: 'u:dev:MediaWiki:I18n-js/code.js'
    });
    mw.hook('dev.i18n').add(verifyUser.init);
 
})(window, jQuery, mediaWiki, Mustache);