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
            power_list_update();
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

// Radio buttons for vehicle type selection
$('#vehicle_type input:radio').addClass('input_hidden');
$('#vehicle_type label').click(function() {
    if ($(this).attr('id') == "label_car"){
        $(this).addClass('selected').siblings().removeClass('selected');
        $("#powertrain_section").attr('style', 'display:block;');
    }else{
        $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "Sorry, this category of vehicle is not available yet."},
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },
            type:'warning'
        }
        );

        return;
    };

});

// Detect when powertrains are added
function power_list_update(){
    var listItems = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var item_labels = [];

    if (listYears.length == 0){
       $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "A time horizon must be selected first."},
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },
            type:'warning'
        }
        );

       return;
    }
    else{
        if (listItems.length>0){
            $("#manufacture_section").attr('style', 'display:block;');
            $("#use_section").attr('style', 'text-align:center;padding-top:50px;display:block;');
            $("#calculation_section").attr('style', 'text-align:center;padding-top:50px;display:block;');
            generate_driving_cycle_graph('WLTC');}
        else{return;};
    };


    var row = document.getElementById('powertrain_row')
    row.innerHTML="";

    for (var item = 0; item < listItems.length; item++){
            item_labels.push(listItems[item].innerHTML)
        };

    var table = document.createElement('table');
    table.className = "table";
    table.setAttribute('style', 'width:100%;text-align:center;');
    table.id = "table_inputs"
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    var tr_body = document.createElement('tr');
    var tbody = document.createElement('tbody');

    var existing_labels = []
    for (var pt in item_labels){
        var th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.innerHTML = '<h2 style="color:white;">'+item_labels[pt]+' car</h2>';
        th.setAttribute('style', 'text-align:center;vertical-align: top;');
        var td_body = document.createElement('td');
        if (item_labels[pt]=="Electric"){
            // Battery chemistry
            var header_chemistry = document.createElement('h4');
            header_chemistry.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_chemistry.innerHTML = 'Battery type';


            var select_chemistry = document.createElement('select');
            select_chemistry.className = "form-control";
            select_chemistry.setAttribute('style', 'width:30%;margin: 0 auto;');
            select_chemistry.id = "background_Electric_chemistry";

            var option_chemistry_1 = document.createElement('option');
            option_chemistry_1.value = "1";
            option_chemistry_1.innerHTML = "Lithium Iron Phosphate (LFP)";
            var option_chemistry_2 = document.createElement('option');
            option_chemistry_2.value = "2";
            option_chemistry_2.innerHTML = "Lithium Nickel Manganese Cobalt (NCM)";
            var option_chemistry_3 = document.createElement('option');
            option_chemistry_3.value = "3";
            option_chemistry_3.innerHTML = "Lithium Nickel Cobalt Aluminum oxide (NCA)";
            select_chemistry.appendChild(option_chemistry_1);
            select_chemistry.appendChild(option_chemistry_2);
            select_chemistry.appendChild(option_chemistry_3);

            // Battery geography
            var header_batt_geography = document.createElement('h4');
            header_batt_geography.setAttribute('style', 'color:white;text-align:center;margin:20px;');
            header_batt_geography.innerHTML = 'Battery origin';

            var select_batt_geography = document.createElement('select');
            select_batt_geography.id = "background_Electric_battery_geography";
            select_batt_geography.className = "form-control";
            select_batt_geography.setAttribute('style', 'width:30%;margin: 0 auto;');

            var option_batt_geo_1 = document.createElement('option');
            option_batt_geo_1.value = "1";
            option_batt_geo_1.innerHTML = "Asia";
            var option_batt_geo_2 = document.createElement('option');
            option_batt_geo_2.value = "2";
            option_batt_geo_2.innerHTML = "Europe";
            var option_batt_geo_3 = document.createElement('option');
            option_batt_geo_3.value = "3";
            option_batt_geo_3.innerHTML = "United States";
            select_batt_geography.appendChild(option_batt_geo_1);
            select_batt_geography.appendChild(option_batt_geo_2);
            select_batt_geography.appendChild(option_batt_geo_3);

            // Battery cell energy density
            var header_cell_density = document.createElement('h4');
            header_cell_density.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_cell_density.innerHTML = 'Cell energy density [kWh/kg]';


            var slider_energy_cell = document.createElement('div');
            slider_energy_cell.id = "electric_cell_density"
            slider_energy_cell.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [.2, .4];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2017: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2040: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [.2];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [.4];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_energy_cell, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [0.05],
                    'max': [0.5]
                },
                step: 0.05,

            });

            // Battery energy cost
            var header_batt_cost = document.createElement('h4');
            header_batt_cost.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_batt_cost.innerHTML = 'Battery cost [Euro/kWh]';


            var slider_battery_cost = document.createElement('div');
            slider_battery_cost.id = "electric_battery_cost";
            slider_battery_cost.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [90, 225];
                var tooltip =  [wNumb({
                    decimals: 0,
                    prefix: '2040: '

                }), wNumb({
                    decimals: 0,
                    prefix: '2017: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [225];
                        var tooltip =  [wNumb({
                            decimals: 0,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [90];
                        var tooltip =  [wNumb({
                            decimals: 0,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_battery_cost, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [60],
                    'max': [270]
                },
                step: 5,

            });

            // Energy cost
            var header_energy_cost = document.createElement('h4');
            header_energy_cost.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_energy_cost.innerHTML = 'Electricity cost [€/kWh]';

            var slider_energy_cost = document.createElement('div');
            slider_energy_cost.id = "Electric_energy_cost";
            slider_energy_cost.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [.16, .22];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2040: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2017: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [.22];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [.16];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_energy_cost, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [.1],
                    'max': [.4]
                },
                step: .01,

            });

            td_body.appendChild(header_chemistry);
            td_body.appendChild(select_chemistry);
            td_body.appendChild(header_batt_geography);
            td_body.appendChild(select_batt_geography);
            td_body.appendChild(header_cell_density);
            td_body.appendChild(slider_energy_cell);
            td_body.appendChild(header_batt_cost);
            td_body.appendChild(slider_battery_cost);
            td_body.appendChild(header_energy_cost);
            td_body.appendChild(slider_energy_cost);

        };

        if (item_labels[pt] =="Fuel cell"){

            // Fuel cell stack type
            var header_stack_tech = document.createElement('h4');
            header_stack_tech.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_stack_tech.innerHTML = 'Fuel cell stack type';


            var select_stack_tech = document.createElement('select');
            select_stack_tech.id = "background_Fuel_cell_type";
            select_stack_tech.className = "form-control";
            select_stack_tech.setAttribute('style', 'width:30%;margin: 0 auto;')

            var option_stack_tech_1 = document.createElement('option');
            option_stack_tech_1.value = "1";
            option_stack_tech_1.innerHTML = "Proton Exchange Membrane (PEM) (Simons and Bauer, 2015)";
            var option_stack_tech_2 = document.createElement('option');
            option_stack_tech_2.value = "2";
            option_stack_tech_2.innerHTML = "Proton Exchange Membrane (PEM) (Miotti et al., 2017)";
            var option_stack_tech_3 = document.createElement('option');
            option_stack_tech_3.value = "3";
            option_stack_tech_3.innerHTML = "Proton Exchange Membrane (PEM) (Notter et al., 2015)";
            var option_stack_tech_4 = document.createElement('option');
            option_stack_tech_4.value = "4";
            option_stack_tech_4.innerHTML = "Proton Exchange Membrane (PEM) (Manufacturer data)";
            select_stack_tech.appendChild(option_stack_tech_1);
            select_stack_tech.appendChild(option_stack_tech_2);
            select_stack_tech.appendChild(option_stack_tech_3);
            select_stack_tech.appendChild(option_stack_tech_4);

            // Fuel cell stack geography
            var header_stack_origin = document.createElement('h4');
            header_stack_origin.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_stack_origin.innerHTML = 'Fuel cell stack origin';

            var select_stack_geography = document.createElement('select');
            select_stack_geography.id = "background_Fuel_cell_geography";
            select_stack_geography.className = "form-control";
            select_stack_geography.setAttribute('style', 'width:30%;margin: 0 auto;')

            var option_stack_geo_1 = document.createElement('option');
            option_stack_geo_1.value = "1";
            option_stack_geo_1.innerHTML = "Asia";
            var option_stack_geo_2 = document.createElement('option');
            option_stack_geo_2.value = "2";
            option_stack_geo_2.innerHTML = "Europe";
            var option_stack_geo_3 = document.createElement('option');
            option_stack_geo_3.value = "3";
            option_stack_geo_3.innerHTML = "United States";
            select_stack_geography.appendChild(option_stack_geo_1);
            select_stack_geography.appendChild(option_stack_geo_2);
            select_stack_geography.appendChild(option_stack_geo_3);

            // Hydrogen manufacture
            var header_h2_tech = document.createElement('h4');
            header_h2_tech.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_h2_tech.innerHTML = 'Hydrogen manufacture';

            var select_h2_tech = document.createElement('select');
            select_h2_tech.id = "background_Fuel_cell_hydrogen_technology";
            select_h2_tech.className = "form-control";
            select_h2_tech.setAttribute('style', 'width:30%;margin: 0 auto;');

            var option_h2_tech_1 = document.createElement('option');
            option_h2_tech_1.value = "1";
            option_h2_tech_1.innerHTML = "Steam Reforming of natural gas (SMR)";
            var option_h2_tech_2 = document.createElement('option');
            option_h2_tech_2.value = "2";
            option_h2_tech_2.innerHTML = "Electrolysis";
            select_h2_tech.appendChild(option_h2_tech_1);
            select_h2_tech.appendChild(option_h2_tech_2);


            // Fuel cell cost
            var header_fuel_cell_cost = document.createElement('h4');
            header_fuel_cell_cost.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_fuel_cell_cost.innerHTML = 'Fuel cell cost [Euro/kW]';


            var slider_fuel_cell_cost = document.createElement('div');
            slider_fuel_cell_cost.id = "fuel_cell_cost";
            slider_fuel_cell_cost.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [60, 160];
                var tooltip =  [wNumb({
                    decimals: 0,
                    prefix: '2040: '

                }), wNumb({
                    decimals: 0,
                    prefix: '2017: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [160];
                        var tooltip =  [wNumb({
                            decimals: 0,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [60];
                        var tooltip =  [wNumb({
                            decimals: 0,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_fuel_cell_cost, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [40],
                    'max': [200]
                },
                step: 10,

            });

            // Hydrogen cost
            var header_h2_cost = document.createElement('h4');
            header_h2_cost.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_h2_cost.innerHTML = 'Hydrogen cost [€/kWh]';


            var slider_h2_cost = document.createElement('div');
            slider_h2_cost.id = "Fuel_cell_hydrogen_cost";
            slider_h2_cost.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [.17, .24];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2040: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2017: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [.24];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [.17];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_h2_cost, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [.1],
                    'max': [.4]
                },
                step: .01,

            });

            td_body.appendChild(header_stack_tech);
            td_body.appendChild(select_stack_tech);
            td_body.appendChild(header_stack_origin);
            td_body.appendChild(select_stack_geography);
            td_body.appendChild(header_h2_tech);
            td_body.appendChild(select_h2_tech);
            td_body.appendChild(header_fuel_cell_cost);
            td_body.appendChild(slider_fuel_cell_cost);
            td_body.appendChild(header_h2_cost);
            td_body.appendChild(slider_h2_cost);

        };

        if (['Petrol', 'Diesel', 'Natural gas', 'Hybrid-petrol', '(Plugin) Hybrid-petrol'].includes(item_labels[pt])){
            // Drivetrain efficiency
            var header_drive_eff = document.createElement('h4');
            header_drive_eff.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_drive_eff.innerHTML = 'Drivetrain efficiency';

            var slider_drive_eff = document.createElement('div');
            slider_drive_eff.id = item_labels[pt] + "_drivetrain_eff"
            slider_drive_eff.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [.85,.87];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2017: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2040: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [.85];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [.87];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_drive_eff, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [0.8],
                    'max': [0.95]
                },
                step: 0.01,

            });

            // Engine efficiency
            var header_engine_eff = document.createElement('h4');
            header_engine_eff.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_engine_eff.innerHTML = 'Engine efficiency';

            var slider_engine_eff = document.createElement('div');
            slider_engine_eff.id = item_labels[pt] + "_engine_eff"
            slider_engine_eff.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [.25,.32];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2017: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2040: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [.25];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [.32];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_engine_eff, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [0.15],
                    'max': [0.35]
                },
                step: 0.01,
            });

            // Combustion share

            var header_combust_share = document.createElement('h4');
            header_combust_share.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_combust_share.innerHTML = 'Share of combustion power';


            var slider_combust_share = document.createElement('div');
            slider_combust_share.id = item_labels[pt] + "_combustion_share";
            slider_combust_share.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (listYears.length>1){
                var start_val = [.9,1];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2017: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2040: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = [1];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = [.9];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_combust_share, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': [.5],
                    'max': [1]
                },
                step: 0.05,
            });

            // Fuel cost
            var header_fuel_cost = document.createElement('h4');
            header_fuel_cost.setAttribute('style', 'color:white;text-align:center;margin:20px;')
            header_fuel_cost.innerHTML = 'Fuel cost [€/kWh]';


            var slider_fuel_cost = document.createElement('div');
            slider_fuel_cost.id = item_labels[pt] + "_fuel_cost";
            slider_fuel_cost.setAttribute('style', 'margin: 0 auto;width:50%;margin-top:50px;');

            if (['Petrol', 'Hybrid-petrol', '(Plugin) Hybrid-petrol'].includes(item_labels[pt])){
                var val_fuel_2017 = [0.1, 0.16, 0.2];
                var val_fuel_2040 = [0.1, 0.18, 0.2];
            };
            if (item_labels[pt]=="Diesel"){
                var val_fuel_2017 = [0.1, 0.12, 0.2];
                var val_fuel_2040 = [0.1, 0.14, 0.2];
            };
            if (item_labels[pt]=="Natural gas"){
                var val_fuel_2017 = [0, 0.07, 0.2];
                var val_fuel_2040 = [0, 0.11, 0.2];
            };


            if (listYears.length>1){

                var start_val = [val_fuel_2017[1], val_fuel_2040[1]];
                var tooltip =  [wNumb({
                    decimals: 2,
                    prefix: '2017: '

                }), wNumb({
                    decimals: 2,
                    prefix: '2040: '

                })]}else{

                    if (listYears[0].innerHTML == "2017"){
                        var start_val = val_fuel_2017[1];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2017: '

                        })]
                    }
                    else {
                        var start_val = val_fuel_2040[1];
                        var tooltip =  [wNumb({
                            decimals: 2,
                            prefix: '2040: '

                        })];
                    };
                };

            noUiSlider.create(slider_fuel_cost, {
                 start: start_val,
                 tooltips:tooltip,
                range: {
                    'min': val_fuel_2017[0],
                    'max': val_fuel_2017[2]
                },
                step: .01,

            });

            td_body.appendChild(header_drive_eff);
            td_body.appendChild(slider_drive_eff);
            td_body.appendChild(header_engine_eff);
            td_body.appendChild(slider_engine_eff);
            td_body.appendChild(header_combust_share);
            td_body.appendChild(slider_combust_share);
            td_body.appendChild(header_fuel_cost);
            td_body.appendChild(slider_fuel_cost);
        };

        tr.appendChild(th);
        tr_body.appendChild(td_body);

    }
    thead.appendChild(tr);
    tbody.appendChild(tr_body);
    table.appendChild(thead);
    table.appendChild(tbody);
    row.appendChild(table);

};

