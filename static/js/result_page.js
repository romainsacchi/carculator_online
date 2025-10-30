// ---------- Global error logger ----------
window.addEventListener('error', function (e) {
  console.log('[GlobalError]', e.message, e.filename + ':' + e.lineno + ':' + e.colno);
  if (e.error && e.error.stack) console.log(e.error.stack);
});

function _sanitizeMultiBarSeries(s) {
  // Expect: { key: string, values: [{x: string, y: number}, ...] }
  if (!s || typeof s.key !== 'string' || !Array.isArray(s.values)) return null;
  const cleanedVals = s.values
    .map(p => ({ x: String(p && p.x != null ? p.x : ''), y: Number(p && p.y) }))
    .filter(p => p.x.length && Number.isFinite(p.y));
  if (!cleanedVals.length) return null;
  return { key: s.key, values: cleanedVals };
}

function _describeMultiBar(dataset) {
  try {
    const desc = (dataset || []).map((s, i) => ({
      i,
      key: s.key,
      len: Array.isArray(s.values) ? s.values.length : -1,
      firstX: (s.values && s.values[0]) ? s.values[0].x : '(none)',
      firstY: (s.values && s.values[0]) ? s.values[0].y : '(none)'
    }));
    console.log('[multibar] series summary:', desc);
  } catch(e) {
    console.warn('[multibar] describe failed:', e);
  }
}


//////////////////// Safe helpers ////////////////////
function _safeArr(a){ return Array.isArray(a) ? a : []; }
function _safeNum(x, def=0){ var n = Number(x); return Number.isFinite(n) ? n : def; }
function _get(a, i, def=0){ return (Array.isArray(a) && i >= 0 && i < a.length) ? _safeNum(a[i], def) : def; }

//////////////////// Radar helpers: sanitize + diagnostics ////////////////////
function _isFiniteNum(x){ return typeof x === 'number' && isFinite(x); }

function _sanitizeRadarSeriesObjects(series) {
  // series: array of {axis, value, key}
  const axes = (Array.isArray(series) ? series : [])
    .filter(p => p && typeof p.axis === 'string' && _isFiniteNum(Number(p.value)))
    .map(p => ({ axis: String(p.axis), value: Number(p.value), key: p.key ?? '' }));
  return axes;
}

function _sanitizeRadarDataset(dataset) {
  // dataset: [ series0, series1, ... ] where each series is [{axis,value,key}, ...]
  const cleaned = [];
  const issues = [];
  (Array.isArray(dataset) ? dataset : []).forEach((series, si) => {
    const axes = _sanitizeRadarSeriesObjects(series);
    if (!axes.length) {
      issues.push(`series ${si} empty/invalid`);
    } else {
      const badIdx = axes.findIndex(p => typeof p.axis !== 'string' || !_isFiniteNum(p.value));
      if (badIdx >= 0) {
        issues.push(`series ${si} has bad point at ${badIdx}: ${JSON.stringify(axes[badIdx])}`);
      }
      cleaned.push(axes);
    }
  });
  if (issues.length) console.warn('[radar] sanitize issues:', issues);
  return cleaned;
}

function _describeRadar(dataset) {
  try {
    const desc = (dataset || []).map((series, i) => ({
      i,
      len: Array.isArray(series) ? series.length : -1,
      first: (Array.isArray(series) && series.length) ? `${series[0].axis}:${series[0].value}` : '(none)'
    }));
    console.log('[radar] series summary:', desc);
  } catch(e) {
    console.warn('[radar] describe failed:', e);
  }
}

