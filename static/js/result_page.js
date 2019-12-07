(function( $ ){
    var list_unit = {
            'agricultural land occupation':'square meter-year',
            'climate change':'kg CO2-Eq',
            'fossil depletion':'kg oil-Eq',
            'freshwater ecotoxicity':'kg 1,4-DC.',
            'freshwater eutrophication':'kg P-Eq',
            'human toxicity':'kg 1,4-DC.',
            'ionising radiation':'kg U235-Eq',
            'marine ecotoxicity':'kg 1,4-DC.',
            'marine eutrophication':'kg N-Eq',
            'metal depletion':'kg Fe-Eq',
            'natural land transformation':'square meter',
            'ozone depletion':'kg CFC-11.',
            'particulate matter formation':'kg PM10-Eq',
            'photochemical oxidant formation':'kg NMVOC',
            'terrestrial acidification':'kg SO2-Eq',
            'terrestrial ecotoxicity':'kg 1,4-DC.',
            'urban land occupation':'square meter-year',
            'water depletion':'cubic meter',
            'human noise':'Person-Pa.s',
            };

    var data = {{data|safe}};
    var imp;
    $("#output").pivotUI(
      data[0], {
        rows: ["impact category", "category"],
        cols: ["year", "powertrain", 'size'],
        vals: ["value"],
        inclusions: {'impact category':["climate change"]},
        "colOrder": "value_a_to_z",
        aggregatorName: "Sum",
        rendererName: "Stacked Bar Chart",
        renderers: $.extend(
            $.pivotUtilities.renderers,
            $.pivotUtilities.export_renderers,
          $.pivotUtilities.plotly_renderers
        ),
        rendererOptions: {plotly: { yaxis: { title: list_unit['climate change']},
                                    title: {text: 'Climate change impacts, per vehicle-kilometer'}}},

        onRefresh: function(config){
            imp = config['inclusions']['impact category'][0]
            }
      });

      $("#output_costs").pivotUI(
      data[1], {
        rows: ["cost category"],
        cols: ["year", "powertrain", 'size'],
        vals: ["value"],
        exclusions: {'cost category':["total"]},
        "colOrder": "value_a_to_z",
        aggregatorName: "Sum",
        rendererName: "Stacked Bar Chart",
        renderers: $.extend(
            $.pivotUtilities.renderers,
            $.pivotUtilities.export_renderers,
          $.pivotUtilities.plotly_renderers
        ),
        rendererOptions: {plotly: { yaxis: { title: '€ per vkm'},
                                    title: {text: 'Ownership cost over life cycle, per vehicle-kilometer'}}},
      });
  }

 function share_results(){
    $.notify({
        icon: 'glyphicon glyphicon-warning-sign',
        message: "Your results are saved for one month. To share them, simply share the link of this page.."
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

    }
    );

 };