// Populate table with search results as the search field is updated.
$('#search_input').keyup(function() {
            var search_val = $(this).val();
            $.when($.ajax({
                url: "/search_car_model/"+search_val,
                dataType: 'json',
                type: 'GET',
                success : function(data) {
                   var json = data
                    return json
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).then(function(json){

            $("#table_search_results").find("tr:gt(0)").remove();

            var th = document.createElement('tr');
            th.innerHTML = '<th>Brand</th><th>Model</th><th>Trim</th><th>Curb mass (kg)</th><th>Powertrain</th><th>Size class</th>'
            $("#table_search_results").append(th);
                for (var row in json){
                    var tr = document.createElement('tr');
                    for (var item in json[row]){
                        tr.innerHTML += '<td>' + json[row][item].slice(0,22) + '</td>'
                    };
                    $("#table_search_results").append(tr);
                };

            }
     );
 });

 // Update driving cycles chart when selection is changed.
 $("#table_driving_cycles").on("click", "li", function () {
    var driving_cycle = $(this).text();
    $('#driving_cycle_selected').text(driving_cycle);
    generate_driving_cycle_graph(driving_cycle);
});



function generate_driving_cycle_graph(driving_cycle){
    $.when($.ajax({
        type:'GET',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        url: 'get_driving_cycle/'+driving_cycle,
        error: function(xhr,errmsg,err){
            alert('error; '+ err);
            },
        success : function(data) {
        },
        timeout: 10000}
        )).then(function(data){

            var arr_data = [];
            for (var i = 1; i < Object.keys(data).length; i++){
                 arr_data.push({"x":i, "y": data[i]})
            }
            nv.addGraph(function() {
              var chart = nv.models.lineChart()
                            .margin({left: 60, bottom:80})  //Adjust chart margins to give the x-axis some breathing room.
                            .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                            //.transitionDuration(350)  //how fast do you want the lines to transition?
                            .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                            .showYAxis(true)        //Show the y-axis
                            .showXAxis(true) ;       //Show the x-axis
                            //.width(700).height(500);
              ;

              chart.xAxis     //Chart x-axis settings
                  .axisLabel('Time (s)')
                  .tickFormat(d3.format(',r'))
                  ;

              chart.yAxis     //Chart y-axis settings
                  .axisLabel('Speed (km/h)')
                  .tickFormat(d3.format('.r'));

              /* Done setting the chart up? Time to render it!*/

              var datum = [{values:arr_data, key:'km/h', color: 'white', area:true}];

              d3.select('#chart-driving-cycle')    //Select the <svg> element you want to render the chart in.
                  .datum(datum)         //Populate the <svg> element with chart data...
                  .call(chart);          //Finally, render the chart!

              d3.select('#chart-driving-cycle').style('fill', "white");

              //Update the chart when window resizes.
              nv.utils.windowResize(function() { chart.update() });
              return chart;
            });

        });
 };

 /**
 * Create the map
 */
var map = AmCharts.makeChart("chartdiv", {
   "type": "map",
  "theme": "dark",
  "color": "rgba(0,0,0,0)",
  "dataProvider": {
    "map": "worldLow",
    "zoomLevel": 2,
    "zoomLongitude": 7.87,
    "zoomLatitude": 46.96,

    "areas": [
      {"id":"AT"},
        {"id":"AU"},
        {"id":"BE"},
        {"id":"BG"},
        {"id":"BR"},
        {"id":"CA"},
        {"id":"CH"},
        {"id":"CL"},
        {"id":"CN"},
        {"id":"CY"},
        {"id":"CZ"},
        {"id":"DE"},
        {"id":"DK"},
        {"id":"EE"},
        {"id":"ES"},
        {"id":"FI"},
        {"id":"FR"},
        {"id":"GB"},
        {"id":"GR"},
        {"id":"HR"},
        {"id":"HU"},
        {"id":"IE"},
        {"id":"IN"},
        {"id":"IT"},
        {"id":"JP"},
        {"id":"LT"},
        {"id":"LU"},
        {"id":"LV"},
        {"id":"MT"},
        {"id":"PL"},
        {"id":"PT"},
        {"id":"RO"},
        {"id":"RU"},
        {"id":"SE"},
        {"id":"SI"},
        {"id":"SK"},
        {"id":"US"},
        {"id":"ZA"},
    ]
  },
  "areasSettings": {
    "selectedColor": "grey",
    "selectable": true,
    "unlistedAreasAlpha": 0
  },
  /**
   * Add click event to track country selection/unselection
   */
  "listeners": [{
    "event": "clickMapObject",
    "method": function(e) {

      // Ignore any click not on area
      if (e.mapObject.objectType !== "MapArea")
        return;

      var area = e.mapObject;
      // Toggle showAsSelected
      area.showAsSelected = !area.showAsSelected;
      e.chart.returnInitialColor(area);

      // Update the list
      document.getElementById("country-selected").innerHTML = JSON.stringify(getSelectedCountries());
    }
  }]
});

/**
 * Function which extracts currently selected country list.
 * Returns array consisting of country ISO2 codes
 */
function getSelectedCountries() {
  var selected = [];
  for(var i = 0; i < map.dataProvider.areas.length; i++) {
    if(map.dataProvider.areas[i].showAsSelected){
        selected.push(map.dataProvider.areas[i].id);
    }
  }
  // At least two countries are selected
  if (selected.length>1){
    var existing_selection = $("#country-selected")
    $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "Currently, only one country can be selected.."},
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },
            type:'warning'
        }
        );
       get_electricity_mix(selected.slice(0,1));
    return selected.slice(0,1)
  };
  if (selected.length>0){get_electricity_mix(selected)};

  return selected;
}