////////////////////////////////////////////////////////////////////////

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
    data_to_parse.unshift(['carculator online 1.3.3', 'carculator 1.9.2', 'https://carculator.psi.ch']);

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
        "AT":"EUR","AU":"AUD","BE":"EUR","BG":"BGN","BR":"BRL","CA":"CAD","CH":"CHF","CL":"CLP","CN":"CNY","CY":"CYP","CZ":"CZK","DE":"EUR","DK":"DKK","EE":"EEK","ES":"EUR","FI":"EUR","FR":"EUR","GB":"GBP","GR":"EUR","HR":"HRK","HU":"HUF","IE":"EUR","IN":"INR","IT":"EUR","IS":"ISK","JP":"JPY","LT":"LTL","LU":"EUR","LV":"LVL","MT":"MTL","PL":"PLN","PT":"EUR","RO":"ROL","RU":"RUR","SE":"SEK","SI":"SIT","SK":"SKK","US":"USD","ZA":"ZAR","AO":"AOA","BF":"XOF","BI":"BIF","BJ":"XOF","BW":"BWP","CD":"CDF","CF":"XAF","CG":"XAF","CI":"XOF","CM":"XAF","DJ":"DJF","DZ":"DZD","EG":"EGP","ER":"ERN","ET":"ETB","GA":"XAF","GH":"GHC","GM":"GMD","GN":"GNF","GQ":"XAF","GW":"GWP","KE":"KES","LR":"LRD","LS":"ZAR","LY":"LYD","MA":"MAD","ML":"XOF","MR":"MRO","MW":"MWK","MZ":"MZM","NE":"XOF","NG":"NGN","NL":"EUR","NM":"NAD","RW":"RWF","SD":"SDD","SL":"SLL","SN":"XOF","SO":"SOS","SS":"SDD","SZ":"SZL","TD":"XAF","TG":"XOF","TN":"TND","TZ":"TZS","UG":"UGX","ZM":"ZMK","ZW":"ZWD","NO":"NOK",
    };

    var dict_currency_rates = {
        "EUR":"1","AUD":"1.63","BGN":"1.96","BRL":"6.31","CAD":"1.57","CHF":"1.08","CNY":"8.1","CZK":"26.7","DKK":"7.44","RON":"4.86","RUR":"89.5","SEK":"10.4","XOF":"120","XAF":"120","SDD":"65.7","TND":"3.26","ZMK":"23.7","NOK":"10.7","AMD":"577","AZN":"2.02","BYN":"3.125","BAM":"1.96","HRK":"7.54","GEL":"3.7","HUF":"357","ISK":"160","MDL":"19.6","MKD":"61","PLN":"4.45","RSD":"118","TRY":"8.9","UAH":"33","GBP":"0.92","USD":"0.84",
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

function fill_in_vehicles_specs(specs){

    var tableRef_head = document.getElementById('vehicles_specs').getElementsByTagName('thead')[0];
    var tableRef_body = document.getElementById('vehicles_specs').getElementsByTagName('tbody')[0];

    var newRow = tableRef_head.insertRow();

    var row_content = "<td></td><td><i>" + i18n('unit') + "</i></td>";

    if (specs.length < 7){
        var row_no = specs.length
    }else {
        var row_no = 7
    }

    for (var row=0; row < row_no; row++){
         row_content += '<td align="left">'
         var pwt = i18n(specs[row][0]);
         var year = i18n(specs[row][1]);
         var size = i18n(specs[row][2]);
         var vehicle_name = pwt + " - " + size + " - " + year
         row_content += "<h5>" + vehicle_name + "</h5>";
         row_content += '</td>';
        }

    newRow.innerHTML = row_content;
    tableRef_head.append(newRow);

    var params = [
    "lifetime",
    "driving mass",
    "combustion power",
    "electric power",
    "energy consumption",
    "tank-to-wheel efficiency",
    "number of passengers",
    "driving cycle",
    "fuel blend",
    "range",
    "battery lifetime",
    "battery capacity",
    "battery mass"
    ]

    var d_map_param_indices = {
        "lifetime":3,
        "driving mass":11,
        "combustion power":12,
        "electric power":13,
        "energy consumption":10,
        "tank-to-wheel efficiency":17,
        "number of passengers":5,
        "driving cycle":7,
        "fuel blend":[25, 26, 27, 28],
        "range":14,
        "battery lifetime":22,
        "battery capacity":21,
        "battery mass":19
    }

    // first , add the country

    var newRow = tableRef_body.insertRow();
    var row_content = "";
    row_content += "<td><b>" + i18n('country') + "</b></td><td><i></i></td>"
    for (var row=0; row < row_no; row++){
        row_content += "<td><i>" + data[7] + "</i></td>"
    }
    newRow.innerHTML = row_content;
    tableRef_body.append(newRow);

    // then add the functional unit
    // contained in data[7] and data[8]

    var newRow = tableRef_body.insertRow();
    var row_content = "";
    row_content += "<td><b>" + i18n('functional_unit') + "</b></td><td><i></i></td>"
    for (var row=0; row < row_no; row++){
        row_content += "<td><i>" + data[8] + " " + data[9] + "</i></td>"
    }
    newRow.innerHTML = row_content;
    tableRef_body.append(newRow);


    for (var p=0; p < params.length; p++){

        var newRow = tableRef_body.insertRow();
        var row_content = "";
        var param = params[p]
        var unit = i18n(params[p]).split(" - ")[1]
        row_content += "<td><b>" + i18n(params[p]).split(" - ")[0] + "</b></td><td><i>" + unit + "</i></td>"

        for (var row=0; row < row_no; row++){

            if (param == "tank-to-wheel efficiency"){
                var val = (specs[row][d_map_param_indices[param]]*100).toFixed(0);
            } else if (param == "number of passengers"){
                var val = specs[row][d_map_param_indices[param]].toFixed(1);
            } else if(["lifetime", "battery lifetime", "driving mass", "combustion power", "electric power",
                        "range", "battery capacity", "battery mass"].includes(param)){
                var val = specs[row][d_map_param_indices[param]];

                if (["combustion power", "electric power"].includes(param)){
                    val *= 1.34102
                }

                val = val.toLocaleString('en-US', {maximumFractionDigits:0})

                if (val == 0){ val = ""};

            } else if (param == "energy consumption"){
                var val = specs[row][d_map_param_indices[param]];
                val /= 32000
                val *= 100
                val = val.toLocaleString('en-US', {maximumFractionDigits:1})

            } else if (param == "fuel blend"){

                var fuel_blend = d_map_param_indices[param];
                if (specs[row][fuel_blend[0]] != ""){

                    var val = (specs[row][fuel_blend[1]] * 100).toFixed(0) + "% " +  i18n(specs[row][fuel_blend[0]])
                    val += " - " + (specs[row][fuel_blend[3]] * 100).toFixed(0) + "% " +  i18n(specs[row][fuel_blend[2]])

                } else {
                    // ---- Hardened electricity-mix branch ----
                    var mix = _safeArr(specs[row][9]);
                    var share_renew = _get(mix,0) + _get(mix,3) + _get(mix,4) + _get(mix,5) +
                                      _get(mix,8) + _get(mix,10) + _get(mix,11) + _get(mix,14);
                    var share_nuclear = _get(mix,1);
                    var share_fossil = 1 - share_renew - share_nuclear;
                    if (!Number.isFinite(share_fossil)) share_fossil = 0;
                    if (share_fossil < 0) share_fossil = 0;

                    var val = (share_renew * 100).toFixed(0) + "% renew. - " +
                              (share_fossil * 100).toFixed(0) + "% fossil. " +
                              (share_nuclear * 100).toFixed(0) + "% nuclear.";
                }

            } else {
                var val = specs[row][d_map_param_indices[param]]
            }
            row_content += "<td>" + val + "</td>"
        };
        newRow.innerHTML = row_content;
        tableRef_body.append(newRow);
    }
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
                    .margin({left:60, bottom:40, right:30})
                    .useInteractiveGuideline(true)
                    .showLegend(true)
                    .showYAxis(true)
                    .showXAxis(true)
                    .forceY([0, max_y_val * 1.1])
                    .forceX([0, max_x_val]);

      var dc_str = i18n("driving_cycle");
      chart.xAxis.axisLabel(dc_str).tickFormat(d3.format(',r'));
      chart.yAxis.axisLabel('Kilojoule').tickFormat(d3.format(',d')).showMaxMin(false);

      d3.select('#chart-ttw-energy').datum(data).call(chart);
      d3.select('#chart-ttw-energy').style('fill', "white");
      nv.utils.windowResize(function() { chart.update() });
      return chart;
    });
};

