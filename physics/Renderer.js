// Renderer.js
// Copyright (c) Christoph Pacher (http://www.christophpacher.com)

/*
var PeriodicalExecuterUserData = Class.create(PeriodicalExecuter,
{
        initialize: function($super, callback, frequency, userdata)
        {
                this.userdata = userdata;
                $super(callback, frequency);
        }

}); 
*/
var Renderer ={
	mLineImgPathS: 'images/',
	drawLine: function ( lineObjectHandle, Ax, Ay, Az, Bx, By, Bz)
	{
		var xMin, yMin, xMax, yMax, boxWidth, boxHeight, tmp,
			smallEdge = 1, newSrc;
			
		if (Ax > Bx) {
			xMin = Bx;
			xMax = Ax;
		} else {
			xMin = Ax;
			xMax = Bx;
		}
		if (Ay > By) {
			yMin = By;
			yMax = Ay;
		} else {
			yMin = Ay;
			yMax = By;
		}
		
		boxWidth = xMax-xMin;
		boxHeight = yMax-yMin;
		if (boxWidth < 1) boxWidth = 1;
		if (boxHeight < 1) boxHeight = 1;
		tmp = boxWidth < boxHeight ? boxWidth : boxHeight;
			
		while( tmp>>=1 )
			smallEdge<<=1;
	
		newSrc = Renderer.mLineImgPathS + smallEdge +( (Bx-Ax)*(By-Ay)<0?"up.gif":"down.gif" );
		if( lineObjectHandle.src.indexOf( newSrc )==-1 )
			lineObjectHandle.src = newSrc;
	
		lineObjectHandle.style.width   = boxWidth	+"px";
		lineObjectHandle.style.height  = boxHeight	+"px";
		lineObjectHandle.style.left    = xMin		+"px";
		lineObjectHandle.style.top     = yMin		+"px";
		lineObjectHandle.style.zIndex 	= 99999 - ((Az + Bz)/2);
	}
    
};


