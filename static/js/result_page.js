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

function export_results()
{
    var data_to_parse = data[1];
    for (d=0;d<data_to_parse.length;d++){
        var impact_cat = data_to_parse[d][0];
        for (sub=0;sub<data_to_parse[d].length;sub++){
            data_to_parse[d][sub] = i18n(data_to_parse[d][sub]);

        };
        data_to_parse[d].splice(6,1)
        data_to_parse[d].push(i18n('unit_'+impact_cat))
    };

    data_to_parse.unshift([i18n('impact_category'), i18n('size'), i18n('powertrain'), i18n('year'), i18n('impact_source'), i18n('value'), i18n('unit')]);

    data_to_parse.unshift([]);
    for (d=0;d<data[6].length;d++){
        for (sub=0;sub<data[6][d].length;sub++){
            data[6][d][sub] = i18n(data[6][d][sub]);
        };
        data_to_parse.unshift(data[6][d])
    };

    data_to_parse.unshift(['', '', '','(km)','(km)', '(unit)', '(kg)','','',
    '(Hydro, Nuclear, Gas, Solar, Wind, Biomass, Coal, Oil, Geothermal, Waste)','(kj/km)','(kg)','(kW)', '(kW)', '(km)',
     '(0-1)', '(0-1)', '(0-1)', '(0-1)', '(kg)', '(kWh/kg)', '(kWh)', '(km)', '', '',
     '', '(0-1)', '', '(0-1)']);
    data_to_parse.unshift(['Powertrain', 'Size', 'Year','Lifetime','Km per year', 'Number of passengers', 'Cargo mass','Driving cycle','Country', 'Electricity mix',
     'TtW energy','Driving mass','Combustion engine power','Electric engine power','Range','Engine eff.', 'Drivetrain eff.', 'Tank-to-wheel eff.',
     'Energy storage eff.','Battery mass', 'Cell energy density', 'Battery cap.', 'Battery lifetime', 'Battery chemistry', 'Battery origin',
     'Primary fuel', 'Primary fuel share', 'Secondary fuel', 'Secondary fuel share']);

    data_to_parse.unshift([]);
    data_to_parse.unshift(['carculator online 1.1.4', 'carculator 1.3.0', 'https://carculator.psi.ch']);

    var csv = Papa.unparse(data_to_parse);
    var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    var csvURL =  null;
    if (navigator.msSaveBlob)
    {
        csvURL = navigator.msSaveBlob(csvData, 'carculator_results_export.csv');
    }
    else
    {
        csvURL = window.URL.createObjectURL(csvData);
    }

    var tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', 'carculator_results_export.csv');
    tempLink.click();
}

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