function generate_scatter_chart(data, qty, unit){

    var datum = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var arr_names = key.split(", ");
            var pt = i18n(arr_names[0]);
            var y = arr_names[1];
            var size = i18n(arr_names[2]);
            datum.push({values:[{"x": data[key][0]*currency_exch_rate,
                                 "y":data[key][1], "size":400, "shape":"circle"}],
                                 key:pt+" - " + size + " - " + y})
        }
    }

    nv.addGraph(function() {
      var chart = nv.models.scatterChart()
                    .margin({left:60, bottom:40, right:30})
                    .showYAxis(true)
                    .showXAxis(true)
                    .showDistX(true)
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
      chart.yAxis.axisLabel(gwp_str).tickFormat(d3.format('.02f')).ticks(10);

      var cost_str = currency_name + "/" + qty + " - " + unit;
      chart.xAxis.axisLabel(cost_str).tickFormat(d3.format('.02f')).ticks(10);

      d3.select('#chart-scatter').datum(datum).call(chart);
      d3.select('#chart-scatter').style('fill', "white");
      nv.utils.windowResize(function() { chart.update() });
      return chart;

    });
};

function generate_chart_accumulated_impacts(data, impact){
    var colors = d3.scale.category20()

    var datum = [];
    for (var x=0; x < data.length; x++){
        if (data[x][0] == impact){
            var arr_data = [];
            for (var i = 0; i < 101; i++){
                arr_data.push({"x":i * data[x][6] / 100, "y": data[x][4] + (data[x][5] * (i * data[x][6] / 100))})
            }
            var name = i18n(data[x][2]) + " - " + i18n(data[x][1]) + " - " + data[x][3]
            datum.push({values:arr_data, key:name, color:colors(x)})
        };
    };

    nv.addGraph(function() {
    var chart_acc = nv.models.lineChart()
                    .margin({left:60, bottom:40, right:30})
                    .useInteractiveGuideline(true)
                    .showLegend(true)
                    .showYAxis(true)
                    .forceY([0])
                    .showXAxis(true);

      chart_acc.xAxis.axisLabel(i18n('use')).tickFormat(d3.format(',d'));

      if (impact == "ozone depletion" ){
          chart_acc.yAxis.axisLabel(i18n("unit_"+impact)).tickFormat(d3.format('.0e')).showMaxMin(false);
      }
      else{
            if (impact == "human noise"){
              chart_acc.yAxis.axisLabel(i18n("unit_"+impact)).tickFormat(d3.format('s')).showMaxMin(false);
            }else{
              chart_acc.yAxis.axisLabel(i18n("unit_"+impact)).tickFormat(d3.format(',d')).showMaxMin(false);
            };
      };

      chart_acc.interactiveLayer.tooltip.contentGenerator(function (d) {
            var html = "<h4 style='margin:15px;'>" + d.value + " km</h2> <ul>";
            for (var i = 0; i < d.series.length; i++) {
              html += "<li style='margin-left:30px;list-style-type: none'><span style='color:" + d.series[i].color + ";'>●</span> " + d.series[i].key + ": " + d.series[i].value.toFixed(2) + " " + i18n("unit_"+impact) + "</li>";
            }
            html += "</ul>";
            return html;
      });

      d3.select('#chart-accumulated').datum(datum).call(chart_acc);
      d3.select('#chart-accumulated').style('fill', "gray");
      d3.selectAll('.nvd3 g.nv-groups g path.nv-line').attr('stroke-width','5px')
      nv.utils.windowResize(function() { chart_acc.update() });
      return chart_acc;
    });

};

 // Update impact categories chart when selection is changed.
 $("#table_impact_cat").on("click", "li", function () {
    var impact_cat = $(this).text();
    var impact_name = $(this)[0].children[0].id;
    rearrange_data_for_LCA_chart(impact_cat)
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

    var d_reliability = {
        "agricultural land occupation": "moderate",
        "climate change":"good",
        "GWP100a, incl. bio CO2":"good",
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
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('unit') + '</td><td>' + i18n('unit_'+impact_name) + '</td></tr>'
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('description_impact') + '</td><td>' + i18n('description_' + impact_name) + '</td></tr>'
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
    tableRef.append(newRow);
    var newRow = tableRef.insertRow();
    newRow.innerHTML = '<tr class="text-left"><td width="25%">' + i18n('issue_impact') + '</td><td>' + i18n('issue_'+impact_name) + '</td></tr>'
    tableRef.append(newRow);
}

function _sanitizeSeriesForMultiBarWithIndex(s) {
  // Expect: { key: string, values: [{x: number, y: number}, ...] }
  if (!s || typeof s.key !== 'string' || !Array.isArray(s.values)) return null;
  const cleanedVals = s.values
    .map(p => ({ x: Number(p && p.x), y: Number(p && p.y) }))
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!cleanedVals.length) return null;
  return { key: s.key, values: cleanedVals };
}




//////////////////// Multibar diagnostics (pinpoint row + missing) ////////////////////
function _isNum(x){ return typeof x === 'number' && isFinite(x); }
function _toNum(x){ const v = Number(x); return isFinite(v) ? v : NaN; }

function debugScanLCAData(data1, impact_cat, i18nFn){
  const problems = [];
  const rows = [];

  // Collect rows for this translated impact category
  for (let idx = 0; idx < data1.length; idx++){
    const r = data1[idx];
    if (!Array.isArray(r) || r.length < 7){
      problems.push({ kind:'shape', idx, row: r });
      continue;
    }
    const impRaw = r[0];
    if (i18nFn(impRaw) !== impact_cat) continue;

    const size = r[1], pwt = r[2], year = r[3], subcat = r[4], perFU = r[5], total = r[6];
    const errs = [];
    if (typeof size !== 'string') errs.push('size !string');
    if (typeof pwt  !== 'string') errs.push('pwt !string');
    if (!_isNum(_toNum(year))) errs.push('year !num');
    if (typeof subcat !== 'string') errs.push('subcat !string');
    if (!_isNum(_toNum(perFU))) errs.push('perFU !finite');
    if (!_isNum(_toNum(total))) errs.push('total !finite');

    if (errs.length){
      problems.push({ kind:'row-invalid', idx, err: errs, row: r.slice(0,7) });
    } else {
      rows.push({
        idx,
        size, pwt, year: _toNum(year),
        subcat, perFU: _toNum(perFU), total: _toNum(total),
        label: `${i18nFn(size)} - ${i18nFn(pwt)} - ${_toNum(year)}`
      });
    }
  }

  // x-domain and coverage
  const labels = [...new Set(rows.map(r => r.label))];
  const subcats = [...new Set(rows.map(r => r.subcat))];

  // Coverage map per subcat -> set of labels present
  const cover = new Map();
  subcats.forEach(sc => cover.set(sc, new Set()));
  rows.forEach(r => cover.get(r.subcat).add(r.label));

  // Duplicated labels (same x) within same subcat
  const dupes = [];
  const seenKey = new Set();
  rows.forEach(r => {
    const k = `${r.subcat}|||${r.label}`;
    if (seenKey.has(k)) dupes.push({ subcat: r.subcat, label: r.label, idx: r.idx });
    seenKey.add(k);
  });

  // Missing x per subcat
  const holes = [];
  subcats.forEach(sc => {
    const s = cover.get(sc);
    labels.forEach(lbl => { if (!s.has(lbl)) holes.push({ subcat: sc, label: lbl }); });
  });

  // Map label -> row indices for easy tracing
  const labelToIdx = new Map();
  labels.forEach(lbl => labelToIdx.set(lbl, []));
  rows.forEach(r => labelToIdx.get(r.label).push(r.idx));

  // Log in a way that cannot be collapsed into “Object”
  console.log('[multibar/debug] impact_cat:', impact_cat, '| rows considered:', rows.length);
  if (problems.length){
    console.warn('[multibar/debug] PROBLEMS (first 10):');
    problems.slice(0,10).forEach(p => {
      console.warn(
        `  - kind=${p.kind} idx=${p.idx}`,
        JSON.stringify(p.err || []),
        JSON.stringify(p.row)
      );
    });
    if (problems.length > 10) console.warn(`  ... and ${problems.length-10} more`);
  } else {
    console.log('[multibar/debug] basic shape/number validation: OK');
  }

  if (dupes.length){
    console.warn('[multibar/debug] DUPLICATE label within subcat (first 10):');
    dupes.slice(0,10).forEach(d => console.warn(`  - subcat=${d.subcat} label="${d.label}" sample idx=${d.idx}`));
  }

  if (holes.length){
    // Show a compact per-subcat list (first 8 each)
    console.warn('[multibar/debug] MISSING x-labels by subcat (these cause NVD3 stacked errors):');
    const per = {};
    holes.forEach(h => { (per[h.subcat] ||= []).push(h.label); });
    Object.entries(per).forEach(([sc, arr]) => {
      console.warn(`  - ${sc}: missing ${arr.length} label(s). Examples:`, arr.slice(0,8));
      // For the first missing label, show which indices DO exist for that label
      const sample = arr[0];
      console.warn(`      compare with existing rows for "${sample}":`, labelToIdx.get(sample));
    });
  } else {
    console.log('[multibar/debug] all series cover identical x-domain: OK');
  }

  return { rows, labels, subcats, problems, holes, dupes, labelToIdx };
}

//////////////////// MultiBar hard sanitizer + pinpoint logs ////////////////////
function _isFiniteNum(x){ return typeof x === 'number' && isFinite(x); }

/**
 * Sanitize one series that uses index-based x.
 * - Drops points with invalid x or y
 * - Clamps x to [0, labelsLen-1] (but logs if it had to)
 * - Sorts by x
 * - Collapses duplicate x by summing y
 */
function _sanitizeSeriesForMultiBarWithIndex(series, labelsLen){
  if (!series || typeof series !== 'object' || !Array.isArray(series.values)) {
    console.error('[multibar/sanitize] bad series object:', series);
    return null;
  }
  const key = String(series.key ?? '(no-key)');
  const out = [];

  series.values.forEach((p, pi) => {
    let x = Number(p?.x);
    let y = Number(p?.y);

    if (!Number.isFinite(x)) {
      console.error(`[multibar/sanitize] drop point: non-numeric x at series "${key}" idx ${pi}:`, p);
      return;
    }
    if (!_isFiniteNum(y)) {
      console.error(`[multibar/sanitize] drop point: non-finite y at series "${key}" idx ${pi}:`, p);
      return;
    }

    if (x < 0 || x >= labelsLen) {
      console.warn(`[multibar/sanitize] x out of domain for "${key}" idx ${pi}: x=${x}, labelsLen=${labelsLen}. Dropping.`);
      return;
    }

    x = Math.round(x); // ensure integer index
    out.push({ x, y });
  });

  // sort and collapse duplicate x
  out.sort((a,b) => a.x - b.x);
  const collapsed = [];
  for (const pt of out) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.x === pt.x) {
      last.y += pt.y;
    } else {
      collapsed.push({ x: pt.x, y: pt.y });
    }
  }

  if (!collapsed.length) {
    console.warn(`[multibar/sanitize] series "${key}" ended empty after cleaning`);
    return null;
  }

  return { key, values: collapsed };
}

