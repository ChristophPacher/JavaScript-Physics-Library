// MyUtillities.js
// Copyright (c) Christoph Pacher (http://www.christophpacher.com)

var MyUtilities = {
  getWindowDimensions: function() {
    var myWidth = myHeight = 0;
    if( typeof( window.innerWidth ) == 'number' ) {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return {width: myWidth, height: myHeight};
  },
  clamp: function(a, low, high){
	return Math.max(low, Math.min(a, high));
  },
  copyArray: function(a){
      newA = new Array();
      var l = a.length;
      for (var i = 0; i < l; i++)
        {
            newA[i] = a[i];
        }
      return newA;
  }
};