Renderer.R3D = Class.create(
{
    initialize: function(pWindowDimV2D, pViewOriginV2D, pViewPortDimV2D)
    {
				this.linkRound = Math.round;
        // in meters
        this.px2m = 0.01;
        this.m2px = 1.0/this.px2m;

        // the width height of the browser window in px
        this.mWindowDimV2D = pWindowDimV2D;
        // in px (0,0) is in the upper left corner of the browser window
        this.mViewPortOriginV2D = pViewOriginV2D;
        // in px
        this.mViewPortDimV2D = pViewPortDimV2D;
        this.mViewPortExtV2D = [pViewPortDimV2D[0]/2 , pViewPortDimV2D[1]/2];
        this.mViewPortCenterV2D = [pViewOriginV2D[0] + this.mViewPortExtV2D[0],
                                   pViewOriginV2D[1] + this.mViewPortExtV2D[1]
                                  ];
        
        // in meters camera looks down on z+
        this.mCameraPosV3D = [0,0,0];
				this.stylesToCheckA = ['fontSize', 'width', 'height', 
									  'paddingLeft', 'paddingRight','paddingBottom', 'paddingTop',
									  'marginLeft', 'marginRight','marginBottom', 'marginTop', 
									  'min-height'];
				
				var cssFilesA = document.styleSheets;
				this.cssRulesA;
				var l = cssFilesA.length;
				var i = 0;
				for (; i < l; i++){
					if (cssFilesA[i].href){
						if (cssFilesA[i].href.search(/style\.css/) != -1 ){
					 		if (cssFilesA[i].cssRules){
								this.cssRulesA = cssFilesA[i].cssRules;
							}else if (cssFilesA[0].rules){
								this.cssRulesA = cssFilesA[i].rules;
							}
						}
					}
				}
				jQuery(document.body).append("<div id='lineContainer'></div>");
				this.mLineContainer = jQuery('#lineContainer');
				this.mLineContainer.append("<div id='linePreload' class='hidden'></div>");
				var preloadCon = jQuery('#linePreload');
				var i = 1;
				for(;i <=256; i*=2) {
					preloadCon.append("<img src='"+Renderer.mLineImgPathS + i + "up.gif'/>");
					preloadCon.append("<img src='"+Renderer.mLineImgPathS + i + "down.gif'/>");
				}
    },
    //to righthanded system
    // vV3D[2] needs to be the target worldspace z value,computes
    // the corresponding world x y coords
    screen2world: function(vV3D)
    {
        var zView = (vV3D[2] - this.mCameraPosV3D[2]);
        return [
            ((vV3D[0] - this.mViewPortOriginV2D[0] - this.mViewPortExtV2D[0]) * this.px2m) * zView + this.mCameraPosV3D[0],
            (((this.mViewPortOriginV2D[1] + this.mViewPortExtV2D[1]) - vV3D[1]) * this.px2m) * zView + this.mCameraPosV3D[1],
            vV3D[2]
        ]
    },
    world2screen: function(vV3D, zView)
    {
        //var zView = (vV3D[2] - this.mCameraPosV3D[2]);
        return [
            ((vV3D[0] - this.mCameraPosV3D[0]) / zView * this.m2px) + this.mViewPortOriginV2D[0] + this.mViewPortExtV2D[0],
            (this.mViewPortOriginV2D[1] + this.mViewPortExtV2D[1]) - ((vV3D[1] - this.mCameraPosV3D[1]) / zView  * this.m2px),
            zView * this.m2px
        ]
    },
	saveStartDimensions: function(pElementO, pLevelN, pContainerO){
		
		pLevelN++
		var allElementStylesA = new Array();
		var savedElementStylesA = new Array();
		var elementClassesA = pElementO.className.split(" ");
		var l = elementClassesA.length;
		var ll = this.cssRulesA.length;
		var llll = this.stylesToCheckA.length;
		var selectorN = elClassN = cssRulN = stylCheckN = lll = selectorsA = styleValS = styleValN = typeS = st = 0;
		var pElementJQO = jQuery(pElementO);
		var pElementPTO = $(pElementO);
		
		if(pLevelN != 1) pElementO.containerElementO = pContainerO;
		if(pLevelN == 1) {
			pElementO.savedStylesA = new Array();
			
			allElementStylesA.push(new Array('width', pElementPTO.getWidth(), 'px'));
			allElementStylesA.push(new Array('height', pElementPTO.getHeight(), 'px'));
		}
		
		// only styles that are directly applied to elements via a class will be
		// automaticly saved and scaled by the engine. 
		for (; elClassN < l; elClassN++){ 
			cssRulN = 0;
			// the elements marked with classes, that i do not want to scale
			if (elementClassesA[elClassN] == 'jsHide' || elementClassesA[elClassN] == 'hidden') 
				return;
				
			for (; cssRulN < ll; cssRulN++){ 
				
				var text = this.cssRulesA[cssRulN].selectorText;
				if (text){
					selectorsA = this.cssRulesA[cssRulN].selectorText.split(', ');
					var c = elementClassesA[elClassN];
					
					selectorN = 0;
					lll = selectorsA.length;
					for (; selectorN < lll; selectorN++){ 
						
						if (selectorsA[selectorN] == '.'+elementClassesA[elClassN]){
							
							stylCheckN = 0;
							for (; stylCheckN < llll; stylCheckN++){
								st = this.stylesToCheckA[stylCheckN];
								if (stylCheckN == 11){ 
									st = 'minHeight';
								}
								styleValS = this.cssRulesA[cssRulN].style[st];
								styleValN = parseFloat(styleValS);
								if (styleValN != 0 && styleValS !== ""){
									typeS = -1;
									if (styleValS.indexOf('px') > 0) typeS = 'px';
									else if (styleValS.indexOf('em') > 0) typeS = 'em';
									else if (styleValS.indexOf('pt') > 0) typeS = 'pt';
									else if (styleValS.indexOf('%') > 0) typeS = '%';
									
									allElementStylesA.push([st,styleValN, typeS]);
								}
							}
						}
					}
				}
			}
		}
		

		if(pElementO.nodeName == 'IMG' ) {
			var l = allElementStylesA.length;
			var noWidth = true;
			for (var i = 0; i < l; i++){
				if (allElementStylesA[i]['width']) noWidth = false;	
			}
			/*
			var w = pElementJQO.width();
			var h = pElementJQO.height();
			if (h < 20) {
				console.log('toosmal');
				console.log(pElementJQO);
				new PeriodicalExecuterUserData(function(pe) {
					pe.userdata.ContainerO.savedStylesA.push([pe.userdata.ElementO, [['width', pe.userdata.ElementJQO.width(), 'px'],['height', pe.userdata.ElementJQO.height(), 'px']]]);
				  pe.stop();
				}, 2, {ElementJQO: pElementJQO, ElementO: pElementO, ContainerO: pContainerO});
			} else {
				allElementStylesA.push(['width', pElementJQO.width(), 'px']);
				allElementStylesA.push(['height', pElementJQO.height(), 'px']);
			}
			*/
			if (noWidth) {
				allElementStylesA.push(['width', pElementO.width, 'px']);
				allElementStylesA.push(['height', pElementO.height, 'px']);
			}
		}
		
		if (allElementStylesA.length > 0) pContainerO.savedStylesA.push([pElementO, allElementStylesA]);
		
		l = pElementO.children.length;
		i = 0;
		if ( l > 0 ) {
			var i = 0;
			for (; i < l; i++) this.saveStartDimensions(pElementO.children[i], pLevelN, pContainerO);
		}
	},
    scaleWithContent: function(pElementO, pScaleN)
    {
		var l = pElementO.savedStylesA.length;
		var ll = i = j = element = stylesA = value = 0;

		for (; i < l; i++){
			element = pElementO.savedStylesA[i][0];
			stylesA = pElementO.savedStylesA[i][1];
			ll = stylesA.length;
			j = value = 0;
			for (; j < ll; j++){
				switch(stylesA[j][2]){
					case "px":
						value = stylesA[j][1] * pScaleN;
						if (value < 0.5) value = 0.5;
						element.style[stylesA[j][0]] =  value + "px";
						break;
					case "em":
						value = stylesA[j][1] * pScaleN;
						if (element.className == "entry-title" && value < 1.5) value = 1.5; 
						else if (value < 0.05) value = 0.05;
						element.style[stylesA[j][0]] = value  + "em";
						break;
					case "pt":
						value = stylesA[j][1] * pScaleN;
						if (value < 0.4) value = 0.4;
						element.style[stylesA[j][0]] = value  + "pt";
						break;
					case "%":
						value = stylesA[j][1] * pScaleN;
						if (value < 5) value = 5;
						element.style[stylesA[j][0]] = value  + "%";
						break;
					default:
						break;
				}
			}		
		}	
	},
	draw: function(pP)
    {
        var style = pP.mSpriteO.style;
        var zView = pP.mPosV3D[2] - this.mCameraPosV3D[2];
        
		if (zView > 0.3)
        {
			var matv = V3DP;
            var posScreenV3D = this.world2screen
            ([
                 pP.mPosV3D[0],
                 pP.mPosV3D[1],
                 pP.mPosV3D[2]
            ], zView);
            
			var scaleFactor =  pP.mScaleN / zView;
			var scaleFactorPx = scaleFactor * this.m2px;
			var width = pP.mExtV3D[0] * scaleFactorPx;
			var height = pP.mExtV3D[1] * scaleFactorPx;
			
			pP.mSpriteO.posScreenV3D = posScreenV3D;
			
			style.left = this.linkRound (posScreenV3D[0] - width) + "px";
			style.top =  this.linkRound (posScreenV3D[1] - height) + "px";
			style.zIndex = 100000 - this.linkRound (posScreenV3D[2]);
			
			if (pP.mOldRenderScaleN != scaleFactor){
				if (pP.mSpriteO.scaleContent){
					this.scaleWithContent(pP.mSpriteO, scaleFactor);
				} else {
					
					style.width = this.linkRound (width * 2 ) + "px";
					style.height = this.linkRound (height * 2 ) + "px";
				}
				pP.mOldRenderScaleN = scaleFactor;
			}
			
			style.visibility = "visible";
			
			// comment this out to disable sleep state colour
			if(pP.mSleepsB) style.backgroundColor = "#00CC00";
			else style.backgroundColor = "#CC0000";
        }
        else
        {
            style.left = 0 + "px";
            style.top =  0 + "px";
            style.visibility = "hidden";
        }
    }
});

