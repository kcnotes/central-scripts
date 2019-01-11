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
    
    // Types of files/templates to label
    fp.FileType = {
        userpage  : { flag: 1,   template: '{{Userpageimage}}' },
        template  : { flag: 2,   template: '{{Templateimage}}' },
        category  : { flag: 4,   template: '{{Categoryimage}}' },
        hub       : { flag: 8,   template: '{{Hubimage}}' },
        forum     : { flag: 16,  template: '{{Forumimage}}' },
        thread    : { flag: 32,  template: '{{Threadimage}}' },
        help      : { flag: 64,  template: '{{Helpimage}}' },
        staff     : { flag: 128, template: '{{StaffImage}}' },
        screenshot: { flag: 256, template: '{{Fandom-screenshot}}' }
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
            console.log(content); 
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

    fp.getImageUsage('File:Usernoreplyz.png').then(function(data) {
        console.log(data);
        fp.getPageContents('Test');
    });

    fp.postPageContents('Test', 'test test test').then(function (d) {
        console.log(d);
    }, function (e) {
        console.log(e);
    });

})(this.jQuery, this.mediaWiki);