/**
 * Inspiration:
 *   http://jsfiddle.net/sebastian_derossi/PYxu7/
 *
 * @author  Ikaros Kappler
 * @date    2016-03-12
 * @version 1.0.0
 **/

(function($) {

    $( document ).ready( function() {

	var canvasWidth  = 800;
	var canvasHeight = 600;
	var origin       = { x : canvasWidth/2.0,
			     y : canvasHeight/2.0
			   };

	var Color = function(r,g,b) {
	    this.r = r;
	    this.g = g;
	    this.b = b;
	    this.toString = function() { return "rgb(" + this.r + "," + this.g + "," + this.b +")"; };
	    this.interpolate  = function(color,t) {
		return new Color( Math.floor(this.r + (color.r-this.r)*t),
				  Math.floor(this.g + (color.g-this.g)*t),
				  Math.floor(this.b + (color.b-this.b)*t)
				);
	    };
	};
	// This function currently only understands '#xxxxxx' hex and 'rgb(r,g,b,)' colors.
	Color.parse = function(str) {
	    if( !str || str.length == 0 )
		return new Color();
	    if( str.startsWith("#") ) {
		var num = patseInt( str.substring(1).trim(), 16 );
		return new Color( (num>>16)&0xFF, (num>>8)&0xFF, num&0xFF );
	    } else if( str.startsWith("rgb(") && str.endsWith(")") && str.length > 5 ) {
		var list = JSON.parse( "[" + str.substring(4,str.length-1) + "]" );
		//console.debug( "str=" + str + ", list=" + JSON.stringify(list) );
		return new Color( list[0]*1, list[1]*1, list[2]*1 );
	    } else		
		throw "Unrecognized color format: " + str + ".";
	};
	
	function onTriangleMouseOver( event ) {
	    //console.debug( "[mouse over]" );
	    //console.debug( "Event: " + event + ", hIndex=" + event.target.hIndex + ", vIndex=" + event.target.vIndex );
	    //event.target.color = "#"+((1<<24)*Math.random()|0).toString(16);
	    //IKRS.Regular2DTriangulation.fillTriangle( event.target );
	}

	function onTriangleInit( triangle ) {
	    // Valid event listener names are
	    // - click
	    // - mousedown
	    // - dblclick
	    // - pressmove
	    // - pressup
	    // - mouseover / mouseout
	    // - rollover / rollout
	    // triangle.addEventListener( "mouseover", onTriangleMouseOver );
	    //var relativeDistance = Math.sqrt( Math.pow(triangle.hIndex,2) + Math.pow(triangle.vIndex,2) );
	    var distance         = { x : triangle.position.x-origin.x,
				     y : triangle.position.y-origin.y
				   };
	    var relativeDistance = Math.sqrt( Math.pow(distance.x,2) + Math.pow(distance.y,2) );
	    var intensity        = Math.min( 1.0,
					     relativeDistance / (Math.min( canvasWidth, canvasHeight )/2.0 )
					   );
	    //console.debug( "distance=" + JSON.stringify(distance) + ", relativeDistance=" + relativeDistance + ", intensity=" + intensity );
	    // ORANGE AND COLORFUL
	    //    triangle.color = "#" + Math.floor(0xFF8800*intensity*2).toString(16);

	    // ORANGE ON BLACK
	    /*
	    intensity = 1.0-intensity;
	    triangle.color = 
		"rgb(" + Math.round(255*intensity) + "," +
		Math.round(64*intensity) + "," +
		Math.round(0*intensity) + ")";
	    */
	    // ORANGE WITH SOME RANDOM BITS
	    /*
	    intensity *= (1.0 - Math.random()*0.3 );
	    intensity = 1.0-intensity;
	    triangle.color = 
		"rgb(" + Math.round(255*intensity) + "," +
		Math.round(64*intensity) + "," +
		Math.round(0*intensity) + ")";
	    */
	    var additional = Math.random()*0.5;
	    intensity = 1.0-intensity;
	    triangle.color = 
		"rgb(" + Math.round(255*intensity) + "," +
		Math.min(255,Math.round(64*intensity+192*additional)) + "," +
		Math.min(255,Math.round(0*intensity+255*additional)) + ")";
	    //console.debug( "intensity=" + intensity + ", color=" + triangle.color );
	}
	// Init
	var canvas  = $( "#triangleCanvas" );
	var context = canvas[0].getContext( "2d" );
	window.triangulation = new IKRS.Regular2DTriangulation( { canvas         : canvas[0],
								  context        : context,
								  size           : 32,
								  width          : canvasWidth,
								  height         : canvasHeight,
								  origin         : origin,
								  up             : false,
								  onTriangleInit : onTriangleInit
								} );
	var activeTriangles = {};
	var triangleListener =  function(event,triangle) {
	    // Do not overwrite existing objects
	    var tmp = {}; // | activeTriangles[triangle.id];
	    tmp.triangle   = triangle;
	    tmp.startColor = new Color(128,0,128);
	    tmp.endColor   = Color.parse(triangle.color);
	    tmp.alpha      = 0.0;
	    activeTriangles[triangle.id] = tmp;
	};
	window.triangulation.addTriangleListener( "mousemove", 
						  triangleListener
						);


	window.triangulation.draw( context );

	function animate() {

            console.debug( "animate" );
	    // Interpolate all colors of active triangles and repaint them
	    for( var id in activeTriangles ) {
		var sc = activeTriangles[id].startColor;
		var ec = activeTriangles[id].endColor;
		var al = activeTriangles[id].alpha;
		var co = sc.interpolate(ec,al);
		var tmp = activeTriangles[id].triangle.color;
		activeTriangles[id].triangle.color = co.toString();
		activeTriangles[id].triangle.draw( context );
		activeTriangles[id].triangle.color = tmp;
		activeTriangles[id].alpha += 0.005;
		if( activeTriangles[id].alpha >= 1 )
		    delete activeTriangles[id];
		
		//console.debug( "#activeTriangles=" + Object.keys(activeTriangles).length );
	    }

            // request new frame
            requestAnimationFrame( function() {
		animate();
            } );
	} 
	animate();
    } ); // END init

})(jQuery);
