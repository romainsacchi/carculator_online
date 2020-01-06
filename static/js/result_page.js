

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

