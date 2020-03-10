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
                    'Warning: You are currently logged in to a different user.' +
                '</div>' + 
            '{{/usernameCompare}}' +
            'To verify, please enter your Discord handle in the box below.<br/><br/>' + 
            '<input placeholder="discord#0000" value="{{discordHandle}}" style="padding:8px; width:350px;font-family:\'Rubik\';font-size:20px" id="verify-input"/> ' +
            '<div class="wds-button" type="submit" style="vertical-align:middle;cursor:pointer;" id="verify"><span>Verify</span></div>' +
            '<br/><br/><small>Verification adds your Discord handle to your public profile.</small>' +
        '{{/username}}' + 
        '{{^username}}' + 
            'To verify, please <a href="https://www.fandom.com/signin?redirect={{backlink}}">log in to your Fandom account</a>. If you have a Gamepedia account, see <a href="https://help.gamepedia.com/Discord" class="external">the Gamepedia Discord guide</a>.<br/><br/>' + 
            '<a href="https://www.fandom.com/signin?redirect={{backlink}}" style="text-decoration:none">' +
                '<div class="wds-button" style="cursor:pointer;"><span>Log in</span></div>' + 
            '</a>' +
        '{{/username}}' +
        '</div>';
    
    // Template shown after a Discord handle is submitted
    templates.complete =
        '<div style="text-align:center;line-height:180%;font-family:\'Rubik\';">' +
        'You are now verified on the Fandom side! Now, go to the #verification channel and say the following text:<br/><br/>' +
        '<input value="!verify {{username}}" onClick="this.select();" style="padding:8px; width:350px;font-family:\'Rubik\';font-size:20px" readonly/> ' +
        '</div>';
    
    templates.error =
        '<div style="color:#ee1a41;font-weight:bold">' +
            'Something went wrong. The error was: <br/>' +
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
    
    // Starts the script
    verifyUser.init = function() {
        // Update header/title
        $('.page-header__title').text('Verification for Discord');
        $(document).prop('title', 'Verification for Discord | FANDOM powered by Wikia');
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
            discordHandle: discordHandle
        }));

        $('#verify').on('click', function() {
            $('#WikiaArticle').empty().append('Loading...');
            verifyUser._setDiscordHandle(userid, $('#verify-input').val()).done(function (data) {
                $('#WikiaArticle').empty().append(Mustache.render(templates.complete, {
                    username: username
                }));
            }).fail(function(e) {
                $('#WikiaArticle').empty().append(Mustache.render(templates.error, {
                    error: JSON.parse(e.responseText).title
                }));
            });
        });

        $('#verify-input').keypress(function (e) {
            if (e.which === 13) {
                $('#verify').click();
            }
        });
    };
    
    verifyUser.init();
 
})(window, jQuery, mediaWiki, Mustache);