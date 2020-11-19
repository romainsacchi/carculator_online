(function( $ ){

    //  Load the JSON File
    $.when($.ajax({
                url: "/get_language",
                dataType: 'json',
                type: 'GET',
                success : function(data) {
                   var json = data
                    return json
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).done(function(json){
                i18n.translator.add(json);
            });

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

})( jQuery );


(function()
{
    //exclude older browsers by the features we need them to support
    //and legacy opera explicitly so we don't waste time on a dead browser
    if
    (
        !document.querySelectorAll
        ||
        !('draggable' in document.createElement('span'))
        ||
        window.opera
    )
    { return; }

    //get the collection of draggable targets and add their draggable attribute
    for(var
        targets = document.querySelectorAll('[data-draggable="target"]'),
        len = targets.length,
        i = 0; i < len; i ++)
    {
        targets[i].setAttribute('aria-dropeffect', 'none');
    }

    //get the collection of draggable items and add their draggable attributes
    for(var
        items = document.querySelectorAll('[data-draggable="item"]'),
        len = items.length,
        i = 0; i < len; i ++)
    {
        items[i].setAttribute('draggable', 'true');
        items[i].setAttribute('aria-grabbed', 'false');
        items[i].setAttribute('tabindex', '0');
    }

    //dictionary for storing the selections data
    //comprising an array of the currently selected items
    //a reference to the selected items' owning container
    //and a reference to the current drop target container
    var selections =
    {
        items      : [],
        owner      : null,
        droptarget : null
    };

    //function for selecting an item
    function addSelection(item)
    {

        //if the owner reference is still null, set it to this item's parent
        //so that further selection is only allowed within the same container
        if(!selections.owner)
        {
            selections.owner = item.parentNode;
        }

        //or if that's already happened then compare it with this item's parent
        //and if they're not the same container, return to prevent selection
        else if(selections.owner != item.parentNode)
        {
            return;
        }

        //set this item's grabbed state
        item.setAttribute('aria-grabbed', 'true');

        //add it to the items array
        selections.items.push(item);
    }

    //function for unselecting an item
    function removeSelection(item)
    {
        //reset this item's grabbed state
        item.setAttribute('aria-grabbed', 'false');

        //then find and remove this item from the existing items array
        for(var len = selections.items.length, i = 0; i < len; i ++)
        {
            if(selections.items[i] == item)
            {
                selections.items.splice(i, 1);
                break;
            }
        }
    }

    //function for resetting all selections
    function clearSelections()
    {
        //if we have any selected items
        if(selections.items.length)
        {
            //reset the owner reference
            selections.owner = null;

            //reset the grabbed state on every selected item
            for(var len = selections.items.length, i = 0; i < len; i ++)
            {
                selections.items[i].setAttribute('aria-grabbed', 'false');
            }

            //then reset the items array
            selections.items = [];
        }
    }

    //shorctut function for testing whether a selection modifier is pressed
    function hasModifier(e)
    {
        return (e.ctrlKey || e.metaKey || e.shiftKey);
    }

    //function for applying dropeffect to the target containers
    function addDropeffects()
    {
        //apply aria-dropeffect and tabindex to all targets apart from the owner
        for(var len = targets.length, i = 0; i < len; i ++)
        {
            if
            (
                targets[i] != selections.owner
                &&
                targets[i].getAttribute('aria-dropeffect') == 'none'
            )
            {
                targets[i].setAttribute('aria-dropeffect', 'move');
                targets[i].setAttribute('tabindex', '0');
            }
        }

        //remove aria-grabbed and tabindex from all items inside those containers
        for(var len = items.length, i = 0; i < len; i ++)
        {
            if
            (
                items[i].parentNode != selections.owner
                &&
                items[i].getAttribute('aria-grabbed')
            )
            {
                items[i].removeAttribute('aria-grabbed');
                items[i].removeAttribute('tabindex');
            }
        }
    }

    //function for removing dropeffect from the target containers
    function clearDropeffects()
    {
        //if we have any selected items
        if(selections.items.length)
        {
            //reset aria-dropeffect and remove tabindex from all targets
            for(var len = targets.length, i = 0; i < len; i ++)
            {
                if(targets[i].getAttribute('aria-dropeffect') != 'none')
                {
                    targets[i].setAttribute('aria-dropeffect', 'none');
                    targets[i].removeAttribute('tabindex');
                }
            }

            //restore aria-grabbed and tabindex to all selectable items
            //without changing the grabbed value of any existing selected items
            for(var len = items.length, i = 0; i < len; i ++)
            {
                if(!items[i].getAttribute('aria-grabbed'))
                {
                    items[i].setAttribute('aria-grabbed', 'false');
                    items[i].setAttribute('tabindex', '0');
                }
                else if(items[i].getAttribute('aria-grabbed') == 'true')
                {
                    items[i].setAttribute('tabindex', '0');
                }
            }
        }
    }

    //shortcut function for identifying an event element's target container
    function getContainer(element)
    {
        do
        {
            if(element.nodeType == 1 && element.getAttribute('aria-dropeffect'))
            {
                return element;
            }
        }
        while(element = element.parentNode);

        return null;
    }
    //mousedown event to implement single selection
    document.addEventListener('mousedown', function(e)
    {
        //if the element is a draggable item
        if(e.target.getAttribute('draggable'))
        {
            //clear dropeffect from the target containers
            clearDropeffects();

            //if the multiple selection modifier is not pressed
            //and the item's grabbed state is currently false
            if
            (
                !hasModifier(e)
                &&
                e.target.getAttribute('aria-grabbed') == 'false'
            )
            {
                //clear all existing selections
                clearSelections();

                //then add this new selection
                addSelection(e.target);
            }
        }

        //else [if the element is anything else]
        //and the selection modifier is not pressed
        else if(!hasModifier(e))
        {
            //clear dropeffect from the target containers
            clearDropeffects();

            //clear all existing selections
            clearSelections();
        }

        //else [if the element is anything else and the modifier is pressed]
        else
        {
            //clear dropeffect from the target containers
            clearDropeffects();
        }

    }, false);

    //mouseup event to implement multiple selection
    document.addEventListener('mouseup', function(e)
    {
        //if the element is a draggable item
        //and the multipler selection modifier is pressed
        if(e.target.getAttribute('draggable') && hasModifier(e))
        {
            //if the item's grabbed state is currently true
            if(e.target.getAttribute('aria-grabbed') == 'true')
            {
                //unselect this item
                removeSelection(e.target);

                //if that was the only selected item
                //then reset the owner container reference
                if(!selections.items.length)
                {
                    selections.owner = null;
                }
            }

            //else [if the item's grabbed state is false]
            else
            {
                //add this additional selection
                addSelection(e.target);
            }
        }

    }, false);

    //dragstart event to initiate mouse dragging
    document.addEventListener('dragstart', function(e)
    {
        //if the element's parent is not the owner, then block this event
        if(selections.owner != e.target.parentNode)
        {
            e.preventDefault();
            return;
        }

        //[else] if the multiple selection modifier is pressed
        //and the item's grabbed state is currently false
        if
        (
            hasModifier(e)
            &&
            e.target.getAttribute('aria-grabbed') == 'false'
        )
        {
            //add this additional selection
            addSelection(e.target);
        }

        //we don't need the transfer data, but we have to define something
        //otherwise the drop action won't work at all in firefox
        //most browsers support the proper mime-type syntax, eg. "text/plain"
        //but we have to use this incorrect syntax for the benefit of IE10+
        e.dataTransfer.setData('text', '');

        //apply dropeffect to the target containers
        addDropeffects();

    }, false);

    //keydown event to implement selection and abort
    document.addEventListener('keydown', function(e)
    {
        //if the element is a grabbable item
        if(e.target.getAttribute('aria-grabbed'))
        {
            //Space is the selection or unselection keystroke
            if(e.keyCode == 32)
            {
                //if the multiple selection modifier is pressed
                if(hasModifier(e))
                {
                    //if the item's grabbed state is currently true
                    if(e.target.getAttribute('aria-grabbed') == 'true')
                    {
                        //if this is the only selected item, clear dropeffect
                        //from the target containers, which we must do first
                        //in case subsequent unselection sets owner to null
                        if(selections.items.length == 1)
                        {
                            clearDropeffects();
                        }

                        //unselect this item
                        removeSelection(e.target);

                        //if we have any selections
                        //apply dropeffect to the target containers,
                        //in case earlier selections were made by mouse
                        if(selections.items.length)
                        {
                            addDropeffects();
                        }

                        //if that was the only selected item
                        //then reset the owner container reference
                        if(!selections.items.length)
                        {
                            selections.owner = null;
                        }
                    }

                    //else [if its grabbed state is currently false]
                    else
                    {
                        //add this additional selection
                        addSelection(e.target);

                        //apply dropeffect to the target containers
                        addDropeffects();
                    }
                }

                //else [if the multiple selection modifier is not pressed]
                //and the item's grabbed state is currently false
                else if(e.target.getAttribute('aria-grabbed') == 'false')
                {
                    //clear dropeffect from the target containers
                    clearDropeffects();

                    //clear all existing selections
                    clearSelections();

                    //add this new selection
                    addSelection(e.target);

                    //apply dropeffect to the target containers
                    addDropeffects();
                }

                //else [if modifier is not pressed and grabbed is already true]
                else
                {
                    //apply dropeffect to the target containers
                    addDropeffects();
                }

                //then prevent default to avoid any conflict with native actions
                e.preventDefault();
            }

            //Modifier + M is the end-of-selection keystroke
            if(e.keyCode == 77 && hasModifier(e))
            {
                //if we have any selected items
                if(selections.items.length)
                {
                    //apply dropeffect to the target containers
                    //in case earlier selections were made by mouse
                    addDropeffects();

                    //if the owner container is the last one, focus the first one
                    if(selections.owner == targets[targets.length - 1])
                    {
                        targets[0].focus();
                    }

                    //else [if it's not the last one], find and focus the next one
                    else
                    {
                        for(var len = targets.length, i = 0; i < len; i ++)
                        {
                            if(selections.owner == targets[i])
                            {
                                targets[i + 1].focus();
                                break;
                            }
                        }
                    }
                }

                //then prevent default to avoid any conflict with native actions
                e.preventDefault();
            }
        }

        //Escape is the abort keystroke (for any target element)
        if(e.keyCode == 27)
        {
            //if we have any selected items
            if(selections.items.length)
            {
                //clear dropeffect from the target containers
                clearDropeffects();

                //then set focus back on the last item that was selected, which is
                //necessary because we've removed tabindex from the current focus
                selections.items[selections.items.length - 1].focus();

                //clear all existing selections
                clearSelections();

                //but don't prevent default so that native actions can still occur
            }
        }

    }, false);

    //related variable is needed to maintain a reference to the
    //dragleave's relatedTarget, since it doesn't have e.relatedTarget
    var related = null;

    //dragenter event to set that variable
    document.addEventListener('dragenter', function(e)
    {
        related = e.target;

    }, false);

    //dragleave event to maintain target highlighting using that variable
    document.addEventListener('dragleave', function(e)
    {
        //get a drop target reference from the relatedTarget
        var droptarget = getContainer(related);

        //if the target is the owner then it's not a valid drop target
        if(droptarget == selections.owner)
        {
            droptarget = null;
        }

        //if the drop target is different from the last stored reference
        //(or we have one of those references but not the other one)
        if(droptarget != selections.droptarget)
        {
            //if we have a saved reference, clear its existing dragover class
            if(selections.droptarget)
            {
                selections.droptarget.className =
                    selections.droptarget.className.replace(/ dragover/g, '');
            }

            //apply the dragover class to the new drop target reference
            if(droptarget)
            {
                droptarget.className += ' dragover';
            }

            //then save that reference for next time
            selections.droptarget = droptarget;
        }

    }, false);

    //dragover event to allow the drag by preventing its default
    document.addEventListener('dragover', function(e)
    {
        //if we have any selected items, allow them to be dragged
        if(selections.items.length)
        {
            e.preventDefault();
        }

    }, false);

    //dragend event to implement items being validly dropped into targets,
    //or invalidly dropped elsewhere, and to clean-up the interface either way
    document.addEventListener('dragend', function(e)
    {

        //if we have a valid drop target reference
        //(which implies that we have some selected items)
        if(selections.droptarget)
        {
            //append the selected items to the end of the target container
            for(var len = selections.items.length, i = 0; i < len; i ++)
            {
                selections.droptarget.appendChild(selections.items[i]);
            }

            //prevent default to allow the action
            e.preventDefault();
            selection_update();
        }

        //if we have any selected items
        if(selections.items.length)
        {
            //clear dropeffect from the target containers
            clearDropeffects();

            //if we have a valid drop target reference
            if(selections.droptarget)
            {
                //reset the selections array
                clearSelections();

                //reset the target's dragover class
                selections.droptarget.className =
                    selections.droptarget.className.replace(/ dragover/g, '');

                //reset the target reference
                selections.droptarget = null;
            }
        }

    }, false);

    //keydown event to implement items being dropped into targets
    document.addEventListener('keydown', function(e)
    {
        //if the element is a drop target container
        if(e.target.getAttribute('aria-dropeffect'))
        {
            //Enter or Modifier + M is the drop keystroke
            if(e.keyCode == 13 || (e.keyCode == 77 && hasModifier(e)))
            {
                //append the selected items to the end of the target container
                for(var len = selections.items.length, i = 0; i < len; i ++)
                {
                    e.target.appendChild(selections.items[i]);
                }

                //clear dropeffect from the target containers
                clearDropeffects();

                //then set focus back on the last item that was selected, which is
                //necessary because we've removed tabindex from the current focus
                selections.items[selections.items.length - 1].focus();

                //reset the selections array
                clearSelections();

                //prevent default to to avoid any conflict with native actions
                e.preventDefault();
            }
        }

    }, false);

})();

//  Load the JSON File with translations
$.when($.ajax({
            url: "/get_language",
            dataType: 'json',
            type: 'GET',
            success : function(data) {
               var json = data
                return json
                },
            error: function(xhr, status, error){console.log(error)}})
        ).done(function(json){
            i18n.translator.add(json);

            fill_in_dropdowns();


        });

function fill_in_dropdowns(){
    // Populate dropdown for production year
    var $dropdown = $("#production_year_current");

    for (var year = 1995; year < 2020; year++){
        $dropdown.append($("<option />").val(year).text(year));
    };

    $dropdown.val(2010);

    // Populate dropdown for engine type
    var $dropdown = $("#engine_type_current");

    var list_engine_types = [
        "ICEV-p",
        "ICEV-d",
        "ICEV-g",
        "BEV",
        "FCEV",
        "HEV-p",
        "HEV-d",
        "PHEV-d",
        "PHEV-p",
    ]

    for (var type = 0; type < list_engine_types.length; type++){
        $dropdown.append($("<option />").val(list_engine_types[type]).text(i18n(list_engine_types[type])));
    };

    // Populate dropdown for size type
    var $dropdown = $("#size_current");

    var list_size_types = [
        "Mini",
        "Small",
        "Lower medium",
        "Medium",
        "Large",
        "SUV",
        "Van",
    ]

    for (var type = 0; type < list_size_types.length; type++){
        $dropdown.append($("<option />").val(list_size_types[type]).text(i18n(list_size_types[type])));
    };

    // Populate dropdown for country
    var $dropdown = $("#country_current");

    var list_countries = [
        "DZ","AO","AU","AT","BE","BJ","BW","BR","BG","BF","BI",
        "CM","CA","CF","TD","CL","CN","CG","CI","HR","CY","CZ",
        "CD","DK","DJ","EG","GQ","ER","EE","SZ","ET","FI","FR",
        "GA","GM","DE","GH","GR","GN","GW","HU","IN","IE","IT",
        "JP","KE","LV","LS","LR","LY","LT","LU","MW","ML","MT",
        "MR","MA","MZ","NM","NE","NG","NO","PL","PT","RO","RU",
        "RW","SN","SL","SK","SI","SO","ZA","SS","ES","SD","SE",
        "CH","TZ","TG","TN","UG","GB","US","ZM","ZW",
    ]

    for (var c = 0; c < list_countries.length; c++){
        $dropdown.append($("<option />").val(list_countries[c]).text(i18n(list_countries[c])));
    };

    // Select current location
    $dropdown.val(country);


};


var data_array = [];

// Create annual mileage slider
var slider_annual_mileage = document.getElementById('annual-mileage-slider');
  noUiSlider.create(slider_annual_mileage, {
     start: [12000],
    range: {
        'min': [6000],
        'max': [40000]
    },
    step: 1000,
    tooltips: true,
    format: wNumb({
                decimals: 0,
                thousand: ',',
                suffix: ' km'
            })

});

// Create lifetime slider
var slider_lifetime = document.getElementById('lifetime-slider');
  noUiSlider.create(slider_lifetime, {
     start: [200000],
    range: {
        'min': [100000],
        'max': [400000]
    },
    step: 10000,
    tooltips: true,
    format: wNumb({
                decimals: 0,
                thousand: ',',
                suffix: ' km'
            })

});

// Create replacement time slider
var slider_replacement = document.getElementById('replacement-slider');
var max_range = slider_lifetime.noUiSlider.get();
max_range = max_range.replace(' km','');
max_range = Number(max_range.replace(',',''));

  noUiSlider.create(slider_replacement, {
     start: [max_range*.6],
    range: {
        'min': [100000],
        'max': [max_range]
    },
    step: 10000,
    tooltips: true,
    format: wNumb({
                decimals: 0,
                thousand: ',',
                suffix: ' km'
            })
});

// When updating the lifetime slider, its value must become the max range
// of the replacement time slider
// Also, whn updated, trigger graphs generation
slider_lifetime.noUiSlider.on('end', function (values, handle) {

    max_range = slider_lifetime.noUiSlider.get();
    max_range = max_range.replace(' km','');
    max_range = Number(max_range.replace(',',''));

    slider_replacement.noUiSlider.updateOptions({
        range: {
            'min': [100000],
            'max': [max_range]
        }
    });

    generate_graph(data_array);
    }
);

// Trigger graph update when updating replacement time slider
slider_replacement.noUiSlider.on('end', function (values, handle) {
    generate_graph(data_array);
    }
);

// Trigger graph update when updating annual mileage slider
slider_annual_mileage.noUiSlider.on('end', function (values, handle) {
    generate_graph(data_array);
    }
);


// Fetch data for the cars
function get_results_replacement_car(){
    // If year(s) selected
    var listVehicles = document.querySelectorAll( '#list_selection > li' );
    if (listVehicles.length == 0) {
    var str = i18n("missing_vehicles")
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: str
            }
            ,
            {
                placement: {
                    from: "top",
                    align: "center"
                },
                type:'warning'
            },
            {
                animate: {
                    enter: 'animated bounceInDown',
                    exit: 'animated bounceOutUp'
                },

            }
            );
        return;
    };

    var country = $("#country_current").val();

    var radio_group = $("input[name=driving_cycle]");
    var cycle = radio_group.filter(":checked").attr("id");

    $.when($.ajax({
                url: "/fetch_car_repl_results/" + country + "/" + cycle,
                type: 'GET',
                contentType: "application/json",
                dataType: 'json',
                success : function(json) {
                   var data = json
                    return data
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).then(function (data) {

                data_array = [];

                var pt = $("#engine_type_current").val();
                var s = $("#size_current").val();
                var y = Number($("#production_year_current").val());

                var impacts_current_car = extract_car_impacts(data, pt, s, y);

                data_array.push([pt, s, y, impacts_current_car[0], impacts_current_car[1]])

                // Create fuel table, remove existing rows if any
                var tableRef = document.getElementById('results_table');
                var rowCount = tableRef.rows.length;
                while (rowCount>3){
                    tableRef.deleteRow(3);
                    var rowCount = tableRef.rows.length;
                }

                var ol = document.getElementById("list_selection");
                var items = ol.getElementsByTagName("li");
                for (var i = 0; i < items.length; ++i) {
                    pt = i18n(items[i].innerHTML.split(",")[0]);
                    s = i18n(items[i].innerHTML.split(",")[1].trim());

                    for (var new_y = y + 1; new_y < 2031; ++new_y){

                        var impacts = extract_car_impacts(data, pt, s, new_y);
                        data_array.push([pt, s, new_y, impacts[0], impacts[1]])
                    }


                };

                for (var i = 0; i < items.length; i+=3) {
                    $('#results_table tr:last').after('<tr><td id="label_graph_' + i + '"></td><td id="label_graph_' + Number(i + 1) +
                         '"></td><td id="label_graph_' + Number(i + 2) + '"></td></tr>'
                        + '<tr><td><div><svg  id="graph_' + i
                        + '" style="; height: 400px; font-size: 16px; color: grey; margin-bottom: 20px; fill: white;"></div>'+
                        '<td><div><svg  id="graph_' + Number(i + 1)
                        + '" style="height: 400px; font-size: 16px; color: grey; margin-bottom: 20px; fill: white;"></div>' +
                        '<td><div><svg  id="graph_' + Number(i + 2)
                        + '" style="height: 400px; font-size: 16px; color: grey; margin-bottom: 20px; fill: white;"></div></td></tr>');
                };

                generate_graph(data_array);

            });

    $("#results").show();

    var n = 1600;
    $('html, body').animate({ scrollTop: n }, 1000);


    // Change the background color of the "Calculate" button
     document.getElementById("calculateButton").style.backgroundColor='transparent';
  };

function generate_graph(data){

    var lifetime = max_range;

    var replacement = slider_replacement.noUiSlider.get();
    replacement = replacement.replace(' km','');
    replacement = Number(replacement.replace(',',''));

    var annual_mileage = slider_annual_mileage.noUiSlider.get();
    annual_mileage = annual_mileage.replace(' km','');
    annual_mileage = Number(annual_mileage.replace(',',''));

    // Year of production of old vehicle
    var year_prod_old_car = Number($("#production_year_current").val());

    // Year of max replacement = lifetime of first vehicle / annual mileage
    var year_max_repl = year_prod_old_car + Math.round(lifetime / annual_mileage)

    // Year of early replacement = early lifetime of first vehicle / annual mileage
    var year_alt_repl = year_prod_old_car + Math.round(replacement / annual_mileage)

    // Production year of second vehicle = Year of max replacement - 1
    var year_prod_repl_car = year_max_repl - 1

    // Production year of second vehicle in alternative scenario = Year of early replacement - 1
    var year_prod_repl_car_alt = year_alt_repl - 1

    var ol = document.getElementById("list_selection");
    var items = ol.getElementsByTagName("li");

    for (var i = 0; i < items.length; ++i) {


        var impact_ref_scenario = [];

        // Increment of 1000 km and calculate impacts of old car
        var prod_impact = Number(data_array[0][3]) / 1000;
        var km_impact = Number(data_array[0][4]) / 1000;

        for (km=0; km <= lifetime; km += 1000){
            impact_ref_scenario.push({"x":km,
                "y": Number((prod_impact + (km_impact * km)))})
        }

        // Append impacts of new car for a given year
        var last_val = Number(impact_ref_scenario.slice(-1)[0]["y"])
        var last_km = impact_ref_scenario.slice(-1)[0]["x"]

        // Locate new car in data_array
        pt = i18n(items[i].innerHTML.split(",")[0]);
        s = i18n(items[i].innerHTML.split(",")[1].trim());
        y = year_prod_repl_car;

        for (c=1; c <= data_array.length - 1; c ++){

            if ((data_array[c][0] == pt) && (data_array[c][1] == s) && (data_array[c][2] == y)){
                var prod_impact = Number(data_array[c][3]) / 1000;
                var km_impact = Number(data_array[c][4]) / 1000;
            };
        };

        for (km=1000; km <= (lifetime - (lifetime - replacement)); km += 1000){
            impact_ref_scenario.push({"x":km + last_km,
            "y": Number((last_val + (prod_impact + (km_impact * km))))})
        };


        data_ref =  {values: impact_ref_scenario, key: i18n("Late replacement"), color:"#ED9F4D"};

        // Impact of alternative scenario
        var impact_alt_scenario = [];

        // Increment of 1000 km and calculate impacts of old car
        var prod_impact = Number(data_array[0][3]) / 1000;
        var km_impact = Number(data_array[0][4]) / 1000;
        for (km=0; km <= replacement; km += 1000){

            impact_alt_scenario.push({"x": km,
                "y": Number((prod_impact + (km_impact * km)))})
        }

        // Append impacts of new car for a given year
        var last_val = Number(impact_alt_scenario.slice(-1)[0]["y"])
        var last_km = impact_alt_scenario.slice(-1)[0]["x"]

        // Locate new car in data_array
        pt = i18n(items[i].innerHTML.split(",")[0]);
        s = i18n(items[i].innerHTML.split(",")[1].trim());
        y = year_prod_repl_car_alt;

        for (c=1; c <= data_array.length - 1; c ++){

            if ((data_array[c][0] == pt) && (data_array[c][1] == s) && (data_array[c][2] == y)){
                var prod_impact = Number(data_array[c][3]) / 1000;
                var km_impact = Number(data_array[c][4]) / 1000;
            };
        };

        for (km=1000; km <= lifetime; km += 1000){

            impact_alt_scenario.push({"x": km + last_km,
            "y": Number(last_val + (prod_impact + (km_impact * km)))})
        }

        data_alt = {values: impact_alt_scenario, key: i18n("Early replacement"), color:"#10C613"};
        var datum = [data_ref, data_alt];
        var graph_name = "#graph_" + i

        // Graph title
        $("#label_graph_" + i).html('<p style="color:white;">' + i18n("Replaced by")+ ' ' + items[i].innerHTML +
            ' (' + i18n("in") + ' ' + Number(year_prod_old_car + Math.round(replacement/annual_mileage)) + ' ' + i18n("instead of") + ' '
            + Number(year_prod_old_car + Math.round(lifetime/annual_mileage)) + ')</p>');

        update_label(datum, i);

        build_graph(datum, graph_name, year_prod_old_car, annual_mileage);

    };

};

function update_label(datum, i){


    var ref_result = Number(datum[0]["values"].slice(-1)[0]["y"]);
    var alt_result = Number(datum[1]["values"].slice(-1)[0]["y"]);
    var ratio = parseFloat(alt_result / ref_result)

    if (ratio > 1.2) {

        var str_1 = i18n("clearly_not_1")
        var str_2 = i18n("clearly_not_2")

        $("#label_graph_" + i).append("<p>" + str_1 + Math.round((ratio - 1) * 100) + str_2 + "</p>")
    }

    if ((ratio > 1.1) && (ratio <= 1.2)) {

        var str_1 = i18n("probably_not_1")
        var str_2 = i18n("probably_not_2")

        $("#label_graph_" + i).append("<p>"+str_1+ Math.round((ratio - 1) * 100) + str_2 + "</p>")

    }

    if ((ratio > .9) && (ratio < 1)) {

        var str_1 = i18n("hard_to_say_1_neg")
        var str_2 = i18n("hard_to_say_2_neg")

        $("#label_graph_" + i).append("<p>"+str_1+ Math.round((ratio - 1) * -1 * 100) + str_2 + "</p>")

    }

    if ((ratio >= 1) && (ratio <= 1.1)) {

        var str_1 = i18n("hard_to_say_1_pos")
        var str_2 = i18n("hard_to_say_2_pos")

        $("#label_graph_" + i).append("<p>"+str_1+ Math.round((ratio - 1) * 100) + str_2 + "</p>")

    }

    if ((ratio < .9) && (ratio > 0.8)) {

        var str_1 = i18n("probably_1")
        var str_2 = i18n("probably_2")

        $("#label_graph_" + i).append("<p>"+str_1+ Math.round((ratio - 1) * -1 * 100) + str_2 + "</p>")

    }

    if (ratio < .8) {
        var str_1 = i18n("clearly_1")
        var str_2 = i18n("clearly_2")

        $("#label_graph_" + i).append("<p>"+str_1+ Math.round((ratio - 1) * -1 * 100) + str_2 + "</p>")
    }

};

function build_graph(datum, graph_name, year_0, annual_mileage){

    nv.addGraph(function() {

            var chart_acc = nv.models.lineChart()
                            .margin({left:60, bottom:40, right:30})  //Adjust chart margins to give the x-axis some breathing room.
                            .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                            .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                            .showYAxis(true)        //Show the y-axis
                            .forceY([0, 120])
                            .showXAxis(true);    //Show the x-axis

            chart_acc.interactiveLayer.tooltip.contentGenerator(function (d) {
                  var html = "<p>" + d.value.toLocaleString()
                        + " " + i18n("km (or year ")
                        + Math.round(Number(year_0 + (d.value/annual_mileage)))
                        + ")</p> <ul>";

                  d.series.forEach(function(elem){
                  html += "<li style='list-style-type: none;'><p style='color:"+elem.color+"'>"
                            +elem.key+" " + i18n("scenario") + ": <b>" + elem.value.toFixed(1) + "</b> t CO<sub>2</sub>-eq.</p></li>";
                  })
                  html += "</ul>"
                  return html;
                })

            //chart_acc.interactiveLayer.tooltip.valueFormatter(function(d){return d.toFixed(2)});

            chart_acc.xAxis     //Chart x-axis settings
                  .axisLabel(i18n('Use (km)'))
                  .tickFormat(d3.format('.r'))
                  ;

            chart_acc.yAxis     //Chart y-axis settings
              .axisLabel("t CO2-eq.")
              .tickFormat(d3.format('.r'))
              .showMaxMin(false);

            d3.select(graph_name)    //Select the <svg> element you want to render the chart in.
                  .datum(datum)         //Populate the <svg> element with chart data...
                  .call(chart_acc);          //Finally, render the chart!

            d3.selectAll('.nv-axis .tick line').attr('fill','gray')
            d3.selectAll('.nvd3 g.nv-groups g path.nv-line').attr('stroke-width','5px')
            d3.select(graph_name).style('fill', "white");
            //Update the chart when window resizes.
            nv.utils.windowResize(function() { chart_acc.update() });
            return chart_acc;
            });

};

// Background color of 'Calculate' button turns to green when cars are selected
function selection_update(){
    // Change the background color of the "Calculate" button
     document.getElementById("calculateButton").style.backgroundColor='lightgreen';
};

// Extract production and variable impacts from the data array
function extract_car_impacts(data, pt, s, y){
    var list_pt = data["coords"]["powertrain"]["data"]
    var list_size = data["coords"]["size"]["data"]
    var list_year = data["coords"]["year"]["data"]
    var list_impact = data["coords"]["impact"]["data"]

    var index_current_car_pt = list_pt.indexOf(pt);
    var index_current_car_size = list_size.indexOf(s);
    var index_current_car_year = list_year.indexOf(y);

    var index_glider = list_impact.indexOf("glider");
    var index_powertrain = list_impact.indexOf("powertrain");
    var index_energy_storage = list_impact.indexOf("energy storage");
    var index_direct_exhaust = list_impact.indexOf("direct - exhaust");
    var index_direct_non_exhaust = list_impact.indexOf("direct - non-exhaust");
    var index_maintenance = list_impact.indexOf("maintenance");
    var index_eol = list_impact.indexOf("EoL");
    var index_energy_chain = list_impact.indexOf("energy chain");
    var index_road = list_impact.indexOf("road");

    arr = data["data"][index_current_car_size][index_current_car_pt][index_current_car_year]

    var current_car_prod_impact = (arr[index_glider] + arr[index_powertrain] + arr[index_energy_storage]) * 200000;
    var current_car_km_impact = (arr[index_direct_exhaust] + arr[index_direct_non_exhaust]
        + arr[index_maintenance] + arr[index_energy_chain] + arr[index_road]);

    return [current_car_prod_impact, current_car_km_impact]

};




