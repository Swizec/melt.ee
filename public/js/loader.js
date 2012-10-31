$(function() {
    cl = console.log;     
    function position_buttons() {
        $('#logout').css('left', (460 - $('#logout').outerWidth())+'px');
        window.scrollTo(0, window.scrollY);
    }

    $(window).resize(function() {
        position_buttons();
    });

    $('#save_topics').click(function() {
        var topics_data = { topic1 : $('#topic1').val() , topic2 : $('#topic2').val(), topic3 : $('#topic3').val() };
        $.ajax({
            type: 'POST',
            url: '/save_topics',
            data: topics_data,
            success : function(data) {
                topics = { topic1 : $('#topic1').val(), topic2 : $('#topic2').val(), topic3 : $('#topic3').val() };
                hide_topic_inputs();
            }
        });
    });

    $('#cancel_topics').click(function() {
        hide_topic_inputs();
    });

    function edit_topics() {
        _.each([1,2,3], function(i) {
            var val = $('#topic'+i).html();
            $('#topic'+i).after($('<input />', { id : 'topic'+i, value : topics['topic'+i] })).remove();
        });
        $('#save_topics').css('display', 'block');
        $('#cancel_topics').css('display', 'block');
        $('#edit_topics').hide();
    }


    $('#edit_topics').click(function() {
        edit_topics();
    });


    $(window).scroll(function() {
        if(window.scrollX > 0) {
            //window.scrollTo(0, window.scrollY);
        }
    });


    position_buttons();

    // load topics
    $('#topic1').val(topics.topic1);
    $('#topic2').val(topics.topic2);
    $('#topic3').val(topics.topic3);

    function hide_topic_inputs() {
        _.each([1,2,3], function(i) {
            $('#topic'+i).after('<div id="topic'+i+'" class="topic">'+(topics['topic'+i] || '/')+'</div>').remove();
        });
        $('#save_topics').hide();
        $('#cancel_topics').hide();
        $('#edit_topics').css('display', 'block');
    }

    if(topics.topic1 || topics.topic2 || topics.topic3) {
        hide_topic_inputs();
    }
});