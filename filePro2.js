/**
 * FilePro (FP) - version 2
 * A maintenance script for categorising files and deleting unused files.
 * @author Noreplyz
 */

;(function($, mw) { 
    var fp = {};

    fp.MAXFLAG = (1 << 10) - 1;
    fp.SUMMARY = 'Testing';
    fp.CONTAINER = $('#CC-file-interface');

    // Images uploaded by users in this whitelist must be ignored.
    // To include: Staff, helper, admin, threadmoderator, chatmoderator, vstf
    fp.whitelist = ['Mix Gerder'];

    
    // Types of files/templates to label
    fp.FileType = {
        userpage  : { flag: 1,   template: '{{Userpageimage}}',     category: 'UserPage Images'},
        template  : { flag: 2,   template: '{{Templateimage}}',     category: 'Template Images'},
        category  : { flag: 4,   template: '{{Categoryimage}}',     category: 'Category Images'},
        hub       : { flag: 8,   template: '{{Hubimage}}',          category: 'Hub Logo Images'},
        forum     : { flag: 16,  template: '{{Forumimage}}',        category: 'Forum Images'},
        thread    : { flag: 32,  template: '{{Threadimage}}',       category: 'Thread Images'},
        help      : { flag: 64,  template: '{{Helpimage}}',         category: 'Help Images'},
        staff     : { flag: 128, template: '{{StaffImage}}',        category: 'Staff Images'},
        screenshot: { flag: 256, template: '{{Fandom-screenshot}}', category: 'Screenshots of Fandom'}
    };

    // Namespaces that files may appear in
    fp.Namespaces = {
        2:    { type: 'userpage',  name: 'User' },
        3:    { type: 'userpage',  name: 'User talk' },
        4:    { type: 'community', name: 'Project' },
        5:    { type: 'community', name: 'Project talk' },
        10:   { type: 'template',  name: 'Template' },
        11:   { type: 'template',  name: 'Template talk' },
        12:   { type: 'help',      name: 'Help' },
        13:   { type: 'help',      name: 'Help talk' },
        14:   { type: 'category',  name: 'Category' },
        15:   { type: 'category',  name: 'Category talk' },
        110:  { type: 'forum',     name: 'Forum' },
        111:  { type: 'forum',     name: 'Forum talk' },
        150:  { type: 'hub',       name: 'Hub' },
        151:  { type: 'hub',       name: 'Hub talk' },
        500:  { type: 'userpage',  name: 'User blog' },
        501:  { type: 'userpage',  name: 'User blog comments' },
        1200: { type: 'thread',    name: 'Message Wall' },
        1201: { type: 'thread',    name: 'Thread' },
        1202: { type: 'userpage',  name: 'Message Wall Greeting' },
        2001: { type: 'thread',    name: 'Board Thread' }
    };

    /**
     * Gets the usage of an image using the MediaWiki API.
     * @param filename the file name, including File:
     * @return jQuery Deferred promise containing images and namespaces
     */
    fp.getImageUsage = function(filename) {
        return $.ajax({
            url: '/api.php',
            type: 'GET',
            data: {
                action: 'query',
                list: 'imageusage',
                iutitle: filename,
                iulimit: 100,
                format: 'json'
            },
            dataType: 'json'
        }).then(function(data) {
            // File is not an image, or error with API
            if (typeof data.query === 'undefined')
                return $.Deferred().reject(data.error);
            // Loop through and get namespace set
            var images = data.query.imageusage;
            var namespaces = [];
            images.forEach(function(image) {
                if (namespaces.indexOf(image.ns) < 0) {
                    namespaces.push(image.ns);
                }
            });
            return {images: images, namespaces: namespaces};
        });
    };

    fp.getUploadLog = function(lestart) {
        return $.ajax({
            url: '/api.php',
            type: 'GET',
            data: {
                action: 'query',
                list: 'logevents',
                letype: 'upload',
                lelimit: 250,
                lestart: lestart,
                format: 'json'
            },
            dataType: 'json'
        });
    };
    
    fp.getStaffMods = function () {
        return $.ajax({
            url: '/api.php',
            type: 'GET',
            data: {
                action: 'query',
                list: 'groupmembers',
                gmgroups: 'staff|sysop|chatmoderator|threadmoderator|helper|vstf',
                gmlimit: '300',
                format: 'json'
            },
            dataType: 'json'
        }).then(function (data) {
            return data.users.map(function (user) {
                return user.name.replace(' ', '_');
            });
        });
    };

    /**
     * Get the raw wikitext page contents using the API
     * @param title the title of the page
     * @return jQuery Deferred promise containing wikitext of page
     */
    fp.getPageContents = function(title) {
         return $.ajax({
             url: '/index.php',
             type: 'GET',
             data: {
                 title: title,
                 action: 'raw',
                 nocache: 1,
                 allinone: 1,
                 dataType: 'text',
                 debug: 'true'
             }
         }).then(function (content) {
            return content;
         });
    };

    fp.postPageContents = function(title, text) {
        return $.ajax({
            url: '/api.php',
            type: 'POST',
            data: {
                action: 'edit',
                title: title,
                summary: fp.SUMMARY,
                text: text,
                bot: 1,
                token: mw.user.tokens.get('editToken'),
                format: 'json'
            }
        });
    };

    // Functions used to process and modify the content
    fp.process = {};
    // Functions to get information on the content
    fp.insight = {};

    fp.insight.getCategories = function(content) {
        var regex = /\[\[Category:([^|]*?)(\|(.*?))?\]\]/ig;
        var category;
        var categories = [];
        while ((category = regex.exec(content)) !== null) {
            console.log(category);
            categories.push(category[1].trim());
        }
        return categories;
    };

    fp.insight.parseContent = function (content) {
        // Regex to match title in group 1 and contents in group 2
        var regex = /={2,5}(.*?)={2,5}\n((.|\n)+?(?===|$))/ig;
        var leadregex = /^(.|[\r\n])+?(?===|$)/ig;
        var parsedContent = {
            lead: '',
            content: []
        }
        var leads = content.match(leadregex);
        if (leads && leads[0].charAt(0) !== '=') {
            parsedContent.lead = content.match(leadregex)[0];
        }
        var section;
        while ((section = regex.exec(content)) !== null) {
            parsedContent.content.push({
                heading: section[1].trim(),
                text: section[2]
            });
        }
        return parsedContent;
    };

    window.fp = fp;

})(this.jQuery, this.mediaWiki);