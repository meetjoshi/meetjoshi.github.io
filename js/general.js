/*(SOLVED)after slide toggleing the menu button, the sidebar doesn't appear while increasing the screensize
*/

$(document).ready(function(){
    $("a.mobile").click(function(){
        $(".sidebar").slideToggle('fast');
    });

    window.onresize = function(event) {
        if($(window).width() > 320){
            $(".sidebar").show();
        }
    };

});