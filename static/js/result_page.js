

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

    $("#table_benchmark tbody tr").remove();

    var start = -1;
    var end = -1;
    var max_val = 0;

    var arr_data = [];

    for (var i = 0; i < data.length; i++){
        if (data[i][0] == cat){
            arr_data.push(data[i]);
        };
    };

    for (var i = 0; i < arr_data.length; i++){
        if (arr_data[i][4] > max_val){
            max_val = arr_data[i][4];
        }
    };

    arr_data.sort(function(x,y){return y[4] - x[4];});
    console.log(arr_data)

    for (i = 0; i < arr_data.length; i++) {
      var tr = document.createElement('tr');
      var td_name = document.createElement('td');
      td_name.setAttribute("width", "30%");
      td_name.innerHTML = "<h3 style='color:white;'>" + arr_data[i][2] + ", " + arr_data[i][3] + ", " + arr_data[i][1] + "</h3>"
      var td_bar = document.createElement('td');
      td_bar.setAttribute("width", "60%");
      var div_bar_wrap = document.createElement('div');
      div_bar_wrap.className = "progress-wrap progress";
      div_bar_wrap.setAttribute("data-progresspercent", ((arr_data[i][4] / max_val) * 100).toFixed(0));
      div_bar_wrap.setAttribute("data-height", "20px");
      div_bar_wrap.setAttribute("data-width", "100%");
      div_bar_wrap.setAttribute("data-speed", "1000");
      div_bar_wrap.setAttribute("data-color", "3a9c23");
      var div_bar = document.createElement('div');
      div_bar.className = "progress-bar progress";
      div_bar_wrap.appendChild(div_bar);
      td_bar.appendChild(div_bar_wrap);
      var td_km = document.createElement('td');
      td_km.setAttribute("width", "10%");
      td_km.innerHTML = "<h3 style='color:white;'><span class='count'>" + arr_data[i][4].toFixed(1) + "</span> km</h3>"
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
            duration: 500,
            easing: 'swing',
            step: function (now) {
                $(this).text(now.toFixed(1));
            }
        });
    });

};

function generate_line_chart_TtW_energy(data){
    var datum = [];
    var max_val = 0;
    for (var x=0; x < data.length; x++){
        var arr_data = [];
        for (var i = 0; i < data[x][1].length; i++){
            arr_data.push({"x":i, "y": Number(data[x][1][i]).toFixed(0)})

            if (Number(data[x][1][i]) > max_val){
                max_val = Number(data[x][1][i]);
            };
        }
        var name = data[x][0][1] + ", " + data[x][0][2] + ", " + data[x][0][0]
        datum.push({values:arr_data, key:name, area:false})
    };

    nv.addGraph(function() {
      var chart = nv.models.lineChart()
                    .margin({left:60, bottom:40, right:30})  //Adjust chart margins to give the x-axis some breathing room.
                    .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                    //.transitionDuration(350)  //how fast do you want the lines to transition?
                    .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                    .showYAxis(true)        //Show the y-axis
                    .showXAxis(true)        //Show the x-axis
                    .forceY([0, max_val * 1.1]);

      var dc_str = i18n("driving_cycle");
      chart.xAxis     //Chart x-axis settings
          .axisLabel(dc_str)
          .tickFormat(d3.format(',r'))
          ;
      chart.yAxis     //Chart y-axis settings
          .axisLabel('Kilojoule')
          .tickFormat(d3.format(',d'))
          .showMaxMin(false);

      d3.select('#chart-ttw-energy')    //Select the <svg> element you want to render the chart in.
          .datum(datum)         //Populate the <svg> element with chart data...
          .call(chart);          //Finally, render the chart!

      d3.selectAll('.nv-axis .tick line').attr('display','none')
      d3.select('#chart-ttw-energy').style('fill', "white");
      //Update the chart when window resizes.
      nv.utils.windowResize(function() { chart.update() });
      return chart;
    });
};