/**
 * Ensure every series has all x indices [0..labelsLen-1].
 * Pads missing with y=0 and logs what was missing.
 */
function _padMissingIndicesWithZero(labelsLen, dataset){
  const expected = new Set(Array.from({length: labelsLen}, (_,i)=>i));
  dataset.forEach((s, si) => {
    const have = new Set(s.values.map(p => p.x));
    const missing = [...expected].filter(i => !have.has(i));
    if (missing.length) {
      console.warn(`[multibar/pad] series ${si} "${s.key}" missing ${missing.length} x index(es). Examples:`, missing.slice(0, 12));
      missing.forEach(i => s.values.push({ x: i, y: 0 }));
      s.values.sort((a,b)=>a.x-b.x);
    }
  });
}


function _validateNvMultiBarTupleDataset(nvDataset, labels) {
  try {
    if (!Array.isArray(nvDataset)) {
      console.error('[nv-validate] dataset is not an array:', nvDataset);
      return false;
    }

    // High-level summary
    console.log('[nv-validate] series count:', nvDataset.length, '| labels:', labels.length);

    for (let si = 0; si < nvDataset.length; si++) {
      const s = nvDataset[si];
      if (!s || typeof s !== 'object') {
        console.error('[nv-validate] series not object', { si, s });
        return false;
      }
      if (!('key' in s)) {
        console.error('[nv-validate] series missing "key"', { si, s });
        return false;
      }
      if (!Array.isArray(s.values)) {
        console.error('[nv-validate] series.values not array', { si, key: s.key, values: s.values });
        return false;
      }

      for (let pi = 0; pi < s.values.length; pi++) {
        const pt = s.values[pi];

        if (!Array.isArray(pt)) {
          console.error('[nv-validate] point is not array', { si, key: s.key, pi, pt });
          return false;
        }
        if (pt.length < 2) {
          console.error('[nv-validate] point has length < 2', { si, key: s.key, pi, pt });
          return false;
        }

        const x = pt[0], y = pt[1];

        if (!Number.isFinite(x)) {
          console.error('[nv-validate] x not finite', { si, key: s.key, pi, x, pt });
          return false;
        }
        if (!Number.isFinite(y)) {
          console.error('[nv-validate] y not finite', { si, key: s.key, pi, y, pt });
          return false;
        }

        const ix = Math.round(x);
        if (ix < 0 || ix >= labels.length) {
          console.error('[nv-validate] x index out of label range', { si, key: s.key, pi, ix, labelsLen: labels.length, label: labels[ix] });
          return false;
        }

        // Catch sneaky undefineds in tuple
        if (pt[0] === undefined || pt[1] === undefined) {
          console.error('[nv-validate] tuple contains undefined', { si, key: s.key, pi, pt });
          return false;
        }
      }
    }
    console.log('[nv-validate] dataset looks OK for NVD3 tuple input.');
    return true;
  } catch (e) {
    console.error('[nv-validate] threw while scanning:', e);
    return false;
  }
}

