angular.module('controllers',[])

.controller('TabCtrl', ["$scope", "$filter", "AppSv", "UiSv",
	function($scope, $filter, AppSv, UiSv) {
  	$scope.AppSv = AppSv;
  	$scope.UiSv = UiSv;
  	$scope.omintData = $scope.AppSv.getData();

	$scope.range = function(min, max, step) {
	    step = parseInt(step || 1);
	    var input = [];
	    for (var i = parseInt(min); i <= parseInt(max); i += step) {
	        input.push(parseInt(i));
	    }
	    return input;
	}

	$scope.save = function() {
		$scope.AppSv.save(JSON.parse(angular.toJson($scope.omintData)));
	}

	$scope.getPlanItemLabel = function(planItem) {
		if (planItem.unHijoMenor) {
			return 'Hijo 1';
		}
		if (planItem.masDeUnHijoMenor) {
			return 'Hijo 2+';
		}
		return planItem.edadInicial + '-' + planItem.edadFinal;
	}

	$scope.getAporteLabel = function(aporte) {
		if (aporte.esMenor) {
			return 'Es menor ('+aporte.edad+') , no aporta';
		}
		if (!aporte.aportes) {
			return 'Adulto ('+aporte.edad+'), no aporta';
		}
		return 'Adulto ('+aporte.edad+') $' + $filter('number')(aporte.aportes,2);
	}

	$scope.showTab = function(keyTab) {
		for (var i in $scope.tabs) {
			$scope.tabs[i].activo = keyTab == i ? true : false;
		}
	}

	$scope.$watch("AppSv.getData()",function(){
		$scope.omintData = $scope.AppSv.getData();
	},true);

	console.log('TabCtrl',$scope);
}])

