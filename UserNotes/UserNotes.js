;(function($, mw, Mustache) {

    if (!(mw.config.get('wgCanonicalSpecialPageName') === 'Contributions')) return;
    
    var chars = '.$[]#/%'.split('');
    var charCodes = chars.map(function(c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
    var charToCode = {};
    var codeToChar = {};
    chars.forEach(function(c, i) {
        charToCode[c] = charCodes[i];
        codeToChar[charCodes[i]] = c;
    });
    var escapeRegExp = function(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    };
    var charsRegex = new RegExp('[' + escapeRegExp(chars.join('')) + ']', 'g');
    var charCodesRegex = new RegExp(charCodes.join('|'), 'g');

    var keyEncode = function(str) {
        return str.replace(charsRegex, (match) => charToCode[match]);
    }
    var keyDecode = function(str) {
        return str.replace(charCodesRegex, (match) => codeToChar[match]);
    }

    var UserNotes = {};

    UserNotes.spinner = function (size) {
        return '<svg class="wds-spinner wds-spinner__block" width="' + size + '" height="' + size + '" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">' +
            '<g transform="translate(22.5, 22.5)">' +
            '<circle class="wds-spinner__stroke" fill="none" stroke-linecap="round" stroke-width="5" stroke-dasharray="125" stroke-dashoffset="125" r="20"></circle>' +
            '</g>' +
            '</svg>';
    },

    UserNotes.commentsContainer = 
        '{{#comments}}' +
        '<div class="un-comment">' +
        '<div class="un-comment-text">{{comment}}</div>' +
            '<div class="un-comment-footer">' + 
                '[[Special:Contributions/{{author}}|{{author}}]] ' + 
                '&bull; {{time}}' + 
            '</div>' +
        '</div>' +
        '{{/comments}}' +
        '{{^comments}}' +
        'No comments found.' +
        '{{/comments}}';

    UserNotes.container = 
        '<div class="usernotes{{#dark}} dark{{/dark}}">' +
            '<h3 class="un-header">{{username}}</h3><div class="un-close"></div>' +
            '{{#loggedin}}' +
            '<!--<div class="un-infocards">' +
                '{{#infocards}}' +
                '<div class="un-infocard">' +
                    '<div class="un-infocard-number">{{number}}</div>' +
                    '<div class="un-infocard-text">{{text}}</div>' +
                '</div>' +
                '{{/infocards}}' +
            '</div>-->' +
            '<div class="un-comments">' +
                UserNotes.spinner(36) +
            '</div>' +
            '<div class="un-addcomment">' +
                '<input id="un-addcomment-input" placeholder="Add a comment"></input>' +
            '</div>' +
            '{{/loggedin}}' +
            '{{^loggedin}}' + 
            'Please log in' +
            '<input id="un-addpassword" placeholder="Password" type="password"></input>' +
            '{{/loggedin}}' +
        '</div>';
    
    UserNotes.openContainer = 
        ' | <a class="usernotes-closed{{#count}} usernotes-hasnotes{{/count}}" id="open-usernotes">' +
            '<span>UserNotes{{#count}} ({{count}}){{/count}}{{^loggedin}} (Log in){{/loggedin}}</span>' +
        '</a>';

    UserNotes.updateComments = function () {
        var commentsHTML = Mustache.render(UserNotes.commentsContainer, UserNotes.data);
        $.ajax({
            url: mw.config.get('wgScriptPath') + '/api.php',
            method: 'GET',
            type: 'GET',
            data: {
                action: 'parse',
                text: commentsHTML,
                format: 'json'
            },
            dataType: 'json'
        }).then(function (data) {
            var comments = data.parse.text['*'];
            $('.usernotes .un-comments').empty().append(comments);
        });
    }

    UserNotes.appendContainer = function(location) {
        location.append(Mustache.render(UserNotes.container, UserNotes.data));
        UserNotes.enableDraggable($('.usernotes')[0], $('.un-header')[0]);

        // close on X button
        $('.un-close').on('click', function () {
            $('#open-usernotes').addClass('usernotes-closed');
            $('#open-usernotes').removeClass('usernotes-open');
            $('#open-usernotes').text('UserNotes (' + UserNotes.data.count + ')');
            $('.usernotes').remove();
        });
        // add comment on enter
        $('#un-addcomment-input').on('keypress', function (e) {
            $this = $(this);
            if (e.which != 13) return;
            $this.attr('disabled', 'disabled');
            var date = new Date();
            UserNotes.postToDiscord(UserNotes.data.username, $this.val(), date);
            UserNotes.postComment(UserNotes.data.username, $this.val(), date).then(function() {
                UserNotes.getComments(UserNotes.data.username).then(function() {
                    UserNotes.updateComments();
                    $this.removeAttr('disabled');
                    $this.val('');
                });
            });
        });
        $('#un-addpassword').on('keypress', function (e) {
            $this = $(this);
            if (e.which != 13) return;
            $this.attr('disabled', 'disabled');
            var date = new Date();
            UserNotes.login('noreplyz@fandom.com', $this.val()).then(function(){
                // Successfully logged in
                UserNotes.data.loggedin = true;
                $('.usernotes').remove();
            }).catch(function(e) {
                console.log(e);
            });
        })
    };

    UserNotes.enableDraggable = function(element, hook) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (hook) {
            // if present, the header is where you move the DIV from:
            hook.onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            element.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.bottom = "auto";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    UserNotes.login = function(username, password) {
        return firebase.auth().signInWithEmailAndPassword(username, password).catch(function (e) {
            console.log(e);
        });
    }

    UserNotes.logout = function() {
        return firebase.auth().signOut();
    }
    
    UserNotes.getNumComments = function (user) {
        user = keyEncode(user);
        return UserNotes.db.ref('/counts/' + user).once('value').then(function (snapshot) {
            UserNotes.data.count = snapshot.val() ? snapshot.val() : 0;
        });
    }
    UserNotes.getComments = function (user) {
        user = keyEncode(user);
        return UserNotes.db.ref('/comments/' + user).once('value').then(function(snapshot) {
            UserNotes.data.comments = [];
            if (snapshot.val()) {
                snapshot.forEach(function(comment) {
                    comment = comment.val();
                    comment.time = new Date(comment.timestamp).toLocaleString(undefined, {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    });
                    UserNotes.data.comments.push(comment);
                });
            }
        });
    }
    UserNotes.postComment = function(user, comment, date) {
        user = keyEncode(user);
        var path = '/comments/' + user + '/';
        var commentKey = UserNotes.db.ref().child(path).push().key;
        var newPost = {};
        newPost[path + commentKey] = {
            author: UserNotes.currentUser,
            comment: comment,
            timestamp: date.getTime()
        }
        var countRef = firebase.database().ref('/counts/' + user + '/');
        countRef.transaction(function (currentCount) {
            return currentCount + 1;
        });
        return UserNotes.db.ref().update(newPost);
    }
    UserNotes.getDiscordToken = function() {
        if (!UserNotes.db) return $.Deferred().reject({});
        return UserNotes.db.ref('/discord/').once('value').then(function(snapshot) {
            $.cookie('usernotes-token', snapshot.val());
            UserNotes.webhookToken = snapshot.val();
        });
    }

    UserNotes.postToDiscord = function(user, comment, date) {
        if (!UserNotes.webhookToken) return $.Deferred().reject({});
        $.ajax({
            url: UserNotes.webhook + UserNotes.webhookToken,
            type: "POST",
            data: JSON.stringify({
                embeds: [{
                    description: '**User:** ' + user + '\n**Comment:** ' + comment,
                    footer: {
                        text: 'Author: ' + UserNotes.currentUser + ' | ' + mw.config.get('wgServer') + mw.config.get('wgScriptPath')
                    },
                    timestamp: date.toISOString()
                }]
            }),
            dataType: "text"
        });
    }

    UserNotes.loaded = false;
    
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
        count: 0,
        comments: [],
        wikipath: mw.config.get('wgScriptPath'),
        dark: window.UserNotesDark ? true : false,
        loggedin: false
    };
    UserNotes.webhook = 'https://discordapp.com/api/webhooks/624983129236701184/';
    UserNotes.webhookToken = null;

    window.UserNotes = UserNotes;

    UserNotes.currentUser = mw.config.get('wgUserName');

    // Import Firebase
    importScriptURI('https://www.gstatic.com/firebasejs/4.5.1/firebase-app.js');
    importStylesheetURI('https://internal-vstf.fandom.com/index.php?title=MediaWiki:UserNotes.css&action=raw&ctype=text/css');
    var waitForApp = setInterval(function() {
        if (typeof firebase == 'object') {
            clearInterval(waitForApp);
            importScriptURI('https://www.gstatic.com/firebasejs/4.5.1/firebase-auth.js');
            importScriptURI('https://www.gstatic.com/firebasejs/4.5.1/firebase-database.js');
        }
    }, 300);

    var waitForFirebase = setInterval(function() {
        if (typeof firebase == 'object' && typeof firebase.auth === 'function' && typeof firebase.database === 'function') {
            clearInterval(waitForFirebase);

            // Your web app's Firebase configuration
            var firebaseConfig = {
                apiKey: "AIzaSyCveKyNTxRUnvGt1SGf_iUQbh-S3PPPduU",
                authDomain: "fandom-usernotes.firebaseapp.com",
                databaseURL: "https://fandom-usernotes.firebaseio.com",
                projectId: "fandom-usernotes",
                storageBucket: "",
                messagingSenderId: "188626865322",
                appId: "1:188626865322:web:879dcb92b5fa51c68014d3"
            };
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            if (firebase.auth().currentUser) {
                UserNotes.data.loggedin = true;
            }
            firebase.auth().onAuthStateChanged(function (user) {
                // Check if logged in
                if (user) {
                    if (user.email === "noreplyz@fandom.com") {
                        UserNotes.data.loggedin = true;
                        UserNotes.db = firebase.database();
                    }
                } else {
                    UserNotes.data.loggedin = false;
                }

                // Load Discord token
                if ($.cookie('usernotes-token')) {
                    UserNotes.webhookToken = $.cookie('usernotes-token');
                } else {
                    UserNotes.getDiscordToken().then(null, function() {
                        // user not logged in
                    });
                }
                
                // Only load container and listeners once, only load if logged in
                UserNotes.data.username = $('.UserProfileMasthead .masthead-info h1').text();
                if (!UserNotes.loaded && UserNotes.data.loggedin) {
                    $('#open-usernotes').remove();
                    UserNotes.loaded = true;
                    // Place button to open container into the profile
                    UserNotes.getNumComments(UserNotes.data.username).then(function () {
                        $('.mw-special-Contributions #contentSub > a:last').after(Mustache.render(UserNotes.openContainer, UserNotes.data));

                        // Toggle open and close
                        $('#open-usernotes').on('click', function () {
                            if ($(this).hasClass('usernotes-closed')) {
                                $(this).removeClass('usernotes-closed');
                                $(this).addClass('usernotes-open');
                                $('#open-usernotes').text('Loading notes...');
                                UserNotes.getComments(UserNotes.data.username).then(function () {
                                    $('#open-usernotes').text('Hide UserNotes');
                                    UserNotes.appendContainer($('body'));
                                    UserNotes.updateComments();
                                });
                            } else {
                                $(this).addClass('usernotes-closed');
                                $(this).removeClass('usernotes-open');
                                $('#open-usernotes').text('UserNotes (' + UserNotes.data.count + ')');
                                $('.usernotes').remove();
                            }
                        });
                    });
                } else if (!UserNotes.loaded) {
                    $('#open-usernotes').remove();
                    UserNotes.data.username = $('.UserProfileMasthead .masthead-info h1').text();
                    $('.mw-special-Contributions #contentSub > a:last').after(Mustache.render(UserNotes.openContainer, UserNotes.data));

                    // Toggle open and close
                    $('#open-usernotes').on('click', function () {
                        if ($(this).hasClass('usernotes-closed')) {
                            $(this).removeClass('usernotes-closed');
                            $(this).addClass('usernotes-open');
                            $('#open-usernotes').text('Hide UserNotes');
                            UserNotes.appendContainer($('body'));
                        } else {
                            $(this).addClass('usernotes-closed');
                            $(this).removeClass('usernotes-open');
                            $('#open-usernotes').text('UserNotes (Log in)');
                            $('.usernotes').remove();
                        }
                    });
                }
            });
        }
    }, 300);
})(jQuery, mediaWiki, Mustache);