function get_electricity_mix(ISO){
    var opts = {
      method: 'GET',
      headers: {}
    };
    fetch('/get_electricity_mix/'+ISO, opts).then(function (response) {
      return response.json();
    })
    .then(function (body) {
        var total_2017 = 0;
        var total_2040 = 0;
        for (var row in body['data'][0]){
           total_2017 += body['data'][0][row];
           total_2040 += body['data'][1][row];
        }

        var list_input_ids_2017 = ["background_hydro_2017", "background_nuclear_2017", "background_gas_2017",
                                    "background_solar_2017", "background_wind_2017", "background_biomass_2017",
                                    "background_coal_2017", "background_oil_2017", "background_geo_2017", "background_waste_2017"]
        var list_input_ids_2040 = ["background_hydro_2040", "background_nuclear_2040", "background_gas_2040",
                                    "background_solar_2040", "background_wind_2040", "background_biomass_2040",
                                    "background_coal_2040", "background_oil_2040", "background_geo_2040", "background_waste_2040"]

        for (var row in body['data'][0]){
            document.getElementById(list_input_ids_2017[row]).value = ((body['data'][0][row]/total_2017)*100).toFixed(2);
            document.getElementById(list_input_ids_2040[row]).value = ((body['data'][1][row]/total_2040)*100).toFixed(2);
        }
    });
};

