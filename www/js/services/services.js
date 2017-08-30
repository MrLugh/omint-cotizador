angular.module('services',[])

.service("AppSv",[
	function() {

  	var defaultData = {
      edadMenor:25,
      edadInicialDescuento:35,
      edadFinalDescuento:35,
  		calculadora:{
  			divisor:0.03,
  			multiplicador:7.458
  		},
  		planes:[]
  	};

    return {
    	getData:function() {
    		return JSON.parse(localStorage.getItem('omint')) || defaultData
    	},
    	save:function(data) {
        data.planes = data.planes.sort(function(a,b){
          return a.nombre > b.nombre
        });
    		var omint = JSON.stringify(data);
        localStorage.setItem('omint',omint);
    	}
	}
}])

.service("UiSv",["$http", "$q", "$ionicPopup", 
  function($http, $q, $ionicPopup) {

    var confirm = function(options,callback) {
      var confirmPopup = $ionicPopup.confirm(options);
      confirmPopup.then(function(res) {
        if(res) {
          callback(res);
        }
      });
    };

    var confirmUi = function(options,callback) {
      confirm(options,callback);
    };

    var prompt = function(options,callback) {
      var promptPopup = $ionicPopup.prompt(options);
      promptPopup.then(function(res) {
        if(res) {
          callback(res);
        }
      });
    };

    var promptUi = function(options,callback) {
      prompt(options,callback);
    };    

    return {
      confirmUi:confirmUi,
      promptUi:promptUi
    }

}])