function generate_scatter_chart(data){
    var datum = [];
    for (var key in data) {
        // check if the property/key is defined in the object itself, not in parent
        if (data.hasOwnProperty(key)) {
            datum.push({values:[{"x": data[key][0], "y":data[key][1], "size":400, "shape":"circle"}], key:key})
        }
    }

    nv.addGraph(function() {
      var chart = nv.models.scatterChart()
                    .margin({left:60, bottom:40, right:30})  //Adjust chart margins to give the x-axis some breathing room.
                    .showYAxis(true)        //Show the y-axis
                    .showXAxis(true)        //Show the x-axis
                    .showDistX(true)    //showDist, when true, will display those little distribution lines on the axis.
                    .showDistY(true)
                    .color(d3.scale.category10().range())
                    .pointRange([70,70])
                    .forceY([0])
                    .forceX([0]);

      chart.tooltip.contentGenerator(function (d) {
          var html = "<h2 style='margin:15px;'>"+d.series[0].key+"</h2> <ul>";
          html += "<ul><li style='margin-left:30px;'>"+ d.value.toFixed(2) +" €/km</li><li style='margin-left:30px;'>" + d.series[0].value.toFixed(2) + " kg CO2-eq/km</li></ul>"
          return html;
        })
      var gwp_str = i18n("cc_per_km");
      chart.yAxis     //Chart y-axis settings
          .axisLabel(gwp_str)
          .tickFormat(d3.format('.02f'))
          .ticks(10);

      var cost_str = i18n("cost");
      chart.xAxis     //Chart x-axis settings
          .axisLabel(cost_str)
          .tickFormat(d3.format('.02f'))
          .ticks(10);

      d3.select('#chart-scatter')    //Select the <svg> element you want to render the chart in.
          .datum(datum)         //Populate the <svg> element with chart data...
          .call(chart);       //Finally, render the chart!


      d3.select('#chart-scatter').style('fill', "white");
      //Update the chart when window resizes.
      nv.utils.windowResize(function() { chart.update() });
      return chart;

    });
};

function generate_chart_accumulated_impacts(data, name_impact, impact){

    var datum = [];
    for (var x=0; x < data.length; x++){
        if (data[x][0] == name_impact){
            var arr_data = [];
            for (var i = 0; i < 100; i++){
                arr_data.push({"x":i * data[x][7] / 100, "y": data[x][5] + (data[x][6] * (i * data[x][7] / 100))})
            }
            var name = data[x][2] + ", " + data[x][3] + ", " + data[x][1]
            datum.push({values:arr_data, key:name})
        };

    };

    nv.addGraph(function() {
     var chart_acc = nv.models.lineChart()
                    .margin({left:60, bottom:40, right:30})  //Adjust chart margins to give the x-axis some breathing room.
                    .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                    .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                    .showYAxis(true)        //Show the y-axis
                    .forceY([0])
                    .showXAxis(true);        //Show the x-axis

      chart_acc.xAxis     //Chart x-axis settings
          .axisLabel('Use (km)')
          .tickFormat(d3.format('.r'))
          ;

      if (impact == "ozone depletion" ){
          chart_acc.yAxis     //Chart y-axis settings
          .axisLabel(name_impact)
          .tickFormat(d3.format('.0e'))
          .showMaxMin(false);
      }

      else{

            if (impact == "human noise"){
              chart_acc.yAxis     //Chart y-axis settings
              .axisLabel(name_impact)
              .tickFormat(d3.format('s'))
              .showMaxMin(false);

            }else{
              chart_acc.yAxis     //Chart y-axis settings
              .axisLabel(name_impact)
              .tickFormat(d3.format(',d'))
              .showMaxMin(false);

            };
      };


      d3.select('#chart-accumulated')    //Select the <svg> element you want to render the chart in.
          .datum(datum)         //Populate the <svg> element with chart data...
          .call(chart_acc);          //Finally, render the chart!

      d3.selectAll('.nv-axis .tick line').attr('display','none')
      d3.select('#chart-accumulated').style('fill', "white");
      //Update the chart when window resizes.
      nv.utils.windowResize(function() { chart_acc.update() });
      return chart_acc;
    });

};