.controller('CotizarTabCtrl', ["$scope", "$filter", 
	function($scope, $filter) {
	$scope.aportes = [];
	$scope.aporta = true;
	$scope.cotizacion = [];

	$scope.tabs = {
		calculadora:{
			nombre:'calculadora',
			label:'Calculadora',
			activo:true
		},
		cotizacion:{
			nombre:'cotizacion',
			label:'Cotizacion',
			activo:0
		}
	}

	$scope.showTab = function(keyTab) {
		for (var i in $scope.tabs) {
			$scope.tabs[i].activo = keyTab == i ? true : false;
		}
	}

	$scope.totalAporte = function(aportes) {
		return ((aportes / $scope.omintData.calculadora.divisor )
				* (	$scope.omintData.calculadora.multiplicador / 100));
	}

	$scope.totalAportes = function() {
		var totalAportes = 0;
		$scope.aportes.forEach(function(model){
			totalAportes+=$scope.totalAporte(model.aportes);
		});
		return totalAportes;
	}

	$scope.init = function() {
		$scope.model = {
			aportes:null,
			esMenor:false,
			edad:0
		}
	}

	$scope.init();

	$scope.aportar = function() {
		if (!$scope.model.edad) {
			return;
		}
		$scope.aportes.push($scope.model);
		$scope.init();
	}

	$scope.borrarAportes = function() {
		$scope.init();
		$scope.aportes = [];
		$scope.aporta = true;
		$scope.cotizacion = [];
	}

	$scope.borrarAportesUi = function() {
		$scope.UiSv.confirmUi({
			cssClass: 'popover-omint',
			title: 'Aportes <i class="icon ion-minus-circled"></i>',
			subTitle: 'Eliminar',
			template: 'Está seguro que desea eliminar todos los aportes?',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Borrar',
			okType: 'button-royal'
		},function(res) {
			$scope.borrarAportes();
		});
	};


	$scope.borrarAporte = function(aporte) {
		var index = $scope.aportes.indexOf(aporte);
		$scope.aportes.splice(index,1);
		$scope.cotizar();
	}

	$scope.borrarAporteUi = function(aporte) {
		$scope.UiSv.confirmUi({
			cssClass: 'popover-omint',
			title: 'Aportes <i class="icon ion-minus-circled"></i>',
			subTitle: 'Eliminar',
			template: 'Está seguro que desea eliminar el aporte?',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Borrar',
			okType: 'button-royal'
		},function(res) {
			$scope.borrarAporte(aporte);
		});
	};


	$scope.cotizarPlan = function(plan) {
		var totalAportes = $scope.totalAportes();
		var menores = 0;
		var valorMenor1 = 0;
		var valorMenorMasDe1 = 0;
		var totalAportan = 0;
		var totalMenores = 0;

		var cotizacionItem = {
			planItem:null,
			aporte:null,
			descuento:0,
			valor:0,
			total:0
		}

		var cotizacion = {
			plan:plan,
			items:[],
			total:0,
			totalAportes:totalAportes
		}

		$scope.aportes.forEach(function(aporte){
			if (aporte.esMenor) {
				menores++;
			}
		});

		plan.items.forEach(function(planItem){
			if (menores && planItem.unHijoMenor) {
				valorMenor1 = parseFloat(planItem.valor);
			} else if (menores > 1 && planItem.masDeUnHijoMenor) {
				valorMenorMasDe1 = parseFloat(planItem.valor);
			}
		});

		menores = 0;
		$scope.aportes.forEach(function(aporte){
			var edad = parseInt(aporte.edad);
			var edadInicialDescuento = parseInt($scope.omintData.calculadora.edadInicialDescuento);
			var edadFinalDescuento = parseInt($scope.omintData.calculadora.edadFinalDescuento);
			var found = false;
			for (var i=0; i < plan.items.length; i++) {
				var planItem = plan.items[i];
				if (aporte.esMenor && (planItem.unHijoMenor || planItem.masDeUnHijoMenor)) {
					var item = JSON.parse(JSON.stringify(cotizacionItem));
					item.aporte = aporte;
					item.planItem = planItem;
					menores++;
					if (menores == 1) {
						item.valor = valorMenor1;
					} else {
						item.valor = valorMenorMasDe1;
					}
					item.total = item.valor;
					totalMenores+= item.total;
					cotizacion.total+=item.total;
					cotizacion.items.push(item);
					break;
				} else if (!aporte.esMenor) {
					var item = JSON.parse(JSON.stringify(cotizacionItem));
					item.aporte = aporte;
					item.planItem = planItem;					
					var ini = parseInt(planItem.edadInicial);
					var fin = parseInt(planItem.edadFinal);
					if ( ini <= edad && fin >= edad ) {
						item.valor = parseFloat(planItem.valor);
						item.total = item.valor;
						if (aporte.aportes && plan.descuento && 
							edadInicialDescuento <= edad && edadFinalDescuento >= edad
						) {
							item.descuento = plan.descuento;
							item.total = item.total * (100 - plan.descuento) / 100;
						}
						cotizacion.total+=item.total;
						totalAportan+=item.total;
						cotizacion.items.push(item);
						break;						
					}
				}				
			}
		});

		cotizacion.total = totalAportes - (totalMenores + totalAportan);
		cotizacion.total = cotizacion.total < 0 ? (cotizacion.total * -1) : 0

		return cotizacion;
	}

	$scope.cotizar = function() {
		$scope.cotizacion = [];
		if (!$scope.aportes.length) {
			return;
		}
		var totalAportes = $scope.totalAportes();
		/**/
		$scope.omintData.planes.forEach(function(plan){
			var cotizacion = $scope.cotizarPlan(plan);
			$scope.cotizacion.push(cotizacion);
		});
		/**/
		//$scope.cotizacion.push($scope.cotizarPlan($scope.omintData.planes[0]));
	}

	$scope.$watch('aportes',function(){
		$scope.cotizar();
	},true);

	console.log('CotizarTabCtrl',$scope);
}])

