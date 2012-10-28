var g_cnt = 0;
$(function() {
   $.ajax({ url : 'js/socket.io.min.js',
          cache : true,
       dataType : "script",
        success : function() {
            socket = io.connect('http://'+document.domain+':8080');
            socket.on('refresh', function(data) {
                $('body').prepend('<div> Refreshed: '+data+'</div>');
            });
            setInterval(function() {
                g_cnt++;
                socket.emit('msg_from_client', g_cnt);
            }, 1000);
        }
   });
});