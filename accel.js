/*
	Canvas 3d Test
	Goal: wire up phonegap accel to a 3d ball
	David Lighty
	BCIT A00843511
*/
//
//////////////////// WEBGL /////////////////////////////
var logging = true;
var gl;
var canvas;
var triangle;
// Rotation
var autoRotate = false;
var theRotatingAxis;
var x = 0;
var y = 1; // Default on Y Axis
var z = 0;

function initGL(canvas) {
    try {
        logIt('Init GL');
        if (!window.WebGLRenderingContext) {
            // the browser doesn't even know what WebGL is
            window.location = "http://get.webgl.org";
        } else {
            gl = canvas.getContext("webgl");
            if(!gl){
            	alert('Failed to getContext.');
            	return;
            }
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        }
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    logIt('gl', gl);
    if (!gl) {
        alert("No GL");
    }
    if (!shaderScript) {
        return null;
    }
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
var shaderProgram;

function initShaders() {
    logIt('gl', gl);
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function initBuffers(obj) {
    // Draw Buffer
    obj.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);
    // Color Buffer
    obj.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);
}

function drawScene(objs) {
    gl.clearColor(0.05, 0.05, 0.05, 0.80);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    for (var i = objs.length - 1; i >= 0; i--) {
        var obj = objs[i];
        logIt('obj', obj);
        mat4.translate(mvMatrix, obj.position);
        mat4.rotate(mvMatrix, degToRad(obj.rotation), theRotatingAxis);
        // Obj
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, obj.axis, gl.FLOAT, false, 0, 0);
        // Colors
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, obj.colorLen, gl.FLOAT, false, 0, 0);
        setMatrixUniforms();
        gl.drawArrays(obj.gl_array_type, 0, obj.points);
    }
}

function setRotation() {
    var rotText = '[x:' + x + ', y:' + y + ', z:' + z + ']';
    $('#rot-current').html(rotText);
    theRotatingAxis = [x, y, z];
}

function webGLStart() {
    logIt('canvas', canvas);
    initGL(canvas);
    initShaders();
    gl.enable(gl.DEPTH_TEST);
}
//////////////////// WEBGL /////////////////////////////
//
//////////////////// OBJECTS ///////////////////////////
// Main 3D Object Definition
var drawableObj = function(params) {
    var o = {
        vertices: [],
        axis: 0,
        points: 0,
        position: [],
        rotation: 0,
        gl_array_type: null,
        buffer: null,
        colors: [],
        colorBuffer: null,
        colorLen: 0,
        colorRows: 0,
        makeBuffer: function() {
            logIt('Make Buffer');
            buffer = initBuffers(this);
        },
        setGLArrayType: function(type) {
            this.gl_array_type = type;
        },
        setVerices: function(verts) {
            logIt('Vertices', verts);
            this.vertices = verts;
        },
        setStartPOS: function(position) {
            logIt('position', position);
            this.position = position;
        },
        setRotation: function(rotation) {
            this.rotation = rotation;
        },
        init: function(params) {
            logIt('Init Drawable Object');
            this.vertices = params.vertices;
            this.axis = params.axis;
            this.points = params.points;
            this.position = params.position;
            this.rotation = params.rotation;
            this.colors = params.colors;
            this.colorLen = params.colorLen;
            this.colorRows = params.colorRows;
        }
    };
    o.init(params);
    return o;
};
// Create a square
function initSquare() {
    var squareObj = new drawableObj({
        buffer: null,
        vertices: [
            1.0, 1.0, 0.0, -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0, -1.0, -1.0, 0.0
        ],
        position: [3.0, 0.0, -3.0],
        axis: 3,
        points: 4,
        gl_array_type: gl.TRIANGLE_STRIP
    });
    return squareObj;
}
// Create a triangle
function makeTriangle() {
    var triangleObj = new drawableObj({
        vertices: [
            0.0, 1.0, 0.0, -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0
        ],
        position: [-0.5, 0.0, -5.0],
        axis: 3,
        points: 3,
        rotation: 0,
        gl_array_type: gl.TRIANGLES,
        colors: [
            1.0, 0.0, 0.30, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.30, 0.0, 1.0, 0.80
        ],
        colorLen: 4,
        colorRows: 3
    });
    return triangleObj;
}
//////////////////// OBJECTS ///////////////////////////
//
//////////////////// DRAW LOOP /////////////////////////
var makeScene = function() {
    logIt('makeScene');
    // Get current z-Index
    var zIdx = $('#zaxis').val() * -1;
    var position = [-1.5, 0.0, zIdx];
    triangle.setStartPOS(position);
    logIt('zIdx', zIdx);
    // Rotation
    var rotation = parseInt($('#rot').val());
    if (autoRotate) {
        logIt('triangle', triangle);
        rotation = triangle.rotation + 1;
    }
    logIt('rotation', rotation);
    triangle.setRotation(rotation);
    triangle.setGLArrayType(gl.TRIANGLES);
    triangle.makeBuffer();
    drawScene([triangle]);
};
var mainloop = function() {
    makeScene();
};
// Browser Compat Check
var animFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || null;
//////////////////// DRAW LOOP /////////////////////////
//
//////////////////// MISC FUNC /////////////////////////
function logIt(msg, printVar) {
    if (logging) {
        console.log(msg, printVar);
    }
}
//////////////////// MISC FUNC /////////////////////////
//
//////////////////// MAIN //////////////////////////////
//
// On ready, draw!
$(document).ready(function() {
    // Set Canvas Element
    canvas = $('canvas#3d-canvas')[0];
    respondCanvas();
    // Init our WebGL Scene
    webGLStart();
    // Create our obj
    triangle = makeTriangle();
    setRotation();
    // Start our rendering loop
    if (animFrame !== null) {
        var recursiveAnim = function() {
            mainloop();
            animFrame(recursiveAnim, canvas);
        };
        // start the mainloop
        animFrame(recursiveAnim, canvas);
    } else {
        var ONE_FRAME_TIME = 1000.0 / 60.0;
        setInterval(mainloop, ONE_FRAME_TIME);
    }
    $('#auto-rotate').click(function() {
        // Begin auto-rotate
        autoRotate = !autoRotate;
    });
    $('#rot-x').click(function() {
        x ^= 1;
        setRotation();
    });
    $('#rot-y').click(function() {
        y ^= 1;
        setRotation();
    });
    $('#rot-z').click(function() {
        z ^= 1;
        setRotation();
    });
});
// Set Canvas size.
//$(window).resize( respondCanvas );
function respondCanvas() {
    $('canvas#3d-canvas').attr('width', $(window).width()); //max width
    $('canvas#3d-canvas').attr('height', $(window).height()); //max height
}