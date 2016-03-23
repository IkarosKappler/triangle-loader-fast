/**
 * This class makes overlaying triangle patterns of regular triangles.
 *
 * It uses the create.js library.
 *
 * Please have jQuery installed (for relative mouse positions).
 *
 * @author  Ikaros Kappler
 * @date    2016-02-26
 * @version 1.0.1
 **/




/**
 * The constructor.
 *
 * The options object needs to have these members:
 * @param {canvas} options.canvas
 * @param {WebGL-Context} options.context
 * @param {number}  options.size   
 * @param {number}  options.height (optional, default is a equal-sided triangle).
 * @param {int}     options.width 
 * @param {int}     options.height 
 * @param {object}  options.origin { x, y }
 * @param {boolean} options.up     Indicates if the first triangle is upside.
 * @param {function} options.onmousein
 * @param {function} options.onmouseout
 *  -
 **/
IKRS.Regular2DTriangulation = function( options ) {

    IKRS.Object.call( this, options );

    this.options = options;
    if( typeof this.options.size == "undefined" )
	this.options.size = 32;
    if( typeof options.triangleHeight == "undefined" )
	this.options.triangleHeight = Math.sqrt( Math.pow(this.options.size,2) - Math.pow(this.options.size/2.0,2) );
    if( typeof options.width == "undefined" )
	this.options.width = 800;
    if( typeof options.height == "undefined" )
	this.options.height = 600;
    if( typeof options.origin == "undefined" )
	this.options.origin = { x : this.options.width/2.0, y : this.options.height/2.0 };
    if( typeof options.up == "undefined" )
	this.options.up = false;

    //this.options.context = this.options.canvas.getContext( "2d" );

    this.eventListeners = { "mouseover" : [],
			    "mousemove" : [],
			    "mouveout"  : [] 
			  };

    this.matrix        = new Array();
    this.triangleCount = 0;
    this._makeTriangles( this.options.size,
			 this.options.origin			 
		       );

    
    // Add listeners to canvas object
    var activeTriangle = null;
    var _self = this;
    var toRelativePosition = function( event ) {
	var tmp = $( event.target );
	return new IKRS.Regular2DTriangulation.Point( event.clientX - tmp.offset().left + $(window).scrollLeft() - _self.options.origin.x,
						      event.clientY - tmp.offset().top + $(window).scrollTop() - _self.options.origin.y );
    };
    var onMouseOver = function( event )  {
	onMouseMove( event );
    };
    var onMouseMove = function( event ) {
	var position   = toRelativePosition(event);
	var triangle   = _self.getTriangleAt( position );
	if( activeTriangle ) {
	    // Handle some mouse-over/out-triangle cases.
	    if( triangle && activeTriangle.id == triangle.id )
		_self._fireMouseEvent( "mousemove", event, activeTriangle );
	    else {
		_self._fireMouseEvent( "mouseout", event, activeTriangle );
		if( triangle ) {
		    activeTriangle = triangle;
		    _self._fireMouseEvent( "mouseover", event, activeTriangle );
		} 
		activeTriangle = triangle; // might be null
	    }
	} else if( triangle ) {
	    activeTriangle = triangle;
	    _self._fireMouseEvent( "mouseover", event, activeTriangle );
	} 
	//triangle.color = "#880088";
	//triangle.draw( _self.options.context );
    };
    var onMouseOut = function( event ) {
	if( activeTriangle ) 
	    _self._fireMouseOutEvent( event, activeTriangle );
	activeTriangle = null;
    };
    this.options.canvas.addEventListener( "mousemove", onMouseMove );

};

IKRS.Regular2DTriangulation.prototype                = Object.create( IKRS.Object.prototype );
IKRS.Regular2DTriangulation.prototype.constructor    = IKRS.Regular2DTriangulation;


IKRS.Regular2DTriangulation.prototype.addTriangleListener = function( eventName, listener ) {
    if( !this.eventListeners[eventName] )
	return false;
    this.eventListeners[eventName].push(listener);
    return true;
};

IKRS.Regular2DTriangulation.prototype._fireMouseEvent = function( eventName, event, triangle ) {
    if( !this.eventListeners[eventName] )
	return false;
    for( var i in this.eventListeners[eventName] ) {
	    this.eventListeners[eventName][i](event, triangle);
    }
    return true;
};