function rearrange_data_for_LCA_chart(impact_cat){

  // ---------- 1) Collect rows (converting cost to user currency if needed) ----------
  let rows = [];
  let real_impact_name = "";

  for (let a = 0; a < data[1].length; a++){
    if (i18n(data[1][a][0]) === impact_cat){
      real_impact_name = data[1][a][0];
      if (real_impact_name === "ownership cost"){
        const r = data[1][a].slice();
        r[6] = Number(r[6]) * currency_exch_rate; // total
        r[5] = Number(r[5]) * currency_exch_rate; // per FU
        rows.push(r);
      } else {
        rows.push(data[1][a]);
      }
    }
  }

  // nothing? bail early
  if (!rows.length){
    d3.select('#chart_impacts').select('svg').remove();
    console.warn('[rearrange_data_for_LCA_chart] no rows for impact:', impact_cat);
    return;
  }

  // ---------- 2) Sort rows by total (index 6) ----------
  rows.sort((x,y) => Number(y[6]||0) - Number(x[6]||0));

  // ---------- 3) Build global label list (x ticks) ----------
  const labels = [];
  const labelSet = new Set();
  function pushLabel(lbl){
    const s = String(lbl || '');
    if (!s) return -1;
    if (!labelSet.has(s)){
      labelSet.add(s);
      labels.push(s);
    }
    return labels.indexOf(s);
  }

  // compute all x labels
  for (let r=0; r<rows.length; r++){
    const lab = String(i18n(rows[r][1])) + " - " + String(i18n(rows[r][2])) + " - " + String(rows[r][3]);
    pushLabel(lab);
  }

  // guard
  if (!labels.length){
    d3.select('#chart_impacts').select('svg').remove();
    console.warn('[rearrange_data_for_LCA_chart] no x labels.');
    return;
  }

  // ---------- 4) List unique subcategories (index 4) ----------
  const subcats = [];
  const subSet = new Set();
  for (let r=0; r<rows.length; r++){
    const sc = rows[r][4];
    if (sc != null && !subSet.has(sc)){
      subSet.add(sc);
      subcats.push(sc);
    }
  }

  // If there are no subcats, make a single group to still plot something
  if (!subcats.length){
    subcats.push('(total)');
  }

  // ---------- 5) Build dense object-shaped dataset for NVD3 ----------
  // Shape: [{ key, values: [{x:int, y:number}, ... all labels ...] }, ...]
  const series = subcats.map(sc => {
    const key = i18n(sc);
    // init with zeros across all labels
    const values = labels.map((_, ix) => ({ x: ix, y: 0 }));
    // fill actual values
    for (let r=0; r<rows.length; r++){
      if (rows[r][4] === sc){
        const lab = String(i18n(rows[r][1])) + " - " + String(i18n(rows[r][2])) + " - " + String(rows[r][3]);
        const ix = labels.indexOf(lab);
        if (ix >= 0){
          const yVal = Number(rows[r][5]);
          if (Number.isFinite(yVal)){
            values[ix].y = yVal;
          }
        }
      }
    }
    return { key, values };
  });

  // ---------- 6) Deep validation for object shape ----------
  function _validateNvMultiBarObjectDataset(ds, labs){
    try{
      if (!Array.isArray(ds)){ console.error('[nv-validate-obj] dataset not array', ds); return false; }
      console.log('[nv-validate-obj] series count:', ds.length, '| labels:', labs.length);
      for (let si=0; si<ds.length; si++){
        const s = ds[si];
        if (!s || typeof s !== 'object'){ console.error('[nv-validate-obj] series not object', {si, s}); return false; }
        if (typeof s.key !== 'string'){ console.error('[nv-validate-obj] series.key not string', {si, key: s.key}); return false; }
        if (!Array.isArray(s.values)){ console.error('[nv-validate-obj] series.values not array', {si, key: s.key}); return false; }
        if (s.values.length !== labs.length){
          console.warn('[nv-validate-obj] series.values length != labels length', {si, key: s.key, vlen:s.values.length, llen: labs.length});
        }
        for (let pi=0; pi<s.values.length; pi++){
          const pt = s.values[pi];
          if (!pt || typeof pt !== 'object'){ console.error('[nv-validate-obj] point not object', {si, key:s.key, pi, pt}); return false; }
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)){
            console.error('[nv-validate-obj] x/y not finite', {si, key:s.key, pi, pt});
            return false;
          }
          const ix = Math.round(pt.x);
          if (ix < 0 || ix >= labs.length){
            console.error('[nv-validate-obj] x index out of range', {si, key:s.key, pi, ix, labsLen: labs.length, label: labs[ix]});
            return false;
          }
          if (pt.y === undefined){
            console.error('[nv-validate-obj] y is undefined', {si, key:s.key, pi, pt});
            return false;
          }
        }
      }
      console.log('[nv-validate-obj] dataset looks OK for NVD3 object input.');
      return true;
    }catch(e){
      console.error('[nv-validate-obj] threw while scanning:', e);
      return false;
    }
  }

  if (!_validateNvMultiBarObjectDataset(series, labels)){
    console.error('[rearrange_data_for_LCA_chart] Aborting render due to invalid object dataset.');
    d3.select('#chart_impacts').select('svg').remove();
    return;
  }

  // ---------- 7) Render (object shape) ----------
  d3.select('#chart_impacts').select('svg').remove();

  nv.addGraph(function() {
    var chart = nv.models.multiBarChart()
      .margin({left:100, bottom:180})
      .stacked(true);

    // tell chart to use object fields
    chart.multibar
      .x(function(d){ return d.x; })
      .y(function(d){ return d.y; });

    chart.xAxis
      .rotateLabels(-30)
      .tickFormat(function(i){
        const idx = Math.max(0, Math.min(labels.length-1, Math.round(i)));
        return labels[idx] || '';
      });

    // y format & label
    var unit_name = "unit_" + real_impact_name;
    const yFmt =
      (["ozone depletion", "freshwater eutrophication", "marine eutrophication",
        "natural land transformation", "particulate matter formation",
        "photochemical oxidant formation", "terrestrial acidification",
        "terrestrial ecotoxicity"].includes(real_impact_name))
        ? d3.format('.02e')
        : (real_impact_name === "human noise" ? d3.format('s')
           : (real_impact_name === "ownership cost" ? d3.format('.02f')
              : d3.format('.03f')));

    chart.yAxis
      .axisLabel(
        real_impact_name === "ownership cost"
          ? (currency_name + "/" + data[8] + " - " + data[9])
          : (i18n(unit_name) + "/" + data[8] + " - " + data[9])
      )
      .tickFormat(yFmt)
      .showMaxMin(false);

    // Try full render; if it throws, we progressively bisect to identify the culprit series
    try {
      d3.select('#chart_impacts').datum(series).transition().duration(500).call(chart);
    } catch (e) {
      console.error('[rearrange_data_for_LCA_chart] full render threw, isolating...', e);
      // binary search isolation
      function tryRender(subset) {
        d3.select('#chart_impacts').select('svg').remove();
        d3.select('#chart_impacts').append('svg');
        try {
          d3.select('#chart_impacts').datum(subset).call(chart);
          return true;
        } catch (err) {
          return false;
        }
      }
      let left = 0, right = series.length - 1, culpritIdx = -1;
      while (left <= right) {
        const mid = Math.floor((left + right)/2);
        const okLeft = tryRender(series.slice(0, mid+1));
        if (!okLeft) {
          culpritIdx = mid;
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      }
      if (culpritIdx >= 0) {
        console.error('[rearrange_data_for_LCA_chart] culprit series key:', series[culpritIdx].key, 'index:', culpritIdx, 'values(head):', series[culpritIdx].values.slice(0,5));
      } else {
        console.error('[rearrange_data_for_LCA_chart] could not isolate culprit — chart may be failing elsewhere.');
      }
      // bail
      return;
    }

    nv.utils.windowResize(chart.update);
    return chart;
  });
}



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
            }
        }
    };

    var data_to_plot = [];

    for (a = 0; a < list_recipient.length; a++){
        var impact_dict={};
        impact_dict['key'] = i18n(list_recipient[a]);
        impact_dict['values'] = [];

        if (list_recipient[a] == "human health"){ impact_dict['color'] = "#1f77b4" }
        if (list_recipient[a] == "ecosystem"){ impact_dict['color'] = "#98df8a" }
        if (list_recipient[a] == "resource"){ impact_dict['color'] = "#ff7f0e" }
        if (list_recipient[a] == "ownership cost"){ impact_dict['color'] = "#d62728" }

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
                    .margin({left:100, bottom:180})
                    .stacked(true);
            chart.xAxis.rotateLabels(-30);

            var unit_name = i18n("total_impact");

            chart.yAxis
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
    var list_cars = [];

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
                car_data.push({ 'axis': i18n(list_impacts[imp]), 'value': impact, 'key': list_cars[car] })
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
    for (var i = 0; i < list_impacts.length; i++){ keep_impact[i18n(list_impacts[i])] = 0 }

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
        if (mid_data.length) { final_data.push(mid_data); }
    }

    var margin = {top: 170, right: 120, bottom: 130, left: 120},
        width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

    var radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: max_val,
      levels: 5,
      roundStrokes: true,
      suffix: ' pt',
      precision: '.03f'
    };

    // ---- sanitize + describe + guard for endpoint radar ----
    const cleaned = _sanitizeRadarDataset(final_data);
    _describeRadar(cleaned);
    if (!cleaned.length) {
      d3.select('#radarChart_end').select('svg').remove();
      console.warn('[rearrange_data_for_endpoint_chart] no data to plot for end-radar');
      return;
    }
    RadarChart("radarChart_end", cleaned, radarChartOptions);
}

