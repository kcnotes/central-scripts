;(function(mw, $) {
   if (mw.config.get('wgPageName') !== 'Special:UserUnusedFiles') return;

   filemanage = {

      init: function() { 
         $(document).prop('title', 'User Unused Files');
         $('.header-column.header-title h1').text('User Unused Files');
         $((mw.config.get('skin') === 'oasis') ? '#mw-content-text' : '#content').html('').append(
            '<div id="file-userusage">' +
            '<label for="fm-username">Username:</label>&nbsp;' +
            '<input value="" id="fm-username">' +
            '<span id="fm-getUsages" class="button">Get unused files list</span>' +
            '<div id="file-userusage-wrap"></div>' +
            '</div>'
            );

         $('#fm-getUsages').click(function() {
            $('#file-userusage-wrap').empty();
            filemanage.getFileList(0, $('#fm-username').val());
         })
         $('#fm-username').keypress(function (e) {
            var key = e.which;
            if (key == 13) {
               $('#fm-getUsages').click();
               return false;  
            }
         });
      },
      generateBox: function(title) {
         $('#file-userusage-wrap').append(
            '<div class="file-userusage-box">' + 
               '<div class="fm-box-title">' + title + '</div>' + 
            '</div>'
            );
      },
      getFileList: function(time, user) {
         // grab list of latest images
         return $.ajax({
            url: '/api.php',
            type: 'GET',
            format: 'json',
            data: {
               action: 'query',
               list: 'logevents',
               leuser: user,
               leaction: 'upload/upload',
               lestart: time,
               lelimit: 100,
               format: 'json'
            }
         }).done(function(files) {
            var fileObs = files.query.logevents;
            var uniqueFileList = [];
            $.each(fileObs, function(i, item) {
               if ($.inArray(fileObs[i].title, uniqueFileList) == -1) {
                  uniqueFileList.push(fileObs[i].title);
                  $.ajax({
                     url: '/api.php',
                     type: 'GET',
                     format: 'json',
                     data: {
                        action: 'query',
                        list: 'imageusage',
                        iutitle: fileObs[i].title,
                        iulimit: 100,
                        format: 'json'
                     }
                  }).done(function(fileUsages) {
                     if (fileUsages.query.imageusage.length == 0) {
                        filemanage.generateBox(fileObs[i].title);
                     }
                  });
               }
            })
            if (typeof files["query-continue"] !== "undefined") {
               filemanage.getFileList(files["query-continue"]["logevents"]["lestart"], user);
            }
         });
      }
   };

$(filemanage.init);

})(this.mediaWiki, this.jQuery);