IKRS.Regular2DTriangulation.Point = function(x, y) {
    this.x = x;
    this.y = y;
    this.clone = function() { return new IKRS.Regular2DTriangulation.Point(this.x,this.y); };
    this.toString = function() { return "{ x : " + this.x + ", y : " + this.y + " }"; };
};

IKRS.Regular2DTriangulation.Triangle = function( points ) {
    this.points   = points; // array
    this.position = new IKRS.Regular2DTriangulation.Point(0,0);
    this.color    = null;

    this.draw = function( context ) {
	// console.debug( "Draw at " + this.position + ", color=" + this.color );
    	context.fillStyle   = this.color;
	context.strokeStyle = this.color;
	context.beginPath();
	context.moveTo( this.position.x+this.points[0].x, 
			this.position.y+this.points[0].y 
		      );
	for( var i = 1; i < this.points.length; i++ ) {
	    context.lineTo( this.position.x+this.points[i].x, 
			    this.position.y+this.points[i].y 
			  );
	}
	context.closePath();
	context.stroke();
	context.fill();
    };

    // This function looks a bit strange with the origin param.
    // But it's just a helper function.
    this._containsPoint = function( p, origin ) {
	return IKRS.Regular2DTriangulation.pointIsInTriangle(
	    p.x,
	    p.y,
	    this.points[0].x+this.position.x-origin.x,
	    this.points[0].y+this.position.y-origin.y,
	    this.points[1].x+this.position.x-origin.x,
	    this.points[1].y+this.position.y-origin.y,
	    this.points[2].x+this.position.x-origin.x,
	    this.points[2].y+this.position.y-origin.y
	);
    };
};

/**
 * position is absolute (from upper left corner).
 **/
IKRS.Regular2DTriangulation.prototype.getTriangleAt = function( position ) {

    // Event the triangulated surface has a squared raster.
    // -> locate the square (this may contain up to 3 triangles).
    var v = this._locateRow( position.y );
    var h = this._locateColumn( position.x );
 
    // Get the candidate and it's neighbours
    var left   = this.getTriangle(h-1,v);
    var middle = this.getTriangle(h,v);
    var right  = this.getTriangle(h+1,v);    

    if( left && left._containsPoint(position,this.options.origin) )
	return left;
    if( right && right._containsPoint(position,this.options.origin) )
	return right;
    //if( middle && middle._containsPoint(position,this.options.origin) )
	return middle;  // Can only be the middle
};

IKRS.Regular2DTriangulation.prototype._locateRow = function( y ) {
    //y += this.options.triangleHeight/2.0;
    return Math.floor( (y+this.options.triangleHeight/2.0) / this.options.triangleHeight );
};

IKRS.Regular2DTriangulation.prototype._locateColumn = function( x ) {
    return Math.round( x / (this.options.size/2.0)  );
};

IKRS.Regular2DTriangulation.prototype.getTriangle = function( h, v ) {
    if( !this.matrix[h] || !this.matrix[h][v] )
	return null;
    return this.matrix[h][v];
};

/**
 * Fill the area with triangles.
 **/
IKRS.Regular2DTriangulation.prototype._makeTriangles = function( size,
								 origin
							       ) {
    //console.debug( "_makeTriangles" );
    
    var tLength = this.options.size;
    var tHeight = this.options.triangleHeight;

    var up = this.options.up; // true;
    // Draw triangle rows down from origin
    var id     = 0;
    var hIndex = 0;
    for( var x = this.options.origin.x; x < this.options.width+tLength/2.0; x+= tLength/2.0 ) {
	this._makeTriangleColumn( { x : x, 
				    y : this.options.origin.y
				  },
				  tLength,
				  tHeight,
				  up,     // center triangle up?
				  hIndex
				);
	hIndex++;
	up = !up;
    }
    // Draw triangle rows up from origin
    up = !this.options.up; // false;
    hIndex = -1;
    for( var x = this.options.origin.x-tLength/2.0; x >= -tLength/2.0; x-= tLength/2.0 ) {
	this._makeTriangleColumn( { x : x, //this.options.origin.x,
				    y : this.options.origin.y
				  },
				  tLength,
				  tHeight,
				  up,     // center triangle up?
				  hIndex
			     );
	hIndex--;
	up = !up;
    }
};

