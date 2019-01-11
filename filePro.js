   // FilePro (FP)
   // A maintenance script for categorising files and deleting unused files.
   // @author: Noreplyz

   function fileFlag(filePath) {
      var fileFlagNo = 0;
      if (filePath.substring(0, 4) == "User")
         fileFlagNo += 1;
      if (filePath.substring(0, 8) == "Template")
         fileFlagNo += 2;
      if (filePath.substring(0, 8) == "Category")
         fileFlagNo += 4;
      if (filePath.substring(0, 3) == "Hub")
         fileFlagNo += 8;
      if (filePath.substring(0, 5) == "Forum")
         fileFlagNo += 16;
      if (filePath.substring(0, 6) == "Thread")
         fileFlagNo += 32;
      if (filePath.substring(0, 12) == "Board Thread")
         fileFlagNo += 32;
      if (filePath.substring(0, 4) == "Help")
         fileFlagNo += 64;
      return fileFlagNo;
   }
   function fileFlagTemplate(flag) {
      if (flag === 1) {
         return '{{Userpageimage}}';
      }
      if (flag === 2) {
         return '{{Templateimage}}';
      }
      if (flag === 4) {
         return '{{Categoryimage}}';
      }
      if (flag === 8) {
         return '{{Hubimage}}';
      }
      if (flag === 16) {
         return '{{Forumimage}}';
      }
      if (flag === 32) {
         return '{{Threadimage}}';
      }
      if (flag === 64) {
         return '{{Helpimage}}';
      }
      return '';
   }
   function checkTemplate(template, content) {
      if (content.indexOf(template) !== -1) {
         return 1;
      } else {
         return 0;
      }
   }

   function manageFile(filename) {
      $.getJSON('/api.php', {
         action: 'query',
         list: 'imageusage',
         iutitle: filename,
         iulimit: 100,
         format: 'json'
      }, function(json) {
         var localLen = json.query.imageusage.length;
         var content = [];
         var totalFlag = 0;
         if (localLen) {
            for (k = 0; k < localLen; k++) {
               var pagename = json.query.imageusage[k].title;
               var newFlag = fileFlag(pagename);
               if ((newFlag & totalFlag) !== newFlag) {
                  totalFlag += newFlag;
               }
            }

            $.get('/index.php', {
               title: filename,
               action: 'raw',
               nocache: 1,
               allinone: 1,
               dataType: 'text',
               debug:'true'
            }, function(content) {
               // logic for inserting templates.
               var originalContent = content;
               var currentFlag = 64;
               if (content.search(/==\s*Usage\s*==/) !== -1) {
               } else if (totalFlag > 0) {
                  content = "==Usage==\n" + content;
               }
               while (totalFlag > 0) {
                  if (totalFlag & currentFlag) {
                     if (!checkTemplate(fileFlagTemplate(currentFlag),content)) {
                        content = content.replace(/==\s*Usage\s*==/, '==Usage==\n' + fileFlagTemplate(currentFlag));
                     }
                     totalFlag -= currentFlag;
                  }
                  currentFlag /= 2;
               }
               if (content === "==Usage==\n" + originalContent) {

               } else if (originalContent !== content) {
                  $('<div class="file-pro-update"><h3 class="file-pro-update-file">' + filename + '</h3><div class="file-pro-update-oldcontent">'+ originalContent.replace(/(?:\r\n|\r|\n)/g, '<br />') + '</div><div class="file-pro-update-content">' + content.replace(/(?:\r\n|\r|\n)/g, '<br />') + '</div><div class="file-pro-update-button wds-button wds-is-squished">Update!</div></div>').insertBefore('#mw-content-text');
               }
            });
         }
      });
   }

   ;(function($, mw) { 
      var page = mw.config.get("wgCanonicalSpecialPageName"),
          url = window.location.href;
      if (mw.config.get("wgCanonicalNamespace") !== 'Special' &&  page !== 'Log') {
         return;
      }

      var TemplateList = [
         '{{Userpageimage}}',
         '{{Templateimage}}',
         '{{Categoryimage}}',
         '{{Hubimage}}',
         '{{Forumimage}}',
         '{{Threadimage}}',
         '{{Helpimage}}',
         '{{Communityimage}}',
         '{{StaffImage}}',
         '{{Wikia-screenshot}}'
      ];

      var FileList = [];

      $('.mw-logline-upload a').each(function(i) {
         var filename = $(this).text();
         if (filename.indexOf('File:') !== -1) {
            FileList.push(filename);
         }
      });

      $('<div id="file-pro" class="wds-button">FilePro</div>').insertBefore('#mw-content-text');
      
      $('body').on('click', '#file-pro-automate', function() {
         console.log("clicked");
         var fileprobutton = $('.file-pro-update-button');
         var i = 0;

         var timer = setInterval(function() {
              if( i < fileprobutton.length) {
                  fileprobutton[i].click();
              } else {
                  clearInterval(timer);
              }
              i = i + 1;
         }, 2000);
      })

      $('#file-pro').click(function() {
         $('#file-pro').hide();
         $('<div id="file-pro-automate" class="wds-button">FileProAutomate</div>').insertBefore('#mw-content-text');
         $(FileList).each(function(i,v) {
            manageFile(v);
         });
      });
      $('body').on('click', '.file-pro-update-button', function() {
         $this = $(this);
         $parent = $(this).parent();
         var filename2 = $parent.find(".file-pro-update-file").text();
         var newContent = $parent.find(".file-pro-update-content").html().split('<br>').join('\n');
         $.post('/api.php', {
            action: 'edit',
            title: filename2,
            summary: 'Adding templates.',
            text: newContent,
            bot:1,
            token: mw.user.tokens.get('editToken'),
            format: 'json'
         }, function(d) {
            $parent.find('.file-pro-update-button').css({"background":"#03bf62"});
         });
      });
   })(this.jQuery, this.mediaWiki);