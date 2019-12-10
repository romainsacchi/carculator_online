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
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "Sorry, this category of vehicle is not available yet."
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
       $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "A time horizon must be selected first."
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
    else{
        if (listItems.length>0 & listSizes.length>0){
            $("#manufacture_section").attr('style', 'display:block;margin:30px;');
            $("#use_section").attr('style', 'text-align:center;padding-top:50px;display:block;margin-top:0px;');
            $("#fuel_section").attr('style', 'text-align:center;padding-top:50px;display:block;margin-top:0px;');
            $("#calculation_section").attr('style', 'text-align:center;padding-top:0px;padding-bottom:50px;display:block;');
            generate_driving_cycle_graph('WLTC');}
        else{return;};
    };

    // Update the electricity mix table
    var table_mix = $('#electricity_mix_table')
    var number_col = document.getElementById('electricity_mix_table').rows[0].cells.length -1

    // Remove previous columns
    for (var item = 0; item < number_col; item++){
        $("#electricity_mix_table th:last-child, #electricity_mix_table td:last-child").remove();
    }

    var list_years = [];
    for (var item = 0; item < listYears.length; item++){
        list_years.push(listYears[item].innerHTML);
            $.each($('#electricity_mix_table tr'), function(i, row) {
                if (i==0){
                    let cell = document.createElement(i ? "td" : "th")
                    cell.innerHTML = listYears[item].innerHTML
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
    var row_content = '<th><h3 style="color:white;">Name</h3></th><th><h3 style="color:white;">Powertrain</h3></th>';
    row_content += '<th><h3 style="color:white;">Size</h3></th><th><h3 style="color:white;">Unit</h3></th>';
     for (var item = 0; item < listYears.length; item++){
        row_content += '<th><h3 style="color:white;">'+listYears[item].innerHTML+'</h3></th>'
        };
    tr.innerHTML = row_content;
    thead.appendChild(tr);
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
    $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "Currently, only one country can be selected.."
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
  if (selected.length>0){get_electricity_mix(selected)};

  return selected;
}

function get_electricity_mix(ISO){
    var listYears = document.querySelectorAll( '#years_list > li' );
    var list_year = [];
    for (var item = 0; item < listYears.length; item++){
        list_year.push(listYears[item].innerHTML);
    };

    var opts = {
      method: 'GET',
      headers: {}
    };

    // Fix

    $.when($.ajax({
                url: "/get_electricity_mix/"+ISO+"/"+list_year,
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
            $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
                this.value = parseInt(Math.ceil(Number(mix[year][i]*100)))
                i++
            })
        }

        $.notify({
        icon: '	glyphicon glyphicon-time',
        message: "You have set all the required parameters. Whenever ready, hit the 'Calculate' button."
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

function collect_configuration(){
    // If vehicle type selected
    if (!$('#vehicle_type input:radio:checked').length > 0) {
        $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "It seems that the type of vehicle to analyze is missing."
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
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the year for which to conduct the analysis is missing."
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
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the powertrain type for which to conduct the analysis is missing."
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
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the size class for which to conduct the analysis is missing."
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
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the country for which to conduct the analysis is missing."
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
    var mix_val = []
    for (var year = 0; year < list_year.length; year++){
        var i = 0;
        var sum_mix = 0;
        var is_missing = false;
        $("#electricity_mix_table td:nth-child("+String(year+2)+") :input").each(function () {
            sum_mix += Number(this.value)/100
        })
        if (sum_mix <.99 | sum_mix > 1.01){
            $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: "It seems that the electricity mix for "+String(list_year[year])+" is not equal to 100%."
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

    // Retrieve all necessary data and gather it into a dictionary
    // Initiate dictionary
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
        list_type.push(listItems[item].innerHTML);
    };
    params['type'] = list_type;

    var list_size = [];
    for (var item = 0; item < listSizes.length; item++){
        list_size.push(listSizes[item].innerHTML);
    };
    params['size'] = list_size;


    // Retrieve car parameters
    dic_inputs = {};

        $("#table_inputs tbody tr").each(function () {
            var name = this.childNodes[0].innerHTML
            var pt = this.childNodes[1].innerHTML
            var size = this.childNodes[2].innerHTML

            vals=[]
            $(this).find(':input').each(function(){
                vals.push(this.value)
            })
            foreground_params[String([name, pt, size])] = vals;
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
    $.each($('#table_use div'), function() {
        if (this.className == "noUi-target noUi-ltr noUi-horizontal"){
            foreground_params[this.id] = this.noUiSlider.get();
        };
    });

    // Retrieve fuel pathway
    $.each($('#fuel_pathway_table input:checked'), function() {
                background_params[this.name] = this.value;
            });

    params['foreground params'] = foreground_params;
    params['background params'] = background_params;
    return params;

}

function get_results(){
    var data = collect_configuration();
    if (data == null){
        return;
    };

    $.notify({
        icon: '	glyphicon glyphicon-time',
        message: "Your job has been queued. Results will be displayed in a new tab whenever ready. This may take up to one minute. Do not close this tab."
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
        const interval = setInterval(function() {
            $.ajax('/check_status/'+job_id).then(function (status) {
                return status;
                }).then(function (status) {
                    if (status['job status'] == 'finished'){
                        var redirectWindow = window.open('/display_result/'+job_id, '_blank');
                        redirectWindow.location;
                        clearInterval(interval);
                        return;
                    }
                    if (status['job status'] == 'job not found'){
                        $.notify({
                            icon: '	glyphicon glyphicon-warning',
                            message: "It seems your job has been lost. We suggest you start teh calculation again."
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
                    }

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
                    tr.innerHTML += '<td> <button class="online-button" id='+row+' onClick="add_param(this.id)" style="margin:5px;background-color:transparent;color:white;border:1px solid white;width:150px;">Add</button> </td>'
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
            l_pt.push(pt);
        }
    }

     for (j=0;j<listSizes.length;j++){
        var s = listSizes[j].innerHTML;

        if (sizes.indexOf(s) >=0 ){
            l_s.push(s);
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

                for (pt=0;pt<arr_request[1].length;pt++){
                    for (s=0;s<arr_request[2].length;s++){
                    var newRow = tableRef.insertRow();
                    var row_content = '<td align="left" style="color:white">'+arr_request[0]+'</td><td align="left" style="color:white">'+arr_request[1][pt]+'</td>'
                    row_content += '<td align="left" style="color:white">'+arr_request[2][s]+'</td><td align="left" style="color:white">'+arr_request[3]+'</td>'
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
										to move it over 1 km.`;
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/battery_mass_tutorial.gif");
    };
    if (type == "capacity_battery"){
        $("#tutorial_title").html("Change the capacity of the battery on a electric vehicle");
        var str = `<p>The model considers an initial battery mass from which the mass of the battery cells is derived. Then, once the mass of the battery cells is known,
        an energy density factor per kg of battery cell is applied. Therefore, to change the capacity of the battery, one can either change the mass
        of the battery for a same energy density factor, or leave the mass unchanged but adjust the energy density factor of the cells.</p>

        <p>To change the energy density factor of the cells, one can simply modify the value of the <b>battery cell energy density</b> parameter,
        which represents the energy available per kg of battery cell. To know the capacity of the battery, one may consider the following relation:
        <br>
        battery cell mass share * energy battery mass = mass of battery cells
        <br>
        mass of battery cell * battery cell energy density = energy stored in the battery</p>`;
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/battery_cell_tutorial.gif");
    };
    if (type == "engine_eff"){
        $("#tutorial_title").html("Change the engine efficiency of a vehicle");
        var str = "The efficiency of the engine of any vehicle can simply be adjusted by modifying the <b>engine efficiency</b> parameter.";
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/engine_eff_tutorial.gif");
    };
    if (type == "passenger_mass"){
        $("#tutorial_title").html("Change the average mass of a passenger");
        var str = "The average mass of a passenger can simply be adjusted by modifying the <b>average passenger mass</b> parameter.";
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/passenger_mass_tutorial.gif");
    };
    if (type == "hybrid_level"){
        $("#tutorial_title").html("Change the power contribution of the combustion engine");
        var str = `By default, future vehicles are assumed to have a certain level of hybridization, where a share of the power originate an electric engine.
                    To change the contribution of the combustion engine, one can simply adjust the <b>combustion power share</b> parameter.
                    Setting such parameter to 1 indicates that all the power originate the combustion engine. Setting it to 0.5 indicates that
                    half of the vehicle power is provided by an electric engine`;
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/hybrid_tutorial.gif");
    };
    if (type == "battery_lifetime"){
        $("#tutorial_title").html("Change the expected lifetime of the battery");
        var str = `The lifetime of the battery is currently expressed as a number of kilometers the battery can provided energy for.
                    This number can be adjusted by modifying the value of the <b>battery lifetime kilometers</b> parameter.
                    If this number is lower than the technical lifetime of the vehicle, a fraction of a replacement battery will be considered to
                    complete the use phase of the vehicle.`;
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/battery_lifetime_tutorial.gif");
    };
    if (type == "fc_eff"){
        $("#tutorial_title").html("Change the efficiency of a fuel cell stack");
        var str = `The efficiency of the fuel cell stack of a hydrogen-powered vehicle can simply be adjusted
        by modifying the <b>fuel cell stack efficiency</b> parameter.`;
        $("#tutorial_text").html(str);
        $("#tutorial_video").attr("src","static/images/fc_cell_tutorial.gif");
    };

}