var slider_lifetime = document.getElementById('lifetime-slider');
  noUiSlider.create(slider_lifetime, {
     start: [200000],
    range: {
        'min': [100000],
        'max': [400000]
    },
    step: 10000,
    format: wNumb({
        decimals: 0,
        thousand: ' ',
        suffix: ''

    })
});

var lifetime_ValueElement = document.getElementById('lifetime-value');

slider_lifetime.noUiSlider.on('update', function (values, handle) {
    lifetime_ValueElement.innerHTML = values[handle] + " km";
});

var slider_mileage = document.getElementById('mileage-slider');
  noUiSlider.create(slider_mileage, {
     start: [12000],
    range: {
        'min': [5000],
        'max': [30000]
    },
    step: 1000,
    format: wNumb({
        decimals: 0,
        thousand: ' ',
        suffix: ''

    })
});

var mileage_ValueElement = document.getElementById('mileage-value');

slider_mileage.noUiSlider.on('update', function (values, handle) {
    mileage_ValueElement.innerHTML = values[handle] + " km";
});

var slider_passenger = document.getElementById('passenger-slider');
  noUiSlider.create(slider_passenger, {
     start: [1.5],
    range: {
        'min': [1],
        'max': [6]
    },
    step: .5,
    format: wNumb({
        decimals: 1,
        thousand: ' ',
        suffix: ''

    })
});

