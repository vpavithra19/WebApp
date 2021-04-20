/**
 * Created by Team Kony.
 * Copyright (c) 2017 Kony Inc. All rights reserved.
 */
konymp = {};
konymp.charts = konymp.charts || {};

konymp.charts.areaChart = function() {
  
};

konymp.charts.areaChart.prototype.createClass = function(name, rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
        (style.styleSheet || style.sheet).addRule(name, rules);
    else
        style.sheet.insertRule(name+"{"+rules+"}",0);
};

konymp.charts.areaChart.prototype.drawAreaChart = function(title, labelNames, seriesSet, properties) {
  	var chart = new Chartist.Line('.ct-chart', {
		labels: labelNames,
  		series: seriesSet
	}, {
  		low: parseFloat(properties._lowValue),
      	high: parseFloat(properties._highValue),
  		showArea: true,
      	showPoint: true,
      	fullWidth: true,
  		plugins: [
    		Chartist.plugins.ctAxisTitle({
    			axisX: {
        			axisTitle: properties._xAxisTitle,
        			axisClass: 'ct-axis-title',
        			offset: {
          				x: 0,
          				y: 35
        			},
        			textAnchor: 'middle'
      			},
      			axisY: {
        			axisTitle: properties._yAxisTitle,
        			axisClass: 'ct-axis-title',
        			offset: {
          				x: 0,
          				y: 13.5
        			},
        			textAnchor: 'middle',
        			flipTitle: true
      			}
    		})
  		],
    	chartPadding: {
      		bottom:10,
    		right: 40
 		}
	});
  
  	if(properties._graphColor !== "" && properties._graphColor !== null) {
      	this.createClass('.ct-series-a .ct-line', "stroke: " + properties._graphColor);
      	this.createClass('.ct-series-a .ct-point', "stroke: " + properties._graphColor);
      	this.createClass('.ct-series-a .ct-area', "fill: " + properties._graphColor);
      	this.createClass('.ct-grid', "stroke-dasharray: fill");
    }
  	
  	document.getElementById("lblTitle").style.color = properties._titleFontColor || '#000000';
  	document.getElementById("lblTitle").style.fontSize = parseInt(properties._titleFontSize)*10 + '%' ||'120%';
  	document.getElementById("lblTitle").style.fontFamily = 'Arial, Helvetica, sans-serif';
  	document.getElementById("lblTitle").innerHTML = title;
  	document.body.style.backgroundColor = properties._bgColor;
  	
  	var seq = 0, delays = 80, durations = 1000;
  
  	chart.on('created', function() {
      	seq = 0;
    });
  
  	chart.on('draw', function(data) {
        if(properties._enableGrid !== true && data.type === 'grid' && data.index !== 0) {
      		data.element.remove();
    	} 
      	if(!properties._enableChartAnimation) {
          	return;
        }
      	if(data.type === 'line') {
          	data.element.animate({
              	opacity: {
                  	begin: seq * delays +1000 ,
                  	dur: durations,
                  	from: 0,
                  	to: 1
                }
            });
        }
        else if(data.type === 'line' || data.type === 'area') {
          	data.element.animate({
              	d: {
                  	begin: seq * delays+1000,
                  	dur: durations,
                  	from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                  	to: data.path.clone().stringify(),
                  	easing: Chartist.Svg.Easing.easeOutQuint
                }
            });
      	}
      	else if(data.type === 'label' && data.axis === 'x') {
    		data.element.animate({
      			y: {
        			begin: seq * delays + 1000,
        			dur: durations,
        			from: data.y + 100,
        			to: data.y,
        			easing: 'easeOutQuart'
      			}
    		});
  		} 
      	else if(data.type === 'label' && data.axis === 'y') {
    		data.element.animate({
      			x: {
        			begin: seq * delays + 1000,
        			dur: durations,
        			from: data.x - 100,
        			to: data.x,
        			easing: 'easeOutQuart'
      			}
    		});
  		} 
      	else if(data.type === 'point') {
    		data.element.animate({
      			x1: {
        			begin: seq * delays ,
        			dur: durations,
        			from: data.x - 10,
        			to: data.x,
        			easing: 'easeOutQuart'
      			},
      			x2: {
        			begin: seq * delays,
        			dur: durations,
        			from: data.x - 10,
        			to: data.x,
        			easing: 'easeOutQuart'
      			},
      			opacity: {
        			begin: seq * delays,
        			dur: durations,
        			from: 0,
        			to: 1,
        			easing: 'easeOutQuart'
      			}
    		});
        }  		
 		if(properties._enableGrid === true && properties._enableGridAnimation === true ) {
   			seq++;
          	if(data.type === 'grid') {
    			var pos1Animation = {
      				begin: seq * delays,
      				dur: durations,
      				from: data[data.axis.units.pos + '1'] - 30,
      				to: data[data.axis.units.pos + '1'],
      				easing: 'easeOutQuart'
    			};
    			var pos2Animation = {
      				begin: seq * delays,
      				dur: durations,
      				from: data[data.axis.units.pos + '2'] - 100,
      				to: data[data.axis.units.pos + '2'],
      				easing: 'easeOutQuart'
    			};
    			var animations = {};
    			animations[data.axis.units.pos + '1'] = pos1Animation;
    			animations[data.axis.units.pos + '2'] = pos2Animation;
    			animations['opacity'] = {
      				begin: seq * delays,
        			dur: durations,
      				from: 0,
      				to: 1,
      				easing: 'easeOutQuart'
    			};
    			data.element.animate(animations);
  			}
       	}
    });
  
  	chart.on('created', function() {
  		if(window.__exampleAnimateTimeout) {
    		clearTimeout(window.__exampleAnimateTimeout);
    		window.__exampleAnimateTimeout = null;
  		} 	
	});
};

var drawCanvasChart=  function(){
  	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    	return true;
	}
  	var dataSet = [
              	{lblName: 'Data1', dataVal: 9},
              	{lblName: 'Data2', dataVal: 2},
              	{lblName: 'Data3', dataVal: 5},
              	{lblName: 'Data4', dataVal: 12},
            ];
  	var labels, series;
    labels = dataSet.map(function(obj) {
    	return obj.lblName;
   	});
    series = dataSet.map(function(obj) {
    	return Number(obj.dataVal);
    });
  	var prop = {
      	_lowValue: "0",
      	_highValue: "15",
      	_graphColor: '#1B9ED9', 
      	_xAxisTitle: 'data', 
      	_yAxisTitle: 'value', 
      	_titleFontColor: '#000000', 
      	_titleFontSize: 15, 
      	_bgColor: '#ffffff',
      	_enableGrid: true,
      	_enableGridAnimation: true,
      	_enableChartAnimation: true,
        _enableStaticPreview: true
    };
  	var x = new konymp.charts.areaChart();
  	x.drawAreaChart('Area Chart', labels, [series], prop);
};
window.addEventListener("DOMContentLoaded", function() {
 setTimeout(onbodyload, 0);
}.bind(this), false);
onbodyload = function(){
 if(typeof kony !== "undefined") {
   kony.evaluateJavaScriptInNativeContext("chart_areaChart_defined_global('ready')");
 } else {
	drawCanvasChart();
 }
}.bind(this);