IKRS.Regular2DTriangulation.prototype._makeTriangleColumn = function( pos,
								      tLength,
								      tHeight,
								      up,
								      hIndex
								    ) {
    // Build row to the right
    this.matrix[ hIndex ] = new Array();
    var tmpUp  = up;
    var vIndex = 0;
    for( var y = pos.y; y <= this.options.height+tHeight; y+= tHeight ) {	
	var triangle = this._makeTriangleAt( { x : pos.x,
					       y : y
					     },
					     tLength,
					     tHeight,
					     tmpUp,
					     hIndex, vIndex
					   );
	vIndex++;
	tmpUp = !tmpUp;
	// this.options.stage.addChild( triangle );	
    }

    // Build row to the left
    //var tmpUp = up;
    tmpUp  = !up;
    vIndex = -1;
    for( var y = pos.y-tHeight; y >= -tHeight; y-= tHeight ) {	
	var triangle = this._makeTriangleAt( { x : pos.x,
					       y : y
					     },
					     tLength,
					     tHeight,
					     tmpUp,
					     hIndex, vIndex
					   );
	vIndex--;
	tmpUp = !tmpUp;
		
    }
    
    //this.options.stage.update();
};

IKRS.Regular2DTriangulation.prototype._makeTriangleAt = function( pos,
								  tLength,
								  tHeight,
								  up,
								  hIndex,
								  vIndex
								) {
    // Draw outline?
    //triangle.graphics.beginStroke("black").setStrokeStyle(1);
    var color = "#"+((1<<24)*Math.random()|0).toString(16);
    var points = [];
    if( up ) {
	points.push( new IKRS.Regular2DTriangulation.Point( 0          , -tHeight/2.0 ) );
	points.push( new IKRS.Regular2DTriangulation.Point( tLength/2.0,  tHeight/2.0 ) );
	points.push( new IKRS.Regular2DTriangulation.Point(-tLength/2.0,  tHeight/2.0 ) );
    } else { // down
	points.push( new IKRS.Regular2DTriangulation.Point( 0          ,  tHeight/2.0 ) );
	points.push( new IKRS.Regular2DTriangulation.Point(-tLength/2.0, -tHeight/2.0 ) );
	points.push( new IKRS.Regular2DTriangulation.Point( tLength/2.0, -tHeight/2.0 ) );
    }
    var triangle          = new IKRS.Regular2DTriangulation.Triangle( points );
    triangle.color        = color;
    triangle.points       = points;       
    triangle.position.x  += pos.x;
    triangle.position.y  += pos.y;   
    triangle.hIndex       = hIndex;
    triangle.vIndex       = vIndex;
    triangle.id           = this.triangleCount;
    
    this.matrix[ hIndex ][ vIndex ] = triangle;
    this.triangleCount++;

    if( typeof this.options.onTriangleInit == "function" )
	this.options.onTriangleInit( triangle );
};

IKRS.Regular2DTriangulation.prototype.draw = function( context ) { 
    for( var h in this.matrix ) {
	for( var v in this.matrix[h] ) {
	    this.matrix[h][v].draw( context );
	}
    }
};

/**
 * Point-in-Triangle test found at
 *   http://stackoverflow.com/questions/2049582/how-to-determine-a-point-in-a-2d-triangle
 **/
IKRS.Regular2DTriangulation.pointIsInTriangle = function( px, py, p0x, p0y, p1x, p1y, p2x, p2y ) {
    var area = 1/2*(-p1y*p2x + p0y*(-p1x + p2x) + p0x*(p1y - p2y) + p1x*p2y);
    var s = 1/(2*area)*(p0y*p2x - p0x*p2y + (p2y - p0y)*px + (p0x - p2x)*py);
    var t = 1/(2*area)*(p0x*p1y - p0y*p1x + (p0y - p1y)*px + (p1x - p0x)*py);
    //console.debug( "px=" + px + ", py=" + py + ", p0x=" + p0x + ", p0y=" + p0y + ", p1x=" + p1x + ", p1y=" + p1y + ", p2x=" + p2x + ", p2y=" + p2y + ", s=" + s + ", t=" + t );
    return s > 0 && t > 0 && (1-s-t) > 0;
};

/*
IKRS.Regular2DTriangulation.prototype.drawCursorAt = function( x, y ) {
    this.options.context.fillStyle = "#a80000";
    this.options.context.beginPath();
    this.options.context.rect( position.x, position.y, 4, 4 );
    this.options.context.closePath();
    this.options.context.fill();
};
*/