slider_passenger.noUiSlider.on('update', function (values, handle) {
    var val = parseFloat(values);
    var d = {
        1.0 : "static/images/icons/one_passenger_icon.png",
        1.5: "static/images/icons/one_half_passenger_icon.png",
        2.0: "static/images/icons/two_passenger_icon.png",
        2.5: "static/images/icons/two_half_passenger_icon.png",
        3.0: "static/images/icons/three_passenger_icon.png",
        3.5: "static/images/icons/three_half_passenger_icon.png",
        4.0: "static/images/icons/four_passenger_icon.png",
        4.5: "static/images/icons/four_half_passenger_icon.png",
        5.0: "static/images/icons/five_passenger_icon.png",
        5.5: "static/images/icons/five_half_passenger_icon.png",
        6.0: "static/images/icons/six_passenger_icon.png"

    };
    $("#image_passenger").attr("src",d[val]);
});

var slider_cargo = document.getElementById('cargo-slider');
  noUiSlider.create(slider_cargo, {
     start: [150],
    range: {
        'min': [50],
        'max': [500]
    },
    step: 10,
    format: wNumb({
        decimals: 0,
        thousand: ' ',
        suffix: ''

    })
});

slider_cargo.noUiSlider.on('update', function (values, handle) {
    var val = parseFloat(values) / 5;
    $("#image_cargo").height(val);
    $('#cargo-value').text(values + " kg");
});