.controller('ConfiguracionTabCtrl', ["$scope", "$filter", "$cordovaClipboard", 
	function($scope, $filter, $cordovaClipboard) {
	$scope.showFormPlan = false;

	$scope.tabs = {
		plan:{
			nombre:'plan',
			label:'Planes',
			activo:true
		},
		calculadora:{
			nombre:'calculadora',
			label:'Calculadora',
			activo:0
		},
		configuracion:{
			nombre:'configuracion',
			label:'Configuración',
			activo:0
		}
	}

	$scope.showTab = function(keyTab) {
		for (var i in $scope.tabs) {
			$scope.tabs[i].activo = keyTab == i ? true : false;
		}
	}	

	$scope.init = function() {
		$scope.model = {
			configuracion:null,
			calculadora: $scope.AppSv.getData().calculadora,
			plan:{
				nombre:null,
				descuento:null,
				items:[]
			},
			planItem:{
				edadInicial:0,
				edadFinal:0,
				valor:null,
				unHijoMenor:false,
				masDeUnHijoMenor:false
			}
		}
	}

	$scope.init();

	$scope.guardarCalculador = function() {
		$scope.omintData.calculadora = $scope.model.calculadora;
		$scope.save();
	}

	$scope.crearPlan = function() {
		$scope.omintData.planes.push($scope.model.plan);
		$scope.init();
		$scope.toggleShowPlan();
		$scope.save();
	}

	$scope.toggleShowPlan = function() {
		$scope.init();
		$scope.showFormPlan = !$scope.showFormPlan;
	}

	$scope.borrarPlan = function(plan) {
		var index = $scope.omintData.planes.indexOf(plan);
		$scope.omintData.planes.splice(index,1);
		$scope.save();
	}

	$scope.borrarPlanUi = function(plan) {
		$scope.UiSv.confirmUi({
			cssClass: 'popover-omint',
			title: 'Planes <i class="icon ion-minus-circled"></i>',
			subTitle: 'Eliminar '+plan.nombre,
			template: 'Está seguro que desea eliminar el plan?',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Borrar',
			okType: 'button-royal'
		},function(res) {
            $scope.borrarPlan(plan);
		});
	};

	$scope.crearPlanItem = function(plan) {
		var indexPlan = $scope.omintData.planes.indexOf(plan);
		var plan = plan;
		var planItem = $scope.model.planItem;
		plan.items.push(planItem);
		$scope.omintData.planes[indexPlan] = plan;
		$scope.init();
		$scope.save();
	}

	$scope.borrarPlanItem = function(plan,planItem) {
		var indexPlan = $scope.omintData.planes.indexOf(plan);
		var indexPlanItem = $scope.omintData.planes[indexPlan].items.indexOf(planItem);
		$scope.omintData.planes[indexPlan].items.splice(indexPlanItem,1);
		$scope.save();
	}

	$scope.borrarPlanItemUi = function(plan,planItem) {
		$scope.UiSv.confirmUi({
			cssClass: 'popover-omint',
			title: 'Plan ' + plan.nombre + ' <i class="icon ion-minus-circled"></i>',
			subTitle: 'Eliminar '+$scope.getPlanItemLabel(planItem),
			template: 'Está seguro que desea eliminar el item?',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Borrar',
			okType: 'button-royal'
		},function(res) {
            $scope.borrarPlanItem(plan,planItem);
		});
	}

	$scope.editarPlanNombreUi = function(plan) {
		$scope.UiSv.promptUi({
			cssClass: 'popover-omint',
			title: 'Planes <i class="icon ion-edit"></i>',
			subTitle: 'Editar '+plan.nombre,
			template: 'Ingrese el nuevo nombre',
			inputType: 'text',
			defaultText: plan.nombre,
			inputPlaceholder:'Ejemplo: Genesis',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Guardar',
			okType: 'button-royal'
		},function(res) {
			if (res.length) {
				plan.nombre = res;
	            $scope.save();
			}
		});
	}

	$scope.editarPlanDescuentoUi = function(plan) {
		$scope.UiSv.promptUi({
			cssClass: 'popover-omint',
			title: 'Planes <i class="icon ion-edit"></i>',
			subTitle: 'Editar '+plan.nombre,
			template: 'Ingrese el nuevo descuento',
			inputType: 'text',
			defaultText: plan.descuento,
			inputPlaceholder:'Ejemplo: 15',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Guardar',
			okType: 'button-royal'
		},function(res) {
			if (res>0) {
				plan.descuento = parseInt(res);
	            $scope.save();
			}
		});
	}

	$scope.editarPlanItemValorUi = function(plan,planItem) {
		$scope.UiSv.promptUi({
			cssClass: 'popover-omint',
			title: 'Plan ' + plan.nombre + ' <i class="icon ion-edit"></i>',
			subTitle: 'Editar '+$scope.getPlanItemLabel(planItem),
			template: 'Ingrese el nuevo valor',
			inputType: 'text',
			defaultText: planItem.valor,
			inputPlaceholder:'Ejemplo: 1311.89',
			cancelText: 'Cancelar',
			cancelType: 'button-light',
			okText: 'Guardar',
			okType: 'button-royal'
		},function(res) {
			if (res) {
				planItem.valor = parseFloat(res);
				planItem.valor = planItem.valor.toFixed(2);
	            $scope.save();
			}
		});
	}

    $scope.copyText = function(value) {
        $cordovaClipboard.copy(value).then(function() {
            console.log("Copied text");
        }, function() {
            console.error("There was an error copying");
        });
    }

    $scope.copiarConfiguracion = function() {
    	$scope.copyText(JSON.stringify($scope.AppSv.getData()));
    }

    $scope.importarConfiguracion = function() {
    	var configuracion = JSON.parse($scope.model.configuracion);
    	$scope.AppSv.save(configuracion);
    }

	$scope.$watch("AppSv.getData()",function(){
		$scope.init();
	},true);    

	console.log('ConfiguracionTabCtrl',$scope);
}]);