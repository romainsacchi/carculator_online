

 function generate_chart_impacts(data, title, default_cat){
    $("#chart_impacts").pivotUI(
      data, {
        rows: ["impact category", "category"],
        cols: ["year", "powertrain", "size"],
        vals: ["value"],
        inclusions: {"impact category":[default_cat]},
        "colOrder": "value_a_to_z",
        aggregatorName: "Sum",
        rendererName: "Stacked Bar Chart",
        renderers: $.extend(
            $.pivotUtilities.renderers,
            $.pivotUtilities.export_renderers,
          $.pivotUtilities.plotly_renderers
        ),
        rendererOptions: {plotly: {title: {text: title}}},
        onRefresh: function(config){
            imp = config["inclusions"]["impact category"][0]
            }
      });
 };

 function generate_chart_costs(data, title){
    $("#chart_costs").pivotUI(
      data, {
        rows: ["cost category"],
        cols: ["year", "powertrain", "size"],
        vals: ["value"],
        exclusions: {"cost category":["total"]},
        "colOrder": "value_a_to_z",
        aggregatorName: "Sum",
        rendererName: "Stacked Bar Chart",
        renderers: $.extend(
            $.pivotUtilities.renderers,
            $.pivotUtilities.export_renderers,
          $.pivotUtilities.plotly_renderers
        ),
        rendererOptions: {plotly: { title: {text: title}}},
      });
 };

 function generate_progress_bars(filter){
        if (filter == "climate change"){

        };
        if (filter == "cost"){

        };
        if (filter == "fossil depletion"){

        };
 };

 function share_results(){
 	var str = i18n('save_results')
    $.notify(
        {
            icon: "glyphicon glyphicon-warning-sign",
            message: str
        },
        {
            placement: {
                from: "top",
                align: "center"
            },
            type:"success"
        },
        {
            animate: {
                enter: "animated bounceInDown",
                exit: "animated bounceOutUp"
            },
        }
    );
 };

 function export_bw2_inventories(){
 	var str = i18n('inventory_download')
    $.notify({
        icon: "glyphicon glyphicon-warning-sign",
        message: str
    },
    {
        placement: {
            from: "top",
            align: "center"
        },
        type:"success"
    },
    {
        animate: {
            enter: "animated bounceInDown",
            exit: "animated bounceOutUp"
        },
    }
    );
 };

 function export_simapro_inventories(){
 	var str = i18n('inventory_download')
    $.notify({
        icon: "glyphicon glyphicon-warning-sign",
        message: str
    },
    {
        placement: {
            from: "top",
            align: "center"
        },
        type:"success"
    },
    {
        animate: {
            enter: "animated bounceInDown",
            exit: "animated bounceOutUp"
        },
    }
    );
 };

function generate_benchmark(data, cat){

    var length = data.length / 3;

    if (cat == "cost"){
        var start = 0;
    };
    if (cat == "climate change"){
        var start = length;
    };

    if (cat == "Fossil depletion"){
        var start = (length * 2);
    };

    var i;
    var max_val = 0;

    for (i = start; i < (start + length); i++) {

        if (data[i][4] > max_val){
            max_val = data[i][4];
        }

    };

    console.log(start);
    console.log(max_val);
    console.log(length);

    for (i = start; i < (start + length); i++) {
        console.log(data[i]);
        console.log(max_val);
        console.log((data[i][4] / max_val).toFixed(0));
      var tr = document.createElement('tr');
      var td_name = document.createElement('td');
      td_name.innerHTML = "<h3 style='color:white;'>" + data[i][2] + ", " + data[i][3] + "</h3>"
      var td_bar = document.createElement('td');
      var div_bar_wrap = document.createElement('div');
      div_bar_wrap.className = "progress-wrap progress";
      div_bar_wrap.setAttribute("data-progresspercent", ((data[i][4] / max_val) * 100).toFixed(0));
      div_bar_wrap.setAttribute("data-height", "20px");
      div_bar_wrap.setAttribute("data-width", "1500px");
      div_bar_wrap.setAttribute("data-speed", "4000");
      div_bar_wrap.setAttribute("data-color", "3a9c23");
      var div_bar = document.createElement('div');
      div_bar.className = "progress-bar progress";
      div_bar_wrap.appendChild(div_bar);
      td_bar.appendChild(div_bar_wrap);
      var td_km = document.createElement('td');
      td_km.innerHTML = "<h3 style='color:white;'><span class='count'>" + data[i][4].toFixed(1) + "</span> km</h3>"
      tr.appendChild(td_name);
      tr.appendChild(td_bar);
      tr.appendChild(td_km);
      $("#table_benchmark tbody").append(tr);
    }

    var progressSelector = $(".progress-wrap");
     progressSelector.each(function(){
     var getPercent = $(this).attr("data-progresspercent");
     var getSpeed = parseInt($(this).attr("data-speed"));
     var getColor = $(this).attr("data-color");
     var getHeight = $(this).attr("data-height");
     var getWidth = $(this).attr("data-width");
     $(this).css({"height":getHeight,"width":getWidth});
     $(this).find(".progress-bar").css({"background-color":"#"+getColor}).animate({ width:getPercent+'%' },getSpeed)
     });

    $('.count').each(function () {
        $(this).prop('Counter',0).animate({
            Counter: $(this).text()
        }, {
            duration: 4000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

};