$('input[name="method_radar_graph"]').click(function() {
        generate_radar_chart(data[10]);
});

function generate_radar_chart(data){
  /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */

  // ---------- helpers ----------
  function norm(s){
    if (s == null) return '';
    return String(s)
      .replace(/[\u2013\u2014]/g, '-')      // en/em dash -> hyphen
      .replace(/\s+/g, ' ')                 // collapse spaces
      .trim()
      .toLowerCase();
  }


  // ---------- Set-Up ----------
  var margin = {top: 180, right: 120, bottom: 130, left: 120},
      width  = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
      height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

  // ---------- Collect UI selections ----------
  var checked = $('input[name="method_radar_graph"]:checked');
  var list_checked_methods = [];
  for (var m=0; m<checked.length; m++) list_checked_methods.push(checked[m].defaultValue);

  // Map categories → methods (these must match the *raw* data strings, not translated)
  var d_meth_cat = {
    'cat1': ['climate change - climate change total', 'human health - ozone layer depletion',
             'human health - respiratory effects'],
    'cat2': ['human health - ionising radiation', 'human health - photochemical ozone formation',
             'ecosystem quality - freshwater and terrestrial acidification', 'ecosystem quality - terrestrial eutrophication',
             'ecosystem quality - freshwater eutrophication', 'ecosystem quality - marine eutrophication'],
    'cat3': ['human health - carcinogenic effects', 'human health - non-carcinogenic effects',
             'resources - land use', 'ecosystem quality - freshwater ecotoxicity',
             'resources - dissipated water', 'resources - fossils', 'resources - minerals and metals'],
  };

  // Expand category selections to method list (RAW strings)
  var list_methods = [];
  for (var i=0; i<list_checked_methods.length; i++){
    var v = list_checked_methods[i];
    if (['cat1','cat2','cat3'].includes(v)){
      var meths = d_meth_cat[v] || [];
      meths.forEach(mm => { if (!list_methods.includes(mm)) list_methods.push(mm); });
      // optional UI sync
      meths.forEach(mm => $('input[name="method_radar_graph"][value="'+mm+'"]').prop("checked", true));
    } else {
      if (!list_methods.includes(v)) list_methods.push(v);
    }
  }

  // Derive cars & method inventory from data (RAW + normalized)
  var list_cars = [];
  var methodsInDataRaw = [];
  var methodsInDataNorm = new Set();
  var rowsByCarNorm = new Map(); // carNorm -> array of rows for that car

  for (var l=0; l<data.length; l++){
    var rawCar = data[l][2] + ' - ' + data[l][1] + ' - ' + data[l][3];
    var carNorm = norm(rawCar);
    if (!list_cars.includes(rawCar)) list_cars.push(rawCar);

    var mRaw = data[l][0];
    var mNorm = norm(mRaw);
    if (!methodsInDataNorm.has(mNorm)) {
      methodsInDataNorm.add(mNorm);
      methodsInDataRaw.push(mRaw);
    }

    if (!rowsByCarNorm.has(carNorm)) rowsByCarNorm.set(carNorm, []);
    rowsByCarNorm.get(carNorm).push({
      methodRaw: mRaw,
      methodNorm: mNorm,
      value: Number(data[l][4]),
      rawCar, carNorm
    });
  }

  // If no UI methods, default to cat1
  if (!list_methods.length){
    console.warn('[radar/mid] No methods checked. Defaulting to cat1.');
    list_methods = (d_meth_cat['cat1'] || []).slice();
    list_methods.forEach(v => $('input[name="method_radar_graph"][value="'+v+'"]').prop("checked", true));
  }

    // Now continue as before:
    var list_methods_norm = list_methods.map(norm);

    // Optional: log what changed
    console.log('[radar/mid] methods after alias map (raw):', list_methods);


  // Diagnostics: what do we have vs what we want
  console.log('[radar/mid] checked (raw):', list_checked_methods);
  console.log('[radar/mid] methods (raw):', list_methods);
  console.log('[radar/mid] methods in data (sample, raw):', methodsInDataRaw.slice(0,15));
  console.log('[radar/mid] methods (norm):', list_methods_norm);
  console.log('[radar/mid] methodsInData (norm, count):', methodsInDataNorm.size);

  // Compute max over chosen methods (normalized match)
  var max_val = 0;
  rowsByCarNorm.forEach(arr => {
    arr.forEach(r => {
      if (list_methods_norm.includes(r.methodNorm) && Number.isFinite(r.value) && r.value > max_val){
        max_val = r.value;
      }
    });
  });

  // Build chart_data
  var chart_data = [];
  var missingReport = []; // detailed per-car missing methods

  for (var c=0; c<list_cars.length; c++){
    var rawCar = list_cars[c];
    var carNorm = norm(rawCar);
    var carRows = rowsByCarNorm.get(carNorm) || [];

    // index this car's methods by methodNorm for O(1)
    var valByMethodNorm = new Map();
    carRows.forEach(r => { if (Number.isFinite(r.value)) valByMethodNorm.set(r.methodNorm, r.value); });

    var list_data_sub = [];
    var missingForCar = [];

    for (var mi=0; mi<list_methods.length; mi++){
      var mRaw = list_methods[mi];
      var mNorm = list_methods_norm[mi];

      if (valByMethodNorm.has(mNorm)){
        var v = valByMethodNorm.get(mNorm);
        var pt = i18n(rawCar.split(' - ')[0]);
        var s  = i18n(rawCar.split(' - ')[1]);
        var y  = i18n(rawCar.split(' - ')[2]);
        list_data_sub.push({
          axis: i18n(mRaw),
          value: v * 1e6, // same scale as before
          key:  pt + ' - ' + s + ' - ' + String(y)
        });
      } else {
        // remember what we’re missing for this car
        missingForCar.push(mRaw);
      }
    }

    if (list_data_sub.length){
      chart_data.push(list_data_sub);
    }
    if (missingForCar.length){
      // Only log if *some* data existed for this car, or if you want all
      missingReport.push({ car: rawCar, missing: missingForCar });
    }
  }

  console.log('[radar/mid] cars:', list_cars);
  console.log('[radar/mid] chart_data length:', chart_data.length, '| max_val:', max_val);
  if (missingReport.length){
    console.warn('[radar/mid] per-car missing methods (raw):', missingReport.slice(0, 10));
  }

  // ---------- Draw ----------
  var radarChartOptions = {
    w: width,
    h: height,
    margin: margin,
    maxValue: max_val,
    levels: 5,
    roundStrokes: true,
    suffix: '/1,000,000',
    precision: '.01f'
  };

  const cleaned = _sanitizeRadarDataset(chart_data);
  _describeRadar(cleaned);
  if (!cleaned.length) {
    var sel = d3.select('#radarChart_mid');
    sel.on('.zoom', null);
    sel.selectAll('*').on('.zoom', null);
    sel.selectAll('*').interrupt();
    sel.select('svg').remove();

    // Extra guidance if everything is empty
    if (!list_methods_norm.some(m => methodsInDataNorm.has(m))) {
      console.error('[generate_radar_chart] None of the selected methods exist in the data.',
        { selectedRaw: list_methods, selectedNorm: list_methods_norm,
          availableRawSample: methodsInDataRaw.slice(0,20) });
    } else {
      console.warn('[generate_radar_chart] No data to plot for mid-radar (values missing for selected methods & cars).');
    }
    return;
  }

  RadarChart("radarChart_mid", cleaned, radarChartOptions);
}
