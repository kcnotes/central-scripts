//<nowiki>
; (function (window, $, mw, mustache) {
    if (typeof window.blogReport !== 'undefined') {
        return;
    }
    var blankspecialparam = $.getUrlVar('blankspecial');
    if (mw.config.get('wgCanonicalSpecialPageName') === "Blankpage" && typeof blankspecialparam !== 'undefined' && blankspecialparam === "blogreport") {
        $('#mw-content-text p').html('<div id="CC-blog-interface"></div>');
        $('.header-column.header-title h1').text('Blog Report Interface');
    }
    if ($('#CC-blog-interface').length === 0) {
        return;
    }

    bR = {};

    // Add Community Staff blog responses, admin/mod responses added later to this array
    bR.admins = ['BertH', 'Kirkburn', 'Rappy_4187', 'Sannse', 'Merrystar'];

    bR.templates = {
        blogListing: '<div class="new-blog-2 not-expanded" id="{{title}}">' +
            '<a href="/wiki/{{encodedtitle}}" class="new-blog-link" data-timestamp="{{timestamp}}" target="_blank" title="">' +
            '<div class="new-blog-timestamp">{{timestamp}}</div>' +
            '<div class="new-blog-title">{{title}}</div>' +
            '</a>' +
            '<div class="new-blog-details" title="">' +
            '<div class="new-blog-text"></div>' +
            '<div class="new-blog-tags">' +
            '{{#short}}<div class="tag-short cb-tag">Short blog</div>{{/short}}' +
            '<div class="new-blog-replies"></div>' +
            '</div>' +
            '<div class="new-blog-comments"></div>' +
            '<div class="cb-respond">' +
            '<textarea rows="4"></textarea>' +
            '<div class="wds-button wds-is-squished cb-respond-button">Post comment</div>' +
            '<div class="cb-error"></div>' +
            '</div>' +
            '</div>' +
            '<div class="new-blog-expand hidden" title="Show more details"><a>-</a></div>' +
            '</div>',
        counters: '<div class="cb-counters">' +
            '<div class="cb-counters-total cb-tag" data-count="{{count}}">{{count}} {{counttype}}</div>' +
            '{{#admincount}}' +
            '<div class="cb-counters-admin cb-tag" data-count="{{admincount}}">Admin comments from {{admins}}</div>' +
            '{{/admincount}}' +
            '{{^admincount}}' +
            '<div class="cb-counters-admin cb-tag" data-count="{{admincount}}">No admin comments</div>' +
            '{{/admincount}}' +
            '</div>',
        comment: '{{#total}}<h2>Comments</h2>{{/total}}' +
            '{{#base}}' +
            '<div class="cb-comment">' +
            '<div class="cb-avatar"><img src="{{avatar}}" /></div>' +
            '<div class="cb-comment-block">' +
            '<div class="cb-comment-username">{{userName}}</div>' +
            '<div class="cb-comment-text">{{{text}}}</div>' +
            '</div>' +
            '{{#comments}}' +
            '<div class="cb-subcomment">' +
            '<div class="cb-avatar"><img src="{{avatar}}" /></div>' +
            '<div class="cb-comment-block">' +
            '<div class="cb-comment-username">{{userName}}</div>' +
            '<div class="cb-comment-text">{{{text}}}</div>' +
            '</div>' +
            '</div>' +
            '{{/comments}}' +
            '</div>' +
            '{{/base}}'
    };

    bR.renderTemplates = {
        renderBlog: function (title, timestamp, size) {
            return $(
                mustache.render(bR.templates.blogListing, {
                    title: title,
                    encodedtitle: encodeURIComponent(title),
                    timestamp: timestamp,
                    short: size > 150 ? false : true
                })
            );
        },
        renderCounters: function (count, admincount, admins) {
            return $(
                mustache.render(bR.templates.counters, {
                    count: count,
                    counttype: count === 1 ? 'comment' : 'comments',
                    admincount: admincount === '0' ? false : admincount,
                    admins: admins
                })
            );
        },
        renderComments: function (comments) {
            return $(
                mustache.render(bR.templates.comment, {
                    base: comments,
                    total: comments.length > 0 ? true : false
                })
            );
        }
    };

    bR.getAdminsAndMods = function () {
        return $.ajax({
            url: '/api.php',
            type: 'GET',
            data: {
                action: 'query',
                list: 'groupmembers',
                gmgroups: 'sysop|chatmoderator|threadmoderator',
                gmlimit: '200',
                format: 'json'
            },
            dataType: 'json'
        }).then(function(data) {
            return data.users.map(function(user) {
                return user.name.replace(' ', '_');
            });
        });
    }

    // Get details of a blog page
    bR.getBlogPage = function (title) {
        return $.ajax({
            url: '/wikia.php',
            type: 'GET',
            data: {
                controller: 'MercuryApi',
                method: 'getPage',
                title: title
            },
            dataType: 'json'
        })
    };

    // Get blog comments for a particular blog
    bR.getBlogComments = function (title) {
        return $.ajax({
            url: '/wikia.php',
            type: 'GET',
            data: {
                controller: 'MercuryApi',
                method: 'getArticleComments',
                title: title
            },
            dataType: 'json'
        });
    };

    //?action=query&generator=categorymembers&gcmtitle=Category:Blog%20posts
    //&gcmnamespace=500&gcmsort=timestamp&gcmdir=desc&gcmlimit=50&gcmprop=ids|title|timestamp
    //&prop=info&inprop=created|revcount&format=jsonfm
    // Get list of latest blog titles
    bR.getBlogTitles = function (start) {
        return $.ajax({
            url: '/api.php',
            type: 'GET',
            data: {
                action: 'query',
                generator: 'categorymembers',
                gcmtitle: 'Category:Blog posts',
                gcmnamespace: '500',    // Blog namespace
                gcmsort: 'timestamp',
                gcmdir: 'desc',         // latest blogs first
                gcmlimit: 50,
                gcmprop: ['ids', 'title', 'timestamp'].join('|'),
                prop: 'info',
                inprop: ['created', 'revcount'].join('|'),
                format: 'json'
            },
            dataType: 'json'
        });
    }

    // Post request to add comment to a particular blog page
    bR.addComment = function (id, comment) {
        return $.ajax({
            url: '/index.php',
            type: 'POST',
            data: {
                action: 'ajax',
                article: id,
                method: 'axPost',
                rs: 'ArticleCommentsAjax',
                wpArticleComment: comment,
                token: mw.user.tokens.get("editToken")
            },
            dataType: 'json'
        });
    }

    // Pad 0's for rendering time
    function pad(n) {
        return (n < 10) ? ("0" + n) : n;
    }

    // timestamp string
    function renderStamp(iso) {
        date = new Date(iso);
        return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ', ' + date.getDate() + ' ' + wgMonthNames[date.getMonth() + 1] + ' ' + date.getFullYear();
    }

    // Update comments, comment counts and blog box attributes
    // TODO: Remove the now unneeded usercount mess
    function createCommentCounts($this, commentLink) {
        var count = 0,
            myusercount = 0,
            allmyusercount = 0,
            admincount = 0;
        bR.getBlogComments(commentLink).done(function (d) {
            var adminList = [];
            var comments = d.payload.comments;
            // Count each comment
            $.each(comments, function (i, comment) {
                count++;
                if (bR.admins.indexOf(comment.userName) > -1) {
                    admincount++;
                    if (adminList.indexOf(comment.userName) === -1) {
                        adminList.push(comment.userName);
                    }
                    if (comment.userName === wgUserName) {
                        myusercount++;
                        allmyusercount++;
                    }
                }
                // Count each subcomment
                if ('comments' in comment) {
                    $.each(comment.comments, function (i, subcomment) {
                        count++;
                        if (bR.admins.indexOf(subcomment.userName) > -1 && adminList.indexOf(subcomment.userName) === -1) {
                            adminList.push(subcomment.userName);
                        }
                        if (comment.userName === wgUserName) {
                            admincount++;
                            allmyusercount++;
                            if (subcomment.userName === wgUserName) {
                                myusercount++;
                            }
                        }
                    });
                }
            });

            // Add classes to the blog box
            if (count === 0) {
                $this.addClass("no-comments");
                $this.attr('title', 'Blog has no comments');
            } else {
                $this.addClass("many-comments");
                $this.attr('title', 'Blog has no admin comments, but has comments');
            }
            if (admincount > 0) {
                $this.addClass("many-admin-comments");
                $this.attr('title', 'Blog has admin comments');
            }
            if (allmyusercount - myusercount > 0) {
                $this.addClass("has-comment-response");
                $this.attr('title', 'Someone has responded to your comment');
            }

            // Add tags to blog box
            $this.find('.new-blog-replies').empty().append(bR.renderTemplates.renderCounters(count, admincount, adminList.join(', ')));

            // Add comments to hidden expand blog box
            $.each(comments, function (i, comment) {
                // Put avatars into comments
                comment.avatar = d.payload.users[comment.userName].avatar;
                if (typeof comment.comments !== 'undefined') {
                    $.each(comment.comments, function (i, subcomment) {
                        subcomment.avatar = d.payload.users[subcomment.userName].avatar;
                    });
                }
            });
            $this.find('.new-blog-comments').empty().append(
                bR.renderTemplates.renderComments(comments)
            );
            // Add images into comments
            $($this.find('.new-blog-comments').find('img')).each(function (i, image) {
                $(this).attr('src', $(this).attr('data-src'));
            });
        });
    }

    // Expand content and load blog post, including images
    function toggleDetails(event) {
        $this = event.data.this;
        if (!$this.hasClass('expanded')) {
            removeExpandedContent($('.expanded'), false);
            $this.addClass('expanded');
            $this[0].scrollIntoView({ behavior: 'smooth', block: "start" });
            // Lazy load the images
            $this.find('.new-blog-text').find('.article-media-thumbnail').each(function (i, v) {
                $(v).find('img').attr('src', $(v).find('a').attr('href'));
            });
        } else {
            removeExpandedContent($this);
        }
    }

    // Hide expanded content and scroll back to top of box
    function removeExpandedContent($this, scroll = true) {
        if ($this.length) {
            $this.removeClass('expanded');
            if (scroll) {
                $this[0].scrollIntoView({ behavior: 'smooth', block: "start" });
            }
        }
    }

    // Remove expanded content on click outisde or keyup
    $('body').click(function (e) {
        if (!$(e.target).closest('.expanded').length) {
            removeExpandedContent($('.expanded'));
        }
    });
    $(document).keyup(function (e) {
        if (e.keyCode == 27) { // escape
            if (!$(e.target).closest('.expanded').length) {
                removeExpandedContent($('.expanded'));
            }
        }
    });

    // Post comment when button is clicked, handle errors
    $(document).on('click', '.cb-respond-button', function () {
        var id = $(this).parent().attr('data-id'),
            comment = $(this).parent().find('textarea').val(),
            $error = $(this).parent().find('.cb-error');
        $this = $(this).parent().parent().parent(),
            title = $this.find('.new-blog-title').text();

        if (comment === '') {
            $error.text('No text found');
            return;
        }

        bR.addComment(id, comment).done(function (r) {
            createCommentCounts($this, title);
            $this.parent().find('textarea').val('');
            $error.text('');
        }).fail(function (r) {
            $error.text('An error occurred, please try again.');
        });
    });

    // Places blog page into expand area
    function createSnippets($this, title) {
        bR.getBlogPage(title).done(function (d) {
            if (typeof d.data.article !== 'undefined') {
                $this.find('.new-blog-text').append(d.data.article.content);
            } else {
                $this.find('.new-blog-text').append('<span style="color:#F00">Blog is blank.</span>');
            }
            $this.find('.new-blog-expand').removeClass('hidden').on('click', { this: $this }, toggleDetails);
            $this.find('.cb-respond').attr('data-id', d.data.details.id);
        });
    }

    // Start initialise code
    importStylesheetURI('http://internal-community.wikia.com/index.php?title=MediaWiki:BlogReport.css&action=raw&ctype=text/css');
    $('#CC-blog-interface').empty();
    bR.getAdminsAndMods().then(function(admods) {
        bR.admins = bR.admins.concat(admods);
        console.log(bR.admins);
        bR.getBlogTitles().done(function (blogData) {
            var blogs = blogData.query.pages;
            for (var key in blogs) {
                var $newBlog = bR.renderTemplates.renderBlog(
                    blogs[key].title,
                    renderStamp(blogs[key].created),
                    blogs[key].length
                );
                $('#CC-blog-interface').prepend($newBlog);
            }
            $('.new-blog-2').each(function () {
                var $this = $(this),
                    newBlogTitle = $(this).find('.new-blog-title').text();
                createCommentCounts($this, newBlogTitle);
                createSnippets($this, newBlogTitle);
            });
        });
    });
})(window, this.jQuery, this.mediaWiki, window.Mustache);
//</nowiki>

