attribute vec2 aQuad;
varying vec2 vScreen;
void main(){vScreen=aQuad*.5+.5;gl_Position=vec4(aQuad,0.0,1.0);}
