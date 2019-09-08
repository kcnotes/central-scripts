;(function($, mw, Mustache) {
    var UserNotes = {};
    UserNotes.commentsContainer = 
        '<div class="un-comments">' +
            '{{#comments}}' +
            '<div class="un-comment">' +
                '<div class="un-comment-text">{{text}}</div>' +
                '<div class="un-comment-footer">' + 
                    '<a href="{{wikipath}}/wiki/Special:Contributions/{{author}}" target="_blank">{{author}}</a> ' + 
                    '&bull; {{time}}' + 
                '</div>' +
            '</div>' +
            '{{/comments}}' +
        '</div>';

    UserNotes.container = 
        '<div class="usernotes{{#dark}} dark{{/dark}}">' +
            '<h3 class="un-header">{{username}}</h3><div class="un-close"></div>' +
            '<div class="un-infocards">' +
                '{{#infocards}}' +
                '<div class="un-infocard">' +
                    '<div class="un-infocard-number">{{number}}</div>' +
                    '<div class="un-infocard-text">{{text}}</div>' +
                '</div>' +
                '{{/infocards}}' +
            '</div>' +
            UserNotes.commentsContainer +
            '<div class="un-addcomment">' +
                'Add a comment' +
            '</div>' +
        '</div>';
    
    UserNotes.openContainer = 
        '<div id="usernotes-container">' + 
            '<button id="open-usernotes" class="usernotes-closed">UserNotes</button>' +
        '</div>';

    UserNotes.appendContainer = function(location) {
        location.append(Mustache.render(UserNotes.container, UserNotes.data));
    };

    UserNotes.data = {
        username: 'Username',
        infocards: [{
            number: 3,
            text: 'blocks' 
        }, {
            number: 0,
            text: 'chatbans'
        }, {
            number: 2,
            text: 'mod notes'
        }],
        comments: [{
            text: 'Sent insults to User',
            author: 'Jr Meme',
            time: '18 August 2019 at 9:00'
        }, {
            text: 'Blocking for 1 month - already given a warning in Thread:12345',
            author: 'Mendes3',
            time: '3 September 2019 at 13:30'
        }],
        wikipath: mw.config.get('wgScriptPath'),
        dark: false
    }

    window.UserNotes = UserNotes;

    if (!$('#UserProfileMasthead').length) return;
    $('#UserProfileMasthead .masthead-info hgroup').append(UserNotes.openContainer);
    $('#open-usernotes').on('click', function() {
        if ($(this).hasClass('usernotes-closed')) {
            $(this).removeClass('usernotes-closed');
            $(this).addClass('usernotes-open');
            $('#open-usernotes').text('Hide UserNotes');
            UserNotes.appendContainer($('#usernotes-container'));
        } else {
            $(this).addClass('usernotes-closed');
            $(this).removeClass('usernotes-open');
            $('#open-usernotes').text('UserNotes');
            $('.usernotes').remove();
        }
    });
    $('#usernotes-container').on('click', '.un-close', function () {
        $('#open-usernotes').addClass('usernotes-closed');
        $('#open-usernotes').removeClass('usernotes-open');
        $('#open-usernotes').text('UserNotes');
        $('.usernotes').remove();
    });
})(jQuery, mediaWiki, Mustache);