function get_results(){


    // If vehicle type selected
    if (!$('#vehicle_type input:radio:checked').length > 0) {
        $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "It seems that the type of vehicle to analyze is missing."},
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },
            type:'warning'
        }
        );
        return;
    }

    // If year(s) selected
    var listYears = document.querySelectorAll( '#years_list > li' );
    if (listYears.length == 0) {
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the year for which to conduct the analysis is missing."},
            {
                animate: {
                    enter: 'animated bounceInDown',
                    exit: 'animated bounceOutUp'
                },
                type:'warning'
            }
            );
        return;
    };

    // If powertrain type(s) selected
    var listItems = document.querySelectorAll( '#powertrain_list > li' );
    if (listItems.length == 0) {
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the powertrain type for which to conduct the analysis is missing."},
            {
                animate: {
                    enter: 'animated bounceInDown',
                    exit: 'animated bounceOutUp'
                },
                type:'warning'
            }
            );
        return;
    };

    // If size class(es) selected
    var listSizes = document.querySelectorAll( '#size_list > li' );
    if (listSizes.length == 0) {
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the size class for which to conduct the analysis is missing."},
            {
                animate: {
                    enter: 'animated bounceInDown',
                    exit: 'animated bounceOutUp'
                },
                type:'warning'
            }
            );
        return;
    };

    // If country selected
    if ($("#country-selected").text() == "" | $("#country-selected").text() == "[]") {
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the country for which to conduct the analysis is missing."},
            {
                animate: {
                    enter: 'animated bounceInDown',
                    exit: 'animated bounceOutUp'
                },
                type:'warning'
            }
            );
        return;
    };

    // If electricity equals 100%
    var cumul_pct_2017 = 0;
    var cumul_pct_2040 = 0;

    var list_input_ids_2017 = ["background_hydro_2017", "background_nuclear_2017", "background_gas_2017",
                                    "background_solar_2017", "background_wind_2017", "background_biomass_2017",
                                    "background_coal_2017", "background_oil_2017", "background_geo_2017", "background_waste_2017"]
    var list_input_ids_2040 = ["background_hydro_2040", "background_nuclear_2040", "background_gas_2040",
                                    "background_solar_2040", "background_wind_2040", "background_biomass_2040",
                                    "background_coal_2040", "background_oil_2040", "background_geo_2040", "background_waste_2040"]

    for (var row in list_input_ids_2017){
        cumul_pct_2017 += Number($("#"+list_input_ids_2017[row]).val());
        cumul_pct_2040 += Number($("#"+list_input_ids_2040[row]).val());
    }

    if (cumul_pct_2017 != 100 | cumul_pct_2040 != 100){
       $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the electricity mixes specified are not equal to 100%."},
            {
                animate: {
                    enter: 'animated bounceInDown',
                    exit: 'animated bounceOutUp'
                },
                type:'warning'
            }
            );
        return;
    };

    // Retrieve all necessary data and gather it into a dictionary
    // Initiate dictionary
    var data = [];

    // Retrieve year, vehicle type and class size
    var list_year = [];
    for (var item = 0; item < listYears.length; item++){
        list_year.push(listYears[item].innerHTML);
    };
    data.push({key:'year', value: list_year});

    var list_type = [];
    for (var item = 0; item < listItems.length; item++){
        list_type.push(listItems[item].innerHTML);
    };
    data.push({key: 'type', value: list_type});

    var list_size = [];
    for (var item = 0; item < listSizes.length; item++){
        list_size.push(listSizes[item].innerHTML);
    };
    data.push({key: 'size', value: list_size})

    // Retrieve car parameters
    $.each($('#table_inputs select'), function() {

            data.push({key: this.id, value:this.value
        });
    });

    $.each($('#table_inputs div'), function() {
        if (this.className == "noUi-target noUi-ltr noUi-horizontal"){
            data.push({key: this.id,value: this.noUiSlider.get()
            });
        };
    });


    // Retrieve driving cycle
    data.push({key:'driving_cycle', value: $('#driving_cycle_selected').text()});

    // Retrieve country selected
    var country = $("#country-selected").text()
    country = country.replace('[', '')
    country = country.replace(']', '')
    country = country.replace('"', '')

    data.push({key: 'background_country', value: country})

    // Retrieve electricity mix
    $.each($('#electricity_mix_table input'), function() {
            data.push({key: this.id, value:this.value
        });
    });


    // Retrieve passengers, cargo
    $.each($('#table_use div'), function() {
        if (this.className == "noUi-target noUi-ltr noUi-horizontal"){
            data.push({key: this.id,value: this.noUiSlider.get()
            });
        };
    });
    console.log(data);

    var opts = {
      method: 'POST',
      headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    };
    $.notify({
        icon: '	glyphicon glyphicon-time',
        message: "Your job has been queued. Results will be displayed in a new tab whenever ready."},
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },
            type:'success'
        });

    fetch('/get_results/', opts).then(function (response) {
      return response.json();
    }).then(function (response) {
        var job_id = response['job id'];
        // Check task status every 5 seconds
        const interval = setInterval(function() {


            fetch('/check_status/'+job_id).then(function (status) {
                return status.json();
                }).then(function (status) {
                    if (status['job status'] == 'finished'){
                        var redirectWindow = window.open('/display_result/'+job_id, '_blank');
                        redirectWindow.location;
                        clearInterval(interval);
                        return;
                    }
                    })
         }, 5000);





    });



}

