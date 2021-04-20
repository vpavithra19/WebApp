/**
 * Created by Team Kony.
 * Copyright (c) 2017 Kony Inc. All rights reserved.
 */
/**
 * @controller: Area Chart UDW
 * @author: Tejaswini Tubati and Sumeet Bartha
 * @category: Reusable Component
 * @componentVersion: 1.0
 * @description: Generates area chart by taking the required parameters as input
 */
define(function() {
  	var konyLoggerModule = require('com/konymp/areachart/konyLogger');
  	konymp = {};
  	konymp.logger = new konyLoggerModule("Area Chart Component");
  	return {
    	/**
	  	 * @function constructor
         * @private
		 * @params {Object} baseConfig, layoutConfig, pspConfig
		 */
    	constructor: function(baseConfig, layoutConfig, pspConfig) {
			var analytics=require("com/konymp/"+"areachart"+"/analytics");
            analytics.notifyAnalytics();
      		konymp.logger.trace("----------Entering constructor---------", konymp.logger.FUNCTION_ENTRY);
          	this._chartProperties = {
              	_graphColor: "#1B9ED9",
              	_xAxisTitle: "",
              	_yAxisTitle: "",
              	_lowValue: "0",
              	_highValue: "40",
              	_bgColor: "#FFFFFF",
              	_enableChartAnimation: true,
              	_enableStaticPreview: true,
              	_enableGrid: true,
              	_enableGridAnimation: true,
              	_titleFontSize: "12",
              	_titleFontColor: "#000000"
            };
          	this._chartTitle = "";
          	this._chartData = [];
            chart_areaChart_defined_global = function(state){
              if(state ==='ready'){
              	this.showGridChart();
              }
            }.bind(this);
      		konymp.logger.trace("----------Exiting constructor ---------", konymp.logger.FUNCTION_EXIT);
    	},
    	/**
		 * @function initGetterSetters
		 * @private
         * @description: Logic for getters/setters of custom properties
		 */
    	initGettersSetters: function() {
      		konymp.logger.trace("----------Entering initGettersSetters Function---------", konymp.logger.FUNCTION_ENTRY);
          	this.hexCodeFormat = /^(#)?([0-9a-fA-F]{3})([0-9a-fA-F]{3})?$/;
      		defineSetter(this, "chartTitle", function(val) {
        		konymp.logger.trace("----------Entering chartTitle Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartTitle = val;
        		konymp.logger.trace("----------Exiting chartTitle Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "graphColor", function(val) {
        		konymp.logger.trace("----------Entering graphColor Setter---------", konymp.logger.FUNCTION_ENTRY);
        		try {
                  	if(this.hexCodeFormat.test(val)) {
                      	this._chartProperties._graphColor = val;
                    }
                  	else {
                      	throw {"Error": "InvalidGraphColorCode", "message": "The graph color code must be in hex format. Eg.:#000000"};
                    }
                }
              	catch(exception) {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                  	if(exception.Error === "InvalidGraphColorCode") {
                      	throw(exception);
                    }
                }
        		konymp.logger.trace("----------Exiting graphColor Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "xAxisTitle", function(val) {
        		konymp.logger.trace("----------Entering xAxisTitle Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartProperties._xAxisTitle = val;
        		konymp.logger.trace("----------Exiting xAxisTitle Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "yAxisTitle", function(val) {
        		konymp.logger.trace("----------Entering yAxisTitle Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartProperties._yAxisTitle = val;
        		konymp.logger.trace("----------Exiting yAxisTitle Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "titleFontColor", function(val) {
        		konymp.logger.trace("----------Entering titleFontColor Setter---------", konymp.logger.FUNCTION_ENTRY);
              	try {
                  	if(this.hexCodeFormat.test(val)) {
                      	this._chartProperties._titleFontColor = val;
                    }
                  	else {
                      	throw {"Error": "InvalidTitleFontColorCode", "message": "The title font color code must be in hex format. Eg.:#000000"};
                    }
                }
              	catch(exception) {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                  	if(exception.Error === "InvalidTitleFontColorCode") {
                      	throw(exception);
                    }
                }
        		konymp.logger.trace("----------Exiting titleFontColor Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "titleFontSize", function(val) {
        		konymp.logger.trace("----------Entering titleFontSize Setter---------", konymp.logger.FUNCTION_ENTRY);
              	try {
                  	if(!isNaN(parseInt(val))) {
                      	this._chartProperties._titleFontSize = val;
                    }
                  	else {
                      	throw {"Error": "NotNumber", "message": "Title Font Size value should be a number"};
                    }
                }
              	catch(exception) {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                  	if(exception.Error === "NotNumber") {
                      	throw(exception);
                    }
                }
        		konymp.logger.trace("----------Exiting titleFontSize Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "bgColor", function(val) {
        		konymp.logger.trace("----------Entering backgroundColor Setter---------", konymp.logger.FUNCTION_ENTRY);
              	try {
                  	if(this.hexCodeFormat.test(val)) {
                      	this._chartProperties._bgColor = val;
                    }
                  	else {
                      	throw {"Error": "InvalidBackgoundColorCode", "message": "The background color code must be in hex format. Eg.:#000000"};
                    }
                }
              	catch(exception) {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                  	if(exception.Error === "InvalidBackgoundColorCode") {
                      	throw(exception);
                    }
                }
        		konymp.logger.trace("----------Exiting backgroundColor Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "enableGrid", function(val) {
        		konymp.logger.trace("----------Entering enableGrid Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartProperties._enableGrid = val;
        		konymp.logger.trace("----------Exiting enableGrid Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "enableGridAnimation", function(val) {
        		konymp.logger.trace("----------Entering enableGridAnimation Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartProperties._enableGridAnimation = val;
        		konymp.logger.trace("----------Exiting enableGridAnimation Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
      		defineSetter(this, "enableChartAnimation", function(val) {
        		konymp.logger.trace("----------Entering enableChartAnimation Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartProperties._enableChartAnimation = val;
        		konymp.logger.trace("----------Exiting enableChartAnimation Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
          	defineSetter(this, "lowValue", function(val) {
        		konymp.logger.trace("----------Entering lowValue Setter---------", konymp.logger.FUNCTION_ENTRY);
              	try {
                  	if(!isNaN(parseInt(val))) {
                      	this._chartProperties._lowValue = val;
                    }
                  	else {
                      	throw {"Error": "NotNumber", "message": "Low/High value should be a number"};
                    }
                }
              	catch(exception) {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                  	if(exception.Error === "NotNumber") {
                      	throw(exception);
                    }
                }
        		konymp.logger.trace("----------Exiting lowValue Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
			defineSetter(this, "highValue", function(val) {
        		konymp.logger.trace("----------Entering highValue Setter---------", konymp.logger.FUNCTION_ENTRY);
              	try {
                  	if(!isNaN(parseInt(val))) {
                      	this._chartProperties._highValue = val;
                    }
                  	else {
                      	throw {"Error": "NotNumber", "message": "Low/High value should be a number"};
                    }
                }
              	catch(exception) {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                  	if(exception.Error === "NotNumber") {
                      	throw(exception);
                    }
                }
        		konymp.logger.trace("----------Exiting highValue Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
          	defineSetter(this, "chartData", function(val) {
        		konymp.logger.trace("----------Entering chartData Setter---------", konymp.logger.FUNCTION_ENTRY);
        		this._chartData = val.data;
        		konymp.logger.trace("----------Exiting chartData Setter---------", konymp.logger.FUNCTION_EXIT);
      		});
          	defineSetter(this, "enableStaticPreview", function(val) {
              	konymp.logger.trace("----------Entering enableStaticPreview Setter---------", konymp.logger.FUNCTION_ENTRY);
              	this._chartProperties._enableStaticPreview = val;
              	konymp.logger.trace("----------Exiting enableStaticPreview Setter---------", konymp.logger.FUNCTION_EXIT);
            });
          	this.view.areaChartBrowser.onPageFinished = this.showGridChart.bind(this);
      		konymp.logger.trace("----------Exiting initGettersSetters Function---------", konymp.logger.FUNCTION_EXIT);
    	},
    	/**
      	 * @function createChart
      	 * @access exposed to user
         * @param {JSON} dataSet
         * @param {String} color
         * @description: generates area chart by taking the data and the other params as input
      	 */
    	createChart: function(dataSet) {
      		konymp.logger.trace("----------Entering createChart Function---------", konymp.logger.FUNCTION_ENTRY);
      		try {
        		var labels, series, data;
        		if(dataSet !== null && dataSet !== undefined && dataSet !== "" && dataSet.length !== 0) {
          			labels = dataSet.map(function(obj) {
            			return obj.lblName;
          			});
          			series = dataSet.map(function(obj) {
            			return Number(obj.dataVal);
          			});
        		}
        		else if(this._chartData !== null && this._chartData !== undefined && this._chartData !== "" && this._chartData.length !== 0) {
          			data = this._chartData;
          			labels = data.map(function(obj) {
            			return obj.lblName;
          			});
          			series = data.map(function(obj) {
            			return Number(obj.dataVal);
          			});
        		}
              	else {
                  	throw {"Error": "noData", "message": "Data not passed to chart"};
                }
        		series = [series];
        		if(this.validateAllParams(this._chartTitle, labels, series, this._chartProperties)) {
          			this.view.areaChartBrowser.evaluateJavaScript('var chartObj = new konymp.charts.areaChart(); chartObj.drawAreaChart(' + 
                                                        			JSON.stringify(this._chartTitle) + ',' + 
                                                        			JSON.stringify(labels) + ',' + 
                                                        			JSON.stringify(series) + ',' + 
                                                        			JSON.stringify(this._chartProperties) + ')');
                  	this.view.forceLayout();
					konymp.logger.trace("----------Exiting createChart Function---------", konymp.logger.FUNCTION_EXIT);
					return true;
        		}
      		}
      		catch(exception) {
              	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
              	if(exception.Error === "noData") {
                  	throw(exception);
                }
      		}
    	},
    	/**
      	 * @function validateData
         * @private
      	 * @param {String/Array/JSON} data
         * @param {String(datatype)} type
         * @description: validates the data param based on the corresponding type param
      	 */
    	validateData: function(data, type) {
      		konymp.logger.trace("----------Entering validateData Function---------", konymp.logger.FUNCTION_ENTRY);
      		try {
              	if(type === 'array') {
        			konymp.logger.trace("----------Exiting validateData Function---------", konymp.logger.FUNCTION_EXIT);
        			return Array.isArray(data);
      			}
      			else if(typeof data === type) {
        			konymp.logger.trace("----------Exiting validateData Function---------", konymp.logger.FUNCTION_EXIT);
        			return true;
      			}
      			else {
        			konymp.logger.trace("----------Exiting validateData Function---------", konymp.logger.FUNCTION_EXIT);
        			return false;
      			}
            }
          	catch(exception) {
              	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
            }
    	},
    	/**
      	 * @function validateAllParams
      	 * @private
      	 * @params {String} title, color, xAxisTitle, yAxisTitle
      	 * @params {JS Array} labels, series 
         * @description: invokes the validation of all params and returns a true only if all are validated
      	 */
    	validateAllParams: function(title, labels, series, properties) {
      		konymp.logger.trace("----------Entering validateAllParams Function---------", konymp.logger.FUNCTION_ENTRY);
      		try {
              	if(!this.validateData(title, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for title " + JSON.stringify(title)};
      			}
      			if(!this.validateData(labels, 'array')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong datatype for labels " + JSON.stringify(labels)};
      			}
      			if(!this.validateData(series, 'array')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong datatype for series " + JSON.stringify(series)};
      			}
      			if(!this.validateData(properties._graphColor, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for graphColor " + JSON.stringify(properties._graphColor)};
      			}
      			if(!this.validateData(properties._xAxisTitle, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for xAxisTitle " + JSON.stringify(properties._xAxisTitle)};
      			}
      			if(!this.validateData(properties._yAxisTitle, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for yAxisTitle " + JSON.stringify(properties._yAxisTitle)};
      			}
      			if(!this.validateData(properties._titleFontColor, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for titleFontColor " + JSON.stringify(properties._titleFontColor)};
      			}
      			if(!this.validateData(properties._titleFontSize, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for titleFontSize " + JSON.stringify(properties._titleFontSize)};
      			}
      			if(!this.validateData(properties._bgColor, 'string')) {
        			throw {"Error": "Invalid Datatype", "message": "Wrong dataType for bgColor " + JSON.stringify(properties._bgColor)};
      			}
            }
          	catch(exception) {
              	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
              	if(exception.Error === "Invalid Datatype") {
                  	throw(exception);
                }
            }
      		konymp.logger.trace("----------Exiting validateAllParams Function---------", konymp.logger.FUNCTION_EXIT);
      		return true;
    	},
      	/**
       	 * @function showGridChart
       	 * @param dataSet 
         * @description creates the chart with the data in the data grid on browser load
       	 */
      	showGridChart: function() {
          	try {
              	if(this._chartProperties._enableStaticPreview && this._chartData.length !== 0) {
                  	this.createChart(this._chartData);
                }
              	else {
                  	throw {"Error": "NoData", "message": "No data in data grid"};
                }
            }
          	catch(exception) {
              	if(exception.Error === "NoData") {
                  	konymp.logger.error(JSON.stringify(exception), konymp.logger.EXCEPTION);
                }
            }
        }
  	};
});