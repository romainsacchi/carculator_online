/**	

	Custom JS
	
	1. FIXED MENU
	2. FEATURED SLIDE ( SLICK SLIDER )
	3. MENU SMOOTH SCROLLING
	4. PORTFOLIO GALLERY
	5. GOOGLE MAP
	6. PORTFOLIO POPUP VIEW ( IMAGE LIGHTBOX )
	7. CLIENT TESTIMONIALS ( SLICK SLIDER )
	
**/



(function( $ ){


	/* ----------------------------------------------------------- */
	/*  2. FIXED MENU
	/* ----------------------------------------------------------- */


	jQuery(window).bind('scroll', function () {
    if ($(window).scrollTop() > 150) {
        $('#mu-header').addClass('mu-fixed-nav');
        
	    } else {
	        $('#mu-header').removeClass('mu-fixed-nav');
	    }
	});



	/* ----------------------------------------------------------- */
	/*  3. MENU SMOOTH SCROLLING
	/* ----------------------------------------------------------- */ 

		//MENU SCROLLING WITH ACTIVE ITEM SELECTED

		// Cache selectors
		var lastId,
		topMenu = $(".mu-menu"),
		topMenuHeight = topMenu.outerHeight()+13,
		// All list items
		menuItems = topMenu.find('a[href^=\\#]'),
		// Anchors corresponding to menu items
		scrollItems = menuItems.map(function(){
		  var item = $($(this).attr("href"));
		  if (item.length) { return item; }
		});

		// Bind click handler to menu items
		// so we can get a fancy scroll animation
		menuItems.click(function(e){
		  var href = $(this).attr("href"),
		      offsetTop = href === "#" ? 0 : $(href).offset().top-topMenuHeight+22;
		  jQuery('html, body').stop().animate({ 
		      scrollTop: offsetTop
		  }, 1500);
		  e.preventDefault();
		});

		// Bind to scroll
		jQuery(window).scroll(function(){
		   // Get container scroll position
		   var fromTop = $(this).scrollTop()+topMenuHeight;
		   
		   // Get id of current scroll item
		   var cur = scrollItems.map(function(){
		     if ($(this).offset().top < fromTop)
		       return this;
		   });
		   // Get the id of the current element
		   cur = cur[cur.length-1];
		   var id = cur && cur.length ? cur[0].id : "";
		   
		   if (lastId !== id) {
		       lastId = id;
		       // Set/remove active class
		       menuItems
		         .parent().removeClass("active")
		         .end().filter("[href=\\#"+id+"]").parent().addClass("active");
		   }           
		})



	
	/* ----------------------------------------------------------- */
	/*  5. GOOGLE MAP
	/* ----------------------------------------------------------- */ 
		    
	    $('#mu-google-map').click(function () {
		    $('#mu-google-map iframe').css("pointer-events", "auto");
		});
		
		$("#mu-google-map").mouseleave(function() {
		  $('#mu-google-map iframe').css("pointer-events", "none"); 
		});


	new ClipboardJS('.btn');
	$("#bgndVideo").YTPlayer();

      var Messenger = function(el){
      'use strict';
      var m = this;

      m.init = function(){
        m.codeletters = "&#*+%?£@§$";
        m.message = 0;
        m.current_length = 0;
        m.fadeBuffer = false;
        m.messages = [
          'Are electric cars really better than diesel cars?',
          'Is it time to consider hydrogen?',
          'Will petrol cars improve much in the future?',
          'Find it out now with carculator.'
        ];

        setTimeout(m.animateIn, 100);
      };

      m.generateRandomString = function(length){
        var random_text = '';
        while(random_text.length < length){
          random_text += m.codeletters.charAt(Math.floor(Math.random()*m.codeletters.length));
        }

        return random_text;
      };

      m.animateIn = function(){
        if(m.current_length < m.messages[m.message].length){
          m.current_length = m.current_length + 2;
          if(m.current_length > m.messages[m.message].length) {
            m.current_length = m.messages[m.message].length;
          }

          var message = m.generateRandomString(m.current_length);
          $(el).html(message);

          setTimeout(m.animateIn, 20);
        } else {
          setTimeout(m.animateFadeBuffer, 140);
        }
      };

      m.animateFadeBuffer = function(){
        if(m.fadeBuffer === false){
          m.fadeBuffer = [];
          for(var i = 0; i < m.messages[m.message].length; i++){
            m.fadeBuffer.push({c: (Math.floor(Math.random()*12))+1, l: m.messages[m.message].charAt(i)});
          }
        }

        var do_cycles = false;
        var message = '';

        for(var i = 0; i < m.fadeBuffer.length; i++){
          var fader = m.fadeBuffer[i];
          if(fader.c > 0){
            do_cycles = true;
            fader.c--;
            message += m.codeletters.charAt(Math.floor(Math.random()*m.codeletters.length));
          } else {
            message += fader.l;
          }
        }

        $(el).html(message);

        if(do_cycles === true){
          setTimeout(m.animateFadeBuffer, 50);
        } else {
          setTimeout(m.cycleText, 5000);
        }
      };

      m.cycleText = function(){
        m.message = m.message + 1;
        if(m.message >= m.messages.length){
          m.message = m.messages.length;
        }

        m.current_length = 0;
        m.fadeBuffer = false;
        $(el).html('');

        setTimeout(m.animateIn, 200);
      };

      m.init();
    }

    console.clear();
    var messenger = new Messenger($('#messenger'));
	
})( jQuery );


  
	