function find_currency(country){

    // A dictionary to map ISO country code to currency code
    dict_country_currency = {
        "AT":"EUR",
        "AU":"AUD",
        "BE":"EUR",
        "BG":"BGN",
        "BR":"BRL",
        "CA":"CAD",
        "CH":"CHF",
        "CL":"CLP",
        "CN":"CNY",
        "CY":"CYP",
        "CZ":"CZK",
        "DE":"EUR",
        "DK":"DKK",
        "EE":"EEK",
        "ES":"EUR",
        "FI":"EUR",
        "FR":"EUR",
        "GB":"GBP",
        "GR":"EUR",
        "HR":"HRK",
        "HU":"HUF",
        "IE":"EUR",
        "IN":"INR",
        "IT":"EUR",
        "IS":"ISK",
        "JP":"JPY",
        "LT":"LTL",
        "LU":"EUR",
        "LV":"LVL",
        "MT":"MTL",
        "PL":"PLN",
        "PT":"EUR",
        "RO":"ROL",
        "RU":"RUR",
        "SE":"SEK",
        "SI":"SIT",
        "SK":"SKK",
        "US":"USD",
        "ZA":"ZAR",
        "AO":"AOA",
        "BF":"XOF",
        "BI":"BIF",
        "BJ":"XOF",
        "BW":"BWP",
        "CD":"CDF",
        "CF":"XAF",
        "CG":"XAF",
        "CI":"XOF",
        "CM":"XAF",
        "DJ":"DJF",
        "DZ":"DZD",
        "EG":"EGP",
        "ER":"ERN",
        "ET":"ETB",
        "GA":"XAF",
        "GH":"GHC",
        "GM":"GMD",
        "GN":"GNF",
        "GQ":"XAF",
        "GW":"GWP",
        "KE":"KES",
        "LR":"LRD",
        "LS":"ZAR",
        "LY":"LYD",
        "MA":"MAD",
        "ML":"XOF",
        "MR":"MRO",
        "MW":"MWK",
        "MZ":"MZM",
        "NE":"XOF",
        "NG":"NGN",
        "NL":"EUR",
        "NM":"NAD",
        "RW":"RWF",
        "SD":"SDD",
        "SL":"SLL",
        "SN":"XOF",
        "SO":"SOS",
        "SS":"SDD",
        "SZ":"SZL",
        "TD":"XAF",
        "TG":"XOF",
        "TN":"TND",
        "TZ":"TZS",
        "UG":"UGX",
        "ZM":"ZMK",
        "ZW":"ZWD",
        "NO":"NOK",
    };

    var dict_currency_rates = {
        "EUR":"1",
        "AUD":"1.63",
        "BGN":"1.96",
        "BRL":"6.31",
        "CAD":"1.57",
        "CHF":"1.08",
        "CNY":"8.1",
        "CZK":"26.7",
        "DKK":"7.44",
        "RON":"4.86",
        "RUR":"89.5",
        "SEK":"10.4",
        "XOF":"120",
        "XAF":"120",
        "SDD":"65.7",
        "TND":"3.26",
        "ZMK":"23.7",
        "NOK":"10.7",
        "AMD":"577",
        "AZN":"2.02",
        "BYN":"3.125",
        "BAM":"1.96",
        "HRK":"7.54",
        "GEL":"3.7",
        "HUF":"357",
        "ISK":"160",
        "MDL":"19.6",
        "MKD":"61",
        "PLN":"4.45",
        "RSD":"118",
        "TRY":"8.9",
        "UAH":"33",
        "GBP":"0.92",
        "USD":"0.84",
    };

    var currency = dict_country_currency[country]

    // We check first that the currency demanded is not part of a
    // list of common currencies
    if (currency in dict_currency_rates){

        var exchange_rate = dict_currency_rates[currency];

    // If not, then we fetch it from fixer.io
    }else{

        var API_key = "5c3df599b709a168d11c488eb81beb05";

        var exchange_rate = 0.0;
        $.get("http://data.fixer.io/api/latest?access_key="+API_key+"&symbols="+currency, function (response) {

                            if(
                                String(JSON.stringify(response["success"])) == "true"
                            ){
                                exchange_rate = String(JSON.stringify(response["rates"][currency]))
                                exchange_rate = Number(exchange_rate);
                            }else{
                                exchange_rate = 1.0
                            };
                        }, "jsonp");

    };

    return [exchange_rate, currency]
};

// Fetch the currency name and exchange rate
var currency_info = find_currency(data[7]);
var currency_exch_rate = Number(currency_info[0]);
var currency_name = currency_info[1];


// Update label in benchmark dropdown list
document.getElementById('select_benchmark')[1].innerHTML = currency_name;

