
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
            size_list_update();
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
    var str= i18n('category_not_available')
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: str
        },
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

});

// Detect when powertrains are added
function size_list_update(){
    var listItems = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );
    var item_labels = [];

    if (listYears.length == 0){
        var str = i18n("select_time_horizon")
           $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: str
            },
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
    }else{
        if (listItems.length>0 & listSizes.length>0){

            var old_year = false;
            for (var y = 0; y < listYears.length; y++){

                if (isNaN(parseInt(listYears[y].innerHTML))){

                    var str = i18n("not_a_number")
                       $.notify({
                        icon: 'glyphicon glyphicon-warning-sign',
                        message: str
                        },
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

                }

                if (parseInt(listYears[y].innerHTML)<2011){
                    old_year=true;
                }
            };

            var new_powertrain = false
            var list_pt = [i18n("electric"), i18n("fuel_cell"), i18n("hybrid_petrol"), i18n("hybrid_diesel"),
                     i18n("plugin_hybrid_petrol"), i18n("plugin_hybrid_diesel")]

            for (var pt = 0; pt < listItems.length; pt++){

                if (!['BEV', 'ICEV-p', 'ICEV-d',
                        'ICEV-g', 'HEV-d', 'HEV-p',
                        'PHEV-p', 'PHEV-d', 'FCEV'].includes(
                        i18n(listItems[pt].innerHTML)
                        )
                        ){

                        var str = i18n("not_a_powertrain")
                           $.notify({
                            icon: 'glyphicon glyphicon-warning-sign',
                            message: str
                            },
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
                }

                if (list_pt.includes(listItems[pt].innerHTML)){
                    new_powertrain = true;
                }
            };

            for (var s = 0; s < listSizes.length; s++){

                if (!['Micro', 'Mini', 'Small', 'Lower medium', 'Medium', 'Medium SUV',
                        'Large', 'Large SUV', 'Van'].includes(
                        i18n(listSizes[s].innerHTML)
                        )
                        ){

                        var str = i18n("not_a_size")
                           $.notify({
                            icon: 'glyphicon glyphicon-warning-sign',
                            message: str
                            },
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
                }
            };



            for (var pt = 0; pt < listItems.length; pt++){
                // if electric vehicles, display the section
                // about energy storage
                if (['BEV'].includes(i18n(listItems[pt].innerHTML))){
                    $("#row_storage").show();
                };
                // if plugin hybrid vehicles, display the section
                // about electric utility share
                if (['PHEV-p', 'PHEV-d'].includes(i18n(listItems[pt].innerHTML))){
                    $("#row_electric_utility_factor").show();
                };
            };

            // Create fuel table
            var tableRef = document.getElementById('fuel_pathway_table');
            var rowCount = tableRef.rows.length;
            while (rowCount>2){
                tableRef.deleteRow(2);
                var rowCount = tableRef.rows.length;
            }
            create_fuel_table();

            // Create electric utility share table
            var tableRef = document.getElementById('electric_utility_factor_table');
            var rowCount = tableRef.rows.length;
            while (rowCount>2){
                tableRef.deleteRow(2);
                var rowCount = tableRef.rows.length;
            }
            create_electric_utility_table();

            // Create powertrain efficiency table
            var tableRef = document.getElementById('efficiency_table');
            var rowCount = tableRef.rows.length;
            while (rowCount>2){
            tableRef.deleteRow(2);
            var rowCount = tableRef.rows.length;
            }

            create_efficiency_table();

            // Create energy storage table
            var tableRef = document.getElementById('energy_storage_table');
            var rowCount = tableRef.rows.length;
            while (rowCount>2){
                tableRef.deleteRow(2);
                var rowCount = tableRef.rows.length;
            }
            create_energy_storage_table();

            if (isConfig == false){
                prepare_data_for_efficiency();
                prepare_data_for_energy_storage();
            }

            if (old_year==true && new_powertrain==true){
                // Warning message if the powertrain is BEV, FCEV and hybrids, before 2011
                var str = i18n("powertrain_not_existing")
                $.notify({
                icon: 'glyphicon glyphicon-warning-sign',
                message: str
                },
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

            };

            var coll = document.getElementById('collapsible_parameters');
            coll.addEventListener("click", function() {

                var content = document.getElementById('manufacture_section');
                if (content.style.display === "block") {
                  content.style.display = "none";
                } else {
                  content.style.display = "block";
                }
              });

            $("#use_section").attr('style', 'text-align:center;padding-top:50px;display:block;margin-top:0px;');
            $("#efficiency_section").attr('style', 'text-align:center;padding-top:50px;display:block;margin-top:0px;');
            $("#fuel_section").attr('style', 'text-align:center;padding-top:50px;display:block;margin-top:0px;');
            $("#calculation_section").attr('style', 'text-align:center;padding-top:0px;padding-bottom:50px;display:block;');

            generate_driving_cycle_graph('WLTC');

            }
        else{return;};
    };

    // Update the electricity mix table
    var table_mix = $('#electricity_mix_table')
    var number_col = document.getElementById('electricity_mix_table').rows[0].cells.length -1

    // Remove previous columns
    for (var item = 0; item < number_col; item++){
        $("#electricity_mix_table th:last-child, #electricity_mix_table td:last-child").remove();
    }

    var slider_lifetime = document.getElementById('lifetime-slider');
    var slider_mileage = document.getElementById('mileage-slider');

    var list_lifetimes = [];
    var lifetime_km = parseFloat(slider_lifetime.noUiSlider.get());
    var annual_km = parseFloat(slider_mileage.noUiSlider.get());
    var lifetime = lifetime_km/annual_km

    var list_years = [];
    for (var item = 0; item < listYears.length; item++){
        list_years.push(listYears[item].innerHTML);
            $.each($('#electricity_mix_table tr'), function(i, row) {
                if (i==0){
                    let cell = document.createElement(i ? "td" : "th")
                    cell.innerHTML = listYears[item].innerHTML + " - " + String(parseInt(listYears[item].innerHTML) + parseInt(lifetime))
                    row.appendChild(cell)
                }
                else {
                    let input = document.createElement("input")
                    input.setAttribute('type', 'number')
                    input.setAttribute('min', '0')
                    input.setAttribute('max', '100')
                    input.setAttribute('step', '1')
                    input.setAttribute('style', 'color:white')
                    input.setAttribute('style', 'background:none')
                    let cell = document.createElement(i ? "td" : "th")
                    cell.appendChild(input)
                    row.appendChild(cell)
                }
            });

        };

    getSelectedCountries();

    var row = document.getElementById('powertrain_row');
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
    var tbody = document.createElement('tbody');

    var str_name = i18n('name')
    var str_pwt = i18n('powertrain')
    var str_size = i18n('size')
    var str_unit = i18n('unit')

    var row_content = '<th><h3 style="color:white;">'+str_name+'</h3></th><th><h3 style="color:white;">'+str_pwt+'</h3></th>';
    row_content += '<th><h3 style="color:white;">'+str_size+'</h3></th><th><h3 style="color:white;">'+str_unit+'</h3></th>';
     for (var item = 0; item < listYears.length; item++){
        row_content += '<th><h3 style="color:white;">'+listYears[item].innerHTML+'</h3></th>'
        };
    tr.innerHTML = row_content;
    thead.appendChild(tr);
    table.appendChild(thead);
    table.appendChild(tbody);
    row.appendChild(table);

    return;
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
            var str_brand = i18n('brand')
            var str_model  = i18n('model')
            var str_trim  = i18n('trim')
            var str_curb = i18n('curb_mass')
            var str_pwt = i18n('powertrain')
            var str_size = i18n('size')
            th.innerHTML = '<th>'+str_brand+'</th><th>'+str_model+'</th><th>'+str_trim+'</th><th>'+str_curb+'</th><th>'+str_pwt+'</th><th>'+str_size+'</th>'
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
        url: '/get_driving_cycle/'+driving_cycle,
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
        {"id":"BD"},
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
        {"id":"IS"},
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
        {"id":"AO"},
        {"id":"BF"},
        {"id":"BI"},
        {"id":"BJ"},
        {"id":"BW"},
        {"id":"CD"},
        {"id":"CF"},
        {"id":"CG"},
        {"id":"CI"},
        {"id":"CM"},
        {"id":"DJ"},
        {"id":"DZ"},
        {"id":"EG"},
        {"id":"ER"},
        {"id":"ET"},
        {"id":"GA"},
        {"id":"GH"},
        {"id":"GM"},
        {"id":"GN"},
        {"id":"GQ"},
        {"id":"GW"},
        {"id":"KE"},
        {"id":"LR"},
        {"id":"LS"},
        {"id":"LY"},
        {"id":"MA"},
        {"id":"ML"},
        {"id":"MR"},
        {"id":"MW"},
        {"id":"MZ"},
        {"id":"NE"},
        {"id":"NG"},
        {"id":"NL"},
        {"id":"NM"},
        {"id":"RW"},
        {"id":"SD"},
        {"id":"SL"},
        {"id":"SN"},
        {"id":"SO"},
        {"id":"SS"},
        {"id":"SZ"},
        {"id":"TD"},
        {"id":"TG"},
        {"id":"TN"},
        {"id":"TZ"},
        {"id":"UG"},
        {"id":"ZM"},
        {"id":"ZW"},
        {"id":"NO"},

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
      document.getElementById("country-selected").innerHTML = getSelectedCountries();
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
    var str = i18n('only_one_country')
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
       get_electricity_mix(selected.slice(0,1));
    return selected.slice(0,1)
  };
  // If country is selected, get electricity mixes
  // Get also biofuel shares

  if (selected.length>0){

    get_electricity_mix(selected)
    var listYears = document.querySelectorAll( '#years_list > li' );
    var list_year = [];
    for (var item = 0; item < listYears.length; item++){
        list_year.push(listYears[item].innerHTML);
    };



    if (isConfig == false){

        $.when($.ajax({
            url: "/get_fuel_blend/"+selected+"/"+list_year,
            dataType: 'json',
            type: 'GET',
            success : function(data) {
               var json = data
                return json
                },
            error: function(xhr, status, error){console.log(error)}})
        ).done(function(json){
            // Loop through divs in fuel tables
            var divs = $("#fuel_pathway_table > tbody").find('div');

            for (i=0; i<divs.length; i++){

                if (typeof divs[i].id !== 'undefined') {
                    if (divs[i].id != ""){

                        var div_year = divs[i].id.split('_')[1]
                        var fuel = divs[i].id.split('_')[0]
                        var slider = divs[i]

                        var val = parseInt(json[fuel]['primary'][list_year.indexOf(div_year)]*100)

                        // noUiSlider.update bugs if we update to 0
                        if (val == 0){val = .001};

                        slider.noUiSlider.updateOptions({
                            start: val
                        });
                    }
                    }
                }
            });
    }

    };

  return selected;
}

function exists(data){
   data !== null && data !== undefined
}

function get_electricity_mix(ISO){
    var listYears = document.querySelectorAll( '#years_list > li' );
    var list_year = [];
    for (var item = 0; item < listYears.length; item++){
        list_year.push(listYears[item].innerHTML);
    };

    var slider_lifetime = document.getElementById('lifetime-slider');
    var slider_mileage = document.getElementById('mileage-slider');

    if (slider_lifetime.hasOwnProperty('noUiSlider') && slider_mileage.hasOwnProperty('noUiSlider')) {

        var lifetime_km = parseFloat(slider_lifetime.noUiSlider.get());
        var annual_km = parseFloat(slider_mileage.noUiSlider.get());
        var lifetime = lifetime_km/annual_km

    }else{
        var lifetime = 16
    }

    var opts = {
      method: 'GET',
      headers: {}
    };

    // Fix

    $.when($.ajax({
                url: "/get_electricity_mix/"+ISO+"/"+list_year+"/"+lifetime,
                dataType: 'json',
                type: 'GET',
                success : function(data) {
                   var mix = data
                    return mix
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).then(function (mix) {

        // Concatenate mix values
        var mix_val = []
        for (var year = 0; year < list_year.length; year++){
            var i = 0;
            var sum_mix = mix[year].reduce(function(a, b) { return a + b; }, 0);

            $("#electricity_mix_table thead tr th").each(
                function (index) {
                    this.innerHTML=list_year[index] + " - " + String(parseInt(Number(list_year[index]) + lifetime))
                }
            )

            $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
                this.value = parseInt(Math.ceil(Number(mix[year][i]*100)))
                i++
            })
        }
        var str = i18n("all_params_set")
        $.notify({
        icon: '	glyphicon glyphicon-time',
        message: str
        }
        ,
        {
            placement: {
                from: "top",
                align: "center"
            },
            type:'success'
        },
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },

        });

        // Change the background color of the "Calculate" button
        document.getElementById("calculateButton").style.backgroundColor='lightgreen';

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

slider_lifetime.noUiSlider.on('change', function (values, handle) {
    if ($("#country-selected").text()!= ""){get_electricity_mix($("#country-selected").text())}
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

slider_mileage.noUiSlider.on('change', function (values, handle) {
    if ($("#country-selected").text()!= ""){get_electricity_mix($("#country-selected").text())}
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
        1.0 : "/static/images/icons/one_passenger_icon.png",
        1.5: "/static/images/icons/one_half_passenger_icon.png",
        2.0: "/static/images/icons/two_passenger_icon.png",
        2.5: "/static/images/icons/two_half_passenger_icon.png",
        3.0: "/static/images/icons/three_passenger_icon.png",
        3.5: "/static/images/icons/three_half_passenger_icon.png",
        4.0: "/static/images/icons/four_passenger_icon.png",
        4.5: "/static/images/icons/four_half_passenger_icon.png",
        5.0: "/static/images/icons/five_passenger_icon.png",
        5.5: "/static/images/icons/five_half_passenger_icon.png",
        6.0: "/static/images/icons/six_passenger_icon.png"

    };
    $("#image_passenger").attr("src",d[val]);
});

var slider_cargo = document.getElementById('cargo-slider');
  noUiSlider.create(slider_cargo, {
     start: [20],
    range: {
        'min': [0],
        'max': [200]
    },
    step: 10,
    format: wNumb({
        decimals: 0,
        thousand: ' ',
        suffix: ''

    })
});

slider_cargo.noUiSlider.on('update', function (values, handle) {
    var val = parseFloat(values) / 2;
    $("#image_cargo").height(val);
    $('#cargo-value').text(values + " kg");
});

function collect_configuration(){
    // If vehicle type selected
    if (!$('#vehicle_type input:radio:checked').length > 0) {
    var str = i18n("missing_type")
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
    }

    // If year(s) selected
    var listYears = document.querySelectorAll( '#years_list > li' );
    if (listYears.length == 0) {
    var str = i18n("missing_year")
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

    // If powertrain type(s) selected
    var listItems = document.querySelectorAll( '#powertrain_list > li' );
    if (listItems.length == 0) {
        var str = i18n('missing_powertrain')
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

    // If size class(es) selected
    var listSizes = document.querySelectorAll( '#size_list > li' );
    if (listSizes.length == 0) {
    var str = i18n('missing_size')
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

    // If country selected
    if ($("#country-selected").text() == "" | $("#country-selected").text() == "[]") {
        var str = i18n('missing_country')
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

    // If electricity equals 100%
     // Concatenate mix values
    var listYears = document.querySelectorAll( '#years_list > li' );
    var list_year = [];
    for (var item = 0; item < listYears.length; item++){
        list_year.push(listYears[item].innerHTML);
    };
    var mix_val = [];
    var is_missing = false;
    for (var year = 0; year < list_year.length; year++){
        var i = 0;
        var sum_mix = 0;

        $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
            sum_mix += Number(this.value)/100
        })
        if (sum_mix <.99 | sum_mix > 1.01){
            var str_1 = i18n('mix_1')
            var str_2 = i18n('mix_2')
            $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: str_1+String(list_year[year])+str_2
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
            is_missing = true;
        };
    }

    if (is_missing == true){
        return null;
    }

    // Retrieve all necessary data and gather it into a dictionary
    // Create dictionaries
    var params = {};
    var background_params={};
    var foreground_params = {};


    // Retrieve year, vehicle type and class size
    var list_year = [];
    for (var item = 0; item < listYears.length; item++){
        list_year.push(listYears[item].innerHTML);
    };

    params['year'] = list_year;

    var list_type = [];
    for (var item = 0; item < listItems.length; item++){
        list_type.push(i18n(listItems[item].innerHTML));
    };
    params['type'] = list_type;

    var list_size = [];
    for (var item = 0; item < listSizes.length; item++){
        list_size.push(i18n(listSizes[item].innerHTML));
    };
    params['size'] = list_size;


    // Retrieve car parameters
    dic_inputs = {};

        $("#table_inputs tbody tr").each(function () {
            var name = this.childNodes[0].innerHTML;
            var pt = i18n(this.childNodes[1].innerHTML);
            var size = i18n(this.childNodes[2].innerHTML);
            var unit = this.childNodes[3].innerHTML;

            vals=[]
            $(this).find(':input').each(function(){
                vals.push(this.value)
            })
            foreground_params[String([name, pt, size, unit])] = vals;
        });

    // Retrieve driving cycle
    params['driving_cycle']= $('#driving_cycle_selected').text();

    // Retrieve country selected
    background_params['country']= $("#country-selected").text();

    // Retrieve electricity mixes
    var mix_arr = []
    for (var year = 0; year < list_year.length; year++){
        var mix = [];
        $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
            mix.push(Number(this.value)/100)
        })
        mix_arr.push(mix)
    }

    background_params['custom electricity mix'] = mix_arr;

    // Retrieve passengers, cargo
    $.each($('#table_use_passengers tbody div'), function() {
        if (this.className == "noUi-target noUi-ltr noUi-horizontal"){
            foreground_params[this.id] = this.noUiSlider.get();
        };
    });

    // Retrieve fuel pathway
    var divs = $("#fuel_pathway_table > tbody").find('div');
    var fuel_blend = {};

    for (i=0; i<divs.length; i++){

        if (typeof divs[i].id !== 'undefined') {
            if (divs[i].id != ""){

                var slider = $("[id='"+divs[i].id+"']")[0]
                var fuel = divs[i].id.split('_')[0];
                var year = divs[i].id.split('_')[1];
                var value = parseFloat(slider.noUiSlider.get()) / 100

                // Ensure that no two same fuels are selected

                var primary_fuel_select = document.getElementById(fuel+" primary fuel");
                var secondary_fuel_select = document.getElementById(fuel+" secondary fuel");

                if (primary_fuel_select.value == secondary_fuel_select.value){

                    var str = i18n('similar_fuels')
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
                    return null;

                };

                if (fuel in fuel_blend){

                    fuel_blend[fuel]['primary fuel']['share'].push(value)
                    fuel_blend[fuel]['secondary fuel']['share'].push(1-value)

                } else {

                    fuel_blend[fuel] = {'primary fuel': {
                                            'type':primary_fuel_select.value,
                                            'share':[value]
                    },
                                        'secondary fuel': {
                                            'type':secondary_fuel_select.value,
                                            'share':[1-value]
                    }
                    }
                };
            }
        }
    };

    // Retrieve electric utility share
    var divs = $("#electric_utility_factor_table > tbody").find('div');
    var electric_utility = {};

    for (i=0; i<divs.length; i++){

        if (typeof divs[i].id !== 'undefined') {
            if (divs[i].id != ""){

                var slider = $("[id='"+divs[i].id+"']")[0]
                var year = divs[i].id.split('_')[2];
                var value = parseFloat(slider.noUiSlider.get()) / 100

                electric_utility[year] = value
            }
        }
    };



    // Retrieve energy storage
    var divs = $("#energy_storage_table > tbody").find('div');
    var energy_storage = {};

    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );

    for (pt=0;pt<listPowertrains.length;pt++){
        if (i18n(listPowertrains[pt].innerHTML) == "BEV"){
            for (s=0;s<listSizes.length;s++){
                energy_storage[i18n(listSizes[s].innerHTML)] = {
                    "energy battery mass":[],
                    "battery lifetime kilometers":[],
                    "battery cell energy density":[],
                    "type": "",
                    "origin": ""
                    };

                var div = $("[id='"+"type_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"']").children()
                var select = $(div[0]).find("option:selected").val()
                energy_storage[i18n(listSizes[s].innerHTML)]["type"] = select;

                var div = $("[id='"+"origin_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"']").children()
                var select = $(div[0]).find("option:selected").val()
                energy_storage[i18n(listSizes[s].innerHTML)]["origin"] = select;

                for (y=0;y<listYears.length;y++){


                    var slider = $("[id='"+"mass_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                    var val = parseInt(slider.noUiSlider.get().split(" ")[0]);
                    energy_storage[i18n(listSizes[s].innerHTML)]["energy battery mass"].push(val)

                    var slider = $("[id='"+"energy_density_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                    var val = parseFloat(slider.noUiSlider.get().split(" ")[0]);
                    energy_storage[i18n(listSizes[s].innerHTML)]["battery cell energy density"].push(val)

                    var slider = $("[id='"+"lifetime_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                    var val = slider.noUiSlider.get().split(" ")[0];
                    val = parseInt(val.replace(",", ""));
                    energy_storage[i18n(listSizes[s].innerHTML)]["battery lifetime kilometers"].push(val)

                }
            }
        };
    };

    // Retrieve efficiencies
    var divs = $("#efficiency_table > tbody").find('div');
    var efficiency = {};

    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );

    for (pt=0;pt<listPowertrains.length;pt++){
        efficiency[i18n(listPowertrains[pt].innerHTML)] = {};
        if (!["PHEV-p", "PHEV-d"].includes(i18n(listPowertrains[pt].innerHTML))){
            for (s=0;s<listSizes.length;s++){
                efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)] = {
                    "battery discharge efficiency":[],
                    "fuel cell stack efficiency":[],
                    "engine efficiency":[],
                    "drivetrain efficiency":[],
                    };

                for (y=0;y<listYears.length;y++){

                    if (i18n(listPowertrains[pt].innerHTML) == "BEV"){
                        var slider = $("[id='"+"storage_eff_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                        var val = parseFloat(slider.noUiSlider.get());
                        efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["battery discharge efficiency"].push(val)
                        efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["fuel cell stack efficiency"].push(0)
                    };

                    if (i18n(listPowertrains[pt].innerHTML) == "FCEV"){
                        var slider = $("[id='"+"storage_eff_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                        var val = parseFloat(slider.noUiSlider.get());
                        efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["battery discharge efficiency"].push(0)
                        efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["fuel cell stack efficiency"].push(val)
                    };

                    if (!["BEV", "FCEV"].includes(i18n(listPowertrains[pt].innerHTML))){
                        efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["battery discharge efficiency"].push(0)
                        efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["fuel cell stack efficiency"].push(0)
                    }

                    var slider = $("[id='"+"engine_eff_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                    var val = parseFloat(slider.noUiSlider.get());
                    efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["engine efficiency"].push(val)

                    var slider = $("[id='"+"drivetrain_eff_"+i18n(listPowertrains[pt].innerHTML)+"_"+i18n(listSizes[s].innerHTML)+"_"+listYears[y].innerHTML+"']")[0]
                    var val = parseFloat(slider.noUiSlider.get());
                    efficiency[i18n(listPowertrains[pt].innerHTML)][i18n(listSizes[s].innerHTML)]["drivetrain efficiency"].push(val)


                }
            }
        };
    };

    // Retrieve functional unit specs

    var fu={};
    fu["unit"] = $("#functional_unit_select").val();
    fu["quantity"] = $("#fu_distance").val();

    background_params['fuel blend'] = fuel_blend;

    if (Object.keys(electric_utility).length != 0){
        background_params['electric utility factor'] = electric_utility;
    }

    background_params['energy storage'] = {'electric': energy_storage};
    background_params['efficiency'] = efficiency;
    params['foreground params'] = foreground_params;
    params['background params'] = background_params;
    params["fu"] = fu;

    return params;

}

function get_results(){
    var data = collect_configuration();
    if (data == null){
        return;
    };
    var str = i18n('job_queued')
    $.notify({
        icon: '	glyphicon glyphicon-time',
        message: str
        }
        ,
        {
            placement: {
                from: "top",
                align: "center"
            },
            type:'success'
        },
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },

        });

    var old_progress = 0;

    $.when($.ajax({
                url: "/get_results/",
                type: 'POST',
                data:JSON.stringify(data),
                contentType: "application/json",
                dataType: 'json',
                success : function(json) {
                   var response = json
                    return response
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).then(function (response) {
        var job_id = response['job id'];


        // Check task status every 3 seconds
        var iterations = 0;
        const interval = setInterval(function() {

            iterations++;
            // Stop asking if it takes more than a minute
            if (iterations >= 60){
                clearInterval(interval);
                var str = i18n('job_lost')
                        $.notify({
                            icon: '	glyphicon glyphicon-warning',
                            message: str
                            },
                            {
                                placement: {
                                    from: "top",
                                    align: "center"
                                },
                                type:'danger'
                            },
                            {
                                animate: {
                                    enter: 'animated bounceInDown',
                                    exit: 'animated bounceOutUp'
                                },

                            });

                        return;
                    };

            $.ajax('/check_status/'+job_id).then(function (status) {
                return status;
                }).then(function (status) {

                    if (status['job status'] == 'finished'){
                        old_progress = 0;
                        clearInterval(interval);
                        var url = '/display_result/'+job_id;
                        $.notify({
										icon: 'glyphicon glyphicon-time',
										message: i18n('link_to_results'),
										url: url,
										target: '_blank',
										},
										{
											placement: {
												from: "top",
												align: "center"
											},
											type:'success',
											delay:30000
										},
										{
											animate: {
												enter: 'animated bounceInDown',
												exit: 'animated bounceOutUp'
											},
										});
                        return;
                    }

                    var new_progress = Number(status["progress_status"]);
                    var str = i18n('completion_rate')

                    if (new_progress > old_progress){

                        $.notify({
                            icon: 'glyphicon glyphicon-time',
                            message: str + " " + status["progress_status"] + "%"
                            },
                            {
                                placement: {
                                    from: "top",
                                    align: "center"
                                },
                                type:'success'
                            },
                            {
                                animate: {
                                    enter: 'animated bounceInDown',
                                    exit: 'animated bounceOutUp'
                                },
                            });
                        old_progress = Number(status["progress_status"]);
                    };

                    if (status['job status'] == 'job not found'){
                        var str = i18n('job_lost')
                            $.notify({
                                icon: '	glyphicon glyphicon-warning',
                                message: str
                                },
                                {
                                    placement: {
                                        from: "top",
                                        align: "center"
                                    },
                                    type:'danger'
                                },
                                {
                                    animate: {
                                        enter: 'animated bounceInDown',
                                        exit: 'animated bounceOutUp'
                                    },

                                });
                            clearInterval(interval);
                            return;
                    };

                    if (status['job status'] == 'failed'){
                        var str = i18n('job_lost')
                            $.notify({
                                icon: '	glyphicon glyphicon-warning',
                                message: str
                                },
                                {
                                    placement: {
                                        from: "top",
                                        align: "center"
                                    },
                                    type:'danger'
                                },
                                {
                                    animate: {
                                        enter: 'animated bounceInDown',
                                        exit: 'animated bounceOutUp'
                                    },

                                });
                            clearInterval(interval);
                            return;
                    };

                    })
         }, 3000);
    });
};

function set_mix_to_zero(){
    $.each($('#electricity_mix_table input'), function() {
        $(this).val(0);
        });
};

function save_configuration(){
    var data = collect_configuration();
    if (data == null){return;}
    // any kind of extension (.txt,.cpp,.cs,.bat)
    var filename = "carculator_configuration_file.txt";
    var blob = new Blob([JSON.stringify(data)], {
     type: "text/plain;charset=utf-8"
    });
    saveAs(blob, filename);

    var str = i18n('share_config')
    $.notify({
        icon: '	glyphicon glyphicon-warning',
        message: str
        },
        {
            placement: {
                from: "top",
                align: "center"
            },
            type:'success'
        },
        {
            animate: {
                enter: 'animated bounceInDown',
                exit: 'animated bounceOutUp'
            },
        });
};

$("#InputParameters").on("keyup", function() {
    var listItems = document.querySelectorAll( '#powertrain_list > li' );
    var list_pt = []
    for (var item = 0; item < listItems.length; item++){
        list_pt.push(listItems[item].innerHTML);
    };
    var listSizes = document.querySelectorAll( '#size_list > li' );
    var list_s = []
    for (var item = 0; item < listSizes.length; item++){
        list_s.push(listSizes[item].innerHTML);
    };

    var value = $(this).val().toLowerCase();
    if (value == ''){
        $("#TableParameters tr").remove();
        return;
        }
            $.when($.ajax({
                url: "/search_params/"+value+"/"+list_pt+"/"+list_s,
                dataType: 'json',
                type: 'GET',
                success : function(data) {
                   var json = data
                    return json
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).then(function(json){

            $("#TableParameters tr").remove();

                for (var row in json){
                    var tr = document.createElement('tr');
                    tr.setAttribute('style', 'font-size:12px;');
                    for (var item in json[row]){
                        if (item == 4 | item == 5 | item == 6){
                            var content = ''
                            for (var x in json[row][item]){
                                content += '<li style="font-size:12px;">'+json[row][item][x]+'</li>'
                            }
                            tr.innerHTML += '<td><ul>' + content + '</ul></td>'
                        }
                        else{
                            if (item==0){
                                if (json[row][item] == 'High'){
                                    tr.innerHTML += '<td style="color:red"><h6>' + json[row][item] + '</h6></td>'
                                }
                                if (json[row][item] == 'Medium'){
                                    tr.innerHTML += '<td style="color:orange"><h6>' + json[row][item] + '</h6></td>'
                                }
                                if (json[row][item] == 'Low'){
                                    tr.innerHTML += '<td style="color:yellow"><h6>' + json[row][item] + '</h6></td>'
                                }
                            }
                            else{
                                tr.innerHTML += '<td>' + json[row][item] + '</td>'
                            }
                        }
                    };
                    var str = i18n("add")
                    tr.innerHTML += '<td> <button class="online-button" id='+row+' onClick="add_param(this.id)" style="margin:5px;background-color:transparent;color:white;border:1px solid white;width:150px;">'+str+'</button> </td>'

                    $("#TableParameters").append(tr);
                };
            }
     );
  });

  function add_param(clicked_id){

    // Collect name, unit, powertrains and sizes of parameter to add
    var name = document.getElementById("TableParameters").rows[clicked_id].cells[1].innerHTML;
    var unit = document.getElementById("TableParameters").rows[clicked_id].cells[3].innerHTML;
    var scope_pt = document.getElementById("TableParameters").rows[clicked_id].cells[5];
    var p_elements = scope_pt.childNodes[0].childNodes;


    var powertrains = [];
    for (var p =0; p < p_elements.length; p++){
        powertrains.push(p_elements[p].innerHTML)
    };


    var scope_size = document.getElementById("TableParameters").rows[clicked_id].cells[6];
    var s_elements = scope_size.childNodes[0].childNodes;
    var sizes = [];
    for (var s =0; s < s_elements.length; s++){
        sizes.push(s_elements[s].innerHTML)
    };

    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var years = [];
    for (i=0;i<listYears.length;i++){years.push(listYears[i].innerHTML)};
    var listSizes = document.querySelectorAll( '#size_list > li' );

    var l_pt = []
    var l_s = []

    for (i=0;i<listPowertrains.length;i++){
        var pt = listPowertrains[i].innerHTML;

        if (powertrains.indexOf(pt) >=0 ){
            l_pt.push(i18n(pt));
        }
    }

     for (j=0;j<listSizes.length;j++){
        var s = listSizes[j].innerHTML;

        if (sizes.indexOf(s) >=0 ){
            l_s.push(i18n(s));
        }
     }

    var arr_request = [name, l_pt, l_s, unit, years]
        $.when(
            $.ajax({
                url: "/get_param_value/"+arr_request[0]+"/"+arr_request[1]+"/"+arr_request[2]+"/"+arr_request[4],
                dataType: 'json',
                type: 'GET',
                success : function(data) {
                   var json = data
                    return json
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).done(function(json){

                var tableRef = document.getElementById('table_inputs').getElementsByTagName('tbody')[0];

                json = json[0]

                for (pt=0;pt<arr_request[1].length;pt++){
                    for (s=0;s<arr_request[2].length;s++){
                    var newRow = tableRef.insertRow();
                    var row_content = '<td align="left" style="color:white">'+arr_request[0]+'</td><td align="left" style="color:white">'+i18n(arr_request[1][pt])+'</td>'
                    row_content += '<td align="left" style="color:white">'+i18n(arr_request[2][s])+'</td><td align="left" style="color:white">'+arr_request[3]+'</td>'
                    var param_content ='';
                    for (y=0;y<arr_request[4].length;y++){

                        if (arr_request[3]=='0-1'){
                                param_content += '<td align="left"><input style="color:white;background:none;width:60px;" type="number" min="0" max="1" value="'+json[0][0][y]+'"></td>'
                           }
                           else {
                                param_content += '<td align="left"><input style="color:white;background:none;width:60px;" type="number" min="0" value="'+json[0][0][y]+'"></td>'
                           };
                    }
                    row_content += param_content;
                    newRow.innerHTML = row_content;
                    row_content='';
                    param_content='';
                    }
                }
            });
        $("#TableParameters tr").remove();
        $("#InputParameters").val('');
    }

function change_tutorial_video(type){
    if (type == "mass_battery"){
        $("#tutorial_title").html("Change the mass of the battery on a electric vehicle");
        var str = `The mass of the battery of an electric vehicle can be changed by modifying
										the value of the <b>energy battery mass</b> parameter. The mass of the battery is further split into
										<b>Balance Of Plant (BoP) components mass</b> and <b>battery cells mass</b>.
										Hence, increasing the mass of the battery will also increase the mass of the battery cells
										and eventually the energy capacity of the battery. However, increasing the mass
										of the battery will also increase the driving mass of the vehicle and the energy required
										to move it over 1 km.
                                        <br>
										<p>Consider the following relations:</p>
										<p style='margin:20px;border:2px solid white;padding:5px;'>
										energy battery mass [kg] &times; battery cell mass share [%] &equals; mass of battery cells [kg]
                                        <br>
                                        mass of battery cell [kg] &times; battery cell energy density [kWh/kg] &equals; energy stored in the battery [kWh]
										</p>

										but also:

										<p  style='margin:20px;border:2px solid white;padding:5px;'>
										curb mass &equals; battery cell mass &plus; battery BoP mass &plus; ...
										<br>
										driving mass &equals; curb mass &plus; cargo mass
										<br>
										tank to wheel energy &equals; &fnof;(driving mass, engine power, ...)

										</p>`;
		var str_relation = `Consider the following relations:<br>
										energy battery mass [kg] &times; battery cell mass share [%] &equals; mass of battery cells [kg]
                                        <br>
                                        mass of battery cell [kg] &times; battery cell energy density [kWh/kg] &equals; energy stored in the battery [kWh]
										<br>

										but also:

										<br>
										curb mass &equals; battery cell mass &plus; battery BoP mass &plus; ...
											<br>
										driving mass &equals; curb mass &plus; cargo mass
											<br>
										tank to wheel energy &equals; &fnof;(driving mass, engine power, ...)`
		$("#tutorial_relation").html(str_relation);
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","/static/images/battery_mass_tutorial.gif");
    };
    if (type == "capacity_battery"){
        $("#tutorial_title").html("Change the capacity of the battery on a electric vehicle");
        var str = `<p>The model considers an initial battery mass from which the mass of the battery cells is derived. Then, once the mass of the battery cells is known,
        an energy density factor per kg of battery cell is applied. Therefore, to change the capacity of the battery, one can either change the mass
        of the battery for a same cell energy density factor, or leave the mass unchanged but adjust instead the energy density factor of the cells.</p>
        <br>
        To change the energy density factor of the cells, one can simply modify the value of the <b>battery cell energy density</b> parameter,
        which represents the energy available per kg of battery cell.`;
        $("#tutorial_text").html(str);
        var str_relation = `Consider the following relations:<br>
										energy battery mass [kg] &times; battery cell mass share [%] &equals; mass of battery cells [kg]
                                        <br>
                                        mass of battery cell [kg] &times; battery cell energy density [kWh/kg] &equals; energy stored in the battery [kWh]
										`;
        $("#tutorial_relation").html(str_relation);
        $("#tutorial_video").attr("src","/static/images/battery_cell_tutorial.gif");
    };
    if (type == "engine_eff"){
        $("#tutorial_title").html("Change the engine efficiency of a vehicle");
        var str = "The efficiency of the engine of any vehicle can simply be adjusted by modifying the <b>engine efficiency</b> parameter.";
        $("#tutorial_text").html(str);
        $("#tutorial_relation").html('');
        $("#tutorial_video").attr("src","/static/images/engine_eff_tutorial.gif");
    };
    if (type == "passenger_mass"){
        $("#tutorial_title").html("Change the average mass of a passenger");
        var str = "The average mass of a passenger can simply be adjusted by modifying the <b>average passenger mass</b> parameter.";
        $("#tutorial_text").html(str);
        $("#tutorial_relation").html('');
        $("#tutorial_video").attr("src","/static/images/passenger_mass_tutorial.gif");
    };
    if (type == "hybrid_level"){
        $("#tutorial_title").html("Change the power contribution of the combustion engine");
        var str = `By default, future vehicles are assumed to have a certain level of hybridization, where a share of the power originate an electric engine.
                    To change the contribution of the combustion engine, one can simply adjust the <b>combustion power share</b> parameter.
                    Setting such parameter to 1 indicates that all the power originate the combustion engine. Setting it to 0.5 indicates that
                    half of the vehicle power is provided by an electric engine`;
        $("#tutorial_text").html(str);
        $("#tutorial_relation").html('');
        $("#tutorial_video").attr("src","/static/images/hybrid_tutorial.gif");
    };
    if (type == "battery_lifetime"){
        $("#tutorial_title").html("Change the expected lifetime of the battery");
        var str = `The lifetime of the battery is currently expressed as a number of kilometers the battery can provided energy for.
                    This number can be adjusted by modifying the value of the <b>battery lifetime kilometers</b> parameter.
                    If this number is lower than the technical lifetime of the vehicle, a fraction of a replacement battery will be considered to
                    complete the use phase of the vehicle.`;
        $("#tutorial_text").html(str);
        $("#tutorial_relation").html('');
        $("#tutorial_video").attr("src","/static/images/battery_lifetime_tutorial.gif");
    };
    if (type == "fc_eff"){
        $("#tutorial_title").html("Change the efficiency of a fuel cell stack");
        var str = `The efficiency of the fuel cell stack of a hydrogen-powered vehicle can simply be adjusted
        by modifying the <b>fuel cell stack efficiency</b> parameter.`;
        $("#tutorial_text").html(str);
        $("#tutorial_relation").html('');
        $("#tutorial_video").attr("src","/static/images/fc_cell_tutorial.gif");
    };

}



function fill_in_from_config_file(data){
    // Display first section
    $('#label_car').trigger('click');

    // Add years to right frame
    $("#years_list").empty();
    for (y in data['year']){
        $("#years_list").append('<li>'+data['year'][y]+'</li>');
    };
    // Remove years from left frame
    var ul = document.getElementById("years_list_choice");
    var items = ul.getElementsByTagName("li");
    for (y in data['year']){
        for (var i = 0; i < items.length; ++i) {
            if (items[i].innerHTML == data["year"][y]){
                ul.removeChild(items[i]);
            };
          };
    };

    $("#powertrain_list").empty();
    for (y in data['type']){
        $("#powertrain_list").append('<li>'+i18n(data['type'][y])+'</li>');
    };

    // Remove powertrains from left frame
    var ul = document.getElementById("powertrain_list_choice");
    var items = ul.getElementsByTagName("li");
    for (y in data['type']){
        for (var i = 0; i < items.length; ++i) {

            if (items[i].innerHTML == i18n(data["type"][y])){
                ul.removeChild(items[i]);
            };
          };
    };

    $("#size_list").empty();
    for (y in data['size']){
        $("#size_list").append('<li>'+i18n(data['size'][y])+'</li>');
    };

    // Remove powertrains from left frame
    var ul = document.getElementById("size_list_choice");
    var items = ul.getElementsByTagName("li");
    for (y in data['size']){
        for (var i = 0; i < items.length; ++i) {
            if (items[i].innerHTML == i18n(data["size"][y])){
                ul.removeChild(items[i]);
            };
          };
    };



    // Driving cycle
    $('#driving_cycle_selected').text(data['driving_cycle']);
    generate_driving_cycle_graph(data['driving_cycle']);

    // Country
    var country = data['background params']['country']
    document.getElementById("country-selected").innerHTML = country
    var area = map.getObjectById(country);
    area.showAsSelected = true;

    // Car parameters
    for (p in data['foreground params']){
        var arr = p.split(',');
        if (arr.length == 4){
            var param = arr[0];
            var pwt = i18n(arr[1]);
            var size = i18n(arr[2]);
            var unit = arr[3];
            var tableRef = document.getElementById('table_inputs').getElementsByTagName('tbody')[0];
            var newRow = tableRef.insertRow();
            var row_content = '<td align="left" style="color:white">'+param+'</td><td align="left" style="color:white">'+pwt+'</td>'
            row_content += '<td align="left" style="color:white">'+size+'</td><td align="left" style="color:white">'+unit+'</td>';

            for (v in data['foreground params'][p]){
                var val = parseFloat(data['foreground params'][p][v]);
                if (unit=='0-1'){
                        row_content += '<td align="left"><input style="color:white;background:none;width:60px;" type="number" min="0" max="1" value="'+val+'"></td>'
                   }
                   else {
                        row_content += '<td align="left"><input style="color:white;background:none;width:60px;" type="number" min="0" value="'+val+'"></td>'
                   };
            };
            newRow.innerHTML = row_content;
            row_content='';
            param_content='';
        };
    };

    // Number of passengers
    var num_pass = parseFloat(data['foreground params']['passenger-slider'])
    slider_passenger.noUiSlider.updateOptions({
        start: [num_pass]
    });
    // Mass of cargo
    var mass_cargo = parseFloat(data['foreground params']['cargo-slider'])
    slider_cargo.noUiSlider.updateOptions({
        start: [mass_cargo]
    });
    // Vehicle lifetime
    var lifetime = parseFloat(data['foreground params']['lifetime-slider'].replace(' ',''))
    slider_lifetime.noUiSlider.updateOptions({
        start: [lifetime]
    });
    // Annual km
    var mileage = parseFloat(data['foreground params']['mileage-slider'].replace(' ',''))
    slider_mileage.noUiSlider.updateOptions({
        start: [mileage]
    });

    // Electricity mix(es)
    var mix = data['background params']['custom electricity mix']
    for (var year = 0; year < data['year'].length; year++){
        var i = 0;
        var sum_mix = mix[year].reduce(function(a, b) { return a + b; }, 0);
        $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
            this.value = parseInt(Math.ceil(Number(mix[year][i] / sum_mix *100)))
            i++
        })
    }

    // Change the background color of the "Calculate" button
    document.getElementById("calculateButton").style.backgroundColor='lightgreen';

    // Fill in functional unit
    $("#functional_unit_select").val(data['fu']['unit']);
    $("#fu_distance").val(data['fu']['quantity']);

};

function update_efficiency_table(data){
    var efficiency_data = data["background params"]["efficiency"];

    var map_params = {
        "battery discharge efficiency": "storage_eff",
        "fuel cell stack efficiency": "storage_eff",
        "engine efficiency": "engine_eff",
        "drivetrain efficiency": "drivetrain_eff"
    }

    for (var pt in efficiency_data) {
        // check if the property/key is defined in the object itself, not in parent
        if (efficiency_data.hasOwnProperty(pt)) {

            for (var size in efficiency_data[pt]){

                for (y=0;y<data["year"].length;y++){

                    for (var param in efficiency_data[pt][size]){

                        p = map_params[param]

                        if (efficiency_data[pt][size][param][y] != 0){

                            if ($("[id='"+p+"_"+pt+"_"+size+"_"+data["year"][y]+"']").length > 0){
                            var slider = $("[id='"+p+"_"+pt+"_"+size+"_"+data["year"][y]+"']")[0]

                            slider.noUiSlider.updateOptions({
                                        start: efficiency_data[pt][size][param][y]
                            });

                        };
                        }
                    };
                };
            };
        }
    }
};

function prepare_data_for_efficiency(){
    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );
    var tableRef = document.getElementById('efficiency_table').getElementsByTagName('tbody')[0];

    var arr_pt = [];
    var arr_y = [];
    var arr_s = [];

    for (var y = 0; y < listYears.length; y++){arr_y.push(listYears[y].innerHTML)};
    for (var s = 0; s < listSizes.length; s++){arr_s.push(i18n(listSizes[s].innerHTML))};
    for (var pt = 0; pt < listPowertrains.length; pt++){arr_pt.push(i18n(listPowertrains[pt].innerHTML))};

    var list_param = ["battery discharge efficiency", "fuel cell stack efficiency", "engine efficiency", "drivetrain efficiency"]

    var data = $.when(

            $.ajax({
                url: "/get_param_value/"+list_param+"/"+arr_pt+"/"+arr_s+"/"+arr_y,
                dataType: 'json',
                type: 'GET',
                success : function(raw) {
                   var json = raw
                    return json
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).done(function(json){

                var efficiency_data = {};
                for (var pt = 0; pt < arr_pt.length; pt++ ){
                    efficiency_data[arr_pt[pt]] = {};
                    for (var s = 0; s < arr_s.length; s++ ){
                        efficiency_data[arr_pt[pt]][arr_s[s]] = {};
                        for (var param = 0; param < list_param.length; param++){
                            efficiency_data[arr_pt[pt]][arr_s[s]][list_param[param]] =  []
                            for (var y = 0; y < arr_y.length; y ++){
                                efficiency_data[arr_pt[pt]][arr_s[s]][list_param[param]][y] = json[s][pt][param][y]
                            };
                        };
                    };
                };

                var data = {};
                data["year"] = arr_y;
                data["background params"] = {"efficiency":{}};
                data["background params"]["efficiency"] = efficiency_data;
                update_efficiency_table(data);
            });
};

function prepare_data_for_energy_storage(){
    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );
    var tableRef = document.getElementById('energy_storage_table').getElementsByTagName('tbody')[0];

    var arr_pt = [];
    var arr_y = [];
    var arr_s = [];
    for (var pt = 0; pt < listPowertrains.length; pt++){
        if (i18n(listPowertrains[pt].innerHTML) == "BEV"
            ){
                arr_pt.push("BEV")
            };

        };

    if (arr_pt.length == 0){return [];};

    for (var y = 0; y < listYears.length; y++){arr_y.push(listYears[y].innerHTML)};
    for (var s = 0; s < listSizes.length; s++){
        arr_s.push(i18n(listSizes[s].innerHTML))
    };

    var list_param = ["energy battery mass", "battery cell energy density", "battery lifetime kilometers"]

    var data = $.when(

            $.ajax({
                url: "/get_param_value/"+list_param+"/"+arr_pt+"/"+arr_s+"/"+arr_y,
                dataType: 'json',
                type: 'GET',
                success : function(raw) {
                   var json = raw
                    return json
                    },
                error: function(xhr, status, error){console.log(error)}})
            ).done(function(json){

                var energy_data = {};
                for (var s = 0; s < arr_s.length; s++ ){

                    energy_data[arr_s[s]] = {};

                    for (var pt = 0; pt < arr_pt.length; pt ++){
                        var cats = ["energy battery mass", "battery cell energy density", "battery lifetime kilometers"]
                        for (var c = 0; c < cats.length; c++){

                            var arr = [];
                            for (var y = 0; y < arr_y.length; y ++){
                                    var size = arr_s[s];
                                    var cat = cats[c];
                                    arr.push(json[s][pt][c][y])

                                };
                            energy_data[[size]][[cat]] = arr
                        }
                    energy_data[[size]]["type"] = "NMC-622"
                    energy_data[[size]]["origin"] = "CN"
                    }
                }
                var data = {};
                data["year"] = arr_y;
                data["background params"] = {"energy storage":{"electric":{}}};
                data["background params"]["energy storage"]["electric"] = energy_data;
                update_energy_storage_table(data);

            });
};

function update_energy_storage_table(data){

    var battery_data = data["background params"]["energy storage"]["electric"];

    for (var size in battery_data) {
        // check if the property/key is defined in the object itself, not in parent
        if (battery_data.hasOwnProperty(size)) {
            var pt = "BEV";
            for (y=0;y<data["year"].length;y++){

                var slider_mass = $("[id='"+"mass_"+pt+"_"+size+"_"+data["year"][y]+"']")[0]

                if (slider_mass){
                    slider_mass.noUiSlider.updateOptions({
                                    start: battery_data[size]["energy battery mass"][y]
                                });
                }

                var slider_density = $("[id='"+"energy_density_"+pt+"_"+size+"_"+data["year"][y]+"']")[0]

                if (slider_density){
                    slider_density.noUiSlider.updateOptions({
                                    start: battery_data[size]["battery cell energy density"][y]
                                });
                }

                var slider_lifetime = $("[id='"+"lifetime_"+pt+"_"+size+"_"+data["year"][y]+"']")[0]
                if (slider_lifetime){
                    slider_lifetime.noUiSlider.updateOptions({
                                    start: battery_data[size]["battery lifetime kilometers"][y]
                                });
                }
        }

        var div = $("[id='"+"type_"+pt+"_"+size+"']").children()
        var select = $(div[0])
        select.val(battery_data[size]["type"]);

        var div = $("[id='"+"origin_"+pt+"_"+size+"']").children()
        var select = $(div[0])
        select.val(battery_data[size]["origin"]);

        }
    }

};

function update_electric_utility_sliders(data){
    // Electric utility shares
    var electric_utility = data['background params']['electric utility factor']
    var listYears = document.querySelectorAll( '#years_list > li' );

    for (var key in electric_utility) {

        // check if the property/key is defined in the object itself, not in parent
        if (electric_utility.hasOwnProperty(key)) {

            var slider_div = $('#electric_utility_'+ String(key))

            if (slider_div.length){

                var slider = slider_div[0]

                // a bug with the slider prevents from using 0
                var val = parseInt(electric_utility[key]*100)
                if (val==0){val +=.001}

                slider.noUiSlider.updateOptions({
                    start: val
                });

                }
        }
    };
};

function update_fuel_sliders(data){
    // Fuel pathways
    var fuel_blend = data['background params']['fuel blend']
    var energy_storage = data['background params']['energy storage']
    var listYears = document.querySelectorAll( '#years_list > li' );

    for (var key in fuel_blend) {
        // check if the property/key is defined in the object itself, not in parent
        if (fuel_blend.hasOwnProperty(key)) {

            var fuel = key;
            var primary_fuel = fuel_blend[key]['primary fuel']['type']
            var primary_fuel_share = fuel_blend[key]['primary fuel']['share']
            var secondary_fuel = fuel_blend[key]['secondary fuel']['type']
            var secondary_fuel_share = fuel_blend[key]['secondary fuel']['share']

            for (y=0; y<listYears.length; y++){
                var year = listYears[y].innerText;
                var slider_div = $('#'+String(fuel+'_'+year))

                if (slider_div.length){

                    var slider = slider_div[0]

                    // a bug with the slider prevents from using 0
                    var val = parseInt(primary_fuel_share[y]*100)
                    if (val==0){val +=.001}


                    slider.noUiSlider.updateOptions({
                        start: val
                    });

                    // Change selected options
                    var primary_fuel_select = document.getElementById(fuel+" primary fuel");
                    primary_fuel_select.value = primary_fuel;
                    var secondary_fuel_select = document.getElementById(fuel+" secondary fuel");
                    secondary_fuel_select.value = secondary_fuel;
                }
            }
        }
    };
};

function create_fuel_table() {

    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );

    var tableRef = document.getElementById('fuel_pathway_table').getElementsByTagName('tbody')[0];

    var list_fuel = ['petrol', 'diesel', 'cng', 'hydrogen', 'electric'];

    var map_pt_to_fuel = {
        'petrol': ['ICEV-p', 'HEV-p', 'PHEV-p'],
        'diesel': ['ICEV-d', 'HEV-d', 'PHEV-d'],
        'cng': ['ICEV-g'],
        'electric': ['BEV', 'PHEV-p', 'PHEV-d'],
        'hydrogen': ['FCEV']
    }

    var fuel_options = {
        'petrol': ['petrol', 'bioethanol - wheat straw', 'bioethanol - forest residues',
                    'bioethanol - sugarbeet', 'bioethanol - maize starch', 'synthetic gasoline - economic allocation',
                    'synthetic gasoline - energy allocation'
                    ],
        'diesel': ['diesel', 'biodiesel - algae', 'biodiesel - cooking oil', 'synthetic diesel - economic allocation',
        'synthetic diesel - energy allocation'],
        'cng': ['cng', 'biogas - sewage sludge', 'biogas - biowaste', 'syngas'],
        'electric': ['electric'],
        'hydrogen': ['smr - natural gas', 'electrolysis', 'smr - biogas', 'coal gasification',
                    'wood gasification', 'smr - natural gas with CCS', 'smr - biogas with CCS',
                    'wood gasification with CCS']
    }

    for (var l_f=0; l_f < list_fuel.length; l_f++){

        var list_pt = [];
        var fuel = list_fuel[l_f];

        for (var pt = 0; pt < listPowertrains.length; pt++){

            var pt_name = i18n(listPowertrains[pt].innerText);
            if (map_pt_to_fuel[fuel].includes(pt_name)){
                list_pt.push(listPowertrains[pt].innerText)
            }
        };

        if (list_pt.length > 0){
            for (var y = 0; y < listYears.length; y++){
            var year = listYears[y].innerText;
            var newRow = tableRef.insertRow();

            if (fuel != "electric"){

                var inner_table = '<table style="border-spacing: 15px;"><tr><td id="primary_'+fuel+
                        '_'+year+'">15%</td><td><div id="'+fuel+'_'+year+'" style="width:200px;margin-left:15px;margin-right:15px;"></div></td><td id="secondary_'+
                        fuel+'_'+year+'">85%</td></tr></table>'

                if (y==0){
                    var row_content = '<td align="left" style="color:white">'
                }else{
                    var row_content = '<td align="left" style="color:white; border-top:0;">'
                }

                for (var pt=0; pt < list_pt.length; pt++){
                    row_content += list_pt[pt] + ", "
                }
                row_content += " " + year

                if (y==0){

                    row_content += '</td><td align="left" style="color:white">'

                    row_content += '<select id="' + fuel + ' primary fuel" style="color:grey">'

                    for (f=0; f < fuel_options[fuel].length; f++){
                        row_content += '<option value="' + fuel_options[fuel][f] + '">' + i18n(fuel_options[fuel][f]) + '</option>'
                    }

                    row_content += '</select></td>'
                    row_content += '<td align="left" style="color:white">'+inner_table+'</td>'
                    row_content += '</td><td align="left" style="color:white">'
                    row_content += '<select id="' + fuel + ' secondary fuel" style="color:grey">'

                    for (f=1; f < fuel_options[fuel].length; f++){
                        row_content += '<option value="' + fuel_options[fuel][f] + '">' + i18n(fuel_options[fuel][f]) + '</option>'
                    }
                    row_content += '</select></td>'

                }else{

                    row_content += '</td><td align="left" style="color:white; border-top:0;">'
                    row_content += '</td>'
                    row_content += '<td align="left" style="color:white; border-top:0;">'+inner_table+'</td>'
                            + '<td align="left" style="color:white; border-top:0;"></td>'
                            + '<td align="left" style="color:white; border-top:0;"></td>'
                }
                newRow.innerHTML = row_content;

            }else{

                if (y==0){
                    var row_content = '<td align="left" style="color:white">'
                }else{
                    var row_content = '<td align="left" style="color:white; border-top:0;">'
                }

                for (var pt=0; pt < list_pt.length; pt++){
                    row_content += list_pt[pt] + ", "
                }

                row_content += " " + year

                if (y==0){
                    row_content += '</td><td align="left" style="color:white" colspan=3>'
                    +i18n('electricity_mix_already_specified')
                    +'</td>'
                }else{
                    row_content += '</td><td align="left" style="color:white; border-top:0;" colspan=3>'
                    +'</td>'
                }
                newRow.innerHTML = row_content;
            }
            // Append table to div
            tableRef.append(newRow);
            };
        };
    };

    var divs = $("#fuel_pathway_table > tbody").find('div');

    for (var i=0; i<divs.length; i++){

           var slider = noUiSlider.create(divs[i], {
                start: 95,
                connect: true,
                range: {
                    'min': 0,
                    'max': 100
                }
            });

         slider.id = "_"+divs[i].id
         slider.on('update', function(values, handle){
            var primary_id = "primary"+this.id
            var secondary_id = "secondary"+this.id
            var div_primary = $("[id='"+primary_id+"']")
            var div_secondary = $("[id='"+secondary_id+"']")
            div_primary.text(parseInt(values[0]) + ' %')
            div_primary.val(parseInt(values[0]))
            div_secondary.text(parseInt(100-values[0]) + ' %')
            div_secondary.val(parseInt(100-values[0]))
         })
    };


};

function create_electric_utility_table() {


    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );

    var tableRef = document.getElementById('electric_utility_factor_table').getElementsByTagName('tbody')[0];

    for (var y=0; y < listYears.length; y++){
        var year = listYears[y].innerText;
        var list_pt = "";
        var row_content = "";
        var newRow = tableRef.insertRow();
        for (var pt=0; pt < listPowertrains.length; pt++){
            var pwt = listPowertrains[pt].innerHTML;
            if (['PHEV-p', 'PHEV-d'].includes(i18n(pwt))){
                list_pt += pwt + ', ';

                var inner_table = '<table style="border-spacing: 15px;"><tr><td id="share_electric_electric_utility_'+year+'">15%</td>'
                                    +'<td><div id="electric_utility_'+year+'" style="width:200px;margin-left:15px;margin-right:15px;"></div>'
                                    +'</td><td id="share_combustion_electric_utility_'+year+'">85%</td></tr></table>'
                if (y==0){
                    row_content = '<td align="left" style="color:white">'
                }else{
                    row_content = '<td align="left" style="color:white; border-top:0;">'
                }

                row_content += list_pt + " " + year

                if (y==0){
                    row_content += '</td><td align="left" style="color:white">'
                    row_content += inner_table + '</td>'
                }else{
                    row_content += '</td><td align="left" style="color:white; border-top:0;">'
                    row_content += inner_table + '</td>'
                }
            }
        }
        if (row_content != ""){newRow.innerHTML = row_content};
        if (newRow.innerHTML != ""){
        // Append table to div
        tableRef.append(newRow);
        };
    }



    var divs = $("#electric_utility_factor_table > tbody").find('div');

    for (var i=0; i<divs.length; i++){

        var year = Number(divs[i].id.split("_")[2])

        var utility_factor = parseInt(((year * .01434) - 28.67)*100)

           var slider = noUiSlider.create(divs[i], {
                start: utility_factor,
                connect: true,
                range: {
                    'min': 0,
                    'max': 70
                }
            });

         slider.id = "_"+divs[i].id
         slider.on('update', function(values, handle){
            var primary_id = "share_electric"+this.id
            var secondary_id = "share_combustion"+this.id
            var div_primary = $("[id='"+primary_id+"']")
            var div_secondary = $("[id='"+secondary_id+"']")
            div_primary.text(parseInt(values[0]) + ' % ' + i18n("electric_mode"))
            div_primary.val(parseInt(values[0]))
            div_secondary.text(parseInt(100-values[0]) + ' % ' + i18n("combustion_mode"))
            div_secondary.val(parseInt(100-values[0]))
         })
    };
};

function create_energy_storage_table() {

    var list_fuel = [];
    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );

    var tableRef = document.getElementById('energy_storage_table').getElementsByTagName('tbody')[0];
    var rowCount = tableRef.rows.length;

    for (var pt = 0; pt < listPowertrains.length; pt++){

        // Choose the appropriate powertrains: only select BEVs and PHEVs.

        var fuel = "";
        var fuel_real_name="";

        if (listPowertrains[pt].innerText == i18n('electric')){
            fuel = i18n('fuel_electric');
            fuel_real_name = i18n('electric');
        };

        if (fuel_real_name != "" && !list_fuel.includes(fuel_real_name)){
            for (var s = 0; s < listSizes.length; s++){
                var size = listSizes[s].innerText;
                for (var y = 0; y < listYears.length; y++){
                var year = listYears[y].innerText;

                    var newRow = tableRef.insertRow();

                            if (y==0){
                                var row_content = '<td align="left" style="color:white;">'+ listPowertrains[pt].innerText +', '+ size +', '+ year +
                                '</td><td align="left" style="color:white"><div id="mass_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="energy_density_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="capacity_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="lifetime_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="type_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'" style="width:300px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="origin_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'" style="width:100px;margin-top:50px;margin-bottom:10px;"></div></td>'

                            }else{

                                var row_content = '<td align="left" style="color:white;">'+ listPowertrains[pt].innerText +', '+ size +', '+ year +
                                '</td><td align="left" style="color:white"><div id="mass_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="energy_density_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="capacity_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'
                                + '<td align="left" style="color:white"><div id="lifetime_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:50px;margin-bottom:10px;"></div></td>'


                            };

                    newRow.innerHTML = row_content;
                    row_content='';
                };
            };
            list_fuel.push(fuel_real_name);
            fuel_real_name = "";
        };
    }
    if (typeof newRow != "undefined") {

        // Append table to div
        tableRef.append(newRow);

        var divs = $("#energy_storage_table > tbody").find('div');

        for (var i=0; i<divs.length; i++){

            var div_type = divs[i].id.split("_")[0];

            if (div_type == "mass"){

                var slider = noUiSlider.create(divs[i], {
                        start: 150,
                        tooltips: true,
                        step:5,
                        connect: true,
                        range: {
                            'min': 50,
                            'max': 600
                        },
                        format: wNumb({
                            decimals: 0,
                            thousand: ',',
                            suffix: ' kg'
                        })
                    });

                slider.id = "_"+divs[i].id

                slider.on('update', function(values, handle){
                    var id = this.id.slice(6,);
                    var energy_density = $("[id='"+"energy_density_"+id+"']").text().split(" ")[0]
                    var capacity = $("[id='"+"capacity_"+id+"']")
                    var mass = parseInt(values[0].split(" ")[0]);
                    capacity.text(parseInt(mass * 0.6 * energy_density) + " kWh");
                 });

            };

            if (div_type == "energy"){

                var slider = noUiSlider.create(divs[i], {
                        start: 0.2,
                        tooltips: true,
                        connect: true,
                        range: {
                            'min': 0.01,
                            'max': .6
                        },
                        format: wNumb({
                            decimals: 2,
                            suffix: ' kWh/kg'
                        })
                    });

                slider.id = "_"+divs[i].id
                slider.on('update', function(values, handle){
                    var id = this.id.slice(16,);
                    var mass = $("[id='"+"mass_"+id+"']").text().split(" ")[0];
                    var capacity = $("[id='"+"capacity_"+id+"']")
                    var energy_density = parseFloat(values[0].split(" ")[0]);
                    capacity.text(parseInt(mass * 0.6 * energy_density)+ " kWh");

                 });

            };

            if (div_type == "lifetime"){

                var slider = noUiSlider.create(divs[i], {
                        start: 200000,
                        tooltips: true,
                        connect: true,
                        step: 10000,
                        range: {
                            'min': 100000,
                            'max': 500000
                        },
                        format: wNumb({
                            decimals: 0,
                            thousand: ',',
                            suffix: ' km'
                        })
                    });

                slider.id = "_"+divs[i].id

            };

            if (divs[i].id.split("_")[0] == "type"){

                divs[i].innerHTML = '<select style="color:grey">'
                                    + '<option value="NMC-622">Lithium nickel manganese cobalt oxide (NMC-622)</option>'
                                    + '<option value="NMC-111">Lithium nickel manganese cobalt oxide (NMC-111)</option>'
                                    + '<option value="NCA">Lithium nickel cobalt aluminum oxide (NCA)</option>'
                                    + '<option value="LFP">Lithium iron phosphate (LFP)</option></select>'

            }

            if (divs[i].id.split("_")[0] == "origin"){

                divs[i].innerHTML = '<select style="color:grey"><option value="CN">'+i18n("china")+'</option>'
                                    + '<option value="JP">'+i18n("japan")+'</option>'
                                    + '<option value="RER">'+i18n("europe")+'</option>'
                                    + '<option value="NO">'+i18n("norway")+'</option>'
                                    + '<option value="US">'+i18n("united_states")+'</option></select>'
            }
        }
    }

};

function create_efficiency_table() {
    var list_fuel = [];
    var listPowertrains = document.querySelectorAll( '#powertrain_list > li' );
    var listYears = document.querySelectorAll( '#years_list > li' );
    var listSizes = document.querySelectorAll( '#size_list > li' );

    var tableRef = document.getElementById('efficiency_table').getElementsByTagName('tbody')[0];
    var rowCount = tableRef.rows.length;

    for (var pt = 0; pt < listPowertrains.length; pt++){

        // Choose the appropriate powertrains
        var valid_pt = false;
        if (!["PHEV-d", "PHEV-p"].includes(i18n(listPowertrains[pt].innerText))){
            valid_pt = true;
        };

        if (valid_pt==true && !list_fuel.includes(i18n(listPowertrains[pt].innerText))){
            for (var s = 0; s < listSizes.length; s++){
                var size = listSizes[s].innerText;
                for (var y = 0; y < listYears.length; y++){

                    var year = listYears[y].innerText;
                    var newRow = tableRef.insertRow();

                    if (!["BEV", "FCEV"].includes(i18n(listPowertrains[pt].innerText))){

                        var row_content = '<td align="left" style="color:white;">'+ listPowertrains[pt].innerText +', '+ size +', '+ year +
                        '</td><td align="left" style="color:white"></td>'
                        + '<td align="left" style="color:white"><div id="engine_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'
                        + '<td align="left" style="color:white"><div id="drivetrain_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'
                        + '<td align="left" style="color:white"><div id="powertrain_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'

                    }else{

                        var row_content = '<td align="left" style="color:white;">'+ listPowertrains[pt].innerText +', '+ size +', '+ year +
                        '</td><td align="left" style="color:white"><div id="storage_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'
                        + '<td align="left" style="color:white"><div id="engine_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'
                        + '<td align="left" style="color:white"><div id="drivetrain_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'
                        + '<td align="left" style="color:white"><div id="powertrain_eff_'+i18n(listPowertrains[pt].innerText)+'_'+i18n(size)+'_'+year+'" style="width:200px;margin-top:45px;margin-bottom:10px;"></div></td>'
                    }

                newRow.innerHTML = row_content;
                row_content='';
                };
            };
            list_fuel.push(i18n(listPowertrains[pt].innerText));
        };
    }

    if (typeof newRow != "undefined") {

        // Append table to div
        tableRef.append(newRow);

        var divs = $(tableRef).find('div');

        for (var i=0; i<divs.length; i++){
            if (divs[i].id.split("_")[0]!="powertrain"){


                var slider = noUiSlider.create(divs[i], {
                        start: 0.9,
                        tooltips: true,
                        step:0.01,
                        connect: true,
                        range: {
                            'min': 0,
                            'max': 1
                        },
                        format: wNumb({
                            decimals: 2
                        })
                    });

                slider.id = "_"+divs[i].id

                slider.on('update', function(values, handle){
                    var id = this.id.split("_").slice(-3).join("_");

                    if ($("[id='"+"storage_eff_"+id+"']").length > 0){
                        var storage_eff = parseFloat($("[id='"+"storage_eff_"+id+"']").text())
                    }else{
                        var storage_eff = 1.0
                    };

                    var engine_eff = parseFloat($("[id='"+"engine_eff_"+id+"']").text())
                    var drivetrain_eff = parseFloat($("[id='"+"drivetrain_eff_"+id+"']").text())

                    var efficiency = storage_eff * engine_eff * drivetrain_eff;

                    var total_efficiency = $("[id='"+"powertrain_eff_"+id+"']")
                    total_efficiency.text(parseInt(efficiency*100) + " %");
                 });

            };


        };
    };
};

var holder = document.getElementById('holder');
holder.ondragover = function() {
    this.className = 'hover';
    return false;
};
holder.ondragend = function() {
    this.className = '';
    return false;
};

holder.ondrop = function(e) {
    this.className = '';
    e.preventDefault();

    var file = e.dataTransfer.files[0],
        reader = new FileReader();
    reader.onload = function(event) {
        var data = JSON.parse(reader.result);
        isConfig = true;
        start(data);

        // Electricity mix(es)
        var mix = data['background params']['custom electricity mix']
        for (var year = 0; year < data['year'].length; year++){
            var i = 0;
            var sum_mix = mix[year].reduce(function(a, b) { return a + b; }, 0);
            $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
                this.value = parseInt(Math.ceil(Number(mix[year][i] / sum_mix *100)))
                i++
            })
        }


    };

    reader.readAsText(file);
    return false;
};

function start(data){

    console.log(data)

    async function firstFunction(){
        fill_in_from_config_file(data)
        size_list_update()
        return;
    };

    async function secondFunction(){
        await firstFunction();
        // now wait for firstFunction to finish...
        // Update sliders
        update_fuel_sliders(data);
        update_electric_utility_sliders(data);
        update_energy_storage_table(data);
        update_efficiency_table(data);

        isConfig = false;
    };

    async function thirdFunction(){
        await secondFunction();

        // Electricity mix(es)
        var mix = data['background params']['custom electricity mix']
        for (var year = 0; year < data['year'].length; year++){
            var i = 0;
            var sum_mix = mix[year].reduce(function(a, b) { return a + b; }, 0);
            $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
                this.value = parseInt(Math.ceil(Number(mix[year][i] / sum_mix *100)))
                i++
            })
        }

    }
    thirdFunction();
}