Renderer.R2D = Class.create(
{
    initialize: function(pWindowDimV2D, pViewOriginV2D, pViewPortDimV2D)
    {
		this.linkRound = Math.round;
        // in meters
        this.px2m = 0.01;
        this.m2px = 1.0/this.px2m;

        // the width height of the browser window in px
        this.mWindowDimV2D = pWindowDimV2D;
        // in px (0,0) is in the upper left corner of the browser window
        this.mViewPortOriginV2D = pViewOriginV2D;
        // in px
        this.mViewPortDimV2D = pViewPortDimV2D;
        this.mViewPortExtV2D = [pViewPortDimV2D[0]/2 , pViewPortDimV2D[1]/2];
        this.mViewPortCenterV2D = [pViewOriginV2D[0] + this.mViewPortExtV2D[0],
                                   pViewOriginV2D[1] + this.mViewPortExtV2D[1]
                                  ];

        // in meters camera looks down on z+
        this.mCameraPosV3D = [0,0,0];
    },
    //to righthanded system
    screen2world: function(vV3D)
    {
        return [
            ((vV3D[0] - this.mViewPortOriginV2D[0]) * this.px2m) + this.mCameraPosV3D[0],
            (((this.mViewPortOriginV2D[1] + this.mViewPortDimV2D[1]) - vV3D[1]) * this.px2m) + this.mCameraPosV3D[1],
            vV3D[2]
        ]
    },
    world2screen: function(vV3D)
    {
        return [
            ((vV3D[0] - this.mCameraPosV3D[0]) * this.m2px) + this.mViewPortOriginV2D[0],
            (this.mViewPortOriginV2D[1] + this.mViewPortDimV2D[1]) - ((vV3D[1] - this.mCameraPosV3D[1]) * this.m2px),
            vV3D[0]* this.m2px
        ]
    },
    draw: function(pP)
    {
        var style = pP.mSpriteO.style;
        var width = pP.mExtV3D[0] * pP.mScaleN ;
        var height = pP.mExtV3D[1] * pP.mScaleN ;


        var zView = pP.mPosV3D[2] - this.mCameraPosV3D[2];
        if (zView > 0.3)
        {
            var posScreenV3D = this.world2screen
            ([
                (pP.mPosV3D[0] - width),
                (pP.mPosV3D[1] + height),
                 pP.mPosV3D[2]
            ]);
            style.left = this.linkRound (posScreenV3D[0]) + "px";
            style.top =  this.linkRound (posScreenV3D[1]) + "px";
            style.zIndex = 100000 - this.linkRound (posScreenV3D[2]);
            style.width = this.linkRound (width * 2 * this.m2px) + "px";
            style.height = this.linkRound (height * 2 * this.m2px) + "px";
            style.visibility = "visible";
            if(pP.mSleepsB) style.backgroundColor = "#00CC00";
            else style.backgroundColor = "#CC0000";
            if (pP.mSpriteO.startFontSize > 0)
                style.fontSize = this.linkRound(pP.mSpriteO.startFontSize * pP.mScaleN) + pP.mSpriteO.fontSizeType;
        }
        else
        {
            style.left = 0 + "px";
            style.top =  0 + "px";
            style.visibility = "hidden";
        }
    }
});