function generate_benchmark(data, cat){

    $("#table_benchmark tbody tr").remove();

    var start = -1;
    var end = -1;
    var max_val = 0;

    var arr_data = [];

    for (var i = 0; i < data.length; i++){
        if (data[i][0] == cat){
            // if the category is "cost",
            // we need to convert the currency first
            if (cat == "cost"){
                var val = Number(data[i][4]) / currency_exch_rate;
                data[i][4] = val;
                arr_data.push(data[i]);
            }else{
                arr_data.push(data[i]);
            };
        };
    };

    for (var i = 0; i < arr_data.length; i++){
        if (arr_data[i][4] > max_val){
            max_val = arr_data[i][4];
        }
    };

    arr_data.sort(function(x,y){return y[4] - x[4];});

    for (i = 0; i < arr_data.length; i++) {
      var tr = document.createElement('tr');
      var td_name = document.createElement('td');
      td_name.setAttribute("width", "30%");
      td_name.innerHTML = "<h3 style='color:white;'>" + i18n(arr_data[i][2]) + " - " + i18n(arr_data[i][1]) + ", " + arr_data[i][3] + "</h3>"
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
      td_km.innerHTML = "<h3 style='color:white;'><span class='count'>" + Number(arr_data[i][4]).toFixed(1) + "</span> km</h3>"
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


    var max_y_val = 0
    var max_x_val = 0

    for (var v=0; v<data.length; v++){
        var pt = data[v]["key"].split(" - ")[0];
        var s = data[v]["key"].split(" - ")[1];
        var y = data[v]["key"].split(" - ")[2];
        data[v]["key"] = i18n(pt) + " - " + i18n(s) + " - " + y
        if (parseFloat(data[v]["values"].slice(-1)[0]["y"]) > max_y_val){ max_y_val = Math.round(parseFloat(data[v]["values"].slice(-1)[0]["y"]))}
        if (parseFloat(data[v]["values"].slice(-1)[0]["x"]) > max_x_val){ max_x_val = Math.round(parseFloat(data[v]["values"].slice(-1)[0]["x"]))}
    };


    nv.addGraph(function() {
      var chart = nv.models.lineChart()
                    .margin({left:60, bottom:40, right:30})  //Adjust chart margins to give the x-axis some breathing room.
                    .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                    //.transitionDuration(350)  //how fast do you want the lines to transition?
                    .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                    .showYAxis(true)        //Show the y-axis
                    .showXAxis(true)        //Show the x-axis
                    .forceY([0, max_y_val * 1.1])
                    .forceX([0, max_x_val]);

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
          .datum(data)         //Populate the <svg> element with chart data...
          .call(chart);          //Finally, render the chart!

      //d3.selectAll('.nv-axis .tick line').attr('display','none')
      d3.select('#chart-ttw-energy').style('fill', "white");
      //Update the chart when window resizes.
      nv.utils.windowResize(function() { chart.update() });
      return chart;
    });
};

function generate_scatter_chart(data, qty, unit){

    var datum = [];
    for (var key in data) {
        // check if the property/key is defined in the object itself, not in parent
        if (data.hasOwnProperty(key)) {
            var arr_names = key.split(", ");
            var pt = i18n(arr_names[0]);
            var y = arr_names[1];
            var size = i18n(arr_names[2]);
            // we convert the cost in the user's currency
            datum.push({values:[{"x": data[key][0]*currency_exch_rate,
                                 "y":data[key][1], "size":400, "shape":"circle"}],
                                 key:pt+" - " + size + " - " + y})
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
          html += "<ul><li style='margin-left:30px;'>"+ d.value.toFixed(2) +" " + currency_name+"/"+ qty + " - " +  unit +"</li><li style='margin-left:30px;'>" + d.series[0].value.toFixed(2) + " kg CO<sub>2</sub>-eq/"+ qty + " - " +  unit+"</li></ul>"
          return html;
        })
      var gwp_str = i18n("cc_per_km");
      chart.yAxis     //Chart y-axis settings
          .axisLabel(gwp_str)
          .tickFormat(d3.format('.02f'))
          .ticks(10);

      var cost_str = currency_name + "/" + qty + " - " + unit;
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

function generate_chart_accumulated_impacts(data, impact){

    var datum = [];
    for (var x=0; x < data.length; x++){
        if (data[x][0] == impact){
            var arr_data = [];
            for (var i = 0; i < 101; i++){
                arr_data.push({"x":i * data[x][7] / 100, "y": data[x][5] + (data[x][6] * (i * data[x][7] / 100))})
            }
            var name = i18n(data[x][2]) + " - " + i18n(data[x][1]) + " - " + data[x][3]
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
          .axisLabel(i18n('use'))
          .tickFormat(d3.format(',d'))
          ;

      if (impact == "ozone depletion" ){
          chart_acc.yAxis     //Chart y-axis settings
          .axisLabel(i18n("unit_"+impact))
          .tickFormat(d3.format('.0e'))
          .showMaxMin(false);
      }

      else{

            if (impact == "human noise"){
              chart_acc.yAxis     //Chart y-axis settings
              .axisLabel(i18n("unit_"+impact))
              .tickFormat(d3.format('s'))
              .showMaxMin(false);

            }else{
              chart_acc.yAxis     //Chart y-axis settings
              .axisLabel(i18n("unit_"+impact))
              .tickFormat(d3.format(',d'))
              .showMaxMin(false);

            };
      };


      d3.select('#chart-accumulated')    //Select the <svg> element you want to render the chart in.
          .datum(datum)         //Populate the <svg> element with chart data...
          .call(chart_acc);          //Finally, render the chart!

      //d3.selectAll('.nv-axis .tick line').attr('display','none')
      d3.select('#chart-accumulated').style('fill', "gray");
      d3.selectAll('.nvd3 g.nv-groups g path.nv-line').attr('stroke-width','5px')
      //Update the chart when window resizes.
      nv.utils.windowResize(function() { chart_acc.update() });
      return chart_acc;
    });

};

 // Update impact categories chart when selection is changed.
 $("#table_impact_cat").on("click", "li", function () {
    var impact_cat = $(this).text();
    var impact_name = $(this)[0].children[0].id;
    rearrange_data_for_LCA_chart(impact_cat)
    console.log(impact_name);
    update_impact_definition_table(impact_name)
});

function update_impact_definition_table(impact_name){

    // remove existing rows
    var tableRef = document.getElementById('impact_description').getElementsByTagName('tbody')[0];
    var rowCount = tableRef.rows.length;
    while (rowCount>0){
        tableRef.deleteRow(0);
        var rowCount = tableRef.rows.length;
        }

    console.log(impact_name)

    var d_reliability = {
        "agricultural land occupation": "moderate",
        "climate change":"good",
        "fossil depletion": "good",
        "freshwater ecotoxicity": "poor",
        "freshwater eutrophication": "moderate",
        "human toxicity": "poor",
        "ionising radiation": "poor",
        "marine ecotoxicity": "poor",
        "marine eutrophication": "poor",
        "metal depletion": "poor",
        "natural land transformation": "moderate",
        "ozone depletion": "good",
        "particulate matter formation": "moderate",
        "photochemical oxidant formation": "good",
        "terrestrial acidification": "moderate",
        "terrestrial ecotoxicity": "moderate",
        "urban land occupation": "good",
        "water depletion": "moderate",
        "noise emissions": "moderate",
        "renewable primary energy": "moderate",
        "non-renewable primary energy": "moderate",
        "ownership cost": "moderate",
    }

    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('name') + '</td><td>' + i18n(impact_name) + '</td></tr>'
    // Append table to div
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('unit') + '</td><td>' + i18n('unit_'+impact_name) + '</td></tr>'
    // Append table to div
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('description_impact') + '</td><td>' + i18n('description_' + impact_name) + '</td></tr>'
    // Append table to div
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('reliability_impact')
    if (d_reliability[impact_name] == "good"){
         newRow.innerHTML += '</td><td style="color:green;"><b>' + i18n(d_reliability[impact_name]) + '</b></td></tr>'
    }
    if (d_reliability[impact_name] == "moderate"){
         newRow.innerHTML += '</td><td style="color:orange;"><b>' + i18n(d_reliability[impact_name]) + '</b></td></tr>'
    }
    if (d_reliability[impact_name] == "poor"){
         newRow.innerHTML += '</td><td style="color:red;"><b>' + i18n(d_reliability[impact_name]) + '</b></td></tr>'
    }

    // Append table to div
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('issue_impact') + '</td><td>' + i18n('issue_'+impact_name) + '</td></tr>'
    // Append table to div
    tableRef.append(newRow);
}

function rearrange_data_for_LCA_chart(impact_cat){

    val = [];
    var real_impact_name = "";

    for (a = 0; a < data[1].length; a++){
        if (i18n(data[1][a][0]) == impact_cat){
            real_impact_name = data[1][a][0];

            // if impact_cat is cost, we need to convert
            // to the user's currency
            if (real_impact_name=="ownership cost"){
                var data_to_insert = data[1][a].slice();
                var cost_val_total = data_to_insert[6] * currency_exch_rate
                var cost_val = data_to_insert[5] * currency_exch_rate
                data_to_insert[6] = cost_val_total;
                data_to_insert[5] = cost_val;
                val.push(data_to_insert);
            }else{
                val.push(data[1][a]);
            };

        }
    };

    val.sort(function(x,y){return y[6] - x[6];});

    list_cat = [];

    for (a = 0; a < val.length; a++){
        if (!list_cat.includes(val[a][4])){
            list_cat.push(val[a][4])
        };
    };

    var data_to_plot = [];

    for (a = 0; a < list_cat.length; a++){
        var impact_dict={};
        impact_dict['key'] = i18n(list_cat[a]);
        impact_dict['values'] = [];

        for (b=0; b < val.length; b++){
            if (val[b][4] == list_cat[a]){
                impact_dict['values'].push({
                    'x': i18n(val[b][2])+" - "+i18n(val[b][1])+" - "+val[b][3],
                    'y': val[b][5]
                })
            }
        }

        data_to_plot.push(impact_dict)
    };


    nv.addGraph(function() {
            var chart = nv.models.multiBarChart()
                    .margin({left:100, bottom:180})  //Adjust chart margins to give the x-axis some breathing room.
                    .stacked(true);
            chart.xAxis.rotateLabels(-30);


            var unit_name = "unit_"+real_impact_name;

            chart.yAxis     //Chart y-axis settings
              .axisLabel(i18n(unit_name)+"/"+data[8]+" - "+ data[9])
              .tickFormat(d3.format('.03f'))
              .showMaxMin(false);

            if (["ozone depletion", "freshwater eutrophication", "marine eutrophication", "natural land transformation",
                    "particulate matter formation", "photochemical oxidant formation", "terrestrial acidification",
                    "terrestrial ecotoxicity"].includes(real_impact_name)){
                  chart.yAxis
                  .tickFormat(d3.format('.02e'))
                  .showMaxMin(false);
              }
            if (real_impact_name == "human noise"){
              chart.yAxis
              .tickFormat(d3.format('s'))
              .showMaxMin(false);
            };

            if (real_impact_name == "ownership cost"){
              chart.yAxis
              .axisLabel(currency_name+"/"+data[8]+" - "+ data[9])
              .tickFormat(d3.format('.02f'))
              .showMaxMin(false);

            };
            d3.select('#chart_impacts')
                .datum(data_to_plot)
                .transition().duration(500).call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });
};


function rearrange_data_for_endpoint_chart(human_health_val, ecosystem_val, resource_val, cost_val){
    var mid_to_end = {
         "climate change":[{"name":"human health", "CF":9.28e-7},{"name":"ecosystem", "CF":2.8e-9 + 7.65e-14}],
         "agricultural land occupation":[{"name":"ecosystem", "CF":8.88e-9}],
         "fossil depletion":[{"name":"resource", "CF":0.46}],
         "freshwater ecotoxicity":[{"name":"ecosystem", "CF":6.95e-10}],
         "freshwater eutrophication":[{"name":"ecosystem", "CF":6.71e-7}],
         "human toxicity":[{"name":"human health", "CF":3.32e-6}],
         "ionising radiation":[{"name":"human health", "CF":8.5e-9}],
         "marine ecotoxicity":[{"name":"ecosystem", "CF":1.05e-10}],
         "marine eutrophication":[{"name":"ecosystem", "CF":1.7e-9}],
         "metal depletion":[{"name":"resource", "CF":6.19e-2 * 2.31e-1}],
         "natural land transformation":[{"name":"ecosystem", "CF":8.88e-9}],
         "ozone depletion":[{"name":"human health", "CF":5.31e-4}],
         "particulate matter formation":[{"name":"human health", "CF":6.29e-4}],
         "photochemical oxidant formation":[{"name":"human health", "CF":9.1e-7},{"name":"ecosystem", "CF":1.29e-7}],
         "terrestrial acidification":[{"name":"ecosystem", "CF":2.12e-7}],
         "terrestrial ecotoxicity":[{"name":"ecosystem", "CF":1.14e-11}],
         "urban land occupation":[{"name":"ecosystem", "CF":8.88e-9}],
         "water depletion":[{"name":"human health", "CF":2.22e-6},{"name":"ecosystem", "CF":1.35e-8 + 6.04e-13}],
         "noise emissions":[{"name":"human health", "CF":5.66e-10}],
         "ownership cost":[{"name":"ownership cost", "CF":1}]
    };

    var list_recipient = ["human health", "ecosystem", "resource", "ownership cost"];
    var CF_human_health = 7.4e4
    var CF_ecosystem = 3.08e7
    var CF_resource = 1.0
    var CF_cost = 1.0

    var processed_data = [];


    for (recipient=0;recipient<list_recipient.length;recipient++){
        for (a=0; a<data[1].length;a++){

            if (data[1][a][0] in mid_to_end){
                for (b=0;b<mid_to_end[data[1][a][0]].length;b++){
                    if (mid_to_end[data[1][a][0]][b]["name"]==list_recipient[recipient]){
                        if (list_recipient[recipient] == "human health"){
                            processed_data.push(["human health",
                                                    data[1][a][1],
                                                    data[1][a][2],
                                                    data[1][a][3],
                                                    data[1][a][4],
                                                    data[1][a][5]*mid_to_end[data[1][a][0]][b]["CF"]*CF_human_health*(human_health_val/100),
                                                    data[1][a][0]
                                                    ])
                        };
                        if (list_recipient[recipient] == "ecosystem"){
                            processed_data.push(["ecosystem",
                                                    data[1][a][1],
                                                    data[1][a][2],
                                                    data[1][a][3],
                                                    data[1][a][4],
                                                    data[1][a][5]*mid_to_end[data[1][a][0]][b]["CF"]*CF_ecosystem*(ecosystem_val/100),
                                                    data[1][a][0]])
                        };
                        if (list_recipient[recipient] == "resource"){
                            processed_data.push(["resource", data[1][a][1],
                                                                data[1][a][2],
                                                                data[1][a][3],
                                                                data[1][a][4],
                                                                data[1][a][5]*mid_to_end[data[1][a][0]][b]["CF"]*CF_resource*(resource_val/100),
                                                    data[1][a][0]])
                        };
                        if (list_recipient[recipient] == "ownership cost"){
                            processed_data.push(["ownership cost", data[1][a][1],
                                                    data[1][a][2],
                                                    data[1][a][3],
                                                    data[1][a][4],
                                                    data[1][a][5]*mid_to_end[data[1][a][0]][b]["CF"]*CF_cost*(cost_val/100),
                                                    data[1][a][0]])
                        };

                    }
            }

            };

        }
    };

    var data_to_plot = [];



    for (a = 0; a < list_recipient.length; a++){
        var impact_dict={};

        impact_dict['key'] = i18n(list_recipient[a]);

        impact_dict['values'] = [];

        if (list_recipient[a] == "human health"){
            impact_dict['color'] = "#1f77b4"
        }
        if (list_recipient[a] == "ecosystem"){
            impact_dict['color'] = "#98df8a"
        }
        if (list_recipient[a] == "resource"){
            impact_dict['color'] = "#ff7f0e"
        }
        if (list_recipient[a] == "ownership cost"){
            impact_dict['color'] = "#d62728"
        }


        var list_vehicles = [];

        for (b=0; b < processed_data.length; b++){
            if (processed_data[b][0] == list_recipient[a]){
                var vehicle = i18n(processed_data[b][2])+" - "+i18n(processed_data[b][1])+" - "+processed_data[b][3];

                if (!list_vehicles.includes(vehicle)){
                    impact_dict['values'].push({
                    'x': vehicle,
                    'y': processed_data[b][5]
                    });
                    list_vehicles.push(vehicle);
                }else{
                    for (c=0;c<impact_dict['values'].length;c++){
                        if (impact_dict['values'][c]["x"] == vehicle){
                            impact_dict['values'][c]["y"] += processed_data[b][5]
                        }
                    };
                };
            }
        }
        data_to_plot.push(impact_dict)
    };


    nv.addGraph(function() {
            var chart = nv.models.multiBarChart()
                    .margin({left:100, bottom:180})  //Adjust chart margins to give the x-axis some breathing room.
                    .stacked(true);
            chart.xAxis.rotateLabels(-30);


            var unit_name = i18n("total_impact");

            chart.yAxis     //Chart y-axis settings
              .axisLabel(unit_name+"/"+data[8]+" - "+ data[9])
              .tickFormat(d3.format('.03f'))
              .showMaxMin(false);

            d3.select('#chart_endpoint')
                .datum(data_to_plot)
                .transition().duration(500).call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });

    // Prepare data for radar graph as well

    var chart_data = [];

    var list_impacts = [];
    var list_colors = [];
    var list_cars = [];
    var list_data = [];

    for (var d=0; d < processed_data.length; d++){
        if (!list_impacts.includes(processed_data[d][6])){list_impacts.push(processed_data[d][6])}
        var car = i18n(processed_data[d][2]) + " - " + i18n(processed_data[d][1]) + " - " + processed_data[d][3]
        if (!list_cars.includes(car)){list_cars.push(car)}
    };

    var radarChart_data_endpoint = [];

    for (var car = 0; car < list_cars.length; car++){
        var car_data = [];
        for (var imp = 0; imp < list_impacts.length; imp++){
            var impact = 0

            for (var d = 0; d < processed_data.length; d++){
                var c = i18n(processed_data[d][2]) + " - " + i18n(processed_data[d][1]) + " - " + processed_data[d][3]

                if (c == list_cars[car] && processed_data[d][6] == list_impacts[imp]){
                    impact += processed_data[d][5]

                }
            }

            if (impact > 0 ){

                car_data.push({
                    'axis': i18n(list_impacts[imp]),
                    'value': impact,
                    'key': list_cars[car]
                    })
            }
        }
          radarChart_data_endpoint.push(car_data)
        }

    var max_val = 0;

    for (var d=0; d < radarChart_data_endpoint.length; d++){
        for (var c=0; c < radarChart_data_endpoint[d].length; c++){
            if (radarChart_data_endpoint[d][c]["value"] > max_val){max_val = radarChart_data_endpoint[d][c]["value"]}
        }
    }

    var final_data= [];

    var keep_impact = {};

    for (var i = 0; i < list_impacts.length; i++){
        keep_impact[i18n(list_impacts[i])] = 0
    }

    for (var d=0; d < radarChart_data_endpoint.length; d++){
        for (var c=0; c < radarChart_data_endpoint[d].length; c++){
            var val = parseFloat(radarChart_data_endpoint[d][c]["value"])
            if (val < (0.05 * max_val)){
                keep_impact[radarChart_data_endpoint[d][c]["axis"]] += 1
            }
        }
    }

    for (var d=0; d < radarChart_data_endpoint.length; d++){
        var mid_data = [];
        for (var c=0; c < radarChart_data_endpoint[d].length; c++){

            if (keep_impact[radarChart_data_endpoint[d][c]["axis"]] < list_cars.length){
                mid_data.push(radarChart_data_endpoint[d][c])
            }
        }
        final_data.push(mid_data);
    }

    var color_choice = ["#EDC951","#CC333F","#00A0B0", "#7FD61C", "#1C94D6", "#7A1CD6",
                        "#D11CD6", "#D61C98", "#631CD6", "#1CD6D5"]

    var margin = {top: 100, right: 120, bottom: 130, left: 120},
        width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

    var color = d3.scale.ordinal()
        .range(color_choice);

    var radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: max_val,
      levels: 5,
      roundStrokes: true,
      color: color,
      suffix: ' pt',
      precision: '.03f'
    };
    //Call function to draw the Radar chart
    RadarChart("radarChart_end", final_data, radarChartOptions);
    }


$('input[name="method_radar_graph"]').click(function() {
        generate_radar_chart(data[10]);
    });

function generate_radar_chart(data){
    /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */

    //////////////////////////////////////////////////////////////
    //////////////////////// Set-Up //////////////////////////////
    //////////////////////////////////////////////////////////////

    var margin = {top: 100, right: 120, bottom: 130, left: 120},
        width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

    //////////////////////////////////////////////////////////////
    ////////////////////////// Data //////////////////////////////
    //////////////////////////////////////////////////////////////

    var list_cars = [];
    var list_methods = [];
    var chart_data = [];

    var checked_methods = $('input[name="method_radar_graph"]:checked');
    var list_checked_methods = [];

    for (var m=0; m < checked_methods.length; m++){
        list_checked_methods.push(checked_methods[m]['defaultValue'])
    }

    var d_meth_cat = {
        'cat1': ['climate change - climate change total', 'human health - ozone layer depletion',
                'human health - respiratory effects'],
        'cat2': ['human health - ionising radiation', 'human health - photochemical ozone formation',
                'ecosystem quality - freshwater and terrestrial acidification', 'ecosystem quality - terrestrial eutrophication',
                'ecosystem quality - freshwater eutrophication', 'ecosystem quality - marine eutrophication'],
        'cat3': ['human health - carcinogenic effects', 'human health - non-carcinogenic effects',
                'resources - land use', 'ecosystem quality - freshwater ecotoxicity',
                'resources - dissipated water', 'resources - fossils', 'resources - minerals and metals'],
    }

    for (meth=0; meth < list_checked_methods.length; meth++){

        if (['cat1', 'cat2', 'cat3'].includes(list_checked_methods[meth])){

            var meths = d_meth_cat[list_checked_methods[meth]];

            for (var m=0; m < meths.length; m++){

                list_methods.push(
                    meths[m]
                );
                $('input[name="method_radar_graph"][value="'+meths[m]+'"]').prop( "checked", true );
            };
        }else{
            if (!list_methods.includes(list_checked_methods[meth])){
                list_methods.push(
                    list_checked_methods[meth]
                )
            }

        }
    }

    var meth_cat = ["cat1", "cat2", "cat3"];

    for (var m=0; m < meth_cat.length; m++){

        if (!list_checked_methods.includes(meth_cat[m])){
            var meths = d_meth_cat[meth_cat[m]];

            for (var me=0; me < meths.length; me++){
                if (list_checked_methods.includes(meths[me])){
                        //$('input[name="method_radar_graph"][value="'+meths[me]+'"]').prop( "checked", false );


                }
            }
        }
    }

    for (var l=0; l < data.length; l++){
        var car = data[l][2] + " - " + data[l][1] + " - " + data[l][3]
        var method = data[l][0]
        if (!list_cars.includes(car)){list_cars.push(car)};
    }

    var color_choice = ["#EDC951","#CC333F","#00A0B0", "#7FD61C", "#1C94D6", "#7A1CD6",
                        "#D11CD6", "#D61C98"]

    var max_val = 0;

    for (var l=0; l < data.length; l++){
        if (list_methods.includes(data[l][0])){
            if (data[l][4] > max_val){
                max_val = data[l][4]
            }
        };
    };

    for (var car=0; car < list_cars.length; car++){
        var list_data_sub = [];
        for (var imp=0; imp < list_methods.length; imp++){
            for (var l=0; l < data.length; l++){
                var c = data[l][2] + " - " + data[l][1] + " - " + data[l][3]
                if ((data[l][0] == list_methods[imp])&(c == list_cars[car])){
                    var pt = i18n(list_cars[car].split(" - ")[0])
                    var s = i18n(list_cars[car].split(" - ")[1])
                    var y = i18n(list_cars[car].split(" - ")[2])
                   list_data_sub.push({axis:i18n(list_methods[imp]),
                   value: data[l][4]*100000,
                   key: pt + " - " + s + " - " + String(y)
                   })
                }
            };
        };
        chart_data.push(list_data_sub)
    };


    //////////////////////////////////////////////////////////////
    //////////////////// Draw the Chart //////////////////////////
    //////////////////////////////////////////////////////////////

    var color = d3.scale.ordinal()
        .range(color_choice);

    var radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: max_val,
      levels: 5,
      roundStrokes: true,
      color: color,
      suffix: '/1,000,000',
      precision: '.01f'
    };
    //Call function to draw the Radar chart
    RadarChart("radarChart_mid", chart_data, radarChartOptions);

};






