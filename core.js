/* FIRST CONTACTS — shared code. */
// FILE: src/core/math.js
/* King's Orbit — small allocation-conscious math toolkit. No dependencies. */
(function (K) {
  'use strict';
  const M = {};
  M.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  M.lerp = (a, b, t) => a + (b - a) * t;
  M.damp = (a, b, s, dt) => M.lerp(a, b, 1 - Math.exp(-s * dt));
  M.smooth = (a, b, x) => {
    x = M.clamp((x - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  };
  M.rand = seed => {
    let n = seed >>> 0;
    return () => {
      n += 0x6d2b79f5;
      let t = n;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  M.v = (x = 0, y = 0, z = 0) => [x, y, z];
  M.add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  M.sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  M.mul = (a, b) => [a[0] * b, a[1] * b, a[2] * b];
  M.dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  M.cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  M.len = a => Math.hypot(...a);
  M.norm = a => {
    const l = M.len(a) || 1;
    return M.mul(a, 1 / l);
  };
  M.dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  M.dir = (yaw, pitch = 0) => [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  M.right = yaw => [Math.cos(yaw), 0, -Math.sin(yaw)];
  M.id = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  M.mm = (a, b, out = new Float32Array(16)) => {
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return out;
  };
  M.compose = (p, r = [0, 0, 0], s = [1, 1, 1]) => {
    const [x, y, z] = r,
      a = Math.cos(x),
      b = Math.sin(x),
      c = Math.cos(y),
      d = Math.sin(y),
      e = Math.cos(z),
      f = Math.sin(z);
    // Euler YXZ: pitch, yaw, roll. Column-major.
    return new Float32Array([
      (c * e + d * b * f) * s[0],
      a * f * s[0],
      (c * b * f - d * e) * s[0],
      0,
      (d * b * e - c * f) * s[1],
      a * e * s[1],
      (d * f + c * b * e) * s[1],
      0,
      a * d * s[2],
      -b * s[2],
      a * c * s[2],
      0,
      p[0],
      p[1],
      p[2],
      1,
    ]);
  };
  // In-place variant used every frame by the scene graph; same rotation order as M.compose.
  M.composeInto = (out, p, r, s) => {
    const a = Math.cos(r[0]),
      b = Math.sin(r[0]),
      c = Math.cos(r[1]),
      d = Math.sin(r[1]),
      e = Math.cos(r[2]),
      f = Math.sin(r[2]);
    out[0] = (c * e + d * b * f) * s[0];
    out[1] = a * f * s[0];
    out[2] = (c * b * f - d * e) * s[0];
    out[3] = 0;
    out[4] = (d * b * e - c * f) * s[1];
    out[5] = a * e * s[1];
    out[6] = (d * f + c * b * e) * s[1];
    out[7] = 0;
    out[8] = a * d * s[2];
    out[9] = -b * s[2];
    out[10] = a * c * s[2];
    out[11] = 0;
    out[12] = p[0];
    out[13] = p[1];
    out[14] = p[2];
    out[15] = 1;
    return out;
  };
  M.view = (p, yaw, pitch, roll = 0) => {
    const w = M.compose(p, [pitch, yaw, roll]);
    const o = M.id();
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) o[c * 4 + r] = w[r * 4 + c];
    o[12] = -(o[0] * p[0] + o[4] * p[1] + o[8] * p[2]);
    o[13] = -(o[1] * p[0] + o[5] * p[1] + o[9] * p[2]);
    o[14] = -(o[2] * p[0] + o[6] * p[1] + o[10] * p[2]);
    return o;
  };
  M.perspective = (fov, aspect, n = 0.06, f = 22000) => {
    const t = 1 / Math.tan(fov / 2);
    return new Float32Array([
      t / aspect,
      0,
      0,
      0,
      0,
      t,
      0,
      0,
      0,
      0,
      (f + n) / (n - f),
      -1,
      0,
      0,
      (2 * f * n) / (n - f),
      0,
    ]);
  };
  M.transform = (m, p) => [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
  M.project = (p, vp, w, h) => {
    const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12],
      y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13],
      z = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    return { x: ((x / z) * 0.5 + 0.5) * w, y: (0.5 - (y / z) * 0.5) * h, front: z > 0 };
  };
  M.hex = h =>
    typeof h === 'string'
      ? [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
      : h;
  M.angle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  M.aim = (a, b) => {
    const d = M.sub(b, a);
    return { yaw: Math.atan2(-d[0], -d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])) };
  };
  M.raySphere = (ro, rd, p, r) => {
    const d = M.sub(ro, p),
      b = M.dot(d, rd),
      c = M.dot(d, d) - r * r,
      h = b * b - c;
    if (h < 0) return Infinity;
    return Math.max(0, -b - Math.sqrt(h));
  };
  M.rayBox = (o, d, min, max) => {
    let near = 0,
      far = Infinity;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-6) {
        if (o[i] < min[i] || o[i] > max[i]) return Infinity;
      } else {
        let a = (min[i] - o[i]) / d[i],
          b = (max[i] - o[i]) / d[i];
        if (a > b) [a, b] = [b, a];
        near = Math.max(near, a);
        far = Math.min(far, b);
        if (near > far) return Infinity;
      }
    }
    return near;
  };
  K.M = M;
})((window.KO ||= {}));

// FILE: src/core/engine.js
/* Purpose-built WebGL2 renderer: instanced geometry, procedural sky, HDR-ish glow. */
(function (K) {
  'use strict';
  const M = K.M;
  const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 i0;
layout(location=3) in vec4 i1;
layout(location=4) in vec4 i2;
layout(location=5) in vec4 i3;
layout(location=6) in vec4 iColor;
layout(location=7) in vec4 iProps;
uniform mat4 uVP;uniform float uShadow;uniform vec3 uSun;uniform vec3 uCamera;uniform vec4 uLife;uniform float uTime;
out vec3 vWorld;out vec3 vNormal;out vec3 vLocal;out vec4 vColor;out vec4 vProps;out vec3 vCam;out float vAO;
float beatShape(float b){return exp(-fract(b)*9.)+.55*exp(-fract(b-.27)*9.);}
void main(){mat4 model=mat4(i0,i1,i2,i3);vec3 ap=aPos,an=aNormal;
float fph=0.;if(iProps.y>33.5&&iProps.y<34.5){fph=uTime*(.7+fract(iProps.w*7.31)*.9)+iProps.w*6.2832;float cp=cos(fph),sp=sin(fph);ap.yz=vec2(cp*ap.y-sp*ap.z,sp*ap.y+cp*ap.z);an.yz=vec2(cp*an.y-sp*an.z,sp*an.y+cp*an.z);}
if(iProps.y>35.5&&iProps.y<36.5){
 // a crawling bug: legs (normal length 2..3.25) swing in two tripods, antennae (4..4.25) wave, cerci (5) twitch
 float NL=length(an),gs=iProps.z,g=uTime*gs*6.2832+iProps.w*6.2832,mv=step(.01,gs);
 if(NL>1.5&&NL<3.6){
  float id=floor((NL-2.)*4.+.5),side=id<2.5?1.:-1.,k=mod(id,3.);
  float ph=g+((mod(k,2.)<.5)==(side>0.)?0.:3.1416);
  vec2 root=vec2(side*.14,k<.5?.18:k<1.5?.02:-.1),d=ap.xz-root;
  float sw=sin(ph)*.38*mv,cs=cos(sw),sn=sin(sw);
  ap.xz=root+vec2(cs*d.x-sn*d.y,sn*d.x+cs*d.y);
  ap.y+=max(0.,cos(ph))*.12*length(d)*mv;
 } else if(NL>3.6&&NL<4.6){
  float sa=max(ap.z-.4,0.);
  ap.x+=sin(uTime*(6.+mv*9.)+iProps.w*13.+(NL-4.)*20.)*.12*sa*sa*2.5;
  ap.y+=sin(uTime*4.6+iProps.w*7.+(NL-4.)*9.)*.07*sa;
 } else if(NL>4.6){ap.x+=sin(uTime*9.+iProps.w*5.)*.02;}
 ap.y+=sin(g*2.)*.006*mv;
}
vec4 w=model*vec4(ap,1.0);vCam=vec3(0.);
if(iProps.y>18.5&&iProps.y<19.5)vCam=(inverse(model)*vec4(uCamera,1.)).xyz;
if(iProps.y>8.5&&iProps.y<9.5){float wave=sin(w.x*.011+uLife.x)*cos(w.z*.009-uLife.x*.71);w.y+=wave*1.6+sin(uLife.x)*1.25+beatShape(uLife.y)*uLife.z+sin(w.x*.37+uLife.x*47.)*sin(w.z*.31-uLife.y*41.)*uLife.w;}
if(iProps.y>28.5&&iProps.y<29.5){float h=clamp(aPos.y+.5,0.,1.);float sx=length(model[0].xyz);w.x+=sin(uTime*7.3+iProps.w*13.+w.y*.7)*h*h*.24*sx;w.z+=cos(uTime*6.1+iProps.w*7.+w.y*.6)*h*h*.24*sx;}
if(iProps.y>29.5&&iProps.y<30.5){float sp=floor(iProps.w);float ph=fract(iProps.w);float f=fract(uTime*sp*.1+ph);w.y-=f*iProps.z;w.x+=sin(uTime*1.7+ph*40.)*.9*f;w.z+=cos(uTime*1.3+ph*31.)*.9*f;}
if(iProps.y>31.5&&iProps.y<32.5){float a=uTime*iProps.z;float c=cos(a),s=sin(a);w.xz=vec2(c*w.x+s*w.z,-s*w.x+c*w.z);}
if(iProps.y>33.5&&iProps.y<34.5){float rr=3.+fract(iProps.w*3.17)*8.;vec2 dir=normalize(model[3].xz+vec2(1e-4));w.xz+=dir*cos(fph)*rr;w.y+=sin(fph)*rr*.85;float a=uTime*iProps.z;float c=cos(a),s=sin(a);w.xz=vec2(c*w.x+s*w.z,-s*w.x+c*w.z);}
if(uShadow>.5){w.x-=uSun.x/uSun.y*w.y;w.z-=uSun.z/uSun.y*w.y;w.y=.048;}vWorld=w.xyz;vLocal=aPos;vAO=length(aNormal);mat3 n=mat3(model);vNormal=normalize(n*(an/vec3(dot(n[0],n[0]),dot(n[1],n[1]),dot(n[2],n[2]))));vColor=iColor;vProps=iProps;gl_Position=uVP*w;}`;
  const noiseGL = `float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.53+noise(p*2.03)*.27+noise(p*4.13)*.13+noise(p*8.37)*.07;}`;
  const fragment = `#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;in vec3 vLocal;in vec4 vColor;in vec4 vProps;
in vec3 vCam;in float vAO;
uniform vec3 uCamera,uSun,uFog,uTint;uniform float uFogD,uTime,uAmbient,uShadow,uSunK;uniform vec4 uLife;uniform vec4 uWounds[12];out vec4 outColor;
${noiseGL}
vec2 vor(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 h=vec2(hash(vec3(i+o,1.)),hash(vec3(i+o,7.)));vec2 r=o+h-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return vec2(sqrt(d1),sqrt(d2));}
void main(){if(uShadow>.5){outColor=vec4(.017,.049,.039,.32);return;}vec3 N=normalize(vNormal),V=normalize(uCamera-vWorld),L=normalize(uSun);float nd=max(dot(N,L),0.);float type=vProps.y;vec3 col=vColor.rgb;float alpha=vColor.a;float em=vProps.x;float dist=length(uCamera-vWorld);float wet=1.;vec3 glowAdd=vec3(0.);
if(type>9.5&&type<19.5||type>25.5&&type<26.5){
 vec3 q=normalize(vLocal);float seed=vProps.w;float damage=clamp(vProps.z,0.,1.);
 vec3 qp=q+vec3(seed*.37,seed*.13,seed*.29);
 float low=fbm(qp*4.1),fine=fbm(qp*23.);
 vec3 base=vColor.rgb;vec3 land=mix(base*.36,base*1.35,smoothstep(.3,.7,low));
 if(type<10.5){land=mix(vec3(.017,.065,.12),base*.5,smoothstep(.32,.54,low));land=mix(land,base*vec3(.8,1.15,.72),smoothstep(.53,.575,low));land=mix(land,vec3(.61,.62,.41),smoothstep(.66,.79,low));}
 else if(type<11.5){float dunes=.5+.5*sin(q.y*29.+low*13.);land=base*(.36+low*.93)+vec3(.17,.09,.015)*dunes*.27;}
 else if(type<12.5){float fiss=1.-smoothstep(.01,.06,abs(noise(qp*17.)-.49));land=mix(base*.67,vec3(.85,.93,.97),fine);land=mix(land,vec3(.035,.14,.24),fiss*.65);}
 else if(type<13.5){float lava=1.-smoothstep(.015,.07,abs(noise(qp*8.)-.5));land=base*.22+vec3(1.4,.27,.02)*lava;}
 else if(type<14.5){land=base*(.18+fine*.9);land=mix(land,vec3(.21,.28,.04),smoothstep(.48,.56,low));land+=vec3(.14,.22,.015)*pow(noise(qp*34.),8.);}
 else if(type<15.5){float bands=.5+.5*sin(q.y*30.+fbm(qp*7.)*7.);land=base*(.39+bands*.79);float eye=length((q.xz-vec2(.25,-.5))*vec2(2.5,1.));land=mix(land,base*vec3(1.35,.62,.37),exp(-eye*eye*35.)*.8);}
 else if(type<16.5){land=base*(.09+fine*.24);float seam=1.-smoothstep(.012,.035,abs(noise(qp*12.)-.5));land+=base*seam*.32;}
 else if(type<17.5){float cells=floor(fine*7.)/7.;land=base*(.28+cells*1.15);land+=vec3(.25,.3,.46)*pow(max(dot(reflect(-L,N),V),0.),50.);}
 else if(type<18.5){
  // a world that gives its own light; when the light is gone, ash-grey bands
  float sw=fbm(qp*3.1+vec3(0.,uTime*.006,0.));
  float bands=.5+.5*sin(q.y*9.+sw*6.5);
  vec3 bright=mix(vec3(1.,.8,.42),vec3(1.,.97,.86),clamp(bands*.75+fine*.35,0.,1.));
  bright=mix(bright,vec3(.98,.68,.3),smoothstep(.62,.8,low)*.35);
  vec3 dead=mix(vec3(.11,.11,.14),vec3(.3,.29,.33),clamp(bands*.6+fine*.4,0.,1.));
  land=mix(dead,bright,clamp(em,0.,1.));
 }
 else if(type>25.5){
  // seen from orbit: black basalt veined with fire, one pit sunk in terraces, white ice at its bottom
  vec3 pc=normalize(vec3(.32,.58,.75));
  float d=acos(clamp(dot(q,pc),-1.,1.));
  float rock=fbm(qp*6.)*.7+fine*.3;
  land=mix(vec3(.045,.03,.026),vec3(.22,.14,.1),rock);
  float crack=1.-smoothstep(.0,.03,abs(noise(qp*9.)-.5)),crack2=1.-smoothstep(.0,.02,abs(noise(qp*23.+2.)-.5));
  float hot=clamp(em,0.,1.);
  glowAdd+=vec3(1.25,.26,.03)*(crack*.55+crack2*.22)*hot*(.75+.25*sin(uTime*.7+low*9.));
  float pit=1.-smoothstep(.34,.4,d);
  float terr=.5+.5*cos(d*86.);
  vec3 fire=mix(vec3(.85,.16,.03),vec3(1.,.58,.16),terr);
  land=mix(land,vec3(.06,.025,.018),pit);
  glowAdd+=fire*pit*smoothstep(.07,.11,d)*(.25+.55*pow(terr,3.))*hot;
  float iceC=1.-smoothstep(.06,.085,d);
  land=mix(land,vec3(.74,.86,.96),iceC);glowAdd+=vec3(.16,.24,.32)*iceC;
  float smoke=smoothstep(.5,.78,fbm(qp*5.+vec3(uTime*.003,0.,0.)));
  land=mix(land,vec3(.16,.09,.07),smoke*.55);glowAdd*=1.-smoke*.45;
 }
 else {
  float folds=fbm(qp*5.5);
  land=mix(vec3(.5,.16,.21),vec3(.88,.52,.52),smoothstep(.28,.76,folds));
  float v1=1.-smoothstep(.0,.035,abs(noise(qp*7.)-.5)),v2=1.-smoothstep(.0,.022,abs(noise(qp*17.+3.)-.5));
  land=mix(land,vec3(.32,.07,.27),max(v1*.8,v2*.5));
  float beat=exp(-fract(uLife.y)*9.)+.55*exp(-fract(uLife.y-.27)*9.);
  land+=vec3(.2,.0,.05)*max(v1,v2)*beat*.5;
  float wound=0.;
  for(int i=0;i<12;i++){vec4 W=uWounds[i];if(W.w<=0.)continue;float d=acos(clamp(dot(q,W.xyz),-1.,1.))/W.w;wound=max(wound,1.-smoothstep(.4,1.,d));}
  land=mix(land,mix(vec3(.55,.02,.06),vec3(.16,0.,.02),smoothstep(.55,1.,wound))*(1.+beat*.25),wound);
  for(int i=0;i<6;i++){
   float fi=float(i);
   vec3 e=normalize(vec3(hash(vec3(fi,1.,seed))-.5,(hash(vec3(fi,2.,seed))-.5)*1.3,hash(vec3(fi,3.,seed))-.5));
   float sz=.12+hash(vec3(fi,4.,seed))*.12,d=acos(clamp(dot(q,e),-1.,1.));
   if(d>sz*1.3)continue;
   vec3 up=abs(e.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.);
   vec3 t1=normalize(cross(up,e)),t2=cross(e,t1);
   vec2 uv=vec2(dot(q,t1),dot(q,t2))/sin(sz);
   float lid=abs(uv.y)-(1.-uv.x*uv.x*.92)*.6;
   if(lid>0.){land*=mix(.55,1.,smoothstep(0.,.18,lid));continue;}
   vec3 vc=normalize(vCam-e*.5);
   vec2 p=uv-vec2(dot(vc,t1),dot(vc,t2))*.4;float r=length(p);
   vec3 eyeCol=mix(vec3(.93,.87,.8),vec3(.78,.22,.2),smoothstep(.55,1.,length(uv))*.55);
   vec3 iris=vec3(.82,.6,.1)*(.55+.6*noise(vec3(atan(p.y,p.x)*5.,r*14.,seed)));
   eyeCol=mix(iris,eyeCol,smoothstep(.34,.38,r));
   eyeCol=mix(vec3(.01,0.,0.),eyeCol,smoothstep(.12,.15,r));
   land=eyeCol*(1.+(1.-smoothstep(.0,.25,nd))*(1.-smoothstep(.34,.38,r))*.9);
  }
 }
 if(type<10.5||type>13.5&&type<14.5){float clouds=smoothstep(.56,.72,fbm(qp*9.+vec3(uTime*.004,0.,0.)));land=mix(land,base*.3+vec3(.57),clouds*.7*max(0.,1.-damage*1.9));}
 float ice=smoothstep(.87,.99,abs(q.y)+fine*.07);if(type<10.5)land=mix(land,vec3(.86,.92,.91),ice);
 float cracks=1.-smoothstep(.004,.018+damage*.035,abs(noise(qp*6.5)-.5));
 float pits=noise(qp*3.2+vec3(4.,2.,1.));
 if(damage>.45&&pits<(damage-.43)*.62)discard;
 vec3 lit=land*(.075+nd*1.12)*(1.-damage*.49);lit+=glowAdd*(1.-damage*.5);
 lit+=vec3(1.8,.32,.035)*cracks*damage*(.7+damage*.85);
 float rim=pow(1.-max(dot(N,V),0.),3.1);lit+=base*rim*(.25+nd)*.6*(1.-damage*.7);
 if(type>17.5&&type<18.5){float glow=clamp(em,0.,1.);lit=mix(lit,land*(.92+nd*.3)*(1.-damage*.4)+vec3(1.,.9,.62)*rim*.9,glow);outColor=vec4(lit,alpha);return;}
 if((type<14.5||type>15.5)&&type<25.5){vec3 cell=floor(qp*450.);float cities=step(.985,hash(cell))*smoothstep(type<10.5?.54:.45,type<10.5?.63:.62,low)*(1.-smoothstep(.02,.18,nd));float alive=step(damage+.001,hash(cell+vec3(7.,3.,1.)));lit+=vec3(1.,.5,.13)*cities*alive*.72*step(.5,em);}
 outColor=vec4(lit,alpha);return;
}
if(type>1.5&&type<2.5){vec3 q=normalize(vLocal);float land=fbm(q*4.4+vec3(8.,3.,1.));float detail=fbm(q*30.);col=mix(vec3(.021,.09,.135),vec3(.047,.28,.285),smoothstep(.35,.56,land));col=mix(col,vec3(.3,.47,.33),smoothstep(.535,.57,land));col=mix(col,vec3(.68,.67,.48),smoothstep(.64,.76,land));float clouds=smoothstep(.53,.68,fbm(q*9.+vec3(uTime*.004,0.,0.)));col=mix(col,vec3(.88,.94,.92),clouds*.83);float ice=smoothstep(.83,.98,abs(q.y)+detail*.1);col=mix(col,vec3(.85,.92,.91),ice);float light=.045+nd*1.15;col*=light;float rim=pow(1.-max(dot(N,V),0.),3.);col+=vec3(.15,.45,.64)*rim*(.25+nd);float cities=step(.985,hash(floor(q*450.)))*smoothstep(.52,.61,land)*(1.-smoothstep(.02,.18,nd));col+=vec3(1.,.52,.16)*cities*.7;outColor=vec4(col,alpha);return;}
if(type>2.5&&type<3.5){float r=length(vLocal.xz);float band=.4+.6*noise(vec3(r*190.,1.,3.));alpha*=band;col*=.65+nd*.45;outColor=vec4(col,alpha);return;}
if(type>3.5&&type<4.5){float rim=pow(1.-abs(dot(N,V)),3.2);alpha*=rim;outColor=vec4(col*(.4+max(dot(N,L),0.)*.6),alpha);return;}
if(type>4.5&&type<5.5){float g=fbm(vWorld*.024);col*=.77+g*.42;float grid=pow(1.-abs(sin(vWorld.x*.035)*sin(vWorld.z*.039)),14.);col+=vec3(.01,.024,.014)*grid;}
if(type>7.5&&type<8.5){float ground=fbm(vWorld*.032);col*=.76+ground*.49;}
if(type>6.5&&type<7.5){
 float mode=vProps.z;bool fall=mode>1.5;bool glass=mode>.5&&mode<1.5;
 vec2 g=fall?vec2(vWorld.x+vWorld.z,vWorld.y*.45+uTime*7.):vec2(vWorld.x,vWorld.z-(glass?0.:uTime*2.6));
 float t=uTime*(glass?.05:.35);
 float c1=noise(vec3(g.x*.21,g.y*.08,t)),c2=noise(vec3(g.x*.29+3.7,g.y*.11+1.3,t*1.3+5.));
 float caust=pow(clamp(1.-abs(c1-c2)*2.4,0.,1.),5.);
 vec3 water=mix(vec3(.12,.56,.78),vec3(.74,.95,1.),caust*.8+.06);
 if(glass){float fire=smoothstep(.56,.86,fbm(vec3(vWorld.xz*.05,uTime*.05)));float dep=fbm(vec3(vWorld.xz*.018,2.));water=mix(vec3(.1,.22,.5),vec3(.36,.56,.86),dep)+caust*.05;water=mix(water,vec3(1.,.46,.12),fire*.75);}
 if(fall)water=mix(water,vec3(.93,.98,1.),smoothstep(.45,.8,noise(vec3(g.x*.5,g.y*.6,uTime))));
 vec3 R=reflect(-V,N);float fres=pow(1.-max(dot(N,V),0.),3.);
 water=mix(water,mix(uFog*1.05,uFog*vec3(.6,.76,1.08),clamp(R.y,0.,1.)),fres*(fall?.15:glass?.75:.55));
 col=water*col;wet=5.5;
}
if(type>20.5&&type<21.5){
 vec2 g=vWorld.xz;vec2 tc=g/8.;vec2 cell=floor(tc),f=fract(tc);
 float seam=1.-smoothstep(.0,.03,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
 float tile=hash(vec3(cell,7.));
 float deep=fbm(vec3(g*.021,uTime*.012));
 float vein=1.-smoothstep(.0,.05,abs(noise(vec3(g*.09,3.))-.5));
 vec3 gold=mix(vec3(.74,.4,.05),vec3(1.,.7,.16),clamp(deep*.9+tile*.3,0.,1.));
 gold=mix(gold,vec3(1.,.86,.42),vein*.4);
 gold*=1.-seam*.32;
 float fleck=pow(noise(vec3(g*2.3,uTime*.3)),18.)*(1.-smoothstep(40.,140.,dist));
 vec3 R=reflect(-V,N);float fres=pow(1.-max(dot(N,V),0.),3.5);
 vec3 skyR=mix(uFog,uFog*vec3(.7,.8,1.)+vec3(.02,.03,.05),clamp(R.y*1.3,0.,1.))*vec3(1.,.8,.42)*1.25;
 col=mix(gold,skyR,fres*.45)*col+vec3(1.,.9,.6)*fleck*1.4*col.g;
 wet=3.4;
}
if(type>24.5&&type<25.5){
 float a=atan(vLocal.x,vLocal.z);
 float f=sin(a*13.+noise(vLocal*3.1)*2.6)*.5+.5,g=sin(a*29.+vLocal.y*2.3)*.5+.5;
 col*=.8+.17*f+.06*g;
 wet=1.+f*1.1;
}
if(type>23.5&&type<24.5){
 float up=.5+.5*N.y,rim=pow(1.-max(dot(N,V),0.),2.);
 vec3 cc=col*(.6+.4*up)*(uAmbient*.85+.28)+col*rim*.16;
 float fk=1.-exp(-dist*uFogD*.7);
 outColor=vec4(mix(cc,uFog,fk),alpha);return;
}
if(type>22.5&&type<23.5){
 vec3 q=vWorld*.15;
 vec3 cell=floor(q+vec3(noise(q*.7)*.9,noise(q*.7+7.)*.5,noise(q*.7+3.)*.9));
 float f=hash(cell),f2=hash(cell+5.),f3=hash(cell+9.);
 vec3 fn=normalize(N+vec3(f-.5,f2-.5,f3-.5)*1.1);
 float facet=max(dot(fn,L),0.);
 float glint=pow(max(dot(reflect(-L,fn),V),0.),36.)*1.8*uSunK;
 float k=vProps.z>0.?vProps.z:1.;
 col=col*mix(1.,.45+.5*f+.55*facet,k)+vec3(glint)*mix(col,vec3(1.),.5)*k;
 wet=4.;
}
if(type>21.5&&type<22.5){
 vec2 g=vWorld.xz*.0042+vec2(uTime*.0035,uTime*.0012);
 float c=fbm(vec3(g,1.))*.75+fbm(vec3(g*3.3,4.))*.25;
 float puff=smoothstep(.28,.8,c),hl=pow(puff,3.);
 vec3 cc=col*mix(vec3(.6,.6,.72),vec3(1.,.99,.96),puff)+col*vec3(.12,.08,.02)*hl;
 cc*=uAmbient*1.02+.14;
 float fk=1.-exp(-dist*uFogD*.75);
 outColor=vec4(mix(cc,uFog,fk),alpha);return;
}
if(type>26.5&&type<27.5){
 // the floor of hell: one shader, a material per circle
 float det=vProps.z;vec2 g=vWorld.xz;float sd=vProps.w;float hot=em;em=0.;
 float n1=fbm(vec3(g*.055,sd)),n2=noise(vec3(g*.42,sd+3.));
 if(det<.5){
  // basalt in plates; fire showing in the seams between them, in patches
  vec2 pc=mix(vec2(vWorld.x*.8+vWorld.z*.6,vWorld.y*1.4),g,smoothstep(.35,.75,abs(N.y)))*.12;
  vec2 vr=vor(pc);float edge=1.-smoothstep(.0,.06,vr.y-vr.x);
  float plate=hash(vec3(floor(pc*1.7),3.));
  col*=(.36+n1*.62+n2*.1)*(.82+plate*.32)*(1.-edge*.4);
  float mask=smoothstep(.44,.7,noise(vec3(g*.016,vWorld.y*.02+5.)))*mix(.22,1.,smoothstep(.35,.75,abs(N.y)));
  glowAdd+=vec3(1.,.27,.04)*edge*mask*hot*1.7*(.65+.35*sin(uTime*1.1+g.x*.05+g.y*.04));
  glowAdd+=vec3(.32,.05,.01)*hot*mask*.22;
  wet=1.1;
 } else if(det<1.5){
  float pud=smoothstep(.5,.62,fbm(vec3(g*.09,sd+5.)));
  col*=.55+n1*.5;col=mix(col,col*.55,pud);
  vec2 cg=g*.32;vec2 f=fract(cg)-.5;float rp=fract(uTime*1.3+hash(vec3(floor(cg),2.)));
  float ring=1.-smoothstep(.0,.05,abs(length(f)-rp*.45));
  col+=vec3(.16,.17,.18)*ring*(1.-rp)*(.3+pud);
  wet=1.5+pud*5.;
 } else if(det<2.5){
  float dune=.5+.5*sin(g.x*.32+g.y*.21+n1*6.);
  col*=.62+dune*.3+n2*.12;
  float flake=pow(noise(vec3(g*1.3,uTime*.9)),9.)*2.4;
  float heat=.55+.45*noise(vec3(g*.07,uTime*.35));
  glowAdd+=vec3(1.,.42,.1)*(flake+.22*heat)*hot+vec3(.6,.13,.02)*heat*hot*.35;
  wet=.8;
 } else if(det<3.5){
  vec2 pg=vec2(atan(g.x,g.y)*6.,length(g)*.3);
  float streak=noise(vec3(pg.x*1.4,pg.y*4.,sd));
  float crack=1.-smoothstep(.0,.025,abs(noise(vec3(g*.08,4.))-.5));
  col=mix(vec3(.42,.6,.76),vec3(.8,.9,1.),streak*.6+n1*.3)+vec3(.35)*crack;
  vec3 R=reflect(-V,N);float fres=pow(1.-max(dot(N,V),0.),2.6);
  col=mix(col,mix(uFog,vec3(.75,.85,.95),.6),fres*.55);
  glowAdd+=vec3(.08,.13,.2)*hot+vec3(.2,.3,.4)*crack*hot*.3;
  wet=6.;
 } else if(det<4.5){
  float meadow=smoothstep(.35,.7,fbm(vec3(g*.03,sd+2.)));
  col=mix(col*vec3(.85,1.05,.8),col*vec3(1.1,.95,.7),meadow)*(.6+n1*.6+n2*.1);wet=.9;
 } else if(det<5.5){
  vec2 h2=vec2(vWorld.x*.7+vWorld.z*.7,vWorld.y)*.22;vec2 c2=fract(h2+vec2(0.,floor(h2.x)*.5));
  float seam=1.-smoothstep(.0,.06,min(min(c2.x,1.-c2.x),min(c2.y,1.-c2.y)));
  col*=.55+n2*.25;
  glowAdd+=vec3(1.,.18,.03)*seam*hot*(.7+.3*sin(uTime*2.+h2.x*3.))+vec3(.35,.04,.01)*hot*.3;
  wet=2.4;
 } else if(det<6.5){
  col*=.55+n1*.6;
  float bone=pow(noise(vec3(g*2.1,sd+9.)),22.)*3.;
  col=mix(col,vec3(.82,.78,.7),clamp(bone,0.,1.));
  float cin=pow(noise(vec3(g*.9,sd+4.)),14.)*(.6+.4*sin(uTime*2.+g.x));
  glowAdd+=vec3(1.,.35,.06)*cin*hot*2.;
  wet=.7;
 } else {
  col*=.56+n1*.5+n2*.15;wet=1.;
 }
}
if(type>27.5&&type<28.5){
 // the rivers of hell run round the pit: flow follows the circle
 float det=vProps.z;float hot=em;em=0.;
 float ang=atan(vWorld.x,vWorld.z),rad=length(vWorld.xz);
 vec2 g=vec2(ang*rad*.12-uTime*(det<.5?1.4:det<1.5?.3:det<2.5?.9:.12),rad*.12);
 float c1=noise(vec3(g*.9,uTime*.15)),c2=noise(vec3(g*1.7+3.,uTime*.22));
 vec3 liq;
 if(det<.5){liq=mix(vec3(.17,.15,.12),vec3(.34,.31,.26),c1)+vec3(.12)*pow(1.-abs(c1-c2)*2.,8.);}
 else if(det<1.5){liq=mix(vec3(.04,.07,.05),vec3(.12,.15,.08),c1);float b=pow(noise(vec3(vWorld.xz*1.1,uTime*.8)),14.)*3.;liq+=vec3(.25,.3,.2)*b;}
 else if(det<2.5){float boil=pow(noise(vec3(vWorld.xz*.8,uTime*1.6)),6.)*2.2;liq=mix(vec3(.3,.015,.02),vec3(.62,.04,.03),c1)+vec3(.9,.25,.08)*boil;glowAdd+=vec3(.55,.05,.02)*(.35+boil)*hot;}
 else {float bub=pow(noise(vec3(vWorld.xz*.45,uTime*.35)),10.)*2.;liq=mix(vec3(.012,.01,.012),vec3(.05,.04,.035),c1)+vec3(.25,.2,.12)*bub;}
 vec3 R=reflect(-V,N);float fres=pow(1.-max(dot(N,V),0.),3.);
 liq=mix(liq,uFog*1.1,fres*(det>2.5?.65:.4));
 col=liq*col;wet=det>2.5?9.:5.;
}
if(type>28.5&&type<29.5){
 float h=clamp(vLocal.y+.5,0.,1.);
 float fl=noise(vec3(vLocal.x*3.,vLocal.y*4.-uTime*5.,vProps.w*7.));
 vec3 c=mix(vec3(1.,.93,.66),vec3(1.,.4,.06),smoothstep(.0,.5,h));
 c=mix(c,vec3(.55,.05,.02),smoothstep(.55,1.,h));
 float a=alpha*(1.-smoothstep(.4,1.,h+fl*.38))*(.75+.25*fl);
 float fk=1.-exp(-dist*uFogD*.55);
 outColor=vec4(mix(c*col*(1.+em),uFog,fk*.75),a);return;
}
if(type>29.5&&type<30.5){
 float f=fract(uTime*floor(vProps.w)*.1+fract(vProps.w));
 float a=alpha*smoothstep(0.,.06,f)*(1.-smoothstep(.82,1.,f));
 float fk=1.-exp(-dist*uFogD);
 outColor=vec4(mix(col*(1.+em),uFog,fk),a);return;
}
if(type>35.5&&type<36.5){
 // amber chitin: light comes through it; a glossy shell, the abdomen banded, the legs darker
 vec3 q=vLocal;
 float leg=step(.3,abs(q.x))+step(q.y,.035)*step(.14,abs(q.x))+step(.5,q.z);
 float band=smoothstep(.32,.5,abs(fract(q.z*11.)-.5))*step(q.z,.08)*step(.05,q.y);
 col*=mix(1.,.62,band)*mix(1.,.55,clamp(leg,0.,1.));
 col*=mix(.82,1.12,noise(q*14.+vProps.w));
 float thru=pow(max(dot(-N,L),0.),1.4)*.75+pow(1.-max(dot(N,V),0.),2.)*.4;
 glowAdd+=col*vec3(1.,.62,.22)*(thru*1.15+.12)*(1.-clamp(leg,0.,1.)*.6);
 wet=7.;
}
if(type>36.5&&type<37.5){
 // a splat on the ground: ragged edge, flung drops, darker where it was thickest
 vec2 q=vLocal.xz*2.;float r=length(q),an=atan(q.y,q.x);
 float edge=.62+.25*noise(vec3(an*2.2,vProps.w,0.))+.13*noise(vec3(an*7.,vProps.w*3.,1.));
 float drops=step(.78,noise(vec3(q*7.,vProps.w)))*step(r,.98);
 float a=max(step(r,edge),drops);
 if(a<.5)discard;
 float rim=smoothstep(edge*.35,edge,r);col=mix(col*.6,col*vec3(2.3,2.,1.2)+vec3(.06,.05,0.),rim*.85)*mix(.85,1.1,noise(vec3(q*9.,vProps.w)));
 wet=5.;N=normalize(N+vec3(noise(vec3(q*12.,2.))-.5,0.,noise(vec3(q*12.,5.))-.5)*.6);nd=max(dot(N,L),0.);
}
if(type>37.5&&type<38.5){
 // an ice world thawing round the domes: wet soil and moss inside the warm ring, snow and blue ice beyond it
 float rad=length(vWorld.xz),thaw=vProps.z;
 float n1=fbm(vWorld*.006),n2=noise(vWorld*.11),n3=fbm(vWorld*.035+3.);
 float edge=thaw+(n1-.5)*190.;
 float snow=smoothstep(edge-36.,edge+28.,rad);
 vec3 soil=mix(vec3(.2,.155,.11),vec3(.33,.26,.17),n2);
 soil=mix(soil,vec3(.26,.38,.13),smoothstep(.52,.7,n3)*.85);
 vec3 sn=mix(vec3(.74,.81,.9),vec3(.97,.98,1.),n2*.8+.2);
 sn=mix(sn,vec3(.5,.64,.8),smoothstep(.6,.78,fbm(vWorld*.017+7.))*.55);
 float slush=smoothstep(edge-36.,edge,rad)*(1.-snow);
 col=mix(mix(soil,vec3(.42,.42,.4),slush*.6),sn,snow);
 float rock=smoothstep(.82,.6,N.y);col=mix(col,vec3(.19,.2,.23),rock*.85);
 wet=mix(3.2,1.6,snow)+slush*3.;
 float sparkle=step(.985,noise(vWorld*2.7+uCamera*.05))*snow*(1.-smoothstep(20.,90.,dist));glowAdd+=vec3(.7,.8,1.)*sparkle;
}
if(type>34.5&&type<35.5){
 // a sheet of wind: streaks of grit drawn round the pit, thinning out at its top and bottom
 float ang=atan(vWorld.x,vWorld.z),rad=length(vWorld.xz);
 float u=ang*rad*.013-uTime*vProps.z,v=vWorld.y*.15;
 float st=noise(vec3(u,v,vProps.w))*.55+noise(vec3(u*2.6,v*2.2+u*.3,vProps.w+3.))*.3+noise(vec3(u*6.,v*5.,vProps.w+7.))*.15;
 float a=alpha*smoothstep(.42,.82,st)*(1.-smoothstep(.3,.5,abs(vLocal.y)));
 float fk=1.-exp(-dist*uFogD);
 outColor=vec4(mix(col*(uAmbient*uTint*.8+em),uFog,fk*.8),a);return;
}
if(type>31.5&&type<32.5){
 float fk=1.-exp(-dist*uFogD);
 outColor=vec4(mix(col*(1.+em),uFog,fk),alpha*(.55+.45*noise(vec3(vWorld*.05+uTime*.2))));return;
}
if(type>30.5&&type<31.5){
 float v1=1.-smoothstep(.0,.05,abs(noise(vLocal*5.+vProps.w)-.5)),v2=1.-smoothstep(.0,.03,abs(noise(vLocal*13.+3.)-.5));
 col=mix(col,col*.42,max(v1*.7,v2*.4));
 glowAdd+=col*vec3(.9,.28,.12)*pow(max(dot(-N,L),0.),2.)*.35;
 wet=1.7;
}
if(type>8.5&&type<9.5){
 vec3 q=vec3(vLocal.x,0.,vLocal.z);
 vec3 wq=q*.021+vec3(noise(q*.012),0.,noise(q*.012+vec3(5.2,0.,1.3)))*1.9;
 float folds=fbm(wq*1.6);
 float cn=abs(noise(wq*2.2)-.5),crease=1.-smoothstep(.0,.045,cn),ridge=smoothstep(.045,.07,cn)*(1.-smoothstep(.07,.11,cn));
 float mott=noise(q*.04+vec3(9.,0.,2.))*.65+noise(q*.083+vec3(1.,0.,6.))*.35;
 vec3 skin=mix(vec3(.80,.2,.29),vec3(.99,.52,.5),smoothstep(.3,.74,folds));
 skin=mix(skin,vec3(.6,.1,.3),smoothstep(.56,.8,mott)*.5);
 skin=mix(skin,skin*vec3(.5,.13,.24),crease*.72);skin+=vec3(.16,.07,.07)*ridge;
 float v1=1.-smoothstep(.0,.05,abs(noise(q*.011)-.5)),v2=1.-smoothstep(.0,.03,abs(noise(q*.031+vec3(7.,0.,0.))-.5));
 float veins=max(v1*.95,v2*.72);
 if(dist<170.){
  float near=1.-smoothstep(60.,170.,dist);
  float v3=1.-smoothstep(.0,.022,abs(noise(q*.083+vec3(2.,0.,9.))-.5));
  veins=max(veins,v3*.42*near);
  float crease2=1.-smoothstep(.0,.05,abs(noise(q*.09+vec3(3.,0.,7.))-.5));
  skin*=1.-crease2*.22*near;
  float pore=smoothstep(.72,.9,noise(q*.85))*(1.-smoothstep(25.,75.,dist));
  skin*=1.-pore*.28;
  vec3 bump=vec3(noise(q*.11)-.5,0.,noise(q*.11+vec3(4.,0.,1.))-.5)*near;
  N=normalize(N+bump*.55);nd=max(dot(N,L),0.);
 }
 vec3 veinCol=mix(vec3(.27,.08,.46),vec3(.52,.02,.1),smoothstep(.45,.55,noise(q*.005+vec3(1.,0.,4.))));
 skin=mix(skin,veinCol,veins*.84);
 float beat=exp(-fract(uLife.y)*9.)+.55*exp(-fract(uLife.y-.27)*9.);
 skin+=vec3(.5,.03,.09)*veins*beat*.62;
 float wound=0.;
 for(int i=0;i<12;i++){vec4 W=uWounds[i];if(W.z<=0.)continue;float d=length(vLocal.xz-W.xy)/W.z;wound=max(wound,1.-smoothstep(.5,1.02,d));}
 if(wound>0.)skin=mix(skin,mix(vec3(.7,.03,.07),vec3(.22,0.,.03),smoothstep(.6,1.,wound))*(1.+beat*.3)+vec3(.12,0.,.02)*noise(q*.12),wound);
 col=skin;
 wet=2.3+crease*1.4+wound*3.;
}
float ao=1.;
if(type>32.5&&type<33.5){
 // sculpted bodies: the occlusion measured on the shape comes in through the normal's length
 ao=clamp(vAO,0.,1.);float det=vProps.z;vec3 q=vLocal;float sd=vProps.w;
 float m1=fbm(q*.045+sd),m2=noise(q*.31+sd*3.);
 if(det<.5){
  col*=mix(.74,1.13,m1)*(.93+.14*m2);
  float v1=1.-smoothstep(.0,.035,abs(noise(q*.085+vec3(3.,sd,1.))-.5));
  col=mix(col,col*vec3(.62,.7,.98),v1*.3*smoothstep(.55,.95,ao));
  col=mix(col*vec3(1.1,.72,.66),col,smoothstep(.25,.85,ao));
  nd=max((dot(N,L)+.4)/1.4,0.);wet=1.6;
 } else if(det<1.5){
  vec2 c=vor(q.xz*.42+vec2(q.y*.31,-q.y*.27));float crack=1.-smoothstep(.0,.09,c.y-c.x);
  col*=mix(.7,1.12,m1)*(1.-crack*.55);
  float fur=noise(vec3(q.x*1.7,q.y*.22,q.z*1.7)+sd);col*=.8+.35*fur;
  nd=max((dot(N,L)+.2)/1.2,0.);wet=1.1+crack;
 } else if(det<2.5){
  float s1=noise(vec3(q.x*2.6,q.y*.18,q.z*2.6)+sd),s2=noise(vec3(q.x*7.,q.y*.5,q.z*7.)+sd*2.);
  col*=.48+.62*s1+.22*s2;wet=2.6;
 } else if(det<3.5){
  float rings=sin((q.y+noise(q*.6)*1.4)*9.)*.5+.5;col*=.75+.3*rings;wet=3.5;
 } else {
  // one head, three faces: red in front, pale towards -x, black towards +x, the hide behind and over the crown
  float az=atan(q.x,q.z);
  vec3 fc=az<0.?mix(vec3(.66,.09,.06),vec3(.85,.79,.55),smoothstep(.6,1.,-az)):mix(vec3(.66,.09,.06),vec3(.11,.086,.082),smoothstep(.6,1.,az));
  fc=mix(fc,col,smoothstep(2.15,2.55,abs(az)));
  col=mix(fc,col,smoothstep(12.,18.,q.y))*mix(.8,1.1,m1)*(.94+.12*m2);
  nd=max((dot(N,L)+.35)/1.35,0.);wet=1.8;
 }
 float rim=pow(1.-max(dot(N,V),0.),3.)*ao;
 glowAdd+=uFog*rim*.42+col*uFog*.25*(1.-ao);
}
if(type>19.5&&type<20.5){
 vec3 q=normalize(vLocal);float open=clamp(em,0.,1.);em=0.;
 float ang=acos(clamp(q.z,-1.,1.)),seed=vProps.w;
 float aperture=abs(q.y)-mix(-.05,.62,open)*(1.-q.x*q.x*.55);
 if(q.z<.12||aperture>0.){
  float crease=smoothstep(.0,.08,aperture);
  col=mix(vec3(.62,.26,.3),vec3(.86,.5,.5),fbm(vLocal*9.+seed))*(q.z<.12?1.:mix(.55,1.,crease));
  wet=1.3;
 } else {
  float vein=1.-smoothstep(.0,.07,abs(noise(q*9.+seed)-.5));
  vec3 scl=mix(vec3(.96,.92,.86),vec3(.8,.14,.16),vein*smoothstep(.45,1.2,ang)*.85);
  float pr=.13+clamp(vProps.z,0.,1.)*.2;
  vec3 iris=vColor.rgb*(.62+.55*noise(vec3(atan(q.y,q.x)*7.,ang*24.,seed)));
  iris=mix(iris,iris*.3,smoothstep(.36,.47,ang));
  col=mix(iris,scl,smoothstep(.46,.49,ang));
  col=mix(vec3(.012,.006,.008),col,smoothstep(pr-.02,pr+.02,ang));
  wet=4.;
 }
}
float hemi=.5+.5*N.y;vec3 ambient=mix(vec3(.28,.34,.39),vec3(.7,.8,.89),hemi)*uAmbient*uTint;
float spec=pow(max(dot(reflect(-L,N),V),0.),28.)*.17*wet*uSunK;
vec3 lit=col*(ambient*ao+nd*.85*uSunK*mix(.5,1.,ao))+vec3(spec)*ao+col*em+glowAdd;
if(type>.5&&type<1.5)lit=col*(1.+em);
if(type>5.5&&type<6.5){float radial=length(vLocal.xz);alpha*=1.-smoothstep(.16,.5,radial);lit=col;}
float fog=1.-exp(-dist*uFogD);lit=mix(lit,uFog,fog);outColor=vec4(lit,alpha);}`;
  const fullscreen = `#version 300 es
precision highp float;out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const skyFrag = `#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform float uAspect,uFov,uTime,uSurface,uAtmosphere,uWarp;uniform mat4 uRotation;uniform vec3 uSun,uSkyOffset,uSkyTop,uSkyHorizon,uSkyCloud;uniform float uSkyStyle;
${noiseGL}
void main(){vec2 st=uv*2.-1.;vec3 rd=normalize((uRotation*vec4(st.x*uAspect*uFov,st.y*uFov,-1.,0.)).xyz);vec3 sun=normalize(uSun);float sund=dot(rd,sun);
vec3 space=vec3(.004,.008,.017);float band=exp(-pow((rd.y+.28*rd.x-.06)*4.,2.));float n=fbm(rd*3.5+4.);space+=vec3(.027,.038,.061)*band*n;space+=vec3(.027,.014,.045)*pow(fbm(rd*6.+7.),3.);
vec3 cell=rd*680.;float star=pow(max(0.,hash(floor(cell))-.993)/.007,6.);vec3 offset=fract(cell)-.5;star*=exp(-dot(offset,offset)*10.);space+=vec3(.66,.78,1.)*star*2.;vec3 c2=rd*175.;float s2=step(.9992,hash(floor(c2)))*pow(max(0.,1.-length(fract(c2)-.5)*1.7),5.);space+=vec3(1.,.77,.5)*s2*1.8;
space+=vec3(.47,.59,.78)*pow(max(sund,0.),650.)*.45;space+=vec3(1.)*smoothstep(.99995,.99998,sund);
float h=clamp(rd.y*.7+.24,0.,1.);vec3 sky=mix(vec3(.69,.82,.73),vec3(.1,.36,.47),pow(h,.4));sky+=vec3(.6,.44,.21)*pow(max(sund,0.),36.)*.28;sky+=vec3(1.,.87,.55)*smoothstep(.9994,.99965,sund);float cloud=fbm(rd*6.+vec3(uTime*.008,0.,0.));sky=mix(sky,vec3(.89,.87,.70),smoothstep(.57,.72,cloud)*smoothstep(.03,.2,rd.y)*.57);if(uSkyStyle>3.5){
 float hh=clamp(rd.y,-.3,1.);
 vec3 base=mix(uSkyHorizon,uSkyTop,smoothstep(-.06,.5,hh));
 float sm=fbm(rd*2.6+vec3(uTime*.012,uTime*.004,0.)),sm2=fbm(rd*6.5+vec3(-uTime*.02,0.,uTime*.01));
 base=mix(base,uSkyCloud,smoothstep(.4,.74,sm)*.85);
 base+=uSkyHorizon*pow(1.-clamp(hh,0.,1.),4.)*(.35+.35*sm2)*smoothstep(.45,.6,sm);
 vec3 ec=rd*360.+vec3(0.,-uTime*1.4,0.);float ember=step(.9986,hash(floor(ec)))*pow(max(0.,1.-length(fract(ec)-.5)*1.8),3.);
 base+=vec3(1.,.45,.12)*ember*1.6*smoothstep(-.1,.3,hh);
 sky=base;
}else if(uSkyStyle>.5){
 sky=mix(uSkyHorizon,uSkyTop,pow(h,.5));
 sky=mix(sky,uSkyCloud,smoothstep(.56,.73,cloud)*smoothstep(.03,.24,rd.y)*.45);
 sky+=uSkyCloud*pow(max(sund,0.),40.)*.14;
 if(uSkyStyle<1.5){float curtain=exp(-pow((rd.y-.32-.13*sin(rd.x*5.+uTime*.035))*17.,2.));sky+=vec3(.04,.16,.17)*curtain*(.45+.55*noise(rd*17.+uTime*.03));}
 if(uSkyStyle>2.5)sky+=space*.3;
}
vec3 environment=mix(space,sky,uSurface);
if(uAtmosphere>.001){
 // Stylized cloud-top panorama: no separate entry screen and no distant miniature globe.
 float elevation=rd.y;
 vec3 upper=mix(vec3(.71,.84,.84),vec3(.085,.31,.50),pow(clamp(elevation*.75+.12,0.,1.),.52));
 float glow=pow(max(sund,0.),16.);
 upper+=vec3(.48,.32,.14)*glow*.55;
 upper+=vec3(1.,.86,.61)*smoothstep(.9992,.99965,sund);
 float highCloud=smoothstep(.53,.70,fbm(rd*6.2+uSkyOffset+vec3(uTime*.006,4.,2.)))*smoothstep(.06,.48,elevation);
 upper=mix(upper,vec3(.93,.93,.87),highCloud*.69);
 vec3 q=vec3(rd.x/max(-elevation,.14),0.,rd.z/max(-elevation,.14))*.65+uSkyOffset;
 float banks=fbm(q+vec3(uTime*.004,7.,3.));
 float detail=noise(q*4.+vec3(3.,1.,0.));
 vec3 sea=mix(vec3(.24,.47,.53),vec3(.91,.92,.84),smoothstep(.33,.62,banks));
 sea*=.84+.16*detail;
 float haze=exp(-abs(elevation)*9.);
 sea=mix(sea,vec3(.76,.85,.82),haze*.88);
 vec3 cloudSky=mix(upper,sea,1.-smoothstep(-.24,-.025,elevation));
 // The approach passes through a short, thin veil rather than fading to a menu.
 float veil=sin(uAtmosphere*3.14159265)*.13;
 cloudSky=mix(cloudSky,vec3(.79,.86,.84),veil);
 if(uSkyStyle>.5){
 vec3 customUpper=mix(uSkyHorizon,uSkyTop,pow(clamp(elevation*.75+.12,0.,1.),.52));
 customUpper=mix(customUpper,uSkyCloud,highCloud*.6);
 vec3 customSea=mix(uSkyHorizon*.65,uSkyCloud,smoothstep(.33,.62,banks));
 customSea=mix(customSea,uSkyHorizon,haze*.65);
 cloudSky=mix(customUpper,customSea,1.-smoothstep(-.24,-.025,elevation));
}
environment=mix(environment,cloudSky,uAtmosphere);
}
if(uWarp>.001){
 vec2 st2=uv*2.-1.;float r=length(st2);float a=atan(st2.y,st2.x);
 float lane=floor(a*105.);float rnd=hash(vec3(lane,8.,3.));
 float line=pow(max(0.,1.-abs(fract(a*105.)-.5)*2.),22.);
 float run=pow(max(0.,sin(r*8.-uTime*(7.+rnd*13.)+rnd*30.)),6.);
 environment+=vec3(.28,.49,.68)*line*run*smoothstep(.12,.6,r)*step(.78,rnd)*uWarp*.7;
}
outColor=vec4(environment,1.);}`;
  const postFrag = `#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform sampler2D uTex;uniform vec2 uPixel;uniform float uTime,uGlow,uImpact;
void main(){vec2 p=uv;vec3 c=texture(uTex,p).rgb;vec3 b=vec3(0);if(uGlow>.5){for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){vec3 q=texture(uTex,p+vec2(x,y)*uPixel*5.).rgb;b+=max(q-.68,0.)/(1.+float(x*x+y*y));}}}c+=b*.15*uGlow;float vignette=1.-.22*pow(length(uv-.5)*1.25,2.);c*=vignette;c=mix(c,c*vec3(1.12,.83,.62),uImpact*.25);c=vec3(1.)-exp(-c*1.12);c=pow(c,vec3(.85));float grain=fract(sin(dot(gl_FragCoord.xy+uTime,vec2(12.9898,78.233)))*43758.5453);c+=(grain-.5)/230.;outColor=vec4(c,1.);}`;
  function makeProgram(gl, vs, fs) {
    const prog = gl.createProgram();
    for (const [type, src] of [
      [gl.VERTEX_SHADER, vs],
      [gl.FRAGMENT_SHADER, fs],
    ]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(
          gl.getShaderInfoLog(s) +
            '\n' +
            src
              .split('\n')
              .map((v, i) => i + 1 + ': ' + v)
              .join('\n'),
        );
      gl.attachShader(prog, s);
      gl.deleteShader(s);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    return prog;
  }
  function geomBox() {
    let p = [],
      n = [],
      idx = [];
    const faces = [
      [
        [1, 0, 0],
        [0.5, -0.5, -0.5],
        [0.5, 0.5, -0.5],
        [0.5, 0.5, 0.5],
        [0.5, -0.5, 0.5],
      ],
      [
        [-1, 0, 0],
        [-0.5, -0.5, 0.5],
        [-0.5, 0.5, 0.5],
        [-0.5, 0.5, -0.5],
        [-0.5, -0.5, -0.5],
      ],
      [
        [0, 1, 0],
        [-0.5, 0.5, -0.5],
        [-0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, -0.5],
      ],
      [
        [0, -1, 0],
        [-0.5, -0.5, 0.5],
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [0.5, -0.5, 0.5],
      ],
      [
        [0, 0, 1],
        [0.5, -0.5, 0.5],
        [0.5, 0.5, 0.5],
        [-0.5, 0.5, 0.5],
        [-0.5, -0.5, 0.5],
      ],
      [
        [0, 0, -1],
        [-0.5, -0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [0.5, 0.5, -0.5],
        [0.5, -0.5, -0.5],
      ],
    ];
    for (const f of faces) {
      let o = p.length / 3;
      for (let k = 1; k < 5; k++) {
        p.push(...f[k]);
        n.push(...f[0]);
      }
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    return { p, n, idx };
  }
  function geomSphere(seg = 28, rings = 18, hemi = false) {
    let p = [],
      n = [],
      idx = [];
    for (let y = 0; y <= rings; y++) {
      const t = (y / rings) * Math.PI * (hemi ? 0.5 : 1);
      for (let x = 0; x <= seg; x++) {
        const a = (x / seg) * Math.PI * 2;
        const v = [Math.sin(t) * Math.sin(a), Math.cos(t), Math.sin(t) * Math.cos(a)];
        p.push(...v.map(e => e * 0.5));
        n.push(...v);
      }
    }
    for (let y = 0; y < rings; y++)
      for (let x = 0; x < seg; x++) {
        let a = y * (seg + 1) + x,
          b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    return { p, n, idx };
  }
  function geomCylinder(seg = 16, top = 1) {
    let p = [],
      n = [],
      idx = [];
    for (let y = 0; y < 2; y++)
      for (let i = 0; i <= seg; i++) {
        let a = (i / seg) * Math.PI * 2,
          x = Math.sin(a),
          z = Math.cos(a);
        p.push(x * 0.5 * (y ? top : 1), y - 0.5, z * 0.5 * (y ? top : 1));
        n.push(x, (1 - top) * 0.5, z);
      }
    for (let i = 0; i < seg; i++) {
      let j = i + seg + 1;
      idx.push(i, j, i + 1, j, j + 1, i + 1);
    }
    for (let y = 0; y < 2; y++) {
      let o = p.length / 3;
      p.push(0, y - 0.5, 0);
      n.push(0, y ? 1 : -1, 0);
      for (let i = 0; i <= seg; i++) {
        let a = (i / seg) * Math.PI * 2;
        p.push(Math.sin(a) * 0.5 * (y ? top : 1), y - 0.5, Math.cos(a) * 0.5 * (y ? top : 1));
        n.push(0, y ? 1 : -1, 0);
      }
      for (let i = 0; i < seg; i++)
        if (y) idx.push(o, o + i + 2, o + i + 1);
        else idx.push(o, o + i + 1, o + i + 2);
    }
    return { p, n, idx };
  }
  function geomRing(inner = 0.64, seg = 128) {
    let p = [],
      n = [],
      idx = [];
    for (let i = 0; i <= seg; i++) {
      let a = (i / seg) * Math.PI * 2;
      for (let r of [inner, 1]) {
        p.push(Math.sin(a) * r, 0, Math.cos(a) * r);
        n.push(0, 1, 0);
      }
    }
    for (let i = 0; i < seg; i++) {
      let j = i * 2;
      idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
    return { p, n, idx };
  }
  function geomTorus(R = 0.72, r = 0.08, N = 40, S = 6) {
    let p = [],
      n = [],
      idx = [];
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= S; j++) {
        let a = (i / N) * Math.PI * 2,
          b = (j / S) * Math.PI * 2;
        p.push((R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.cos(a));
        n.push(Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a));
      }
    for (let i = 0; i < N; i++)
      for (let j = 0; j < S; j++) {
        let a = i * (S + 1) + j,
          b = a + S + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    return { p, n, idx };
  }
  const SCRATCH = new Float32Array(16);
  // Coarser stand-ins for shapes small on screen: [below this many pixels of radius, use this one, ...]. Same proportions.
  const LOD = {
    midSphere: [70, 'sphere', 30, 'lowSphere', 9, 'tinySphere'],
    sphere: [30, 'lowSphere', 9, 'tinySphere'],
    lowSphere: [9, 'tinySphere'],
    feather: [9, 'tinySphere'],
    dome: [30, 'lowDome'],
    cylinder: [30, 'lowCyl'],
    cone: [24, 'lowCone'],
    disc: [50, 'lowDisc'],
    torus: [45, 'lowTorus', 12, 'haloRing'],
    lowTorus: [12, 'haloRing'],
  };
  class Node {
    constructor(geo = null, p = [0, 0, 0], s = [1, 1, 1], color = '#ffffff', props = {}) {
      this.geo = geo;
      this.p = p.slice();
      this.s = s.slice();
      this.r = [0, 0, 0];
      this.color = M.hex(color).slice();
      this.alpha = props.alpha ?? 1;
      this.em = props.em ?? 0;
      this.type = props.type ?? 0;
      this.detail = props.detail ?? 0;
      this.seed = props.seed ?? 0;
      this.children = [];
      this.visible = true;
      this.world = M.id();
      this.parent = null;
      this.localMatrix = null;
    }
    add(n) {
      n.parent = this;
      this.children.push(n);
      return n;
    }
    remove(n) {
      const i = this.children.indexOf(n);
      if (i >= 0) this.children.splice(i, 1);
      n.parent = null;
    }
    update(parent) {
      const local = this.localMatrix || M.composeInto(SCRATCH, this.p, this.r, this.s);
      if (parent) M.mm(parent, local, this.world);
      else this.world.set(local);
      for (const n of this.children) if (n.visible) n.update(this.world);
    }
  }
  class Engine {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      if (!gl) throw new Error('WebGL 2를 사용할 수 없습니다. Chrome 또는 Samsung Internet에서 다시 열어 주세요.');
      this.gl = gl;
      this.main = makeProgram(gl, vertex, fragment);
      this.sky = makeProgram(gl, fullscreen, skyFrag);
      this.post = makeProgram(gl, fullscreen, postFrag);
      this.geometries = {};
      this.sources = {};
      this.gen = 0;
      this.frameId = 0;
      this.locations = new Map();
      this.quality = 'balanced';
      this.resolutionScale = 1;
      this.camera = { p: [0, 2, 0], yaw: 0, pitch: 0, roll: 0, fov: 73 };
      this.vp = M.id();
      this.sun = [0.6, 0.7, -0.4];
      this.fog = [0.55, 0.7, 0.65];
      this.fogD = 0;
      this.ambient = 0.5;
      this.tint = [1, 1, 1];
      this.sunK = 1;
      this.surface = 0;
      this.atmosphere = 0;
      this.skyBasis = null;
      this.skyOffset = [0, 0, 0];
      this.impact = 0;
      this.life = new Float32Array(4); // living world: breath phase, beat phase, beat strength, tremor
      this.wounds = new Float32Array(48); // living world: up to 12 wounds (globe normals, or ground craters)
      this.noShadows = false;
      this.drawCalls = 0;
      this.triangles = 0;
      this.addGeometry('box', geomBox());
      this.addGeometry('sphere', geomSphere(18, 12));
      this.addGeometry('planet', geomSphere(96, 64));
      this.addGeometry('midSphere', geomSphere(36, 24));
      this.addGeometry('dome', geomSphere(16, 8, true));
      this.addGeometry('cylinder', geomCylinder());
      this.addGeometry('hex', geomCylinder(6));
      this.addGeometry('cone', geomCylinder(12, 0.02));
      this.addGeometry('ring', geomRing());
      this.addGeometry('torus', geomTorus());
      this.addGeometry('lowTorus', geomTorus(0.72, 0.08, 20, 6));
      this.addGeometry('disc', geomCylinder(36));
      this.addGeometry('lowSphere', geomSphere(10, 8));
      // Low-poly parts for crowds and bodies: hundreds of figures stay cheap on phones.
      this.addGeometry('lowDome', geomSphere(10, 5, true));
      this.addGeometry('lowCyl', geomCylinder(8));
      this.addGeometry('lowCone', geomCylinder(8, 0.02));
      this.addGeometry('lowDisc', geomCylinder(14));
      this.addGeometry('tinySphere', geomSphere(6, 4));
      this.addGeometry('taper', geomCylinder(10, 0.8));
      this.addGeometry('feather', geomSphere(8, 5));
      this.addGeometry('frustum', geomCylinder(16, 0.55));
      this.addGeometry('haloRing', geomTorus(0.72, 0.07, 14, 3));
      this.fbo = gl.createFramebuffer();
      this.texture = gl.createTexture();
      this.depth = gl.createRenderbuffer();
      this.fsVao = gl.createVertexArray();
      this.resize();
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
    }
    loc(p, n) {
      const key = p === this.main ? 'm' : p === this.sky ? 's' : 'p';
      const k = key + n;
      if (!this.locations.has(k)) this.locations.set(k, this.gl.getUniformLocation(p, n));
      return this.locations.get(k);
    }
    addGeometry(name, g) {
      this.sources[name] = g;
      const gl = this.gl,
        vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      const vcount = g.p.length / 3;
      let a = new Float32Array(vcount * 6),
        r2 = 0;
      for (let i = 0; i < vcount; i++) {
        const x = g.p[i * 3],
          y = g.p[i * 3 + 1],
          z = g.p[i * 3 + 2];
        a[i * 6] = x;
        a[i * 6 + 1] = y;
        a[i * 6 + 2] = z;
        a[i * 6 + 3] = g.n[i * 3];
        a[i * 6 + 4] = g.n[i * 3 + 1];
        a[i * 6 + 5] = g.n[i * 3 + 2];
        r2 = Math.max(r2, x * x + y * y + z * z);
      }
      gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      const indices = new Uint32Array(g.idx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      const inst = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      for (let k = 0; k < 6; k++) {
        gl.enableVertexAttribArray(k + 2);
        gl.vertexAttribPointer(k + 2, 4, gl.FLOAT, false, 96, k * 16);
        gl.vertexAttribDivisor(k + 2, 1);
      }
      gl.bindVertexArray(null);
      this.geometries[name] = {
        vao,
        vb,
        ib,
        inst,
        count: indices.length,
        // how far the shape reaches from its own origin, for skipping what the camera cannot see
        radius: Math.sqrt(r2),
        data: new Float32Array(96 * 16),
        capacity: 0,
      };
    }
    removeGeometry(name) {
      const g = this.geometries[name];
      delete this.sources[name];
      if (!g) return;
      const gl = this.gl;
      gl.deleteVertexArray(g.vao);
      for (let b of [g.vb, g.ib, g.inst]) gl.deleteBuffer(b);
      delete this.geometries[name];
    }
    resize() {
      const gl = this.gl;
      let ratios = { low: 0.8, balanced: 1, high: 1.5 };
      const d = Math.min(devicePixelRatio || 1, ratios[this.quality]) * this.resolutionScale;
      const w = Math.max(2, Math.round(innerWidth * d)),
        h = Math.max(2, Math.round(innerHeight * d));
      if (this.canvas.width === w && this.canvas.height === h) return;
      this.canvas.width = w;
      this.canvas.height = h;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new Error('렌더링 버퍼를 만들지 못했습니다.');
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    render(root, time, overlay = null) {
      const gl = this.gl,
        c = this.camera,
        w = this.canvas.width,
        h = this.canvas.height;
      this.drawCalls = 0;
      this.triangles = 0;
      this.culled = 0;
      this.frameId++;
      this.vp = M.mm(M.perspective((c.fov * Math.PI) / 180, w / h), M.view(c.p, c.yaw, c.pitch, c.roll));
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(this.sky);
      gl.bindVertexArray(this.fsVao);
      gl.uniform1f(this.loc(this.sky, 'uAspect'), w / h);
      gl.uniform1f(this.loc(this.sky, 'uFov'), Math.tan((c.fov * Math.PI) / 360));
      gl.uniform1f(this.loc(this.sky, 'uTime'), time);
      gl.uniform1f(this.loc(this.sky, 'uSurface'), this.surface);
      gl.uniform1f(this.loc(this.sky, 'uAtmosphere'), this.atmosphere);
      gl.uniform1f(this.loc(this.sky, 'uWarp'), this.warp || 0);
      gl.uniform3fv(this.loc(this.sky, 'uSkyOffset'), this.skyOffset);
      gl.uniform3fv(this.loc(this.sky, 'uSun'), this.sun);
      gl.uniform3fv(this.loc(this.sky, 'uSkyTop'), this.skyTop || [0.1, 0.36, 0.47]);
      gl.uniform3fv(this.loc(this.sky, 'uSkyHorizon'), this.skyHorizon || [0.69, 0.82, 0.73]);
      gl.uniform3fv(this.loc(this.sky, 'uSkyCloud'), this.skyCloud || [0.89, 0.87, 0.7]);
      gl.uniform1f(this.loc(this.sky, 'uSkyStyle'), this.skyStyle || 0);
      const skyRotation = M.compose([0, 0, 0], [c.pitch, c.yaw, c.roll]);
      gl.uniformMatrix4fv(
        this.loc(this.sky, 'uRotation'),
        false,
        this.skyBasis ? M.mm(this.skyBasis, skyRotation) : skyRotation,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      this.drawRoot(root, time, this.surface > 0.5 && this.quality !== 'low' && !this.noShadows);
      if (overlay) {
        gl.clear(gl.DEPTH_BUFFER_BIT);
        overlay.p = c.p.slice();
        overlay.r = [c.pitch, c.yaw, c.roll];
        this.drawRoot(overlay, time, false);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(this.post);
      gl.bindVertexArray(this.fsVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.loc(this.post, 'uTex'), 0);
      gl.uniform2f(this.loc(this.post, 'uPixel'), 1 / w, 1 / h);
      gl.uniform1f(this.loc(this.post, 'uTime'), time);
      gl.uniform1f(this.loc(this.post, 'uGlow'), this.quality === 'low' ? 0 : 1);
      gl.uniform1f(this.loc(this.post, 'uImpact'), this.impact);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    }
    // the six planes of the current view volume, normalised: (a, b, c, d) each, inside where a*x+b*y+c*z+d >= 0
    frustum() {
      const m = this.vp,
        f = this.planes || (this.planes = new Float32Array(24));
      if (this.planesVP === m) return f;
      this.planesVP = m;
      const row = i => [m[i], m[4 + i], m[8 + i], m[12 + i]];
      const r0 = row(0),
        r1 = row(1),
        r2 = row(2),
        r3 = row(3);
      const sets = [
        r3.map((v, i) => v + r0[i]),
        r3.map((v, i) => v - r0[i]),
        r3.map((v, i) => v + r1[i]),
        r3.map((v, i) => v - r1[i]),
        r3.map((v, i) => v + r2[i]),
        r3.map((v, i) => v - r2[i]),
      ];
      sets.forEach((q, k) => {
        const l = Math.hypot(q[0], q[1], q[2]) || 1;
        for (let j = 0; j < 4; j++) f[k * 4 + j] = q[j] / l;
      });
      return f;
    }
    // a static batch is skipped whole when its bounding sphere is out of view; bounds are measured once per fill
    batchSeen(b) {
      if (b.dynamic || b.noCull || this.noCull) return true;
      if (b.boundsCount !== b.count || b.uploaded < b.count) {
        b.boundsCount = b.count;
        const g = this.geometries[b.geo],
          d = b.data;
        let mn = [Infinity, Infinity, Infinity],
          mx = [-Infinity, -Infinity, -Infinity],
          rad = 0,
          spin = false;
        for (let i = 0; i < b.count; i++) {
          const o = i * 24,
            t = d[o + 21];
          if (t === 32 || t === 34 || t === 9) spin = true;
          const sc = Math.sqrt(Math.max(d[o] * d[o] + d[o + 1] * d[o + 1] + d[o + 2] * d[o + 2], d[o + 4] * d[o + 4] + d[o + 5] * d[o + 5] + d[o + 6] * d[o + 6], d[o + 8] * d[o + 8] + d[o + 9] * d[o + 9] + d[o + 10] * d[o + 10]));
          rad = Math.max(rad, (g ? g.radius : 1) * sc + (t === 30 ? Math.abs(d[o + 22]) : 0));
          for (let k = 0; k < 3; k++) {
            mn[k] = Math.min(mn[k], d[o + 12 + k]);
            mx[k] = Math.max(mx[k], d[o + 12 + k]);
          }
        }
        if (spin || !b.count) b.bounds = null;
        else {
          const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
          b.bounds = [c[0], c[1], c[2], Math.hypot(mx[0] - c[0], mx[1] - c[1], mx[2] - c[2]) + rad + 1];
        }
      }
      if (!b.bounds) return true;
      const f = this.frustum(),
        q = b.bounds;
      for (let k = 0; k < 24; k += 4) if (f[k] * q[0] + f[k + 1] * q[1] + f[k + 2] * q[2] + f[k + 3] < -q[3]) return false;
      return true;
    }
    drawRoot(root, time, shadows = false) {
      if (!root) return;
      const gl = this.gl;
      root.update();
      const groups = {},
        transparent = {},
        shadowGroups = {};
      // what the camera cannot see is not drawn: a sphere round each shape against the six sides of the view
      const fr = this.frustum(),
        geos = this.geometries,
        cam = this.camera.p,
        // pixels per world unit at distance 1: a shape's size on screen is its radius times this, over its distance
        pxk = this.canvas.height / 2 / Math.tan((this.camera.fov * Math.PI) / 360),
        lodOn = !this.noLod;
      const visit = n => {
        if (!n.visible) return;
        if (n.geo) {
          const w = n.world,
            g = geos[n.geo],
            t = n.type;
          // shapes moved by the vertex shader (orbiting, breathing) are kept whatever their resting place
          let seen = !g || t === 32 || t === 34 || t === 9 || this.noCull,
            geo = n.geo;
          if (g) {
            const sx = w[0] * w[0] + w[1] * w[1] + w[2] * w[2],
              sy = w[4] * w[4] + w[5] * w[5] + w[6] * w[6],
              sz = w[8] * w[8] + w[9] * w[9] + w[10] * w[10],
              rr = g.radius * Math.sqrt(Math.max(sx, sy, sz)),
              r = rr + (t === 30 ? Math.abs(n.detail || 0) : 0) + 1;
            if (!seen) {
              seen = true;
              for (let k = 0; k < 24; k += 4)
                if (fr[k] * w[12] + fr[k + 1] * w[13] + fr[k + 2] * w[14] + fr[k + 3] < -r) {
                  seen = false;
                  break;
                }
            }
            // far off, the same shape is drawn with fewer facets; it looks the same at that size on screen
            const lod = seen && lodOn && t !== 30 && t !== 32 && t !== 33 && t !== 34 && t !== 9 ? LOD[geo] : null;
            if (lod) {
              const dx = w[12] - cam[0],
                dy = w[13] - cam[1],
                dz = w[14] - cam[2],
                px = (rr * pxk) / Math.max(0.5, Math.sqrt(dx * dx + dy * dy + dz * dz));
              for (let k = 0; k < lod.length; k += 2) if (px < lod[k]) geo = lod[k + 1];
            }
          }
          if (seen) {
            const coll = n.alpha < 0.995 ? transparent : groups;
            (coll[geo] ??= []).push(n);
          } else this.culled++;
          if (
            shadows &&
            n.alpha >= 0.995 &&
            n.type < 1.5 &&
            n.world[13] > 1 &&
            n.world[13] < 80 &&
            Math.hypot(n.world[12], n.world[14]) < 310 &&
            n.geo !== 'disc' &&
            n.geo !== 'ring' &&
            n.geo !== 'torus'
          )
            (shadowGroups[geo] ??= []).push(n);
        }
        for (let c of n.children) visit(c);
      };
      visit(root);
      gl.useProgram(this.main);
      gl.uniformMatrix4fv(this.loc(this.main, 'uVP'), false, this.vp);
      gl.uniform3fv(this.loc(this.main, 'uCamera'), this.camera.p);
      gl.uniform3fv(this.loc(this.main, 'uSun'), this.sun);
      gl.uniform3fv(this.loc(this.main, 'uFog'), this.fog);
      gl.uniform1f(this.loc(this.main, 'uFogD'), this.fogD);
      gl.uniform1f(this.loc(this.main, 'uAmbient'), this.ambient);
      gl.uniform3fv(this.loc(this.main, 'uTint'), this.tint);
      gl.uniform1f(this.loc(this.main, 'uSunK'), this.sunK ?? 1);
      gl.uniform1f(this.loc(this.main, 'uTime'), time);
      gl.uniform4fv(this.loc(this.main, 'uLife'), this.life);
      gl.uniform4fv(this.loc(this.main, 'uWounds'), this.wounds);
      const extra = root.batches;
      for (let [trans, batches, isShadow] of [
        [false, groups, false],
        [true, shadowGroups, true],
        [true, transparent, false],
      ]) {
        gl.uniform1f(this.loc(this.main, 'uShadow'), isShadow ? 1 : 0);
        if (trans) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
        } else {
          gl.disable(gl.BLEND);
          gl.depthMask(true);
        }
        for (const [name, nodes] of Object.entries(batches)) {
          const g = this.geometries[name];
          if (!g) continue;
          const count = nodes.length;
          if (g.data.length < count * 24) g.data = new Float32Array(count * 24 * 2);
          const d = g.data;
          for (let i = 0; i < count; i++) {
            const n = nodes[i],
              o = i * 24,
              c = n.color;
            d.set(n.world, o);
            d[o + 16] = c[0];
            d[o + 17] = c[1];
            d[o + 18] = c[2];
            d[o + 19] = n.alpha;
            d[o + 20] = n.em;
            d[o + 21] = n.type;
            d[o + 22] = n.detail || 0;
            d[o + 23] = n.seed || 0;
          }
          gl.bindVertexArray(g.vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, g.inst);
          gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, count * 24), gl.DYNAMIC_DRAW);
          gl.drawElementsInstanced(gl.TRIANGLES, g.count, gl.UNSIGNED_INT, 0, count);
          this.drawCalls++;
          this.triangles += (g.count / 3) * count;
        }
        if (extra)
          for (const b of extra) {
            if (!b.count) continue;
            if (isShadow ? !(shadows && b.shadow && !b.transparent) : b.shadowOnly || trans !== !!b.transparent)
              continue;
            if (!isShadow && !this.batchSeen(b)) continue;
            this.drawBatch(b);
          }
      }
      gl.depthMask(true);
    }
    // Externally filled instance arrays (crowds, bodies). Same 24-float layout as scene nodes.
    makeBatch(geo, opts = {}) {
      return {
        geo,
        transparent: !!opts.transparent,
        shadow: !!opts.shadow,
        shadowOnly: !!opts.shadowOnly,
        dynamic: opts.dynamic !== false,
        data: new Float32Array(24 * (opts.capacity || 64)),
        count: 0,
        vao: null,
        inst: null,
        gen: -1,
        geom: null,
        cap: 0,
        uploaded: 0,
        frame: -1,
      };
    }
    growBatch(b, count) {
      if (b.data.length >= count * 24) return b.data;
      const next = new Float32Array(Math.max(count * 24, b.data.length * 2));
      next.set(b.data.subarray(0, b.count * 24));
      b.data = next;
      return next;
    }
    resetBatch(b) {
      b.count = 0;
      b.uploaded = 0;
    }
    freeBatch(b) {
      const gl = this.gl;
      if (b.vao && b.gen === this.gen) {
        gl.deleteVertexArray(b.vao);
        gl.deleteBuffer(b.inst);
      }
      b.vao = null;
      b.inst = null;
      b.count = 0;
    }
    bindBatch(b) {
      const g = this.geometries[b.geo];
      if (!g) return null;
      if (b.vao && b.gen === this.gen && b.geom === g) return g;
      const gl = this.gl;
      if (b.vao && b.gen === this.gen) {
        gl.deleteVertexArray(b.vao);
        gl.deleteBuffer(b.inst);
      }
      b.vao = gl.createVertexArray();
      gl.bindVertexArray(b.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.vb);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
      b.inst = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b.inst);
      for (let k = 0; k < 6; k++) {
        gl.enableVertexAttribArray(k + 2);
        gl.vertexAttribPointer(k + 2, 4, gl.FLOAT, false, 96, k * 16);
        gl.vertexAttribDivisor(k + 2, 1);
      }
      gl.bindVertexArray(null);
      b.gen = this.gen;
      b.geom = g;
      b.cap = 0;
      b.uploaded = 0;
      return g;
    }
    drawBatch(b) {
      const g = this.bindBatch(b);
      if (!g) return;
      const gl = this.gl;
      gl.bindVertexArray(b.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.inst);
      if (b.dynamic) {
        if (b.frame !== this.frameId) {
          gl.bufferData(gl.ARRAY_BUFFER, b.data.subarray(0, b.count * 24), gl.DYNAMIC_DRAW);
          b.frame = this.frameId;
        }
      } else {
        if (b.cap !== b.data.length) {
          gl.bufferData(gl.ARRAY_BUFFER, b.data.byteLength, gl.DYNAMIC_DRAW);
          b.cap = b.data.length;
          b.uploaded = 0;
        }
        if (b.uploaded > b.count) b.uploaded = 0;
        if (b.uploaded < b.count) {
          gl.bufferSubData(gl.ARRAY_BUFFER, b.uploaded * 96, b.data.subarray(b.uploaded * 24, b.count * 24));
          b.uploaded = b.count;
        }
      }
      gl.drawElementsInstanced(gl.TRIANGLES, g.count, gl.UNSIGNED_INT, 0, b.count);
      this.drawCalls++;
      this.triangles += (g.count / 3) * b.count;
    }
    // After the browser drops the GPU context (phones in the background), rebuild everything.
    restore() {
      const gl = this.gl;
      this.gen++;
      this.locations.clear();
      this.main = makeProgram(gl, vertex, fragment);
      this.sky = makeProgram(gl, fullscreen, skyFrag);
      this.post = makeProgram(gl, fullscreen, postFrag);
      const sources = this.sources;
      this.geometries = {};
      this.sources = {};
      for (const [name, g] of Object.entries(sources)) this.addGeometry(name, g);
      this.fbo = gl.createFramebuffer();
      this.texture = gl.createTexture();
      this.depth = gl.createRenderbuffer();
      this.fsVao = gl.createVertexArray();
      this.canvas.width = 1;
      this.canvas.height = 1;
      this.resize();
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
    }
    dispose() {
      for (const n of Object.keys(this.geometries)) this.removeGeometry(n);
      const gl = this.gl;
      for (const p of [this.main, this.sky, this.post]) gl.deleteProgram(p);
      gl.deleteTexture(this.texture);
      gl.deleteRenderbuffer(this.depth);
      gl.deleteFramebuffer(this.fbo);
      gl.deleteVertexArray(this.fsVao);
    }
  }
  K.Node = Node;
  K.Engine = Engine;
  K.applySkyPalette = (engine, env = {}) => {
    engine.skyTop = (env.skyTop || [0.1, 0.36, 0.47]).slice();
    engine.skyHorizon = (env.skyHorizon || [0.69, 0.82, 0.73]).slice();
    engine.skyCloud = (env.skyCloud || [0.89, 0.87, 0.7]).slice();
    engine.skyStyle = env.skyStyle || 0;
  };
  K.mesh = (root, geo, p, s, c, props) => root.add(new Node(geo, p, s, c, props));
  K.group = (root, p = [0, 0, 0]) => root.add(new Node(null, p));
  K.beam = (root, a, b, width, color, em = 0) => {
    const d = M.sub(b, a),
      len = M.len(d),
      mid = M.mul(M.add(a, b), 0.5),
      n = K.mesh(root, 'cylinder', mid, [width, len, width], color, { em });
    n.r = [Math.acos(M.clamp(d[1] / len, -1, 1)), Math.atan2(d[0], d[2]), 0];
    return n;
  };
})((window.KO ||= {}));

// FILE: src/core/sculpt.js
/* Sculpt: soft solids blended into one smooth mesh.
 * A body is described as a list of shapes (ellipsoids, round cones, rounded boxes) added or carved with a blend radius.
 * They are summed into a signed distance field on a grid and the surface is drawn out of it (surface nets).
 * Ambient occlusion is measured on the field and stored in the length of each normal; shader type 33 reads it back. */
(function (K) {
  'use strict';
  const BIG = 1e3;
  // rotation matrix (row-major 3x3) from Euler angles applied X, then Y, then Z — the inverse is its transpose
  function rot(r) {
    if (!r) return null;
    const [a, b, c] = r,
      ca = Math.cos(a),
      sa = Math.sin(a),
      cb = Math.cos(b),
      sb = Math.sin(b),
      cc = Math.cos(c),
      sc = Math.sin(c);
    // R = Rz * Ry * Rx
    return [
      cc * cb, cc * sb * sa - sc * ca, cc * sb * ca + sc * sa,
      sc * cb, sc * sb * sa + cc * ca, sc * sb * ca - cc * sa,
      -sb, cb * sa, cb * ca,
    ];
  }
  function ellipsoid(px, py, pz, rx, ry, rz) {
    const k0 = Math.sqrt((px * px) / (rx * rx) + (py * py) / (ry * ry) + (pz * pz) / (rz * rz));
    if (k0 < 1e-5) return -Math.min(rx, ry, rz);
    const k1 = Math.sqrt((px * px) / (rx * rx * rx * rx) + (py * py) / (ry * ry * ry * ry) + (pz * pz) / (rz * rz * rz * rz));
    return (k0 * (k0 - 1)) / k1;
  }
  // exact round cone between two points (after Inigo Quilez)
  function roundCone(s, px, py, pz) {
    const ax = px - s.a[0],
      ay = py - s.a[1],
      az = pz - s.a[2];
    const y = ax * s.ba[0] + ay * s.ba[1] + az * s.ba[2],
      z = y - s.l2;
    const qx = ax * s.l2 - s.ba[0] * y,
      qy = ay * s.l2 - s.ba[1] * y,
      qz = az * s.l2 - s.ba[2] * y;
    const x2 = qx * qx + qy * qy + qz * qz,
      y2 = y * y * s.l2,
      z2 = z * z * s.l2;
    const k = Math.sign(s.rr) * s.rr * s.rr * x2;
    if (Math.sign(z) * s.a2 * z2 > k) return Math.sqrt(x2 + z2) * s.il2 - s.r2;
    if (Math.sign(y) * s.a2 * y2 < k) return Math.sqrt(x2 + y2) * s.il2 - s.r1;
    return (Math.sqrt(x2 * s.a2 * s.il2) + y * s.rr) * s.il2 - s.r1;
  }
  function roundBox(px, py, pz, hx, hy, hz, r) {
    const qx = Math.abs(px) - hx + r,
      qy = Math.abs(py) - hy + r,
      qz = Math.abs(pz) - hz + r;
    const ox = Math.max(qx, 0),
      oy = Math.max(qy, 0),
      oz = Math.max(qz, 0);
    return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
  }
  // shape records: { kind:'e'|'c'|'b', sub, k, ... }
  // e: { c:[x,y,z], r:[rx,ry,rz], rot:[a,b,c]? }   c: { a:[..], b:[..], r1, r2 }   b: { c, h:[hx,hy,hz], round, rot? }
  function prep(s) {
    const o = Object.assign({ k: 0.5, sub: false }, s);
    if (o.kind === 'c') {
      const ba = [o.b[0] - o.a[0], o.b[1] - o.a[1], o.b[2] - o.a[2]];
      o.ba = ba;
      o.l2 = Math.max(1e-6, ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2]);
      o.rr = o.r1 - o.r2;
      o.a2 = o.l2 - o.rr * o.rr;
      o.il2 = 1 / o.l2;
      const m = Math.max(o.r1, o.r2);
      o.min = [Math.min(o.a[0], o.b[0]) - m, Math.min(o.a[1], o.b[1]) - m, Math.min(o.a[2], o.b[2]) - m];
      o.max = [Math.max(o.a[0], o.b[0]) + m, Math.max(o.a[1], o.b[1]) + m, Math.max(o.a[2], o.b[2]) + m];
    } else {
      o.m = rot(o.rot);
      const e = o.kind === 'b' ? o.h : o.r,
        m = Math.max(e[0], e[1], e[2]) * (o.m ? 1 : 0),
        ex = o.m ? [m, m, m] : e;
      o.min = [o.c[0] - ex[0], o.c[1] - ex[1], o.c[2] - ex[2]];
      o.max = [o.c[0] + ex[0], o.c[1] + ex[1], o.c[2] + ex[2]];
    }
    return o;
  }
  function dist(o, x, y, z) {
    if (o.kind === 'c') return roundCone(o, x, y, z);
    let px = x - o.c[0],
      py = y - o.c[1],
      pz = z - o.c[2];
    if (o.m) {
      const m = o.m,
        lx = m[0] * px + m[3] * py + m[6] * pz,
        ly = m[1] * px + m[4] * py + m[7] * pz,
        lz = m[2] * px + m[5] * py + m[8] * pz;
      px = lx;
      py = ly;
      pz = lz;
    }
    if (o.kind === 'b') return roundBox(px, py, pz, o.h[0], o.h[1], o.h[2], o.round || 0);
    return ellipsoid(px, py, pz, o.r[0], o.r[1], o.r[2]);
  }
  const smin = (a, b, k) => {
    if (k <= 0) return Math.min(a, b);
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };
  const smax = (a, b, k) => -smin(-a, -b, k);
  // corner pairs of a cell's twelve edges (corner index = dx + 2*dy + 4*dz)
  const EDGES = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
  /**
   * shapes: list of shape records (see prep). opts: { voxel, ao:[step, count, strength], mirrorX }
   * Returns { geometry:{p,n,idx}, sample(x,y,z), bounds:{min,max}, triangles }
   */
  function sculpt(shapes, opts = {}) {
    const vs = opts.voxel || 0.5;
    let list = shapes.map(prep);
    if (opts.mirrorX)
      list = list.concat(
        shapes
          .filter(s => !s.center)
          .map(s => {
            const t = JSON.parse(JSON.stringify(s));
            if (t.kind === 'c') {
              t.a[0] = -t.a[0];
              t.b[0] = -t.b[0];
            } else {
              t.c[0] = -t.c[0];
              if (t.rot) t.rot = [t.rot[0], -t.rot[1], -t.rot[2]];
            }
            return prep(t);
          }),
      );
    // keep carving after the shapes it carves: additions first, then subtractions, each in the given order
    list = list.filter(s => !s.sub).concat(list.filter(s => s.sub));
    const aoStep = opts.ao?.[0] ?? vs * 1.5,
      aoCount = opts.ao?.[1] ?? 5,
      aoK = opts.ao?.[2] ?? 1;
    const reach = aoStep * aoCount + vs * 2;
    const min = [BIG, BIG, BIG],
      max = [-BIG, -BIG, -BIG];
    for (const s of list)
      if (!s.sub)
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i], s.min[i] - s.k - vs * 2);
          max[i] = Math.max(max[i], s.max[i] + s.k + vs * 2);
        }
    const NX = Math.ceil((max[0] - min[0]) / vs) + 1,
      NY = Math.ceil((max[1] - min[1]) / vs) + 1,
      NZ = Math.ceil((max[2] - min[2]) / vs) + 1;
    if (NX * NY * NZ > 9e6) throw new Error('sculpt grid too large: ' + NX + 'x' + NY + 'x' + NZ);
    const F = new Float32Array(NX * NY * NZ).fill(BIG),
      SXY = NX * NY;
    for (const s of list) {
      const pad = s.k + reach;
      const i0 = Math.max(0, Math.floor((s.min[0] - pad - min[0]) / vs)),
        i1 = Math.min(NX - 1, Math.ceil((s.max[0] + pad - min[0]) / vs)),
        j0 = Math.max(0, Math.floor((s.min[1] - pad - min[1]) / vs)),
        j1 = Math.min(NY - 1, Math.ceil((s.max[1] + pad - min[1]) / vs)),
        k0 = Math.max(0, Math.floor((s.min[2] - pad - min[2]) / vs)),
        k1 = Math.min(NZ - 1, Math.ceil((s.max[2] + pad - min[2]) / vs));
      for (let k = k0; k <= k1; k++) {
        const z = min[2] + k * vs;
        for (let j = j0; j <= j1; j++) {
          const y = min[1] + j * vs,
            row = j * NX + k * SXY;
          for (let i = i0; i <= i1; i++) {
            const d = dist(s, min[0] + i * vs, y, z),
              at = row + i;
            F[at] = s.sub ? smax(F[at], -d, s.k) : smin(F[at], d, s.k);
          }
        }
      }
    }
    const sample = (x, y, z) => {
      let fx = (x - min[0]) / vs,
        fy = (y - min[1]) / vs,
        fz = (z - min[2]) / vs;
      if (fx < 0 || fy < 0 || fz < 0 || fx >= NX - 1 || fy >= NY - 1 || fz >= NZ - 1) return BIG;
      const i = fx | 0,
        j = fy | 0,
        k = fz | 0;
      fx -= i;
      fy -= j;
      fz -= k;
      const a = i + j * NX + k * SXY;
      const c00 = F[a] + (F[a + 1] - F[a]) * fx,
        c10 = F[a + NX] + (F[a + NX + 1] - F[a + NX]) * fx,
        c01 = F[a + SXY] + (F[a + SXY + 1] - F[a + SXY]) * fx,
        c11 = F[a + NX + SXY] + (F[a + NX + SXY + 1] - F[a + NX + SXY]) * fx;
      const c0 = c00 + (c10 - c00) * fy,
        c1 = c01 + (c11 - c01) * fy;
      return c0 + (c1 - c0) * fz;
    };
    const grad = (x, y, z, h) => {
      const gx = sample(x + h, y, z) - sample(x - h, y, z),
        gy = sample(x, y + h, z) - sample(x, y - h, z),
        gz = sample(x, y, z + h) - sample(x, y, z - h),
        l = Math.hypot(gx, gy, gz) || 1;
      return [gx / l, gy / l, gz / l];
    };
    // one vertex per cell the surface passes through
    const cellIndex = new Int32Array((NX - 1) * (NY - 1) * (NZ - 1)).fill(-1),
      CX = NX - 1,
      CXY = (NX - 1) * (NY - 1);
    const P = [],
      corner = new Float32Array(8);
    for (let k = 0; k < NZ - 1; k++)
      for (let j = 0; j < NY - 1; j++)
        for (let i = 0; i < NX - 1; i++) {
          let mask = 0;
          for (let c = 0; c < 8; c++) {
            const v = F[i + (c & 1) + (j + ((c >> 1) & 1)) * NX + (k + ((c >> 2) & 1)) * SXY];
            corner[c] = v;
            if (v < 0) mask |= 1 << c;
          }
          if (mask === 0 || mask === 255) continue;
          let sx = 0,
            sy = 0,
            sz = 0,
            n = 0;
          for (let e = 0; e < 24; e += 2) {
            const c0 = EDGES[e],
              c1 = EDGES[e + 1],
              a = corner[c0],
              b = corner[c1];
            if (a < 0 === b < 0) continue;
            const t = a / (a - b);
            sx += (c0 & 1) + ((c1 & 1) - (c0 & 1)) * t;
            sy += ((c0 >> 1) & 1) + (((c1 >> 1) & 1) - ((c0 >> 1) & 1)) * t;
            sz += ((c0 >> 2) & 1) + (((c1 >> 2) & 1) - ((c0 >> 2) & 1)) * t;
            n++;
          }
          cellIndex[i + j * CX + k * CXY] = P.length / 3;
          P.push(min[0] + (i + sx / n) * vs, min[1] + (j + sy / n) * vs, min[2] + (k + sz / n) * vs);
        }
    const idx = [];
    const cell = (i, j, k) => cellIndex[i + j * CX + k * CXY];
    for (let k = 1; k < NZ - 1; k++)
      for (let j = 1; j < NY - 1; j++)
        for (let i = 1; i < NX - 1; i++) {
          const a = F[i + j * NX + k * SXY],
            inA = a < 0;
          // edge along x
          if (i < NX - 1 && inA !== F[i + 1 + j * NX + k * SXY] < 0) {
            const q = [cell(i, j - 1, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i, j - 1, k)];
            if (q.every(v => v >= 0)) idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
          }
          if (j < NY - 1 && inA !== F[i + (j + 1) * NX + k * SXY] < 0) {
            const q = [cell(i - 1, j, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i - 1, j, k)];
            if (q.every(v => v >= 0)) idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
          }
          if (k < NZ - 1 && inA !== F[i + j * NX + (k + 1) * SXY] < 0) {
            const q = [cell(i - 1, j - 1, k), cell(i, j - 1, k), cell(i, j, k), cell(i - 1, j, k)];
            if (q.every(v => v >= 0)) idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
          }
        }
    // settle each vertex onto the surface, take its normal from the field, then measure how buried it is
    const N = new Array(P.length);
    const h = vs * 0.5;
    for (let v = 0; v < P.length; v += 3) {
      let x = P[v],
        y = P[v + 1],
        z = P[v + 2];
      for (let it = 0; it < 2; it++) {
        const g = grad(x, y, z, h),
          d = sample(x, y, z);
        if (!(Math.abs(d) < vs)) break;
        x -= g[0] * d;
        y -= g[1] * d;
        z -= g[2] * d;
      }
      P[v] = x;
      P[v + 1] = y;
      P[v + 2] = z;
      const g = grad(x, y, z, h);
      let occ = 0,
        w = 1;
      for (let s = 1; s <= aoCount; s++) {
        const hh = aoStep * s,
          d = sample(x + g[0] * hh, y + g[1] * hh, z + g[2] * hh);
        occ += Math.max(0, hh - Math.min(d, hh)) * w;
        w *= 0.72;
      }
      const ao = Math.max(0.12, Math.min(1, 1 - (occ / (aoStep * 2.2)) * aoK));
      N[v] = g[0] * ao;
      N[v + 1] = g[1] * ao;
      N[v + 2] = g[2] * ao;
    }
    // even out the occlusion between neighbours: a coarse grid leaves it speckled
    const nv = P.length / 3,
      sum = new Float32Array(nv),
      cnt = new Float32Array(nv),
      len = new Float32Array(nv);
    for (let v = 0; v < nv; v++) len[v] = Math.hypot(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]);
    for (let t = 0; t < idx.length; t += 3)
      for (let a = 0; a < 3; a++) {
        const v = idx[t + a];
        for (let b = 0; b < 3; b++) {
          sum[v] += len[idx[t + b]];
          cnt[v]++;
        }
      }
    for (let v = 0; v < nv; v++) {
      const ao = cnt[v] ? sum[v] / cnt[v] : len[v],
        k = ao / (len[v] || 1);
      N[v * 3] *= k;
      N[v * 3 + 1] *= k;
      N[v * 3 + 2] *= k;
    }
    return { geometry: { p: P, n: N, idx }, sample, grad: (x, y, z) => grad(x, y, z, h), bounds: { min, max }, triangles: idx.length / 3 };
  }
  // helpers for writing shape lists
  const S = {
    e: (c, r, k = 0.5, extra = {}) => Object.assign({ kind: 'e', c, r, k }, extra),
    c: (a, b, r1, r2 = r1, k = 0.5, extra = {}) => Object.assign({ kind: 'c', a, b, r1, r2, k }, extra),
    b: (c, h, round = 0.2, k = 0.5, extra = {}) => Object.assign({ kind: 'b', c, h, round, k }, extra),
  };
  // Built once per page: leaving a world and coming back reuses the finished mesh.
  // opts.keep holds on to the field so callers can sample the surface (to lay chains on a body, say).
  const cache = {};
  K.sculpt = function (engine, name, shapes, opts = {}) {
    let res = cache[name];
    if (!res || (opts.keep && !res.sample)) {
      res = sculpt(shapes, opts);
      if (!opts.keep) res.sample = res.grad = null;
      cache[name] = res;
    }
    if (!engine.geometries[name]) engine.addGeometry(name, res.geometry);
    return res;
  };
  K.Sculpt = { build: sculpt, S, cache };
})((window.KO ||= {}));

// FILE: src/core/input.js
(function (K) {
  'use strict';
  class Input {
    constructor(canvas) {
      this.canvas = canvas;
      this.keys = new Set();
      this.pressed = new Set();
      this.dx = 0;
      this.dy = 0;
      this.fire = false;
      this.mouseFire = false;
      this.touchFire = false;
      this.idle = { keys: new Set(), look: () => [0, 0], axes: () => ({ x: 0, y: 0, z: 0, boost: false }),
        take: () => false, takeWheel: () => 0, fire: false };
      this.mobile = matchMedia('(pointer: coarse)').matches;
      this.stick = [0, 0];
      this.touchUp = false;
      this.touchDown = false;
      this.touchBoost = false;
      this.sensitivity = 1;
      this.enabled = false;
      this.drag = null;
      this.onPause = () => {};
      this.cleanup = [];
      this.contacts = new Map();
      this.aimPointer = null;
      this.movePointer = null;
      this.stickOrigin = [0, 0];
      this.stickBoost = false;
      this.tapTouches = new Map();
      this.lockPending = false;
      this.wheel = 0;
      this.rightDown = null;
      this.lockSettle = 0; // until then a locked mouse's moves are not taken: the jump into the lock comes first
      this.moveAvg = 0; // how far the locked mouse has lately moved per report
      this.moveT = 0;
      this.spikes = 0;
      this.on(window, 'keydown', e => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        if (e.code === 'Escape' || e.code === 'KeyP') {
          if (!e.repeat) {
            this.clear();
            this.onPause();
          }
          return;
        }
        if (!this.enabled) return;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
        if (!this.keys.has(e.code)) this.pressed.add(e.code);
        this.keys.add(e.code);
      });
      this.on(window, 'keyup', e => this.keys.delete(e.code));
      this.on(window, 'blur', () => this.clear());
      this.on(window, 'resize', () => this.clear());
      this.on(document, 'visibilitychange', () => {
        if (document.hidden) {
          this.clear();
          this.onBlur?.();
        }
      });
      this.on(canvas, 'contextmenu', e => e.preventDefault());
      this.on(canvas, 'touchstart', e => {
        if (this.enabled) e.preventDefault();
      }, { passive: false });
      this.on(canvas, 'pointerdown', e => {
        if (!this.enabled) return;
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          e.preventDefault();
          const move = this.mobile && e.clientX < innerWidth / 2;
          if (move && this.movePointer !== null) return;
          this.beginContact(e, move ? 'move' : 'aim');
        }
      });
      // The mouse buttons are read from mousedown/mouseup: a pointerdown comes only for the first button held,
      // so a right press while the left is still down (cutting, then grabbing) would otherwise be lost.
      this.on(canvas, 'mousedown', e => {
        if (!this.enabled || e.sourceCapabilities?.firesTouchEvents) return;
        const locked = document.pointerLockElement === canvas;
        if (e.button === 0) {
          this.mouseFire = true;
          this.pressed.add('Fire');
          this.syncFire();
          if (!locked && !this.mobile) this.requestLock();
        }
        if (e.button === 2) {
          // right button: the tractor beam, on the press. Without a locked mouse it also drags the view; a short click still grabs.
          if (locked) this.pressed.add('KeyQ');
          else {
            // event times, not the time it is handled: a slow frame must not turn a click into a drag
            this.drag = [e.clientX, e.clientY];
            this.rightDown = { t: e.timeStamp, moved: 0 };
            if (!this.mobile) this.requestLock();
          }
        }
      });
      this.on(window, 'mouseup', e => {
        if (e.sourceCapabilities?.firesTouchEvents) return;
        if (e.button === 0) {
          this.mouseFire = false;
          this.syncFire();
        }
        if (e.button === 2) {
          const rd = this.rightDown;
          if (rd && rd.moved < 14 && e.timeStamp - rd.t < 800 && this.enabled) this.pressed.add('KeyQ');
          this.rightDown = null;
          this.drag = null;
        }
      });
      this.on(
        canvas,
        'wheel',
        e => {
          if (!this.enabled) return;
          e.preventDefault();
          this.wheel += Math.sign(e.deltaY);
        },
        { passive: false },
      );
      const release = e => {
        this.finishContact(e);
        // the mouse buttons are let go in mouseup; a cancelled mouse pointer lets go of both
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen' && e.type === 'pointercancel') {
          this.mouseFire = false;
          this.syncFire();
          this.rightDown = null;
          this.drag = null;
        }
      };
      this.on(window, 'pointerup', release);
      this.on(window, 'pointercancel', release);
      this.on(document, 'lostpointercapture', release);
      this.on(window, 'pointermove', e => {
        if (!this.enabled) return;
        const contact = this.contacts.get(e.pointerId);
        if (contact) {
          this.moveContact(e, contact);
          return;
        }
        if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
        if (document.pointerLockElement === canvas) {
          if (e.timeStamp < this.lockSettle) return;
          // A locked mouse now and then reports one wild jump of hundreds of pixels among ordinary moves (more often
          // when frames are slow): the view would be flung into the ground. Each report is weighed against how fast
          // a hand can move in the time since the last one, and a jump past that is left out.
          const list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
          this.lockedMoves(list.length ? list : [e]);
        } else if (this.drag) {
          this.dx += (e.clientX - this.drag[0]) * 0.003 * this.sensitivity;
          this.dy += (e.clientY - this.drag[1]) * 0.003 * this.sensitivity;
          if (this.rightDown) this.rightDown.moved += Math.abs(e.clientX - this.drag[0]) + Math.abs(e.clientY - this.drag[1]);
          this.drag = [e.clientX, e.clientY];
        }
      });
      this.on(document, 'pointerlockchange', e => {
        this.lockPending = false;
        if (document.pointerLockElement === canvas) {
          this.lockSettle = (e?.timeStamp || performance.now()) + 120;
          this.moveAvg = 0;
          this.moveT = 0;
        }
        // the right press that asked for the lock is a tractor press already
        if (document.pointerLockElement === canvas && this.rightDown) {
          if (this.enabled) this.pressed.add('KeyQ');
          this.rightDown = null;
          this.drag = null;
        }
        if (document.pointerLockElement !== canvas) {
          this.mouseFire = false;
          this.syncFire();
          this.drag = null;
          this.dx = this.dy = 0;
        }
      });
      this.on(document, 'pointerlockerror', () => {
        this.lockPending = false;
      });
    }
    // moves of a locked mouse, each with its own time: [{ movementX, movementY, timeStamp }]
    lockedMoves(list) {
      for (const m of list) {
        const gap = Math.min(250, Math.max(1, m.timeStamp - (this.moveT || m.timeStamp - 16)));
        this.moveT = m.timeStamp;
        const mx = m.movementX || 0,
          my = m.movementY || 0,
          big = Math.max(Math.abs(mx), Math.abs(my)),
          plausible = 60 + gap * 9 + this.moveAvg * 3;
        if (big > plausible) {
          this.spikes++;
          continue;
        }
        this.moveAvg = this.moveAvg * 0.85 + big * 0.15;
        this.dx += mx * 0.0021 * this.sensitivity;
        this.dy += my * 0.0021 * this.sensitivity;
      }
    }
    on(el, ev, fn, opts) {
      el.addEventListener(ev, fn, opts);
      this.cleanup.push(() => el.removeEventListener(ev, fn, opts));
    }
    syncFire() {
      const down = this.mouseFire || this.touchFire;
      if (down && !this.fire) this.fireGesture = (this.fireGesture || 0) + 1;
      this.fire = down;
    }
    requestLock() {
      if (!this.enabled || this.mobile || this.lockPending || !this.canvas.requestPointerLock) return;
      this.lockPending = true;
      try {
        const p = this.canvas.requestPointerLock();
        if (p?.catch)
          p.catch(() => {
            this.lockPending = false;
          });
      } catch {
        this.lockPending = false;
      }
    }
    beginContact(e, role, field = null, onRelease = null) {
      const el = e.currentTarget;
      if (el !== this.canvas && [...this.contacts.values()].some(c => c.el === el)) return;
      // With a stick already down, a second flight control adds thrust and can steer the view.
      if (role === 'move' && this.movePointer !== null) role = 'aim';
      const contact = { el, role, field, onRelease, x: e.clientX, y: e.clientY, dragged: false };
      this.contacts.set(e.pointerId, contact);
      if (role === 'move' && this.movePointer === null) {
        this.movePointer = e.pointerId;
        this.stickOrigin = [e.clientX, e.clientY];
        const pad = document.getElementById('joystick');
        pad.style.left = e.clientX + 'px';
        pad.style.top = e.clientY + 'px';
        pad.classList.add('active');
        document.getElementById('moveHint').classList.add('quiet');
      }
      if (field) {
        this[field] = true;
        if (el.dataset.action === 'beam') this.pressed.add('CutterTap');
        el.setAttribute('aria-pressed', 'true');
        this.syncFire();
      }
      if (el !== this.canvas) el.classList.add('held');
      try { el.setPointerCapture(e.pointerId); } catch {}
    }
    moveContact(e, contact) {
      if (contact.role === 'move') {
        if (e.pointerId === this.movePointer) this.moveStick(e);
        return;
      }
      const dx = e.clientX - contact.x, dy = e.clientY - contact.y;
      if (!dx && !dy) return;
      if (!contact.dragged) {
        // Ignore tap jitter. A deliberate drag can take over from a resting thumb.
        if (Math.hypot(dx, dy) < 3) return;
        contact.dragged = true;
        if (contact.role === 'aim') this.aimPointer = e.pointerId;
      }
      contact.x = e.clientX;
      contact.y = e.clientY;
      if (contact.role === 'distance') {
        this.wheel -= dy / 10;
        return;
      }
      if (this.aimPointer === null) this.aimPointer = e.pointerId;
      if (this.aimPointer === e.pointerId) {
        this.dx += dx * 0.0045 * this.sensitivity;
        this.dy += dy * 0.0045 * this.sensitivity;
      }
    }
    finishContact(e) {
      const contact = this.contacts.get(e.pointerId);
      if (!contact) return;
      const completed = e.type === 'pointerup' && this.enabled;
      if (completed) this.moveContact(e, contact);
      this.contacts.delete(e.pointerId);
      if (this.aimPointer === e.pointerId) this.aimPointer = null;
      if (this.movePointer === e.pointerId) this.releaseStick();
      if (contact.field) {
        this[contact.field] = false;
        if (!completed && contact.field === 'touchFire') this.pressed.delete('CutterTap');
        contact.el.setAttribute('aria-pressed', 'false');
        this.syncFire();
      }
      if (contact.el !== this.canvas) contact.el.classList.remove('held');
      if (completed && contact.onRelease && !contact.el.classList.contains('hidden'))
        this.pressed.add(contact.onRelease);
    }
    moveStick(e) {
      const pad = document.getElementById('joystick'),
        knob = document.getElementById('stickKnob');
      const radius = (pad?.getBoundingClientRect().width || 112) * 0.35;
      let x = (e.clientX - this.stickOrigin[0]) / radius,
        y = (e.clientY - this.stickOrigin[1]) / radius;
      const length = Math.hypot(x, y);
      this.stickBoost = length > (this.stickBoost ? 1.35 : 1.7);
      if (length > 1) {
        x /= length;
        y /= length;
      }
      // a small push moves gently, a full push moves fully
      const l = Math.min(length, 1),
        amount = l < 0.08 ? 0 : Math.pow((l - 0.08) / 0.92, 1.45);
      this.stick = l ? [(x / l) * amount, (-y / l) * amount] : [0, 0];
      if (knob) knob.style.transform = `translate(${x * radius}px,${y * radius}px)`;
    }
    releaseStick() {
      this.stickBoost = false;
      this.movePointer = null;
      this.stick = [0, 0];
      document.getElementById('joystick')?.classList.remove('active');
      const k = document.getElementById('stickKnob');
      if (k) k.style.transform = 'translate(0,0)';
      document.getElementById('moveHint')?.classList.remove('quiet');
    }
    bindTap(id, action) {
      const button = document.getElementById(id);
      if (!button) return;
      const available = () => this.enabled && !button.classList.contains('hidden');
      // Native clicks cover mouse, pen and keyboard. On touch, finish the tap ourselves:
      // a second thumb may not generate a click, and a late click can land on the dialog just opened.
      this.on(button, 'click', () => {
        if (available()) action();
      });
      this.on(button, 'touchstart', e => {
        e.preventDefault();
        if (!available() || this.tapTouches.has(id)) return;
        this.tapTouches.set(id, e.changedTouches[0].identifier);
        button.classList.add('held');
      }, { passive: false });
      const finish = e => {
        e.preventDefault();
        const finger = Array.from(e.changedTouches).find(t => t.identifier === this.tapTouches.get(id));
        if (!finger) return;
        this.tapTouches.delete(id);
        button.classList.remove('held');
        if (e.type === 'touchend' && available() && button.contains(document.elementFromPoint(finger.clientX, finger.clientY)))
          action();
      };
      this.on(button, 'touchend', finish, { passive: false });
      this.on(button, 'touchcancel', finish, { passive: false });
    }
    bindTouch() {
      this.on(document.getElementById('hud'), 'contextmenu', e => e.preventDefault());
      const bind = (id, role, field = null, key = null) => {
        const button = document.getElementById(id);
        if (!button) return;
        this.on(button, 'pointerdown', e => {
          if (!this.enabled || button.classList.contains('hidden') || e.button !== 0) return;
          e.preventDefault();
          const throwing = id === 'touchFire' && button.dataset.action === 'throw';
          this.beginContact(e, role, throwing ? null : field, throwing ? 'Throw' : key);
        });
        // A keyboard or assistive click has no corresponding pointer release.
        this.on(button, 'click', e => {
          if (!this.enabled || e.detail !== 0 || button.classList.contains('hidden')) return;
          if (key) this.pressed.add(key);
          else if (button.dataset.action === 'throw') this.pressed.add('Throw');
        });
      };
      bind('touchFire', 'aim', 'touchFire');
      bind('touchGrab', 'aim', null, 'KeyQ');
      bind('touchPulse', 'aim', null, 'KeyF');
      bind('touchRange', 'distance');
      bind('touchUp', 'move', 'touchUp');
      bind('touchDown', 'move', 'touchDown');
      bind('touchBoost', 'move', 'touchBoost');
    }
    axes() {
      return {
        x: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0) + this.stick[0],
        z:
          (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
          (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
          this.stick[1],
        y:
          (this.keys.has('Space') || this.touchUp ? 1 : 0) -
          (this.keys.has('KeyC') || this.keys.has('ControlLeft') || this.touchDown ? 1 : 0),
        boost: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchBoost || this.stickBoost,
      };
    }
    take(key) {
      const yes = this.pressed.has(key);
      this.pressed.delete(key);
      return yes;
    }
    look() {
      const p = [this.dx, this.dy];
      this.dx = this.dy = 0;
      return p;
    }
    takeWheel() {
      const w = this.wheel;
      this.wheel = 0;
      return w;
    }
    end() {
      this.pressed.clear();
    }
    clear() {
      const contacts = [...this.contacts];
      this.contacts.clear();
      this.aimPointer = null;
      this.keys.clear();
      this.pressed.clear();
      this.mouseFire = false;
      this.touchFire = false;
      this.fire = false;
      this.touchUp = false;
      this.touchDown = false;
      this.touchBoost = false;
      this.dx = this.dy = 0;
      this.wheel = 0;
      this.drag = null;
      this.rightDown = null;
      this.releaseStick();
      for (const [id, { el, field }] of contacts) {
        if (field) el.setAttribute('aria-pressed', 'false');
        try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id); } catch {}
      }
      this.tapTouches.clear();
      document.querySelectorAll('#hud .held').forEach(b => b.classList.remove('held'));
    }
    dispose() {
      this.clear();
      for (const f of this.cleanup) f();
    }
  }
  K.Input = Input;
})((window.KO ||= {}));

// FILE: src/core/audio.js
/* Synthesized diegetic audio. No downloads; no music in space.
 * Residents get formant-synth voices per species, a crowd murmur bed and wind.
 * The whole context is suspended whenever the tab is hidden or the game is paused. */
(function (K) {
  'use strict';
  const VOWELS = {
    a: [780, 1180, 2550],
    o: [520, 880, 2450],
    e: [500, 1750, 2600],
    i: [320, 2250, 3000],
    u: [350, 760, 2300],
  };
  const VOWEL_KEYS = Object.keys(VOWELS);
  // Each species speaks through its own body: source wave, pitch range, formant shift and texture.
  const VOICES = {
    eden: { wave: 'sawtooth', f0: [250, 360], shift: 1.08, vib: 6.2, depth: 0.035, noise: 0.12, lp: 4200, gain: 1 },
    mycel: { wave: 'square', f0: [120, 185], shift: 0.62, vib: 4.5, depth: 0.05, noise: 0.18, trem: 19, lp: 2100, gain: 1.1 },
    cinder: { wave: 'sawtooth', f0: [105, 160], shift: 0.86, vib: 5.2, depth: 0.03, noise: 0.42, drive: 4, lp: 3000, gain: 0.8 },
    nacre: { wave: 'sine', f0: [380, 560], shift: 1.45, vib: 8.5, depth: 0.025, noise: 0.05, glass: 2.76, q: 11, lp: 7000, gain: 0.85 },
    subject: { wave: 'sawtooth', f0: [200, 290], shift: 1, vib: 6, depth: 0.03, noise: 0.15, lp: 3800, gain: 1 },
    damned: { wave: 'sawtooth', f0: [150, 250], shift: 0.9, vib: 4.2, depth: 0.075, noise: 0.34, drive: 2.2, lp: 2500, gain: 0.95 },
  };

  /* NICAEA — John Bacchus Dykes, 1861 (public domain). SATB in D major as [midi, beats].
   * Vowels follow Reginald Heber's 1826 text (public domain), one per sung syllable. */
  const NICAEA = {
    bpm: 66,
    parts: [
      [62,1,62,1,66,1,66,1, 69,2,69,2, 71,2,71,1,71,1, 69,2,66,2,
       69,1.5,69,.5,69,1,69,1, 74,2,73,1,69,1, 64,1,69,1,71,1.5,69,.5, 69,4,
       62,1,62,1,66,1,66,1, 69,2,69,2, 71,1.5,71,.5,71,1,71,1, 69,2,69,2,
       74,2,69,1,69,1, 71,2,66,2, 67,1,64,1,64,1.5,62,.5, 62,4],
      [57,1,57,1,62,1,62,1, 61,1,64,1,62,1,61,1, 59,1,61,1,62,1,64,1, 66,2,62,2,
       64,1.5,64,.5,66,1,64,1, 62,1,64,1,64,1,66,1, 64,1,61,1,62,1.5,61,.5, 61,4,
       57,1,57,1,62,1,62,1, 61,1,64,1,62,1,61,1, 59,1,61,.5,61,.5,62,1,64,1, 66,2,62,2,
       62,2,62,1,62,1, 62,2,62,1,61,1, 59,1,59,1,61,1.5,62,.5, 62,4],
      [54,1,54,1,50,1,50,1, 52,1,55,1,54,1,57,1, 55,1,57,1,59,1,61,1, 62,1,57,1,57,2,
       57,1,57,1,57,1,57,1, 54,1,56,1,57,1,57,1, 61,1,57,1,56,1.5,57,.5, 57,2,55,2,
       54,1,54,1,50,1,50,1, 52,1,55,1,54,1,57,1, 55,1,57,.5,57,.5,59,1,61,1, 62,1,57,1,54,2,
       54,1,55,1,57,1,60,1, 59,2,57,2, 55,1,55,1,55,1.5,54,.5, 54,4],
      [50,1,50,1,47,1,47,1, 45,2,50,2, 43,2,55,1,55,1, 50,2,50,2,
       49,1,49,1,50,1,49,1, 47,2,49,1,50,1, 52,1,52,1,52,1.5,45,.5, 45,4,
       50,1,50,1,47,1,47,1, 45,2,50,2, 43,1.5,43,.5,55,1,55,1, 50,2,50,2,
       47,2,42,1,42,1, 43,2,50,2, 43,1,43,1,45,1.5,50,.5, 50,4],
    ],
    vowels: 'oioioiooaai' + 'iiieoiaoaaui' + 'oioioieiuaai' + 'oiieoeeiii',
  };
  const FORMANTS = {
    a: [760, 1200, 2600],
    e: [520, 1720, 2500],
    i: [390, 1950, 2650],
    o: [500, 880, 2500],
    u: [390, 820, 2400],
  };
  class AudioSystem {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.volume = 0.5;
      this.lastImpact = -100;
      this.engineLevel = 0;
      this.laserLevel = 0;
      this.voices = 0;
      this.lastVoice = -100;
      this.held = false;
      this.babble = [];
      this.murmurLevel = 0;
      this.murmurSpecies = 'eden';
      this.windLevel = 0;
      this.murmurCurrent = 0;
    }
    start() {
      try {
        if (!this.ctx) {
          const A = window.AudioContext || window.webkitAudioContext;
          if (!A) return;
          this.ctx = new A();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : this.volume;
          const compressor = this.ctx.createDynamicsCompressor();
          compressor.threshold.value = -16;
          compressor.ratio.value = 8;
          this.master.connect(compressor);
          compressor.connect(this.ctx.destination);
          this.engineGain = this.ctx.createGain();
          this.engineGain.gain.value = 0;
          this.engineGain.connect(this.master);
          this.engine = this.ctx.createOscillator();
          this.engine.type = 'sine';
          this.engine.frequency.value = 42;
          this.engine.connect(this.engineGain);
          this.engine.start();
          this.engine2 = this.ctx.createOscillator();
          this.engine2.type = 'sine';
          this.engine2.frequency.value = 63;
          const quiet = this.ctx.createGain();
          quiet.gain.value = 0.3;
          this.engine2.connect(quiet);
          quiet.connect(this.engineGain);
          this.engine2.start();
          this.laserGain = this.ctx.createGain();
          this.laserGain.gain.value = 0;
          this.laserGain.connect(this.master);
          this.laser = this.ctx.createOscillator();
          this.laser.type = 'sawtooth';
          this.laser.frequency.value = 94;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 450;
          this.laser.connect(filter);
          filter.connect(this.laserGain);
          this.laser.start();
          this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
          let n = this.noise.getChannelData(0);
          for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
          this.voiceBus = this.ctx.createGain();
          this.voiceBus.gain.value = 0.9;
          this.voiceBus.connect(this.master);
          this.makeWind();
        }
        if (!this.held) this.ctx.resume()?.catch(() => {});
      } catch (e) {
        console.warn('Audio unavailable:', e.message);
      }
    }
    // Hidden tab, minimized window or pause menu: nothing keeps sounding.
    hold(on) {
      this.held = !!on;
      if (!this.ctx) return;
      try {
        if (on) this.ctx.suspend()?.catch(() => {});
        else this.ctx.resume()?.catch(() => {});
      } catch {}
    }
    setMuted(v) {
      this.muted = v;
      this.applyVolume();
    }
    applyVolume() {
      if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.08);
    }
    live() {
      return !!this.ctx && !this.muted && !this.held && this.ctx.state === 'running';
    }
    tone(f = 440, d = 0.12, v = 0.12, end = f, dest = null, type = 'sine', delay = 0) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + delay,
        o = this.ctx.createOscillator(),
        g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g);
      g.connect(dest || this.master);
      o.start(t);
      o.stop(t + d + 0.04);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    }
    noiseHit(d = 0.3, v = 0.25, cutoff = 900, dest = null, type = 'lowpass', end = 80, delay = 0, q = 0.7) {
      if (!this.ctx || this.muted) return;
      const c = this.ctx,
        t = c.currentTime + delay,
        s = c.createBufferSource(),
        f = c.createBiquadFilter(),
        g = c.createGain();
      s.buffer = this.noise;
      f.type = type;
      f.Q.value = q;
      f.frequency.setValueAtTime(cutoff, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(30, end), t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f);
      f.connect(g);
      g.connect(dest || this.master);
      s.start(t, Math.random() * 1.5);
      s.stop(t + d + 0.05);
      s.onended = () => {
        s.disconnect();
        f.disconnect();
        g.disconnect();
      };
    }
    impact(strength = 1) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (t - this.lastImpact < 0.055) return;
      this.lastImpact = t;
      this.noiseHit(0.16 + strength * 0.18, 0.15 + Math.min(strength, 2) * 0.16, 1800);
      this.tone(82 + Math.random() * 20, 0.25 + strength * 0.1, 0.18, 28);
    }
    metal() {
      this.tone(480, 0.12, 0.07, 170);
      this.noiseHit(0.1, 0.06, 2500);
    }
    pulse() {
      this.tone(120, 0.8, 0.5, 24);
      this.noiseHit(0.65, 0.33, 1600);
    }
    // The tractor beam: a low throb while it holds something, straining higher the harder it pulls.
    tractor(level, strain = 0) {
      if (!this.ctx) return;
      const c = this.ctx;
      if (!this.beamGain) {
        this.beamGain = c.createGain();
        this.beamGain.gain.value = 0;
        this.beamGain.connect(this.master);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 420;
        lp.Q.value = 5;
        const a = c.createOscillator(),
          b = c.createOscillator(),
          trem = c.createGain(),
          lfo = c.createOscillator(),
          depth = c.createGain();
        a.type = 'sawtooth';
        a.frequency.value = 52;
        b.type = 'sine';
        b.frequency.value = 104;
        trem.gain.value = 0.62;
        lfo.frequency.value = 6.5;
        depth.gain.value = 0.38;
        lfo.connect(depth);
        depth.connect(trem.gain);
        a.connect(lp);
        b.connect(lp);
        lp.connect(trem);
        trem.connect(this.beamGain);
        a.start();
        b.start();
        lfo.start();
        Object.assign(this, { beamA: a, beamB: b, beamLp: lp, beamLfo: lfo });
      }
      const t = c.currentTime;
      this.beamGain.gain.setTargetAtTime(level * 0.12, t, 0.05);
      this.beamA.frequency.setTargetAtTime(52 + strain * 64, t, 0.08);
      this.beamB.frequency.setTargetAtTime(104 + strain * 140, t, 0.08);
      this.beamLp.frequency.setTargetAtTime(420 + strain * 1100, t, 0.08);
      this.beamLfo.frequency.setTargetAtTime(6.5 + strain * 11, t, 0.1);
    }
    // caught: a deep thump under a rising zip
    grabSnap(weight = 1) {
      this.tone(150 - weight * 30, 0.34, 0.34, 46);
      this.tone(320, 0.2, 0.07, 980, null, 'triangle');
      this.noiseHit(0.24, 0.14, 1500);
    }
    // the beam reached for something and found nothing
    whiff() {
      this.tone(300, 0.24, 0.05, 130, null, 'triangle');
      this.noiseHit(0.18, 0.05, 2600, null, 'bandpass', 600, 0, 1.4);
    }
    // a held thing punted away hard
    throwKick() {
      this.tone(112, 0.4, 0.42, 34);
      this.noiseHit(0.44, 0.28, 3400, null, 'lowpass', 260);
      this.tone(640, 0.26, 0.05, 170, null, 'triangle');
    }
    // bugs crushed: the crack of shells and the wet give under them
    crunch(n = 1, pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, Math.min(1.2, gain)),
        k = Math.min(1, 0.45 + n * 0.08);
      for (let i = 0; i < Math.min(4, 1 + (n >> 2)); i++) {
        const at = i * 0.028 + Math.random() * 0.02;
        this.noiseHit(0.05, 0.34 * k, 6500, d, 'highpass', 3000, at, 0.8);
        this.noiseHit(0.17, 0.24 * k, 1400, d, 'bandpass', 260, at + 0.012, 2.2);
      }
      this.tone(220, 0.12, 0.12 * k, 70, d);
    }
    // many small feet on hard ground at once: a dry rustle that rises with how many are running
    skitter(level) {
      if (!this.ctx) return;
      const c = this.ctx;
      if (!this.skitterGain) {
        const src = c.createBufferSource(),
          bp = c.createBiquadFilter(),
          trem = c.createGain(),
          lfo = c.createOscillator(),
          depth = c.createGain();
        src.buffer = this.noise;
        src.loop = true;
        bp.type = 'bandpass';
        bp.frequency.value = 4200;
        bp.Q.value = 1.2;
        trem.gain.value = 0.55;
        lfo.type = 'square';
        lfo.frequency.value = 23;
        depth.gain.value = 0.45;
        lfo.connect(depth);
        depth.connect(trem.gain);
        this.skitterGain = c.createGain();
        this.skitterGain.gain.value = 0;
        src.connect(bp);
        bp.connect(trem);
        trem.connect(this.skitterGain);
        this.skitterGain.connect(this.master);
        src.start();
        lfo.start();
        this.skitterLfo = lfo;
      }
      const t = c.currentTime;
      this.skitterGain.gain.setTargetAtTime(Math.min(0.16, level * 0.16), t, 0.12);
      this.skitterLfo.frequency.setTargetAtTime(17 + level * 14, t, 0.2);
    }
    // the drive opening up
    boost() {
      this.noiseHit(0.55, 0.13, 700, null, 'bandpass', 3200, 0, 0.9);
      this.tone(64, 0.45, 0.1, 150);
    }
    success() {
      this.metal();
      setTimeout(() => this.tone(160, 0.7, 0.14, 110), 120);
    }
    // A short-lived stereo send for one positioned event.
    spot(pan = 0, gain = 1) {
      const c = this.ctx,
        g = c.createGain();
      g.gain.value = gain;
      let out = g;
      if (c.createStereoPanner) {
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(p);
        p.connect(this.master);
        out = p;
      } else g.connect(this.master);
      setTimeout(() => {
        try {
          g.disconnect();
          if (out !== g) out.disconnect();
        } catch {}
      }, 3500);
      return g;
    }
    /* Body hits, by weapon. Restrained but with weight: the click of breaking, then the thud. */
    gore(kind, pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      if (kind === 'cut') {
        this.noiseHit(0.34, 0.2, 5200, d, 'highpass', 2600);
        this.noiseHit(0.07, 0.3, 1300, d, 'bandpass', 500, 0, 1.6);
        this.tone(170, 0.16, 0.2, 55, d);
        this.noiseHit(0.5, 0.05, 900, d, 'bandpass', 3000, 0.08, 4);
      } else if (kind === 'crush') {
        for (let i = 0; i < 4; i++) this.noiseHit(0.035, 0.22, 2600 - i * 300, d, 'bandpass', 1400, i * 0.022, 2.4);
        this.tone(74, 0.32, 0.36, 28, d);
        this.noiseHit(0.26, 0.24, 520, d, 'lowpass', 90);
      } else if (kind === 'splat') {
        this.noiseHit(0.05, 0.25, 3200, d, 'highpass', 1800);
        this.noiseHit(0.24, 0.3, 1000, d, 'lowpass', 160);
        this.tone(118, 0.2, 0.3, 42, d);
        for (let i = 0; i < 3; i++) this.noiseHit(0.03, 0.08, 1900, d, 'bandpass', 900, 0.06 + i * 0.05, 3);
      } else if (kind === 'shred') {
        // torn apart: a wet crack, the pieces coming down a beat later
        this.noiseHit(0.42, 0.06, 4200, d, 'highpass', 2200);
        for (let i = 0; i < 3; i++) this.noiseHit(0.06, 0.26, 2300 - i * 420, d, 'bandpass', 1100, i * 0.018, 2.2);
        this.tone(96, 0.3, 0.34, 34, d);
        this.noiseHit(0.3, 0.26, 700, d, 'lowpass', 120);
        for (let i = 0; i < 4; i++) this.noiseHit(0.035, 0.07, 1500, d, 'bandpass', 700 + i * 150, 0.22 + i * 0.07 + Math.random() * 0.04, 3);
      } else if (kind === 'thud') {
        this.tone(92, 0.22, 0.28, 38, d);
        this.noiseHit(0.16, 0.17, 420, d, 'lowpass', 90);
        this.noiseHit(0.03, 0.1, 2400, d, 'bandpass', 1500, 0.01, 2);
      } else if (kind === 'step') {
        this.noiseHit(0.05, 0.05, 900, d, 'lowpass', 200);
      }
    }
    /* Formant voice. kind: scream · cry · plea · sob · gasp · muffled · call */
    voice(species, kind = 'cry', pan = 0, gain = 1, pitch = 1) {
      if (!this.live() || gain < 0.03) return false;
      const c = this.ctx,
        now = c.currentTime;
      if (this.voices >= 11 || now - this.lastVoice < 0.045) return false;
      this.lastVoice = now;
      this.voices++;
      const v = VOICES[species] || VOICES.subject,
        f0 = (v.f0[0] + Math.random() * (v.f0[1] - v.f0[0])) * pitch;
      const shape = {
        scream: { d: 0.75 + Math.random() * 0.55, peak: 2.25, start: 1.5, end: 1.15, g: 0.55, vowel: 'a' },
        cry: { d: 0.32 + Math.random() * 0.22, peak: 1.75, start: 1.25, end: 1.3, g: 0.42, vowel: 'a' },
        plea: { d: 0.8 + Math.random() * 0.3, peak: 1.45, start: 1.15, end: 0.92, g: 0.45, vowel: 'e' },
        call: { d: 0.5 + Math.random() * 0.3, peak: 1.3, start: 1.05, end: 1.2, g: 0.3, vowel: 'o' },
        sob: { d: 0.42 + Math.random() * 0.2, peak: 1.15, start: 1.12, end: 0.78, g: 0.3, vowel: 'u' },
        gasp: { d: 0.18, peak: 1.6, start: 1.4, end: 1.7, g: 0.26, vowel: 'a' },
        muffled: { d: 0.9 + Math.random() * 0.4, peak: 2, start: 1.4, end: 1.1, g: 0.38, vowel: 'o' },
      }[kind] || { d: 0.4, peak: 1.5, start: 1.2, end: 1.1, g: 0.3, vowel: 'a' };
      const level = shape.g * (v.gain || 1);
      const d = shape.d,
        out = this.spot(pan, gain),
        env = c.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(level, now + 0.03);
      env.gain.setValueAtTime(level * 0.85, now + d * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0001, now + d);
      let head = env;
      if (kind === 'muffled' || v.lp) {
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = kind === 'muffled' ? 520 : v.lp;
        env.connect(lp);
        head = lp;
      }
      head.connect(out);
      const nodes = [env, head];
      const oscs = [];
      const makeOsc = (mul, level) => {
        const o = c.createOscillator();
        o.type = v.wave;
        const f = o.frequency;
        f.setValueAtTime(f0 * shape.start * mul, now);
        f.linearRampToValueAtTime(f0 * shape.peak * mul, now + Math.min(0.12, d * 0.25));
        f.exponentialRampToValueAtTime(f0 * shape.end * mul, now + d);
        const g = c.createGain();
        g.gain.value = level;
        o.connect(g);
        oscs.push(o);
        nodes.push(g);
        return g;
      };
      const src = c.createGain();
      nodes.push(src);
      makeOsc(1, 1).connect(src);
      if (v.glass) makeOsc(v.glass, 0.35).connect(src);
      // vibrato
      const lfo = c.createOscillator(),
        lfoGain = c.createGain();
      lfo.frequency.value = v.vib * (0.85 + Math.random() * 0.3);
      lfoGain.gain.value = f0 * v.depth * (kind === 'scream' ? 1.8 : 1);
      lfo.connect(lfoGain);
      for (const o of oscs) lfoGain.connect(o.frequency);
      oscs.push(lfo);
      nodes.push(lfoGain);
      let body = src;
      if (v.drive) {
        const ws = c.createWaveShaper(),
          curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i / 255) * 2 - 1;
          curve[i] = Math.tanh(x * v.drive);
        }
        ws.curve = curve;
        src.connect(ws);
        body = ws;
        nodes.push(ws);
      }
      if (v.trem) {
        const tg = c.createGain(),
          tl = c.createOscillator(),
          td = c.createGain();
        tg.gain.value = 0.6;
        tl.frequency.value = v.trem;
        td.gain.value = 0.4;
        tl.connect(td);
        td.connect(tg.gain);
        body.connect(tg);
        body = tg;
        oscs.push(tl);
        nodes.push(tg, td);
      }
      const vowel = VOWELS[kind === 'sob' || kind === 'muffled' ? shape.vowel : Math.random() < 0.5 ? shape.vowel : 'o'];
      vowel.forEach((F, k) => {
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = F * v.shift;
        bp.Q.value = (v.q || 7) + k * 2;
        const g = c.createGain();
        g.gain.value = [1.2, 0.75, 0.35][k];
        body.connect(bp);
        bp.connect(g);
        g.connect(env);
        nodes.push(bp, g);
      });
      if (v.noise > 0) {
        const s = c.createBufferSource(),
          bp = c.createBiquadFilter(),
          g = c.createGain();
        s.buffer = this.noise;
        bp.type = 'bandpass';
        bp.frequency.value = vowel[1] * v.shift;
        bp.Q.value = 1.4;
        g.gain.value = v.noise * (kind === 'sob' || kind === 'gasp' ? 2.2 : 1);
        s.connect(bp);
        bp.connect(g);
        g.connect(env);
        s.start(now, Math.random());
        s.stop(now + d + 0.05);
        oscs.push(s);
        nodes.push(bp, g);
      }
      for (const o of oscs) {
        if (o.start && !(o instanceof AudioBufferSourceNode)) o.start(now);
        if (!(o instanceof AudioBufferSourceNode)) o.stop(now + d + 0.05);
      }
      const done = () => {
        this.voices = Math.max(0, this.voices - 1);
        for (const n of nodes) {
          try {
            n.disconnect();
          } catch {}
        }
        for (const o of oscs) {
          try {
            o.disconnect();
          } catch {}
        }
      };
      oscs[0].onended = done;
      return true;
    }
    /* The living world: one heart, one breath, and a voice far below speech. */
    heartbeat(k = 1) {
      if (!this.live()) return;
      const d = this.spot(0, Math.min(1.3, 0.4 + k * 0.5));
      this.tone(58, 0.17, 0.6, 33, d);
      this.tone(116, 0.1, 0.16, 70, d);
      this.noiseHit(0.13, 0.2, 190, d, 'lowpass', 60);
      this.tone(51, 0.15, 0.45, 30, d, 'sine', 0.27);
      this.tone(102, 0.09, 0.12, 62, d, 'sine', 0.27);
      this.noiseHit(0.1, 0.13, 170, d, 'lowpass', 50, 0.27);
      // the part small speakers can play
      this.noiseHit(0.07, 0.12, 560, d, 'bandpass', 190, 0, 1.2);
      this.noiseHit(0.06, 0.08, 520, d, 'bandpass', 180, 0.27, 1.2);
    }
    breath(inhale, seconds = 3.6, k = 1) {
      if (!this.live()) return;
      const c = this.ctx,
        t = c.currentTime,
        s = c.createBufferSource(),
        bp = c.createBiquadFilter(),
        lp = c.createBiquadFilter(),
        g = c.createGain(),
        d = this.spot(0, 1);
      s.buffer = this.noise;
      s.loop = true;
      bp.type = 'bandpass';
      bp.Q.value = 0.9;
      bp.frequency.setValueAtTime(inhale ? 260 : 820, t);
      bp.frequency.exponentialRampToValueAtTime(inhale ? 900 : 230, t + seconds);
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.19 * k, t + seconds * 0.45);
      g.gain.linearRampToValueAtTime(0.0001, t + seconds);
      s.connect(bp);
      bp.connect(lp);
      lp.connect(g);
      g.connect(d);
      s.start(t, Math.random());
      s.stop(t + seconds + 0.05);
      s.onended = () => {
        for (const n of [s, bp, lp, g]) n.disconnect();
      };
      // the cavity it breathes through
      this.tone(inhale ? 38 : 46, seconds * 0.9, 0.09 * k, inhale ? 46 : 34, d);
    }
    groan(k = 1, pan = 0) {
      if (!this.live() || this.ctx.currentTime - (this.lastGroan || -9) < 1.6) return;
      const c = this.ctx,
        t = c.currentTime;
      this.lastGroan = t;
      const d = this.spot(pan, Math.min(1.3, 0.7 + k * 0.5)),
        dur = 1.8 + k * 1.2,
        o = c.createOscillator(),
        g = c.createGain(),
        mix = c.createGain(),
        lfo = c.createOscillator(),
        lg = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(58 + k * 10, t);
      o.frequency.linearRampToValueAtTime(70 + k * 14, t + dur * 0.25);
      o.frequency.exponentialRampToValueAtTime(38, t + dur);
      lfo.frequency.value = 2.3;
      lg.gain.value = 3.5;
      lfo.connect(lg);
      lg.connect(o.frequency);
      const nodes = [o, g, mix, lfo, lg];
      [
        [340, 1.2],
        [820, 0.7],
        [1900, 0.25],
      ].forEach(([f, a]) => {
        const bp = c.createBiquadFilter(),
          ga = c.createGain();
        bp.type = 'bandpass';
        bp.frequency.value = f;
        bp.Q.value = 5;
        ga.gain.value = a;
        o.connect(bp);
        bp.connect(ga);
        ga.connect(mix);
        nodes.push(bp, ga);
      });
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5 * k, t + 0.35);
      g.gain.setValueAtTime(0.42 * k, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      mix.connect(g);
      g.connect(d);
      o.start(t);
      lfo.start(t);
      o.stop(t + dur + 0.05);
      lfo.stop(t + dur + 0.05);
      o.onended = () => {
        for (const n of nodes) {
          try {
            n.disconnect();
          } catch {}
        }
      };
      this.noiseHit(dur * 0.8, 0.12 * k, 160, d, 'lowpass', 40);
    }
    squelch(kind, pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      if (kind === 'pop') {
        this.noiseHit(0.14, 0.45, 2200, d, 'bandpass', 380, 0, 1.4);
        this.tone(420, 0.12, 0.34, 70, d);
        this.noiseHit(0.42, 0.14, 900, d, 'bandpass', 2400, 0.06, 5);
      } else if (kind === 'slice') {
        this.noiseHit(0.2, 0.22, 4800, d, 'highpass', 1900);
        this.tone(150, 0.22, 0.3, 48, d);
        this.noiseHit(0.5, 0.12, 700, d, 'bandpass', 2600, 0.05, 4);
      } else if (kind === 'tear') {
        for (let i = 0; i < 9; i++) this.noiseHit(0.09, 0.16, 500 + Math.random() * 1400, d, 'bandpass', 300, i * 0.07, 2.5);
        this.tone(70, 0.9, 0.35, 30, d);
        this.noiseHit(0.8, 0.18, 400, d, 'lowpass', 70, 0.55);
      } else if (kind === 'drip') {
        this.tone(1300 + Math.random() * 500, 0.06, 0.13, 600, d);
      } else if (kind === 'gurgle') {
        const n = 4 + ((Math.random() * 4) | 0);
        let at = 0;
        for (let i = 0; i < n; i++) {
          const f = 70 + Math.random() * 150;
          this.tone(f, 0.1 + Math.random() * 0.08, 0.25, f * (1.3 + Math.random() * 0.6), d, 'sine', at);
          this.noiseHit(0.08, 0.1, 420, d, 'bandpass', 160, at, 3);
          at += 0.08 + Math.random() * 0.13;
        }
      }
    }

    /* Heaven's choir: four synthesized parts singing NICAEA on vowels. level 0..1 = how many still sing.
     * Called every frame while it should sing; choirStop() ends it. */
    choir(level) {
      if (!this.ctx || !this.live()) return;
      const c = this.ctx,
        now = c.currentTime;
      level = Math.max(0, Math.min(1, level));
      let ch = this.choirState;
      if (!ch) {
        if (level <= 0) return;
        ch = this.choirState = this.buildChoir();
        ch.start = now + 0.4;
        ch.next = [0, 0, 0, 0];
        ch.verse = 0;
      }
      // who is still singing: the bass falls silent first, the sopranos last
      const need = [level > 0 ? Math.max(1, Math.ceil(level * 4)) : 0, level > 0.03 ? Math.ceil(level * 4) : 0, level > 0.07 ? Math.ceil(level * 3.6) : 0, level > 0.12 ? Math.ceil(level * 3.6) : 0];
      ch.parts.forEach((part, pi) =>
        part.layers.forEach((L, li) => L.g.gain.setTargetAtTime(li < need[pi] ? 1 : 0, now, li < need[pi] ? 0.4 : 0.15)),
      );
      ch.out.gain.setTargetAtTime(level > 0 ? 0.4 * (0.4 + 0.6 * Math.sqrt(level)) : 0, now, 0.5);
      // schedule what falls within the next half second
      const beat = 60 / NICAEA.bpm,
        verseBeats = 64 + 3;
      // after a gap in calls (a busy screen), carry on from now instead of rushing through the missed notes
      let earliest = Infinity;
      for (let pi = 0; pi < 4; pi++) {
        const notes = NICAEA.parts[pi],
          k = ch.next[pi];
        if (k * 2 >= notes.length) continue;
        let at = 0;
        for (let j = 0; j < k; j++) at += notes[j * 2 + 1];
        earliest = Math.min(earliest, ch.start + (ch.verse * verseBeats + at) * beat);
      }
      if (earliest < now - 0.6) ch.start += now + 0.15 - earliest;
      for (let pi = 0; pi < 4; pi++) {
        const notes = NICAEA.parts[pi],
          part = ch.parts[pi];
        for (let guard = 0; guard < 16; guard++) {
          const k = ch.next[pi];
          let at = 0;
          for (let j = 0; j < k; j++) at += notes[j * 2 + 1];
          const t0 = ch.start + (ch.verse * verseBeats + at) * beat;
          if (k * 2 >= notes.length) {
            // end of the verse for this part: breathe, then the next verse
            if (pi === 0 && ch.next.every((n, q) => n * 2 >= NICAEA.parts[q].length)) {
              ch.verse++;
              ch.next = [0, 0, 0, 0];
            }
            break;
          }
          if (t0 > now + 0.5) break;
          const midi = notes[k * 2],
            dur = notes[k * 2 + 1] * beat,
            f = 440 * Math.pow(2, (midi - 69) / 12),
            T = Math.max(now, t0);
          for (const L of part.layers) L.o.frequency.setTargetAtTime(f, T, 0.018);
          // a soft new syllable on every note; held notes swell slightly
          part.env.gain.setTargetAtTime(0.45, T, 0.012);
          part.env.gain.setTargetAtTime(1, T + 0.04, 0.07);
          const last = (k + 1) * 2 >= notes.length;
          if (last) part.env.gain.setTargetAtTime(0, T + dur - 0.25, 0.18);
          // the vowel of the syllable sounding at this moment
          const syl = this.choirSyllable(at);
          const F = FORMANTS[NICAEA.vowels[syl]] || FORMANTS.a;
          part.formants.forEach((bp, q) => bp.frequency.setTargetAtTime(F[q] * part.shift, T, 0.03));
          ch.next[pi] = k + 1;
        }
      }
    }
    choirSyllable(atBeat) {
      const s = NICAEA.parts[0];
      let t = 0,
        syl = 0;
      for (let j = 0; j * 2 < s.length; j++) {
        if (t > atBeat + 1e-6) break;
        syl = j;
        t += s[j * 2 + 1];
      }
      return Math.min(NICAEA.vowels.length - 1, syl);
    }
    buildChoir() {
      const c = this.ctx,
        out = c.createGain(),
        dry = c.createGain(),
        wet = c.createGain(),
        warm = c.createBiquadFilter();
      out.gain.value = 0;
      warm.type = 'lowpass';
      warm.frequency.value = 5200;
      out.connect(warm);
      warm.connect(dry);
      dry.gain.value = 0.55;
      dry.connect(this.master);
      if (!this.hall) {
        // a long stone room, made once
        const len = Math.round(c.sampleRate * 3.4),
          ir = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i < 400 ? i / 400 : 1);
        }
        this.hall = ir;
      }
      const verb = c.createConvolver();
      verb.buffer = this.hall;
      warm.connect(verb);
      verb.connect(wet);
      wet.gain.value = 0.62;
      wet.connect(this.master);
      const spec = [
        { shift: 1.1, gain: 0.2, pan: -0.25 },
        { shift: 1.04, gain: 0.16, pan: 0.25 },
        { shift: 0.94, gain: 0.15, pan: -0.15 },
        { shift: 0.88, gain: 0.2, pan: 0.15 },
      ];
      const nodes = [out, dry, wet, warm, verb];
      const parts = spec.map((ps, pi) => {
        const env = c.createGain(),
          sum = c.createGain(),
          lp = c.createBiquadFilter(),
          pan = c.createStereoPanner ? c.createStereoPanner() : null;
        env.gain.value = 0;
        lp.type = 'lowpass';
        lp.frequency.value = 3400;
        sum.connect(lp);
        const formants = [1, 0.55, 0.22].map((g, q) => {
          const bp = c.createBiquadFilter(),
            fg = c.createGain();
          bp.type = 'bandpass';
          bp.frequency.value = FORMANTS.a[q] * ps.shift;
          bp.Q.value = [6, 8, 9][q];
          fg.gain.value = g * 3.2;
          lp.connect(bp);
          bp.connect(fg);
          fg.connect(env);
          nodes.push(bp, fg);
          return bp;
        });
        // a little breath in the sound
        const air = c.createBufferSource(),
          airF = c.createBiquadFilter(),
          airG = c.createGain();
        air.buffer = this.noise;
        air.loop = true;
        airF.type = 'bandpass';
        airF.frequency.value = 1600 * ps.shift;
        airF.Q.value = 0.8;
        airG.gain.value = 0.035;
        air.connect(airF);
        airF.connect(airG);
        airG.connect(env);
        air.start();
        const vib = c.createOscillator(),
          vibG = c.createGain();
        vib.frequency.value = 5.1 + pi * 0.23;
        vibG.gain.value = 9;
        vib.connect(vibG);
        vib.start();
        const layers = [-9, 6, -3, 11].map(cents => {
          const o = c.createOscillator(),
            g = c.createGain();
          o.type = 'sawtooth';
          o.frequency.value = 220;
          o.detune.value = cents;
          vibG.connect(o.detune);
          g.gain.value = 0;
          o.connect(g);
          g.connect(sum);
          o.start();
          nodes.push(o, g);
          return { o, g };
        });
        const pg = c.createGain();
        pg.gain.value = ps.gain;
        env.connect(pg);
        if (pan) {
          pan.pan.value = ps.pan;
          pg.connect(pan);
          pan.connect(out);
          nodes.push(pan);
        } else pg.connect(out);
        nodes.push(env, sum, lp, air, airF, airG, vib, vibG, pg);
        return { env, layers, formants, shift: ps.shift, air, vib };
      });
      return { out, parts, nodes };
    }
    choirStop(fade = 0.25) {
      const ch = this.choirState;
      if (!ch) return;
      this.choirState = null;
      const c = this.ctx,
        now = c.currentTime;
      ch.out.gain.cancelScheduledValues(now);
      ch.out.gain.setTargetAtTime(0, now, Math.max(0.01, fade / 3));
      setTimeout(() => {
        for (const n of ch.nodes) {
          try {
            if (n.stop) n.stop();
          } catch {}
          try {
            n.disconnect();
          } catch {}
        }
      }, (fade + 4) * 1000);
    }
    thunder(k = 1, pan = 0, delay = 0) {
      if (!this.live()) return;
      const d = this.spot(pan, Math.min(1.4, 0.55 + k * 0.5));
      this.noiseHit(0.22, 0.34 * k, 7000, d, 'highpass', 1800, delay);
      this.noiseHit(0.55, 0.3 * k, 2600, d, 'bandpass', 260, delay + 0.03, 0.8);
      this.noiseHit(2.9, 0.34 * k, 420, d, 'lowpass', 38, delay + 0.07);
      this.tone(52, 2.3, 0.22 * k, 27, d, 'sine', delay + 0.1);
    }
    clank(pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      this.tone(1240, 0.3, 0.13, 980, d, 'triangle');
      this.tone(1873, 0.22, 0.08, 1500, d, 'triangle');
      this.noiseHit(0.12, 0.24, 5600, d, 'highpass', 2600);
      this.noiseHit(0.35, 0.12, 900, d, 'bandpass', 320, 0.02, 2);
    }
    // a struck angel: a bell that falls, and the body after it
    fallen(pan = 0, gain = 1, big = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      this.tone(880 / big, 1.4, 0.12, 330 / big, d, 'triangle');
      this.tone(1320 / big, 1.1, 0.06, 520 / big, d, 'sine', 0.05);
      this.noiseHit(0.5, 0.12, 3800, d, 'bandpass', 900, 0, 1.4);
      this.noiseHit(0.3, 0.26, 600, d, 'lowpass', 70, 0.35);
      this.tone(70, 0.4, 0.3, 30, d, 'sine', 0.36);
    }
    // the light going out: one long fall in the low end
    lightsOut() {
      if (!this.live()) return;
      const d = this.spot(0, 1.2);
      this.tone(110, 5.5, 0.3, 24, d, 'sine');
      this.tone(165, 4.2, 0.12, 30, d, 'triangle', 0.1);
      this.noiseHit(4.5, 0.16, 900, d, 'lowpass', 30, 0.05);
      this.thunder(1.6, 0, 0.02);
    }
    // the pit: a low roar of fire everywhere, the ground's own rumble, and somewhere always someone
    inferno(dt, level, fire = 1, gust = 0) {
      if (!this.ctx || !this.noise) return;
      const c = this.ctx,
        t = c.currentTime;
      if (!this.hellGain) {
        this.hellGain = c.createGain();
        this.hellGain.gain.value = 0;
        this.hellGain.connect(this.master);
        const rumble = c.createBufferSource();
        rumble.buffer = this.noise;
        rumble.loop = true;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 95;
        const rg = c.createGain();
        rg.gain.value = 3.2;
        rumble.connect(lp);
        lp.connect(rg);
        rg.connect(this.hellGain);
        rumble.start();
        const roar = c.createBufferSource();
        roar.buffer = this.noise;
        roar.loop = true;
        roar.playbackRate.value = 0.73;
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 560;
        bp.Q.value = 0.7;
        const lfo = c.createOscillator(),
          lg = c.createGain();
        lfo.frequency.value = 0.31;
        lg.gain.value = 210;
        lfo.connect(lg);
        lg.connect(bp.frequency);
        this.roarGain = c.createGain();
        this.roarGain.gain.value = 0;
        roar.connect(bp);
        bp.connect(this.roarGain);
        this.roarGain.connect(this.hellGain);
        roar.start();
        lfo.start();
        this.wailAt = 0;
      }
      this.hellGain.gain.setTargetAtTime(level * 0.9, t, 0.5);
      this.roarGain.gain.setTargetAtTime(0.7 * fire + gust * 0.9, t, 0.25);
      // far voices, never quite stopping
      if (level > 0.05 && t > this.wailAt) {
        this.wailAt = t + 0.35 + Math.random() * 1.2;
        const kind = Math.random() < 0.55 ? 'plea' : Math.random() < 0.6 ? 'scream' : 'sob';
        this.voice('damned', kind, (Math.random() - 0.5) * 1.6, level * (0.22 + Math.random() * 0.24), 0.8 + Math.random() * 0.5);
      }
    }
    bubble(pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      this.tone(190 + Math.random() * 80, 0.14, 0.13, 55, d, 'sine');
      this.noiseHit(0.1, 0.05, 700, d, 'lowpass', 120);
    }
    crack(pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      this.noiseHit(0.09, 0.3, 6200, d, 'highpass', 3000);
      this.tone(2600, 0.07, 0.06, 1300, d, 'triangle');
      this.noiseHit(0.6, 0.14, 900, d, 'lowpass', 60, 0.03);
    }
    growl(pan = 0, gain = 1, pitch = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      this.tone(78 * pitch, 0.75, 0.2, 52 * pitch, d, 'sawtooth');
      this.tone(118 * pitch, 0.6, 0.08, 70 * pitch, d, 'square', 0.04);
      this.noiseHit(0.7, 0.16, 520, d, 'bandpass', 180, 0.02, 1.2);
    }
    flap(pan = 0, gain = 1) {
      if (!this.live() || gain < 0.03) return;
      const d = this.spot(pan, gain);
      this.noiseHit(0.9, 0.34, 380, d, 'lowpass', 40);
      this.tone(46, 0.8, 0.22, 26, d, 'sine', 0.05);
    }
    makeWind() {
      const c = this.ctx,
        s = c.createBufferSource();
      s.buffer = this.noise;
      s.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 420;
      bp.Q.value = 0.6;
      const lfo = c.createOscillator(),
        lfoGain = c.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 190;
      lfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);
      this.windGain = c.createGain();
      this.windGain.gain.value = 0;
      s.connect(bp);
      bp.connect(this.windGain);
      this.windGain.connect(this.master);
      s.start();
      lfo.start();
      // Murmur bed: a handful of babbling formant voices, mixed low and blurred.
      this.murmurGain = c.createGain();
      this.murmurGain.gain.value = 0;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1500;
      this.murmurGain.connect(lp);
      lp.connect(this.master);
      for (let i = 0; i < 6; i++) {
        const o = c.createOscillator(),
          f1 = c.createBiquadFilter(),
          f2 = c.createBiquadFilter(),
          gate = c.createGain(),
          mix = c.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 180 + i * 23;
        f1.type = f2.type = 'bandpass';
        f1.Q.value = 6;
        f2.Q.value = 8;
        f1.frequency.value = 600;
        f2.frequency.value = 1300;
        gate.gain.value = 0;
        mix.gain.value = 0.5;
        o.connect(f1);
        o.connect(f2);
        f1.connect(gate);
        f2.connect(mix);
        mix.connect(gate);
        gate.connect(this.murmurGain);
        o.start();
        this.babble.push({ o, f1, f2, gate, next: 0, pan: 0 });
      }
    }
    /* Called every frame on the surface. level 0..1 = how many people are near and alive. */
    ambience(dt, level, agitation, species = 'eden', wind = 0.04) {
      if (!this.ctx || !this.windGain) return;
      const c = this.ctx,
        t = c.currentTime;
      this.murmurLevel = level;
      this.windGain.gain.setTargetAtTime(wind, t, 0.6);
      this.murmurGain.gain.setTargetAtTime(level * 0.7, t, level > this.murmurCurrent ? 0.9 : 0.35);
      this.murmurCurrent = level;
      if (level < 0.005) return;
      const v = VOICES[species] || VOICES.subject;
      for (const b of this.babble) {
        if (t < b.next) continue;
        const syll = 0.11 + Math.random() * 0.2 * (1 - agitation * 0.5),
          rest = Math.random() < 0.3 ? 0.15 + Math.random() * 0.4 : 0.02;
        b.next = t + syll + rest;
        const vowel = VOWELS[VOWEL_KEYS[(Math.random() * VOWEL_KEYS.length) | 0]],
          f0 = (v.f0[0] + Math.random() * (v.f0[1] - v.f0[0])) * (0.82 + agitation * 0.45);
        b.o.type = v.wave === 'sine' ? 'triangle' : v.wave;
        b.o.frequency.setTargetAtTime(f0, t, 0.03);
        b.f1.frequency.setTargetAtTime(vowel[0] * v.shift, t, 0.03);
        b.f2.frequency.setTargetAtTime(vowel[1] * v.shift, t, 0.03);
        const peak = 0.12 + Math.random() * 0.14;
        b.gate.gain.cancelScheduledValues(t);
        b.gate.gain.setTargetAtTime(peak, t, 0.025);
        b.gate.gain.setTargetAtTime(0, t + syll, 0.04);
      }
    }
    silenceAmbience() {
      if (!this.ctx || !this.windGain) return;
      const t = this.ctx.currentTime;
      if (this.hellGain) this.hellGain.gain.setTargetAtTime(0, t, 0.08);
      this.windGain.gain.setTargetAtTime(0, t, 0.08);
      this.murmurGain.gain.setTargetAtTime(0, t, 0.08);
      this.murmurCurrent = 0;
    }
    tick(dt, speed, mode, firing) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      let gain =
        mode === 'planet'
          ? 0.027 + Math.min(speed / 80, 1) * 0.1
          : mode === 'space'
            ? Math.min(speed / 260, 1) * 0.022
            : 0;
      this.engineGain.gain.setTargetAtTime(gain, t, 0.18);
      this.engine.frequency.setTargetAtTime(35 + Math.min(speed, 160) * 0.45, t, 0.2);
      this.engine2.frequency.setTargetAtTime(54 + Math.min(speed, 160) * 0.37, t, 0.2);
      this.laserGain.gain.setTargetAtTime(firing ? 0.09 : 0, t, 0.04);
      this.laser.frequency.setTargetAtTime(92 + (firing ? Math.sin(t * 9) * 12 : 0), t, 0.03);
      if (mode !== 'planet') {
        this.silenceAmbience();
        if (this.beamGain) this.beamGain.gain.setTargetAtTime(0, t, 0.04);
        if (this.skitterGain) this.skitterGain.gain.setTargetAtTime(0, t, 0.04);
      }
    }
    stop() {
      if (!this.ctx) return;
      this.choirStop(0.3);
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      this.laserGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      if (this.beamGain) this.beamGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      if (this.skitterGain) this.skitterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      this.silenceAmbience();
    }
  }
  K.AudioSystem = AudioSystem;
})((window.KO ||= {}));

// FILE: src/worlds/universe.js
/* Universe v1. Stable coordinates + IDs; orbital state fits the existing cloud schema.
 * Never regenerate IDs when adding a surface file. A missing surface is not a fake level.
 */
(function (K) {
  'use strict';
  const M = K.M,
    LEDGER = 'ko-orbit-v1',
    SYSTEM_COUNT = 64,
    PER_SYSTEM = 8;
  const TYPES = [
    { id: 'ocean', name: '해양 세계', color: '#609d9b', air: '#629ebd', shader: 10 },
    { id: 'dune', name: '사막 세계', color: '#c59c72', air: '#d8a16e', shader: 11 },
    { id: 'ice', name: '빙하 세계', color: '#91bacd', air: '#b3dbe9', shader: 12 },
    { id: 'lava', name: '용암 세계', color: '#81594b', air: '#de7848', shader: 13 },
    { id: 'toxic', name: '포자 세계', color: '#879c59', air: '#bad584', shader: 14 },
    { id: 'gas', name: '띠무늬 거성', color: '#cdb58d', air: '#ceae8e', shader: 15 },
    { id: 'obsidian', name: '흑요석 세계', color: '#645b86', air: '#9b8ac5', shader: 16 },
    { id: 'crystal', name: '결정 세계', color: '#8eacb4', air: '#aabcf2', shader: 17 },
  ];
  const NAMES = [
    '에덴',
    '카론',
    '네레우스',
    '오르페',
    '녹스',
    '세레스',
    '이오라',
    '벨라',
    '칼릭스',
    '네브라',
    '사하르',
    '모르가',
    '티르',
    '이리스',
    '엘라라',
    '카르스트',
    '헤스페르',
    '타르시스',
    '안테아',
    '세피르',
    '라자르',
    '오르투스',
    '미르',
    '나이아',
    '키론',
    '알시온',
    '메리디안',
    '오닉스',
    '아스테르',
    '펜리르',
    '세라프',
    '하이페리온',
    '네모라',
    '제니스',
    '카이로스',
    '움브라',
    '솔라리스',
    '레비아',
    '시렌',
    '타이탄',
    '베스퍼',
    '카시아',
    '마이라',
    '라크리마',
    '벨로스',
    '아마란스',
    '델피',
    '사일렌',
    '에레보',
    '루멘',
    '아르카',
    '칼데라',
    '모노리스',
    '파로스',
    '세노',
    '볼라',
    '오르카',
    '나디르',
    '테라스',
    '제피라',
    '릴리스',
    '아우라',
    '에테르',
    '헤일로',
  ];
  /* 진짜 이름과 스캔 자료. 공유 rng 를 쓰면 512개 행성의 좌표가 전부 밀린다. id 해시로만 만든다. */
  const SCAN_ATMO = {
    ocean: '질소·수증기 · 호흡 가능',
    dune: '이산화탄소 · 규산 미립자 부유',
    ice: '질소 희박 · 지표 -140℃',
    lava: '이산화황 · 지표 470℃',
    toxic: '메탄 · 포자 밀도 높음',
    gas: '수소·헬륨 · 고체 지표 없음',
    obsidian: '아르곤 · 대기압 낮음',
    crystal: '질소·아르곤 · 정전 활동',
  };
  const SCAN_GROUND = {
    ocean: '전역 해양 · 군도 산재',
    dune: '사구대와 말라붙은 염호',
    ice: '빙상 · 균열 협곡',
    lava: '용암류와 현무암 평원',
    toxic: '포자림 · 습지',
    gas: '구름 띠 · 상륙 불가',
    obsidian: '유리질 대지 · 흑요암 첨탑',
    crystal: '결정 기둥 지대',
  };
  const SYL_A = [
    '아',
    '이',
    '우',
    '에',
    '오',
    '나',
    '리',
    '무',
    '세',
    '토',
    '카',
    '하',
    '샤',
    '란',
    '도',
    '비',
    '메',
    '쿠',
    '제',
    '타',
  ];
  const SYL_B = [
    '르',
    '란',
    '민',
    '사',
    '도',
    '케',
    '나',
    '티',
    '올',
    '샤',
    '무',
    '레',
    '간',
    '시',
    '포',
    '두',
    '야',
    '린',
    '타',
    '헤',
  ];
  const SYL_C = ['', '', '', '아', '움', '엔', '이르', '아스', '운', '에', '일', '오', '우스', '안', '임'];
  function hash32(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function trueNameFor(id) {
    const h = hash32(id + '/name');
    return SYL_A[h % 20] + SYL_B[(h >>> 5) % 20] + SYL_C[(h >>> 11) % 15];
  }
  function catalogue() {
    const rng = M.rand(0x4b4f0013),
      systems = [],
      planets = [],
      byId = {};
    for (let s = 0; s < SYSTEM_COUNT; s++) {
      const arm = s % 4,
        step = Math.floor(s / 4),
        angle = (arm * Math.PI) / 2 + step * 0.41 + (rng() - 0.5) * 0.24;
      const radial = s === 0 ? 0 : 360000 + step * 360000 + rng() * 180000;
      const centre =
        s === 0 ? [0, 0, -15000] : [Math.cos(angle) * radial, (rng() - 0.5) * radial * 0.22, Math.sin(angle) * radial];
      const sys = {
        id: 's' + String(s).padStart(2, '0'),
        index: s,
        name: NAMES[s],
        position: centre,
        starRadius: s === 0 ? 1300 : 1000 + rng() * 1300,
        starColor: s % 4 === 0 ? '#d9b283' : s % 4 === 1 ? '#b1cee5' : s % 4 === 2 ? '#e0b39b' : '#cdc5de',
        planets: [],
      };
      for (let j = 0; j < PER_SYSTEM; j++) {
        const index = s * PER_SYSTEM + j,
          id = index === 0 ? 'eden' : 'p' + String(index).padStart(4, '0');
        const kind = index === 0 ? 0 : Math.floor(rng() * TYPES.length),
          type = TYPES[kind];
        const radius = index === 0 ? 320 : Math.round((kind === 5 ? 650 : 180) + rng() * (kind === 5 ? 700 : 500));
        const orbit = 7800 + j * 7000 + rng() * 1000,
          a = j * 2.39996 + s * 0.77;
        const p =
          index === 0
            ? [130, 55, -1580]
            : M.add(centre, [Math.cos(a) * orbit, (rng() - 0.5) * orbit * 0.17, Math.sin(a) * orbit]);
        const def = {
          id,
          index,
          system: sys.id,
          systemIndex: s,
          name: index === 0 ? '에덴' : NAMES[s] + ' ' + String(j + 1).padStart(2, '0'),
          position: p,
          radius,
          kind,
          type: type.id,
          typeName: type.name,
          color: type.color,
          air: type.air,
          shader: type.shader,
          seed: Math.round(rng() * 9000) / 97,
          rings: index === 0 || kind === 5 || rng() < 0.27,
          tilt: [0.14 + rng() * 0.75, rng() * 3, (rng() - 0.5) * 1.2],
          rulerId: index === 0 ? 'eden-ruler' : id + '-ruler',
          maxHits: 5,
          trueName: index === 0 ? '아우렐라' : trueNameFor(id),
          atmo: SCAN_ATMO[type.id],
          ground: SCAN_GROUND[type.id],
        };
        sys.planets.push(def);
        planets.push(def);
        byId[id] = def;
      }
      systems.push(sys);
    }
    return { version: 1, systems, planets, byId, types: TYPES };
  }
  K.UniverseCatalog = catalogue();
  for (const [id, meta] of Object.entries(K.SurfaceMeta || {})) {
    const def = K.UniverseCatalog.byId[id];
    if (!def) continue;
    if (typeof meta.name === 'string') def.name = meta.name;
    if (typeof meta.description === 'string') def.surfaceDescription = meta.description;
    if (meta.living) {
      // Observed and named like any other world. It is not like any other world.
      def.living = true;
      def.shader = 19;
      def.color = '#c9737b';
      def.air = '#e2898c';
      def.rings = false;
      def.typeName = '분류 불명';
      def.trueName = '이름 없음';
    }
    if (meta.hell) {
      // A world with a pit sunk in it, fire at every step of the way down.
      def.hell = true;
      def.shader = 26;
      def.color = '#7a2a16';
      def.air = '#c4501f';
      def.rings = false;
      def.typeName = '함몰 세계';
      def.trueName = '지옥';
    }
    if (meta.thaw) {
      // An ice world half warmed. Nobody lives there any more, by the register.
      def.thaw = true;
      def.color = '#c9d8e4';
      def.air = '#d8ecf6';
      def.typeName = '테라포밍 세계';
      def.trueName = 'THAW';
    }
    if (meta.heaven) {
      // A world that lights itself. Its people call it by the name of a city.
      def.heaven = true;
      def.shader = 18;
      def.color = '#f2dfa6';
      def.air = '#fff0c2';
      def.rings = true;
      def.typeName = '발광 세계';
      def.trueName = '새 예루살렘';
    }
  }
  class Universe {
    constructor(save) {
      this.save = save;
      this.catalog = K.UniverseCatalog;
      this.revision = 0;
      this.restore();
    }
    restore() {
      this.states = new Map();
      this.selectedId = 'eden';
      this.navMode = 'sky';
      this.hold = [];
      this.sites = new Set();
      this.landingTarget = '';
      const profiles = new Map();
      this.lost = 0;
      this.freeing = false;
      this.freed = 0;
      this.stowaways = 0;
      const tokens = this.save.data.planetStates[LEDGER]?.destroyed || [];
      for (const t of tokens) {
        if (typeof t !== 'string') continue;
        if (t.startsWith('pass.')) {
          const [, slot, from, species, pal, size, child, seed, lead, result] = t.split('.');
          if (Number(slot) >= 0 && Number(slot) < 20 && /^[a-z0-9_-]+$/.test(species || '')) {
            profiles.set(Number(slot), { from: this.get(from)?.id || '', species, pal: Math.max(0, Number(pal) | 0),
              scale: Math.max(0.2, Math.min(4, Number(size) / 1000 || 1)), child: child === '1',
              seed: Number(seed) >>> 0, lead: this.get(lead)?.id || '', result: ['world','site','lost'].includes(result) ? result : '' });
          }
          continue;
        }
        if (t.startsWith('site-')) { if (this.get(t.slice(5))) this.sites.add(t.slice(5)); continue; }
        if (t.startsWith('approach-')) { this.landingTarget = this.get(t.slice(9))?.id || ''; continue; }
        if (t.startsWith('focus-')) {
          const id = t.slice(6);
          if (this.catalog.byId[id]) this.selectedId = id;
          continue;
        }
        if (t === 'nav-orbit') {
          this.navMode = 'orbit';
          continue;
        }
        if (t.startsWith('hold-')) {
          this.hold = t.length > 5 ? t.slice(5).split('.').slice(0, 20).map(id => id === '_' ? '' : id) : [];
          continue;
        }
        if (t === 'freeing') {
          this.freeing = true;
          continue;
        }
        if (t.startsWith('freed-')) {
          this.freed = Math.max(0, Number(t.slice(6)) || 0);
          continue;
        }
        if (t.startsWith('cargo-')) {
          const n = Math.min(20, Number(t.slice(6)) || 0);
          for (let i = 0; i < n; i++) this.hold.push('');
          continue;
        }
        if (t.startsWith('stow-')) {
          this.stowaways = Math.max(0, Math.min(60, Number(t.slice(5)) || 0));
          continue;
        }
        if (t.startsWith('lost-')) {
          this.lost = Math.max(0, Number(t.slice(5)) || 0);
          continue;
        }
        const m = /^([a-z0-9_-]+)-h([0-5])(-v)?(?:-s([1-5]))?(-r2?)?(-t)?$/.exec(t);
        if (m && this.catalog.byId[m[1]])
          this.states.set(m[1], {
            hits: Number(m[2]),
            seen: !!m[3],
            scan: Number(m[4] || 0),
            relic: m[5] === '-r2' ? 2 : m[5] ? 1 : 0,
            told: !!m[6],
          });
      }
      this.hold = this.hold.map((from, i) => profiles.get(i) || this.passenger(from, { seed: i + 1, pal: i }));
      this.revision++;
    }
    get planets() {
      return this.catalog.planets;
    }
    get systems() {
      return this.catalog.systems;
    }
    get selected() {
      return this.catalog.byId[this.selectedId] || this.planets[0];
    }
    get(id) {
      return this.catalog.byId[id] || null;
    }
    hits(id) {
      return this.states.get(id)?.hits || 0;
    }
    destroyed(id) {
      return this.hits(id) >= 5 && !this.get(id)?.living;
    }
    living(id) {
      return !!this.get(id)?.living;
    }
    seen(id) {
      return !!this.states.get(id)?.seen;
    }
    hasTrophy(id) {
      const def = this.get(id);
      return !!def && this.save.data.trophies.some(t => t.planet === id || t.id === def.rulerId);
    }
    surfaceReady(id) {
      return this.get(id)?.kind !== 5;
    }
    select(id, navMode) {
      if (!this.get(id)) return false;
      this.selectedId = id;
      if (this.landingTarget !== id || navMode === 'orbit') this.landingTarget = '';
      if (navMode) this.navMode = navMode === 'sky' ? 'sky' : 'orbit';
      this.flush();
      return true;
    }
    markSeen(id) {
      if (this.seen(id)) return;
      this.patch(id, { seen: true });
      this.flush();
    }
    scan(id) {
      return this.states.get(id)?.scan || 0;
    }
    get cargo() {
      return this.hold.length;
    }
    setFreeing(on) {
      this.freeing = !!on && this.hold.length > 0;
      this.flush();
      this.save.write('checkpoint');
      return this.freeing;
    }
    takeHold() {
      const out = this.hold.slice();
      this.hold = [];
      this.freeing = false;
      this.freed += out.length;
      this.flush();
      this.save.write('checkpoint');
      return out;
    }
    cargoFull() {
      return this.hold.length >= 20;
    }
    passenger(from, resident) {
      if (resident.passenger) return resident.passenger;
      const seed = Math.abs(Math.floor(resident.seed || 0));
      const worlds = this.planets.filter(p => p.id !== from && this.inhabited(p.id) && !this.destroyed(p.id) && this.survivors(p.id) > 0);
      const lead = worlds.length ? worlds[hash32(from + '/' + seed) % worlds.length].id :
        this.inhabited(from) ? from : '';
      return { from, seed, lead, result: '', species: resident.sp?.key || K.SurfaceMeta[from]?.species || 'subject',
        pal: resident.pal || 0, scale: Math.round((resident.scale || 1) * 1000) / 1000, child: !!resident.child };
    }
    loadSurvivor(from = '', resident = {}) {
      if (this.cargoFull()) return null;
      const person = this.passenger(from, resident);
      this.hold.push(person);
      this.flush();
      return person;
    }
    patch(id, extra) {
      const st = this.states.get(id) || {};
      this.states.set(
        id,
        Object.assign(
          { hits: st.hits || 0, seen: !!st.seen, scan: st.scan || 0, relic: st.relic || 0, told: !!st.told },
          extra,
        ),
      );
    }
    // what the scanner last counted crawling on a world of bugs (kept by the world itself when it was left)
    bugCount(id) {
      for (const t of this.save.data.planetStates?.[id]?.destroyed || []) if (typeof t === 'string' && t.startsWith('x.n.')) return parseInt(t.slice(4), 36) || 0;
      return null;
    }
    // Only worlds with a surface file of their own have people. The rest were always empty.
    inhabited(id) {
      const m = K.SurfaceMeta?.[id];
      return !!m && m.inhabited !== false && this.get(id)?.kind !== 5;
    }
    cities(id) {
      if (this.get(id)?.heaven) return 1;
      return this.inhabited(id) ? 1 + (hash32(id + '/pop') % 9) : 0;
    }
    population(id) {
      const h = hash32(id + '/pop'),
        cities = this.cities(id);
      return cities ? (400 + ((h >>> 7) % 600)) * cities * 1000 : 0;
    }
    // 생존 신호: the living left on the whole world, after orbital strikes and whatever happened on the ground.
    survivors(id) {
      if (!this.inhabited(id)) return 0;
      return K.ResidentLedger
        ? K.ResidentLedger.planetAlive(this.save, id, this.population(id), this.hits(id))
        : this.population(id);
    }
    harmed(id) {
      if (this.living(id)) return this.hits(id) > 0 || !!K.Living?.harmed(this.save, id);
      return this.hits(id) > 0 || !!K.ResidentLedger?.touched(this.save, id);
    }
    told(id) {
      return !!this.states.get(id)?.told;
    }
    knownResidentWorld(id) {
      return this.inhabited(id) && (this.told(id) || this.scan(id) >= 4 ||
        this.save.data.visited.includes(id) || this.save.data.planetStates[id]?.visited ||
        this.hasTrophy(id) || this.hold.some(person => person.from === id));
    }
    readRoute(person) {
      if (!this.hold.includes(person) || person.result) return;
      const id = person.lead;
      if (!id || this.destroyed(id) || this.survivors(id) <= 0) person.result = 'lost';
      else if (this.knownResidentWorld(id)) {
        person.result = 'site';
        this.sites.add(id);
      } else {
        person.result = 'world';
        this.patch(id, { told: true });
      }
      this.flush();
      this.save.write('checkpoint');
    }
    dissected(id) {
      return this.states.get(id)?.relic === 2;
    }
    dissectRelic(id) {
      if (!this.relicTaken(id) || this.dissected(id)) return false;
      this.patch(id, { relic: 2 });
      this.flush();
      this.save.write('checkpoint');
      return true;
    }
    countLost(n = 1) {
      this.lost += n;
      this.flush();
    }
    ruinLevel(id) {
      return this.hits(id);
    }
    named(id) {
      return this.scan(id) >= 5 || !!this.states.get(id)?.told;
    }
    displayName(id) {
      const def = this.get(id);
      return def ? (this.named(id) ? def.trueName : def.name) : '';
    }
    advanceScan(id) {
      if (!this.get(id)) return 0;
      const n = Math.min(5, this.scan(id) + 1);
      this.patch(id, { seen: true, scan: n });
      this.flush();
      this.save.write('checkpoint');
      return n;
    }
    relicForm(id) {
      return hash32(id + '/relic') % 8;
    }
    relicTaken(id) {
      return !!this.states.get(id)?.relic;
    }
    relicAvailable(id) {
      return this.destroyed(id) && !this.hasTrophy(id) && !this.relicTaken(id) && this.scan(id) >= 5;
    }
    takeRelic(id) {
      if (!this.relicAvailable(id)) return false;
      this.patch(id, { relic: 1 });
      this.flush();
      this.save.write('checkpoint');
      return true;
    }
    relicList() {
      const out = [];
      for (const [id, st] of this.states) if (st.relic && this.get(id)) out.push({ id, form: this.relicForm(id) });
      out.sort((a, b) => this.get(a.id).index - this.get(b.id).index);
      return out;
    }
    scanLines(id) {
      const def = this.get(id);
      if (!def) return [];
      const gone = this.destroyed(id),
        n = v => v.toLocaleString('ko-KR');
      if (def.living)
        return [
          `반경 ${n(Math.round(def.radius * (0.93 + Math.random() * 0.14)))} km · 잴 때마다 다름`,
          '대기 — 들숨과 날숨이 있음',
          '지표 — 체온 있음',
          this.harmed(id) ? '도시 없음 · 생존 신호 1' : '도시 없음 · 인구 추정 1',
          '이름 없음',
        ];
      if (def.hell) {
        const still = this.hasTrophy(id);
        return [
          `반경 ${n(def.radius)} km · 한쪽이 깔때기 모양으로 꺼져 있음`,
          gone ? '대기 소실 · 잔해 온도 하강 중' : still ? '대기 — 유황 · 연기 · 바람 멎음' : '대기 — 유황 · 연기 · 비명',
          gone ? '지표 파열 · 궤도에 잔해 띠' : '지표 — 아홉 층으로 내려가는 구덩이',
          gone ? '생존 신호 없음' : '생존 신호 0 · 움직이는 것은 셀 수 없음',
          gone ? '그들은 이곳을 지옥이라 불렀다' : '그들은 이곳을 지옥이라 부른다',
        ];
      }
      if (def.thaw) {
        const off = this.hasTrophy(id),
          bugs = this.bugCount?.(id);
        return [
          `반경 ${n(def.radius)} km · 빙하 세계 · 테라포밍 ${off ? '정지' : '진행 중'} — 63%`,
          gone ? '대기 소실 · 잔해 온도 하강 중' : off ? '대기 — 질소 · 이산화탄소 · 온도 하강 중' : '대기 — 질소 · 이산화탄소 · 수증기 (가공 중)',
          gone ? '지표 파열 · 궤도에 잔해 띠' : '지표 — 빙원 · 해빙 구역 · 온실 돔 5기',
          gone ? '생존 신호 없음' : `거주자 0 · 생존 신호 ${bugs == null ? '— 셀 수 없음' : n(bugs)}`,
          gone ? '그들은 이곳을 THAW라 불렀다' : '이주 기록 — 철수 완료',
        ];
      }
      if (def.heaven) {
        const dark = this.hasTrophy(id);
        return [
          `반경 ${n(def.radius)} km · ${dark ? '빛을 잃음' : '스스로 빛남'}`,
          gone ? '대기 소실 · 잔해 온도 하강 중' : dark ? '대기 — 향 · 노랫소리 없음' : '대기 — 향과 노랫소리',
          gone ? '지표 파열 · 궤도에 잔해 띠' : '지표 — 순금 · 유리처럼 비침',
          gone
            ? '도시 1곳 · 생존 신호 없음'
            : this.harmed(id)
              ? `도시 1곳 · 생존 신호 ${n(this.survivors(id))}`
              : '도시 1곳 · 인구 추정 — 셀 수 없음',
          gone ? '그들은 이곳을 새 예루살렘이라 불렀다' : '그들은 이곳을 새 예루살렘이라 부른다',
        ];
      }
      const cities = this.cities(id),
        people = this.harmed(id) ? null : this.population(id);
      return [
        `반경 ${n(def.radius)} km · ${def.typeName}`,
        gone ? '대기 소실 · 잔해 온도 하강 중' : '대기 — ' + def.atmo,
        gone ? '지표 파열 · 궤도에 잔해 띠' : '지표 — ' + def.ground,
        cities
          ? gone
            ? `도시 ${n(cities)}곳 · 생존 신호 없음`
            : people == null
              ? `도시 ${n(cities)}곳 · 생존 신호 ${n(this.survivors(id))}`
              : `도시 ${n(cities)}곳 · 인구 추정 ${n(people)}`
          : '정주 흔적 없음',
        cities
          ? gone
            ? `그들은 스스로를 ${def.trueName}(이)라 불렀다`
            : `그들은 스스로를 ${def.trueName}(이)라 부른다`
          : `항법 기록상의 이름 — ${def.trueName}`,
      ];
    }
    hit(id) {
      if (!this.get(id) || this.destroyed(id)) return false;
      this.patch(id, { hits: Math.min(5, this.hits(id) + 1), seen: true });
      this.flush();
      this.save.write('checkpoint');
      return true;
    }
    flush() {
      // Adapter contract: one reserved record; old server round-trips its string IDs unchanged.
      // Only state deltas are saved. 512 planet definitions do not go into the spreadsheet.
      const destroyed = [
        'focus-' + this.selectedId,
        'nav-' + this.navMode,
        'hold-' + this.hold.map(p => p.from || '_').join('.'),
        ...this.hold.map((p, i) => ['pass', i, p.from || '_', p.species, p.pal, Math.round(p.scale * 1000),
          +p.child, p.seed, p.lead || '_', p.result || '_'].join('.')),
        ...[...this.sites].map(id => 'site-' + id),
        ...(this.landingTarget ? ['approach-' + this.landingTarget] : []),
        'lost-' + this.lost,
        'freed-' + this.freed,
      ]
        .concat(this.stowaways > 0 ? ['stow-' + this.stowaways] : []).concat(this.freeing ? ['freeing'] : []);
      [...this.states]
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([id, s]) => {
          if (s.hits || s.seen || s.scan || s.relic || s.told)
            destroyed.push(
              id +
                '-h' +
                s.hits +
                (s.seen ? '-v' : '') +
                (s.scan ? '-s' + s.scan : '') +
                (s.relic === 2 ? '-r2' : s.relic ? '-r' : '') +
                (s.told ? '-t' : ''),
            );
        });
      this.save.data.planetStates[LEDGER] = { destroyed, visited: false };
      this.revision++;
    }
    label(id) {
      const sc = this.scan(id) < 5 ? ` · 스캔 ${this.scan(id)}/5` : ' · 이름 확인됨';
      if (this.destroyed(id))
        return (this.hasTrophy(id) ? '행성 소멸 · 왕관 보관 중' : '행성 소멸 · 왕 회수 불가') + sc;
      const status = this.knownResidentWorld(id) ? '주민 행성' : this.surfaceReady(id) ? '상륙 가능' : '고체 지표 없음';
      return status + sc;
    }
    countDestroyed() {
      let n = 0;
      for (const [id, s] of this.states) if (s.hits >= 5 && !this.living(id)) n++;
      return n;
    }
  }
  Universe.LEDGER = LEDGER;
  K.Universe = Universe;
})((window.KO ||= {}));

// FILE: src/planets/registry.js
/* The universe owns identity and coordinates. A surface module supplies the local world. */
(function (K) {
  'use strict';
  K.Planets ||= {};
  K.TrophyModels ||= {};
  K.SurfaceFiles ||= { eden: 'src/planets/eden.js' };
  K.PlanetRegistry = Object.fromEntries(
    K.UniverseCatalog.planets.map(p => [p.id, { ...p, entry: K.SurfaceFiles[p.id] || null }]),
  );
  K.loadPlanet = async function (id) {
    if (K.Planets[id]) return K.Planets[id];
    const entry = K.SurfaceFiles[id];
    if (!entry) {
      const def = K.UniverseCatalog.byId[id];
      if (!def) throw new Error('알 수 없는 행성입니다: ' + id);
      if (def.kind === 5) throw new Error('고체 지표가 없습니다. 내려설 곳이 없습니다.');
      return (K.Planets[id] = K.Barren);
    }
    if (K.BUNDLED) throw new Error('행성 파일이 실행본에 포함되지 않았습니다. 같은 버전의 index.html로 교체하세요.');
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = entry;
      s.onload = resolve;
      s.onerror = () => {
        s.remove();
        reject(new Error(entry + ' 파일을 불러오지 못했습니다.'));
      };
      document.head.append(s);
    });
    if (!K.Planets[id]) throw new Error('행성 파일이 공통 인터페이스를 등록하지 않았습니다: ' + id);
    return K.Planets[id];
  };
})((window.KO ||= {}));

// FILE: src/core/save.js
(function (K) {
  'use strict';
  const KEY = 'kings-orbit-save-v1',
    ACTIVE = 'kings-orbit-cloud-active-v1';
  class SaveManager {
    constructor() {
      this.available = true;
      this.onWrite = null;
      this.key = KEY;
      this.profile = null;
      this.data = this.fresh();
      try {
        const p = JSON.parse(localStorage.getItem(ACTIVE) || 'null');
        if (p && typeof p.id === 'string' && typeof p.name === 'string' && /^[a-f0-9]{64}$/.test(p.proof || '')) {
          this.profile = p;
          this.key = this.profileKey(p.id);
        }
        const text = localStorage.getItem(this.key);
        if (text) {
          try {
            this.data = this.validate(JSON.parse(text));
          } catch {
            const b = localStorage.getItem(this.key + '-backup');
            this.data = b ? this.validate(JSON.parse(b)) : this.fresh();
          }
        }
      } catch {
        this.available = false;
      }
    }
    fresh() {
      return {
        version: 1,
        trophies: [],
        planetStates: {},
        space: { p: [0, 0, 0], yaw: 0, pitch: 0 },
        settings: { quality: 'balanced', volume: 0.5, sensitivity: 1, shake: 0.55 },
        visited: [],
        lastMode: 'interior',
      };
    }
    validate(x) {
      if (!x || x.version !== 1) throw new Error('Unknown save version');
      const d = this.fresh();
      d.trophies = Array.isArray(x.trophies)
        ? x.trophies.filter(
            t =>
              t &&
              typeof t.id === 'string' &&
              /^[a-z0-9][a-z0-9_-]{0,79}$/.test(t.id) &&
              typeof t.planet === 'string' &&
              /^[a-z0-9][a-z0-9_-]{0,79}$/.test(t.planet) &&
              typeof t.name === 'string' &&
              t.name.length <= 80 &&
              typeof t.time === 'string' &&
              Number.isFinite(Date.parse(t.time)),
          )
        : [];
      d.planetStates =
        x.planetStates && typeof x.planetStates === 'object' && !Array.isArray(x.planetStates) ? x.planetStates : {};
      if (
        x.space &&
        Array.isArray(x.space.p) &&
        x.space.p.length === 3 &&
        x.space.p.every(Number.isFinite) &&
        x.space.p.every(v => Math.abs(v) < 1e9)
      )
        d.space = {
          p: x.space.p,
          yaw: Number.isFinite(x.space.yaw) ? x.space.yaw : 0,
          pitch: K.M.clamp(Number(x.space.pitch) || 0, -1.45, 1.45),
        };
      if (x.settings) {
        d.settings.quality = ['low', 'balanced', 'high'].includes(x.settings.quality) ? x.settings.quality : 'balanced';
        for (const [k, min, max] of [
          ['volume', 0, 1],
          ['sensitivity', 0.3, 2],
          ['shake', 0, 1],
        ])
          if (Number.isFinite(x.settings[k])) d.settings[k] = K.M.clamp(x.settings[k], min, max);
      }
      d.visited = Array.isArray(x.visited) ? x.visited.filter(v => typeof v === 'string') : [];
      return d;
    }
    profileKey(id) {
      return KEY + '-user-' + encodeURIComponent(id);
    }
    useProfile(profile, data) {
      this.profile = profile;
      this.key = profile ? this.profileKey(profile.id) : KEY;
      this.data = this.validate(data);
    }
    readProfile(id) {
      try {
        const text = localStorage.getItem(id ? this.profileKey(id) : KEY);
        return text ? this.validate(JSON.parse(text)) : null;
      } catch {
        return null;
      }
    }
    write(reason = 'auto') {
      try {
        const old = localStorage.getItem(this.key);
        if (old) localStorage.setItem(this.key + '-backup', old);
        localStorage.setItem(this.key, JSON.stringify(this.data));
        this.available = true;
      } catch {
        this.available = false;
      }
      this.onWrite?.(reason);
      return this.available;
    }
    addTrophy(t) {
      if (!this.data.trophies.some(x => x.id === t.id)) {
        this.data.trophies.push(t);
        this.write('checkpoint');
        return true;
      }
      return false;
    }
    reset() {
      if (this.profile) throw new Error('온라인 항해 기록은 서버 저장 메뉴에서 초기화하세요.');
      this.data = this.fresh();
      try {
        localStorage.removeItem(this.key);
        localStorage.removeItem(this.key + '-backup');
      } catch {
        this.available = false;
      }
    }
    export() {
      return JSON.stringify(this.data, null, 2);
    }
    import(text) {
      this.data = this.validate(JSON.parse(text));
      this.write('checkpoint');
    }
  }
  SaveManager.ACTIVE_KEY = ACTIVE;
  SaveManager.ROOT_KEY = KEY;
  K.SaveManager = SaveManager;
})((window.KO ||= {}));

// FILE: src/core/cloud.js
/* 0.1.2 — acknowledged, revision-checked cloud saves. Guest saves stay separate.
 * The endpoint is the user's existing arcade Apps Script deployment.
 * Passwords never go in URLs. No JSONP for private data, no opaque "saved" claims.
 */
(function (K) {
  'use strict';
  const ENDPOINT =
    'https://script.google.com/macros/s/AKfycbzKmIYdOCYXNwXbNzvZWR2mQZk59Hhbpk7le-86VGqwzrgJZYqwGegYmRHcKhQ59fVV/exec';
  const ACTIVE = K.SaveManager.ACTIVE_KEY,
    META = 'kings-orbit-cloud-meta-v1-';
  const copy = x => JSON.parse(JSON.stringify(x));
  const idKey = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const random = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
  class CloudError extends Error {
    constructor(code, message, record) {
      super(message);
      this.code = code;
      this.record = record;
    }
  }
  class CloudSave {
    constructor(game) {
      this.game = game;
      this.save = game.save;
      this.meta = this.save.profile;
      this.ready = false;
      this.conflict = null;
      this.accountBusy = false;
      this.state = this.meta ? 'checking' : 'local';
      this.message = '';
      this.onChange = null;
      this.suppress = false;
      this.flight = null;
      this.restoreFlight = null;
      this.timer = null;
      this.lastAttempt = 0;
      this.failures = 0;
      this.signature = this.serialize();
      this.save.onWrite = reason => this.changed(reason);
      window.addEventListener('online', () => {
        if (this.state !== 'auth') this.restore().catch(() => {});
      });
      window.addEventListener('offline', () => {
        if (this.meta) this.status('offline', '오프라인 · 이 기기에 보관 중');
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.meta) {
          game.persist();
          this.flush({ keepalive: true }).catch(() => {});
        }
      });
      this.interval = setInterval(() => {
        if (this.meta && !this.conflict && this.state !== 'auth') {
          if (this.ready) this.flush().catch(() => {});
          else if (Date.now() - this.lastAttempt > Math.min(300000, 45000 * 2 ** Math.min(this.failures, 3)))
            this.restore().catch(e => this.failed(e));
        }
      }, 60000);
      if (this.meta) setTimeout(() => {
        if (!this.lastAttempt) this.restore().catch(() => {});
      }, 300);
    }
    pack(data = this.save.data) {
      return copy({
        version: data.version,
        trophies: data.trophies,
        planetStates: data.planetStates,
        space: data.space,
        visited: data.visited,
        lastMode: 'interior',
      });
    }
    serialize(data = this.save.data) {
      return JSON.stringify(this.pack(data));
    }
    store() {
      if (!this.meta) return;
      try {
        localStorage.setItem(ACTIVE, JSON.stringify(this.meta));
        const m = { ...this.meta };
        delete m.proof;
        localStorage.setItem(META + encodeURIComponent(m.id), JSON.stringify(m));
      } catch {
        this.save.available = false;
      }
    }
    status(state, message = '') {
      this.state = state;
      this.message = message;
      this.onChange?.();
    }
    changed(reason) {
      if (this.suppress || !this.meta) return;
      const sig = this.serialize();
      if (sig === this.signature) return;
      this.signature = sig;
      this.meta.dirty = true;
      this.store();
      if (this.conflict) {
        this.status('conflict', '다른 기기의 기록과 충돌 · 자동 업로드 중지');
        return;
      }
      if (this.state !== 'saving')
        this.status(
          this.ready ? 'pending' : 'offline',
          this.ready ? '이 기기에 저장 · 서버 동기화 대기' : '이 기기에 저장 · 서버 연결 대기',
        );
      if (reason === 'checkpoint' && this.ready) {
        clearTimeout(this.timer);
        this.timer = setTimeout(
          () => this.flush().catch(() => {}),
          Math.max(900, 4000 - (Date.now() - this.lastAttempt)),
        );
      }
    }
    async request(action, extra = {}, options = {}) {
      if (!globalThis.fetch) throw new CloudError('BROWSER', '이 브라우저는 서버 저장을 지원하지 않습니다.');
      const ctrl = new AbortController(),
        timeout = setTimeout(() => ctrl.abort(), 20000);
      try {
        const url = ENDPOINT + '?game=kings-orbit' + (action === 'ping' ? '&action=ping' : '');
        const optionsFetch = {
          method: action === 'ping' ? 'GET' : 'POST',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
          cache: 'no-store',
          signal: ctrl.signal,
          referrerPolicy: 'no-referrer',
        };
        if (action !== 'ping') {
          optionsFetch.headers = { 'Content-Type': 'text/plain;charset=UTF-8' };
          optionsFetch.body = JSON.stringify({ game: 'kings-orbit', protocol: 1, action, ...extra });
          if (options.keepalive) optionsFetch.keepalive = true;
        }
        const response = await fetch(url, optionsFetch);
        if (!response.ok) throw new CloudError('HTTP', '서버 연결을 확인하지 못했습니다. 기록은 이 기기에 남습니다.');
        let r;
        try {
          r = await response.json();
        } catch {
          throw new CloudError('SETUP', '서버 저장 기능이 아직 배포되지 않았습니다. Apps Script 설정을 확인하세요.');
        }
        if (!r || r.game !== 'kings-orbit' || r.protocol !== 1)
          throw new CloudError('SETUP', '기존 서버에 FIRST CONTACTS 저장 기능을 먼저 추가해야 합니다.');
        if (!r.ok) throw new CloudError(r.code || 'SERVER', r.message || '서버 저장을 확인하지 못했습니다.', r.record);
        return r;
      } catch (e) {
        if (e instanceof CloudError) throw e;
        throw new CloudError(
          'NETWORK',
          e.name === 'AbortError'
            ? '서버 응답이 늦습니다. 이 기기 기록은 유지됩니다.'
            : '서버 연결에 실패했습니다. 네트워크·배포 권한을 확인하세요.',
        );
      } finally {
        clearTimeout(timeout);
      }
    }
    async ping() {
      const r = await this.request('ping');
      if (!r.ready)
        throw new CloudError('SETUP', '서버에서 setupKingsOrbit를 실행하고 기존 배포를 새 버전으로 갱신하세요.');
      return r;
    }
    async proof(name, password) {
      if (typeof password !== 'string' || password.length < 6 || password.length > 64)
        throw new CloudError('PASSWORD', '저장 비밀번호는 6~64자입니다.');
      if (!crypto?.subtle) throw new CloudError('HTTPS', '서버 저장은 HTTPS 게임 주소에서 이용하세요.');
      const enc = new TextEncoder(),
        key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('kings-orbit-v1\n' + idKey(name)), iterations: 210000 },
        key,
        256,
      );
      return Array.from(new Uint8Array(bits), n => n.toString(16).padStart(2, '0')).join('');
    }
    name(name) {
      const n = name.normalize('NFKC').trim().replace(/\s+/g, ' ');
      if (!/^[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9][가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9 ._-]{0,23}$/.test(n))
        throw new CloudError('NAME', '이름은 한글·영문·숫자로 시작하는 1~24자입니다.');
      return n;
    }
    credentials() {
      return { name: this.meta.name, proof: this.meta.proof };
    }
    validRecord(r) {
      if (!r || !Number.isSafeInteger(r.rev) || r.rev < 1 || typeof r.name !== 'string' || !r.save)
        throw new CloudError('DATA', '서버 응답 형식이 다릅니다. 기존 기록을 유지합니다.');
      this.save.validate(r.save);
      return r;
    }
    // Account changes wait for old asynchronous work. A late old login must never
    // restore one player's save into another player's newly selected identity.
    async identityTask(work) {
      if (this.accountBusy) throw new CloudError('BUSY', '이전 계정 요청이 끝난 뒤 다시 시도하세요.');
      this.accountBusy = true;
      clearTimeout(this.timer);
      try {
        if (this.restoreFlight) await this.restoreFlight.catch(() => {});
        if (this.flight) await this.flight.catch(() => {});
        return await work();
      } finally {
        this.accountBusy = false;
      }
    }
    async connect(name, password, register = false, carry = true) {
      return this.identityTask(() => this.connectAccount(name, password, register, carry));
    }
    async connectAccount(name, password, register = false, carry = true) {
      name = this.name(name);
      await this.ping();
      const proof = await this.proof(name, password);
      this.game.persist();
      if (this.meta?.dirty && this.meta.id !== idKey(name)) {
        await this.flush({ accountTask: true });
        if (this.meta.dirty)
          throw new CloudError('PENDING', '현재 항해자의 미전송 기록부터 저장하거나 내보내 보관하세요.');
      }
      const extra = { name, proof };
      if (register) {
        extra.opId = random();
        extra.save = carry ? this.pack() : this.pack(this.save.fresh());
      }
      // Retrying a registration with the same object after a lost acknowledgment is idempotent.
      let r;
      try {
        r = await this.request(register ? 'register' : 'login', extra);
      } catch (e) {
        if (register && e.code === 'NETWORK') r = await this.request('register', extra);
        else throw e;
      }
      this.validRecord(r);
      const id = idKey(r.name);
      let old = null;
      try {
        old = JSON.parse(localStorage.getItem(META + encodeURIComponent(id)) || 'null');
      } catch {}
      const local = this.save.readProfile(id);
      this.meta = { id, name: r.name, proof, rev: r.rev, updatedAt: r.updatedAt, dirty: false, pending: null };
      this.ready = true;
      this.conflict = null;
      if (!register && old?.dirty && local) {
        this.meta = { ...old, id, name: r.name, proof };
        this.apply(local);
        this.reconcile(r);
      } else {
        this.apply(r.save);
        this.store();
        this.status('saved', '서버에서 항해 기록을 불러왔습니다.');
      }
      this.game.ui.toast(
        register ? '항해자가 등록되었습니다.' : '항해 기록을 불러왔습니다.',
        this.meta.name + ' · 다른 기기에서도 같은 이름과 저장 비밀번호로 이어갈 수 있습니다.',
        5,
      );
      return r;
    }
    apply(data) {
      const g = this.game,
        settings = { ...g.settings };
      this.suppress = true;
      try {
        // Dispose the old world BEFORE switching saves; its dispose() snapshots its old state.
        if (g.planet) {
          g.planet.dispose();
          g.planet = null;
        }
        const next = this.save.validate(data);
        next.settings = settings;
        this.save.useProfile(this.meta, next);
        g.settings = next.settings;
        this.save.write();
        this.signature = this.serialize();
        g.mode = 'interior';
        g.descent = 0;
        g.space.restore();
        g.interior.spawn('bridge');
        g.setEnvironment();
        g.ui.mode('interior');
        g.currentInteract = null;
        g.input.clear();
        g.ui.updateStartLabel();
      } finally {
        this.suppress = false;
      }
    }
    reconcile(r) {
      this.validRecord(r);
      const m = this.meta;
      if (m.pending && r.opId === m.pending.opId) {
        m.rev = r.rev;
        m.updatedAt = r.updatedAt;
        m.dirty = this.serialize() !== this.serialize(m.pending.save);
        m.pending = null;
      }
      if (m.dirty) {
        if (Number(m.rev) !== r.rev) {
          this.conflict = r;
          this.ready = false;
          this.store();
          this.status('conflict', '다른 기기의 새 기록이 있습니다. 자동 덮어쓰기를 중단했습니다.');
          return;
        }
        this.ready = true;
        this.store();
        this.status('pending', '이 기기의 미전송 기록을 서버에 동기화합니다.');
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush().catch(() => {}), 1000);
      } else {
        if (this.game.started && this.serialize() !== this.serialize(r.save)) {
          this.conflict = r;
          this.ready = false;
          this.store();
          this.status('conflict', '서버의 새 기록을 확인하세요. 현재 플레이는 유지합니다.');
          return;
        }
        m.rev = r.rev;
        m.updatedAt = r.updatedAt;
        m.pending = null;
        // If play began while reconnecting, changed() will have marked the new local state dirty.
        if (!this.game.started) this.apply(r.save);
        this.ready = true;
        this.store();
        this.status('saved', '서버 저장 완료');
      }
    }
    async restore() {
      if (!this.meta || this.accountBusy) return;
      if (this.restoreFlight) return this.restoreFlight;
      const task = async () => {
        this.lastAttempt = Date.now();
        this.status('checking', '서버 기록 확인 중');
        try {
          if (this.flight) await this.flight.catch(() => {});
          if (this.game.started) this.game.persist();
          const r = await this.request('login', this.credentials());
          if (this.game.started) this.game.persist();
          this.failures = 0;
          this.reconcile(r);
          return r;
        } catch (e) {
          this.failed(e);
          throw e;
        }
      };
      this.restoreFlight = task();
      try {
        return await this.restoreFlight;
      } finally {
        this.restoreFlight = null;
      }
    }
    async begin() {
      if (this.game.started) return;
      let localNotice = this.state === 'auth' ? this.message : '';
      if (this.meta && !this.ready && !this.conflict && this.state !== 'auth') {
        try {
          await this.restore();
        } catch (e) {
          localNotice = e.message;
        }
      }
      if (this.conflict) {
        this.game.cloudUI.openConflict();
        return;
      }
      this.game.start();
      if (localNotice) this.game.ui.toast('이 기기의 기록으로 시작했습니다.', localNotice, 6);
    }
    failed(e) {
      this.failures++;
      this.ready = false;
      this.store();
      if (e.code === 'CONFLICT' && e.record) {
        this.conflict = e.record;
        this.status('conflict', e.message);
        this.game.ui.toast('서버 기록이 바뀌었습니다.', '메뉴의 서버 저장에서 사용할 기록을 선택하세요.', 6);
      } else
        this.status(
          ['AUTH', 'LOCKED'].includes(e.code) ? 'auth' : 'offline',
          e.message || '연결 실패 · 이 기기에 보관 중',
        );
    }
    async flush(options = {}) {
      if ((this.accountBusy && !options.accountTask) || !this.meta || this.conflict) return false;
      if (this.flight) return this.flight;
      if (!this.ready) return false;
      if (!this.meta.dirty) return true;
      const task = async () => {
        const m = this.meta;
        if (!m.pending) m.pending = { opId: random(), baseRev: m.rev, save: this.pack() };
        const pending = copy(m.pending);
        this.store();
        this.lastAttempt = Date.now();
        this.status('saving', '서버에 저장 중');
        try {
          const r = await this.request('save', { ...this.credentials(), ...pending }, options);
          if (!Number.isSafeInteger(r.rev) || r.opId !== pending.opId)
            throw new CloudError('ACK', '서버의 저장 확인 응답이 다릅니다. 기록을 유지합니다.');
          m.rev = r.rev;
          m.updatedAt = r.updatedAt;
          m.pending = null;
          m.dirty = this.serialize() !== this.serialize(pending.save);
          this.failures = 0;
          this.store();
          this.status(m.dirty ? 'pending' : 'saved', m.dirty ? '최근 진행 동기화 대기' : '서버 저장 완료');
          if (m.dirty) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.flush().catch(() => {}), 5000);
          }
          return true;
        } catch (e) {
          this.failed(e);
          throw e;
        }
      };
      this.flight = task();
      try {
        return await this.flight;
      } finally {
        this.flight = null;
      }
    }
    backup() {
      try {
        localStorage.setItem(this.save.key + '-conflict-backup', this.save.export());
      } catch {}
      return this.save.export();
    }
    async resolve(useLocal) {
      if (!this.conflict) return;
      const remote = this.conflict;
      this.backup();
      if (useLocal) {
        const payload = { ...this.credentials(), opId: random(), baseRev: remote.rev, save: this.pack() };
        const r = await this.request('save', payload);
        if (r.opId !== payload.opId) throw new CloudError('ACK', '서버 저장 확인 응답이 다릅니다.');
        this.meta.rev = r.rev;
        this.meta.updatedAt = r.updatedAt;
        this.meta.pending = null;
        this.meta.dirty = false;
        this.conflict = null;
        this.ready = true;
        this.store();
        this.status('saved', '선택한 이 기기 기록을 서버에 저장했습니다.');
      } else {
        // Fetch once more; a third device may have updated the server since the dialog opened.
        const latest = this.validRecord(await this.request('login', this.credentials()));
        this.meta.rev = latest.rev;
        this.meta.updatedAt = latest.updatedAt;
        this.meta.pending = null;
        this.meta.dirty = false;
        this.conflict = null;
        this.apply(latest.save);
        this.ready = true;
        this.store();
        this.status('saved', '최신 서버 기록으로 이어갑니다.');
      }
    }
    async resetProgress() {
      if (!this.meta) return;
      if (this.conflict) throw new CloudError('CONFLICT', '먼저 사용할 기록을 선택하세요.', this.conflict);
      if (!this.ready) await this.restore();
      if (this.conflict) throw new CloudError('CONFLICT', '다른 기기의 기록을 먼저 확인하세요.', this.conflict);
      if (this.flight) await this.flight;
      const fresh = this.pack(this.save.fresh()),
        opId = random();
      const r = await this.request('save', { ...this.credentials(), baseRev: this.meta.rev, opId, save: fresh });
      if (r.opId !== opId) throw new CloudError('ACK', '초기화를 확인하지 못했습니다.');
      this.backup();
      this.meta.rev = r.rev;
      this.meta.updatedAt = r.updatedAt;
      this.meta.pending = null;
      this.meta.dirty = false;
      this.apply(fresh);
      this.store();
      this.status('saved', '서버 항해 기록을 초기화했습니다.');
    }
    async logout() {
      return this.identityTask(() => this.logoutAccount());
    }
    async logoutAccount() {
      this.game.persist();
      if (this.meta?.dirty) {
        await this.flush({ accountTask: true });
        if (this.meta.dirty)
          throw new CloudError('PENDING', '아직 서버에 전송하지 못한 기록이 있습니다. 저장 확인 후 계정을 바꾸세요.');
      }
      this.store();
      try {
        localStorage.removeItem(ACTIVE);
      } catch {}
      this.meta = null;
      this.ready = false;
      this.conflict = null;
      this.apply(this.save.readProfile(null) || this.save.fresh());
      this.status('local', '이 기기에만 저장');
    }
  }
  CloudSave.ENDPOINT = ENDPOINT;
  CloudSave.CloudError = CloudError;
  CloudSave.idKey = idKey;
  K.CloudSave = CloudSave;
})((window.KO ||= {}));

// FILE: src/ui/ui.js
(function (K) {
  'use strict';
  const $ = id => document.getElementById(id);
  class UI {
    constructor(game) {
      this.game = game;
      this.toastUntil = 0;
      this.hitUntil = 0;
      this.cache = {};
      this.starting = false;
      this.hud = $('hud');
      $('startBtn').onclick = () => this.begin();
      $('titleHelp').onclick = () => this.help();
      $('titleSettings').onclick = () => this.menu();
      const input = game.input;
      input.bindTap('touchInteract', () => game.interact());
      input.bindTap('menuBtn', () => this.menu());
      input.bindTap('soundBtn', () => {
        game.audio.setMuted(!game.audio.muted);
        $('soundBtn').textContent = game.audio.muted ? '×♪' : '♪';
        $('soundBtn').setAttribute('aria-pressed', String(game.audio.muted));
      });
      input.bindTap('fullBtn', () => {
        const failed = () => this.toast('전체 화면을 지원하지 않는 환경입니다.');
        try {
          if (document.fullscreenElement) document.exitFullscreen().catch(failed);
          else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(failed);
          else failed();
        } catch { failed(); }
      });
      input.bindTap('spaceAction', () => game.flightAction());
      input.bindTap('navAction', () => this.navigation());
      input.bindTap('stopAction', () => input.pressed.add('KeyX'));
      input.bindTap('warpAction', () => game.space.toggleWarp());
      // Support a cached title page loading this build's fresh manifest.
      if (!$('recoverAction')) $('returnAction').insertAdjacentHTML('beforebegin',
        '<button id="recoverAction" class="iconButton hidden">모선 회수</button>');
      if (!$('labMonitor')) this.hud.insertAdjacentHTML('beforeend',
        '<section id="labMonitor" class="hidden"><strong id="labReadout"></strong><svg viewBox="0 0 168 28" aria-hidden="true"><path id="labTrace" pathLength="1" fill="none" stroke="currentColor" stroke-dasharray="1" d="M4 23 L42 17 L72 21 L116 5 L164 7"/></svg><button id="labMap" class="hidden">성도에서 보기 ↗</button></section>');
      input.bindTap('labMap', () => {
        const person = game.interior.labPose?.person;
        if (person?.result && person.result !== 'lost') this.navigation(person.lead);
      });
      input.bindTap('recoverAction', () => {
        if (game.mode === 'planet' && !game.descent) game.planet.vehicle.recoverPassenger();
      });
      input.bindTap('returnAction', () => game.returnHome());
      game.input.bindTouch();
      this.mobile(game.input.mobile);
      const wrap = $('panelWrap');
      wrap.addEventListener('pointerdown', e => {
        this.backdropPress = e.target === wrap ? e.pointerId : null;
      });
      wrap.addEventListener('pointercancel', () => { this.backdropPress = null; });
      wrap.addEventListener('click', e => {
        if (e.target === wrap && this.backdropPress != null &&
            (e.pointerId == null || e.pointerId === this.backdropPress)) this.close();
        this.backdropPress = null;
      });
    }
    updateStartLabel() {
      const data = this.game.save.data;
      // An older cached title page can still load the current manifest and scripts.
      const label = $('startLabel') || $('startBtn').firstChild;
      if (this.starting) label.textContent = this.game.cloud.meta ? '서버 기록 확인 중…' : '항해 준비 중…';
      else label.textContent = data.visited.length || data.trophies.length ? '항해 이어가기' : '항해 시작';
    }
    async begin() {
      if (this.starting || this.game.started || this.game.paused) return;
      this.starting = true;
      const buttons = $('title').querySelectorAll('button');
      buttons.forEach(b => { b.disabled = true; });
      $('startBtn').setAttribute('aria-busy', 'true');
      this.updateStartLabel();
      try {
        await this.game.cloud.begin();
      } catch (e) {
        this.toast('항해 기록을 확인하지 못했습니다.', e.message);
      } finally {
        this.starting = false;
        $('startBtn').removeAttribute('aria-busy');
        this.updateStartLabel();
        buttons.forEach(b => { b.disabled = false; });
      }
    }
    mobile(v) {
      this.game.input.clear();
      document.body.classList.toggle('touch', v);
      this.game.input.mobile = v;
      $('navAction').textContent = v ? '성도' : 'M · 성도';
      $('returnAction').textContent = v ? '모선 귀환' : 'R · 모선 귀환';
    }
    start() {
      $('title').classList.add('hidden');
      this.hud.classList.remove('hidden');
      this.mode('interior');
    }
    mode(mode) {
      this.cache.mode = mode;
      this.prompt('', false, '');
      $('spaceAction').classList.toggle('hidden', mode !== 'space');
      $('returnAction').classList.toggle('hidden', mode !== 'planet');
      $('spaceTarget').classList.toggle('hidden', mode !== 'space');
      $('recoverAction').classList.add('hidden');
      this.labMonitor(null);
      $('touchFire').classList.toggle('hidden', mode === 'interior');
      $('touchGrab').classList.toggle('hidden', mode === 'interior');
      $('touchFire').innerHTML =
        mode === 'space' ? '미사일<small>끌어 조준</small>' : '광선<small>끌어 조준</small>';
      $('touchGrab').textContent = mode === 'space' ? '대상 선택' : '견인';
      $('navAction').classList.toggle('hidden', mode === 'planet');
      $('warpAction').classList.toggle('hidden', mode !== 'space');
      document.body.dataset.mode = mode;
      $('touchPulse').classList.toggle('hidden', mode !== 'planet');
      $('touchUp').classList.toggle('hidden', mode === 'interior');
      $('touchDown').classList.toggle('hidden', mode === 'interior');
      $('stopAction')?.classList.toggle('hidden', mode !== 'space');
      $('touchRange')?.classList.add('hidden');
      $('touchFire').dataset.action = mode === 'planet' ? 'beam' : 'missile';
      $('touchFire').classList.remove('arming');
      this.cache.tractorState = null;
      $('worldLabels').innerHTML = '';
      this.setSignal(null);
      $('context').textContent = '';
      this.cache.context = '';
      $('pullMeter').classList.add('hidden');
      const hint = {
        interior: '<kbd>W A S D</kbd> 이동　마우스 시선　<kbd>E</kbd> 표시된 행동　<kbd>Shift</kbd> 빠르게 걷기',
        space:
          '<kbd>W A S D</kbd> 비행　<kbd>Shift</kbd> 가속　<kbd>J</kbd> 도약　<kbd>X</kbd> 정지　<kbd>M</kbd> 성도　<kbd>Q</kbd> 대상　좌클릭 유지 · 미사일',
        planet:
          '<kbd>W A S D</kbd> 수평 비행　<kbd>Space</kbd><kbd>C</kbd> 고도　좌클릭 광선·던지기　우클릭(<kbd>Q</kbd>) 견인·놓기　<kbd>F</kbd> 충격파　<kbd>Shift</kbd> 돌진',
      }[mode];
      $('controlHint').innerHTML = hint;
      this.setStatus(mode === 'interior' ? '선내 보행' : '', 'NØMAD');
    }
    setArea(sector, area) {
      if (this.cache.sector !== sector) {
        $('sector').textContent = sector;
        this.cache.sector = sector;
      }
      if (this.cache.area !== area) {
        $('area').textContent = area;
        this.cache.area = area;
      }
    }
    // 생존 신호: the living in the landed district. Not a score — a plain count, hidden where nobody lives.
    setSignal(n) {
      const el = $('signal');
      if (n == null || this.cache.mode !== 'planet') {
        if (this.cache.signal !== null) {
          el.classList.add('hidden');
          this.cache.signal = null;
        }
        return;
      }
      if (this.cache.signal !== n) {
        $('signalValue').textContent = n.toLocaleString('ko-KR');
        el.classList.remove('hidden');
        this.cache.signal = n;
      }
    }
    setStatus(a, b) {
      if (this.cache.status !== a) {
        $('statusTitle').textContent = a;
        this.cache.status = a;
      }
      if (this.cache.value !== b) {
        $('statusValue').textContent = b;
        this.cache.value = b;
      }
    }
    prompt(text, active, verb = '') {
      const p = $('prompt');
      p.classList.toggle('hidden', !text);
      const label = p.querySelector('span');
      if (label.textContent !== text) label.textContent = text;
      p.querySelector('kbd').style.display = this.game.input.mobile || !active ? 'none' : '';
      const button = $('touchInteract');
      button.classList.toggle('hidden', !active || !verb);
      const caption = active ? verb : '';
      if (button.textContent !== caption) button.textContent = caption;
      button.setAttribute('aria-label', active ? text : '');
    }
    // Texts name the keyboard's keys; on a touch screen they name the buttons, and on a PC the right click.
    keys(text) {
      if (!text) return text;
      if (this.cache.mode === 'space' && this.game.input.mobile) return text
        .replace(/M · 성도/g, '성도').replace(/J 또는 도약/g, '도약').replace(/S로 물러나/g, '뒤로 물러나');
      if (this.cache.mode !== 'planet') return text;
      if (document.body.classList.contains('touch'))
        return text
          .replace('좌클릭 광선 · Q 견인 · F 충격파 · R 언제든 귀환', '광선을 누른 채 끌어 조준하세요.')
          .replace(/Q로 /g, '견인 버튼으로 ')
          .replace(/ · Q 견인/g, ' · 견인 버튼')
          .replace(/Q · /g, '견인 버튼 · ')
          .replace(/가까이 가서 Q\./g, '가까이 가서 견인 버튼.')
          .replace(/S로 뒤로 물러나/g, '뒤로 물러나')
          .replace(/R로 /g, '오른쪽 위 귀환 버튼으로 ')
          .replace(/R · 모선 귀환/g, '오른쪽 위 귀환 버튼')
          .replace(/F는 근접 충격파/g, '충격파 버튼은 근접 충격파');
      return text
        .replace('좌클릭 광선 · Q 견인', '좌클릭 광선 · 우클릭 견인')
        .replace(/Q로 /g, '우클릭으로 ')
        .replace(/ · Q 견인/g, ' · 우클릭 견인')
        .replace(/Q · /g, '우클릭 · ')
        .replace(/가까이 가서 Q\./g, '가까이 가서 우클릭.');
    }
    context(text, active = false, progress = -1) {
      text = this.keys(text);
      if (this.cache.context !== text) {
        $('context').textContent = text;
        this.cache.context = text;
      }
      $('crosshair').classList.toggle('active', active);
      $('pullMeter').classList.toggle('hidden', progress < 0);
      if (progress >= 0) $('pullMeter').firstElementChild.style.width = `${K.M.clamp(progress, 0, 1) * 100}%`;
    }
    hit() {
      this.hitUntil = performance.now() + 80;
      $('hitmarker').classList.add('hit');
    }
    toast(a, b = '', seconds = 4.5) {
      $('toast').querySelector('strong').textContent = this.keys(a);
      $('toast').querySelector('span').textContent = this.keys(b);
      $('toast').classList.add('show');
      this.toastUntil = performance.now() + seconds * 1000;
    }
    update() {
      const t = performance.now();
      if (t > this.toastUntil) $('toast').classList.remove('show');
      if (t > this.hitUntil) $('hitmarker').classList.remove('hit');
      const g = this.game,
        boost = g.input.enabled && g.input.axes().boost;
      const boostText = g.mode === 'interior' ? (boost ? '빠른 걸음' : '빠르게 걷기') : boost ? '가속 중' : '가속';
      if (this.cache.boostText !== boostText) {
        $('touchBoost').querySelector('span').textContent = boostText;
        this.cache.boostText = boostText;
      }
      $('touchBoost').classList.toggle('held', !!boost);
      $('touchBoost').setAttribute('aria-pressed', String(!!boost));
      $('touchBoost').setAttribute(
        'aria-label',
        g.mode === 'interior' ? '누른 채 끌어 빠르게 걷기' : '누른 채 끌어 가속 이동',
      );
      if (g.mode === 'planet') {
        const btn = $('recoverAction'), full = g.universe.cargoFull();
        btn.classList.toggle('hidden', !g.planet.vehicle.canRecover() || !!g.descent);
        btn.disabled = full;
        btn.textContent = full ? '화물칸 20/20' : g.input.mobile ? '모선 회수' : 'G · 모선 회수';
      }
      if (g.mode === 'planet' && g.input.mobile) {
        const vehicle = g.planet.vehicle, target = vehicle.grab;
        const state = !target ? 'free' : target.kind === 'ruler' || target.tug || vehicle.anchored(target) ? 'fixed' : 'carry';
        if (state !== this.cache.tractorState) {
          this.cache.tractorState = state;
          const fire = $('touchFire');
          fire.classList.toggle('hidden', state === 'fixed');
          fire.dataset.action = state === 'carry' ? 'throw' : 'beam';
          fire.firstChild.textContent = state === 'carry' ? '던지기' : '광선';
          fire.querySelector('small').textContent = state === 'carry' ? '떼면 투척' : '끌어 조준';
          $('touchGrab').textContent = target ? '놓기' : '견인';
          $('touchRange')?.classList.toggle('hidden', state !== 'carry');
        }
        if (state === 'carry' && $('touchRange')) {
          const label = Math.round(vehicle.holdDist) + ' m';
          const range = $('touchRange').querySelector('small');
          if (range.textContent !== label) range.textContent = label;
        }
      }
      if (g.mode === 'space') {
        const s = g.space,
          def = s.target;
        const p = K.M.project(s.renderPoint(def.position), g.engine.vp, innerWidth, innerHeight);
        const outside = !p.front || p.x < 80 || p.x > innerWidth - 80 || p.y < 80 || p.y > innerHeight - 120;
        $('spaceTarget').classList.toggle('hidden', s.atmosphere() > 0.5);
        const px = Number.isFinite(p.x) ? p.x : innerWidth / 2,
          py = Number.isFinite(p.y) ? p.y : innerHeight / 2;
        $('spaceTarget').style.left = `${K.M.clamp(px, 80, innerWidth - 80)}px`;
        $('spaceTarget').style.top = `${K.M.clamp(py, 100, innerHeight - 130)}px`;
        $('spaceTarget').style.opacity = outside ? 0.38 : 0.85;
        $('targetName').textContent = def.name + ' / ' + def.id.toUpperCase();
        $('distanceLabel').textContent =
          K.formatDistance(s.distance()) + (g.universe.destroyed(def.id) ? ' · 잔해까지' : ' · 지표까지');
        $('targetState').textContent = g.universe.destroyed(def.id)
          ? '행성 소멸'
          : g.universe.hits(def.id)
            ? '지각 붕괴 ' + g.universe.hits(def.id) + '/5'
            : g.universe.surfaceReady(def.id)
              ? '상륙 가능'
              : '궤도 탐사 / 포격';
        $('spaceAction').classList.toggle('hidden', false);
        const destination = def.name + (g.universe.navMode === 'sky' ? ' 상공으로' : ' 궤도로');
        $('spaceAction').textContent = g.input.mobile
          ? (s.auto ? '항해 해제' : '자동항해')
          : 'T · ' + (s.auto ? '자동항해 해제' : destination);
        if (g.canDeploy()) $('spaceAction').textContent = g.input.mobile ? '파괴정 출격' : 'T · 파괴정 출격';
        $('spaceAction').title = g.canDeploy() ? '현재 창공에서 바로 출격' : s.auto ? '자동항해 해제' : destination + ' 자동항해';
        $('warpAction').textContent = (g.input.mobile ? '' : 'J · ') + (s.warp ? '도약 해제' : '도약');
        const armed = s.weapons.charge > 0;
        $('touchFire').classList.toggle('arming', armed);
        $('touchFire').style.setProperty('--charge', Math.min(1, s.weapons.charge / 1.15) * 100 + '%');
        $('touchFire').querySelector('small').textContent = armed
          ? '탄두 장전 중'
          : s.weapons.cooldown > 0
            ? '재장전'
            : '끌어 조준';
      }
    }
    async transition(title, subtitle, fn, white = false) {
      const el = $('transition');
      el.querySelector('strong').textContent = title;
      el.querySelector('span').textContent = subtitle;
      el.classList.toggle('white', white);
      el.classList.add('show');
      await new Promise(r => setTimeout(r, 600));
      try {
        await fn();
        await new Promise(r => setTimeout(r, 400));
      } finally {
        el.classList.remove('show');
        await new Promise(r => setTimeout(r, 520));
      }
    }
    loading(done = false) {
      if (done) {
        $('loading').classList.add('fade');
        setTimeout(() => $('loading').classList.add('hidden'), 850);
      }
    }
    open(html) {
      const g = this.game;
      this.backdropPress = null;
      $('title').inert = true;
      this.hud.inert = true;
      g.paused = true;
      g.input.clear();
      g.input.enabled = false;
      document.exitPointerLock?.();
      g.audio.stop();
      g.audio.hold(true);
      $('panel').classList.remove('atlasPanel');
      $('panel').innerHTML = html;
      $('panelWrap').classList.remove('hidden');
      $('panel').scrollTop = 0;
      $('panel').focus({ preventScroll: true });
    }
    close() {
      if (this.game.cloudUI?.busy) return;
      this.game.paused = false;
      this.game.input.enabled = this.game.started;
      this.game.input.clear();
      if (!document.hidden && !this.game.contextLost) this.game.audio.hold(false);
      $('panelWrap').classList.add('hidden');
      $('title').inert = false;
      this.hud.inert = false;
      (this.game.started ? this.game.engine.canvas : $('startBtn')).focus({ preventScroll: true });
    }
    menu() {
      const g = this.game,
        s = g.settings;
      this.open(
        `<div class="eyebrow">NØMAD / SHIP SYSTEMS</div><h2>${g.started ? '잠시 정박' : '항해 설정'}</h2>${g.cloudUI?.menuRow() || ''}<div class="panelRow"><label for="quality">화면 품질</label><select id="quality"><option value="low">저사양</option><option value="balanced">균형</option><option value="high">높음</option></select></div><div class="panelRow"><label for="volume">소리</label><input id="volume" type="range" min="0" max="1" step=".05" value="${s.volume}"></div><div class="panelRow"><label for="sensitivity">시선 감도</label><input id="sensitivity" type="range" min=".3" max="2" step=".05" value="${s.sensitivity}"></div><div class="panelRow"><label for="shake">충돌 화면 흔들림</label><input id="shake" type="range" min="0" max="1" step=".05" value="${s.shake}"></div><div class="panelRow"><label for="touchSetting">화면 터치 조작 표시</label><input id="touchSetting" type="checkbox" ${g.input.mobile ? 'checked' : ''}></div><div class="panelActions"><button class="primary" id="resume">${g.started ? '항해 계속' : '닫기'} ↗</button><button class="secondary" id="helpBtn">조작 안내</button></div><div class="panelActions slim"><button class="secondary" id="exportSave">저장 내보내기</button><button class="secondary" id="importSave">저장 불러오기</button><input id="importInput" type="file" accept=".json,application/json"></div><div class="panelActions slim"><button class="ghost danger" id="resetBtn">진행 기록 초기화</button></div><div class="finePrint">자동 저장: 왕의 머리 회수 · 행성 귀환 · 주기적 항해 저장<br>로컬 파일·시크릿 모드에서는 저장이 제한될 수 있습니다. 저장 파일을 따로 보관할 수 있습니다.<br>FIRST CONTACTS ${K.BUILD || ''} · 상륙 가능한 행성 ${g.universe.planets.filter(p => g.universe.surfaceReady(p.id) && !g.universe.destroyed(p.id)).length}개 / 512개 세계</div>`,
      );
      $('quality').value = s.quality;
      $('quality').onchange = e => {
        s.quality = e.target.value;
        g.engine.quality = s.quality;
        g.engine.resolutionScale = 1;
        g.engine.resize();
        g.persist();
      };
      for (const id of ['volume', 'sensitivity', 'shake'])
        $(id).oninput = e => {
          s[id] = Number(e.target.value);
          g.audio.volume = s.volume;
          g.audio.applyVolume();
          g.input.sensitivity = s.sensitivity;
          g.persist();
        };
      $('touchSetting').onchange = e => this.mobile(e.target.checked);
      $('resume').onclick = () => this.close();
      $('helpBtn').onclick = () => this.help();
      $('exportSave').onclick = () => {
        g.persist();
        const blob = new Blob([g.save.export()], { type: 'application/json' }),
          url = URL.createObjectURL(blob),
          a = document.createElement('a');
        a.href = url;
        a.download = 'first-contacts-save.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      $('importSave').onclick = () => $('importInput').click();
      $('importInput').onchange = async e => {
        try {
          const file = e.target.files[0];
          if (!file) return;
          g.save.import(await file.text());
          g.reloadingSave = true;
          location.reload();
        } catch (err) {
          this.toast('저장 파일을 읽지 못했습니다.', err.message);
        }
      };
      $('resetBtn').onclick = () => this.confirmReset();
      g.cloudUI?.bindMenu();
    }
    confirmReset() {
      if (this.game.cloud?.meta) {
        this.game.cloudUI.confirmReset();
        return;
      }
      this.open(
        '<div class="eyebrow">RESET VOYAGE</div><h2>항해 기록을 지울까요?</h2><p class="text">전시된 머리와 행성의 파괴 기록이 사라집니다. 이 작업은 되돌릴 수 없습니다.</p><div class="panelActions"><button id="cancelReset" class="primary">취소</button><button id="doReset" class="secondary danger">기록 지우기</button></div>',
      );
      $('cancelReset').onclick = () => this.menu();
      $('doReset').onclick = () => {
        this.game.save.reset();
        location.reload();
      };
    }
    help() {
      const touch = this.game.input.mobile;
      const controls = touch ? `<div class="controlsTable">
          <div>왼쪽 화면</div><div>누른 자리에서 끌어 이동합니다. 조이스틱 원 바깥으로 더 밀면 빠르게 움직입니다.</div>
          <div>가속 · 상승 · 하강</div><div>누르는 동안 작동합니다. 같은 손가락을 끌면 이동 방향도 바뀝니다.</div>
          <div>오른쪽 화면</div><div>끌어 시선을 돌립니다.</div>
          <div>광선 · 미사일</div><div>누른 채 끌어 조준합니다. 광선은 누르는 동안 나가고, 미사일은 사거리 안의 행성을 조준한 채 장전을 마치면 발사됩니다. 최종 탄두는 손을 뗐다가 다시 눌러 발사합니다.</div>
          <div>견인 · 대상 선택</div><div>탭하면 현재 조준점에 적용합니다. 누른 채 조준하고 손을 떼도 됩니다.</div>
          <div>견인 중</div><div>움직일 수 있는 물체는 거리 버튼을 위로 끌어 밀고 아래로 끌어 당깁니다. 던지기를 끌어 조준한 뒤 떼면 날아갑니다. 놓기를 누르면 내려놓습니다. 주민을 붙잡은 채 모선 회수를 누르면 모선이 끌어올립니다.</div>
          <div>충격파</div><div>손을 떼면 주변에 충격파가 퍼집니다. 재충전에는 3초가 걸립니다.</div>
          <div>자동항해 · 정지</div><div>자동항해 중 직접 방향을 바꾸면 수동 비행으로 돌아옵니다. 정지는 관성과 도약까지 멈춥니다.</div>
        </div>` : `<div class="controlsTable"><div>W A S D</div><div>걷기 / 비행 · 마우스로 시선<br>파괴정은 바라보는 곳과 상관없이 수평으로 움직입니다.</div><div>화면 클릭</div><div>마우스 고정. 안 되면 우클릭 드래그.<br>방향키 좌우로도 회전할 수 있습니다.</div><div>E</div><div>조종석 · 전시 기록 · 파괴정 탑승</div><div>Space / C</div><div>상승 / 하강 · Shift와 함께 누르면 급강하<br>땅에 세게 내리꽂으면 충격파가 터집니다.</div><div>Shift 유지</div><div>누르는 동안 빠르게 걷기 / 가속·충돌</div><div>M / T / J / X</div><div>성도 / 자동항해 / 도약 / 추진 정지</div><div>좌클릭 길게</div><div>모선: 미사일 장전·발사 / 파괴정: 절단 광선<br>견인으로 붙잡고 있을 때 좌클릭은 세게 던지기입니다.</div><div>우클릭 · Q</div><div>모선: 바라보는 행성 선택(Q) / 파괴정: 견인<br>조준점 둘레 원뿔 안에 든 대상이 붙잡힙니다. 다시 누르면 천천히 내려놓습니다. 붙잡은 동안 마우스 휠로 거리 조절.</div><div>G</div><div>견인한 주민을 모선에서 회수합니다.</div><div>F</div><div>근접 충격파 · 재충전 3초</div><div>R</div><div>행성에서 언제든 모선으로 귀환</div><div>Esc / P</div><div>메뉴 / 일시정지</div></div>`;
      this.open(
        `<div class="eyebrow">FLIGHT MANUAL / 01</div><h2>가고 싶은 곳으로.</h2>${controls}
        <p class="text">처음에는 조종석에 앉아 <b>${touch ? '자동항해' : 'T'}</b>로 에덴에 접근하세요. 행성이 하늘과 구름으로 가득 보일 때까지 접근합니다. 창공에서 <b>${touch ? '파괴정 출격' : 'T'}</b>을 누르거나, 조종석에서 일어나 격납고에서 탑승하세요.</p><p class="text">행성에서는 눈앞의 건물을 부수거나 밀어버리세요. 왕좌를 무력화한 뒤 왕의 머리를 바라보고 <b>${touch ? '견인' : '우클릭(Q)'}</b>으로 붙잡아 <b>${touch ? '왼쪽 화면을 아래로 끌어' : 'S를 눌러'}</b> 뒤로 물러나면 회수할 수 있습니다. 왕을 잡지 않고 떠나도 됩니다.</p><p class="text">모선의 <b>${touch ? '성도' : 'M · 성도'}</b>에서 64개 항성계의 512개 행성을 찾아갈 수 있습니다. <b>포격 궤도로 항해</b>한 뒤 행성을 바라보고 미사일 버튼을 길게 누르세요. <b>마지막 탄두는 다시 눌러 발사합니다. 5회 명중하면 행성이 소멸</b>하며, 아직 얻지 않은 왕의 머리는 회수할 수 없습니다. 이미 전시한 머리는 남습니다. 성도에서 ‘확인된 주민 행성’을 누르면 목적지를 고를 수 있습니다. ‘상륙 가능한 행성’을 펼치면 무인 행성도 볼 수 있습니다.</p>
        <div class="finePrint">기능을 막는 연료·목숨·제한시간은 없습니다. 우주에서는 엔진을 멈추면 고요해집니다.</div>
        <div class="panelActions"><button id="closeHelp" class="primary">알겠습니다 ↗</button></div>`,
      );
      $('closeHelp').onclick = () => this.close();
    }
    openHold() {
      const u = this.game.universe,
        esc = K.escapeHTML;
      const rows = u.hold
        .map(p => `<div class="panelRow"><span>${esc(p.from ? u.displayName(p.from) : '출신 불명')}</span><span>${p.result ? '항로 조사 완료' : '생존'}</span></div>`)
        .join('');
      const heads = this.game.save.data.trophies.length;
      this.open(
        `<div class="eyebrow">CARGO HOLD</div><h2>${u.cargo}/20</h2><p class="text">${u.cargo ? (heads ? '모두 전시 복도 쪽을 보고 서 있습니다.' : '모두 실험대 쪽을 보고 서 있습니다.') : '비어 있습니다.'}${u.lost ? '<br>지금까지 ' + u.lost + '명이 돌아가지 못했습니다.' : ''}${u.freed ? '<br>' + u.freed + '명을 내려놓았습니다.' : ''}</p>${rows}<div class="panelActions">${u.cargo ? `<button id="freeHold">${u.freeing ? '내려보내기 취소' : '다음 착륙지에서 내려보내기'}</button>` : ''}<button id="closeHold" class="primary">닫기 ↗</button></div>`,
      );
      if (u.cargo)
        $('freeHold').onclick = () => {
          const on = u.setFreeing(!u.freeing);
          this.close();
          this.toast(
            on ? '다음 착륙지에서 내려보냅니다' : '내려보내기를 취소했습니다',
            on ? '어느 행성이든 상관없이, 먼저 닿는 곳에 내려놓습니다.' : '화물칸에 그대로 둡니다.',
            5,
          );
        };
      $('closeHold').onclick = () => this.close();
    }
    labMonitor(pose) {
      const el = $('labMonitor');
      if (!pose || pose.scan == null) { el.classList.add('hidden'); return; }
      const p = pose.person, done = !!p.result;
      const dest = this.game.universe.get(p.lead);
      const usable = done && p.result !== 'lost' && dest && !this.game.universe.destroyed(dest.id);
      el.classList.remove('hidden');
      const field = p.result === 'site' ? ' · 거주지 착륙 좌표' : '';
      $('labReadout').textContent = done ? usable ? dest.name + field : '끊어진 항로' : '항적 복원 중';
      $('labTrace').style.strokeDashoffset = String(1 - Math.min(1, pose.scan / 2.2));
      $('labMap').classList.toggle('hidden', !usable);
    }
    inspectRelic(id) {
      const u = this.game.universe,
        def = u.get(id),
        esc = K.escapeHTML,
        form = u.relicForm(id);
      this.open(
        `<div class="eyebrow">ARCHIVE / RECOVERED</div><h2>${esc(K.RelicName[form])}</h2><p class="text">분류 불명. 생체로 추정.<br>${esc(K.RelicNote[form])}</p><div class="panelRow"><span>회수지</span><span>${esc(u.displayName(id))}</span></div><div class="panelRow"><span>관측 명명</span><span>${esc(def?.name || id)}</span></div><div class="panelRow"><span>행성 상태</span><span>소멸 · 왕 미회수</span></div>${u.dissected(id) ? `<p class="text">해부 기록 — ${esc(K.RelicTrue[form])}</p>` : ''}<div class="panelActions">${u.dissected(id) ? '' : '<button id="cutRelic">실험실에서 해부하기</button>'}<button id="closeInspect" class="primary">구경 계속 ↗</button></div>`,
      );
      if (!u.dissected(id))
        $('cutRelic').onclick = () => {
          u.dissectRelic(id);
          this.close();
          this.game.audio.success();
          this.toast(K.RelicName[form] + ' · 해부 완료', K.RelicTrue[form], 7);
        };
      $('closeInspect').onclick = () => this.close();
    }
    inspect(index) {
      const t = this.game.save.data.trophies[index],
        esc = K.escapeHTML,
        planet = t ? this.game.universe.get(t.planet) : null;
      this.open(
        `<div class="eyebrow">ARCHIVE / ${String(index + 1).padStart(2, '0')}</div><h2>${t ? esc(t.name) : '비어 있는 자리'}</h2><p class="text">${t ? esc(K.SurfaceMeta?.[t.planet]?.trophyNote || '그 세계의 왕은 이제 NØMAD와 함께 떠돈다.') : '아직 아무것도 전시되어 있지 않습니다.<br>다음 행성의 자리는 남아 있습니다.'}</p>${t ? `<div class="panelRow"><span>회수지</span><span>${esc(planet?.name || t.planet)}</span></div><div class="panelRow"><span>행성 상태</span><span>${this.game.universe.destroyed(t.planet) ? '소멸 · 전시품 보존' : '존재'}</span></div><div class="panelRow"><span>회수 시각</span><span>${new Date(t.time).toLocaleString('ko-KR')}</span></div>` : ''}<div class="panelActions"><button id="closeInspect" class="primary">구경 계속 ↗</button></div>`,
      );
      $('closeInspect').onclick = () => this.close();
    }
    fatal(err) {
      // the mouse must come free, or the button below cannot be clicked
      try {
        document.exitPointerLock?.();
        this.game.input.clear();
        this.game.input.enabled = false;
      } catch {}
      $('fatalText').textContent = String(err?.message || err);
      $('fatal').classList.remove('hidden');
      $('loading').classList.add('hidden');
    }
  }
  K.UI = UI;
})((window.KO ||= {}));

// FILE: src/ui/cloud-ui.js
(function (K) {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  class CloudUI {
    constructor(game) {
      this.game = game;
      this.cloud = game.cloud;
      this.busy = false;
      $('titleCloud').onclick = () => this.open();
      this.cloud.onChange = () => this.refresh();
      this.refresh();
    }
    summary() {
      const c = this.cloud;
      return c.meta
        ? `${c.meta.name} · ${{ checking: '서버 확인 중', local: '로컬 저장', offline: '기기 보관 중', auth: '다시 로그인 필요', pending: '동기화 대기', saving: '서버 저장 중', saved: '서버 저장됨', conflict: '기록 선택 필요' }[c.state] || c.state}`
        : '이 기기에 저장 중 · 이름을 등록하면 다른 기기에서 이어하기';
    }
    refresh() {
      for (const id of ['cloudTitleStatus', 'cloudMenuStatus', 'cloudStatus']) {
        const e = $(id);
        if (e) e.textContent = this.summary();
      }
      if ($('cloudDetail')) $('cloudDetail').textContent = this.cloud.message;
      $('titleCloud').textContent = this.cloud.meta ? '항해자 · 서버 저장' : '이름으로 저장 / 이어하기';
    }
    menuRow() {
      return `<div class="cloudMenu"><div><span class="eyebrow">VOYAGE SAVE</span><p id="cloudMenuStatus">${escape(this.summary())}</p></div><button class="secondary" id="cloudMenu">서버 저장</button></div>`;
    }
    bindMenu() {
      $('cloudMenu').onclick = () => this.open();
    }
    async action(fn, done) {
      if (this.busy) return;
      this.busy = true;
      const controls = Array.from($('panel').querySelectorAll('button,input'));
      controls.forEach(e => (e.disabled = true));
      if ($('cloudError')) $('cloudError').textContent = '서버와 항해 기록을 확인하고 있습니다…';
      try {
        await fn();
        this.busy = false;
        done?.();
      } catch (e) {
        this.busy = false;
        controls.forEach(x => (x.disabled = false));
        if (e.code === 'CONFLICT' && e.record) {
          this.cloud.conflict = e.record;
          this.cloud.ready = false;
          this.cloud.status('conflict', e.message);
          this.openConflict();
        } else if ($('cloudError'))
          $('cloudError').textContent = e.message || '연결을 확인하지 못했습니다. 기존 기록은 유지됩니다.';
      } finally {
        this.busy = false;
        controls.forEach(e => (e.disabled = false));
        this.refresh();
      }
    }
    open() {
      if (this.busy) return;
      if (this.cloud.conflict) {
        this.openConflict();
        return;
      }
      if (!this.cloud.meta || this.cloud.state === 'auth') {
        this.login(false);
        return;
      }
      const c = this.cloud;
      this.game.persist();
      this.game.ui.open(
        `<div class="eyebrow">NØMAD / CLOUD ARCHIVE</div><h2>${escape(c.meta.name)}의 항해</h2><p class="text" id="cloudStatus"></p><p class="cloudDetail" id="cloudDetail"></p><div class="panelRow"><span>마지막 서버 확인</span><span>${c.meta.updatedAt ? escape(new Date(c.meta.updatedAt).toLocaleString('ko-KR')) : '미확인'}</span></div><p class="text">트로피·행성 기록·모선 위치를 저장합니다.<br>다른 기기에서 같은 이름과 저장 비밀번호로 이어갈 수 있습니다.</p><p class="cloudError" id="cloudError" role="status"></p><div class="panelActions"><button id="syncNow" class="primary">지금 저장 ↗</button><button id="cloudClose" class="secondary">돌아가기</button></div><div class="panelActions slim"><button id="changeAccount" class="ghost">계정 바꾸기</button><button id="cloudExport" class="ghost">기기 기록 내보내기</button></div><div class="finePrint">기본 60초 간격, 왕 회수·행성 귀환 때 동기화합니다. 실패하면 기기에 보관하고 재시도합니다.<br>브라우저를 바로 닫을 때는 전송을 보장할 수 없습니다. 다른 기기로 옮기기 전 ‘서버 저장됨’을 확인하세요.</div>`,
      );
      this.refresh();
      $('syncNow').onclick = () =>
        this.action(
          async () => {
            this.game.persist();
            if (!c.ready) await c.restore();
            if (c.conflict) throw new K.CloudSave.CloudError('CONFLICT', '사용할 기록을 선택하세요.', c.conflict);
            await c.flush();
          },
          () => {
            this.open();
            $('cloudError').textContent = '서버 저장을 확인했습니다.';
          },
        );
      $('cloudClose').onclick = () => this.game.ui.close();
      $('cloudExport').onclick = () => this.export();
      $('changeAccount').onclick = () =>
        this.action(
          () => c.logout(),
          () => this.login(false),
        );
    }
    login(register = false) {
      if (this.busy) return;
      this.game.ui.open(
        `<div class="eyebrow">NØMAD / ${register ? 'NEW VOYAGER' : 'CONTINUE VOYAGE'}</div><h2>${register ? '새 항해자 등록' : '이름으로 이어하기'}</h2><p class="text">${register ? '이름을 ID로 사용합니다. 기존 로컬 기록을 가져와 시작할 수 있습니다.' : '다른 기기에 저장한 항해도 같은 이름으로 불러옵니다.'}</p><form id="cloudForm" class="cloudForm"><label for="voyagerName">이름 / ID</label><input id="voyagerName" name="username" type="text" maxlength="24" autocomplete="username" placeholder="예: 현규" required><label for="voyagerPassword">저장 비밀번호</label><input id="voyagerPassword" name="password" type="password" minlength="6" maxlength="64" autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="6자 이상 · 게임 저장 전용" required>${register ? '<label for="voyagerPassword2">비밀번호 확인</label><input id="voyagerPassword2" name="passwordConfirm" type="password" minlength="6" maxlength="64" autocomplete="new-password" required><label class="cloudCheck"><input id="carryProgress" type="checkbox" checked> 이 기기의 현재 진행을 가져오기</label>' : ''}<p class="cloudError" id="cloudError" role="status"></p><div class="panelActions"><button class="primary" type="submit">${register ? '등록하고 기록 저장' : '항해 불러오기'} ↗</button><button class="secondary" type="button" id="cloudCancel">돌아가기</button></div></form><div class="panelActions slim"><button class="ghost" id="switchCloudMode">${register ? '이미 이름이 있다면 이어하기' : '처음이면 새 항해자 등록'}</button></div><div class="finePrint">같은 이름은 한 항해자만 사용합니다. 대소문자·앞뒤 공백은 구분하지 않습니다.<br>다른 사이트의 비밀번호를 재사용하지 마세요. 이 게임은 이메일 복구를 제공하지 않습니다.<br>로그인하지 않아도 기존처럼 이 기기에 저장하며 플레이할 수 있습니다.</div>`,
      );
      $('cloudForm').onsubmit = e => {
        e.preventDefault();
        const name = $('voyagerName').value,
          pw = $('voyagerPassword').value,
          carry = register && $('carryProgress').checked;
        if (register && pw !== $('voyagerPassword2').value) {
          $('cloudError').textContent = '두 비밀번호가 다릅니다.';
          return;
        }
        this.action(
          () => this.cloud.connect(name, pw, register, carry),
          () => this.open(),
        );
      };
      $('cloudCancel').onclick = () => this.game.ui.close();
      $('switchCloudMode').onclick = () => this.login(!register);
      if (this.cloud.meta) $('voyagerName').value = this.cloud.meta.name;
      $('voyagerName').focus();
    }
    openConflict() {
      if (this.busy) return;
      const c = this.cloud,
        r = c.conflict;
      if (!r) return this.open();
      this.game.persist();
      this.game.ui.open(
        `<div class="eyebrow">SAVE CONFLICT / NOTHING OVERWRITTEN</div><h2>두 항해 기록이 있습니다.</h2><p class="text">다른 기기에서도 진행한 기록이 있어 자동 덮어쓰기를 멈췄습니다. 사용할 기록을 직접 선택하세요.</p><div class="panelRow"><span>이 기기</span><span>트로피 ${this.game.save.data.trophies.length} · 방문 ${this.game.save.data.visited.length}</span></div><div class="panelRow"><span>서버 기록 · 버전 ${r.rev}</span><span>트로피 ${r.save.trophies.length} · 방문 ${r.save.visited.length}</span></div><p class="cloudError" id="cloudError" role="status"></p><div class="panelActions"><button id="useServer" class="primary">서버 기록 사용</button><button id="useLocal" class="secondary danger">이 기기로 덮어쓰기</button></div><div class="panelActions slim"><button id="conflictExport" class="ghost">먼저 기기 기록 내보내기</button><button id="conflictClose" class="ghost">나중에 선택</button></div><p class="finePrint">기기 기록은 선택 직전 별도 로컬 백업에도 보관합니다. 브라우저 데이터 삭제에 대비하려면 먼저 파일로 내보내세요.</p>`,
      );
      $('useServer').onclick = () =>
        this.action(
          () => c.resolve(false),
          () => this.open(),
        );
      $('useLocal').onclick = () => {
        this.game.ui.open(
          '<div class="eyebrow">CONFIRM CLOUD REPLACEMENT</div><h2>서버 기록을 바꿀까요?</h2><p class="text">다른 기기의 서버 기록을 지금 이 기기의 진행으로 교체합니다. 서버의 직전 기록은 백업 칸에 보관됩니다.</p><p class="cloudError" id="cloudError" role="status"></p><div class="panelActions"><button class="primary" id="cancelReplace">취소</button><button class="secondary danger" id="confirmReplace">교체하기</button></div>',
        );
        $('cancelReplace').onclick = () => this.openConflict();
        $('confirmReplace').onclick = () =>
          this.action(
            () => c.resolve(true),
            () => this.open(),
          );
      };
      $('conflictExport').onclick = () => this.export();
      $('conflictClose').onclick = () => this.game.ui.close();
    }
    confirmReset() {
      this.game.ui.open(
        '<div class="eyebrow">RESET CLOUD VOYAGE</div><h2>서버 항해를 초기화할까요?</h2><p class="text">현재 이름의 트로피·행성 기록·모선 위치를 초기화합니다. 이름과 비밀번호는 유지됩니다. 서버가 확인한 뒤에만 기기 기록도 바뀝니다.</p><p class="cloudError" id="cloudError" role="status"></p><div class="panelActions"><button class="primary" id="cancelCloudReset">취소</button><button class="secondary danger" id="doCloudReset">서버 기록 초기화</button></div>',
      );
      $('cancelCloudReset').onclick = () => this.game.ui.menu();
      $('doCloudReset').onclick = () =>
        this.action(
          () => this.cloud.resetProgress(),
          () => this.open(),
        );
    }
    export() {
      this.game.persist();
      const url = URL.createObjectURL(new Blob([this.game.save.export()], { type: 'application/json' })),
        a = document.createElement('a');
      a.href = url;
      a.download = 'kings-orbit-save.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  }
  K.CloudUI = CloudUI;
})((window.KO ||= {}));

// FILE: src/ui/navigation.js
/* Compact, searchable stellar chart. Not a quest list: choose a direction and leave. */
(function (K) {
  'use strict';
  const $ = id => document.getElementById(id),
    esc = s =>
      String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  K.escapeHTML = esc;
  // World units are metres. A million metres is 1,000 km, not a million kilometres.
  K.formatDistance = d =>
    d >= 1e9
      ? (d / 1e9).toFixed(2) + ' Mkm'
      : d >= 1000
        ? (d / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + ' km'
        : Math.round(d).toLocaleString() + ' m';
  K.UI.prototype.navigation = function (focusId) {
    const ui = this,
      g = this.game,
      u = g.universe,
      s = g.space;
    let selection = u.get(focusId)?.id || u.selectedId;
    let sys = u.systems[u.get(selection).systemIndex];
    const residents = u.planets.filter(p => u.knownResidentWorld(p.id) && !u.destroyed(p.id) && u.survivors(p.id) > 0);
    const landable = u.planets.filter(p => u.surfaceReady(p.id) && !u.destroyed(p.id));
    const links = planets => planets.map(p =>
      `<button data-surface="${p.id}">${esc(K.SurfaceMeta?.[p.id]?.shortName || p.name)}</button>`
    ).join('');
    this.open(
      `<div class="eyebrow">STELLAR ATLAS / 64 SYSTEMS · 512 WORLDS</div><div class="atlasHead"><h2>어디로든.</h2><button class="secondary" id="closeAtlas">닫기</button></div><p class="atlasIntro">항성계를 누르고 행성을 고르세요. 세계를 부수면 아직 회수하지 않은 왕도 사라집니다.</p><canvas id="galaxyChart" aria-label="64개 항성계의 성도"></canvas><div class="atlasLegend"><span>● 항성계　◇ 현재 위치</span><span>${u.countDestroyed()}개 행성 소멸</span></div><section class="residentRoutes"><h3>확인된 주민 행성</h3>${residents.length
        ? `<div class="surfaceLinks">${links(residents)}</div>`
        : '<p>주민 행성에 착륙하거나 정밀 스캔 4단계 또는 실험으로 거주지를 확인하세요.</p>'}</section>
        <details class="landingRoutes"><summary>상륙 가능한 행성 ${landable.length}곳</summary><div class="surfaceLinks">${links(landable)}</div></details><div class="atlasFilter"><strong id="systemName"></strong><input id="atlasSearch" type="search" placeholder="행성 이름 / p0008" aria-label="행성 이름 또는 ID 검색"></div><div id="planetList" class="planetList"></div><div id="atlasDetail" class="atlasDetail"></div><div class="atlasActions"><button class="primary" id="atlasOrbit">포격 궤도로 항해 ↗</button><button class="secondary" id="atlasSky">창공까지 접근</button><button class="ghost" id="atlasDrift">아무 곳으로</button></div><div class="finePrint">${this.game.input.mobile ? '조종석의 자동항해 버튼으로 선택한 항로를 따라갑니다.' : 'J · 도약 항해　T · 선택한 항로로 자동항해　X · 정지'}</div>`,
    );
    $('panel').classList.add('atlasPanel');
    const chart = $('galaxyChart'),
      width = Math.max(280, Math.min(650, $('panel').clientWidth - 45));
    chart.width = width * 2;
    chart.height = 300 * 2;
    chart.style.height = 'min(29vh, 240px)';
    const ctx = chart.getContext('2d'),
      extent = 6700000;
    const map = p => [chart.width * (0.5 + (p[0] / extent) * 0.45), chart.height * (0.5 + (p[2] / extent) * 0.45)];
    const draw = () => {
      if (!ctx) return;
      const w = chart.width,
        h = chart.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#071119';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(113,154,168,.10)';
      ctx.lineWidth = 1;
      for (let r = 0.15; r < 0.7; r += 0.13) {
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w * r, h * r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(179,208,216,.1)';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      const [tx, ty] = map(sys.position),
        [px, py] = map(s.position);
      ctx.strokeStyle = 'rgba(222,183,131,.28)';
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const star of u.systems) {
        const [x, y] = map(star.position),
          selected = star.id === sys.id,
          dead = star.planets.every(p => u.destroyed(p.id));
        ctx.beginPath();
        ctx.arc(x, y, selected ? 7 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = dead ? '#46505a' : selected ? '#f0c798' : star.starColor;
        ctx.fill();
        if (selected) {
          ctx.strokeStyle = '#c5a578';
          ctx.beginPath();
          ctx.arc(x, y, 17, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#d9c9ae';
          ctx.font = '21px sans-serif';
          ctx.fillText(star.name, x + 23, y + 7);
        }
      }
      ctx.save();
      ctx.translate(Math.max(12, Math.min(w - 12, px)), Math.max(12, Math.min(h - 12, py)));
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#a3e0d5';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    };
    const detail = () => {
      const def = u.get(selection),
        hits = u.hits(selection),
        gone = u.destroyed(selection);
      if (!def) return;
      const subtitle = gone
        ? u.hasTrophy(selection)
          ? '전시한 머리는 남아 있습니다.'
          : '왕의 회수 기회가 사라졌습니다.'
        : u.surfaceReady(selection)
          ? def.surfaceDescription || '구름층에서 파괴정으로 갈아탈 수 있습니다.'
          : '지금은 궤도 탐사와 모선 포격만 가능합니다.';
      $('atlasDetail').innerHTML =
        `<div><strong>${esc(u.displayName(selection))}</strong><span>${esc(def.id)} · ${esc(def.typeName)} · ${K.formatDistance(s.distance(def))}</span></div><p class="${gone ? 'lostText' : ''}">${esc(subtitle)}</p>${u.knownResidentWorld(selection) && !gone ? '<p>주민 거주 확인</p>' : ''}${u.named(selection) ? `<p class="text">관측 명명 — ${esc(def.name)}</p>` : ''}${u.scan(selection) ? `<p class="text">${u.scanLines(selection).slice(0, u.scan(selection)).map(esc).join('<br>')}</p>` : ''}<div class="fractureDots" aria-label="${hits}회 명중">${[0, 1, 2, 3, 4].map(n => `<i class="${n < hits ? 'on' : ''}"></i>`).join('')}</div>`;
      $('panel')
        .querySelectorAll('[data-surface]')
        .forEach(b => b.classList.toggle('active', b.dataset.surface === selection));
      $('atlasOrbit').textContent = gone ? '잔해 지대로 항해 ↗' : '포격 궤도로 항해 ↗';
      $('atlasSky').classList.toggle('hidden', gone);
      if (u.sites.has(selection) && !gone) {
        const site = document.createElement('button');
        site.className = 'secondary';
        site.id = 'atlasSite';
        site.textContent = '거주지 착륙 지점으로 항해 ↗';
        site.onclick = () => go('sky', true);
        $('atlasDetail').append(site);
      }
    };
    const list = () => {
      const query = $('atlasSearch').value.trim().toLowerCase();
      let defs = query
        ? u.planets
            .filter(p =>
              (p.name + ' ' + p.id + ' ' + p.typeName + ' ' + (u.named(p.id) ? p.trueName : ''))
                .toLowerCase()
                .includes(query),
            )
            .slice(0, 40)
        : sys.planets;
      $('systemName').textContent = query ? '검색 결과' : sys.name + ' 항성계';
      $('planetList').innerHTML = defs.length
        ? defs
            .map(
              p =>
                `<button class="planetCard ${p.id === selection ? 'selected' : ''} ${u.destroyed(p.id) ? 'annihilated' : ''}" data-planet="${p.id}"><span class="planetSwatch kind-${p.kind}" style="--planet:${p.color}"></span><span><b>${esc(u.displayName(p.id))}</b><small>${esc(u.label(p.id))}</small></span>${u.destroyed(p.id) ? '<em>×</em>' : ''}</button>`,
            )
            .join('')
        : '<p class="text">해당 이름의 행성이 없습니다.</p>';
      $('planetList')
        .querySelectorAll('[data-planet]')
        .forEach(
          b =>
            (b.onclick = () => {
              selection = b.dataset.planet;
              sys = u.systems[u.get(selection).systemIndex];
              list();
            }),
        );
      detail();
      draw();
    };
    chart.onclick = e => {
      const r = chart.getBoundingClientRect(),
        x = ((e.clientX - r.left) / r.width) * chart.width,
        y = ((e.clientY - r.top) / r.height) * chart.height;
      let nearest = null,
        d = Infinity;
      for (const star of u.systems) {
        const p = map(star.position),
          dist = Math.hypot(p[0] - x, p[1] - y);
        if (dist < d) {
          d = dist;
          nearest = star;
        }
      }
      if (nearest && d < 60) {
        sys = nearest;
        selection = sys.planets[0].id;
        $('atlasSearch').value = '';
        list();
      }
    };
    const go = (mode, settlement = false) => {
      u.landingTarget = settlement ? selection : '';
      s.select(selection, mode);
      s.toggleAuto(mode);
      ui.close();
    };
    $('atlasOrbit').onclick = () => go('orbit');
    $('atlasSky').onclick = () => go('sky');
    $('atlasDrift').onclick = () => {
      const alive = u.planets.filter(p => !u.destroyed(p.id));
      const pool = alive.length ? alive : u.planets;
      selection = pool[Math.floor(Math.random() * pool.length)].id;
      go('orbit');
    };
    $('panel')
      .querySelectorAll('[data-surface]')
      .forEach(
        b =>
          (b.onclick = () => {
            selection = b.dataset.surface;
            sys = u.systems[u.get(selection).systemIndex];
            $('atlasSearch').value = '';
            list();
            $('atlasSky').scrollIntoView({ block: 'nearest' });
          }),
      );
    $('atlasSearch').oninput = list;
    $('closeAtlas').onclick = () => {
      if (selection !== u.selectedId) s.select(selection);
      ui.close();
    };
    list();
    if (focusId) $('atlasSky').scrollIntoView({ block: 'nearest' });
  };
})((window.KO ||= {}));

// FILE: src/worlds/models.js
/* Shared sculptural models; all geometry generated locally. */
(function (K) {
  'use strict';
  const { M, mesh, group } = K;
  const C = {
    hull: '#18222c',
    dark: '#0c141c',
    panel: '#29363d',
    edge: '#57646a',
    gold: '#be9760',
    light: '#92e7e5',
    white: '#d5d9cc',
    amber: '#efa66b',
  };
  function head(root, p = [0, 0, 0], scale = 1) {
    const g = group(root, p);
    g.s = [scale, scale, scale];
    mesh(g, 'sphere', [0, 0, 0], [1.65, 2, 1.45], '#7baaa0');
    mesh(g, 'sphere', [0, -0.57, 0.22], [1.4, 0.9, 1.23], '#8cbdad');
    for (const side of [-1, 1]) {
      let cheek = mesh(g, 'cone', [side * 0.73, 0.08, 0], [0.75, 1.8, 0.7], '#446f70');
      cheek.r[2] = -side * 0.5;
      mesh(g, 'sphere', [side * 0.37, 0.16, -0.62], [0.55, 0.35, 0.13], '#1a282b');
      mesh(g, 'sphere', [side * 0.37, 0.18, -0.7], [0.14, 0.21, 0.05], '#efc075', { em: 1.2 });
      mesh(g, 'box', [side * 0.37, 0.4, -0.59], [0.65, 0.13, 0.16], C.gold);
      let horn = mesh(g, 'cone', [side * 0.86, 1.1, 0.04], [0.43, 1.5, 0.42], C.gold);
      horn.r[2] = -side * 0.23;
    }
    mesh(g, 'box', [0, -0.5, -0.64], [0.55, 0.065, 0.045], '#204244');
    mesh(g, 'cone', [0, -0.06, -0.7], [0.15, 0.5, 0.24], '#6eaaa0');
    mesh(g, 'cylinder', [0, 0.78, 0], [1.95, 0.3, 1.68], C.gold);
    for (let i = 0; i < 7; i++) {
      let a = (i / 7) * Math.PI * 2;
      let n = mesh(g, 'cone', [Math.sin(a) * 0.8, 1.27, Math.cos(a) * 0.68], [0.25, 0.83, 0.25], C.gold);
      n.r[2] = -0.08 * Math.sin(a);
    }
    mesh(g, 'sphere', [0, 1.04, -0.78], [0.29, 0.38, 0.16], '#cdeae0', { em: 0.4 });
    return g;
  }
  function destroyerModel(root, p = [0, 0, 0], scale = 1) {
    const g = group(root, p);
    g.s = [scale, scale, scale];
    mesh(g, 'box', [0, 1, 0], [3.8, 1.5, 6.5], C.hull);
    let nose = mesh(g, 'box', [0, 1.05, -2.5], [3.1, 1.3, 2.5], C.panel);
    nose.r[0] = -0.15;
    mesh(g, 'sphere', [0, 1.9, -0.3], [2.8, 1.7, 3.5], '#24454b');
    mesh(g, 'box', [0, 1.3, -3.45], [3.8, 0.6, 0.38], C.gold);
    for (const s of [-1, 1]) {
      mesh(g, 'box', [s * 2.4, 0.95, 0.3], [1.1, 1.4, 4.5], C.panel);
      mesh(g, 'cylinder', [s * 2.5, 0.2, 1.35], [1.6, 0.5, 1.6], C.dark);
      mesh(g, 'cylinder', [s * 2.5, -0.06, 1.35], [1.1, 0.08, 1.1], C.light, { em: 1.5 });
      mesh(g, 'box', [s * 2.35, 0.9, -3.1], [0.65, 0.6, 3.2], C.hull);
      mesh(g, 'box', [s * 1.97, 0.9, -4.45], [0.8, 0.8, 0.7], C.gold);
      mesh(g, 'box', [s * 2.48, 1.7, 0.8], [0.06, 0.07, 1.8], C.amber, { em: 1 });
      for (let i = 0; i < 4; i++) mesh(g, 'box', [s * 2.97, 0.9, -0.8 + i * 0.6], [0.08, 0.9, 0.22], C.edge);
    }
    return g;
  }
  function cockpit() {
    const root = new K.Node();
    const arms = [];
    for (const s of [-1, 1]) {
      const arm = group(root, [s * 1.22, -0.87, -1.9]);
      arms.push(arm);
      mesh(arm, 'box', [s * 0.15, -0.15, 0.1], [0.42, 0.62, 1.9], C.hull);
      mesh(arm, 'box', [0, 0.17, -0.3], [0.34, 0.21, 1.23], C.panel);
      mesh(arm, 'cylinder', [0, 0, -1.1], [0.53, 0.43, 0.53], C.edge).r[0] = Math.PI / 2;
      mesh(arm, 'box', [0, 0, -1.44], [0.24, 0.25, 0.77], C.gold);
      for (const f of [-1, 1]) {
        const n = mesh(arm, 'box', [f * 0.22, 0, -1.92], [0.18, 0.33, 0.8], C.panel);
        n.r[1] = -f * 0.24;
        mesh(arm, 'box', [f * 0.13, 0, -2.24], [0.23, 0.34, 0.2], C.gold);
      }
      mesh(arm, 'box', [0, 0.23, -0.9], [0.08, 0.025, 0.22], C.light, { em: 1.4 });
    }
    mesh(root, 'box', [0, -1.12, -0.75], [2.5, 0.38, 1.4], C.dark);
    mesh(root, 'box', [0, -0.89, -1.22], [0.85, 0.05, 0.4], C.panel);
    mesh(root, 'box', [0, -0.85, -1.28], [0.42, 0.015, 0.17], C.light, { em: 0.4 });
    for (let s of [-1, 1]) {
      const strut = mesh(root, 'box', [s * 1.52, -0.15, -1.15], [0.085, 2.6, 0.13], C.hull);
      strut.r[2] = s * 0.2;
      mesh(root, 'box', [s * 1.46, 0.5, -1.2], [0.026, 0.9, 0.045], C.edge);
    }
    mesh(root, 'box', [0, 1.2, -1.1], [3.4, 0.09, 0.16], C.hull);
    const carry = head(root, [1.65, -0.4, -3.5], 0.58);
    carry.visible = false;
    return { root, arms, carry };
  }
  function planetBody(root, position = [0, 0, -1500], radius = 320) {
    const groupP = group(root, position);
    const globe = mesh(groupP, 'planet', [0, 0, 0], [radius * 2, radius * 2, radius * 2], '#558b89', { type: 2 });
    globe.r = [0.12, 0.3, 0.2];
    const ring = mesh(groupP, 'ring', [0, 0, 0], [radius * 2.25, radius * 2.25, radius * 2.25], '#998f75', {
      type: 3,
      alpha: 0.72,
    });
    ring.r = [0.24, 0.1, 0.23];
    const atmosphere = mesh(groupP, 'sphere', [0, 0, 0], [radius * 2.055, radius * 2.055, radius * 2.055], '#4388ae', {
      type: 4,
      alpha: 0.13,
    });
    return { group: groupP, globe, ring, atmosphere };
  }
  const RELIC_NAME = [
    '분절된 외피',
    '관 모양 조직',
    '결절이 달린 지지 구조',
    '섬유 다발',
    '속이 빈 껍데기',
    '층을 이룬 연질 조직',
    '대칭을 이루는 부속지',
    '용도 불명의 낭',
  ];
  const RELIC_NOTE = [
    '겹쳐진 판. 벗은 것인지 자란 것인지 알 수 없다.',
    '양끝이 열려 있다. 무엇이 지나갔는지는 모른다.',
    '뼈라고 부를 근거는 없다.',
    '한 방향으로만 갈라진다.',
    '안쪽에 눌린 자국이 남아 있다.',
    '스물두 겹. 왜 스물두 겹인지는 모른다.',
    '한 쌍이었을 것이다. 나머지 한쪽은 없다.',
    '비어 있다. 원래 비어 있었는지는 알 수 없다.',
  ];
  const RELIC_COL = ['#a8b0a2', '#b4a894', '#9fa9ae', '#c0b39a', '#aab5ad', '#b09a9a', '#a4aebb', '#b8b2a0'];
  function relicModel(root, form, seedNum = 0) {
    const g = group(root, [0, 0, 0]),
      col = RELIC_COL[form],
      dark = '#4a534e',
      rng = M.rand((seedNum || form + 1) * 7919 + 13);
    if (form === 0) {
      for (let i = 0; i < 6; i++) {
        const n = mesh(
          g,
          'box',
          [(rng() - 0.5) * 0.5, 0.25 + i * 0.28, (rng() - 0.5) * 0.5],
          [1.5 - i * 0.16, 0.12, 1.1 - i * 0.11],
          i % 2 ? col : dark,
        );
        n.r = [rng() * 0.3 - 0.15, rng() * 3, rng() * 0.3 - 0.15];
      }
    } else if (form === 1) {
      const n = mesh(g, 'cylinder', [0, 0.9, 0], [0.42, 1.8, 0.42], col);
      n.r = [0.35, 0.6, 0.2];
      mesh(g, 'torus', [0, 1.75, 0], [0.5, 0.5, 0.5], dark).r = [0.35, 0.6, 0.2];
      mesh(g, 'torus', [0, 0.12, 0], [0.5, 0.5, 0.5], dark).r = [0.35, 0.6, 0.2];
    } else if (form === 2) {
      const st = mesh(g, 'cylinder', [0, 0.95, 0], [0.22, 1.9, 0.22], col);
      st.r[2] = 0.14;
      for (let i = 0; i < 5; i++) {
        const n = mesh(
          g,
          'lowSphere',
          [Math.sin(i * 1.9) * 0.36, 0.35 + i * 0.36, Math.cos(i * 1.9) * 0.3],
          [0.3, 0.26, 0.3],
          i % 2 ? col : dark,
        );
        n.r = [rng() * 3, rng() * 3, rng() * 3];
      }
    } else if (form === 3) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2,
          n = mesh(
            g,
            'cylinder',
            [Math.sin(a) * 0.22, 0.85 + rng() * 0.2, Math.cos(a) * 0.22],
            [0.055, 1.5 + rng() * 0.6, 0.055],
            i % 3 ? col : dark,
          );
        n.r = [Math.cos(a) * 0.22, 0, -Math.sin(a) * 0.22];
      }
    } else if (form === 4) {
      const n = mesh(g, 'sphere', [0, 0.85, 0], [1.25, 1.4, 1.05], col);
      n.r = [0.2, 0.5, 0];
      mesh(g, 'sphere', [0, 1.15, 0.15], [0.85, 0.75, 0.7], '#2b332f');
      for (let i = 0; i < 4; i++)
        mesh(
          g,
          'box',
          [Math.sin(i * 1.6) * 0.55, 0.5 + i * 0.22, Math.cos(i * 1.6) * 0.45],
          [0.28, 0.06, 0.22],
          dark,
        ).r[1] = i * 1.6;
    } else if (form === 5) {
      for (let i = 0; i < 9; i++) {
        const n = mesh(
          g,
          'disc',
          [0, 0.18 + i * 0.19, 0],
          [1.15 - i * 0.07, 0.055, 0.95 - i * 0.06],
          i % 2 ? col : '#8d9b92',
        );
        n.r = [rng() * 0.12, rng() * 3, rng() * 0.12];
      }
    } else if (form === 6) {
      for (const sd of [-1, 1]) {
        const arm = group(g, [sd * 0.35, 0.3, 0]);
        const a = mesh(arm, 'cylinder', [0, 0.6, 0], [0.17, 1.25, 0.17], col);
        a.r[2] = -sd * 0.33;
        const b = mesh(arm, 'cylinder', [sd * 0.52, 1.35, 0], [0.14, 1, 0.14], col);
        b.r[2] = -sd * 0.9;
        mesh(arm, 'lowSphere', [sd * 0.95, 1.72, 0], [0.3, 0.24, 0.26], dark);
      }
      mesh(g, 'box', [0, 0.22, 0], [1, 0.22, 0.5], dark);
    } else {
      const n = mesh(g, 'sphere', [0, 0.9, 0], [1.1, 1.35, 1.1], col, { alpha: 0.78 });
      n.r[0] = 0.1;
      mesh(g, 'sphere', [0, 0.9, 0], [0.72, 0.95, 0.72], '#39433d');
      mesh(g, 'cylinder', [0, 1.72, 0], [0.28, 0.5, 0.28], dark);
    }
    return g;
  }
  const RELIC_TRUE = [
    '판 하나하나가 독립된 감각기였다. 겹칠수록 어두워진다.',
    '양끝이 같은 기관이다. 어느 쪽이 입인지 묻는 것은 의미가 없다.',
    '결절 안에 미세한 공동이 있다. 소리를 냈던 것으로 보인다.',
    '섬유 하나하나가 따로 살아 있었다. 다발은 군집이었다.',
    '눌린 자국은 안쪽에서 생겼다. 무언가 안에서 자랐다.',
    '겹마다 다른 조직이다. 스물두 번 다시 만들어진 몸이다.',
    '한 쌍이 아니었다. 원래 이것 하나뿐이었다.',
    '비어 있는 것이 기능이었다. 무엇을 담았는지는 알 수 없다.',
  ];
  function subjectModel(root, seed = 0) {
    const g = group(root, [0, 0, 0]),
      tone = ['#8d9fa6', '#a09a8c', '#95a39a', '#a89aa0'][seed % 4],
      dark = '#3a423f';
    mesh(g, 'cylinder', [0, 0.58, 0], [0.33, 1.16, 0.27], tone);
    mesh(g, 'lowSphere', [0, 1.3, 0], [0.29, 0.35, 0.27], tone);
    mesh(g, 'box', [0, 1.3, 0.2], [0.34, 0.06, 0.12], dark);
    for (const sd of [-1, 1]) {
      const a = mesh(g, 'cylinder', [sd * 0.3, 0.78, 0.04], [0.095, 0.8, 0.095], tone);
      a.r[2] = -sd * 0.19;
      a.r[0] = -0.12;
    }
    mesh(g, 'cylinder', [0, 0.06, 0], [0.42, 0.12, 0.42], dark);
    return g;
  }
  K.RelicName = RELIC_NAME;
  K.RelicNote = RELIC_NOTE;
  K.RelicTrue = RELIC_TRUE;
  K.Models = { C, head, destroyerModel, cockpit, planetBody, relicModel, subjectModel };
  K.releaseSurvivors = function (game) {
    const u = game.universe,
      planet = game.planet;
    if (!u.freeing || !u.hold.length || !planet || typeof planet.height !== 'function') return;
    if (planet.living) {
      game.ui.toast('내려놓을 수 없습니다', '이곳은 땅이 아닙니다. 화물칸은 그대로입니다.', 6);
      return;
    }
    const ids = u.takeHold();
    if (planet.residents) {
      planet.residents.release(ids);
      game.ui.toast(
        ids.length + '명을 내려놓았습니다',
        (ids.every(p => p.from === planet.id) ? '고향입니다.' : '이곳은 그들의 고향이 아닙니다.') + ' 화물칸이 비었습니다.',
        7,
      );
      return;
    }
    ids.forEach((person, i) => {
      const a = (i / ids.length) * Math.PI * 2,
        r = 11 + (i % 4) * 3.5;
      const x = Math.sin(a) * r,
        z = Math.cos(a) * r,
        y = planet.height(x, z);
      const node = group(planet.root, [x, y, z]);
      K.residentFigure(node, person.species, person.pal, null, person.scale);
      node.r[1] = Math.atan2(-x, -z);
      planet.creatures.push({
        id: 'freed-' + i, passenger: person,
        kind: 'creature',
        node,
        p: [x, y + 1.4, z],
        home: [x, z],
        velocity: [0, 0, 0],
        alive: true,
        radius: 1.8,
        panic: 0,
        seed: i * 3.71,
        thrown: false,
        hover: 1.4,
        beg: false,
        freed: true,
      });
    });
    game.ui.toast(
      ids.length + '명을 내려놓았습니다',
      (ids.every(p => p.from === planet.id) ? '고향입니다.' : '이곳은 그들의 고향이 아닙니다.') + ' 화물칸이 비었습니다.',
      7,
    );
  };
})((window.KO ||= {}));

// FILE: src/worlds/orbital-weapons.js
/* Mothership planet-killer. Bounded transient FX; permanent scars belong to Universe.
 * Five confirmed impacts destroy a planet. Mouse/touch must remain held to launch.
 */
(function (K) {
  'use strict';
  const { M, mesh, group } = K;
  function waveGeometry() {
    const p = [],
      n = [],
      idx = [],
      N = 96,
      S = 5;
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= S; j++) {
        const a = (i / N) * Math.PI * 2,
          b = (j / S) * Math.PI * 2,
          r = 1 + 0.008 * Math.cos(b);
        p.push(r * Math.sin(a), 0.008 * Math.sin(b), r * Math.cos(a));
        n.push(Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a));
      }
    for (let i = 0; i < N; i++)
      for (let j = 0; j < S; j++) {
        const a = i * (S + 1) + j,
          b = a + S + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    return { p, n, idx };
  }
  function shardGeometry(col, row) {
    const p = [],
      n = [],
      idx = [],
      cols = 8,
      rows = 4,
      sub = 3;
    const point = (u, v) => [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)];
    const u0 = (col / cols) * Math.PI * 2,
      u1 = ((col + 1) / cols) * Math.PI * 2;
    const v0 = (row / rows) * Math.PI,
      v1 = ((row + 1) / rows) * Math.PI;
    const center = point((u0 + u1) * 0.5, (v0 + v1) * 0.5).map(x => x * 0.91);
    for (let side = 0; side < 2; side++)
      for (let j = 0; j <= sub; j++)
        for (let i = 0; i <= sub; i++) {
          const q = point(M.lerp(u0, u1, i / sub), M.lerp(v0, v1, j / sub)),
            rad = side ? 0.72 : 1;
          p.push(...q.map((x, k) => x * rad - center[k]));
          n.push(...q.map(x => (side ? -x : x)));
        }
    const count = (sub + 1) ** 2;
    for (let side = 0; side < 2; side++)
      for (let j = 0; j < sub; j++)
        for (let i = 0; i < sub; i++) {
          const a = side * count + j * (sub + 1) + i,
            b = a + sub + 1;
          if (side) idx.push(a, a + 1, b, b, a + 1, b + 1);
          else idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    // Side walls keep the separated crust from looking like paper.
    const edges = [];
    for (let i = 0; i < sub; i++) {
      edges.push(
        [i, i + 1],
        [sub * (sub + 1) + i, sub * (sub + 1) + i + 1],
        [i * (sub + 1), (i + 1) * (sub + 1)],
        [i * (sub + 1) + sub, (i + 1) * (sub + 1) + sub],
      );
    }
    for (const [a, b] of edges) idx.push(a, b, a + count, b, b + count, a + count);
    return { geometry: { p, n, idx }, center };
  }
  class OrbitalWeapons {
    constructor(space) {
      this.space = space;
      this.game = space.game;
      this.root = group(space.root);
      this.missiles = [];
      this.bursts = [];
      this.charge = 0;
      this.chargeId = null;
      this.finalGate = new Map();
      this.cooldown = 0;
      this.lastSide = -1;
      this.shake = 0;
      this.lock = null;
      this.maxRange = 24000;
      this.fragmentsReady = false;
      this.shardDefs = [];
    }
    reset() {
      this.finalGate.clear();
      this.root.children.length = 0;
      this.missiles.length = 0;
      this.bursts.length = 0;
      this.charge = 0;
      this.chargeId = null;
      this.cooldown = 0;
      this.shake = 0;
      this.lock = null;
    }
    ensureFragments() {
      if (this.fragmentsReady) return;
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 8; col++) {
          const def = shardGeometry(col, row),
            name = 'orbit-shard-' + row + '-' + col;
          if (!this.game.engine.geometries[name]) this.game.engine.addGeometry(name, def.geometry);
          this.shardDefs.push({ name, center: def.center });
        }
      this.fragmentsReady = true;
    }
    inFlight(id) {
      return this.missiles.some(m => m.def.id === id);
    }
    readiness() {
      const s = this.space,
        u = this.game.universe,
        def = s.aimedPlanet();
      this.lock = def;
      if (s.warp || M.len(s.velocity) > 1500) return { ok: false, message: '도약을 멈추면 무장이 연결됩니다.' };
      if (!def) return { ok: false, message: '행성을 바라보고 미사일을 길게 누르세요.' };
      if (u.destroyed(def.id)) return { ok: false, message: '이미 소멸한 행성입니다.' };
      const d = M.dist(s.position, def.position) - def.radius;
      if (d > this.maxRange) return { ok: false, message: '미사일 사거리 밖 · 포격 궤도로 접근하세요.' };
      if (d < def.radius * 0.45 + 120)
        return { ok: false, message: '너무 가깝습니다 · S로 물러나거나 성도에서 포격 궤도를 선택하세요.' };
      if (def.living) return { ok: true, def, message: def.name + ' · 탄두 조준' };
      const hits = u.hits(def.id), committed = hits + this.missiles.filter(m => m.def.id === def.id).length;
      if (committed >= 5) return { ok: false, message: '최종 탄두 비행 중' };
      if (committed === 4 && hits < 4) return { ok: false, message: '네 번째 탄두 비행 중' };
      return { ok: true, def, message: u.hits(def.id) >= 4 ? '다음 명중으로 행성 소멸' : def.name + ' · 탄두 조준' };
    }
    update(dt, input, active) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.shake = M.damp(this.shake, 0, 3, dt);
      const ready = active ? this.readiness() : { ok: false };
      if (ready.ok && !ready.def.living && input.fire &&
          this.finalGate.has(ready.def.id) && this.finalGate.get(ready.def.id) === input.fireGesture) {
        ready.ok = false;
        ready.message = '최종 탄두 · 손을 뗀 뒤 다시 눌러 발사';
      }
      if (active && input.fire && ready.ok && this.cooldown <= 0) {
        if (this.chargeId !== ready.def.id) {
          this.chargeId = ready.def.id;
          this.charge = 0;
        }
        this.charge += dt;
        const duration = this.game.universe.hits(ready.def.id) >= 4 ? 1.15 : 0.8;
        if (this.charge >= duration) {
          this.fire(ready.def);
          this.charge = 0;
          this.cooldown = 1.05;
        }
      } else {
        this.charge = 0;
        this.chargeId = null;
      }
      for (let i = this.missiles.length - 1; i >= 0; i--) {
        const m = this.missiles[i];
        m.t += dt;
        if (this.game.universe.destroyed(m.def.id)) {
          this.root.remove(m.node);
          this.missiles.splice(i, 1);
          continue;
        }
        const dest = M.add(m.def.position, M.mul(m.normal, m.def.radius * 0.99));
        const to = M.sub(dest, m.p),
          distance = M.len(to),
          dir = M.norm(to);
        const step = m.speed * dt * (0.27 + Math.min(1, m.t * 0.9));
        if (distance < step + 3) {
          this.root.remove(m.node);
          this.missiles.splice(i, 1);
          this.impact(m.def, m.normal);
          continue;
        }
        m.p = M.add(m.p, M.mul(dir, step));
        m.node.p = this.space.renderPoint(m.p);
        const aim = M.aim(m.p, dest);
        m.node.r = [aim.pitch, aim.yaw, 0];
        const scale = this.space.renderScale(m.p);
        m.node.s = [scale, scale, scale];
        m.tail.s[1] = 10 + Math.min(m.t, 1) * 22;
        m.tail.alpha = 0.62 + Math.sin(m.t * 54) * 0.12;
      }
      for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i];
        b.t += dt;
        const t = b.t,
          R = b.def.radius;
        if (t > b.life) {
          this.root.remove(b.node);
          this.bursts.splice(i, 1);
          continue;
        }
        b.node.p = this.space.renderPoint(b.def.position);
        const scale = this.space.renderScale(b.def.position);
        b.node.s = [scale, scale, scale];
        if (b.final) {
          const split = Math.max(0, t - 0.42),
            fade = 1 - M.smooth(6, b.life, t);
          for (const f of b.fragments) {
            f.node.visible = split > 0;
            f.node.p = M.add(M.mul(f.center, R), M.mul(f.velocity, split));
            f.node.r = M.mul(f.spin, split);
            f.node.alpha = fade;
          }
          b.core.s = [1, 1, 1].map(() => R * (t < 0.43 ? 1.7 + t * 0.3 : Math.max(0.02, 2.25 - (t - 0.43) * 1.3)));
          b.core.alpha = Math.max(0, 1 - t / 2.5);
          b.core.em = 3;
          const waveR = R * (1.2 + split * 3.2);
          b.wave.s = [waveR, waveR, waveR];
          b.wave.alpha = Math.max(0, 0.48 - split * 0.12);
          const wave2R = R * (1.15 + split * 2.3);
          b.wave2.s = [wave2R, wave2R, wave2R];
          b.wave2.alpha = Math.max(0, 0.23 - split * 0.055);
        } else {
          const size = R * (0.045 + t * 0.6);
          b.core.s = [size, size, size];
          b.core.alpha = Math.max(0, 0.9 - t / 1.3);
          b.core.p = M.mul(b.normal, R * 1.015);
          const r = R * (0.08 + t * 0.63);
          b.wave.s = [r, r, r];
          b.wave.alpha = Math.max(0, 0.65 - t * 0.39);
        }
      }
      if (active) {
        const d = ready.def || this.lock;
        let text = this.game.canDeploy() && !input.fire ? '창공 정박 · 파괴정 출격 가능' : ready.message || '';
        if (this.charge > 0)
          text = d.living
            ? '탄두 장전'
            : (this.game.universe.hits(d.id) >= 4 ? '최종 탄두 장전 · ' : '탄두 장전 · ') +
              (this.game.universe.hasTrophy(d.id) ? '보관한 왕관은 남습니다' : '파괴하면 왕 회수 불가');
        else if (ready.ok && this.cooldown > 0) text = '다음 탄두 준비 중';
        this.game.ui.context(
          text,
          ready.ok,
          this.charge > 0 ? this.charge / (this.game.universe.hits(d.id) >= 4 ? 1.15 : 0.8) : -1,
        );
      }
    }
    fire(def) {
      // Only update() is bound to player input; this method remains deterministic for tests.
      if (this.game.universe.destroyed(def.id)) return false;
      this.lastSide *= -1;
      const s = this.space,
        forward = M.dir(s.yaw, s.pitch),
        right = M.right(s.yaw);
      const p = M.add(s.position, M.add(M.mul(forward, 9), M.mul(right, this.lastSide * 5)));
      const normal = M.norm(M.sub(s.position, def.position)),
        distance = M.dist(p, def.position) - def.radius;
      const node = group(this.root),
        hull = mesh(node, 'cylinder', [0, 0, 0], [1.2, 4.5, 1.2], '#bbc9cb');
      hull.r[0] = Math.PI / 2;
      const nose = mesh(node, 'cone', [0, 0, -3], [1.4, 2, 1.4], '#9adfee', { em: 0.4 });
      nose.r[0] = -Math.PI / 2;
      const tail = mesh(node, 'cone', [0, 0, 9], [2.7, 18, 2.7], '#85dcf1', { type: 1, em: 2, alpha: 0.8 });
      tail.r[0] = Math.PI / 2;
      this.missiles.push({ def, p, node, tail, normal, speed: Math.max(850, distance * 0.8), t: 0 });
      this.shake = 0.16;
      this.game.audio.noiseHit(0.22, 0.1, 1300);
      this.game.audio.tone(110, 0.27, 0.1, 36);
      return true;
    }
    impact(def, normal) {
      this.space.save();
      const u = this.game.universe;
      if (def.living) {
        // It does not break. It opens, flinches, and keeps the wound.
        K.Living?.wound(this.game, def, this.space.objectNormal(def, normal));
        this.createBurst(def, normal, false, true);
        this.shake = 0.35;
        const body = this.space.visuals.get(def.id);
        if (body) body.flinch = 1;
        if (this.game.mode !== 'planet') this.game.audio.impact(0.6);
        this.space.refreshTimer = 0;
        return;
      }
      if (!u.hit(def.id)) return;
      if (u.hits(def.id) === 4 && this.game.input.fire)
        this.finalGate.set(def.id, this.game.input.fireGesture);
      const final = u.destroyed(def.id);
      this.createBurst(def, normal, final);
      this.shake = final ? 1 : 0.35;
      // Diegetic hull/weapon feedback, not a continuous soundtrack in the vacuum.
      if (this.game.mode !== 'planet') {
        this.game.audio.impact(final ? 1.8 : 0.6);
        if (final) this.game.audio.tone(45, 1.4, 0.15, 23);
      }
      if (final) {
        if (this.space.target.id === def.id) {
          this.space.auto = false;
          this.space.velocity = [0, 0, 0];
        }
        this.game.ui.toast(
          u.displayName(def.id) + ' · 행성 소멸',
          u.hasTrophy(def.id)
            ? '왕관은 전시 복도에 남아 있습니다.'
            : '전시 복도에 빈 자리가 하나 생겼다. 잔해에서라도 무언가 건져야 한다.',
          7,
        );
      } else {
        const n = u.hits(def.id),
          people = u.inhabited(def.id),
          known = people && u.scan(def.id) >= 4,
          name = u.displayName(def.id);
        const STAGE = [
          ['대기권 관통', '구름 띠가 찢어졌습니다.'],
          people
            ? ['지표 타격', known ? '밤면의 불빛 일부가 꺼졌습니다.' : '밤면을 돌아보면 무엇이 꺼졌는지 보입니다.']
            : ['지표 타격', '지표에 충돌구가 생겼습니다.'],
          ['지각 붕괴', '맨틀이 노출되어 균열이 빛나기 시작했습니다.'],
          ['자전 붕괴', '자전축이 흔들리고 고리가 무너집니다. 한 번 더 명중하면 소멸합니다.'],
        ][Math.min(3, n - 1)];
        const signal = known ? ' 생존 신호 ' + u.survivors(def.id).toLocaleString('ko-KR') : '';
        this.game.ui.toast(name + ' · ' + STAGE[0], STAGE[1] + signal, known ? 4.5 : 3);
      }
      this.space.refreshTimer = 0;
    }
    createBurst(def, normal, final, flesh = false) {
      if (!this.game.engine.geometries['orbit-wave']) this.game.engine.addGeometry('orbit-wave', waveGeometry());
      const node = group(this.root),
        core = mesh(node, 'sphere', [0, 0, 0], [1, 1, 1], flesh ? '#ff5a4e' : '#ffe5ba', { type: 1, em: 2, alpha: 0.9 });
      const wave = mesh(
        node,
        'orbit-wave',
        final ? [0, 0, 0] : M.mul(normal, def.radius * 1.015),
        [1, 1, 1],
        flesh ? '#c23a4b' : '#f6bf87',
        { type: 1, em: 1, alpha: 0.8 },
      );
      // Align a ring's normal to the observer-facing point of impact.
      wave.r = [Math.acos(M.clamp(normal[1], -1, 1)), Math.atan2(normal[0], normal[2]), 0];
      const b = { def, node, normal, core, wave, fragments: [], t: 0, final, life: final ? 10 : 1.8 };
      if (final) {
        this.ensureFragments();
        const rng = M.rand(def.index * 341 + 91);
        b.wave2 = mesh(node, 'orbit-wave', [0, 0, 0], [1, 1, 1], '#afdbeb', { type: 1, em: 1.5, alpha: 0.4 });
        b.wave2.r = [0.6, 0.4, 0.8];
        for (const q of this.shardDefs) {
          const shade = M.hex(def.color).map(x => x * (0.38 + rng() * 0.27));
          const f = mesh(node, q.name, M.mul(q.center, def.radius), [def.radius, def.radius, def.radius], shade);
          f.visible = false;
          const dir = M.norm(M.add(q.center, [(rng() - 0.5) * 0.2, (rng() - 0.5) * 0.2, (rng() - 0.5) * 0.2]));
          b.fragments.push({
            node: f,
            center: q.center,
            velocity: M.mul(dir, def.radius * (0.45 + rng() * 0.55)),
            spin: [(rng() - 0.5) * 0.23, (rng() - 0.5) * 0.23, (rng() - 0.5) * 0.23],
          });
        }
      }
      this.bursts.push(b);
      // No unbounded debris pile even while destroying many worlds in one session.
      while (this.bursts.length > 3) {
        const old = this.bursts.shift();
        this.root.remove(old.node);
      }
    }
  }
  K.OrbitalWeapons = OrbitalWeapons;
})((window.KO ||= {}));

// FILE: src/worlds/space.js
/* Flight in a large, persistent catalogue. All GPU coordinates are camera-relative.
 * Far bodies use angularly equivalent proxies; gameplay and saves use Number world coordinates.
 */
(function (K) {
  'use strict';
  const { mesh, group, M } = K;
  class Space {
    constructor(game) {
      this.game = game;
      this.universe = game.universe;
      this.root = new K.Node();
      this.worldRoot = group(this.root);
      this.position = game.save.data.space.p.slice();
      this.yaw = game.save.data.space.yaw;
      this.pitch = game.save.data.space.pitch;
      this.velocity = [0, 0, 0];
      this.auto = false;
      this.warp = false;
      this.warpAmount = 0;
      this.holdAltitude = 22;
      this.deployAltitude = 34;
      this.minimumAltitude = 14;
      this.wasInSky = false;
      this.visuals = new Map();
      this.refreshTimer = 0;
      this.nearestDef = this.target;
      this.nearestAltitude = Infinity;
      this.starNodes = [];
      this.asteroids = [];
      this.obstacleToast = -100;
      this.navObstacle = null;
      this.scanHold = 0;
      this.scanOn = null;
      for (const sys of this.universe.systems) {
        const node = group(this.worldRoot),
          star = mesh(node, 'sphere', [0, 0, 0], [1, 1, 1], sys.starColor, { type: 1, em: 1.6 });
        const glow = mesh(node, 'sphere', [0, 0, 0], [1, 1, 1], sys.starColor, { type: 4, alpha: 0.15 });
        this.starNodes.push({ sys, node, star, glow });
      }
      this.weapons = new K.OrbitalWeapons(this);
      this.makeCockpit();
      this.findNearest(false);
      this.refreshVisuals();
      this.syncVisuals(0);
    }
    get target() {
      return this.universe.selected;
    }
    get planetPosition() {
      return this.target.position;
    }
    get radius() {
      return this.target.radius;
    }
    get body() {
      return this.visuals.get(this.target.id);
    }
    distance(def = this.target) {
      return Math.max(0, M.dist(this.position, def.position) - def.radius);
    }
    atmosphere() {
      return this.nearestDef && !this.universe.destroyed(this.nearestDef.id)
        ? 1 - M.smooth(26, 160, this.distance(this.nearestDef))
        : 0;
    }
    renderScale(p) {
      return Math.min(1, 11000 / Math.max(M.dist(p, this.position), 1));
    }
    renderPoint(p) {
      return M.mul(M.sub(p, this.position), this.renderScale(p));
    }
    makeCockpit() {
      this.cockpit = new K.Node();
      const C = K.Models.C;
      mesh(this.cockpit, 'box', [0, -1.35, -1.6], [5, 0.6, 2.2], C.dark);
      for (const s of [-1, 1]) {
        const n = mesh(this.cockpit, 'box', [s * 1.86, 0, -1.38], [0.15, 3.3, 0.25], C.hull);
        n.r[2] = s * 0.23;
        mesh(this.cockpit, 'box', [s * 1.45, -1.02, -1.8], [1, 0.08, 0.6], C.panel);
        mesh(this.cockpit, 'box', [s * 1.45, -0.971, -1.8], [0.72, 0.012, 0.37], '#366573', { em: 0.2 });
        mesh(this.cockpit, 'box', [s * 1.85, 0.25, -1.25], [0.022, 1.3, 0.027], C.edge);
        const tube = mesh(this.cockpit, 'cylinder', [s * 2.1, -0.76, -2.9], [0.37, 1.5, 0.37], C.panel);
        tube.r[0] = Math.PI / 2;
        mesh(this.cockpit, 'torus', [s * 2.1, -0.76, -3.64], [0.28, 0.28, 0.28], C.amber, { em: 0.7 }).r[0] =
          Math.PI / 2;
      }
      mesh(this.cockpit, 'box', [0, 1.48, -1.3], [4.7, 0.12, 0.25], C.hull);
      mesh(this.cockpit, 'box', [0, -0.97, -1.52], [0.55, 0.022, 0.13], C.amber, { em: 0.8 });
    }
    findNearest(trackDiscovery = true) {
      let closest = null,
        d = Infinity;
      let anyDef = null,
        anyD = Infinity;
      for (const def of this.universe.planets) {
        const q = M.dist(this.position, def.position) - def.radius;
        if (q < anyD) {
          anyD = q;
          anyDef = def;
        }
        if (this.universe.destroyed(def.id)) continue;
        if (q < d) {
          d = q;
          closest = def;
        }
      }
      this.scanDef = anyDef;
      this.scanAltitude = Math.max(0, anyD);
      this.nearestDef = closest;
      this.nearestAltitude = Math.max(0, d);
      if (trackDiscovery && closest && d < closest.radius * 5 + 1500) this.universe.markSeen(closest.id);
    }
    makeVisual(def) {
      const body = K.Models.planetBody(this.worldRoot, [0, 0, 0], def.radius);
      body.def = def;
      body.globe.type = def.shader;
      body.globe.em = def.heaven ? (this.universe.hasTrophy(def.id) ? 0 : 1) : def.hell ? (this.universe.hasTrophy(def.id) ? 0.45 : 1) : this.universe.inhabited(def.id) ? 1 : 0; // night-side city lights only where people live
      body.base = def.radius * 2;
      body.flinch = 0;
      body.globe.color = M.hex(def.color);
      body.globe.seed = def.seed;
      body.globe.r = [def.tilt[0], def.tilt[1], def.tilt[2]];
      body.ring.r = def.tilt.slice();
      body.ring.color = M.hex(def.color).map(x => x * 0.65 + 0.25);
      body.atmosphere.color = M.hex(def.air);
      body.core = mesh(
        body.group,
        'sphere',
        [0, 0, 0],
        [def.radius * 1.72, def.radius * 1.72, def.radius * 1.72],
        '#e87331',
        { em: 1.1, type: 1 },
      );
      body.core.visible = false;
      body.ruins = null;
      this.visuals.set(def.id, body);
      return body;
    }
    makeRuins(body) {
      const R = body.def.radius,
        rng = M.rand(body.def.index * 1879 + 11),
        g = group(body.group);
      for (let i = 0; i < 27; i++) {
        const a = (i / 27) * Math.PI * 2 + rng() * 0.3,
          r = R * (0.55 + rng() * 1.65),
          size = R * (0.055 + rng() * 0.17);
        const n = mesh(
          g,
          'lowSphere',
          [Math.cos(a) * r, (rng() - 0.5) * R * 0.63, Math.sin(a) * r],
          [size, size * (0.65 + rng()), size * (0.55 + rng())],
          i % 6 === 0 ? '#9b643c' : '#42464e',
          { em: i % 6 === 0 ? 0.15 : 0 },
        );
        n.r = [rng() * 5, rng() * 5, rng() * 5];
      }
      g.r = [0.35, 0.4, 0.2];
      body.ruins = g;
    }
    refreshVisuals() {
      const candidates = this.universe.planets.map(def => ({ def, d: M.dist(this.position, def.position) }));
      candidates.sort((a, b) => a.d - b.d);
      const keep = new Set(candidates.slice(0, this.game.settings.quality === 'low' ? 18 : 32).map(x => x.def.id));
      keep.add(this.target.id);
      for (const b of this.weapons.bursts) keep.add(b.def.id);
      for (const m of this.weapons.missiles) keep.add(m.def.id);
      for (const [id, b] of this.visuals)
        if (!keep.has(id)) {
          this.worldRoot.remove(b.group);
          this.visuals.delete(id);
        }
      for (const id of keep) if (!this.visuals.has(id)) this.makeVisual(this.universe.get(id));
    }
    fadeBody(body) {
      const a = 1 - this.atmosphere(),
        h = this.universe.hits(body.def.id);
      body.globe.alpha = a * a;
      body.ring.alpha = 0.65 * a * a * Math.max(0, 1 - h * 0.27);
      body.atmosphere.alpha = 0.17 * a * Math.max(0, 1 - h * 0.33);
    }
    // World direction from a planet's centre → the same point on its (rotating, tilted) globe.
    objectNormal(def, n) {
      const r = this.visuals.get(def.id)?.globe.r || def.tilt,
        m = M.compose([0, 0, 0], r);
      return M.norm([
        m[0] * n[0] + m[1] * n[1] + m[2] * n[2],
        m[4] * n[0] + m[5] * n[1] + m[6] * n[2],
        m[8] * n[0] + m[9] * n[1] + m[10] * n[2],
      ]);
    }
    syncVisuals(dt) {
      const outside = 1 - this.atmosphere();
      this.clock = (this.clock || 0) + dt;
      const engine = this.game.engine;
      let living = false;
      for (const body of this.visuals.values()) {
        const def = body.def,
          dist = M.dist(this.position, def.position),
          scale = this.renderScale(def.position);
        body.group.p = this.renderPoint(def.position);
        body.group.s = [scale, scale, scale];
        body.group.visible = outside > 0.001;
        const destroyed = this.universe.destroyed(def.id),
          burst = this.weapons.bursts.find(b => b.final && b.def.id === def.id);
        const ruptured = destroyed && (!burst || burst.t > 0.42);
        body.globe.visible = !ruptured;
        body.globe.geo = dist < def.radius * 14 && this.game.settings.quality !== 'low' ? 'planet' : 'sphere';
        const hh = this.universe.hits(def.id),
          wob = hh >= 4 ? 1 : 0;
        body.globe.r[1] += dt * 0.006;
        body.globe.detail = def.living ? 0 : hh / 5;
        if (def.living) {
          // It breathes, and flinches when struck. Its wounds stay where they were opened.
          living = true;
          body.flinch = Math.max(0, (body.flinch || 0) - dt * 0.7);
          const k = body.base * (1 + Math.sin(this.clock * 0.84) * 0.012 - body.flinch * body.flinch * 0.06);
          body.globe.s = [k, k, k];
          engine.life[0] = this.clock * 0.84;
          engine.life[1] = this.clock * (0.93 + body.flinch * 0.9);
          engine.wounds.fill(0);
          const list = K.Living?.normals(this.game.save, def.id) || [];
          list.slice(-12).forEach((w, i) => engine.wounds.set([w[0], w[1], w[2], 0.075 + ((i * 37) % 10) * 0.004], i * 4));
        }
        if (def.heaven) {
          // its light is its own until the head on the throne is taken
          const dark = this.universe.hasTrophy(def.id);
          body.globe.em = M.damp(body.globe.em, dark ? 0 : 1, 0.8, dt);
          body.atmosphere.color = dark ? [0.32, 0.33, 0.4] : M.hex(def.air);
          if (K.Heaven && K.SurfaceAtmospheres) K.SurfaceAtmospheres[def.id] = dark ? K.Heaven.night : K.Heaven.day;
        }
        body.globe.r[0] = def.tilt[0] + Math.sin(this.clock * 2.3) * 0.07 * wob;
        body.globe.r[2] = def.tilt[2] + Math.cos(this.clock * 1.73) * 0.06 * wob;
        body.ring.r[0] = def.tilt[0] + Math.sin(this.clock * 1.1) * 0.13 * wob;
        body.ring.visible = !ruptured && def.rings;
        body.atmosphere.visible = !ruptured;
        body.core.visible = !ruptured && this.universe.hits(def.id) >= 3;
        body.core.alpha = outside;
        if (ruptured && !body.ruins) this.makeRuins(body);
        if (body.ruins) {
          body.ruins.visible = ruptured && (!burst || burst.t > 4);
          body.ruins.r[1] += dt * 0.007;
        }
        this.fadeBody(body);
      }
      for (const { sys, node, star, glow } of this.starNodes) {
        const scale = this.renderScale(sys.position),
          r = sys.starRadius;
        node.p = this.renderPoint(sys.position);
        node.s = [scale, scale, scale];
        node.visible = outside > 0.001;
        star.s = [r * 2, r * 2, r * 2];
        star.alpha = outside;
        glow.s = [r * 3.5, r * 3.5, r * 3.5];
        glow.alpha = outside * 0.13;
      }
      // no living world in view: nothing left breathing in the shared shader values
      if (!living && this.game.mode !== 'planet') {
        engine.life.fill(0);
        engine.wounds.fill(0);
      }
    }
    applyEnvironment(interior = false) {
      const e = this.game.engine,
        b = this.atmosphere();
      K.applySkyPalette(e, K.SurfaceAtmospheres?.[this.nearestDef?.id] || {});
      e.atmosphere = b;
      e.skyBasis = interior ? M.compose([0, 0, 0], [this.pitch, this.yaw, 0]) : null;
      e.skyOffset = [(this.position[0] * 0.0008) % 10000, 0, (this.position[2] * 0.0008) % 10000];
      e.surface = 0;
      e.fogD = 0;
      e.ambient = interior ? 0.37 + b * 0.08 : 0.32 + b * 0.23;
      e.warp = this.warpAmount;
      e.impact = this.weapons.shake * 0.5;
    }
    aimedPlanet() {
      const direction = M.dir(this.yaw, this.pitch);
      let best = null,
        score = Infinity;
      for (const def of this.universe.planets) {
        const to = M.sub(def.position, this.position),
          dist = M.len(to),
          cos = M.dot(M.norm(to), direction);
        if (cos <= 0) continue;
        const angle = Math.acos(M.clamp(cos, -1, 1));
        const tolerance = Math.asin(Math.min(0.99, def.radius / Math.max(1, dist))) + 0.026;
        if (angle < tolerance) {
          const s = angle / Math.max(0.015, tolerance) + dist / 1e8;
          if (s < score) {
            score = s;
            best = def;
          }
        }
      }
      return best;
    }
    select(id, mode) {
      if (!this.universe.select(id, mode)) return;
      this.auto = false;
      this.warp = false;
      this.weapons.charge = 0;
      this.refreshTimer = 0;
      this.game.persist?.('checkpoint');
    }
    toggleAuto(mode) {
      if (this.auto && !mode) {
        this.auto = false;
        this.warp = false;
        this.game.ui.toast('자동항해 해제');
        return;
      }
      this.arrivalAxes = null;
      if (mode) this.universe.select(this.target.id, mode);
      this.auto = true;
      this.warp = false;
      this.navObstacle = null;
      this.game.ui.toast(
        this.target.name + ' · 자동항해',
        this.universe.destroyed(this.target.id)
          ? '사라진 행성의 잔해 지대로 향합니다.'
          : this.universe.navMode === 'orbit'
            ? '미사일을 쏠 수 있는 궤도에서 정박합니다.'
            : '구름층까지 접근합니다. 자리에서 일어나도 항해는 계속됩니다.',
        4,
      );
    }
    toggleWarp() {
      if (this.warp) {
        this.warp = false;
        this.velocity = M.mul(M.norm(this.velocity), Math.min(330, M.len(this.velocity)));
        this.game.ui.toast('도약 해제', '일반 추진으로 돌아왔습니다.');
        return;
      }
      if (this.nearestAltitude < 1900) {
        this.game.ui.toast(
          '행성에서 조금 더 멀어져야 합니다.',
          '가속해서 대기권을 벗어나거나 자동항해로 다음 행성을 선택하세요.',
        );
        return;
      }
      this.auto = false;
      this.warp = true;
      this.game.ui.toast('도약 항해', '바라보는 방향으로 계속 비행합니다. J 또는 도약 버튼으로 해제.', 4);
    }
    holdDistance() {
      return this.universe.destroyed(this.target.id)
        ? this.target.radius * 3
        : this.universe.navMode === 'orbit'
          ? this.target.radius * 3 + 360
          : this.holdAltitude;
    }
    flyAuto(dt) {
      const def = this.target,
        delta = M.sub(def.position, this.position),
        gap = this.distance() - this.holdDistance();
      let aimPoint = def.position;
      const departing = this.nearestDef && this.nearestDef.id !== def.id && this.nearestAltitude < 1400;
      if (departing) {
        const n = M.norm(M.sub(this.position, this.nearestDef.position));
        aimPoint = M.add(this.nearestDef.position, M.mul(n, this.nearestDef.radius + 2800));
      }
      // Avoid blocking worlds on the route, rather than tunnelling through them during warp.
      const direction = M.norm(delta),
        total = M.len(delta);
      for (const obstacle of departing ? [] : this.universe.planets) {
        if (obstacle.id === def.id || this.universe.destroyed(obstacle.id)) continue;
        const rel = M.sub(obstacle.position, this.position),
          along = M.dot(rel, direction),
          clearance = obstacle.radius + 180;
        if (along < 0 || along > Math.min(total, 30000) || M.len(M.sub(rel, M.mul(direction, along))) > clearance)
          continue;
        let side = M.cross(direction, [0, 1, 0]);
        if (M.len(side) < 0.1) side = [1, 0, 0];
        side = M.norm(side);
        aimPoint = M.add(obstacle.position, M.mul(side, clearance * 2.5));
        break;
      }
      const aim = M.aim(this.position, aimPoint),
        dir = M.norm(M.sub(aimPoint, this.position));
      this.yaw += M.angle(this.yaw, aim.yaw) * (1 - Math.exp(-1.7 * dt));
      this.pitch = M.damp(this.pitch, aim.pitch, 1.7, dt);
      const nearLimit = Math.max(210, (this.nearestAltitude - 800) * 1.3);
      const speed = M.clamp(gap * 0.95, -Math.min(2000, nearLimit), Math.min(650000, nearLimit));
      this.velocity = this.velocity.map((v, i) => M.damp(v, dir[i] * speed, 3.2, dt));
      if (Math.abs(gap) < 0.7 && M.len(this.velocity) < 1.1) {
        this.velocity = [0, 0, 0];
        this.auto = false;
        this.warp = false;
        const sky = this.universe.navMode === 'sky' && !this.universe.destroyed(def.id);
        this.game.ui.toast(
          def.name + (sky ? ' 상공에 정박했습니다.' : ' · 궤도 정박'),
          sky
            ? this.universe.surfaceReady(def.id)
              ? '파괴정 출격을 누르거나 격납고에서 탑승하세요.'
              : '이 행성의 표면은 아직 미개방입니다. 다른 곳으로 떠나거나 궤도에서 포격할 수 있습니다.'
            : '행성을 바라보고 미사일을 길게 누르세요. 쏘지 않고 지나쳐도 됩니다.',
          6,
        );
      }
    }
    move(dt) {
      const from = this.position,
        move = M.mul(this.velocity, dt),
        length = M.len(move);
      if (length < 1e-8) return;
      const direction = M.mul(move, 1 / length);
      let allowed = length,
        collision = null;
      for (const def of this.universe.planets) {
        if (this.universe.destroyed(def.id)) continue;
        const rel = M.sub(from, def.position),
          R = def.radius + this.minimumAltitude,
          b = M.dot(rel, direction),
          c = M.dot(rel, rel) - R * R;
        if (c < -0.01) {
          const normal = M.len(rel) > 0.01 ? M.norm(rel) : [0, 1, 0];
          this.position = M.add(def.position, M.mul(normal, R + 0.05));
          this.velocity = [0, 0, 0];
          return;
        }
        if (b >= 0) continue;
        const disc = b * b - c;
        if (disc < 0) continue;
        const t = -b - Math.sqrt(disc);
        if (t >= 0 && t < allowed) {
          allowed = Math.max(0, t - 0.05);
          collision = def;
        }
      }
      this.position = M.add(from, M.mul(direction, allowed));
      if (collision) {
        const normal = M.norm(M.sub(this.position, collision.position)),
          inward = M.dot(this.velocity, normal);
        if (inward < 0) this.velocity = M.sub(this.velocity, M.mul(normal, inward));
        this.warp = false;
        if (collision.id !== this.target.id) this.auto = false;
      }
    }
    scanTick(dt, background) {
      const u = this.universe,
        def = this.nearestDef;
      if (
        background ||
        !def ||
        this.warp ||
        this.auto ||
        u.scan(def.id) >= 5 ||
        this.nearestAltitude > def.radius * 6 + 900 ||
        M.len(this.velocity) > 45
      ) {
        this.scanHold = 0;
        this.scanOn = null;
        return;
      }
      if (this.scanOn !== def.id) {
        this.scanOn = def.id;
        this.scanHold = 0;
      }
      this.scanHold += dt;
      if (this.scanHold < 6.5) return;
      this.scanHold = 0;
      const n = u.advanceScan(def.id),
        line = u.scanLines(def.id)[n - 1];
      this.game.ui.toast((n >= 5 ? '정밀 스캔 완료 · ' : '정밀 스캔 ' + n + '/5 · ') + u.displayName(def.id), line, 5);
    }
    relicTick(dt, background) {
      const u = this.universe,
        def = this.scanDef;
      if (
        background ||
        !def ||
        this.warp ||
        this.auto ||
        !u.relicAvailable(def.id) ||
        this.scanAltitude > def.radius * 6 + 900 ||
        M.len(this.velocity) > 45
      ) {
        this.relicHold = 0;
        this.relicOn = null;
        return;
      }
      if (this.relicOn !== def.id) {
        this.relicOn = def.id;
        this.relicHold = 0;
      }
      this.relicHold += dt;
      if (this.relicHold < 8) return;
      this.relicHold = 0;
      if (!u.takeRelic(def.id)) return;
      this.relicOn = null;
      this.game.audio.success();
      this.game.ui.toast(
        '잔해에서 무언가를 건졌습니다',
        K.RelicName[u.relicForm(def.id)] + ' · 전시 복도에 자리를 만들었습니다.',
        6,
      );
    }
    relicLabel() {
      return this.relicOn && this.relicOn === this.scanDef?.id
        ? ' · 잔해 견인 ' + Math.min(99, Math.floor((this.relicHold / 8) * 100)) + '%'
        : '';
    }
    scanLabel() {
      return this.scanOn && this.scanOn === this.scanDef?.id
        ? ' · 정밀 스캔 ' + Math.min(99, Math.floor((this.scanHold / 6.5) * 100)) + '%'
        : '';
    }
    update(dt, input, background = false) {
      this.refreshTimer -= dt;
      if (this.refreshTimer <= 0) {
        this.findNearest();
        this.refreshVisuals();
        this.refreshTimer = 0.2;
      }
      if (!background) {
        const [dx, dy] = input.look();
        this.yaw -= dx;
        this.pitch = M.clamp(this.pitch - dy, -1.45, 1.45);
        this.yaw += (input.keys.has('ArrowLeft') ? dt : 0) - (input.keys.has('ArrowRight') ? dt : 0);
        if (input.take('KeyM')) {
          this.game.ui.navigation();
          return;
        }
        if (input.mobile && (dx || dy)) this.auto = false;
        if (input.take('KeyT')) { this.game.flightAction(); if (this.game.busy) return; }
        if (input.take('KeyJ')) this.toggleWarp();
        if (input.take('KeyQ')) {
          const def = this.aimedPlanet();
          if (def) {
            this.select(def.id);
            this.game.ui.toast(def.name + ' · 항로 선택', this.universe.label(def.id));
          } else this.game.ui.toast('바라보는 행성을 찾지 못했습니다.', 'M · 성도에서 목적지를 고를 수 있습니다.');
        }
        if (input.take('KeyE')) {
          this.game.interact();
          return;
        }
        if (input.take('KeyX')) {
          this.velocity = [0, 0, 0];
          this.auto = false;
          this.warp = false;
          this.game.ui.toast('추진 정지', '다시 고요.');
        }
      }
      let axes = background ? { x: 0, y: 0, z: 0, boost: false } : input.axes();
      if (this.arrivalAxes) {
        const held = this.arrivalAxes;
        if (Math.hypot(axes.x - held.x, axes.y - held.y, axes.z - held.z) < 0.35)
          axes = { x: 0, y: 0, z: 0, boost: false };
        else this.arrivalAxes = null;
      }
      if (!background && Math.abs(axes.x) + Math.abs(axes.y) + Math.abs(axes.z) > 0.05) this.auto = false;
      if (this.auto) this.flyAuto(dt);
      else if (this.warp) {
        const top = Math.min(650000, Math.max(330, (this.nearestAltitude - 800) * 1.3));
        const dir = M.dir(this.yaw, this.pitch);
        this.velocity = this.velocity.map((v, i) => M.damp(v, dir[i] * top, 1.4, dt));
        if (this.nearestAltitude < 1900) {
          this.warp = false;
          this.velocity = M.mul(M.norm(this.velocity), 330);
        }
        // Preserve compatibility with the cloud coordinate validator without an invisible wall.
        if (M.len(this.position) > 80000000) {
          this.warp = false;
          this.velocity = M.mul(M.norm(this.velocity), 330);
          this.game.ui.toast(
            '성도에서 멀리 벗어났습니다.',
            '일반 추진으로 전환했습니다. M · 항로를 다시 선택할 수 있습니다.',
          );
        }
      } else if (!background) {
        let force = M.add(M.mul(M.dir(this.yaw, this.pitch), axes.z), M.mul(M.right(this.yaw), axes.x));
        force[1] += axes.y;
        if (M.len(force) > 1) force = M.norm(force);
        const top = axes.boost ? 330 : 125;
        if (M.len(force) > 0.01) this.velocity = this.velocity.map((v, i) => M.damp(v, force[i] * top, 1.8, dt));
        else if (this.game.nearPlanet()) this.velocity = [0, 0, 0];
        else this.velocity = this.velocity.map(v => M.damp(v, 0, 0.07, dt));
      }
      this.move(dt);
      if (this.nearestDef) this.nearestAltitude = this.distance(this.nearestDef);
      const inSky = this.nearestAltitude <= this.deployAltitude && !this.universe.destroyed(this.nearestDef?.id);
      if (inSky && !this.wasInSky && !this.auto) {
        if (this.universe.surfaceReady(this.nearestDef.id)) {
          this.velocity = [0, 0, 0];
          this.warp = false;
          this.arrivalAxes = Math.hypot(axes.x, axes.y, axes.z) > 0.05 ? axes : null;
        }
        this.universe.select(this.nearestDef.id, 'sky');
        this.game.ui.toast(
          this.nearestDef.name + ' · 구름 위의 창공',
          this.universe.surfaceReady(this.nearestDef.id)
            ? '모선 정박 · 파괴정 출격 또는 격납고에서 탑승'
            : '표면은 아직 미개방입니다. 궤도 탐사와 모선 포격은 가능합니다.',
          5,
        );
      }
      this.wasInSky = inSky;
      this.scanTick(dt, background);
      this.relicTick(dt, background);
      this.warpAmount = M.damp(this.warpAmount, M.clamp((M.len(this.velocity) - 2000) / 90000, 0, 1), 2, dt);
      this.weapons.update(dt, input, !background);
      this.syncVisuals(dt);
      if (!background) {
        this.applyEnvironment(false);
        const shake = this.weapons.shake * this.game.settings.shake * 0.006;
        this.game.engine.camera = {
          p: [0, 0, 0],
          yaw: this.yaw + Math.sin(this.game.time * 69) * shake,
          pitch: this.pitch + Math.sin(this.game.time * 57) * shake,
          roll: 0,
          fov: 76 + this.warpAmount * 9,
        };
        const sys = this.universe.systems[this.target.systemIndex];
        this.game.ui.setArea(
          sys.name.toUpperCase() + ' · ' + sys.id.toUpperCase(),
          inSky
            ? this.nearestDef.name + ' · 창공'
            : this.auto
              ? this.target.name + '으로 항해'
              : this.warp
                ? '도약 항해'
                : '우주 항해',
        );
        this.game.ui.prompt('조종석에서 일어나기', true, '일어나기');
        const speed = M.len(this.velocity),
          text = speed >= 1000 ? (speed / 1000).toFixed(1) + ' km/s' : Math.round(speed) + ' m/s';
        this.game.ui.setStatus(
          (this.auto ? '자동항해 중' : this.warp ? '도약 항해' : inSky && speed < 1 ? '창공 정박' : '자유 항해') +
            this.scanLabel() +
            this.relicLabel() +
            (this.universe.cargo ? ' · 화물칸 ' + this.universe.cargo + '명' : ''),
          text,
        );
        this.game.currentInteract = { action: () => this.game.enterInterior('bridge') };
      }
    }
    restore() {
      this.universe.restore();
      this.position = this.game.save.data.space.p.slice();
      this.yaw = this.game.save.data.space.yaw;
      this.pitch = this.game.save.data.space.pitch;
      this.velocity = [0, 0, 0];
      this.auto = false;
      this.warp = false;
      this.warpAmount = 0;
      this.weapons.reset();
      // Clear visual remnants from the previous account before rebuilding from the new save.
      for (const b of this.visuals.values()) this.worldRoot.remove(b.group);
      this.visuals.clear();
      this.findNearest(false);
      this.refreshVisuals();
      this.syncVisuals(0);
      this.wasInSky = this.nearestAltitude <= this.deployAltitude;
    }
    save() {
      this.game.save.data.space = {
        p: this.position.map(x => Math.round(x * 100) / 100),
        yaw: this.yaw,
        pitch: this.pitch,
      };
    }
  }
  K.Space = Space;
})((window.KO ||= {}));

// FILE: src/worlds/interior.js
(function (K) {
  'use strict';
  const { mesh, group, M } = K,
    C = K.Models.C;
  class Interior {
    constructor(game) {
      this.game = game;
      this.root = new K.Node();
      this.interactables = [];
      this.solids = [];
      this.trophies = [];
      this.outside = group(this.root);
      this.outside.add(game.space.root);
      this.roomRoot = group(this.root);
      this.galleryRoot = null;
      this.galleryKey = null;
      this.aftLimit = 26.3;
      this.make();
      this.position = [0, 1.85, -5];
      this.yaw = 0;
      this.pitch = 0;
      this.walk = 0;
      this.zone = '조종실';
    }
    block(p, s, c = C.hull, props) {
      return mesh(this.roomRoot, 'box', p, s, c, props);
    }
    obstacle(min, max) {
      this.solids.push({ min, max });
    }
    light(p, s, col = C.light) {
      return this.block(p, s, col, { em: 1.2, type: 1 });
    }
    make() {
      // Central deck: bridge -> gallery -> hangar. Side windows are real openings.
      const r = this.roomRoot;
      this.block([0, -0.3, 2], [20, 0.6, 52], C.dark);
      this.block([0, 7, 2], [20, 0.5, 52], C.dark);
      for (let z = -22; z < 28; z += 2.6) {
        this.block([0, 0.008, z], [18, 0.025, 0.027], C.panel);
        for (let s of [-1, 1]) {
          this.light([s * 5.75, 0.018, z], [0.05, 0.03, 2.35], z > 10 ? C.amber : C.light);
        }
      }
      // Bridge's panoramic front glazing: no white occluding planes.
      this.block([0, 0.8, -23.2], [20, 1.6, 0.6]);
      this.block([0, 6.1, -23.2], [20, 2, 0.7]);
      for (let x of [-9.8, -5.3, 5.3, 9.8]) {
        this.block([x, 3.2, -23.2], [0.27, 5, 0.8]);
        this.light([x + 0.18, 3.3, -22.7], [0.035, 3.8, 0.035]);
      }
      for (let s of [-1, 1]) {
        this.block([s * 9.8, 0.95, 2], [0.4, 1.9, 52]);
        this.block([s * 9.8, 6.25, 2], [0.4, 1.5, 52]);
        for (let z = -21; z < 27; z += 6) {
          this.block([s * 9.8, 3.2, z], [0.55, 5.7, 0.4]);
          this.block([s * 8.7, 6.7, z], [2.8, 0.32, 0.6]);
        }
        this.light([s * 9.55, 1.92, -9], [0.045, 0.035, 24]);
      }
      // Arched structural ribs, high ceiling, amber wayfinding.
      for (let z of [-8, 8, 14, 25]) {
        for (let s of [-1, 1]) {
          this.block([s * 7.35, 2.6, z], [0.58, 5.3, 0.6]);
          const rib = this.block([s * 6.3, 5.64, z], [2.8, 0.52, 0.6]);
          rib.r[2] = s * -0.42;
          this.light([s * 7, 2.3, z + 0.34], [0.055, 3.7, 0.05], z >= 14 ? C.amber : C.light);
        }
        this.block([0, 6.18, z], [11.2, 0.43, 0.65]);
      }
      // Recessed bridge consoles and command chair.
      for (let s of [-1, 1]) {
        this.block([s * 4.8, 0.72, -17.6], [4.8, 1.42, 2.3]);
        const dash = this.block([s * 4.8, 1.46, -17.55], [4.8, 0.13, 2.5], C.panel);
        dash.r[0] = 0.1;
        for (let i = 0; i < 4; i++) {
          const screen = this.block(
            [s * 4.8 - 1.55 + i, 1.6, -17.7],
            [0.75, 0.018, 0.85],
            i === 2 ? '#c3945f' : '#2a5d66',
            { em: 0.3 },
          );
          screen.r[0] = 0.1;
          this.light([s * 4.8 - 1.7 + i, 1.64, -17.4], [0.06, 0.02, 0.2]);
        }
        this.obstacle([s * 4.8 - 2.5, -1, -18.85], [s * 4.8 + 2.5, 2.2, -16.35]);
      }
      const chair = group(r, [0, 0, -16.3]);
      mesh(chair, 'cylinder', [0, 0.3, 0], [1.3, 0.6, 1.3], C.panel);
      mesh(chair, 'box', [0, 0.82, 0], [1.5, 0.4, 1.8], C.dark);
      mesh(chair, 'box', [0, 1.65, 0.65], [1.6, 1.8, 0.5], C.panel).r[0] = 0.08;
      mesh(chair, 'box', [0, 1.72, 0.35], [1.3, 1.45, 0.12], '#364046');
      for (let s of [-1, 1]) {
        mesh(chair, 'box', [s * 0.9, 1.2, 0], [0.28, 0.25, 1.6], C.panel);
        mesh(chair, 'box', [s * 0.9, 1.34, -0.48], [0.16, 0.035, 0.18], C.light, { em: 0.7 });
      }
      this.obstacle([-1.05, -1, -17.5], [1.05, 3, -15.55]);
      this.interactables.push({
        id: 'pilot',
        room: '조종실',
        label: '조종석에 앉기',
        verb: '앉기',
        action: () => this.game.enterSpace(),
      });
      // 전시 복도는 회수한 만큼만 길어진다. 빈 자리를 미리 깔지 않는다.
      // Hangar floor, docking machinery and flyable two-armed skiff.
      this.block([0, 0.04, 20.6], [11, 0.08, 10.7], C.panel);
      for (let s of [-1, 1]) {
        this.light([s * 5.1, 0.096, 20.6], [0.055, 0.04, 9.9], C.amber);
        for (let z = 16.4; z < 25; z += 1.8) {
          const stripe = this.block([s * 5.6, 0.1, z], [0.6, 0.02, 0.4], C.gold);
          stripe.r[1] = 0.6;
        }
      }
      this.skiff = K.Models.destroyerModel(r, [0, 0.65, 21], 1);
      this.skiff.r[1] = Math.PI;
      this.obstacle([-3.5, -1, 17], [3.5, 4, 25.8]);
      this.interactables.push({
        id: 'launch',
        room: '격납고',
        label: '파괴정으로 갈아타기',
        verb: '탑승하기',
        action: () => this.game.launch(),
      });
      // the far wall is open the width of the archive behind it: what has been brought back is seen from here
      for (let s of [-1, 1]) {
        this.block([s * 8.2, 3.2, 27.5], [3.6, 6.4, 0.5]);
        this.block([s * 6.42, 2.95, 27.2], [0.07, 5.9, 0.07], C.edge);
        this.block([s * 7.4, 3.2, 27.16], [0.025, 5.8, 0.05], C.edge);
      }
      this.block([0, 6.35, 27.5], [12.9, 0.8, 0.5]);
      this.block([0, 6.3, 27.22], [4.2, 0.42, 0.06], C.edge);
      this.light([0, 5.86, 27.18], [12.6, 0.06, 0.05], C.amber);
      for (let s of [-1, 1]) {
        this.block([s * 8.4, 0.85, 19], [1.5, 1.7, 2.2], C.panel);
        this.light([s * 8.4, 1.8, 19], [0.7, 0.04, 1], C.amber);
      }
      this.updateTrophies();
    }
    buildLab(g, zDoor) {
      const z0 = zDoor + 1,
        depth = 26,
        zc = z0 + depth / 2,
        u = this.game.universe;
      this.labStart = zDoor + 1.2;
      this.labLimit = z0 + depth - 1.4;
      mesh(g, 'box', [0, -0.3, zc], [19, 0.6, depth], C.dark);
      mesh(g, 'box', [0, 7.4, zc], [19, 0.5, depth], C.dark);
      for (const sd of [-1, 1]) mesh(g, 'box', [sd * 9.2, 3.4, zc], [0.5, 7, depth], C.hull);
      mesh(g, 'box', [0, 3.4, z0 + depth - 0.3], [19, 7, 0.5], C.hull);
      mesh(g, 'box', [0, 7.05, zc], [7, 0.06, depth - 4], C.light, { em: 1.15, type: 1 });
      // 실험대
      const tz = z0 + 7.5,
        t = group(g, [0, 0, tz]);
      mesh(t, 'box', [0, 0.45, 0], [2.6, 0.9, 1.1], C.panel);
      mesh(t, 'box', [0, 0.95, 0], [3, 0.14, 1.45], '#c9ccc6', { em: 0.12 });
      mesh(t, 'cylinder', [0, 1.02, 0], [1.1, 0.02, 1.1], '#7fd4d0', { alpha: 0.3, em: 0.8 });
      for (const sd of [-1, 1]) {
        const arm = mesh(t, 'cylinder', [sd * 1.35, 2.15, 0], [0.12, 2.3, 0.12], C.edge);
        mesh(t, 'box', [sd * 0.75, 3.2, 0], [1.5, 0.22, 0.7], C.panel);
        mesh(t, 'box', [sd * 0.62, 3.03, 0], [0.9, 0.06, 0.4], C.light, { em: 1.4, type: 1 });
      }
      mesh(g, 'box', [0, 4.4, tz], [3.4, 0.05, 1.2], C.light, { em: 1.25, type: 1 });
      this.labScanner = mesh(t, 'box', [0, 1.6, 0], [0.035, 0.85, 1.35], '#83f9da', { alpha: 0.42, em: 1.4 });
      this.labScanner.visible = false;
      this.solids.push({ min: [-1.9, -1, tz - 1.2], max: [1.9, 4, tz + 1.2], gallery: true });
      this.interactables.push({
        id: 'lab',
        gallery: true,
        p: [0, 1.7, tz],
        radius: 3.4,
        label: u.cargo ? '실험대' : '실험대 · 화물칸이 비어 있습니다',
        verb: '실험대에 눕히기',
        action: () => {
          if (this.labPose) {
            const pose = this.labPose;
            if (pose.person.result) {
              this.clearLabSubject();
              this.updateTrophies();
            } else if (pose.time >= 0.7 && pose.scan == null) {
              pose.scan = 0;
              this.game.audio.metal();
            }
          } else this.seatLabSubject(tz);
        },
      });
      // 화물칸 — 실린 사람들은 실험대를 보고 서 있다
      const hz = z0 + 18.5;
      mesh(g, 'box', [0, 0.02, hz], [15, 0.04, 9], C.panel);
      for (const sd of [-1, 1]) mesh(g, 'box', [sd * 7.4, 0.1, hz], [0.06, 0.05, 8.6], C.amber, { em: 1.1, type: 1 });
      const heads = this.game.save.data.trophies.length;
      this.firstPassenger = null;
      const subject = u.hold.find(p => !p.result) || u.hold[0];
      u.hold.forEach((person, i) => {
        const col = i % 5,
          row = Math.floor(i / 5);
        const fig = heads
          ? group(g, [-3.5 + col * 1.75, 0, hz - 4.1 + row * 1.15])
          : group(g, [-4.4 + col * 2.2, 0, hz - 2.6 + row * 2.1]);
        K.residentFigure(fig, person.species, person.pal, 1.75, person.scale);
        fig.r[1] = Math.PI;
        fig.s = [1.15, 1.15, 1.15];
        if (person === subject) this.firstPassenger = { fig, person };
      });
      this.interactables.push({
        id: 'hold',
        gallery: true,
        p: [0, 1.7, hz - 5.6],
        radius: 3.8,
        label: '화물칸 · ' + u.cargo + '/20' + (u.freeing ? ' · 내려보내기 예약됨' : ''),
        verb: '살펴보기',
        action: () => this.game.ui.openHold(),
      });
    }
    seatLabSubject(z) {
      if (!this.firstPassenger) return;
      const { fig, person } = this.firstPassenger;
      this.labPose = { fig, person, z, home: fig.p.slice(), time: 0, scan: person.result ? 2.2 : null };
      const trace = document.getElementById('labTrace');
      // A passenger's route always draws the same trace on the receiver.
      trace?.setAttribute('d', 'M4 22 L43 ' + (7 + person.seed % 17) + ' L87 ' +
        (4 + (person.seed >>> 3) % 18) + ' L125 ' + (6 + (person.seed >>> 7) % 16) + ' L164 6');
      const aim = M.aim([this.position[0], 2.6, this.position[2]], [0, 1.35, z]);
      this.yaw = aim.yaw;
      this.pitch = aim.pitch;
      this.updateLabPose(0);
    }
    updateLabPose(dt) {
      const pose = this.labPose;
      if (!pose) return;
      if (Math.hypot(this.position[0], this.position[2] - pose.z) > 4) {
        this.clearLabSubject();
        if (pose.person.result) this.updateTrophies();
        return;
      }
      pose.time = Math.min(0.7, pose.time + dt);
      const t = M.smooth(0, 0.7, pose.time), angle = t * Math.PI / 2;
      pose.fig.p = [-Math.sin(angle), 1.28 - Math.cos(angle), pose.z + (1 - t) * 0.85];
      pose.fig.r = [-angle, -Math.PI / 2, 0];
      if (pose.scan != null) {
        if (!pose.person.result) {
          pose.scan = Math.min(2.2, pose.scan + dt);
          this.labScanner.visible = true;
          this.labScanner.p[0] = -1.1 + pose.scan;
          if (pose.scan >= 2.2) {
            this.game.universe.readRoute(pose.person);
            this.game.audio.success();
          }
        }
        if (pose.person.result) this.labScanner.visible = false;
        this.game.ui.labMonitor(pose);
      }
    }
    clearLabSubject() {
      if (!this.labPose) return;
      const { fig, home } = this.labPose;
      fig.p = home;
      fig.r = [0, Math.PI, 0];
      this.labPose = null;
      this.labScanner.visible = false;
      this.game.ui.labMonitor(null);
    }
    slots() {
      const g = this.game,
        out = [];
      g.save.data.trophies.forEach((t, i) => out.push({ type: 'head', t, index: i }));
      for (const r of g.universe.relicList()) out.push({ type: 'relic', id: r.id, form: r.form });
      return out;
    }
    updateTrophies() {
      const slots = this.slots(),
        key =
          slots.map(x => (x.type === 'head' ? 'h' + x.t.id : 'r' + x.id)).join('|') +
          '#' +
          this.game.universe.hold.map(p => [p.from, p.species, p.seed, p.result].join('-')).join('.') +
          '#' +
          (this.game.universe.freeing ? 1 : 0);
      if (key === this.galleryKey) return;
      this.galleryKey = key;
      this.clearLabSubject();
      if (this.galleryRoot) this.roomRoot.remove(this.galleryRoot);
      this.solids = this.solids.filter(o => !o.gallery);
      this.interactables = this.interactables.filter(o => !o.gallery);
      const g = group(this.roomRoot, [0, 0, 0]);
      this.galleryRoot = g;
      this.trophies = [];
      this.animators = [];
      const rows = Math.max(1, Math.ceil(slots.length / 2)),
        len = rows * 6 + 6;
      const z0 = 29.5,
        zc = z0 + len / 2 - 3;
      mesh(g, 'box', [0, -0.3, zc], [14, 0.6, len], C.dark);
      mesh(g, 'box', [0, 7, zc], [14, 0.5, len], C.dark);
      for (const sd of [-1, 1]) {
        mesh(g, 'box', [sd * 6.7, 3.2, zc], [0.5, 6.4, len], C.hull);
      }
      const zDoor = z0 + len - 3;
      for (const sd of [-1, 1]) mesh(g, 'box', [sd * 5, 3.2, zDoor], [4, 6.4, 0.5], C.hull);
      mesh(g, 'box', [0, 5.6, zDoor], [6, 1.6, 0.5], C.hull);
      mesh(g, 'box', [0, 4.7, zDoor - 0.32], [3.2, 0.1, 0.1], C.light, { em: 1.3, type: 1 });
      this.buildLab(g, zDoor);
      for (let i = 0; i < rows; i++) {
        const z = z0 + i * 6;
        mesh(g, 'box', [0, 0.008, z], [12, 0.025, 0.027], C.panel);
        for (const sd of [-1, 1])
          mesh(g, 'box', [sd * 6.42, 3.2, z], [0.055, 3.6, 0.05], C.amber, { em: 1.2, type: 1 });
      }
      slots.forEach((slot, i) => {
        const sd = i % 2 ? 1 : -1,
          z = z0 + Math.floor(i / 2) * 6,
          x = sd * 4.5,
          ped = group(g, [x, 0, z]);
        const relic = slot.type === 'relic';
        mesh(ped, 'cylinder', [0, 0.15, 0], [2.2, 0.3, 2.2], C.dark);
        mesh(ped, 'cylinder', [0, 0.5, 0], [1.6, 0.5, 1.6], C.panel);
        mesh(ped, 'cylinder', [0, 0.78, 0], [1.9, 0.07, 1.9], relic ? C.edge : C.gold);
        mesh(ped, 'torus', [0, 3.5, 0], [1.3, 1.3, 1.3], relic ? C.edge : C.gold);
        mesh(ped, 'disc', [0, 0.824, 0], [1.6, 0.015, 1.6], relic ? '#3c5a52' : '#286478', { alpha: 0.35, em: 0.6 });
        for (let a = 0; a < 3; a++) {
          const ang = (a / 3) * Math.PI * 2;
          mesh(ped, 'cylinder', [Math.sin(ang) * 0.95, 2.15, Math.cos(ang) * 0.95], [0.05, 2.7, 0.05], C.edge);
        }
        const plate = mesh(ped, 'box', [sd * -1.05, 1.02, 0], [0.06, 0.34, 1.1], relic ? C.edge : C.gold, { em: 0.25 });
        plate.r[1] = 0;
        mesh(g, 'box', [x, 4.15, z], [1, 0.04, 0.5], relic ? C.light : C.amber, { em: 1.2, type: 1 });
        const holder = group(ped, [0, relic ? 1.02 : 2.03, 0]);
        if (relic) {
          holder.s = [0.62, 0.62, 0.62];
          K.Models.relicModel(holder, slot.form, this.game.universe.get(slot.id)?.index || 1);
        } else {
          holder.s = [0.84, 0.84, 0.84];
          const f = K.TrophyModels?.[slot.t.id];
          if (typeof f === 'function') f(holder, this.game, this);
          else K.Models.head(holder, [0, 0, 0], 1);
        }
        holder.r[1] = sd < 0 ? -Math.PI / 2 : Math.PI / 2;
        this.solids.push({ min: [x - 1.2, -1, z - 1.2], max: [x + 1.2, 4, z + 1.2], gallery: true });
        this.interactables.push({
          id: 'slot' + i,
          gallery: true,
          p: [x, 2, z],
          radius: 3.1,
          label: relic ? '회수물 기록' : '전시 기록',
          verb: '기록 보기',
          action: relic ? () => this.game.ui.inspectRelic(slot.id) : () => this.game.inspectTrophy(slot.index),
        });
      });
      this.aftLimit = this.labLimit;
    }
    walkable(p) {
      if (p[2] > 26.3) {
        if (p[2] > this.aftLimit) return false;
        if (Math.abs(p[0]) > (p[2] >= this.labStart ? 8.7 : 6.1)) return false;
      }
      if (p[0] < -9.1 || p[0] > 9.1 || p[2] < -22.4 || p[2] > this.aftLimit) return false;
      for (const o of this.solids)
        if (p[0] > o.min[0] - 0.25 && p[0] < o.max[0] + 0.25 && p[2] > o.min[2] - 0.25 && p[2] < o.max[2] + 0.25)
          return false;
      return true;
    }
    update(dt, input) {
      for (const a of this.animators || []) a(dt);
      this.updateLabPose(dt);
      const [dx, dy] = input.look();
      this.yaw -= dx;
      this.pitch = M.clamp(this.pitch - dy, -1.25, 1.25);
      const a = input.axes();
      this.yaw -= (input.keys.has('ArrowRight') ? 1 : 0) * dt;
      this.yaw += (input.keys.has('ArrowLeft') ? 1 : 0) * dt;
      const f = M.dir(this.yaw),
        r = M.right(this.yaw);
      let v = M.add(M.mul(f, a.z), M.mul(r, a.x));
      if (M.len(v) > 1) v = M.norm(v);
      const speed = a.boost ? 8.5 : 5.4;
      let next = M.add(this.position, M.mul(v, dt * speed));
      if (this.walkable([next[0], 1.85, this.position[2]])) this.position[0] = next[0];
      if (this.walkable([this.position[0], 1.85, next[2]])) this.position[2] = next[2];
      this.walk += M.len(v) * dt * 7;
      const bob = Math.sin(this.walk) * 0.024 * this.game.settings.shake;
      let eye = [this.position[0], 1.85 + bob, this.position[2]];
      if (this.labPose) {
        const t = M.smooth(0, 0.7, this.labPose.time);
        const center = [0, 1.35, this.labPose.z];
        eye[1] += 0.75 * t;
        const offset = M.sub(eye, center), distance = M.len(offset);
        // Keep the whole table within the horizontal field of view on a narrow phone.
        const fit = 1.65 / (Math.tan(37 * Math.PI / 180) * Math.min(1, innerWidth / innerHeight));
        if (fit > distance) eye = M.add(eye, M.mul(offset, t * (fit / distance - 1)));
      }
      this.game.engine.camera = {
        p: eye,
        yaw: this.yaw,
        pitch: this.pitch,
        roll: 0,
        fov: 74,
      };
      this.zone =
        this.position[2] <= -5
          ? '조종실'
          : this.position[2] >= this.labStart
            ? '실험실'
            : this.position[2] > 28
              ? '전시 복도 · ' + this.slots().length + '점'
              : this.position[2] > 12
                ? '격납고'
                : '중앙 통로';
      this.game.ui.setArea('MOTHERSHIP · NØMAD', this.zone);
      if (input.take('KeyM')) {
        this.game.ui.navigation(this.labPose?.person.result ? this.labPose.person.lead : undefined);
        return;
      }
      let nearest = null,
        best = Infinity;
      for (const t of this.interactables) {
        if (t.room) {
          if (t.room === this.zone && !nearest) nearest = t;
          continue;
        }
        const dist = M.dist(this.position, t.p);
        const aim = M.dot(M.norm(M.sub(t.p, this.position)), M.dir(this.yaw, this.pitch));
        if (dist < t.radius && aim > -0.1 && dist < best) {
          nearest = t;
          best = dist;
        }
      }
      let hint = nearest?.label || '';
      let ready = !!nearest;
      let verb = nearest?.verb || '';
      if (nearest?.id === 'lab') {
        ready = this.game.universe.cargo > 0;
        if (!ready) hint = '실험대 · 화물칸이 비어 있습니다';
        else if (this.labPose) {
          const pose = this.labPose;
          ready = pose.time >= 0.7 && (pose.scan == null || !!pose.person.result);
          hint = pose.time < 0.7 ? '주민을 실험대에 눕히는 중' : pose.person.result ? '항로 조사 완료' :
            pose.scan == null ? '실험대 · 주민의 항로 조사' : '실험대 작동 중';
          verb = pose.person.result ? '화물칸 복귀' : '실험하기';
        }
      }
      if (nearest?.id === 'launch') ready = this.game.nearPlanet() && !this.game.space.weapons.inFlight(this.game.space.target.id);
      if (nearest?.id === 'launch' && !ready)
        hint = this.game.universe.destroyed(this.game.space.target.id)
          ? '목표 행성이 소멸했습니다 · 성도에서 다른 행성을 선택하세요'
          : !this.game.universe.surfaceReady(this.game.space.target.id)
            ? '고체 지표가 없습니다 · 궤도 탐사와 포격만 가능'
            : this.game.space.weapons.inFlight(this.game.space.target.id) ? '발사한 미사일이 도착하면 탑승할 수 있습니다'
            : '행성의 구름층까지 접근한 뒤 탑승할 수 있습니다';
      this.game.currentInteract = ready ? nearest : null;
      this.game.ui.prompt(hint, ready, verb);
      if (input.take('KeyE')) this.game.interact();
      this.syncOutside();
    }
    syncOutside() {
      const s = this.game.space;
      // The same streamed exterior is visible through every window, at the ship's orientation.
      this.outside.localMatrix = M.view([0, 0, 0], s.yaw, s.pitch, 0);
      s.applyEnvironment(true);
    }
    spawn(where, faceAft = false) {
      if (where === 'hangar') {
        this.position = [0, 1.85, 13.3];
        // back with a new head: facing the archive behind the craft
        this.yaw = faceAft ? Math.PI : 0;
        this.pitch = 0;
      } else if (where === 'gallery') {
        this.position = [0, 1.85, 26.6];
        this.yaw = Math.PI;
        this.pitch = 0.02;
      } else {
        this.position = [0, 1.85, -13.5];
        this.yaw = 0;
        this.pitch = 0;
      }
      this.updateTrophies();
    }
    dispose() {
      this.root.children.length = 0;
      this.solids.length = 0;
      this.interactables.length = 0;
    }
  }
  K.Interior = Interior;
})((window.KO ||= {}));

// FILE: src/vehicles/destroyer.js
(function (K) {
  'use strict';
  const M = K.M;
  // The tractor beam reaches this far and catches whatever stands inside a cone this wide (half-angle, radians).
  // The cone is drawn on screen as it is judged. The cutting beam stays a thin line aimed at the crosshair.
  const RANGE = 140,
    CONE = 0.1;
  class Destroyer {
    constructor(game, planet) {
      this.game = game;
      this.planet = planet;
      this.p = [0, 12, 175];
      this.yaw = 0;
      this.pitch = -0.055;
      this.velocity = [0, 0, 0];
      this.rig = K.Models.cockpit();
      this.shake = 0;
      this.kick = 0;
      this.bank = 0;
      this.nose = 0;
      this.bob = 0;
      this.firing = false;
      this.pulseCooldown = 0;
      this.hitCooldown = 0;
      this.grab = null;
      this.grabStart = 0;
      this.tension = 0;
      this.hv = [0, 0, 0];
      this.holdDist = 16;
      this.pick = null;
      this.pickFrame = 0;
      this.flash = 0;
      this.flashDir = [0, 0, 1];
      this.fovKick = 0;
      this.wasBoost = false;
      this.lastYaw = 0;
      this.yawRate = 0;
      this.holdFire = false;
      this.carrying = !!game.save.data.trophies.length;
      this.rig.carry.visible = false;
      const factory = K.TrophyModels?.[planet.definition?.rulerId];
      if (factory) {
        this.rig.carry.children.length = 0;
        factory(this.rig.carry, game);
        this.rig.carry.r[1] = Math.PI;
      }
      // the beam as it is seen: a cone of light from under the nose, and a ring round what it has hold of
      const fx = planet.fxRoot;
      this.cone = K.mesh(fx, 'cone', [0, 0, 0], [1, 1, 1], '#a8f6de', { type: 1, em: 1.1, alpha: 0.15 });
      this.cone.visible = false;
      this.lock = K.mesh(fx, 'haloRing', [0, 0, 0], [1, 1, 1], '#c4ffe9', { type: 1, em: 1.6, alpha: 0.8 });
      this.lock.visible = false;
    }
    get touch() {
      return document.body.classList.contains('touch');
    }
    floorAt(p) {
      // the height passed along lets a world with a floating floor (heaven) tell above from below
      return this.planet.floor ? this.planet.floor(p[0], p[2], p[1]) : this.planet.height(p[0], p[2]);
    }
    update(dt, input) {
      const [dx, dy] = input.look();
      this.yaw -= dx;
      this.pitch = M.clamp(this.pitch - dy, -1.35, 1.35);
      this.yaw += (input.keys.has('ArrowLeft') ? dt : 0) - (input.keys.has('ArrowRight') ? dt : 0);
      const a = input.axes(),
        f = M.dir(this.yaw, this.pitch),
        flat = M.dir(this.yaw, 0),
        right = M.right(this.yaw);
      /* ---------- flight: W A S D across the ground, Space and C for height; looking about never moves the ship ---------- */
      const boost = a.boost;
      if (boost && !this.wasBoost) {
        this.fovKick = Math.max(this.fovKick, 1);
        this.shake = Math.max(this.shake, 0.16);
        this.game.audio.boost();
      }
      this.wasBoost = boost;
      let hx = flat[0] * a.z + right[0] * a.x,
        hz = flat[2] * a.z + right[2] * a.x;
      const hl = Math.hypot(hx, hz);
      if (hl > 1) {
        hx /= hl;
        hz /= hl;
      }
      const load = this.grab ? this.weight(this.grab) : 0,
        top = (boost ? 82 : 34) * (1 - load * 0.3),
        climb = boost ? 44 : 20;
      // quick to answer the stick and quick to stop when it is let go
      const eH = 1 - Math.exp(-(hl > 0.05 ? (boost ? 5.5 : 7) : 5.2) * dt),
        eV = 1 - Math.exp(-(Math.abs(a.y) > 0.05 ? 7 : 5.5) * dt),
        before = this.velocity.slice();
      this.velocity[0] += (hx * top - this.velocity[0]) * eH;
      this.velocity[2] += (hz * top - this.velocity[2]) * eH;
      this.velocity[1] += (a.y * climb - this.velocity[1]) * eV;
      this.p = M.add(this.p, M.mul(this.velocity, dt));
      const hover = this.planet.config?.hover ?? 3.6;
      let ground = this.floorAt(this.p);
      if (this.p[1] < ground + hover) {
        if (this.velocity[1] < -13) this.slam(ground, -this.velocity[1]);
        this.p[1] = ground + hover;
        this.velocity[1] = Math.max(0, this.velocity[1] * -0.15);
      }
      const ceiling = this.planet.config?.ceiling ?? 420;
      if (this.p[1] > ceiling) {
        this.p[1] = ceiling;
        this.velocity[1] = Math.min(0, this.velocity[1]);
      }
      const edge = this.planet.edge || 1390;
      if (Math.hypot(this.p[0], this.p[2]) > edge) {
        const ang = Math.atan2(this.p[0], this.p[2]);
        this.p[0] = Math.sin(ang) * (edge - 10);
        this.p[2] = Math.cos(ang) * (edge - 10);
        this.velocity = M.mul(this.velocity, -0.2);
        this.game.ui.toast('대륙 가장자리', 'R로 상공의 모선에 귀환할 수 있습니다.');
      }
      this.hitCooldown = Math.max(0, this.hitCooldown - dt);
      this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
      this.shake = M.damp(this.shake, 0, 7, dt);
      this.kick = M.damp(this.kick, 0, 12, dt);
      this.fovKick = M.damp(this.fovKick, 0, 3.2, dt);
      // the craft leans into a slide or a turn and dips its nose as it gathers speed
      const yr = (this.yaw - this.lastYaw) / Math.max(dt, 1e-3);
      this.lastYaw = this.yaw;
      this.yawRate = M.damp(this.yawRate, M.clamp(yr, -6, 6), 8, dt);
      const side = (this.velocity[0] * right[0] + this.velocity[2] * right[2]) / 82,
        fwdAcc = ((this.velocity[0] - before[0]) * flat[0] + (this.velocity[2] - before[2]) * flat[2]) / Math.max(dt, 1e-3);
      this.bank = M.damp(this.bank, M.clamp(-side * 0.34 - this.yawRate * 0.03, -0.22, 0.22), 6, dt);
      this.nose = M.damp(this.nose, M.clamp(-fwdAcc * 0.0017, -0.06, 0.06), 5, dt);
      this.bob += dt;
      this.planet.collide(this, dt);
      if (input.take('KeyR')) {
        this.game.returnHome();
        return;
      }
      /* ---------- the cutter and the tractor ---------- */
      const tractorPress = input.take('KeyQ'),
        firePress = input.take('Fire'),
        wheel = input.takeWheel();
      if (!input.fire) this.holdFire = false;
      let aim = this.planet.raycast(this.p, f, 230);
      if (this.grab) {
        const e = this.grab;
        if (wheel) this.holdDist = M.clamp(this.holdDist + wheel * 2, 10, 40);
        if ((firePress || input.take('Throw')) && e.kind !== 'ruler' && !this.anchored(e)) this.throwHeld(f);
        else if (tractorPress) this.release(true);
      } else if (tractorPress) {
        this.tryGrab(f, aim);
        if (this.grab) aim = this.planet.raycast(this.p, f, 230);
      }
      const beamTap = input.take('CutterTap');
      this.firing = (input.fire || beamTap) && !this.game.busy && !this.grab && !this.holdFire;
      if (this.firing) {
        this.planet.fire(this, aim, dt);
        this.kick = 0.017;
      } else this.planet.stopFire();
      if (this.grab) this.updateGrab(dt, f);
      if (input.take('KeyG')) this.recoverPassenger();
      this.animateRecovery(dt);
      if (input.take('KeyF')) {
        if (this.pulseCooldown <= 0) {
          this.pulseCooldown = 3;
          this.shake = 0.6;
          this.game.audio.pulse();
          this.planet.pulseAt(this.p, 42, 120);
          this.planet.wave(this.p);
          this.kick = 0.23;
          this.fovKick = Math.max(this.fovKick, 0.5);
        } else this.game.ui.toast('충격파 재충전', `${Math.ceil(this.pulseCooldown)}초`, 1);
      }
      // what the cone would catch if it were let out now, looked at a few times a second
      if (!this.grab && --this.pickFrame <= 0) {
        this.pickFrame = 4;
        this.pick = this.findTarget(f, aim);
        this.bugsInCone = !this.pick && this.planet.swarm && !this.planet.swarm.ball ? this.planet.swarm.gather(this.p, f, this.reach(aim), CONE * 1.25, 70).length : 0;
      } else if (this.grab) {
        this.pick = null;
        this.bugsInCone = 0;
      }
      this.beamFX(dt, f);
      this.hud(aim);
      this.game.audio.tractor(this.grab ? (this.grab.kind === 'ruler' ? 1 : 0.8) : this.flash > 0 ? 0.6 * this.flash * 3 : 0, this.grab?.kind === 'ruler' ? Math.min(1, this.tension / 1.8) : this.grab && this.anchored(this.grab) ? 0.5 : 0);
      const speed = M.len(this.velocity),
        shake = this.shake * this.game.settings.shake,
        t = this.bob;
      this.game.engine.camera = {
        p: M.add(this.p, [Math.sin(t * 67) * shake * 0.21, Math.sin(t * 51) * shake * 0.19, 0]),
        yaw: this.yaw + Math.sin(t * 38) * shake * 0.006,
        pitch: this.pitch + Math.sin(t * 47) * shake * 0.006 + this.kick * 0.01,
        roll: this.bank + Math.sin(t * 36) * shake * 0.008,
        fov: 78 + Math.min(speed / 82, 1) * 9 + this.fovKick * 6,
      };
      this.rig.root.s = innerWidth < innerHeight ? [0.69, 0.85, 1] : [1, 1, 1];
      // the nose dip is the cockpit's, not the view's: the crosshair stays where the beams go
      this.rig.root.r[0] = this.nose;
      this.rig.arms.forEach((arm, i) => {
        arm.r[0] = this.grab ? -0.08 : this.firing ? Math.sin(t * 40) * 0.012 : 0;
        arm.r[1] = this.grab ? (i === 0 ? -0.13 : 0.13) : 0;
        arm.p[2] = M.damp(arm.p[2], -1.9 + this.kick * 0.35, 10, dt);
      });
      this.rig.carry.visible = this.carrying && this.planet.ruler.captured && this.planet.newCapture;
      this.game.engine.impact = shake;
    }
    // coming down hard onto the ground: the hull hits it, and so does whatever is under it
    slam(ground, speed) {
      const k = M.clamp((speed - 13) / 30, 0, 1);
      this.game.audio.impact(0.8 + k * 1.4);
      this.shake = Math.max(this.shake, 0.3 + k * 0.6);
      this.fovKick = Math.max(this.fovKick, 0.5 * k);
      const at = [this.p[0], ground, this.p[2]];
      this.planet.pulseAt(at, 12 + k * 18, 50 + k * 110);
      this.planet.wave([at[0], ground + 0.6, at[2]], '#e2d3ae', 70 + k * 70, 0.55);
      this.planet.slammed?.(at, k, this);
    }
    hud(aim) {
      const touch = this.touch;
      let context = '',
        progress = -1;
      const e = this.grab;
      if (e) {
        if (e.kind === 'ruler') {
          context = '연결 고정 · 뒤로 물러나 당기기';
          progress = this.tension / 1.8;
        } else if (e.tug) context = '뽑아내는 중 · 뒤로 당기세요';
        else if (this.anchored(e)) context = touch ? '잡아당기는 중 · 놓기로 해제' : '잡아당기는 중 · 우클릭 놓기';
        else context = touch ? '던지기를 끌어 조준 · 손을 떼면 투척' : '좌클릭 던지기 · 우클릭 내려놓기';
        if (this.canRecover()) context = this.game.universe.cargoFull()
          ? '화물칸 20/20 · 던지기 또는 놓기'
          : touch ? '주민 견인 중' : 'G · 모선 회수　좌클릭 · 던지기　Q · 놓기';
      } else {
        const t = this.pick?.entity || aim?.entity;
        if (t) {
          if (t.kind === 'ruler')
            context = t.hp <= 0 ? this.planet.config?.rulerAim || this.planet.rulerName + ' · Q로 머리 견인' : this.planet.guardText?.() || this.planet.rulerName + ' · 왕좌를 무력화하세요';
          else if (t.label !== undefined) context = t.label;
          else if (this.pick) context = t.kind === 'creature' ? (t.beg ? 'Q · 생존자 견인' : 'Q · 생명체 견인') : '';
          else if (this.anchored(t) && aim && aim.distance < RANGE) context = 'Q · 붙잡아 당기기';
          // the crosshair on something the beam could take, but past its reach
          if (!this.pick && aim && t === aim.entity && aim.distance >= RANGE && this.takeable(t)) context = (context.split(' · ')[0] || '대상') + ' · 더 가까이 · ' + RANGE + 'm 안';
        } else if (this.bugsInCone >= 3) context = '벌레 ' + (this.bugsInCone >= 70 ? '70마리 넘게' : this.bugsInCone + '마리') + ' · Q 견인';
      }
      this.game.ui.context(context, !!(this.pick || aim || this.bugsInCone >= 3), progress);
      this.game.ui.prompt('', false);
      this.game.ui.setArea(this.planet.areaLabel, this.planet.ruler.captured ? this.planet.afterLabel : this.planet.regionName);
      this.game.ui.setStatus(this.grab ? '중력 견인 중' : this.firing ? '절단 광선' : '파괴정 · TALON', `${Math.round(M.len(this.velocity))} m/s`);
    }
    /* ---------- the tractor beam ---------- */
    centerOf(e) {
      if (e.hit?.length) return [e.hit[0][0], e.hit[0][1], e.hit[0][2]];
      if (e.kind === 'ruler') return e.p;
      const p = e.node && (e.kind === 'demon' || e.kind === 'angel') ? e.node.p : e.p;
      if (e.sp && e.scale) return [p[0], p[1] + (e.sp.center || 0.9) * e.scale, p[2]];
      if (e.hy) return [p[0], p[1] + e.hy, p[2]];
      if (e.kind === 'creature') return [p[0], p[1] + 1, p[2]];
      return p;
    }
    radiusOf(e) {
      return e.hit?.[0]?.[3] || e.radius || 1;
    }
    // how heavy a held thing is, 0 (a person) to 1 (a keeper of hell)
    weight(e) {
      if (e.kind === 'ruler' || this.anchored(e)) return 0.6;
      return M.clamp((this.radiusOf(e) - 1.4) / 3, 0, 1);
    }
    // a building, a dome: stays where it stands; the beam can only pull at it until it gives
    anchored(e) {
      return !!e && (e.kind === 'building' || !!e.anchored);
    }
    // what a press could take hold of at all, near enough: carried, pulled out, or (the ruler) pulled off
    takeable(e) {
      return !!e && (e.kind === 'ruler' || this.grabbable(e) || (e.tug && e.alive !== false && !e.burst));
    }
    // where the beam takes hold of something it can only pull at
    anchorPoint(e) {
      return e.tug ? e.p : M.add(e.p, [0, (e.h || 0) * 0.6, 0]);
    }
    grabbable(e) {
      if (!e || !e.alive || e.dying) return false;
      if (e.kind === 'ruler') return e.hp <= 0;
      if (this.anchored(e)) return false;
      return !e.fixed && !e.carrier && !e.gone;
    }
    // how far the cone reaches along the crosshair: no further than what the crosshair is on (glass, a wall)
    reach(aim) {
      return aim && aim.distance < RANGE ? aim.distance + 1 : RANGE;
    }
    // What a press of the tractor carries off: what the crosshair is on, if it can be carried (or the ruler);
    // else the nearest thing inside the cone that nothing solid stands in front of. Null if the cone holds nothing to carry.
    findTarget(f, aim = this.planet.raycast(this.p, f, 230)) {
      if (aim && aim.distance < RANGE && this.takeable(aim.entity)) return aim;
      const list = this.planet.grabCandidates ? this.planet.grabCandidates() : [];
      let best = null,
        bestScore = Infinity;
      for (const e of list) {
        if (!this.takeable(e)) continue;
        const c = this.centerOf(e),
          v = M.sub(c, this.p),
          d = M.len(v),
          r = this.radiusOf(e);
        if (d > RANGE + r || d < 0.5) continue;
        const cos = (v[0] * f[0] + v[1] * f[1] + v[2] * f[2]) / d;
        if (cos < 0.9) continue;
        const ang = Math.acos(M.clamp(cos, -1, 1)),
          size = Math.atan(r / d);
        if (ang > CONE + size) continue;
        const score = ang - size * 0.5 + d * 0.0005;
        if (score < bestScore) {
          bestScore = score;
          best = { entity: e, distance: d, point: c };
        }
      }
      if (best) {
        // something solid in the way keeps it out of reach; a big thing is in reach if its middle or its top can be seen
        const r = this.radiusOf(best.entity),
          points = r > 3 ? [best.point, M.add(best.point, [0, r * 0.65, 0])] : [best.point];
        for (const q of points) {
          const dq = M.dist(q, this.p),
            dir = M.norm(M.sub(q, this.p)),
            block = this.planet.raycast(this.p, dir, dq);
          if (!block || block.entity === best.entity || block.distance > dq - r - 1 || !(this.anchored(block.entity) || block.entity.kind === 'wall' || block.entity.fixed)) return best;
        }
      }
      return null;
    }
    // what the beam can only pull at (a building, a dome) or is refused by (something fixed): under the crosshair, in reach
    anchorAt(aim) {
      if (!aim || aim.distance >= RANGE || aim.entity.alive === false) return null;
      return this.anchored(aim.entity) || aim.entity.fixed ? aim : null;
    }
    tryGrab(f, aim = this.planet.raycast(this.p, f, 230)) {
      // what can be carried first; then, on a world with bugs, a ball of them (only from this side of the glass);
      // then whatever under the crosshair can only be pulled at, or refuses the beam
      const pick = this.findTarget(f, aim) || this.planet.tractorFallback?.(this.p, f, this.reach(aim), CONE) || this.anchorAt(aim) || null;
      if (!pick) {
        // the beam goes out and comes back empty: seen and heard; if what the crosshair is on is only too far, said so
        this.flash = 0.32;
        this.flashDir = f.slice();
        this.game.audio.whiff();
        if (aim && aim.distance >= RANGE && this.takeable(aim.entity)) this.game.ui.toast('너무 멉니다', `${Math.round(aim.distance)}m · 견인은 ${RANGE}m 안에서 닿습니다.`, 2);
        return;
      }
      const e = pick.entity;
      if (e.kind === 'ruler' && e.hp > 0) {
        const [title, line] = this.planet.lockedText?.() || ['왕좌가 버티고 있습니다.', '광선이나 충돌로 구속 장치를 먼저 부수세요.'];
        this.game.ui.toast(title, line, 3);
        this.flash = 0.25;
        this.flashDir = f.slice();
        return;
      }
      if (e.fixed && !this.anchored(e)) {
        this.game.ui.toast('견인이 걸리지 않습니다.', e.fixedNote || '땅과 이어져 있습니다.', 2);
        this.flash = 0.25;
        this.flashDir = f.slice();
        this.game.audio.whiff();
        return;
      }
      this.grab = e;
      this.grabStart = M.dist(this.p, e.p);
      this.tension = 0;
      this.hv = e.velocity ? e.velocity.slice() : [0, 0, 0];
      this.holdDist = M.clamp(9 + this.radiusOf(e) * 3.2, 13, 30);
      this.planet.attach(e, this);
      const w = this.weight(e);
      this.game.audio.grabSnap(w);
      this.shake = Math.max(this.shake, 0.18 + w * 0.3);
      // the weight comes on: the craft sags under it
      this.velocity[1] -= 2.5 + w * 5;
      if (e.kind === 'ruler') {
        const [title, line] = this.planet.config?.rulerGrab || ['왕관 고정', 'S로 뒤로 물러나거나 방향을 틀어 잡아당기세요.'];
        this.game.ui.toast(title, line, 5);
      }
    }
    updateGrab(dt, f) {
      const e = this.grab;
      if (!e.alive && e.kind !== 'ruler' && e.kind !== 'loose') {
        this.release(true);
        return;
      }
      if (e.kind === 'ruler') {
        const dist = M.dist(this.p, e.p),
          stretch = Math.max(0, dist - this.grabStart);
        this.tension += Math.max(0, stretch - 2) * dt * (this.planet.config?.pullRate || 0.11);
        this.tension = Math.max(0, this.tension - dt * 0.015);
        this.planet.tetherTo(e.p, this);
        const k = Math.min(this.tension, 1.8);
        this.planet.ruler.head.r[2] = Math.sin(this.bob * (27 + k * 14)) * Math.min(0.06, this.tension * 0.04);
        this.planet.ruler.head.p[1] = (this.planet.ruler.headRestY ?? 18) + k * (this.planet.config?.pullRise || 1.2);
        // the line strains: the craft is held back and shudders more the nearer it comes to tearing loose
        this.shake = Math.max(this.shake, 0.06 + this.tension * 0.2);
        if (stretch > 2) {
          const back = M.norm(M.sub(this.p, e.p)),
            outward = this.velocity[0] * back[0] + this.velocity[1] * back[1] + this.velocity[2] * back[2];
          if (outward > 0) this.velocity = M.sub(this.velocity, M.mul(back, outward * Math.min(1, dt * 2.2)));
        }
        if (this.tension >= 1.8) {
          this.planet.captureRuler();
          this.carrying = true;
          this.grab = null;
          this.shake = 0.8;
          this.fovKick = 1;
          this.game.audio.success();
          this.game.audio.throwKick();
          this.game.ui.toast(this.planet.rulerName + ' 회수', '떠날 때가 되면 R · 모선 귀환', 7);
          this.planet.stopTether();
        }
      } else if (e.tug) {
        const stretch = Math.max(0, M.dist(this.p, e.p) - this.grabStart),
          free = this.planet.tug?.(e, stretch, dt, this);
        if (!this.grab) return;
        if (free) {
          this.grab = free;
          this.grabStart = M.dist(this.p, free.p);
          this.tension = 0;
          this.hv = free.velocity ? free.velocity.slice() : [0, 0, 0];
          this.holdDist = M.clamp(9 + this.radiusOf(free) * 3.2, 13, 30);
          this.planet.attach(free, this);
          this.game.audio.grabSnap(this.weight(free));
          this.shake = Math.max(this.shake, 0.3);
          return;
        }
        // it holds on: the craft is held back by the stalk, more by a bigger eye
        if (stretch > 1.5) {
          const back = M.norm(M.sub(this.p, e.p)),
            outward = this.velocity[0] * back[0] + this.velocity[1] * back[1] + this.velocity[2] * back[2];
          if (outward > 0) this.velocity = M.sub(this.velocity, M.mul(back, outward * Math.min(1, dt * (0.6 + Math.min(2.4, e.radius * 0.35)))));
        }
        this.planet.tetherTo(this.anchorPoint(e), this);
      } else if (this.anchored(e)) {
        const dist = M.dist(this.p, e.p),
          stretch = Math.max(0, dist - this.grabStart);
        e.node.r[2] = Math.sin(this.bob * 20) * Math.min(0.07, stretch * 0.006);
        this.planet.tetherTo(M.add(e.p, [0, e.h * 0.6, 0]), this);
        this.shake = Math.max(this.shake, Math.min(0.3, stretch * 0.02));
        if (stretch > 2) this.planet.damage(e, dt * (40 + stretch * 11), M.norm(M.sub(this.p, e.p)), 'pull');
      } else {
        // a spring hauls it in, then it hangs in front and swings behind when the craft turns
        const target = M.add(this.p, M.add(M.mul(f, this.holdDist), [0, -2.4, 0])),
          kS = 34,
          c = 9;
        for (let i = 0; i < 3; i++) this.hv[i] += (kS * (target[i] - e.p[i]) - c * (this.hv[i] - this.velocity[i])) * dt;
        const sp = M.len(this.hv);
        if (sp > 150) this.hv = M.mul(this.hv, 150 / sp);
        const np = M.add(e.p, M.mul(this.hv, dt)),
          fl = this.planet.floor ? this.planet.floor(np[0], np[2], np[1]) : this.planet.height(np[0], np[2]);
        if (np[1] < fl + (e.rest ?? 0.4)) {
          np[1] = fl + (e.rest ?? 0.4);
          this.hv[1] = Math.max(0, this.hv[1]);
        }
        e.p = np;
        e.node.p = np.slice();
        const rel = M.sub(this.hv, this.velocity);
        e.node.r[2] = M.damp(e.node.r[2] || 0, M.clamp(-(rel[0] * Math.cos(this.yaw) - rel[2] * Math.sin(this.yaw)) * 0.03, -0.8, 0.8), 6, dt);
        e.velocity = [0, 0, 0];
        this.planet.tetherTo(e.p, this);
      }
    }
    // let go: what was held is lowered, not dropped, so a person set down from high up lands on their feet
    release(gentle = true) {
      if (this.grab) {
        const e = this.grab;
        if (e.kind === 'creature' || e.kind === 'loose' || ((e.kind === 'angel' || e.kind === 'demon') && !e.fixed)) {
          e.velocity = M.add(M.mul(this.hv, 0.3), M.mul(this.velocity, 0.2));
          e.thrown = true;
          e.lowered = gentle && (e.kind === 'creature' || e.kind === 'loose');
        }
        if (this.anchored(e) && e.node) e.node.r[2] = 0;
        if (e.tug) this.planet.untug?.(e);
      }
      this.grab = null;
      this.tension = 0;
      this.planet.stopTether();
    }
    throwHeld(f) {
      const e = this.grab;
      this.grab = null;
      this.tension = 0;
      this.planet.stopTether();
      e.velocity = M.add(M.mul(f, 88), M.mul(this.velocity, 0.6));
      e.thrown = true;
      e.lowered = false;
      // the punt pushes back on the craft
      this.velocity = M.add(this.velocity, M.mul(f, -6 - this.weight(e) * 8));
      this.kick = 0.3;
      this.shake = Math.max(this.shake, 0.32);
      this.fovKick = Math.max(this.fovKick, 0.7);
      this.flash = 0.22;
      this.flashDir = f.slice();
      this.holdFire = true;
      this.game.audio.throwKick();
    }
    // the beam drawn: a cone of light to what it holds or is reaching for, and a ring round the catch
    beamFX(dt, f) {
      const from = M.add(this.p, [0, -1.1, 0]);
      this.flash = Math.max(0, this.flash - dt);
      let to = null,
        width = 0,
        alpha = 0;
      if (this.grab) {
        const e = this.grab,
          c = this.anchored(e) ? this.anchorPoint(e) : this.centerOf(e);
        to = c;
        width = this.radiusOf(e) * (e.kind === 'ruler' ? 1.4 : 2.4) + 1;
        alpha = e.kind === 'ruler' ? 0.12 + Math.min(1, this.tension / 1.8) * 0.12 : 0.15;
      } else if (this.flash > 0) {
        const len = this.flash > 0.2 ? RANGE * (1 - (this.flash - 0.2) / 0.12) * 0.9 + 12 : RANGE;
        to = M.add(from, M.mul(this.flashDir, Math.max(10, Math.min(RANGE, len))));
        width = Math.tan(CONE) * 2 * M.dist(from, to);
        alpha = 0.22 * Math.min(1, this.flash / 0.18);
      }
      if (to) {
        this.planet.setLine(this.cone, to, from, width);
        this.cone.alpha = alpha * (0.85 + Math.sin(this.bob * 31) * 0.15);
      } else this.cone.visible = false;
      // the ring: on the catch while held, on what the cone would catch while aiming
      const ringOn =
        this.grab && (!this.anchored(this.grab) || this.grab.tug) ? this.grab : this.pick && (this.grabbable(this.pick.entity) || this.pick.entity.tug) ? this.pick.entity : null;
      if (ringOn) {
        const c = this.centerOf(ringOn),
          r = this.radiusOf(ringOn) * (ringOn.kind === 'ruler' ? 1.05 : 1.7) + 0.6,
          toCam = M.norm(M.sub(this.p, c));
        this.lock.visible = true;
        this.lock.p = c;
        this.lock.s = [r, r, r];
        // stood up to face the craft
        this.lock.r = [Math.atan2(Math.hypot(toCam[0], toCam[2]), toCam[1]), Math.atan2(toCam[0], toCam[2]), 0];
        this.lock.alpha = this.grab ? 0.32 : 0.42 + Math.sin(this.bob * 6) * 0.14;
        this.lock.em = this.grab ? 0.5 : 1.2;
      } else this.lock.visible = false;
    }
    canRecover() {
      const e = this.grab;
      return !!(e?.alive && e.kind === 'creature' && (e.res || e.freed || e.beg));
    }
    recoverPassenger() {
      if (!this.canRecover()) return;
      const u = this.game.universe, e = this.grab;
      const person = u.loadSurvivor(this.planet.id, e);
      if (!person) {
        this.game.ui.toast('화물칸이 가득 찼습니다', '20/20 · 견인 중인 주민은 그대로 있습니다.', 3);
        return;
      }
      const p = e.p.slice();
      this.planet.residents?.lifted(e);
      e.alive = false;
      e.node.visible = false;
      this.grab = null;
      this.tension = 0;
      // Commit both ledgers before optional rendering or audio can interrupt the transfer.
      this.game.persist('checkpoint');
      this.planet.stopTether();
      this.planet.residents?.alarm(p[0], p[2], 48, 'beam');
      const fx = K.group(this.planet.root, p);
      const column = K.beam(fx, [0, -1, 0], [0, 200, 0], 1.8, '#a6ffe4', 1.4);
      column.alpha = 0.23;
      const figure = K.residentFigure(fx, person.species, person.pal, null, person.scale);
      figure.r[1] = e.yaw || 0;
      (this.recoveries ||= []).push({ fx, column, figure, age: 0 });
      this.game.audio.success();
      this.game.ui.toast('모선 회수 · 화물칸 ' + u.cargo + '/20', '', 2);
    }
    animateRecovery(dt) {
      if (!this.recoveries) return;
      for (let i = this.recoveries.length - 1; i >= 0; i--) {
        const r = this.recoveries[i];
        r.age += dt;
        const t = Math.min(1, r.age / 1.15);
        r.figure.p[1] = 100 * t * t * t;
        r.column.alpha = 0.23 * Math.min(1, t * 12, (1 - t) * 6);
        if (t >= 1) { this.planet.root.remove(r.fx); this.recoveries.splice(i, 1); }
      }
    }
    // kept for worlds that call it directly (a test, a scripted grab): same as a tractor press on what is aimed at
    toggleGrab(aim) {
      if (this.grab) {
        this.release(false);
        return;
      }
      if (!aim) {
        this.tryGrab(M.dir(this.yaw, this.pitch));
        return;
      }
      const e = aim.entity;
      if (e.kind === 'ruler' && e.hp > 0) {
        const [title, line] = this.planet.lockedText?.() || ['왕좌가 버티고 있습니다.', '광선이나 충돌로 구속 장치를 먼저 부수세요.'];
        this.game.ui.toast(title, line, 3);
        return;
      }
      if (e.fixed) {
        this.game.ui.toast('견인이 걸리지 않습니다.', e.fixedNote || '땅과 이어져 있습니다.', 2);
        return;
      }
      this.grab = e;
      this.grabStart = M.dist(this.p, e.p);
      this.tension = 0;
      this.hv = [0, 0, 0];
      this.holdDist = M.clamp(9 + this.radiusOf(e) * 3.2, 13, 30);
      this.planet.attach(e, this);
    }
  }
  K.Destroyer = Destroyer;
})((window.KO ||= {}));

// FILE: src/worlds/residents.js
/* Residents — the people of a landed district.
 * Hundreds of bodies drawn as instanced parts, each with its own fear, family and voice.
 * The dead stay where they fell. The district keeps a count of the living (생존 신호).
 * Save contract: short tokens inside planetStates[id].destroyed, all prefixed "z.". */
(function (K) {
  'use strict';
  const { M } = K;
  const TAU = Math.PI * 2;
  const SURVIVE = [1, 0.3, 0.16, 0.08, 0.03, 0];
  const TYPES = ['cut', 'fling', 'crush', 'splat', 'rubble', 'charred'];
  const SIZES = [0.56, 0.82, 0.9, 0.98, 1.06, 1.14];
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  const CAUSE = {
    beam: 'cut',
    cut: 'cut',
    ram: 'crush',
    crush: 'crush',
    throw: 'splat',
    splat: 'splat',
    drop: 'splat',
    pulse: 'fling',
    shred: 'shred', // torn apart where they stood: the craft's own shockwave
    chain: 'fling',
    fling: 'fling',
    collapse: 'rubble',
    rubble: 'rubble',
  };
  const SAVE_CAP = 720;
  const OUTSIDE_CAP = 900;

  /* ---------- allocation-free matrix helpers (column-major, rotation order = M.compose) ---------- */
  function trs(out, o, tx, ty, tz, rx, ry, rz, sx, sy, sz) {
    const a = Math.cos(rx),
      b = Math.sin(rx),
      c = Math.cos(ry),
      d = Math.sin(ry),
      e = Math.cos(rz),
      f = Math.sin(rz);
    out[o] = (c * e + d * b * f) * sx;
    out[o + 1] = a * f * sx;
    out[o + 2] = (c * b * f - d * e) * sx;
    out[o + 3] = 0;
    out[o + 4] = (d * b * e - c * f) * sy;
    out[o + 5] = a * e * sy;
    out[o + 6] = (d * f + c * b * e) * sy;
    out[o + 7] = 0;
    out[o + 8] = a * d * sz;
    out[o + 9] = -b * sz;
    out[o + 10] = a * c * sz;
    out[o + 11] = 0;
    out[o + 12] = tx;
    out[o + 13] = ty;
    out[o + 14] = tz;
    out[o + 15] = 1;
  }
  function mul(out, o, A, ao, B, bo) {
    const a0 = A[ao],
      a1 = A[ao + 1],
      a2 = A[ao + 2],
      a4 = A[ao + 4],
      a5 = A[ao + 5],
      a6 = A[ao + 6],
      a8 = A[ao + 8],
      a9 = A[ao + 9],
      a10 = A[ao + 10];
    for (let j = 0; j < 3; j++) {
      const x = B[bo + j * 4],
        y = B[bo + j * 4 + 1],
        z = B[bo + j * 4 + 2];
      out[o + j * 4] = a0 * x + a4 * y + a8 * z;
      out[o + j * 4 + 1] = a1 * x + a5 * y + a9 * z;
      out[o + j * 4 + 2] = a2 * x + a6 * y + a10 * z;
      out[o + j * 4 + 3] = 0;
    }
    const x = B[bo + 12],
      y = B[bo + 13],
      z = B[bo + 14];
    out[o + 12] = a0 * x + a4 * y + a8 * z + A[ao + 12];
    out[o + 13] = a1 * x + a5 * y + a9 * z + A[ao + 13];
    out[o + 14] = a2 * x + a6 * y + a10 * z + A[ao + 14];
    out[o + 15] = 1;
  }
  K.Mat = { trs, mul }; // shared by other instanced systems (the living world)
  const T = new Float32Array(16);
  const BONES = new Float32Array(16 * 10);
  const KIDB = new Float32Array(16 * 10);

  /* ---------- species ---------- */
  const SPECIES = (K.Species ||= {});
  const rgb = h => M.hex(h).slice();
  const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  /* part: [bone, geo, color, p, s, r, em, lod, half, dyn, open]
   * bones: 0 root(feet) 1 hips 2 torso 3 head 4 upper(+x) 5 fore(+x) 6 upper(-x) 7 fore(-x) 8 leg(+x) 9 leg(-x) */
  K.defineSpecies = function (key, def) {
    const sp = Object.assign(
      {
        key,
        scale: [0.88, 1.1],
        child: 0.56,
        walk: 1.35,
        jog: 2.7,
        run: 6.4,
        radius: 1.4,
        voice: key,
        charColor: '#2b2421',
      },
      def,
    );
    sp.parts = def.parts.map(a => {
      const [bone, geo, color, p, s, r = [0, 0, 0], em = 0, lod = 0, half = null, dyn = null, open = 2.4] = a;
      const m = new Float32Array(16);
      trs(m, 0, p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]);
      const big = lod === 0 && Math.max(s[0], s[1], s[2]) >= 0.45;
      return { bone, geo, color, m, em, lod, big, half: half || (bone >= 2 && bone <= 7 ? 'u' : 'l'), dyn, open };
    });
    sp.geos = [...new Set(sp.parts.map(p => p.geo).concat(['lowDisc', 'box', 'lowSphere', 'tinySphere']))];
    sp.colors = sp.palettes.map(pal =>
      sp.parts.map(part => rgb(part.color[0] === '#' ? part.color : pal[part.color] || '#ff00ff')),
    );
    const ch = rgb(sp.charColor);
    sp.charred = sp.colors.map(list =>
      list.map((c, i) => (sp.parts[i].em > 0.3 ? mixRGB(c, ch, 0.92) : mixRGB(c, ch, 0.8))),
    );
    sp.blood = rgb(def.blood || '#4a1a1c');
    sp.scorch = rgb(def.scorch || '#1d1b1a');
    sp.capColor = rgb(def.capColor || '#3d241b');
    const d = sp.dims;
    sp.height = d.hipY + d.neckY + (d.headTop || 1);
    sp.center = d.hipY * 0.9;
    SPECIES[key] = sp;
    return sp;
  };
  // A recolored copy of an existing species: same body, same voice, different cloth.
  K.respecies = function (baseKey, newKey, recolor) {
    if (SPECIES[newKey]) return SPECIES[newKey];
    const base = SPECIES[baseKey];
    if (!base) return null;
    const sp = Object.assign({}, base, { key: newKey });
    sp.palettes = base.palettes.map(pal => Object.assign({}, pal, recolor(pal)));
    sp.colors = sp.palettes.map(pal =>
      sp.parts.map(part => rgb(part.color[0] === '#' ? part.color : pal[part.color] || '#ff00ff')),
    );
    const ch = rgb(sp.charColor);
    sp.charred = sp.colors.map(list =>
      list.map((c, i) => (sp.parts[i].em > 0.3 ? mixRGB(c, ch, 0.92) : mixRGB(c, ch, 0.8))),
    );
    SPECIES[newKey] = sp;
    return sp;
  };
  // Generic body for people whose world has no surface file of its own.
  K.defineSpecies('subject', {
    name: '분류 불명',
    dims: {
      hipY: 1.05,
      hipX: 0.24,
      legLen: 1.05,
      shoulderX: 0.42,
      shoulderY: 1.0,
      neckY: 1.15,
      upperLen: 0.6,
      foreLen: 0.55,
      depth: 0.32,
      headTop: 0.85,
    },
    palettes: [
      { skin: '#a3b1b6', cloth: '#5d7f8f', dark: '#30393b' },
      { skin: '#b3ab9b', cloth: '#8f6a4f', dark: '#33302b' },
      { skin: '#a7b5a9', cloth: '#6b8f5b', dark: '#2e3830' },
    ],
    blood: '#3a1d20',
    parts: [
      [1, 'lowCyl', 'cloth', [0, 0.1, 0], [0.62, 0.5, 0.46]],
      [2, 'lowSphere', 'cloth', [0, 0.58, 0], [0.82, 1.15, 0.6]],
      [3, 'lowSphere', 'skin', [0, 0.42, 0], [0.72, 0.82, 0.68]],
      [3, 'tinySphere', '#151c1e', [-0.17, 0.48, 0.3], [0.17, 0.22, 0.08], [0, 0, 0], 0, 1],
      [3, 'tinySphere', '#151c1e', [0.17, 0.48, 0.3], [0.17, 0.22, 0.08], [0, 0, 0], 0, 1],
      [3, 'tinySphere', '#3d1518', [0, 0.2, 0.31], [0.2, 0.08, 0.06], [0, 0, 0], 0, 2, null, 'mouth', 3],
      [4, 'lowCyl', 'cloth', [0, -0.3, 0], [0.17, 0.6, 0.17]],
      [5, 'lowCyl', 'skin', [0, -0.27, 0], [0.14, 0.55, 0.14]],
      [5, 'tinySphere', 'skin', [0, -0.6, 0], [0.2, 0.22, 0.18], [0, 0, 0], 0, 1],
      [6, 'lowCyl', 'cloth', [0, -0.3, 0], [0.17, 0.6, 0.17]],
      [7, 'lowCyl', 'skin', [0, -0.27, 0], [0.14, 0.55, 0.14]],
      [7, 'tinySphere', 'skin', [0, -0.6, 0], [0.2, 0.22, 0.18], [0, 0, 0], 0, 1],
      [8, 'lowCyl', 'dark', [0, -0.52, 0], [0.22, 1.05, 0.22]],
      [9, 'lowCyl', 'dark', [0, -0.52, 0], [0.22, 1.05, 0.22]],
    ],
  });

  /* ---------- pose ---------- */
  const Q = {};
  function resetQ() {
    Q.lift = 0;
    Q.rp = 0;
    Q.rr = 0;
    Q.bob = 0;
    Q.hp = 0;
    Q.tp = 0;
    Q.ty = 0;
    Q.tr = 0;
    Q.hdp = 0;
    Q.hdy = 0;
    Q.hdr = 0;
    Q.hs = 1;
    Q.aLx = 0;
    Q.aLy = 0;
    Q.aLz = 0.1;
    Q.eL = 0.15;
    Q.aRx = 0;
    Q.aRy = 0;
    Q.aRz = 0.1;
    Q.eR = 0.15;
    Q.lLx = 0;
    Q.lLz = 0.03;
    Q.lRx = 0;
    Q.lRz = 0.03;
    Q.mouth = 0.05;
    Q.sx = 1;
    Q.sy = 1;
    Q.sz = 1;
  }
  const QKEYS = [
    'lift',
    'rp',
    'rr',
    'bob',
    'hp',
    'tp',
    'ty',
    'tr',
    'hdp',
    'hdy',
    'hdr',
    'aLx',
    'aLy',
    'aLz',
    'eL',
    'aRx',
    'aRy',
    'aRz',
    'eR',
    'lLx',
    'lLz',
    'lRx',
    'lRz',
    'mouth',
    'sx',
    'sy',
    'sz',
  ];
  function bones(Bo, sp, x, y, z, yaw, sc) {
    const d = sp.dims;
    trs(Bo, 0, x, y + Q.lift * sc, z, Q.rp, yaw, Q.rr, sc * Q.sx, sc * Q.sy, sc * Q.sz);
    trs(T, 0, 0, d.hipY + Q.bob, 0, Q.hp, 0, 0, 1, 1, 1);
    mul(Bo, 16, Bo, 0, T, 0);
    trs(T, 0, 0, 0, 0, Q.tp, Q.ty, Q.tr, 1, 1, 1);
    mul(Bo, 32, Bo, 16, T, 0);
    trs(T, 0, 0, d.neckY, 0, Q.hdp, Q.hdy, Q.hdr, Q.hs, Q.hs, Q.hs);
    mul(Bo, 48, Bo, 32, T, 0);
    trs(T, 0, d.shoulderX, d.shoulderY, 0, Q.aLx, Q.aLy, Q.aLz, 1, 1, 1);
    mul(Bo, 64, Bo, 32, T, 0);
    trs(T, 0, 0, -d.upperLen, 0, -Q.eL, 0, 0, 1, 1, 1);
    mul(Bo, 80, Bo, 64, T, 0);
    trs(T, 0, -d.shoulderX, d.shoulderY, 0, Q.aRx, -Q.aRy, -Q.aRz, 1, 1, 1);
    mul(Bo, 96, Bo, 32, T, 0);
    trs(T, 0, 0, -d.upperLen, 0, -Q.eR, 0, 0, 1, 1, 1);
    mul(Bo, 112, Bo, 96, T, 0);
    trs(T, 0, d.hipX, 0, 0, Q.lLx, 0, Q.lLz, 1, 1, 1);
    mul(Bo, 128, Bo, 16, T, 0);
    trs(T, 0, -d.hipX, 0, 0, Q.lRx, 0, -Q.lRz, 1, 1, 1);
    mul(Bo, 144, Bo, 16, T, 0);
  }
  const hash = (a, b = 0) => {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const strHash = s => {
    let h = 41;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const sizeClass = s => {
    let best = 0;
    for (let i = 1; i < SIZES.length; i++) if (Math.abs(SIZES[i] - s) < Math.abs(SIZES[best] - s)) best = i;
    return best;
  };
  const enc2 = n => B36[Math.floor(n / 36) % 36] + B36[n % 36];
  const enc3 = n => B36[Math.floor(n / 1296) % 36] + B36[Math.floor(n / 36) % 36] + B36[n % 36];

  /* Final resting pose of a body. Deterministic from type and seed, so saved bodies look the same. */
  function corpsePose(type, seed, half) {
    resetQ();
    const r = k => hash(seed, k);
    const sup = r(1) < 0.55; // face up
    Q.mouth = r(2) < 0.6 ? 0.55 + r(3) * 0.45 : 0.08;
    Q.hdy = (r(4) - 0.5) * 1.3;
    Q.hdr = (r(5) - 0.5) * 0.6;
    if (type === 'charred') {
      Q.rr = Math.PI / 2 * (r(6) < 0.5 ? 1 : -1);
      Q.rp = 0.15;
      Q.lift = 0.42;
      Q.lLx = Q.lRx = -1.45 - r(7) * 0.3;
      Q.tp = 0.55;
      Q.aLx = Q.aRx = -1.9;
      Q.eL = Q.eR = 1.7;
      Q.aLz = Q.aRz = 0.2;
      Q.hdp = 0.6;
      Q.mouth = 0.7;
      return;
    }
    Q.rp = sup ? -1.5 : 1.47;
    Q.rr = (r(8) - 0.5) * 0.5;
    Q.lift = 0.36;
    // limbs where they landed
    Q.aLz = 0.3 + r(9) * 1.5;
    Q.aRz = 0.3 + r(10) * 1.5;
    Q.aLx = (r(11) - 0.5) * 2.2;
    Q.aRx = (r(12) - 0.5) * 2.2;
    Q.eL = r(13) * 1.6;
    Q.eR = r(14) * 1.6;
    Q.lLx = (r(15) - 0.5) * 0.9;
    Q.lRx = (r(16) - 0.5) * 0.9;
    Q.lLz = 0.05 + r(17) * 0.35;
    Q.lRz = 0.05 + r(18) * 0.35;
    Q.tr = (r(19) - 0.5) * 0.5;
    if (type === 'crush') {
      Q.sz = 0.42;
      Q.lift = 0.12;
      Q.aLz = 1.2 + r(20) * 0.5;
      Q.aRz = 1.2 + r(21) * 0.5;
      Q.lLz = Q.lRz = 0.45;
      Q.mouth = 0.9;
    } else if (type === 'splat') {
      Q.sz = 0.62;
      Q.lift = 0.18;
      Q.aLz = 0.9 + r(22) * 1.2;
      Q.aRz = 0.6 + r(23) * 1.6;
      Q.lLz = 0.3 + r(24) * 0.4;
      Q.lRz = 0.2 + r(25) * 0.5;
      Q.tr = (r(26) - 0.5) * 1.1;
    } else if (type === 'fling') {
      Q.tr = (r(27) - 0.5) * 1.2;
      Q.ty = (r(28) - 0.5) * 0.9;
      Q.lLx = -0.9 * r(29);
      Q.lRx = 0.6 * r(30);
    } else if (type === 'cut') {
      Q.mouth = 0.85;
      if (half === 'u') {
        Q.aLz = 0.2 + r(31) * 1.3;
        Q.aRz = 0.2 + r(32) * 1.3;
      }
    } else if (type === 'rubble') {
      Q.rp = 1.45;
      Q.aLx = -2.6 - r(33) * 0.4;
      Q.aRx = -1.2 - r(34) * 1.2;
      Q.aLz = 0.3;
      Q.aRz = 0.6;
    }
  }

  /* ---------- the district ---------- */
  class Residents {
    constructor(surface, tokens = []) {
      this.s = surface;
      this.game = surface.game;
      this.engine = surface.game.engine;
      this.sp = null;
      this.spec = null;
      this.list = [];
      this.corpses = [];
      this.dying = [];
      this.mending = []; // a world where no one dies (hell): bodies in pieces, finding each other again
      this.stored = new Set();
      this.fx = [];
      this.queuedRubble = [];
      this.t = 0;
      this.d0 = 0;
      this.v0 = 0;
      this.alive = 0;
      this.freedAlive = 0;
      this.kills = 0;
      this.mode = 'none';
      this.calm = false; // a crowd that knows no fear (heaven, until its light goes out)
      this.mixSlots = null;
      this.mixW = null;
      this.haloOff = false; // halos are worn by the living only, and only while the light lasts
      this.ready = false;
      this.alarmClock = 0;
      this.soundClock = 0;
      this.murmur = 0;
      this.nextId = 0;
      this.departed = new Set();
      this.nextStreetSlot = 0;
      this.saved = this.parse(tokens);
      this.living = {};
      this.shade = {};
      this.dead = {};
      this.stains = this.engine.makeBatch('lowDisc', { transparent: true, dynamic: false, capacity: 128 });
      this.all = [this.stains];
      surface.root.batches = this.all;
      this.camFwd = [0, 0, -1];
      this.camRight = [1, 0, 0];
      // Crowd detail follows the frame rate: phones keep moving even in a big crowd.
      this.lodScale = this.game.settings.quality === 'low' ? 0.5 : 1;
      this.lodClock = 0;
      this.grid = new Map();
    }
    parse(tokens) {
      const st = { corpses: [] };
      for (const t of tokens) {
        if (typeof t !== 'string' || !t.startsWith('z.')) continue;
        if (t.startsWith('z.left.')) {
          for (const key of t.slice(7).split('.')) {
            if (/^(?:[a-z]-)?[0-9]{1,7}$/.test(key)) this.departed.add(key);
          }
          continue;
        }
        const m = /^z\.(d0|al|vi|at|ki)\.(\d+)$/.exec(t);
        if (m) {
          st[m[1]] = Number(m[2]);
          continue;
        }
        if (t.startsWith('z.c.') || t.startsWith('z.s.')) {
          const body = t.slice(4),
            torn = t[2] === 's';
          for (let i = 0; i + 7 <= body.length; i += 7) {
            const q = k => B36.indexOf(body[i + k]);
            const xq = q(0) * 36 + q(1),
              zq = q(2) * 36 + q(3),
              tc = q(4),
              yq = q(5),
              pc = q(6);
            if (q(0) < 0 || q(1) < 0 || q(2) < 0 || q(3) < 0 || tc < 0 || yq < 0 || pc < 0) continue;
            st.corpses.push({
              x: xq * 1.25 - 810,
              z: zq * 1.25 - 810,
              type: torn ? 'shred' : TYPES[Math.floor(tc / 6)] || 'fling',
              size: torn ? Math.min(5, tc) : tc % 6,
              yaw: (yq / 36) * TAU,
              pal: pc,
            });
          }
        } else if (t.startsWith('z.f.') || t.startsWith('z.g.')) {
          const body = t.slice(4),
            torn = t[2] === 'g';
          for (let i = 0; i + 9 <= body.length; i += 9) {
            const q = k => B36.indexOf(body[i + k]);
            let bad = false;
            for (let k = 0; k < 9; k++) if (q(k) < 0) bad = true;
            if (bad) continue;
            const xq = (q(0) * 36 + q(1)) * 36 + q(2),
              zq = (q(3) * 36 + q(4)) * 36 + q(5),
              tc = q(6);
            st.corpses.push({
              x: xq / 4 - 5832,
              z: zq / 4 - 5832,
              type: torn ? 'shred' : TYPES[Math.floor(tc / 6)] || 'fling',
              size: torn ? Math.min(5, tc) : tc % 6,
              yaw: (q(7) / 36) * TAU,
              pal: q(8),
            });
          }
        }
      }
      return st;
    }
    addStores(sp) {
      // 'hex' stands in for the round limbs far off
      for (const g of sp.geos.includes('hex') ? sp.geos : sp.geos.concat(['hex'])) {
        this.batch(this.living, g, { capacity: 256 });
        this.batch(this.shade, g, { shadow: true, shadowOnly: true, capacity: 128 });
        this.batch(this.dead, g, { dynamic: false, capacity: 128 });
      }
    }
    batch(store, geo, opts) {
      let b = store[geo];
      if (!b) {
        b = store[geo] = this.engine.makeBatch(geo, opts);
        this.all.push(b);
      }
      return b;
    }
    /* ---------- population ---------- */
    populate(spec) {
      const s = this.s;
      if (!spec || !SPECIES[spec.species]) {
        this.ready = true;
        this.queuedRubble.length = 0;
        return;
      }
      this.spec = spec;
      const sp = (this.sp = SPECIES[spec.species]);
      this.rng = M.rand((spec.seed || s.config.seed || 7) * 7 + 13);
      this.addStores(sp);
      this.calm = !!spec.calm?.();
      if (spec.mix) {
        // fixed slot order (saved bodies remember their slot), weights may change between visits
        this.mixSlots = spec.mix.slots.map(k => SPECIES[k] || null);
        this.mixW = spec.mix.weights.slice();
        for (const m of this.mixSlots) if (m) this.addStores(m);
      }
      let capAll = 0;
      for (const b of s.buildings) {
        b.cap = Math.max(0, Math.round(spec.occupancy ? spec.occupancy(b) : 4 + b.w * b.h * 0.12));
        b.occ = 0;
        capAll += b.cap;
      }
      this.buildGrid();
      this.v0 = spec.count;
      this.d0 = spec.count + capAll;
      const h = spec.deathless ? 0 : Math.min(5, s.ruin),
        st = this.saved,
        intact = s.buildings.filter(b => b.alive && b.cap > 0),
        capIntact = intact.reduce((a, b) => a + b.cap, 0);
      let al, vi, inside, preset = null;
      if (spec.exact) {
        // the world places every one of them itself, and keeps its own count of who has left
        preset = spec.slots();
        vi = al = preset.length;
        inside = 0;
        this.v0 = this.d0 = vi;
      } else if (st.al == null) {
        // First visit under this system: whoever was inside a house that is already rubble died with it.
        vi = Math.round(this.v0 * SURVIVE[h] * (h ? 0.9 : 1));
        inside = 0;
        for (const b of intact) inside += b.occ = Math.round(b.cap * SURVIVE[h]);
        al = vi + inside;
      } else {
        al = st.al;
        vi = st.vi == null ? Math.min(this.v0, al) : st.vi;
        const at = st.at || 0;
        if (at < h) {
          const k = SURVIVE[at] > 0 ? SURVIVE[h] / SURVIVE[at] : 0;
          al = Math.round(al * k);
          vi = Math.round(vi * k);
        }
        vi = Math.min(vi, al);
        inside = Math.max(0, al - vi);
        if (inside > capIntact) {
          vi += inside - capIntact;
          inside = capIntact;
        }
      }
      this.kills = st.ki || 0;
      this.mode = this.calm ? 'first' : spec.mode || (h >= 1 ? 'beg' : this.kills > 0 ? 'wary' : 'first');
      if (!preset && st.al != null && capIntact > 0) {
        let left = inside;
        for (const b of intact) {
          const n = Math.min(b.cap, Math.floor((inside * b.cap) / capIntact));
          b.occ = n;
          left -= n;
        }
        for (let i = 0; left > 0 && i < intact.length * 3; i++) {
          const b = intact[i % intact.length];
          if (b.occ < b.cap) {
            b.occ++;
            left--;
          }
        }
      }
      this.alive = vi + inside;
      // the living outside
      this.outsideCap = spec.cap || OUTSIDE_CAP;
      const limit = Math.min(vi, this.outsideCap);
      // Before source slots were recorded, a profile on the ship is the only
      // surviving evidence of which member of a seeded crowd was recovered.
      const oldCrew = this.departed.size ? [] : this.game.universe.hold.filter(p => p.from === s.id);
      const slots = preset || this.slots(Math.max(this.v0, limit + this.departed.size + oldCrew.length), spec.seed || 1);
      const made = [], perRing = new Map();
      for (let i = 0; i < slots.length && made.length < limit; i++) {
        const sl = slots[i];
        // Advance the original random stream even for absent residents. Otherwise
        // the next person in line inherits the missing passenger's appearance.
        const r = this.make(sl.x, sl.z, { child: sl.child, sp: sl.sp ? SPECIES[sl.sp] : null });
        r.slot = sl;
        r.sourceSlot = sl.ring ? sl.ring + '-' + sl.k : String(this.nextStreetSlot++);
        if (this.departed.has(r.sourceSlot)) continue;
        const legacy = oldCrew.findIndex(p => p.seed === r.seed && p.species === r.sp.key &&
          p.pal === r.pal && p.child === r.child && p.scale === Math.round(r.scale * 1000) / 1000);
        if (legacy >= 0) {
          this.departed.add(r.sourceSlot);
          oldCrew.splice(legacy, 1);
          continue;
        }
        if (sl.ring) {
          const used = perRing.get(sl.ring) || 0;
          if (used >= sl.remaining) continue;
          perRing.set(sl.ring, used + 1);
        }
        made.push(r);
      }
      if (preset) this.alive = this.v0 = this.d0 = made.length;
      this.family(made);
      for (const r of made) this.list.push(r);
      if (this.mode === 'first') this.prepareWelcome(made);
      else if (this.mode === 'beg') for (const r of made) this.begin(r, 'wander');
      if (spec.init) for (const r of made) spec.init(r, r.slot);
      // the dead from before
      for (const c of st.corpses) this.addCorpse(this.unmix({ ...c, sp, save: true, fresh: false }));
      if (h >= 1) this.orbitalDead(h, spec.seed || 1);
      this.ready = true;
      for (const b of this.queuedRubble) this.rubbleBodies(b);
      this.queuedRubble.length = 0;
    }
    slots(n, seed) {
      const s = this.s,
        spec = this.spec,
        rng = M.rand(seed * 31 + 5),
        out = [];
      const [cx, cz] = spec.center || [0, -40],
        R = spec.radius || 230,
        road = spec.road || { x: 12, z0: -60, z1: 190 },
        throne = spec.throne || [0, -100],
        throneR = spec.throneR || 18;
      const sites = s.buildings.filter(b => b.cap > 0);
      let guard = 0;
      while (out.length < n && guard++ < n * 40) {
        const k = rng();
        let x, z;
        const vil = spec.villages || [];
        if (vil.length && k >= 0.3 && k < 0.46) {
          // out in the villages
          const v = vil[(rng() * vil.length) | 0],
            a = rng() * TAU,
            d = 8 + Math.sqrt(rng()) * 70;
          x = v.x + Math.sin(a) * d;
          z = v.z + Math.cos(a) * d;
        } else if (k < 0.3 && sites.length) {
          const b = sites[(rng() * sites.length) | 0],
            a = rng() * TAU,
            d = b.w * 0.62 + 2 + rng() * 9;
          x = b.p[0] + Math.sin(a) * d;
          z = b.p[2] + Math.cos(a) * d;
        } else if (k < 0.52) {
          x = (rng() - 0.5) * 2 * (road.x + 18);
          z = road.z0 + rng() * (road.z1 - road.z0);
        } else {
          const a = rng() * TAU,
            d = (spec.minR || 25) + Math.sqrt(rng()) * (R - (spec.minR || 25));
          x = cx + Math.sin(a) * d;
          z = cz + Math.cos(a) * d;
        }
        if (Math.hypot(x, z) > (spec.maxR || 600)) continue;
        if (Math.hypot(x - throne[0], z - throne[1]) < throneR) continue;
        if (this.blocked(x, z, 1.2)) continue;
        out.push({ x, z, child: rng() < 0.16 });
      }
      while (out.length < n) out.push({ x: (rng() - 0.5) * 200, z: 60 + rng() * 120, child: false });
      return out;
    }
    slotOf(sp) {
      return this.mixSlots ? this.mixSlots.indexOf(sp) : sp === this.sp ? 0 : -1;
    }
    pickMix() {
      let total = 0;
      for (let i = 0; i < this.mixSlots.length; i++) if (this.mixSlots[i]) total += this.mixW[i] || 0;
      let k = this.rng() * total;
      for (let i = 0; i < this.mixSlots.length; i++) {
        if (!this.mixSlots[i] || !(this.mixW[i] > 0)) continue;
        k -= this.mixW[i];
        if (k <= 0) return this.mixSlots[i];
      }
      return this.sp;
    }
    // saved bodies of a mixed district keep their species in the palette digit (slot * 6 + palette)
    unmix(c) {
      if (!this.mixSlots) return c;
      const slot = Math.floor((c.pal | 0) / 6);
      c.sp = this.mixSlots[slot] || this.sp;
      c.pal = (c.pal | 0) % 6;
      return c;
    }
    make(x, z, opt = {}) {
      const sp = opt.sp || (this.mixSlots && !opt.freed ? this.pickMix() : this.sp),
        rng = this.rng,
        child = !!opt.child;
      const scale = child ? sp.child * (0.95 + rng() * 0.12) : sp.scale[0] + rng() * (sp.scale[1] - sp.scale[0]);
      const y = this.s.height(x, z);
      if (!this.stored.has(sp.key)) {
        this.stored.add(sp.key);
        this.addStores(sp);
      }
      return {
        id: 'r' + this.nextId++,
        kind: 'creature',
        res: true,
        sp,
        pal: (rng() * sp.palettes.length) | 0,
        p: [x, y, z],
        velocity: [0, 0, 0],
        node: { p: [x, y, z], r: [0, 0, 0], visible: true },
        radius: sp.radius * scale,
        scale,
        child,
        parent: null,
        kid: null,
        carrier: null,
        yaw: rng() * TAU,
        state: 'wander',
        st: rng() * 4,
        moving: false,
        tx: x,
        tz: z,
        home: [x, z],
        speedK: 0.82 + rng() * 0.36,
        phase: rng() * TAU,
        seed: (rng() * 100000) | 0,
        alive: true,
        dead: false,
        gone: false,
        thrown: false,
        beg: false,
        freed: !!opt.freed,
        fear: 0,
        tx0: 0,
        tz0: 0,
        alarmAt: 0,
        ax: 0,
        az: 0,
        act: (rng() * 6) | 0,
        mouth: 0.05,
        mouthT: 0,
        voiceT: 1 + rng() * 4,
        down: 0,
        downMax: 1,
        cower: 0,
        look: 0,
        lookT: 0,
        slotA: 0,
        slotR: 0,
        injured: false,
        hide: null,
        gx: 0,
        gz: 0,
        spinP: 0,
        spinR: 0,
        vp: 0,
        vr: 0,
        speed: 0,
        noticeAt: 0,
        held: false,
        deathOnLand: false,
        throwCause: 'splat',
      };
    }
    family(list) {
      const adults = list.filter(r => !r.child);
      for (const c of list) {
        if (!c.child) continue;
        let best = null,
          bd = 22;
        for (const a of adults) {
          if (a.kid) continue;
          const d = Math.hypot(a.p[0] - c.p[0], a.p[2] - c.p[2]);
          if (d < bd) {
            bd = d;
            best = a;
          }
        }
        if (best) {
          best.kid = c;
          c.parent = best;
          c.p[0] = best.p[0] + 1.4;
          c.p[2] = best.p[2] + 0.6;
          c.home = best.home;
        }
      }
    }
    prepareWelcome(list) {
      // Some already stand along the approach, looking up at what is coming down.
      const sp = this.s.spawn || { p: [0, 12, 215] };
      const watch = list.filter(r => Math.hypot(r.p[0] - sp.p[0], r.p[2] - sp.p[2]) < 260);
      for (const r of watch) r.noticeAt = 0.2 + (Math.hypot(r.p[0] - sp.p[0], r.p[2] - sp.p[2]) / 48) * (0.6 + this.rng() * 0.8);
      const n = Math.round(list.length * 0.16);
      for (let i = 0; i < n; i++) {
        const r = list[i * 5 % list.length];
        if (r.child) continue;
        const a = (this.rng() - 0.5) * 1.9,
          d = 16 + Math.pow(this.rng(), 0.7) * 44;
        const x = sp.p[0] + Math.sin(a) * d,
          z = sp.p[2] - 20 - Math.cos(a) * d * 0.9;
        if (this.blocked(x, z, 1.2)) continue;
        r.p[0] = x;
        r.p[2] = z;
        r.p[1] = this.s.height(x, z);
        r.home = [x, z];
        if (r.kid) {
          r.kid.p[0] = x + 1.3;
          r.kid.p[2] = z + 0.5;
          r.kid.home = r.home;
        }
        r.noticeAt = 0.01;
      }
    }
    orbitalDead(h, seed) {
      const n = Math.round(this.v0 * (1 - SURVIVE[h]) * 0.75),
        rng = M.rand(seed * 97 + 3),
        slots = this.slots(n, seed * 3 + 11);
      for (let i = 0; i < n; i++)
        this.addCorpse({
          x: slots[i].x,
          z: slots[i].z,
          type: 'charred',
          size: slots[i].child ? 0 : 1 + ((rng() * 5) | 0),
          yaw: rng() * TAU,
          sp: this.sp,
          save: false,
          fresh: false,
        });
    }
    /* ---------- obstacles ---------- */
    buildGrid() {
      this.grid.clear();
      for (const b of this.s.buildings) {
        const hw = b.w * 0.62 + 2;
        for (let gx = Math.floor((b.p[0] - hw) / 20); gx <= Math.floor((b.p[0] + hw) / 20); gx++)
          for (let gz = Math.floor((b.p[2] - hw) / 20); gz <= Math.floor((b.p[2] + hw) / 20); gz++) {
            const key = gx * 1000 + gz;
            if (!this.grid.has(key)) this.grid.set(key, []);
            this.grid.get(key).push(b);
          }
      }
    }
    blocked(x, z, pad) {
      const cell = this.grid.get(Math.floor(x / 20) * 1000 + Math.floor(z / 20));
      if (!cell) return false;
      for (const b of cell) {
        if (!b.alive) continue;
        const hw = b.w * 0.58 + pad;
        if (Math.abs(x - b.p[0]) < hw && Math.abs(z - b.p[2]) < hw) return true;
      }
      return false;
    }
    pushOut(r) {
      const cell = this.grid.get(Math.floor(r.p[0] / 20) * 1000 + Math.floor(r.p[2] / 20));
      if (cell)
        for (const b of cell) {
          if (!b.alive) continue;
          const hw = b.w * 0.58 + 0.5,
            dx = r.p[0] - b.p[0],
            dz = r.p[2] - b.p[2];
          if (Math.abs(dx) < hw && Math.abs(dz) < hw) {
            if (hw - Math.abs(dx) < hw - Math.abs(dz)) r.p[0] = b.p[0] + Math.sign(dx || 1) * hw;
            else r.p[2] = b.p[2] + Math.sign(dz || 1) * hw;
          }
        }
      const th = this.spec?.throne,
        tr = this.spec?.throneR || 0;
      if (th && tr) {
        const dx = r.p[0] - th[0],
          dz = r.p[2] - th[1],
          d = Math.hypot(dx, dz);
        if (d < tr && d > 0.01) {
          r.p[0] = th[0] + (dx / d) * tr;
          r.p[2] = th[1] + (dz / d) * tr;
        }
      }
      const R = Math.hypot(r.p[0], r.p[2]),
        lim = (this.spec?.maxR || 600) + 15;
      if (R > lim) {
        r.p[0] *= lim / R;
        r.p[2] *= lim / R;
      }
      // a district with walls of its own (heaven) keeps its people inside them; hell keeps each in their circle
      this.spec?.clamp?.(r.p, r);
    }
    /* ---------- state helpers ---------- */
    begin(r, state, time = 0) {
      r.state = state;
      r.st = time;
      r.moving = false;
      if (state === 'beg') r.beg = true;
    }
    move(r, dx, dz, speed, dt, turn = 7) {
      const l = Math.hypot(dx, dz);
      if (l < 1e-4 || speed <= 0) {
        r.speed = M.damp(r.speed, 0, 8, dt);
        return;
      }
      dx /= l;
      dz /= l;
      r.p[0] += dx * speed * dt;
      r.p[2] += dz * speed * dt;
      this.pushOut(r);
      r.p[1] = this.s.height(r.p[0], r.p[2]);
      const want = Math.atan2(dx, dz);
      r.yaw += M.angle(r.yaw, want) * Math.min(1, dt * turn);
      r.speed = M.damp(r.speed, speed, 10, dt);
      r.phase += dt * speed * (2.3 / Math.max(0.6, r.sp.dims.legLen * r.scale));
    }
    face(r, x, z, dt, rate = 4) {
      r.yaw += M.angle(r.yaw, Math.atan2(x - r.p[0], z - r.p[2])) * Math.min(1, dt * rate);
    }
    frighten(r, x, z, time) {
      if (this.calm || r.bound) return false;
      if (!r.alive || r.state === 'held' || r.thrown || r.carrier || r.gone) return false;
      r.tx0 = x;
      r.tz0 = z;
      r.fear = Math.max(r.fear, time);
      if (r.state !== 'flee' && r.state !== 'hide') {
        r.state = 'flee';
        r.st = 0;
        r.moving = true;
        if (this.mode === 'beg') r.fear = Math.min(r.fear, 6);
        if (Math.random() < 0.4) this.say(r, Math.random() < 0.5 ? 'scream' : 'cry');
        if (r.kid && r.kid.alive && !r.kid.carrier && Math.hypot(r.kid.p[0] - r.p[0], r.kid.p[2] - r.p[2]) < 5) {
          r.kid.carrier = r;
          r.kid.state = 'carried';
        }
      }
      return true;
    }
    alarm(x, z, radius, kind = 'kill') {
      if (this.calm) return 0;
      let hit = 0;
      for (const r of this.list) {
        if (!r.alive) continue;
        if (Math.hypot(r.p[0] - x, r.p[2] - z) < radius && this.frighten(r, x, z, kind === 'beam' ? 7 : 10 + Math.random() * 6))
          hit++;
      }
      // Once someone has seen it, the word travels outward through the crowd.
      if (hit && this.mode === 'first') {
        this.mode = 'broken';
        for (const r of this.list) {
          if (!r.alive || r.state === 'flee' || r.alarmAt) continue;
          const d = Math.hypot(r.p[0] - x, r.p[2] - z);
          if (d < radius + 300) {
            r.alarmAt = this.t + Math.max(0, d - radius) / 38 + Math.random() * 1.5;
            r.ax = x;
            r.az = z;
          }
        }
      }
      return hit;
    }
    awaken(x, z) {
      if (!this.calm) return;
      this.calm = false;
      this.mode = 'broken';
      for (const r of this.list) {
        if (!r.alive || r.freed) continue;
        const d = Math.hypot(r.p[0] - x, r.p[2] - z);
        r.alarmAt = this.t + 0.5 + d / 55 + Math.random() * 1.4;
        r.ax = x;
        r.az = z;
      }
    }
    /* ---------- deaths ---------- */
    kill(r, cause = 'fling', dir = null) {
      if (!r.alive || !r.res) return;
      if (this.spec?.deathless && !r.freed) return this.unmake(r, cause, dir);
      r.alive = false;
      r.dead = true;
      const v = this.s.vehicle;
      if (v?.grab === r) {
        v.grab = null;
        v.tension = 0;
        this.s.stopTether();
      }
      if (r.freed) this.freedAlive = Math.max(0, this.freedAlive - 1);
      else this.alive = Math.max(0, this.alive - 1);
      this.kills++;
      if (r.kid && r.kid.carrier === r) {
        const k = r.kid;
        k.carrier = null;
        k.p[0] = r.p[0] + 0.8;
        k.p[2] = r.p[2] + 0.8;
        k.p[1] = this.s.height(k.p[0], k.p[2]);
        k.state = this.calm ? 'wander' : 'flee';
        k.down = 1.3;
        k.downMax = 1.3;
        k.fear = 14;
        k.tx0 = r.p[0];
        k.tz0 = r.p[2];
      }
      if (r.carrier) {
        r.carrier.kid = null;
        r.carrier = null;
      }
      const type = CAUSE[cause] || 'fling';
      const yaw = dir ? Math.atan2(dir[0], dir[2]) + (Math.random() - 0.5) * 0.6 : r.yaw;
      const c = this.prep({
        x: r.p[0],
        z: r.p[2],
        type,
        size: sizeClass(r.scale),
        yaw,
        sp: r.sp,
        pal: r.pal,
        save: !r.freed && this.slotOf(r.sp) >= 0,
        fresh: true,
      });
      if (type === 'shred') {
        // the pieces go the way the blast went, further the nearer it was
        c.away = dir ? Math.atan2(dir[0], dir[2]) : yaw;
        c.spread = r.shredSpread || 1.6;
        const nth = (this.shredSounds = (this.shredSounds || 0) + 1);
        if (nth <= 6) this.sound(r, 'shred');
        this.s.emit([r.p[0], r.p[1] + r.sp.center * r.scale, r.p[2]], nth <= 12 ? 7 : 2, r.sp.blood, 10, 1);
      }
      if (type === 'cut') {
        this.cutGlow(r, c);
        this.sound(r, 'cut');
        if (Math.random() < 0.6) this.say(r, 'gasp', 1.2);
      } else if (type === 'crush') this.sound(r, 'crush');
      else if (type === 'splat') this.sound(r, 'splat');
      else if (type === 'fling') this.sound(r, 'thud');
      this.dying.push({ c, t: 0, d: type === 'crush' ? 0.12 : type === 'cut' ? 0.55 : type === 'rubble' ? 0.05 : type === 'shred' ? 0.6 : 0.3 });
      // a few drops, no more: the body stays the thing you look at
      const drops = type === 'crush' || type === 'splat' ? 5 : type === 'rubble' ? 0 : 2;
      if (drops) this.s.emit([r.p[0], r.p[1] + r.sp.center * r.scale, r.p[2]], drops, r.sp.blood, 7, 0.9);
      // whoever loved them stops running
      const kin = this.calm ? null : r.parent?.alive ? r.parent : r.kid?.alive && !r.kid.carrier ? r.kid : null;
      if (kin) {
        kin.gx = r.p[0];
        kin.gz = r.p[2];
        kin.grieve = 6 + Math.random() * 6;
      }
      if (!this.calm)
        for (const o of this.list)
        if (o.alive && !o.grieve && o.state !== 'held' && Math.random() < 0.12) {
          const d = Math.hypot(o.p[0] - r.p[0], o.p[2] - r.p[2]);
          if (d < 14 && d > 1.5) {
            o.gx = r.p[0];
            o.gz = r.p[2];
            o.grieve = 3 + Math.random() * 4;
          }
        }
      this.alarm(r.p[0], r.p[2], 72);
    }
    // Where no one can die: the body comes apart, lies in pieces, and the pieces find each other again.
    unmake(r, cause, dir) {
      r.alive = false;
      const v = this.s.vehicle;
      if (v?.grab === r) {
        v.grab = null;
        v.tension = 0;
        this.s.stopTether();
      }
      r.thrown = false;
      r.held = false;
      r.carrier = null;
      this.kills++;
      const type = CAUSE[cause] || 'fling';
      r.mend = {
        t: 0,
        d: 7 + Math.random() * 5,
        type: type === 'charred' || type === 'rubble' ? 'fling' : type,
        yaw: dir ? Math.atan2(dir[0], dir[2]) : r.yaw,
        seed: (r.seed + this.kills * 131) | 0,
        y: this.spec.mendY ? this.spec.mendY(r) : this.s.height(r.p[0], r.p[2]),
      };
      this.mending.push(r);
      this.sound(r, type === 'cut' ? 'cut' : type === 'crush' ? 'crush' : 'splat');
      this.s.emit([r.p[0], r.p[1] + r.sp.center * r.scale, r.p[2]], 5, r.sp.blood, 8, 0.9);
      if (Math.random() < 0.7) this.say(r, 'scream');
      this.spec.broken?.(r, cause);
      this.alarm(r.p[0], r.p[2], 36);
    }
    lifted(r) {
      if (!r.res || r.gone) return;
      if (!r.freed && r.sourceSlot != null) this.departed.add(r.sourceSlot);
      this.spec?.lifted?.(r);
      r.gone = true;
      r.alive = false;
      if (r.freed) this.freedAlive = Math.max(0, this.freedAlive - 1);
      else this.alive = Math.max(0, this.alive - 1);
      if (r.kid && r.kid.carrier === r) {
        r.kid.carrier = null;
        r.kid.state = this.calm ? 'wander' : 'flee';
      }
    }
    /* ---------- buildings ---------- */
    buildingHit(b) {
      if (!this.sp || !b.occ || b.pouring || b.hp > b.maxHp * 0.82) return;
      b.pouring = true;
      b.pourLeft = Math.min(b.occ, Math.max(3, Math.ceil(b.occ * 0.5)), 42);
      b.pourNext = this.t + 0.15;
      this.alarm(b.p[0], b.p[2], b.w + 30, 'beam');
    }
    collapse(b, dir) {
      if (!this.sp) return;
      const died = b.occ || 0;
      b.occ = 0;
      b.pourLeft = 0;
      if (died) {
        this.alive = Math.max(0, this.alive - died);
        this.kills += died;
        b.died = died;
        const n = Math.min(4, Math.ceil(died / 12));
        for (let i = 0; i < n; i++) setTimeout(() => this.sayAt(b.p, 'muffled', 0.9 + Math.random() * 0.3), i * 140);
      }
      const fx = b.p[0] + (dir?.[0] || 0) * b.h * 0.35,
        fz = b.p[2] + (dir?.[2] || 0) * b.h * 0.35,
        fr = b.w * 0.55 + b.h * 0.22;
      for (const r of this.list) {
        if (!r.alive || r.state === 'held' || r.thrown || r.carrier) continue;
        if (Math.hypot(r.p[0] - fx, r.p[2] - fz) < fr) this.kill(r, 'collapse', dir);
      }
      this.alarm(b.p[0], b.p[2], 125, 'collapse');
    }
    rubbleBodies(b) {
      if (!this.ready) {
        this.queuedRubble.push(b);
        return;
      }
      if (!this.sp || !b.cap) return;
      const n = Math.min(7, Math.round((b.died ?? b.cap) / 9));
      const rng = M.rand(strHash(b.id + '/bodies'));
      for (let i = 0; i < n; i++) {
        const a = rng() * TAU,
          d = rng() * b.w * 0.6;
        this.addCorpse({
          x: b.p[0] + Math.sin(a) * d,
          z: b.p[2] + Math.cos(a) * d,
          type: 'rubble',
          size: rng() < 0.15 ? 0 : 1 + ((rng() * 5) | 0),
          yaw: rng() * TAU,
          sp: this.sp,
          save: false,
          fresh: false,
          rubbleColor: this.s.config.rubble,
        });
      }
    }
    /* ---------- weapons ---------- */
    shock(p, radius, force, shred = false) {
      this.shredSounds = 0;
      for (const r of this.list) {
        if (!r.alive || r.carrier || r.state === 'held') continue;
        const dx = r.p[0] - p[0],
          dz = r.p[2] - p[2],
          dy = r.p[1] + 1 - p[1],
          d = Math.hypot(dx, dy, dz);
        if (d < radius && shred) {
          // the craft's own shockwave: no one inside it stays in one piece
          const k = 1 - d / radius,
            h = Math.hypot(dx, dz) || 1,
            out = [dx / h, 0, dz / h];
          r.shredSpread = 1.1 + k * 2.2;
          const kd = r.kid && r.kid.carrier === r ? r.kid : null;
          this.kill(r, 'shred', out);
          if (kd && kd.alive) {
            kd.p = r.p.slice();
            kd.shredSpread = r.shredSpread * 0.8;
            this.kill(kd, 'shred', out);
          }
          continue;
        }
        if (d < radius) {
          const k = 1 - d / radius,
            h = Math.hypot(dx, dz) || 1,
            lethal = k > 0.32 || force > 150;
          const sp = lethal ? 22 + k * 18 : 8 + k * 6;
          r.velocity = [(dx / h) * sp, (lethal ? 17 : 7) + k * 10, (dz / h) * sp];
          r.thrown = true;
          r.state = 'thrown';
          r.deathOnLand = lethal;
          r.throwCause = 'fling';
          r.vp = (Math.random() - 0.5) * 14;
          r.vr = (Math.random() - 0.5) * 10;
          if (lethal && Math.random() < 0.35) this.say(r, 'scream');
          if (r.kid && r.kid.carrier === r) {
            const kd = r.kid;
            kd.carrier = null;
            kd.thrown = true;
            kd.state = 'thrown';
            kd.deathOnLand = lethal;
            kd.throwCause = 'fling';
            kd.velocity = r.velocity.map(v => v * 0.9);
            kd.p = r.p.slice();
          }
        }
      }
      this.alarm(p[0], p[2], radius * 2.2, 'pulse');
    }
    collide(ship) {
      const speed = M.len(ship.velocity);
      if (speed < 3) return;
      const s = this.s;
      for (const r of this.list) {
        if (!r.alive || r.state === 'held' || r.carrier) continue;
        const dy = ship.p[1] - (r.p[1] + r.sp.center * r.scale);
        if (Math.abs(dy) > 3.4) continue;
        const d = Math.hypot(ship.p[0] - r.p[0], ship.p[2] - r.p[2]);
        if (d > 2.6 + r.radius) continue;
        if (speed > 9) {
          const was = r.beg && !this.spec?.deathless;
          this.kill(r, 'ram', M.norm(ship.velocity));
          if (was) {
            s.crushed++;
            this.game.universe.countLost();
            this.game.ui.toast(
              '생존자를 치었습니다',
              s.crushed > 1 ? s.crushed + '명째입니다.' : '달려오던 사람이었습니다.',
              3,
            );
          }
        } else if (!r.down) {
          r.down = 1.2;
          r.downMax = 1.2;
          const dx = r.p[0] - ship.p[0],
            dz = r.p[2] - ship.p[2],
            l = Math.hypot(dx, dz) || 1;
          r.p[0] += (dx / l) * 1.2;
          r.p[2] += (dz / l) * 1.2;
          this.frighten(r, ship.p[0], ship.p[2], 9);
        }
      }
    }
    raycast(o, d, max) {
      let best = null,
        dist = max;
      for (const r of this.list) {
        if (!r.alive || r.carrier) continue;
        const sc = r.scale,
          lying = r.down > 0 || r.state === 'crawl' || r.cower > 0;
        const cy = r.p[1] + (lying ? 0.5 : r.sp.center) * sc;
        const px = o[0] - r.p[0],
          py = o[1] - cy,
          pz = o[2] - r.p[2];
        const b = px * d[0] + py * d[1] + pz * d[2];
        if (b > 0) continue;
        const rad = r.radius * (lying ? 1.2 : 1) + 0.45,
          c = px * px + py * py + pz * pz - rad * rad,
          h = b * b - c;
        if (h < 0) continue;
        const t = Math.max(0, -b - Math.sqrt(h));
        if (t < dist) {
          dist = t;
          best = r;
        }
      }
      return best ? { entity: best, distance: dist } : null;
    }
    /* ---------- release of survivors carried back from the mothership ---------- */
    release(ids) {
      const s = this.s,
        sp0 = s.spawn || { p: [0, 12, 215] };
      if (!this.rng) this.rng = M.rand(911);
      const out = [];
      ids.forEach((person, i) => {
        const key = person.species,
          sp = SPECIES[key] || SPECIES.subject;
        const a = (i / ids.length) * TAU,
          d = 9 + (i % 4) * 3;
        const x = sp0.p[0] + Math.sin(a) * d,
          z = sp0.p[2] - 34 + Math.cos(a) * d;
        const r = this.make(x, z, { sp, freed: true, child: person.child });
        r.passenger = person;
        r.pal = person.pal % sp.palettes.length;
        r.scale = person.scale;
        r.radius = sp.radius * r.scale;
        r.seed = person.seed;
        r.home = [x, z];
        r.yaw = Math.atan2(-Math.sin(a), -Math.cos(a));
        r.state = 'freed';
        r.st = 6 + Math.random() * 7;
        r.native = person.from === s.id;
        this.list.push(r);
        out.push(r);
        this.addStores(sp);
      });
      this.freedAlive += out.length;
      return out;
    }
    /* ---------- update ---------- */
    update(dt) {
      if (!this.ready) return;
      this.t += dt;
      const s = this.s,
        ship = s.vehicle,
        cam = this.engine.camera;
      this.camFwd = M.dir(cam.yaw, cam.pitch);
      this.camRight = M.right(cam.yaw);
      const sx = ship.p[0],
        sz = ship.p[2],
        sg = s.height(sx, sz),
        alt = ship.p[1] - sg,
        landing = this.game.descent > 0;
      // a hovering destroyer firing into a crowd frightens them before anyone dies
      let i = 0;
      for (const r of this.list) {
        if (r.alive) this.think(r, dt, sx, sz, sg, alt, landing, ship);
      }
      // compact
      for (let k = 0; k < this.list.length; k++) {
        const r = this.list[k];
        if (r.alive || (r.thrown && !r.dead)) this.list[i++] = r;
      }
      this.list.length = i;
      this.pour(dt);
      for (let k = this.mending.length - 1; k >= 0; k--) {
        const r = this.mending[k],
          m = r.mend;
        m.t += dt;
        if (m.t < m.d) continue;
        this.mending.splice(k, 1);
        r.mend = null;
        r.alive = true;
        r.dead = false;
        r.gone = false;
        r.velocity = [0, 0, 0];
        r.down = 1.5;
        r.downMax = 1.5;
        this.spec.mended?.(r);
        this.list.push(r);
        if (Math.random() < 0.6) this.say(r, 'sob');
      }
      for (let k = this.dying.length - 1; k >= 0; k--) {
        const d = this.dying[k];
        d.t += dt;
        if (d.t >= d.d) {
          this.dying.splice(k, 1);
          this.addCorpse(d.c);
        }
      }
      this.updateFX(dt);
      this.ambience(dt, sx, sz);
      this.lodClock += dt;
      if (this.lodClock > 1.5) {
        this.lodClock = 0;
        const fps = this.game.fps || 60,
          top = this.game.settings.quality === 'low' ? 0.55 : 1;
        if (fps < 34) this.lodScale = Math.max(0.35, this.lodScale * 0.82);
        else if (fps > 52) this.lodScale = Math.min(top, this.lodScale * 1.08);
        else this.lodScale = Math.min(top, this.lodScale);
      }
      this.render();
    }
    think(r, dt, sx, sz, sg, alt, landing, ship) {
      const sp = r.sp,
        t = this.t;
      r.mouthT = Math.max(0, r.mouthT - dt);
      r.mouth = M.damp(r.mouth, r.mouthT > 0 ? 0.85 + Math.sin(t * 23 + r.seed) * 0.15 : 0.05, 14, dt);
      r.voiceT -= dt;
      if (ship.grab === r) {
        if (!r.held) {
          r.held = true;
          this.alarm(r.p[0], r.p[2], 55, 'grab');
          this.say(r, 'scream');
          if (r.kid && r.kid.carrier === r) {
            r.kid.carrier = null;
            r.kid.state = 'flee';
            r.kid.p = r.p.slice();
            r.kid.down = 1;
          }
        }
        r.state = 'held';
        r.thrown = false;
        if (r.voiceT <= 0) {
          r.voiceT = 0.8 + Math.random() * 0.9;
          this.say(r, 'scream');
        }
        r.mouthT = 0.3;
        return;
      }
      if (r.held) {
        r.held = false;
        r.deathOnLand = false;
        r.throwCause = 'splat';
        r.vp = (Math.random() - 0.5) * 9;
        r.vr = (Math.random() - 0.5) * 9;
        if (!r.thrown) r.state = this.calm ? 'wander' : 'flee';
        else r.state = 'thrown';
      }
      if (r.thrown) return this.fly(r, dt);
      if (r.carrier) {
        if (!r.carrier.alive) r.carrier = null;
        else {
          r.p[0] = r.carrier.p[0];
          r.p[1] = r.carrier.p[1];
          r.p[2] = r.carrier.p[2];
          r.yaw = r.carrier.yaw;
          if (r.voiceT <= 0 && r.carrier.state === 'flee') {
            r.voiceT = 2 + Math.random() * 3;
            this.say(r, 'cry', 1.35);
          }
          return;
        }
      }
      if (r.alarmAt && t >= r.alarmAt) {
        r.alarmAt = 0;
        this.frighten(r, r.ax, r.az, 9 + Math.random() * 6);
      }
      if (r.down > 0) {
        r.down -= dt;
        r.speed = 0;
        return;
      }
      // a world with ways of its own (hell) moves its people itself, and hands them back when they should beg
      if (this.spec?.think && this.spec.think(r, dt, t, ship, this)) return;
      const dxs = sx - r.p[0],
        dzs = sz - r.p[2],
        ds = Math.hypot(dxs, dzs);
      // grief overrides running once the threat is not right on top of them
      if (r.grieve > 0 && r.state !== 'held') {
        const near = ds < 24 && alt < 40;
        if (!near) {
          const gx = r.gx - r.p[0],
            gz = r.gz - r.p[2],
            gd = Math.hypot(gx, gz);
          if (gd > 1.7) {
            this.move(r, gx, gz, sp.jog * r.speedK, dt);
            r.st = 0;
          } else {
            r.state = 'grieve';
            this.face(r, r.gx, r.gz, dt);
            r.grieve -= dt;
            r.speed = 0;
            if (r.voiceT <= 0) {
              r.voiceT = 1.1 + Math.random() * 1.6;
              this.say(r, 'sob');
            }
            if (r.grieve <= 0) {
              r.grieve = 0;
              r.state = this.mode === 'beg' ? 'beg' : 'flee';
              r.fear = Math.max(r.fear, 5);
            }
          }
          return;
        }
        r.grieve = 0;
      }
      switch (r.state) {
        case 'freed': {
          r.st -= dt;
          r.speed = 0;
          if (r.st <= 0) this.begin(r, 'wander', 2);
          break;
        }
        case 'gather': {
          if (this.mode !== 'first') {
            this.begin(r, 'wander', 1);
            break;
          }
          const tx = sx - Math.sin(r.slotA) * r.slotR,
            tz = sz - Math.cos(r.slotA) * r.slotR;
          const dx = tx - r.p[0],
            dz = tz - r.p[2],
            d = Math.hypot(dx, dz);
          if (d > 2.2 && !(alt > 160 || ds > 320)) {
            this.move(r, dx, dz, (d > 30 ? sp.jog : sp.walk) * r.speedK, dt);
            r.moving = true;
          } else {
            r.moving = false;
            r.speed = M.damp(r.speed, 0, 6, dt);
            this.face(r, sx, sz, dt, 2.5);
            if (r.voiceT <= 0) {
              r.voiceT = 5 + Math.random() * 9;
              if (Math.random() < 0.45) this.say(r, 'call', 0.9);
            }
          }
          break;
        }
        case 'flee': {
          r.fear -= dt;
          if (r.fear <= 0) {
            if (this.mode === 'beg') this.begin(r, 'beg');
            else this.begin(r, 'wander', 1 + Math.random() * 2);
            break;
          }
          if (r.cower > 0) {
            r.cower -= dt;
            r.speed = 0;
            if (r.cower <= 0 && ds < 10) r.cower = 0.6;
            break;
          }
          const threatShip = ds < 45 && alt < 60;
          let fx = threatShip ? r.p[0] - sx : r.p[0] - r.tx0,
            fz = threatShip ? r.p[2] - sz : r.p[2] - r.tz0;
          const fl = Math.hypot(fx, fz) || 1;
          fx /= fl;
          fz /= fl;
          const wob = Math.sin(t * 1.3 + r.seed) * 0.6,
            wx = fx - fz * wob,
            wz = fz + fx * wob;
          fx = wx;
          fz = wz;
          if (threatShip && ds < 8 && alt < 10 && Math.random() < dt * 0.9) {
            r.cower = 1 + Math.random() * 1.5;
            this.say(r, 'cry');
            break;
          }
          if (r.lookT > 0) {
            r.lookT -= dt;
            r.speed = M.damp(r.speed, 0, 8, dt);
            break;
          }
          if (Math.random() < dt * 0.09) r.lookT = 0.5 + Math.random() * 0.7;
          if (r.speed > 3 && Math.random() < dt * (r.child ? 0.09 : 0.045)) {
            r.down = 0.8 + Math.random() * 1.2;
            r.downMax = r.down;
            this.say(r, 'gasp');
            break;
          }
          if (!r.child && !r.hide && Math.random() < dt * 0.4) {
            const b = this.shelter(r);
            if (b) {
              r.hide = b;
              r.state = 'hide';
              break;
            }
          }
          const run = sp.run * r.speedK * (r.kid?.carrier === r ? 0.78 : 1) * (r.child ? 0.68 : 1);
          this.move(r, fx, fz, run, dt, 5);
          if (r.voiceT <= 0) {
            r.voiceT = 1.3 + Math.random() * 2.6;
            this.say(r, Math.random() < 0.2 ? 'scream' : 'cry');
          }
          break;
        }
        case 'hide': {
          const b = r.hide;
          if (!b || !b.alive || b.pouring) {
            r.hide = null;
            r.state = 'flee';
            r.fear = Math.max(r.fear, 4);
            break;
          }
          const dx = r.p[0] - b.p[0],
            dz = r.p[2] - b.p[2],
            l = Math.hypot(dx, dz) || 1,
            edge = b.w * 0.6 + 0.4;
          const tx = b.p[0] + (dx / l) * edge,
            tz = b.p[2] + (dz / l) * edge;
          if (Math.hypot(tx - r.p[0], tz - r.p[2]) < 1.3 || l < edge + 0.6) {
            this.enter(r, b);
            break;
          }
          this.move(r, tx - r.p[0], tz - r.p[2], sp.run * r.speedK * 0.95, dt, 6);
          break;
        }
        case 'beg': {
          if (ds > 340) {
            this.wander(r, dt);
            break;
          }
          const slotR = r.slotR || (r.slotR = 8 + Math.random() * 6);
          if (!r.slotA) r.slotA = Math.atan2(dxs, dzs) + (Math.random() - 0.5) * 0.8;
          const tx = sx - Math.sin(r.slotA) * slotR,
            tz = sz - Math.cos(r.slotA) * slotR;
          const dx = tx - r.p[0],
            dz = tz - r.p[2],
            d = Math.hypot(dx, dz);
          if (d > 1.8) {
            const v = r.injured ? 0.75 : (d > 25 ? sp.run * 0.8 : sp.jog * 1.2) * r.speedK;
            this.move(r, dx, dz, v, dt, 6);
            r.moving = true;
          } else {
            r.moving = false;
            r.speed = M.damp(r.speed, 0, 6, dt);
            this.face(r, sx, sz, dt, 3);
          }
          if (r.voiceT <= 0) {
            r.voiceT = 1.6 + Math.random() * 2.4;
            this.say(r, d > 15 ? 'call' : 'plea');
          }
          break;
        }
        default:
          this.wander(r, dt, sx, sz, ds, alt, landing);
      }
    }
    wander(r, dt, sx = 0, sz = 0, ds = 1e9, alt = 0) {
      const t = this.t;
      // first contact: the destroyer is noticed, and they come to look
      if (this.mode === 'first' && !r.freed) {
        if (!r.noticeAt && ds < (this.calm ? 700 : 250) && Math.random() < dt * 0.4) r.noticeAt = t + ds / 45 + Math.random() * 3;
        if (r.noticeAt && t >= r.noticeAt) {
          r.state = 'gather';
          r.slotA = Math.atan2(sx - r.p[0], sz - r.p[2]) + (Math.random() - 0.5) * 0.5;
          r.slotR = 11 + Math.pow(Math.random(), 0.65) * 30;
          if (r.kid) {
            r.kid.state = 'gather';
            r.kid.slotA = r.slotA + 0.06;
            r.kid.slotR = r.slotR - 1.2;
          }
          return;
        }
      } else if (this.mode === 'beg' && !r.freed) {
        if (ds < 220) {
          r.state = 'beg';
          r.beg = true;
          r.injured = r.injured || hash(r.seed, 77) < 0.22;
          return;
        }
      } else if ((this.mode === 'wary' || this.mode === 'broken') && !r.freed && ds < 70 && alt < 70) {
        this.frighten(r, sx, sz, 6 + Math.random() * 4);
        return;
      }
      r.st -= dt;
      if (r.parent && r.parent.alive && !r.parent.gone) {
        const px = r.parent.p[0] + Math.sin(r.parent.yaw + 1.6) * 1.4 - r.p[0],
          pz = r.parent.p[2] + Math.cos(r.parent.yaw + 1.6) * 1.4 - r.p[2];
        if (Math.hypot(px, pz) > 1.2) this.move(r, px, pz, Math.min(r.sp.jog, Math.hypot(px, pz) * 1.5), dt);
        else r.speed = M.damp(r.speed, 0, 6, dt);
        return;
      }
      if (r.st <= 0) {
        if (r.moving || Math.random() < 0.45) {
          r.moving = false;
          r.st = 2 + Math.random() * 5;
          r.talk = Math.random() < 0.35;
        } else {
          const a = Math.random() * TAU,
            d = 4 + Math.random() * 16;
          r.tx = r.home[0] + Math.sin(a) * d;
          r.tz = r.home[1] + Math.cos(a) * d;
          r.moving = true;
          r.st = 9;
        }
      }
      if (r.moving) {
        const dx = r.tx - r.p[0],
          dz = r.tz - r.p[2];
        if (Math.hypot(dx, dz) < 0.8) {
          r.moving = false;
          r.st = 1 + Math.random() * 4;
        } else this.move(r, dx, dz, r.sp.walk * r.speedK, dt, 3);
      } else r.speed = M.damp(r.speed, 0, 6, dt);
    }
    fly(r, dt) {
      const s = this.s;
      r.velocity[1] -= 22 * dt;
      // set down by the beam rather than dropped: a slow descent, feet first
      if (r.lowered) {
        const k = Math.exp(-2.4 * dt);
        r.velocity[0] *= k;
        r.velocity[2] *= k;
        r.velocity[1] = Math.max(r.velocity[1], -11);
        r.spinP = M.damp(r.spinP || 0, 0, 4, dt);
        r.spinR = M.damp(r.spinR || 0, 0, 4, dt);
        r.vp = r.vr = 0;
      }
      r.p[0] += r.velocity[0] * dt;
      r.p[1] += r.velocity[1] * dt;
      r.p[2] += r.velocity[2] * dt;
      r.spinP += r.vp * dt;
      r.spinR += r.vr * dt;
      r.mouthT = 0.2;
      const v = Math.hypot(r.velocity[0], r.velocity[1], r.velocity[2]);
      for (const b of s.buildings) {
        if (!b.alive) continue;
        if (
          Math.abs(r.p[0] - b.p[0]) < b.w * 0.55 + 0.6 &&
          Math.abs(r.p[2] - b.p[2]) < b.w * 0.55 + 0.6 &&
          r.p[1] > b.p[1] - 1 &&
          r.p[1] < b.p[1] + b.h &&
          v > 15
        ) {
          s.damage(b, v * 2.5, M.norm(r.velocity), 'throw');
          r.thrown = false;
          const l = Math.hypot(r.p[0] - b.p[0], r.p[2] - b.p[2]) || 1;
          r.p[0] = b.p[0] + ((r.p[0] - b.p[0]) / l) * (b.w * 0.62 + 0.8);
          r.p[2] = b.p[2] + ((r.p[2] - b.p[2]) / l) * (b.w * 0.62 + 0.8);
          r.p[1] = s.height(r.p[0], r.p[2]);
          this.kill(r, 'splat', M.norm(r.velocity));
          return;
        }
      }
      const floor = s.height(r.p[0], r.p[2]);
      if (r.p[1] <= floor) {
        r.p[1] = floor;
        if ((v > 14 || r.deathOnLand) && !r.lowered) {
          r.thrown = false;
          this.kill(r, r.throwCause || 'splat', M.norm([r.velocity[0], 0, r.velocity[2]]));
          return;
        }
        const soft = r.lowered;
        r.lowered = false;
        r.thrown = false;
        r.velocity = [0, 0, 0];
        r.down = soft ? 0.5 : 1.2 + Math.random();
        r.downMax = r.down;
        r.state = this.calm ? 'wander' : this.mode === 'beg' ? 'beg' : 'flee';
        r.fear = this.calm ? 0 : Math.max(r.fear, 8);
        this.sound(r, 'thud', 0.5);
      }
    }
    shelter(r) {
      // An undamaged house, not on the side the danger is coming from.
      let best = null,
        bd = 38;
      const tx = r.p[0] - r.tx0,
        tz = r.p[2] - r.tz0;
      for (const b of this.s.buildings) {
        if (!b.alive || !b.cap || b.pouring || b.occ >= b.cap || b.hp < b.maxHp * 0.95) continue;
        const dx = b.p[0] - r.p[0],
          dz = b.p[2] - r.p[2],
          d = Math.hypot(dx, dz) - b.w * 0.6;
        if (d > bd || dx * tx + dz * tz < -0.3 * Math.hypot(dx, dz) * Math.hypot(tx, tz)) continue;
        bd = d;
        best = b;
      }
      return best;
    }
    enter(r, b) {
      r.alive = false;
      r.gone = true;
      b.occ++;
      if (r.kid && r.kid.carrier === r) {
        r.kid.alive = false;
        r.kid.gone = true;
        r.kid.carrier = null;
        b.occ++;
      }
    }
    pour(dt) {
      if (!this.sp) return;
      const ship = this.s.vehicle.p;
      for (const b of this.s.buildings) {
        if (!b.pouring || !b.alive || b.pourLeft <= 0 || b.occ <= 0) continue;
        if (this.t < b.pourNext) continue;
        if (this.list.length >= (this.outsideCap || OUTSIDE_CAP)) continue;
        b.pourNext = this.t + 0.12 + Math.random() * 0.25;
        b.pourLeft--;
        b.occ--;
        let dx = b.p[0] - ship[0],
          dz = b.p[2] - ship[2];
        const l = Math.hypot(dx, dz) || 1,
          a = Math.atan2(dx / l, dz / l) + (Math.random() - 0.5) * 1.8,
          d = b.w * 0.62 + 0.9;
        const x = b.p[0] + Math.sin(a) * d,
          z = b.p[2] + Math.cos(a) * d;
        const r = this.make(x, z, { child: Math.random() < 0.15 });
        while (this.departed.has(String(this.nextStreetSlot))) this.nextStreetSlot++;
        r.sourceSlot = String(this.nextStreetSlot++);
        r.yaw = a;
        r.home = [x, z];
        this.list.push(r);
        if (this.mode === 'beg') {
          r.state = 'beg';
          r.beg = true;
        } else this.frighten(r, b.p[0], b.p[2], 10 + Math.random() * 6);
        if (Math.random() < 0.3) this.say(r, 'scream');
      }
    }
    /* ---------- sound ---------- */
    where(p) {
      const cam = this.engine.camera.p,
        dx = p[0] - cam[0],
        dy = p[1] - cam[1],
        dz = p[2] - cam[2],
        d = Math.hypot(dx, dy, dz) || 1;
      const pan = (dx * this.camRight[0] + dz * this.camRight[2]) / d;
      const gain = Math.pow(Math.max(0, 1 - d / 240), 1.6);
      return [pan * 0.85, gain];
    }
    say(r, kind, pitch = 1) {
      if (this.calm) return;
      r.mouthT = kind === 'sob' ? 0.4 : kind === 'scream' ? 0.9 : 0.45;
      const [pan, gain] = this.where(r.p);
      this.game.audio.voice(r.sp.voice, kind, pan, gain, pitch * (r.child ? 1.35 : 1) * (0.92 + hash(r.seed, 5) * 0.16));
    }
    sayAt(p, kind, pitch = 1) {
      if (!this.sp || this.calm) return;
      const [pan, gain] = this.where(p);
      this.game.audio.voice(this.sp.voice, kind, pan, gain, pitch);
    }
    sound(r, kind, k = 1) {
      const [pan, gain] = this.where(r.p);
      this.game.audio.gore(kind, pan, Math.min(1, gain * 1.4) * k);
    }
    ambience(dt, sx, sz) {
      const audio = this.game.audio;
      let near = 0,
        scared = 0;
      for (const r of this.list) {
        if (!r.alive) continue;
        const d = Math.hypot(r.p[0] - sx, r.p[2] - sz);
        if (d < 150) {
          near++;
          if (r.state === 'flee' || r.state === 'held') scared++;
        }
      }
      let hidden = 0;
      for (const b of this.s.buildings) if (b.alive && b.occ > 0 && Math.hypot(b.p[0] - sx, b.p[2] - sz) < 120) hidden += b.occ;
      const total = this.alive + this.freedAlive;
      const level = total > 0 && !this.calm && !this.spec?.quiet ? Math.min(1, (near + Math.min(30, hidden * 0.08)) / 42) : 0;
      this.murmur = level;
      audio.ambience(dt, level, near ? scared / near : 0, this.sp?.voice || 'subject', this.s.config.wind ?? (total > 0 ? 0.045 : 0.11));
    }
    /* ---------- effects ---------- */
    cutGlow(r, c) {
      const s = this.s,
        y = r.p[1] + r.sp.dims.hipY * r.scale,
        w = r.sp.dims.shoulderX * 1.5 * r.scale;
      for (const half of ['capU', 'capL']) {
        const n = K.mesh(s.fxRoot, 'lowSphere', [r.p[0], y, r.p[2]], [w, w * 0.45, w], '#ff8a3a', { em: 2.4, type: 1 });
        this.fx.push({ node: n, life: 7, max: 7, kind: 'glow', c, half });
      }
      this.fx.push({ kind: 'smoke', p: [r.p[0], y, r.p[2]], life: 6, next: 0, c });
    }
    updateFX(dt) {
      const root = this.s.fxRoot;
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i];
        f.life -= dt;
        if (f.kind === 'smoke') {
          if (f.c?.capL) f.p = f.c.capL;
          f.next -= dt;
          if (f.next <= 0 && f.life > 0 && this.fx.length < 90) {
            f.next = 0.22;
            const n = K.mesh(root, 'lowSphere', [f.p[0] + (Math.random() - 0.5), f.p[1], f.p[2] + (Math.random() - 0.5)], [0.6, 0.6, 0.6], '#6b6763', {
              alpha: 0.45,
            });
            this.fx.push({ node: n, life: 2.4, max: 2.4, kind: 'puff', vy: 1.3 + Math.random() });
          }
          if (f.life <= 0) this.fx.splice(i, 1);
          continue;
        }
        if (f.life <= 0) {
          root.remove(f.node);
          this.fx.splice(i, 1);
          continue;
        }
        const k = f.life / f.max;
        if (f.kind === 'glow') {
          const at = f.c?.[f.half];
          if (at) {
            f.node.p[0] = at[0];
            f.node.p[1] = at[1];
            f.node.p[2] = at[2];
          }
          f.node.em = 0.2 + 2.2 * k * k;
          f.node.color[0] = 0.25 + 0.75 * k;
          f.node.color[1] = 0.12 + 0.42 * k;
          f.node.color[2] = 0.08 + 0.15 * k;
        } else if (f.kind === 'puff') {
          f.node.p[1] += f.vy * dt;
          const sc = 0.6 + (1 - k) * 2.2;
          f.node.s = [sc, sc, sc];
          f.node.alpha = 0.42 * k;
        }
      }
    }
    /* ---------- bodies ---------- */
    prep(c) {
      const sp = (c.sp ||= this.sp),
        xq = M.clamp(Math.round((c.x + 810) / 1.25), 0, 1295),
        zq = M.clamp(Math.round((c.z + 810) / 1.25), 0, 1295);
      if (c.seed == null) c.seed = (xq * 1297 + zq) * 7 + Math.max(0, TYPES.indexOf(c.type));
      if (c.pal == null) c.pal = (hash(c.seed, 9) * sp.palettes.length) | 0;
      c.pal = Math.min(sp.palettes.length - 1, c.pal);
      if (c.scale == null) c.scale = SIZES[c.size ?? 3] * (0.97 + hash(c.seed, 10) * 0.06);
      return c;
    }
    addCorpse(c) {
      const sp = c.sp || this.sp;
      if (!sp) return;
      c.sp = sp;
      this.prep(c);
      this.corpses.push(c);
      this.drawCorpse(c, this.dead, 1);
      this.stain(c);
    }
    stain(c) {
      const sp = c.sp,
        y = this.s.height(c.x, c.z) + 0.2 + hash(c.seed, 40) * 0.015,
        b = this.stains;
      let w = 2.3,
        l = 2.3,
        col = sp.blood,
        a = 0.74;
      if (c.type === 'crush') {
        w = 2.1;
        l = 5.8;
      } else if (c.type === 'splat') {
        w = l = 3.6;
      } else if (c.type === 'cut') {
        w = 1.9;
        l = 3.6;
      } else if (c.type === 'charred') {
        w = l = 3.4;
        col = sp.scorch;
        a = 0.82;
      } else if (c.type === 'rubble') {
        w = l = 2.6;
        a = 0.6;
      }
      w *= c.scale;
      l *= c.scale;
      const d = this.engine.growBatch(b, b.count + 1),
        o = b.count * 24;
      trs(d, o, c.x, y, c.z, 0, c.yaw, 0, w, 0.02, l);
      d[o + 16] = col[0];
      d[o + 17] = col[1];
      d[o + 18] = col[2];
      d[o + 19] = a;
      d[o + 20] = 0;
      d[o + 21] = 6;
      d[o + 22] = 0;
      d[o + 23] = 0;
      b.count++;
    }
    /* Place one body (or its two halves) using the resting pose. k < 1 = still falling. */
    drawCorpse(c, store, k, live = false) {
      const sp = c.sp,
        sc = c.scale,
        y = this.s.height(c.x, c.z),
        dir = c.yaw;
      if (c.type === 'shred') return this.drawShred(c, store, k, live);
      const halves = c.type === 'cut' ? ['u', 'l'] : [null];
      for (const half of halves) {
        corpsePose(c.type, c.seed, half);
        const end = {};
        for (const key of QKEYS) end[key] = Q[key];
        const sup = end.rp < 0;
        // the body lies with its hips near (x,z); root (feet) offset along the body axis
        const along = sp.dims.hipY * sc * (half === 'u' ? 0.2 : 1) * (half === 'l' ? 0.55 : 1);
        let ox = 0,
          oz = 0;
        if (half === 'u') {
          const a = dir + 1.3 + hash(c.seed, 60) * 0.8;
          ox = Math.sin(a) * (0.7 + hash(c.seed, 61) * 0.9) * sc;
          oz = Math.cos(a) * (0.7 + hash(c.seed, 61) * 0.9) * sc;
        }
        const bx = c.x + ox - Math.sin(dir) * along * (sup ? -1 : 1),
          bz = c.z + oz - Math.cos(dir) * along * (sup ? -1 : 1);
        if (k < 1) {
          resetQ();
          const e = smooth(k);
          for (const key of QKEYS) Q[key] = Q[key] + (end[key] - Q[key]) * e;
          const fx = c.x + (bx - c.x) * e,
            fz = c.z + (bz - c.z) * e;
          bones(BONES, sp, fx, y, fz, dir, sc);
        } else bones(BONES, sp, bx, y, bz, dir, sc);
        const cols = c.type === 'charred' ? sp.charred[c.pal] : sp.colors[c.pal];
        // the first few hundred bodies keep faces and hands; after that the field of dead is drawn plainer
        const det = c.type === 'charred' || c.type === 'rubble' || (!live && this.corpses.length > 320) ? 0 : 1;
        this.emit(sp, cols, BONES, store, det, half, Q.mouth, c.type === 'charred');
        if (half && c.type === 'cut') {
          const o = half === 'u' ? 32 : 16;
          c[half === 'u' ? 'capU' : 'capL'] = [BONES[o + 12], BONES[o + 13] + (half === 'u' ? 0 : 0.06 * sc), BONES[o + 14]];
        }
        if (half) this.cap(sp, BONES, store, half, live);
        if (c.type === 'rubble') this.rubbleOver(c, BONES, store);
      }
    }
    // a body torn apart: its pieces flung out the way the blast went, lying where they came down, a dark smear under them
    drawShred(c, store, k, live) {
      const sp = c.sp,
        sc = c.scale,
        y = this.s.height(c.x, c.z),
        e = live ? smooth(Math.min(1, k)) : 1,
        spread = (c.spread || 1.6) * sc,
        away = c.away ?? hash(c.seed, 41) * TAU;
      corpsePose('splat', c.seed, null);
      bones(BONES, sp, c.x, y, c.z, c.yaw, sc);
      const det = !live && this.corpses.length > 320 ? 0 : 1,
        arc = live && k < 1 ? Math.sin(Math.min(1, k) * Math.PI) * (0.8 + spread * 0.5) : 0;
      this.emit(sp, sp.colors[c.pal], BONES, store, det, null, Q.mouth, false, false, false, Math.max(0.05, spread * e), c.seed, 0, away, arc);
      if (!live || k > 0.6) {
        const b = store.lowDisc || this.batch(store, 'lowDisc', { dynamic: !!live });
        const d = this.engine.growBatch(b, b.count + 1),
          o = b.count * 24,
          w = (0.7 + spread * 0.5) * (live ? Math.min(1, (k - 0.6) / 0.4) : 1);
        trs(d, o, c.x + Math.sin(away) * spread * 0.45, y + 0.03, c.z + Math.cos(away) * spread * 0.45, 0, away, 0, w, 0.04, w * 1.35);
        const col = sp.blood || sp.capColor;
        d[o + 16] = col[0] * 0.75;
        d[o + 17] = col[1] * 0.75;
        d[o + 18] = col[2] * 0.75;
        d[o + 19] = 1;
        d[o + 20] = 0;
        d[o + 21] = 0;
        d[o + 22] = 0;
        d[o + 23] = 0;
        b.count++;
      }
    }
    cap(sp, Bo, store, half, live) {
      const b = store.lowDisc || this.batch(store, 'lowDisc', { dynamic: !!live });
      const d = this.engine.growBatch(b, b.count + 1),
        o = b.count * 24,
        w = sp.dims.shoulderX * 1.6;
      trs(T, 0, 0, half === 'u' ? 0.02 : 0.06, 0, 0, 0, 0, w, 0.05, w * 0.72);
      mul(d, o, Bo, half === 'u' ? 32 : 16, T, 0);
      const col = sp.capColor;
      d[o + 16] = col[0];
      d[o + 17] = col[1];
      d[o + 18] = col[2];
      d[o + 19] = 1;
      d[o + 20] = 0;
      d[o + 21] = 0;
      d[o + 22] = 0;
      d[o + 23] = 0;
      b.count++;
    }
    rubbleOver(c, Bo, store) {
      const b = store.box,
        col = rgb(c.rubbleColor || this.s.config.rubble || '#8a8a8a');
      for (let i = 0; i < 3; i++) {
        const d = this.engine.growBatch(b, b.count + 1),
          o = b.count * 24,
          s = 1.2 + hash(c.seed, 70 + i) * 1.4;
        trs(T, 0, (hash(c.seed, 80 + i) - 0.5) * 0.8, 0.4 + i * 0.5, 0.3 + (hash(c.seed, 90 + i) - 0.5) * 0.6, hash(c.seed, 95 + i) * 2, hash(c.seed, 96 + i) * 6, hash(c.seed, 97 + i), s, s * 0.7, s);
        mul(d, o, Bo, 32, T, 0);
        d[o + 16] = col[0] * 0.85;
        d[o + 17] = col[1] * 0.85;
        d[o + 18] = col[2] * 0.85;
        d[o + 19] = 1;
        d[o + 20] = 0;
        d[o + 21] = 0;
        d[o + 22] = 0;
        d[o + 23] = 0;
        b.count++;
      }
    }
    emit(sp, cols, Bo, store, lod, half, mouth, dark, bigOnly = false, alive = false, scatter = 0, sseed = 0, st = 0, away = null, arc = 0) {
      const parts = sp.parts,
        engine = this.engine;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.lod > lod || (bigOnly && !part.big)) continue;
        if (part.dyn === 'halo' && (!alive || this.haloOff || lod === 0)) continue;
        if (half && part.half !== half) continue;
        // far away a round part is drawn with the coarse sphere and a limb with six sides: the same shape at a few pixels.
        // The living past arm's length (detail 1) already have heads a few pixels across: the coarse sphere does for them too.
        const g0 = part.geo,
          b =
            (g0 === 'lowSphere' && (lod === 0 || (lod === 1 && alive)) && store.tinySphere) ||
            (g0 === 'lowCyl' && lod === 0 && store.hex) ||
            store[g0];
        if (!b) continue;
        const d = b.data.length < (b.count + 1) * 24 ? engine.growBatch(b, b.count + 1) : b.data,
          o = b.count * 24;
        mul(d, o, Bo, part.bone * 16, part.m, 0);
        if (scatter > 0) {
          // each piece flung its own way, twitching where it lies
          const a = away == null ? hash(sseed, i * 3) * TAU : away + (hash(sseed, i * 3) - 0.5) * 2.4,
            far = (0.5 + hash(sseed, i * 3 + 1) * 1.5) * scatter,
            tw = Math.sin(st * (7 + hash(sseed, i) * 6) + i) * 0.06 * Math.min(1, scatter);
          d[o + 12] += Math.sin(a) * far + tw;
          d[o + 14] += Math.cos(a) * far;
          d[o + 13] = Math.max(d[o + 13] - scatter * 0.25, Bo[13] + 0.08) + arc * (0.6 + hash(sseed, i * 3 + 2) * 0.8);
        }
        if (part.dyn === 'mouth') {
          const m = 1 + mouth * part.open;
          d[o + 4] *= m;
          d[o + 5] *= m;
          d[o + 6] *= m;
        }
        const c = cols[i];
        d[o + 16] = c[0];
        d[o + 17] = c[1];
        d[o + 18] = c[2];
        d[o + 19] = 1;
        d[o + 20] = dark ? 0 : part.em;
        d[o + 21] = 0;
        d[o + 22] = 0;
        d[o + 23] = 0;
        b.count++;
      }
    }
    /* ---------- living pose + draw ---------- */
    pose(r) {
      resetQ();
      const t = this.t,
        s = r.seed,
        ship = this.s.vehicle.p,
        sp = r.sp;
      const run = r.speed,
        ph = r.phase;
      const headY = r.p[1] + (sp.dims.hipY + sp.dims.neckY) * r.scale;
      const dx = ship[0] - r.p[0],
        dz = ship[2] - r.p[2],
        hd = Math.hypot(dx, dz) || 1;
      const up = Math.atan2(ship[1] - headY, hd);
      const rel = M.angle(r.yaw, Math.atan2(dx, dz));
      Q.mouth = r.mouth;
      if (r.state === 'held' && this.calm) {
        Q.aLz = Q.aRz = 1.35 + Math.sin(t * 0.8 + s) * 0.08;
        Q.eL = Q.eR = 0.2;
        Q.lLx = Q.lRx = 0.12;
        Q.hdp = -0.55;
        Q.rr = Math.sin(t * 0.6 + s) * 0.08;
        Q.mouth = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(t * 5.1 + (s % 7)));
        return;
      }
      if (r.state === 'held') {
        Q.rp = Math.sin(t * 2.1 + s) * 0.7;
        Q.rr = Math.sin(t * 1.7 + s) * 0.6;
        Q.lLx = Math.sin(t * 13 + s) * 0.9;
        Q.lRx = Math.sin(t * 13 + s + 2.4) * 0.9;
        Q.aLz = 1.3 + Math.sin(t * 11 + s) * 0.9;
        Q.aRz = 1.3 + Math.sin(t * 12 + s + 1) * 0.9;
        Q.aLx = Math.sin(t * 9 + s) * 1.2;
        Q.aRx = Math.sin(t * 10 + s + 1) * 1.2;
        Q.eL = Q.eR = 0.7;
        Q.hdp = Math.sin(t * 5 + s) * 0.4;
        Q.mouth = 0.85 + Math.sin(t * 19) * 0.15;
        return;
      }
      if (r.thrown) {
        Q.rp = r.spinP;
        Q.rr = r.spinR;
        Q.aLz = Q.aRz = 1.7;
        Q.aLx = -0.5;
        Q.aRx = 0.4;
        Q.lLz = Q.lRz = 0.45;
        Q.lLx = -0.6;
        Q.mouth = 1;
        return;
      }
      if (r.carrier) {
        // held against the parent's chest, legs hanging
        Q.lLx = Q.lRx = -1.1;
        Q.aLx = Q.aRx = -1.5;
        Q.aLz = Q.aRz = 0.6;
        Q.eL = Q.eR = 1.2;
        Q.hdy = Math.sin(t * 2 + s) * 0.5 + 0.8;
        Q.hdp = -0.2;
        return;
      }
      if (r.down > 0) {
        const k = Math.min(1, (r.downMax - r.down) / 0.25),
          rise = r.down < 0.35 ? r.down / 0.35 : 1;
        const e = smooth(k) * rise;
        Q.rp = 1.42 * e;
        Q.lift = 0.38 * e;
        Q.aLx = Q.aRx = -2.7 * e;
        Q.aLz = 0.35;
        Q.aRz = 0.5;
        Q.eL = 0.4;
        Q.hdp = -0.9 * e;
        Q.lLx = 0.25 * e;
        return;
      }
      if (this.spec?.pose && this.spec.pose(r, Q, t, ship)) return;
      if (r.state === 'grieve') {
        Q.bob = -sp.dims.legLen * 0.5;
        Q.lLx = Q.lRx = -1.35;
        Q.tp = 0.62 + Math.sin(t * 1.3 + s) * 0.06;
        Q.hdp = 0.55;
        Q.aLx = Q.aRx = -0.95;
        Q.eL = Q.eR = 0.8;
        Q.aLz = Q.aRz = 0.02;
        Q.tr = r.mouthT > 0 ? Math.sin(t * 13) * 0.04 : 0;
        return;
      }
      if (r.cower > 0) {
        Q.bob = -sp.dims.legLen * 0.42;
        Q.lLx = Q.lRx = -1.25;
        Q.tp = 0.75;
        Q.aLx = Q.aRx = -2.65;
        Q.aLz = Q.aRz = 0.4;
        Q.eL = Q.eR = 1.9;
        Q.hdp = 0.55;
        Q.tr = Math.sin(t * 27 + s) * 0.05;
        return;
      }
      if (r.state === 'beg' && r.injured) {
        Q.rp = 1.42;
        Q.lift = 0.38;
        Q.lLx = Math.sin(ph) * 0.25;
        Q.lRx = -Math.sin(ph) * 0.25;
        Q.aLx = -2.8 + Math.sin(ph) * 0.5;
        Q.aRx = -2.8 - Math.sin(ph) * 0.5;
        Q.aLz = Q.aRz = 0.25;
        Q.eL = Q.eR = 0.3;
        Q.hdp = -1.0;
        return;
      }
      // locomotion
      const a = Math.min(0.95, 0.2 + run * 0.12);
      if (run > 0.15) {
        Q.lLx = Math.sin(ph) * a;
        Q.lRx = -Math.sin(ph) * a;
        Q.aLx = -Math.sin(ph) * a * 0.75;
        Q.aRx = Math.sin(ph) * a * 0.75;
        Q.bob = Math.abs(Math.cos(ph)) * Math.min(0.16, run * 0.025);
        Q.tp = Math.min(0.32, run * 0.045);
      } else Q.bob = Math.sin(t * 1.6 + s) * 0.012;
      if (r.state === 'flee' || r.state === 'hide') {
        if (r.kid?.carrier === r) {
          Q.aLx = Q.aRx = -1.25;
          Q.aLz = Q.aRz = 0.25;
          Q.eL = Q.eR = 1.15;
        } else {
          Q.aLz = 0.55 + Math.sin(ph * 0.5 + s) * 0.45;
          Q.aRz = 0.55 + Math.cos(ph * 0.5 + s) * 0.45;
          Q.aLx -= 0.45;
          Q.aRx -= 0.45;
          Q.eL = Q.eR = 0.9;
        }
        Q.hdy = r.lookT > 0 ? (rel > 0 ? 1.3 : -1.3) : Math.sin(t * 2 + s) * 0.25;
        return;
      }
      const look = () => {
        Q.hdy = M.clamp(rel, -1.1, 1.1);
        Q.hdp = -M.clamp(up, -0.2, 1.25);
        Q.tp = -Math.min(0.18, Math.max(0, up) * 0.15);
      };
      if (this.calm && r.state === 'gather' && !r.moving) {
        // kneeling, face lifted to the ship, singing
        look();
        Q.bob = -sp.dims.legLen * 0.48;
        Q.lLx = Q.lRx = -1.38;
        Q.tp = -0.06 + Math.sin(t * 0.7 + s) * 0.03;
        Q.rr = Math.sin(t * 0.9 + s) * 0.025;
        if (r.act % 2 === 0) {
          Q.aLz = Q.aRz = 2.45 + Math.sin(t * 1.1 + s) * 0.12;
          Q.aLx = Q.aRx = -0.25;
          Q.eL = Q.eR = 0.25;
        } else {
          Q.aLx = Q.aRx = -1.3;
          Q.aLz = Q.aRz = -0.32;
          Q.eL = Q.eR = 1.55;
        }
        Q.mouth = 0.18 + 0.34 * (0.5 + 0.5 * Math.sin(t * 5.1 + (s % 7)));
        return;
      }
      if (r.state === 'gather' && !r.moving) {
        look();
        const act = r.kid && !r.child ? 5 : r.act;
        if (act === 0) {
          Q.aRz = 2.65;
          Q.aRx = -0.25;
          Q.eR = 0.35 + Math.sin(t * 7 + s) * 0.35;
        } else if (act === 1) {
          Q.aLz = Q.aRz = 2.5 + Math.sin(t * 5 + s) * 0.18;
          Q.eL = Q.eR = 0.2;
          Q.bob += Math.abs(Math.sin(t * 4 + s)) * 0.05;
        } else if (act === 2) {
          Q.aRx = -(1.45 + Math.max(0, up) * 0.8);
          Q.aRz = 0.12;
          Q.eR = 0.05;
        } else if (act === 3) {
          Q.aLx = Q.aRx = -2.05;
          Q.aLz = Q.aRz = 0.32;
          Q.eL = Q.eR = 2.1;
        } else if (act === 4) {
          Q.aLx = Q.aRx = -0.95;
          Q.aLz = Q.aRz = -0.28;
          Q.eL = Q.eR = 1.3;
        } else {
          Q.aRz = 2.4 + Math.sin(t * 6 + s) * 0.3;
          Q.eR = 0.4;
          Q.aLx = -0.5;
          Q.eL = 0.7;
        }
        return;
      }
      if (r.state === 'beg') {
        look();
        Q.aLz = 2.55 + Math.sin(t * 9 + s) * 0.45;
        Q.aRz = 2.55 + Math.sin(t * 9 + s + 2.2) * 0.45;
        Q.eL = Q.eR = 0.25;
        if (!r.moving) Q.bob += Math.abs(Math.sin(t * 5.5 + s)) * (hash(s, 3) < 0.5 ? 0.3 : 0.06);
        Q.mouth = Math.max(Q.mouth, 0.35);
        return;
      }
      if (r.state === 'freed') {
        Q.hdy = Math.sin(t * 0.9 + s) * 0.9;
        Q.aLx = Q.aRx = -0.75;
        Q.aLz = Q.aRz = -0.35;
        Q.eL = Q.eR = 1.6;
        return;
      }
      // idle and wandering; the wary keep their eyes on the ship
      if (this.mode === 'wary' || this.mode === 'broken' || r.state === 'gather') {
        if (Math.hypot(dx, dz) < 260) look();
      } else {
        Q.hdy = Math.sin(t * 0.4 + s) * 0.5;
        if (r.talk && run < 0.2) {
          Q.aRx = -0.7 + Math.sin(t * 3.5 + s) * 0.3;
          Q.eR = 0.8;
        }
      }
    }
    render() {
      const live = this.living,
        shade = this.shade,
        shadows = this.game.settings.quality !== 'low' && !this.engine.noShadows;
      for (const g in live) live[g].count = 0;
      for (const g in shade) shade[g].count = 0;
      const cam = this.engine.camera.p,
        f = this.camFwd;
      for (const r of this.list) {
        if (!r.alive || r.carrier || r.gone) continue;
        const dx = r.p[0] - cam[0],
          dy = r.p[1] - cam[1],
          dz = r.p[2] - cam[2],
          d = Math.hypot(dx, dy, dz);
        if (d > 560) continue;
        if (dx * f[0] + dy * f[1] + dz * f[2] < -8) continue;
        const k = this.lodScale,
          lod = d < 60 * k ? 2 : d < 170 * k ? 1 : 0;
        this.pose(r);
        bones(BONES, r.sp, r.p[0], r.p[1], r.p[2], r.yaw, r.scale);
        // a few pixels tall far off: the body and the head carry the figure; arms, eyes and halos are below a pixel there
        this.emit(r.sp, r.sp.colors[r.pal], BONES, live, lod, null, Q.mouth, false, lod === 0 && d > 300 * k, true);
        if (shadows && d < 120 * k) this.emit(r.sp, r.sp.colors[r.pal], BONES, shade, 0, null, 0, false, true);
        if (r.kid && r.kid.carrier === r && r.kid.alive) {
          // child in arms: placed at the parent's chest
          const k = r.kid,
            o = 32,
            hx = BONES[o + 12] + BONES[o + 8] * 0.62 + BONES[o + 4] * 0.3,
            hy = BONES[o + 13] + BONES[o + 9] * 0.62 + BONES[o + 5] * 0.3,
            hz = BONES[o + 14] + BONES[o + 10] * 0.62 + BONES[o + 6] * 0.3;
          this.pose(k);
          bones(KIDB, k.sp, hx, hy - k.sp.dims.hipY * k.scale * 0.75, hz, r.yaw + Math.PI, k.scale);
          this.emit(k.sp, k.sp.colors[k.pal], KIDB, live, lod, null, Q.mouth, false, false, true);
        }
      }
      for (const dd of this.dying) this.drawCorpse(dd.c, live, Math.min(1, dd.t / dd.d), true);
      for (const r of this.mending) {
        const m = r.mend,
          dx = r.p[0] - cam[0],
          dz = r.p[2] - cam[2];
        if (dx * dx + dz * dz > 420 * 420) continue;
        // apart in a blink; lying scattered; the last seconds crawling back together
        const k = m.t < 0.25 ? smooth(m.t / 0.25) : m.t > m.d - 3.2 ? smooth((m.d - m.t) / 3.2) : 1;
        corpsePose(m.type, m.seed, null);
        bones(BONES, r.sp, r.p[0], m.y, r.p[2], m.yaw, r.scale);
        this.emit(r.sp, r.sp.colors[r.pal], BONES, live, 1, null, 0.7, false, false, false, k * 2.4 * r.scale, m.seed, this.t);
      }
    }
    /* ---------- save ---------- */
    outside() {
      let n = 0;
      for (const r of this.list) if ((r.alive || r.thrown) && !r.freed && !r.dead && this.slotOf(r.sp) >= 0) n++;
      for (const r of this.mending) if (!r.freed) n++;
      return n;
    }
    tokens() {
      // Keep the last departure even when an exact-count district is empty.
      const out = [];
      let keys = [];
      for (const slot of this.departed) {
        keys.push(slot);
        if (keys.join('.').length >= 46) {
          out.push('z.left.' + keys.join('.'));
          keys = [];
        }
      }
      if (keys.length) out.push('z.left.' + keys.join('.'));
      if (!this.sp || !this.d0) return out;
      out.push(
        'z.d0.' + this.d0,
        'z.al.' + Math.max(0, Math.round(this.alive)),
        'z.vi.' + this.outside(),
        'z.at.' + Math.min(5, this.s.ruin),
        'z.ki.' + this.kills,
      );
      let saved = this.corpses.filter(c => c.save);
      for (const d of this.dying) if (d.c.save) saved.push(d.c);
      if (saved.length > SAVE_CAP) {
        const step = saved.length / SAVE_CAP;
        saved = Array.from({ length: SAVE_CAP }, (_, i) => saved[Math.floor(i * step)]);
      }
      // bodies within 808 m of the middle keep the old two-character places; the wider worlds put the rest in "z.f." with three.
      // Bodies torn apart by the craft's shockwave go in "z.s." (near) and "z.g." (far): the type digit there is the size alone.
      const chunks = { 'z.c.': '', 'z.f.': '', 'z.s.': '', 'z.g.': '' },
        add = (key, part, len) => {
          chunks[key] += part;
          if (chunks[key].length >= len) {
            out.push(key + chunks[key]);
            chunks[key] = '';
          }
        };
      for (const c of saved) {
        const torn = c.type === 'shred',
          tc = torn ? (c.size ?? 3) : Math.max(0, TYPES.indexOf(c.type)) * 6 + (c.size ?? 3),
          yq = ((Math.round((((c.yaw % TAU) + TAU) % TAU) / TAU * 36) % 36) + 36) % 36;
        const code = this.mixSlots ? Math.max(0, this.slotOf(c.sp)) * 6 + Math.min(5, c.pal | 0) : c.pal | 0;
        const tail = B36[tc] + B36[yq] + B36[Math.min(35, code)];
        if (Math.abs(c.x) <= 808 && Math.abs(c.z) <= 808) {
          const xq = M.clamp(Math.round((c.x + 810) / 1.25), 0, 1295),
            zq = M.clamp(Math.round((c.z + 810) / 1.25), 0, 1295);
          add(torn ? 'z.s.' : 'z.c.', enc2(xq) + enc2(zq) + tail, 56);
        } else add(torn ? 'z.g.' : 'z.f.', enc3(M.clamp(Math.round((c.x + 5832) * 4), 0, 46655)) + enc3(M.clamp(Math.round((c.z + 5832) * 4), 0, 46655)) + tail, 54);
      }
      for (const key in chunks) if (chunks[key]) out.push(key + chunks[key]);
      return out;
    }
    signal() {
      if (!this.sp && !this.freedAlive) return null;
      return Math.max(0, this.alive) + this.freedAlive;
    }
    dispose() {
      for (const b of this.all) this.engine.freeBatch(b);
      this.all.length = 0;
      this.list.length = 0;
      this.corpses.length = 0;
      this.dying.length = 0;
      this.fx.length = 0;
      this.game.audio.silenceAmbience();
    }
  }
  K.Residents = Residents;
  /* A standing figure as ordinary scene nodes (the mothership's hold). height = metres tall in that room. */
  K.residentFigure = function (root, key, seed = 0, height = 1.75, scale = 1) {
    const sp = SPECIES[key] || SPECIES.subject;
    resetQ();
    Q.aLx = Q.aRx = -0.55;
    Q.aLz = Q.aRz = -0.18;
    Q.eL = Q.eR = 1.45;
    Q.hdp = 0.28;
    Q.mouth = 0.05;
    bones(BONES, sp, 0, 0, 0, 0, 1);
    const g = K.group(root),
      k = height == null ? scale : height * scale / sp.height,
      pal = seed % sp.palettes.length;
    g.s = [k, k, k];
    sp.parts.forEach((part, i) => {
      if (part.lod > 1 || part.dyn === 'halo') return;
      const n = K.mesh(g, part.geo, [0, 0, 0], [1, 1, 1], sp.colors[pal][i], { em: part.em });
      n.localMatrix = new Float32Array(16);
      mul(n.localMatrix, 0, BONES, part.bone * 16, part.m, 0);
    });
    return g;
  };
  /* Read-only view of a district's saved state, for scans from orbit. */
  K.ResidentLedger = {
    SURVIVE,
    read(save, id) {
      const list = save.data.planetStates?.[id]?.destroyed;
      if (!Array.isArray(list)) return null;
      const st = {};
      for (const t of list) {
        const m = typeof t === 'string' && /^z\.(d0|al|vi|at|ki)\.(\d+)$/.exec(t);
        if (m) st[m[1]] = Number(m[2]);
      }
      return st.d0 ? st : null;
    },
    // how many are alive in the whole world, given its population estimate and orbital hits
    planetAlive(save, id, population, hits) {
      const h = Math.min(5, hits),
        st = this.read(save, id);
      if (h >= 5) return 0;
      if (!st) return Math.round(population * SURVIVE[h]);
      const at = st.at || 0,
        k = SURVIVE[at] > 0 ? SURVIVE[h] / SURVIVE[at] : 0,
        district = Math.round((st.al ?? st.d0) * (at < h ? k : 1));
      return Math.max(0, Math.round((population - st.d0) * SURVIVE[h]) + district);
    },
    touched(save, id) {
      const st = this.read(save, id);
      return !!st && (st.ki > 0 || st.al < st.d0);
    },
  };
})((window.KO ||= {}));

// FILE: src/worlds/swarm.js
/* Swarm: small crawling bugs in their thousands, kept in flat arrays and drawn as instances.
 * Each bug belongs to a patch (a cluster) it wanders in and comes back to. It runs from the ship's shadow when the ship
 * comes down close, from the cutting beam and from blasts, and gathers again once the danger has passed.
 * Legs, antennae and the gait are worked in the vertex shader (type 36); the CPU only moves and turns them. */
(function (K) {
  'use strict';
  const M = K.M,
    TAU = Math.PI * 2;
  const IDLE = 0,
    WALK = 1,
    FLEE = 2,
    BACK = 3,
    SLEEP = 4,
    DEAD = 5,
    HELD = 6,
    FALL = 7,
    LOOK = 8,
    GONE = 9;
  // one body, unit length (head tip +0.5, tail -0.5). Leg vertices carry normals of length 2 + id/4, antennae 4 + k/4, cerci 5.
  function ellipsoid(P, N, I, c, r, nu, nv) {
    const o = P.length / 3;
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * Math.PI,
        sv = Math.sin(v),
        cv = Math.cos(v);
      for (let i = 0; i <= nu; i++) {
        const u = (i / nu) * TAU,
          x = Math.sin(u) * sv,
          y = cv,
          z = Math.cos(u) * sv;
        P.push(c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]);
        const nx = x / r[0],
          ny = y / r[1],
          nz = z / r[2],
          l = Math.hypot(nx, ny, nz) || 1;
        N.push(nx / l, ny / l, nz / l);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = o + j * (nu + 1) + i,
          b = a + nu + 1;
        I.push(a, b, a + 1, b, b + 1, a + 1);
      }
  }
  // a thin three-sided rod from a to b; its normals are stretched to the given length so the shader knows what it is
  function rod(P, N, I, a, b, w, mark) {
    const d = M.norm(M.sub(b, a)),
      up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0],
      s = M.norm(M.cross(d, up)),
      t = M.cross(s, d),
      o = P.length / 3;
    for (const end of [a, b])
      for (let k = 0; k < 3; k++) {
        const ang = (k / 3) * TAU,
          n = M.add(M.mul(s, Math.cos(ang)), M.mul(t, Math.sin(ang)));
        P.push(end[0] + n[0] * w, end[1] + n[1] * w, end[2] + n[2] * w);
        N.push(n[0] * mark, n[1] * mark, n[2] * mark);
      }
    for (let k = 0; k < 3; k++) {
      const k2 = (k + 1) % 3;
      I.push(o + k, o + 3 + k, o + k2, o + 3 + k, o + 3 + k2, o + k2);
    }
  }
  function bugMesh(near) {
    const P = [],
      N = [],
      I = [];
    if (!near) {
      ellipsoid(P, N, I, [0, 0.08, -0.02], [0.27, 0.08, 0.48], 6, 3);
      return { p: P, n: N, idx: I };
    }
    ellipsoid(P, N, I, [0, 0.085, -0.12], [0.27, 0.08, 0.36], 8, 5);
    ellipsoid(P, N, I, [0, 0.1, 0.22], [0.25, 0.055, 0.16], 7, 3);
    ellipsoid(P, N, I, [0, 0.055, 0.36], [0.085, 0.06, 0.065], 5, 3);
    const legs = [
      [[0.12, 0.06, 0.2], [0.27, 0.09, 0.3], [0.36, 0.0, 0.47]],
      [[0.15, 0.06, 0.03], [0.38, 0.1, 0.02], [0.52, 0.0, -0.12]],
      [[0.13, 0.06, -0.09], [0.37, 0.1, -0.26], [0.49, 0.0, -0.6]],
    ];
    for (const side of [1, -1])
      legs.forEach((L, k) => {
        const id = (side > 0 ? 0 : 3) + k,
          mark = 2 + id * 0.25,
          f = q => [q[0] * side, q[1], q[2]];
        rod(P, N, I, f(L[0]), f(L[1]), 0.034, mark);
        rod(P, N, I, f(L[1]), f(L[2]), 0.02, mark);
      });
    for (const side of [1, -1]) {
      const mark = 4 + (side > 0 ? 0 : 0.25),
        f = q => [q[0] * side, q[1], q[2]];
      rod(P, N, I, f([0.045, 0.08, 0.42]), f([0.15, 0.13, 0.72]), 0.012, mark);
      rod(P, N, I, f([0.15, 0.13, 0.72]), f([0.3, 0.1, 1.05]), 0.009, mark);
      rod(P, N, I, f([0.05, 0.085, -0.46]), f([0.1, 0.1, -0.57]), 0.012, 5);
    }
    return { p: P, n: N, idx: I };
  }
  function geometry(engine) {
    if (!engine.geometries['bug-near']) engine.addGeometry('bug-near', bugMesh(true));
    if (!engine.geometries['bug-far']) engine.addGeometry('bug-far', bugMesh(false));
  }
  const { trs } = K.Mat;
  class Swarm {
    /* world: the surface; opt: { size, color, capacity, near, far, seed } */
    constructor(world, opt = {}) {
      this.w = world;
      this.engine = world.game.engine;
      geometry(this.engine);
      this.size = opt.size || 0.28;
      this.color = M.hex(opt.color || '#d6862a').slice();
      this.coldColor = M.hex('#7c6450').slice();
      this.nearD = opt.near || 32;
      this.farD = opt.far || 230;
      const n = (this.cap = opt.capacity || 9000);
      for (const k of ['x', 'y', 'z', 'yaw', 'v', 'tx', 'tz', 't', 'ph', 'pitch', 'gait', 'vy', 'var', 'fear', 'react', 'rx', 'rz'])
        this[k] = new Float32Array(n);
      this.st = new Uint8Array(n);
      this.cl = new Uint16Array(n);
      this.count = 0;
      this.alive = 0;
      this.clusters = [];
      this.rng = M.rand(opt.seed || 41);
      this.near = this.engine.makeBatch('bug-near', { capacity: 600 });
      this.far = this.engine.makeBatch('bug-far', { capacity: 2400 });
      this.smears = this.engine.makeBatch('lowDisc', { capacity: 400, dynamic: false });
      this.smears.noCull = true;
      this.smearCap = opt.smears || 1600;
      this.smearAt = 0;
      this.saved = []; // the most recent smears, for the save file: [x, z, kind]
      world.residents.all.push(this.near, this.far, this.smears);
      this.cold = 0;
      this.held = [];
      this.ball = null;
      this.frame = 0;
      this.running = 0;
      this.killed = 0;
      this.onKill = null;
    }
    // where a bug stands: the cluster's own floor if it has one, else the world's
    floorY(cl, x, z) {
      if (cl.yFn) return cl.yFn(x, z);
      const w = this.w;
      return (w.floor ? w.floor(x, z, 1e9) : w.height(x, z)) + cl.y0;
    }
    /* c: { x, z, r, n, y0, yFn, dead, warm } — n bugs scattered over a disc, thicker toward the middle */
    addCluster(c) {
      const k = this.clusters.length,
        rng = this.rng,
        n = Math.min(c.n, this.cap - this.count);
      const cl = { k, x: c.x, z: c.z, r: c.r, n0: n, start: this.count, end: this.count + n, alive: 0, y0: c.y0 || 0, yFn: c.yFn || null, cold: 0, reach: c.r + 30, tag: c.tag || null };
      const dead = Math.min(n, c.dead || 0);
      for (let j = 0; j < n; j++) {
        const i = this.count++,
          a = rng() * TAU,
          rr = Math.pow(rng(), c.spread ?? 0.62) * c.r;
        this.x[i] = c.x + Math.sin(a) * rr;
        this.z[i] = c.z + Math.cos(a) * rr;
        this.y[i] = this.floorY(cl, this.x[i], this.z[i]);
        this.yaw[i] = rng() * TAU;
        this.var[i] = rng();
        this.ph[i] = rng();
        this.t[i] = rng() * 3;
        this.cl[i] = k;
        this.v[i] = 0;
        this.pitch[i] = 0;
        this.gait[i] = 0;
        this.fear[i] = 0;
        this.st[i] = j >= n - dead ? GONE : rng() < 0.55 ? IDLE : WALK;
        if (this.st[i] === WALK) this.pickTarget(i, cl);
        if (this.st[i] !== GONE) cl.alive++;
      }
      this.alive += cl.alive;
      this.clusters.push(cl);
      return cl;
    }
    pickTarget(i, cl, wide = 1) {
      const rng = this.rng,
        a = rng() * TAU,
        rr = Math.pow(rng(), 0.7) * cl.r * wide;
      // most walks are short hops near where it already is; some cross back toward the warm middle
      if (rng() < 0.7) {
        const h = 0.6 + rng() * 2.4;
        this.tx[i] = this.x[i] + Math.sin(a) * h;
        this.tz[i] = this.z[i] + Math.cos(a) * h;
        const dx = this.tx[i] - cl.x,
          dz = this.tz[i] - cl.z,
          d = Math.hypot(dx, dz);
        if (d > cl.r) {
          this.tx[i] = cl.x + (dx / d) * cl.r * 0.9;
          this.tz[i] = cl.z + (dz / d) * cl.r * 0.9;
        }
      } else {
        this.tx[i] = cl.x + Math.sin(a) * rr;
        this.tz[i] = cl.z + Math.cos(a) * rr;
      }
    }
    /* threat: { p, alt, speed, low, shadow, beam: [x,y,z] | null, blast: [x,z,r] | null } */
    update(dt, threat) {
      const f = this.frame++;
      this.running = 0;
      for (const cl of this.clusters) {
        if (!cl.alive) continue;
        const d = Math.hypot(cl.x - threat.p[0], cl.z - threat.p[2]) - cl.r,
          step = d < 70 ? 1 : d < 220 ? 3 : 9;
        if ((f + cl.k) % step) continue;
        const h = Math.min(0.3, dt * step),
          cold = Math.max(this.cold, cl.cold);
        for (let i = cl.start; i < cl.end; i++) {
          const s = this.st[i];
          if (s === DEAD || s === GONE || s === HELD) continue;
          this.think(i, h, cl, threat, cold, d < 70);
        }
      }
      if (this.held.length) this.updateHeld(dt);
    }
    think(i, dt, cl, T, cold, close) {
      const rng = this.rng;
      let s = this.st[i];
      const x = this.x[i],
        z = this.z[i];
      if (s === FALL) {
        this.vy[i] -= 22 * dt;
        this.y[i] += this.vy[i] * dt;
        this.x[i] += Math.sin(this.yaw[i]) * this.v[i] * dt;
        this.z[i] += Math.cos(this.yaw[i]) * this.v[i] * dt;
        const fl = this.floorY(cl, this.x[i], this.z[i]);
        if (this.y[i] <= fl) {
          this.y[i] = fl;
          this.st[i] = FLEE;
          this.t[i] = 1 + rng() * 1.5;
          this.v[i] = 0;
        }
        return;
      }
      // the cold: once the heat has gone they slow, gather in heaps and stop
      if (cold > 0.97) {
        if (s !== SLEEP) {
          this.st[i] = SLEEP;
          this.gait[i] = 0;
          this.pitch[i] = 0;
        }
        return;
      }
      const slow = 1 - cold * 0.85;
      // startled: frozen for a blink, then off at a run
      if (this.react[i] > 0) {
        this.react[i] -= dt;
        this.gait[i] = 0;
        this.v[i] = 0;
        if (this.react[i] <= 0) this.flee(i, x - this.rx[i], z - this.rz[i], 1, 1.1 + this.var[i] * 1.4);
        return;
      }
      // what frightens them: the ship's shadow close above, the cutting beam, a blast
      if (close && s !== FLEE) {
        const sx = x - T.p[0],
          sz = z - T.p[2],
          sd = Math.hypot(sx, sz);
        if (T.alt < 34 && sd < T.shadow) {
          this.startle(i, T.p[0], T.p[2], 0.05 + this.var[i] * 0.22);
          return;
        } else if (T.alt < 34 && sd < T.shadow + 14 && s !== LOOK && T.speed < 6 && rng() < dt * 1.5) {
          // the ship hangs there, not too close: they stop and rear up to look at it
          this.st[i] = s = LOOK;
          this.t[i] = 0.8 + rng() * 1.6;
        }
        if (T.beam && s !== FLEE) {
          const bx = x - T.beam[0],
            bz = z - T.beam[2],
            bd = Math.hypot(bx, bz);
          if (bd < 8) {
            this.startle(i, T.beam[0], T.beam[2], 0.18 + this.var[i] * 0.4);
            return;
          }
        }
      }
      if (T.blast && s !== FLEE) {
        const bx = x - T.blast[0],
          bz = z - T.blast[1],
          bd = Math.hypot(bx, bz);
        if (bd < T.blast[2] * 1.6) {
          this.flee(i, bx, bz, bd, 2 + this.var[i] * 2);
          s = FLEE;
        }
      }
      if (this.fear[i] > 0) {
        this.fear[i] -= dt;
        if (s !== FLEE && this.fear[i] > 0.3) {
          this.flee(i, x - this.tx[i], z - this.tz[i], 1, this.fear[i]);
          s = FLEE;
        }
      }
      let tx = 0,
        tz = 0,
        speed = 0;
      this.t[i] -= dt;
      switch (s) {
        case IDLE:
          speed = 0;
          // grooming: a little turn this way and that
          if (this.var[i] > 0.6) this.yaw[i] += Math.sin(this.w.time * 3 + this.var[i] * 40) * dt * 0.8;
          if (this.t[i] <= 0) {
            this.st[i] = WALK;
            this.pickTarget(i, cl);
          }
          break;
        case LOOK: {
          speed = 0;
          const want = Math.atan2(T.p[0] - x, T.p[2] - z);
          this.yaw[i] += M.clamp(angleTo(this.yaw[i], want), -dt * 4, dt * 4);
          this.pitch[i] = M.damp(this.pitch[i], 0.55, 8, dt);
          if (this.t[i] <= 0) {
            this.st[i] = IDLE;
            this.t[i] = 0.5 + rng() * 2;
          }
          break;
        }
        case WALK:
          tx = this.tx[i];
          tz = this.tz[i];
          speed = (0.35 + this.var[i] * 0.45) * slow;
          if (Math.hypot(tx - x, tz - z) < 0.25) {
            this.st[i] = IDLE;
            this.t[i] = (0.4 + rng() * 2.8) * (1 + cold * 3);
          }
          break;
        case FLEE:
          tx = this.tx[i];
          tz = this.tz[i];
          speed = (3.2 + this.var[i] * 2.2) * slow;
          this.running++;
          if (this.t[i] <= 0) {
            this.st[i] = BACK;
            this.pickTarget(i, cl, 0.8);
          }
          break;
        case BACK:
          tx = this.tx[i];
          tz = this.tz[i];
          speed = (1.2 + this.var[i] * 0.8) * slow;
          if (Math.hypot(tx - x, tz - z) < 0.4) {
            this.st[i] = IDLE;
            this.t[i] = 0.5 + rng() * 2;
          }
          break;
        case SLEEP:
          // warm again (it never warms again here, but a world could): wake slowly
          if (rng() < dt * 0.3) this.st[i] = IDLE;
          break;
      }
      if (s !== LOOK) this.pitch[i] = M.damp(this.pitch[i], 0, 10, dt);
      if (speed > 0) {
        const want = Math.atan2(tx - x, tz - z),
          turn = angleTo(this.yaw[i], want);
        this.yaw[i] += M.clamp(turn, -dt * (s === FLEE ? 12 : 5), dt * (s === FLEE ? 12 : 5));
        const go = speed * Math.max(0, Math.cos(turn) * 0.8 + 0.2);
        this.v[i] = go;
        this.x[i] += Math.sin(this.yaw[i]) * go * dt;
        this.z[i] += Math.cos(this.yaw[i]) * go * dt;
        this.y[i] = this.floorY(cl, this.x[i], this.z[i]);
        this.gait[i] = Math.min(15, go / (this.size * 0.5));
      } else {
        this.v[i] = 0;
        this.gait[i] = 0;
      }
    }
    startle(i, fx, fz, wait) {
      this.react[i] = wait;
      this.rx[i] = fx;
      this.rz[i] = fz;
      this.pitch[i] = 0.25;
    }
    flee(i, dx, dz, d, time) {
      const rng = this.rng,
        a = Math.atan2(dx, dz) + (rng() - 0.5) * 0.9,
        run = 5 + rng() * 7;
      this.tx[i] = this.x[i] + Math.sin(a) * run;
      this.tz[i] = this.z[i] + Math.cos(a) * run;
      this.st[i] = FLEE;
      this.t[i] = Math.max(this.t[i] > 0 && this.st[i] === FLEE ? this.t[i] : 0, time);
    }
    // everything inside a disc dies (crushed by the hull or a blast, burnt by the beam); returns how many
    squash(x, z, r, how = 'crush', yHint = null, max = 400) {
      let n = 0;
      const r2 = r * r;
      for (const cl of this.clusters) {
        if (!cl.alive || Math.hypot(cl.x - x, cl.z - z) > cl.reach + r) continue;
        for (let i = cl.start; i < cl.end && n < max; i++) {
          const s = this.st[i];
          if (s === DEAD || s === GONE || s === HELD) continue;
          const dx = this.x[i] - x,
            dz = this.z[i] - z;
          if (dx * dx + dz * dz > r2) continue;
          if (yHint != null && Math.abs(this.y[i] - yHint) > 4) continue;
          this.kill(i, how);
          n++;
        }
      }
      if (n) this.alarm(x, z, r + 6);
      return n;
    }
    alarm(x, z, r) {
      for (const cl of this.clusters) {
        if (!cl.alive || Math.hypot(cl.x - x, cl.z - z) > cl.reach + r) continue;
        for (let i = cl.start; i < cl.end; i++) {
          const s = this.st[i];
          if (s === DEAD || s === GONE || s === HELD || s === SLEEP) continue;
          const dx = this.x[i] - x,
            dz = this.z[i] - z,
            d = Math.hypot(dx, dz);
          if (d < r) this.flee(i, dx, dz, d, 1 + this.var[i] * 1.5);
        }
      }
    }
    kill(i, how = 'crush') {
      const cl = this.clusters[this.cl[i]];
      if (this.st[i] === HELD) this.held = this.held.filter(j => j !== i);
      this.st[i] = DEAD;
      this.react[i] = 0;
      cl.alive--;
      this.alive--;
      this.killed++;
      this.smear(this.x[i], this.y[i], this.z[i], how);
      this.onKill?.(i, how);
    }
    // a bug that climbs aboard: gone from here without a mark
    take(i) {
      const cl = this.clusters[this.cl[i]];
      this.st[i] = GONE;
      cl.alive--;
      this.alive--;
    }
    smear(x, y, z, how = 'crush', size = 1) {
      const b = this.smears,
        slot = this.smearAt % this.smearCap;
      this.smearAt++;
      const d = this.engine.growBatch(b, Math.max(b.count, slot + 1)),
        o = slot * 24,
        s = this.size * (1.6 + Math.random() * 1.1) * size,
        col = how === 'burn' ? [0.07, 0.05, 0.04] : how === 'cold' ? [0.42, 0.32, 0.22] : [0.3 + Math.random() * 0.08, 0.2, 0.05];
      trs(d, o, x, y + 0.04 + (slot % 7) * 0.002, z, 0, Math.random() * TAU, 0, s, 0.01, s * (0.8 + Math.random() * 0.4));
      d[o + 16] = col[0];
      d[o + 17] = col[1];
      d[o + 18] = col[2];
      d[o + 19] = 1;
      d[o + 20] = 0;
      d[o + 21] = 37;
      d[o + 22] = 0;
      d[o + 23] = Math.random() * 50;
      b.count = Math.max(b.count, slot + 1);
      b.uploaded = Math.min(b.uploaded, slot);
      this.saved.push([x, z, how === 'burn' ? 1 : 0]);
      if (this.saved.length > 320) this.saved.shift();
    }
    // the tractor's cone: which bugs stand inside it, nearest the middle first
    gather(o, dir, range, cone, max = 60) {
      const out = [];
      for (const cl of this.clusters) {
        if (!cl.alive) continue;
        const cx = cl.x - o[0],
          cz = cl.z - o[2],
          cd = Math.hypot(cx, cz);
        if (cd - cl.reach > range) continue;
        for (let i = cl.start; i < cl.end; i++) {
          const s = this.st[i];
          if (s === DEAD || s === GONE || s === HELD) continue;
          const vx = this.x[i] - o[0],
            vy = this.y[i] + 0.1 - o[1],
            vz = this.z[i] - o[2],
            d = Math.hypot(vx, vy, vz);
          if (d > range || d < 0.5) continue;
          const c = (vx * dir[0] + vy * dir[1] + vz * dir[2]) / d;
          if (c < Math.cos(cone)) continue;
          out.push([1 - c, i]);
        }
      }
      out.sort((a, b) => a[0] - b[0]);
      return out.slice(0, max).map(e => e[1]);
    }
    // bugs taken up together into a ball held in the beam
    hold(list, ball) {
      for (const i of list) {
        this.st[i] = HELD;
        this.v[i] = 0;
      }
      this.held = list.slice();
      this.ball = ball;
      // each keeps a place in the ball and its own scrabbling
      this.ballSlots = list.map((_, k) => {
        const yy = 1 - (2 * (k + 0.5)) / list.length,
          rr = Math.sqrt(1 - yy * yy),
          a = k * 2.39996;
        return [Math.cos(a) * rr, yy, Math.sin(a) * rr];
      });
    }
    updateHeld(dt) {
      const b = this.ball;
      if (!b) return;
      const R = b.radius * 0.85,
        t = this.w.time;
      this.held.forEach((i, k) => {
        const s = this.ballSlots[k],
          wob = 1 + Math.sin(t * 9 + k) * 0.08;
        this.x[i] = b.p[0] + s[0] * R * wob;
        this.y[i] = b.p[1] + s[1] * R * wob - 0.05;
        this.z[i] = b.p[2] + s[2] * R * wob;
        this.yaw[i] += dt * (2 + (k % 5));
        this.pitch[i] = Math.sin(t * 5 + k) * 1.2;
        this.gait[i] = 12;
      });
    }
    // the ball let go of: splattered where it lands hard, or set down and running
    releaseHeld(splat) {
      const b = this.ball;
      let n = 0;
      for (const i of this.held) {
        if (this.st[i] !== HELD) continue;
        if (splat) {
          const cl = this.clusters[this.cl[i]];
          this.x[i] = b.p[0] + (Math.random() - 0.5) * 3;
          this.z[i] = b.p[2] + (Math.random() - 0.5) * 3;
          this.y[i] = this.floorY(cl, this.x[i], this.z[i]);
          this.kill(i, 'crush');
          n++;
        } else {
          this.st[i] = FALL;
          this.vy[i] = 1 + Math.random() * 2;
          this.v[i] = 1 + Math.random() * 2;
          this.yaw[i] = Math.random() * TAU;
          this.pitch[i] = 0;
        }
      }
      this.held = [];
      this.ball = null;
      return n;
    }
    // how many still move (the count kept on screen)
    get living() {
      return this.alive;
    }
    // fill this frame's instances: near ones in full, far ones as plain shells, none behind the camera or past the haze
    render() {
      const e = this.engine,
        cam = e.camera.p,
        fr = e.planes,
        near = this.near,
        far = this.far,
        S = this.size,
        nd2 = this.nearD * this.nearD,
        fd = this.farD,
        fd2 = fd * fd,
        col = this.color,
        cc = this.coldColor;
      near.count = 0;
      far.count = 0;
      for (const cl of this.clusters) {
        if (!cl.alive && !(this.held.length && this.ball)) continue;
        const cy = this.floorY(cl, cl.x, cl.z),
          cd = Math.hypot(cl.x - cam[0], cy - cam[1], cl.z - cam[2]);
        if (cd - cl.reach > fd) continue;
        if (fr) {
          let out = false;
          for (let k = 0; k < 24; k += 4)
            if (fr[k] * cl.x + fr[k + 1] * cy + fr[k + 2] * cl.z + fr[k + 3] < -cl.reach - 2) {
              out = true;
              break;
            }
          if (out) continue;
        }
        const cold = Math.max(this.cold, cl.cold);
        for (let i = cl.start; i < cl.end; i++) {
          const s = this.st[i];
          if (s === DEAD || s === GONE) continue;
          const x = this.x[i],
            y = this.y[i],
            z = this.z[i],
            dx = x - cam[0],
            dy = y - cam[1],
            dz = z - cam[2],
            d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > fd2) continue;
          if (fr) {
            let out = false;
            for (let k = 0; k < 24; k += 4)
              if (fr[k] * x + fr[k + 1] * y + fr[k + 2] * z + fr[k + 3] < -0.6) {
                out = true;
                break;
              }
            if (out) continue;
          }
          const b = d2 < nd2 || s === HELD ? near : far,
            d = e.growBatch(b, b.count + 1),
            o = b.count * 24,
            v = this.var[i],
            k = 0.86 + v * 0.26,
            sc = S * (0.88 + v * 0.24);
          trs(d, o, x, y, z, -this.pitch[i], this.yaw[i], 0, sc, sc, sc);
          const c0 = cold * (s === SLEEP ? 1 : 0.6);
          d[o + 16] = (col[0] + (cc[0] - col[0]) * c0) * k;
          d[o + 17] = (col[1] + (cc[1] - col[1]) * c0) * k;
          d[o + 18] = (col[2] + (cc[2] - col[2]) * c0) * k;
          d[o + 19] = 1;
          d[o + 20] = 0;
          d[o + 21] = 36;
          d[o + 22] = this.gait[i];
          d[o + 23] = this.ph[i];
          b.count++;
        }
      }
    }
    // state for saving: losses per cluster (index, dead) and the most recent smears
    losses() {
      return this.clusters.filter(c => c.alive < c.n0).map(c => [c.k, c.n0 - c.alive]);
    }
    dispose() {
      for (const b of [this.near, this.far, this.smears]) this.engine.freeBatch(b);
    }
  }
  function angleTo(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  Swarm.STATE = { IDLE, WALK, FLEE, BACK, SLEEP, DEAD, HELD, FALL, LOOK, GONE };
  K.Swarm = Swarm;
})((window.KO ||= {}));

// FILE: src/worlds/surface.js
/* Shared local-world simulation. Planet files own geometry, ecology and reactions.
 * Stable building IDs are the save contract. Transient particles never enter saves.
 */
(function (K) {
  'use strict';
  const { M, mesh, group } = K;
  class Surface {
    constructor(game, definition, config) {
      this.game = game;
      this.definition = definition;
      this.id = definition.id;
      this.config = config;
      this.rulerName = config.rulerName;
      this.areaLabel = config.areaLabel;
      this.regionName = config.regionName;
      this.afterLabel = config.afterLabel;
      this.environment = config.environment;
      this.root = new K.Node();
      this.buildings = [];
      this.creatures = [];
      this.loose = [];
      this.fragments = [];
      this.waves = [];
      this.beams = [];
      this.tethers = [];
      this.pending = [];
      this.animated = [];
      this.time = 0;
      this.shotTime = 0;
      this.lastFireFX = 0;
      this.newCapture = false;
      this.disposed = false;
      this.stats = { buildings: 0 };
      this.state = game.save.data.planetStates[this.id] || { destroyed: [] };
      const saved = (Array.isArray(this.state.destroyed) ? this.state.destroyed : []).filter(t => typeof t === 'string');
      // Building IDs never contain "." — resident records always start with "z.".
      this.destroyed = new Set(saved.filter(t => !t.startsWith('z.')));
      this.residentTokens = saved.filter(t => t.startsWith('z.'));
      this.rng = M.rand(config.seed);
      this.geometryName = this.id + '-terrain';
      this.ruin = game.universe.ruinLevel(this.id);
      this.ruinFrac = [0, 0.45, 0.65, 0.82, 0.95][Math.min(4, this.ruin)];
      this.lifeMake = null;
      this.crushed = 0;
      this.ownedGeometries = new Set();
      this.fxRoot = group(this.root);
      this.residents = new K.Residents(this, this.residentTokens);
      this.lastAlarm = -1;
      this.edge = config.edge || 1390;
      this.villages = [];
    }
    initialize() {
      this.makeTerrain();
      this.makeCity();
      this.makeRuler();
      const sp = this.config.spawn;
      this.spawn = sp
        ? { p: sp.p.slice(), yaw: sp.yaw || 0, pitch: sp.pitch ?? -0.06 }
        : { p: [0, this.height(0, 215) + 12, 215], yaw: 0, pitch: -0.06 };
      this.makeCreatures();
      this.residents.populate(this.residentSpec ? this.residentSpec() : null);
      this.makeScenery();
      this.infest();
      this.vehicle = new K.Destroyer(this.game, this);
      this.vehicle.p = this.spawn.p.slice();
      this.vehicle.yaw = this.spawn.yaw;
      this.vehicle.pitch = this.spawn.pitch;
      this.createFX();
      return this;
    }
    useSettlementApproach() {
      const spec = this.residents?.spec;
      if (!spec) return;
      const center = spec.center || [0, 0], village = this.villages[0];
      const x = village?.x ?? center[0] + 50, z = village?.z ?? center[1] + 90;
      const at = [x, 0, z + 35];
      // Hover above the actual settlement, including elevated surfaces and roofs.
      const nearby = this.buildings.filter(b => b.alive && Math.hypot(b.p[0] - x, b.p[2] - at[2]) < (b.w || 0) + 28);
      at[1] = Math.max(this.height(x, at[2]), this.floor(x, at[2], 10000), ...nearby.map(b => b.p[1] + b.h)) + 26;
      this.spawn = { p: at, yaw: 0, pitch: -0.37 };
    }
    height(x, z) {
      const m = M.smooth(270, 620, Math.hypot(x, z));
      return (
        m *
        (24 * Math.sin(x * 0.007) * Math.cos(z * 0.009) +
          85 * Math.pow(Math.sin(x * 0.004 + 1) * Math.cos(z * 0.006), 2))
      );
    }
    // Where things come to rest. Worlds whose ground moves override this.
    floor(x, z) {
      return this.height(x, z);
    }
    // More of the same out where the land was empty: villages of the world's own buildings, placed by count on
    // ground flat enough to stand on. build(id, x, z, rng, i) makes one building and returns it.
    outskirts({ n = 6, rMin = 480, rMax = 1200, count = [9, 15], seed = 1, spread = 52, plinth = null, build }) {
      const rng = M.rand(seed),
        sites = [];
      for (let k = 0; k < n * 60 && sites.length < n; k++) {
        const a = rng() * Math.PI * 2,
          R = rMin + Math.sqrt(rng()) * (rMax - rMin),
          x = Math.sin(a) * R,
          z = Math.cos(a) * R;
        if (sites.some(s => Math.hypot(s[0] - x, s[1] - z) < 300)) continue;
        let lo = Infinity,
          hi = -Infinity;
        for (let j = 0; j < 9; j++) {
          const b = (j / 9) * Math.PI * 2,
            h = this.height(x + Math.sin(b) * spread, z + Math.cos(b) * spread);
          lo = Math.min(lo, h);
          hi = Math.max(hi, h);
        }
        if (hi - lo > 22 && k < n * 50) continue;
        sites.push([x, z]);
      }
      sites.forEach(([cx, cz], v) => {
        const total = count[0] + Math.floor(rng() * (count[1] - count[0] + 1));
        for (let i = 0; i < total; i++) {
          const ring = i < 1 ? 0 : i < 7 ? 1 : 2,
            per = ring === 1 ? 6 : Math.max(1, total - 7),
            ang = ((ring === 1 ? i - 1 : i - 7) / per) * Math.PI * 2 + v + (rng() - 0.5) * 0.3,
            rr = ring === 0 ? 0 : ring === 1 ? spread * 0.48 + rng() * 6 : spread * 0.95 + rng() * 10,
            x = cx + Math.sin(ang) * rr,
            z = cz + Math.cos(ang) * rr,
            b = build(`v${v}-${i}`, x, z, rng, i);
          // a footing under it, so nothing hangs over a slope
          if (b && plinth) mesh(b.node, 'box', [0, -3, 0], [b.w * 1.12, 6.4, b.w * 1.12], plinth);
        }
        this.villages.push({ x: cx, z: cz });
      });
    }
    terrain(color, size = 3200, steps = 100, type = 8) {
      const p = [],
        n = [],
        idx = [];
      for (let z = 0; z <= steps; z++)
        for (let x = 0; x <= steps; x++) {
          const wx = (x / steps - 0.5) * size,
            wz = (z / steps - 0.5) * size;
          p.push(wx, this.height(wx, wz), wz);
          n.push(
            ...M.norm([
              this.height(wx - 1, wz) - this.height(wx + 1, wz),
              2,
              this.height(wx, wz - 1) - this.height(wx, wz + 1),
            ]),
          );
        }
      for (let z = 0; z < steps; z++)
        for (let x = 0; x < steps; x++) {
          const a = z * (steps + 1) + x,
            b = a + steps + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      this.game.engine.addGeometry(this.geometryName, { p, n, idx });
      this.ownedGeometries.add(this.geometryName);
      mesh(this.root, this.geometryName, [0, 0, 0], [1, 1, 1], color, { type });
    }
    // Register an interactive solid. Decoration lives under this same node and falls with it.
    building(id, p, w, h, style, hp = 100) {
      const b = {
        id,
        kind: 'building',
        p: p.slice(),
        w,
        h,
        radius: w * 0.72,
        node: group(this.root, p),
        hp,
        maxHp: hp,
        alive: true,
        fall: 0,
        dir: [0, 0, 1],
        style,
        glows: [],
        phase: this.config.stablePhase ? this.idRoll(id, '/phase') * 6.28 : this.rng() * 6.28,
      };
      this.buildings.push(b);
      return b;
    }
    idRoll(id, salt) {
      let h = 41;
      const t = id + salt;
      for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) >>> 0;
      return (h % 1000) / 1000;
    }
    finishBuilding(b) {
      if (this.ruinFrac > 0 && !this.destroyed.has(b.id) && this.idRoll(b.id, '/ruin') < this.ruinFrac)
        this.destroyed.add(b.id);
      if (this.destroyed.has(b.id)) {
        b.alive = false;
        b.node.visible = false;
        this.rubble(b, 5);
      }
      return b;
    }
    prop(p, make, radius = 2) {
      const node = group(this.root, p);
      make(node);
      const e = {
        id: 'prop-' + this.loose.length,
        kind: 'loose',
        node,
        p: p.slice(),
        velocity: [0, 0, 0],
        alive: true,
        radius,
        thrown: false,
      };
      this.loose.push(e);
      return e;
    }
    creature(p, make, scale = 1) {
      this.lifeMake = make;
      const index = this.creatures.length,
        dead = this.ruinFrac > 0 && this.idRoll('life-' + index, '/alive') > 0.26;
      const node = group(this.root, p);
      node.s = [scale, scale, scale];
      make(node);
      node.visible = !dead;
      const e = {
        id: 'life-' + index,
        kind: 'creature',
        node,
        p: p.slice(),
        velocity: [0, 0, 0],
        alive: !dead,
        radius: 1.8 * scale,
        panic: 0,
        seed: this.rng() * 20,
        thrown: false,
        hover: this.config.hover || 1.4,
        beg: this.ruinFrac > 0,
      };
      this.creatures.push(e);
      return e;
    }
    setupRuler(base, body, head, halo, localHeadY = 18, hp = 380, radius = 9) {
      const id = this.definition.rulerId,
        captured = this.game.save.data.trophies.some(t => t.id === id);
      this.ruler = {
        kind: 'ruler',
        id,
        name: this.rulerName,
        node: base,
        body,
        head,
        halo,
        headRestY: localHeadY,
        p: M.add(base.p, [0, localHeadY, 0]),
        radius,
        hp: captured ? 0 : hp,
        maxHp: hp,
        alive: !captured,
        captured,
      };
      head.visible = !captured;
      if (captured) body.r[2] = 0.18;
    }
    createFX() {
      for (let i = 0; i < 2; i++) {
        const b = K.beam(this.fxRoot, [0, 0, 0], [0, 1, 0], 0.13, '#edf6c6', 2);
        b.visible = false;
        this.beams.push(b);
        const t = K.beam(this.fxRoot, [0, 0, 0], [0, 1, 0], 0.1, '#7ae8cb', 1.5);
        t.visible = false;
        this.tethers.push(t);
      }
      this.flare = mesh(this.fxRoot, 'sphere', [0, 0, 0], [1, 1, 1], '#eff9d1', { em: 2 });
      this.flare.visible = false;
    }
    setLine(n, a, b, w) {
      const d = M.sub(b, a),
        length = Math.max(0.01, M.len(d));
      n.p = M.mul(M.add(a, b), 0.5);
      n.s = [w, length, w];
      n.r = [Math.acos(M.clamp(d[1] / length, -1, 1)), Math.atan2(d[0], d[2]), 0];
      n.visible = true;
    }
    raycast(origin, dir, max = 230) {
      let entity = null,
        distance = max;
      for (const b of this.buildings) {
        if (!b.alive) continue;
        const d = M.rayBox(
          origin,
          dir,
          [b.p[0] - b.w * 0.55, b.p[1], b.p[2] - b.w * 0.55],
          [b.p[0] + b.w * 0.55, b.p[1] + b.h * 1.12, b.p[2] + b.w * 0.55],
        );
        if (d < distance) {
          distance = d;
          entity = b;
        }
      }
      for (const list of [this.creatures, this.loose])
        for (const e of list) {
          if (!e.alive) continue;
          const d = M.raySphere(origin, dir, M.add(e.p, [0, 1, 0]), e.radius + 1);
          if (d < distance) {
            distance = d;
            entity = e;
          }
        }
      const person = this.residents.raycast(origin, dir, distance);
      if (person && person.distance < distance) {
        distance = person.distance;
        entity = person.entity;
      }
      if (this.ruler.alive) {
        const d = M.raySphere(origin, dir, this.ruler.p, this.ruler.radius);
        if (d < distance) {
          distance = d;
          entity = this.ruler;
        }
      }
      return entity ? { entity, distance, point: M.add(origin, M.mul(dir, distance)) } : null;
    }
    // where a line from o along d first meets the ground, or Infinity within max
    groundAt(o, d, max = 230) {
      const f = (x, z, y) => (this.floor ? this.floor(x, z, y) : this.height(x, z));
      if (o[1] < f(o[0], o[2], o[1]) - 0.5) return Infinity;
      let t = 0,
        step = 1.2;
      while (t < max) {
        const nt = Math.min(max, t + step),
          y = o[1] + d[1] * nt;
        if (y < f(o[0] + d[0] * nt, o[2] + d[2] * nt, y)) {
          let a = t,
            b = nt;
          for (let k = 0; k < 7; k++) {
            const m = (a + b) / 2,
              ym = o[1] + d[1] * m;
            if (ym < f(o[0] + d[0] * m, o[2] + d[2] * m, ym)) b = m;
            else a = m;
          }
          return (a + b) / 2;
        }
        t = nt;
        step = Math.min(7, step * 1.18);
      }
      return Infinity;
    }
    fire(ship, hit, dt) {
      const dir = M.dir(ship.yaw, ship.pitch),
        right = M.right(ship.yaw);
      // the beam stops where it meets the ground; what stands behind a hill is not touched
      const g = this.groundAt(ship.p, dir, hit ? hit.distance : 230);
      if (g < Infinity) hit = null;
      const ground = g < Infinity ? M.add(ship.p, M.mul(dir, g)) : null,
        end = hit?.point || ground || M.add(ship.p, M.mul(dir, 230));
      this.beamGround = ground;
      if (ground) {
        if (this.swarm) {
          const n = this.swarm.squash(ground[0], ground[2], 1.5, 'burn', ground[1]);
          if (n) this.squashed(n, ground, 'beam');
        }
        this.shotTime += dt;
        if (this.shotTime > 0.08) {
          this.shotTime = 0;
          this.emit(end, 2, this.config.scorch || this.config.rubble, 7, 0.5, true);
        }
      }
      for (let i = 0; i < 2; i++)
        this.setLine(
          this.beams[i],
          M.add(M.add(ship.p, M.mul(right, i ? -1.2 : 1.2)), [0, -0.7, 0]),
          end,
          0.12 + Math.random() * 0.035,
        );
      this.flare.visible = !!(hit || ground);
      this.flare.p = end;
      this.flare.s = [1.3, 1.3, 1.3];
      if (hit) {
        this.damage(hit.entity, 125 * dt, dir, 'beam');
        this.game.ui.hit();
        this.shotTime += dt;
        if (this.shotTime > 0.065) {
          this.shotTime = 0;
          this.emit(end, 3, this.config.spark, 10, 0.6, false);
        }
      }
      // A cutting beam is seen and heard: people near the impact and under the ship flinch.
      if (this.time - this.lastAlarm > 0.2) {
        this.lastAlarm = this.time;
        if (hit) this.residents.alarm(end[0], end[2], hit.entity.kind === 'building' ? 38 : 30, 'beam');
        this.residents.alarm(ship.p[0], ship.p[2], 22, 'beam');
      }
      this.lastFireFX = this.time;
    }
    stopFire() {
      this.beamGround = null;
      this.beams.forEach(n => (n.visible = false));
      if (this.flare) this.flare.visible = false;
    }
    attach(e, ship) {
      if (e.kind === 'creature' || e.kind === 'loose') e.thrown = false;
      e.lowered = false;
      this.tetherTo(e.p, ship);
    }
    // what the tractor's cone may catch on this world (worlds with keepers or angels add theirs)
    grabCandidates() {
      const out = [];
      for (const list of [this.creatures, this.loose]) for (const e of list) if (e.alive) out.push(e);
      for (const r of this.residents.list) if (r.alive && !r.carrier && !r.gone) out.push(r);
      if (this.ruler?.alive && this.ruler.hp <= 0) out.push(this.ruler);
      return out;
    }
    tetherTo(p, ship) {
      const right = M.right(ship.yaw);
      this.tethers.forEach((n, i) =>
        this.setLine(
          n,
          M.add(M.add(ship.p, M.mul(right, i ? 1.1 : -1.1)), [0, -0.6, 0]),
          p,
          0.1 + Math.sin(this.time * 25) * 0.014,
        ),
      );
    }
    stopTether() {
      this.tethers.forEach(n => (n.visible = false));
    }
    damage(e, amount, dir, source) {
      if (!e?.alive || !Number.isFinite(amount) || amount <= 0) return;
      if (e.kind === 'creature') {
        if (e.res) {
          if (source === 'beam' || amount > 30) this.residents.kill(e, source, dir);
          return;
        }
        if (source === 'beam' || amount > 30) this.kill(e, dir);
        return;
      }
      if (e.kind === 'loose') {
        e.velocity = M.add(e.velocity, M.mul(dir, amount * 0.5));
        e.thrown = true;
        return;
      }
      if (e.kind === 'ruler') {
        if (e.hp <= 0) return;
        e.hp = Math.max(0, e.hp - amount);
        e.body.r[2] = Math.sin(this.time * 36) * 0.02;
        if (e.hp === 0) {
          e.body.r[2] = 0.18;
          this.emit(e.p, 30, this.config.spark, 24, 2);
          this.game.audio.impact(2);
          const [title, line] = this.config.rulerBreak || ['왕좌 무력화', this.rulerName + ' · 머리를 견인한 뒤 뒤로 당기세요.'];
          this.game.ui.toast(title, line, 6);
        }
        return;
      }
      e.hp -= amount;
      const t = 1 - M.clamp(e.hp / e.maxHp, 0, 1);
      e.node.r[2] = Math.sin(this.time * 29 + e.phase) * 0.014 * t;
      for (const n of e.glows) n.em = (n.restEm || 0.2) + t * 0.8;
      this.residents.buildingHit(e);
      if (e.hp <= 0) this.collapse(e, dir);
    }
    collapse(b, dir = [0, 0, 1]) {
      if (!b.alive) return;
      b.alive = false;
      b.fall = 0.001;
      b.dir = dir.slice();
      this.destroyed.add(b.id);
      this.stats.buildings++;
      this.emit(M.add(b.p, [0, b.h * 0.55, 0]), 12, this.config.rubble, 18, 2);
      this.game.audio.impact(Math.min(1.8, b.h / 24));
      if (this.vehicle) {
        this.vehicle.shake = Math.max(this.vehicle.shake, 0.5 * Math.max(0, 1 - M.dist(this.vehicle.p, b.p) / 160));
        if (this.vehicle.grab === b) this.vehicle.release();
      }
      for (const e of this.creatures) if (M.dist(e.p, b.p) < 85) e.panic = 7;
      this.residents.collapse(b, dir);
      this.onCollapse(b);
    }
    onCollapse() {}
    later(delay, fn) {
      if (this.pending.length < 180) this.pending.push({ at: this.time + delay, fn });
    }
    // Delayed cascades are bounded and processed outside damage(): no recursive chain explosion.
    shock(p, radius, force, { throwCreatures = true, ruler = false, shred = false } = {}) {
      if (this.swarm && throwCreatures) {
        const n = this.swarm.squash(p[0], p[2], radius * 0.28, 'crush', null, 400);
        if (n) this.squashed(n, p, 'blast');
        this.swarm.alarm(p[0], p[2], radius * 1.5);
      }
      for (const b of this.buildings)
        if (b.alive) {
          const d = M.dist(M.add(b.p, [0, b.h * 0.4, 0]), p);
          if (d < radius + b.w * 0.5)
            this.damage(b, force * Math.max(0.35, 1 - d / (radius + b.w)), M.norm(M.sub(b.p, p)), 'chain');
        }
      if (throwCreatures) {
        for (const list of [this.creatures, this.loose])
          for (const e of list)
            if (e.alive && M.dist(e.p, p) < radius) {
              e.velocity = M.add(M.mul(M.norm(M.sub(e.p, p)), 25), [0, 22, 0]);
              e.thrown = true;
              e.panic = 8;
            }
        this.residents.shock(p, radius, force, shred);
      }
      if (ruler && this.ruler.alive && M.dist(this.ruler.p, p) < radius)
        this.damage(this.ruler, force, [0, 1, 0], 'chain');
    }
    rubble(b, count = 7) {
      const rng = M.rand(b.id.split('').reduce((a, c) => Math.imul(a, 31) + c.charCodeAt(0), 41));
      for (let i = 0; i < count; i++) {
        const x = b.p[0] + (rng() - 0.5) * b.w * 1.5,
          z = b.p[2] + (rng() - 0.5) * b.w * 1.5;
        const n = mesh(
          this.root,
          this.config.rubbleGeo || 'box',
          [x, this.height(x, z) + 0.8, z],
          [1 + rng() * 3.5, 1 + rng() * 2, 1 + rng() * 3.5],
          i % 4 ? this.config.rubble : this.config.accent,
        );
        n.r = [rng() * 2, rng() * 6, rng()];
      }
      mesh(this.root, 'disc', [b.p[0], b.p[1] + 0.045, b.p[2]], [b.w * 2, 0.02, b.w * 2], this.config.scorch || '#22272a', {
        type: 6,
        alpha: 0.6,
      });
      this.residents.rubbleBodies(b);
    }
    kill(e, dir) {
      if (!e.alive) return;
      e.alive = false;
      e.node.visible = false;
      this.emit(M.add(e.p, [0, 1, 0]), 6, this.config.lifeColor || this.config.accent, 12, 1.8);
      if (this.vehicle?.grab === e) this.vehicle.release();
      this.game.audio.noiseHit(0.1, 0.028, 450);
    }
    emit(p, count, color, speed = 12, life = 2, gravity = true) {
      if (this.disposed) return;
      const limit = this.game.settings.quality === 'low' ? 90 : 190;
      for (let i = 0; i < count; i++) {
        if (this.fragments.length >= limit) {
          const f = this.fragments.shift();
          this.fxRoot.remove(f.node);
        }
        const size = 0.25 + Math.random() * 1.1,
          node = mesh(this.fxRoot, i % 3 ? 'box' : 'lowSphere', p.slice(), [size, size * 0.6, size], color, {
            em: gravity ? 0.05 : 0.6,
          });
        this.fragments.push({
          node,
          p: p.slice(),
          v: [
            (Math.random() - 0.5) * speed,
            (gravity ? Math.random() * 0.8 + 0.2 : Math.random() - 0.3) * speed,
            (Math.random() - 0.5) * speed,
          ],
          spin: [Math.random() * 6, Math.random() * 6, Math.random() * 6],
          life,
          gravity,
        });
      }
    }
    wave(p, color = '#b9f5d5', speed = 100, life = 0.6) {
      if (this.waves.length >= 14) {
        const w = this.waves.shift();
        this.fxRoot.remove(w.node);
      }
      const n = mesh(this.fxRoot, 'torus', p.slice(), [1, 1, 1], color, { em: 1, alpha: 0.65 });
      this.waves.push({ node: n, t: 0, speed, life });
    }
    // the craft's own shockwave (F, or the hull slammed into the ground): everyone inside it is torn apart
    pulseAt(p, radius, force) {
      this.shock(p, radius, force, { ruler: true, shred: true });
      this.emit(p, 20, this.config.spark, 34, 1.2, false);
    }
    collide(ship, dt) {
      if (ship.hitCooldown > 0) return;
      const speed = M.len(ship.velocity);
      for (const b of this.buildings) {
        if (!b.alive) continue;
        const dx = ship.p[0] - b.p[0],
          dz = ship.p[2] - b.p[2],
          lim = b.w * 0.55 + 2.7;
        if (Math.abs(dx) < lim && Math.abs(dz) < lim && ship.p[1] > b.p[1] && ship.p[1] < b.p[1] + b.h * 1.05 + 1.8) {
          if (speed > 6) {
            const dir = M.norm(ship.velocity);
            this.damage(b, 60 + speed * 3.1, dir, 'ram');
            ship.velocity = M.mul(ship.velocity, b.alive ? 0.25 : 0.73);
            ship.hitCooldown = 0.3;
            ship.shake = 0.7;
            this.emit(ship.p, 12, this.config.rubble, 18, 1.4);
            this.game.audio.impact(1.2);
          } else {
            const away = M.norm(Math.abs(dx) + Math.abs(dz) > 0.01 ? [dx, 0, dz] : [1, 0, 0]);
            ship.p = M.add(ship.p, M.mul(away, dt * 9));
          }
          break;
        }
      }
      for (const e of this.creatures)
        if (e.alive && M.dist(e.p, ship.p) < 5 && speed > 9) {
          const was = e.beg;
          this.kill(e, M.norm(ship.velocity));
          if (was) {
            this.crushed++;
            this.game.universe.countLost();
            this.game.ui.toast(
              '생존자를 치었습니다',
              this.crushed > 1 ? this.crushed + '명째입니다.' : '달려오던 사람이었습니다.',
              3,
            );
          }
        }
      this.residents.collide(ship);
      if (this.ruler.alive && M.dist(ship.p, this.ruler.p) < this.ruler.radius + 2 && speed > 15) {
        this.damage(this.ruler, speed * 3.5, M.norm(ship.velocity), 'ram');
        ship.hitCooldown = 0.5;
        ship.velocity = M.mul(ship.velocity, -0.15);
        ship.shake = 1;
        this.game.audio.impact(2);
      }
    }
    captureRuler() {
      if (this.disposed || this.game.universe.destroyed(this.id) || this.ruler.captured || this.ruler.hp > 0)
        return false;
      this.ruler.captured = true;
      this.ruler.alive = false;
      this.ruler.head.visible = false;
      this.newCapture = true;
      this.stopTether();
      this.game.save.addTrophy({
        id: this.ruler.id,
        planet: this.id,
        name: this.rulerName,
        time: new Date().toISOString(),
      });
      this.snapshot();
      this.game.persist('checkpoint');
      this.emit(this.ruler.p, 28, this.config.spark, 22, 2);
      this.game.interior.updateTrophies();
      return true;
    }
    updateThrown(e, dt) {
      if (e.ball) return this.updateBall(e, dt);
      e.velocity[1] -= 22 * dt;
      // set down by the beam: it comes down slowly and lands on its feet
      if (e.lowered) {
        const k = Math.exp(-2.4 * dt);
        e.velocity[0] *= k;
        e.velocity[2] *= k;
        e.velocity[1] = Math.max(e.velocity[1], -11);
      }
      e.p = M.add(e.p, M.mul(e.velocity, dt));
      e.node.r[0] += dt * 2.7;
      e.node.r[2] += dt * 1.9;
      const floor = this.floor(e.p[0], e.p[2]) + (e.rest ?? 1);
      if (e.p[1] < floor) {
        e.p[1] = floor;
        // something soft thrown hard bursts where it lands (an eye pulled out of the living world)
        if (e.splat && !e.lowered && M.len(e.velocity) > 12) {
          e.splat(e);
          return;
        }
        if (e.kind === 'creature' && M.len(e.velocity) > 14 && !e.lowered) {
          this.kill(e, [0, 1, 0]);
          return;
        }
        if (e.lowered) {
          e.lowered = false;
          e.thrown = false;
          e.velocity = [0, 0, 0];
          e.node.p = e.p.slice();
          return;
        }
        e.velocity = [e.velocity[0] * 0.7, Math.abs(e.velocity[1]) * 0.28, e.velocity[2] * 0.7];
        if (M.len(e.velocity) < 3) e.thrown = false;
        this.game.audio.impact(0.13);
      }
      e.node.p = e.p.slice();
      for (const b of this.buildings)
        if (
          b.alive &&
          Math.abs(e.p[0] - b.p[0]) < b.w * 0.5 + 1 &&
          Math.abs(e.p[2] - b.p[2]) < b.w * 0.5 + 1 &&
          e.p[1] > b.p[1] &&
          e.p[1] < b.p[1] + b.h &&
          M.len(e.velocity) > 15
        ) {
          this.damage(b, M.len(e.velocity) * 2.5, M.norm(e.velocity), 'throw');
          if (e.kind === 'creature') this.kill(e, M.norm(e.velocity));
          else e.velocity = M.mul(e.velocity, -0.35);
          break;
        }
    }
    /* ---------- bugs, on whatever world has them ---------- */
    // a world brings its own swarm (THAW); any other one gets the few that rode in on the ship
    infest() {
      if (this.config.noInfest || this.swarm) return;
      const u = this.game.universe;
      let n = 0,
        at = null;
      for (const t of this.destroyed)
        if (t.startsWith('v.')) {
          const parts = t.split('.');
          n = parseInt(parts[1], 36) || 0;
          if (parts[2]) at = [parseInt(parts[2], 36) - 2000, parseInt(parts[3], 36) - 2000];
        }
      const aboard = u.stowaways || 0;
      const grown = n > 0;
      if (grown) n = Math.min(700, Math.round(n * 1.5 + 4));
      if (aboard > 0) {
        n += aboard;
        u.stowaways = 0;
        u.flush?.();
      }
      if (n <= 0) return;
      if (!at) {
        const sp = this.spawn.p,
          ang = Math.random() * Math.PI * 2;
        at = [Math.round(sp[0] + Math.sin(ang) * 14), Math.round(sp[2] - 30 + Math.cos(ang) * 14)];
      }
      this.infestAt = at;
      this.swarm = new K.Swarm(this, { capacity: n + 8, seed: n + 3 });
      this.swarm.addCluster({ x: at[0], z: at[1], r: 4 + Math.sqrt(n) * 0.9, n });
      this.infestCount = () => this.swarm.alive;
      if (aboard > 0)
        this.later(2.5, () =>
          this.game.ui.toast(
            '실려 온 벌레들이 내려갔습니다',
            grown ? `이 땅에 먼저 자리 잡은 벌레들과 합쳐졌습니다. ${n}마리.` : `THAW에서 따라온 ${aboard}마리가 이 땅에 자리를 잡습니다.`,
            6,
          ),
        );
    }
    // a world's own reaction to bugs dying (THAW keeps count and speaks of it)
    squashed(n, p, how) {
      const v = this.vehicle,
        d = M.dist(v.p, p);
      const [pan, gain] = [M.clamp((p[0] - v.p[0]) / 60, -1, 1), Math.max(0.15, 1 - d / 90)];
      if (this.time - (this.lastCrunch || 0) > 0.07) {
        this.lastCrunch = this.time;
        this.game.audio.crunch(Math.min(n, 12), pan, gain);
      }
      this.emit([p[0], p[1] + 0.3, p[2]], Math.min(10, 2 + n), how === 'beam' ? '#2a1a10' : '#c9781f', 6 + Math.min(n, 10), 0.7, true);
      if (how === 'hull' || how === 'slam') v.shake = Math.max(v.shake, Math.min(0.25, 0.04 + n * 0.012));
      this.onSquash?.(n, p, how);
    }
    slammed(at, k) {
      if (!this.swarm) return;
      const n = this.swarm.squash(at[0], at[2], 3.5 + k * 6, 'crush', at[1], 800);
      if (n) this.squashed(n, at, 'slam');
      this.swarm.alarm(at[0], at[2], 14 + k * 18);
    }
    // the tractor finding nothing solid in its cone takes up the bugs that are in it, as a ball
    tractorFallback(o, f, range, cone) {
      if (!this.swarm || this.swarm.ball) return null;
      const list = this.swarm.gather(o, f, range, cone * 1.25, 70);
      if (list.length < 3) return null;
      const S = this.swarm;
      let cx = 0,
        cy = 0,
        cz = 0;
      for (const i of list) {
        cx += S.x[i];
        cy += S.y[i];
        cz += S.z[i];
      }
      const p = [cx / list.length, cy / list.length + 0.4, cz / list.length],
        ball = { kind: 'loose', ball: true, alive: true, p, velocity: [0, 0, 0], node: { p: p.slice(), r: [0, 0, 0], visible: true }, radius: 0.3 + Math.cbrt(list.length) * 0.22, label: '벌레 떼 · ' + list.length + '마리', hp: 1, thrown: false };
      S.hold(list, ball);
      this.loose.push(ball);
      return { entity: ball, distance: M.dist(o, p), point: p };
    }
    updateBall(e, dt) {
      e.velocity[1] -= 22 * dt;
      if (e.lowered) {
        const k = Math.exp(-2.4 * dt);
        e.velocity[0] *= k;
        e.velocity[2] *= k;
        e.velocity[1] = Math.max(e.velocity[1], -11);
      }
      e.p = M.add(e.p, M.mul(e.velocity, dt));
      e.node.p = e.p.slice();
      const fl = (this.floor ? this.floor(e.p[0], e.p[2], e.p[1]) : this.height(e.p[0], e.p[2])) + e.radius * 0.5;
      let hitWall = false;
      for (const b of this.buildings)
        if (b.alive && Math.abs(e.p[0] - b.p[0]) < b.w * 0.55 && Math.abs(e.p[2] - b.p[2]) < b.w * 0.55 && e.p[1] > b.p[1] && e.p[1] < b.p[1] + b.h) {
          hitWall = true;
          break;
        }
      if (e.p[1] <= fl || hitWall) {
        const speed = M.len(e.velocity),
          splat = !e.lowered && (speed > 9 || hitWall);
        e.p[1] = Math.max(e.p[1], fl);
        const n = this.swarm.releaseHeld(splat);
        if (splat && n) {
          this.squashed(n, e.p, 'throw');
          this.game.audio.squelch('pop', 0, 0.9);
        }
        e.alive = false;
        e.thrown = false;
        this.loose.splice(this.loose.indexOf(e), 1);
      }
    }
    // bugs where the ship hangs low and still: some climb aboard and go wherever it goes next
    swarmStep(dt) {
      const sw = this.swarm,
        v = this.vehicle;
      if (!sw) return;
      const fl = this.floor ? this.floor(v.p[0], v.p[2], v.p[1]) : this.height(v.p[0], v.p[2]),
        alt = v.p[1] - fl,
        speed = M.len(v.velocity),
        hover = this.config.hover ?? 3.6;
      const threat = { p: v.p, alt, speed, shadow: 2.5 + Math.max(0, 26 - alt) * 0.32 + speed * 0.1, beam: this.beamGround || null, blast: null };
      sw.update(dt, threat);
      // the hull, skimming within a metre or so of the ground, runs over what has not got out of the way
      if (alt < hover + 1.1 && speed > 1.2) {
        const n = sw.squash(v.p[0] + v.velocity[0] * 0.05, v.p[2] + v.velocity[2] * 0.05, 2.5, 'crush', fl);
        if (n) this.squashed(n, [v.p[0], fl, v.p[2]], 'hull');
      }
      if (alt < hover + 1.6 && speed < 2.5 && this.config.stowable !== false && (this.stow || 0) < 24) {
        this.stowT = (this.stowT || 0) + dt;
        if (this.stowT > 0.55) {
          this.stowT = 0;
          const near = sw.gather([v.p[0], fl + 3, v.p[2]], [0, -1, 0], 6, 1.1, 1);
          if (near.length) {
            sw.take(near[0]);
            this.stow = (this.stow || 0) + 1;
            if (this.stow === 3)
              this.game.ui.toast('벌레 몇 마리가 기체 밑으로 숨어들었습니다', '떠날 때 같이 실려 갑니다.', 5);
          }
        }
      }
      sw.render();
    }
    update(dt, input) {
      this.time += dt;
      this.vehicle.update(dt, input);
      if (this.game.mode !== 'planet' || this.disposed) return;
      const player = this.vehicle.p;
      let budget = 12;
      for (let i = 0; i < this.pending.length && budget > 0;) {
        const e = this.pending[i];
        if (e.at <= this.time) {
          this.pending.splice(i, 1);
          budget--;
          e.fn();
        } else i++;
      }
      for (const b of this.buildings)
        if (b.fall > 0 && b.fall < 2) {
          b.fall += dt;
          const t = b.fall / 1.35;
          if (this.config.fallMode === 'shatter') {
            b.node.s = [Math.max(0.05, 1 - t * 0.55), Math.max(0.04, 1 - t * 0.8), Math.max(0.05, 1 - t * 0.55)];
            b.node.r[2] = t * 0.4;
          } else if (this.config.fallMode === 'wilt') {
            b.node.s[1] = Math.max(0.03, 1 - t * 0.8);
            b.node.r[0] = t * 0.55 * (b.dir[2] >= 0 ? 1 : -1);
            b.node.r[2] = t * 0.65 * (b.dir[0] >= 0 ? -1 : 1);
          } else {
            b.node.r[2] = Math.min(t * t * 1.2, 1.5) * (b.dir[0] >= 0 ? -1 : 1);
            b.node.r[0] = Math.min(t * t * 0.6, 0.85) * (b.dir[2] >= 0 ? 1 : -1);
          }
          if (b.fall > 1.35) {
            b.node.visible = false;
            b.fall = 3;
            this.emit(M.add(b.p, [0, 3, 0]), 10, this.config.rubble, 21, 2);
            this.rubble(b);
          }
        }
      for (const e of this.creatures) {
        if (!e.alive || this.vehicle.grab === e) continue;
        if (e.thrown) {
          this.updateThrown(e, dt);
          continue;
        }
        const gap = M.dist(e.p, player);
        if (e.beg ? gap < 150 : gap < 65 && (M.len(this.vehicle.velocity) > 5 || this.vehicle.firing)) e.panic = 5;
        e.panic = Math.max(0, e.panic - dt);
        const a = Math.sin(this.time * 0.17 + e.seed) * 3,
          away = M.norm([e.p[0] - player[0], 0, e.p[2] - player[2]]);
        const dir = e.panic ? (e.beg ? M.mul(away, -1) : away) : [Math.sin(a), 0, Math.cos(a)];
        const speed = e.panic ? (e.beg ? (gap < 11 ? 0 : 7.5) : this.config.runSpeed || 9) : 1.2;
        e.p[0] += dir[0] * speed * dt;
        e.p[2] += dir[2] * speed * dt;
        if (Math.hypot(e.p[0], e.p[2]) > 610) {
          e.p[0] *= 0.995;
          e.p[2] *= 0.995;
        }
        e.p[1] =
          this.height(e.p[0], e.p[2]) +
          e.hover +
          Math.abs(Math.sin(this.time * (e.panic ? 16 : 3) + e.seed)) * (e.panic ? 0.5 : 0.18);
        e.node.p = e.p.slice();
        e.node.r[1] = Math.atan2(dir[0], dir[2]);
        e.node.r[2] = Math.sin(this.time * 13 + e.seed) * (e.panic ? 0.1 : 0.015);
      }
      for (const e of this.loose.slice()) if (e.alive && e.thrown && this.vehicle.grab !== e) this.updateThrown(e, dt);
      // a ball of bugs let go of without being thrown hangs on the beam's last pull and comes down slowly
      for (const e of this.loose.slice()) if (e.ball && e.alive && !e.thrown && this.vehicle.grab !== e) {
        e.thrown = true;
        e.lowered = true;
      }
      this.residents.update(dt);
      this.swarmStep(dt);
      this.game.ui.setSignal(this.signalValue());
      for (let i = this.fragments.length - 1; i >= 0; i--) {
        const f = this.fragments[i];
        f.life -= dt;
        if (f.life <= 0) {
          this.fxRoot.remove(f.node);
          this.fragments.splice(i, 1);
          continue;
        }
        if (f.gravity) f.v[1] -= 24 * dt;
        f.p = M.add(f.p, M.mul(f.v, dt));
        const floor = this.floor(f.p[0], f.p[2]) + 0.3;
        if (f.p[1] < floor) {
          f.p[1] = floor;
          f.v = [f.v[0] * 0.7, Math.abs(f.v[1]) * 0.25, f.v[2] * 0.7];
        }
        f.node.p = f.p;
        for (let k = 0; k < 3; k++) f.node.r[k] += f.spin[k] * dt;
        f.node.alpha = Math.min(1, f.life / 0.7);
      }
      for (let i = this.waves.length - 1; i >= 0; i--) {
        const w = this.waves[i];
        w.t += dt;
        const scale = 1 + w.t * w.speed;
        w.node.s = [scale, scale, scale];
        w.node.alpha = 0.55 * Math.max(0, 1 - w.t / w.life);
        if (w.t > w.life) {
          this.fxRoot.remove(w.node);
          this.waves.splice(i, 1);
        }
      }
      const r = this.ruler;
      if (r.alive && r.hp > 0) {
        r.head.r[1] = Math.sin(this.time * 0.28) * 0.1;
        r.head.p[1] = r.headRestY + Math.sin(this.time * 1.3) * 0.22;
      }
      this.updateWorld(dt);
    }
    updateWorld() {}
    signalValue() {
      return this.residents.signal();
    }
    snapshot() {
      if (this.disposed) return;
      let keep = [...this.destroyed];
      if (this.infestCount && !this.config.noInfest) {
        keep = keep.filter(t => !t.startsWith('v.'));
        const n = this.infestCount();
        if (n > 0) keep.push('v.' + n.toString(36) + '.' + (this.infestAt[0] + 2000).toString(36) + '.' + (this.infestAt[1] + 2000).toString(36));
      }
      this.game.save.data.planetStates[this.id] = {
        destroyed: [...keep, ...this.residents.tokens()],
        visited: true,
      };
      // bugs that climbed aboard go with the ship
      if (this.stow > 0) {
        this.game.universe.stowaways = Math.min(60, (this.game.universe.stowaways || 0) + this.stow);
        this.stow = 0;
        this.game.universe.flush?.();
      }
      if (!this.game.save.data.visited.includes(this.id)) this.game.save.data.visited.push(this.id);
    }
    dispose() {
      if (this.disposed) return;
      this.snapshot();
      this.vehicle.release();
      this.disposed = true;
      this.pending.length = 0;
      this.residents.dispose();
      this.root.batches = null;
      this.root.children.length = 0;
      for (const name of this.ownedGeometries) this.game.engine.removeGeometry(name);
      this.ownedGeometries.clear();
      for (const key of ['buildings', 'creatures', 'loose', 'fragments', 'waves', 'animated', 'beams', 'tethers'])
        this[key].length = 0;
    }
  }
  K.Surface = Surface;
})((window.KO ||= {}));

// FILE: src/planets/barren.js
/* 빈 세계. 대부분의 행성은 아무도 살지 않았다. 지형만 있고 도시도 주민도 왕도 없다. */
(function (K) {
  'use strict';
  const { M, mesh, group } = K;
  const ENVS = {
    ocean: {
      fog: [0.42, 0.55, 0.58],
      fogD: 0.0016,
      ambient: 0.66,
      sun: [-0.5, 0.8, 0.3],
      skyTop: [0.09, 0.15, 0.22],
      skyHorizon: [0.44, 0.58, 0.62],
      skyCloud: [0.6, 0.68, 0.7],
      skyStyle: 0,
    },
    dune: {
      fog: [0.66, 0.55, 0.41],
      fogD: 0.0019,
      ambient: 0.72,
      sun: [-0.42, 0.86, 0.2],
      skyTop: [0.16, 0.15, 0.17],
      skyHorizon: [0.72, 0.56, 0.38],
      skyCloud: [0.6, 0.5, 0.4],
      skyStyle: 1,
    },
    ice: {
      fog: [0.63, 0.72, 0.78],
      fogD: 0.0014,
      ambient: 0.7,
      sun: [-0.6, 0.62, 0.38],
      skyTop: [0.12, 0.18, 0.26],
      skyHorizon: [0.6, 0.72, 0.8],
      skyCloud: [0.72, 0.79, 0.84],
      skyStyle: 0,
    },
    lava: {
      fog: [0.3, 0.18, 0.15],
      fogD: 0.0018,
      ambient: 0.58,
      sun: [-0.45, 0.7, -0.2],
      skyTop: [0.07, 0.06, 0.09],
      skyHorizon: [0.5, 0.26, 0.17],
      skyCloud: [0.34, 0.22, 0.2],
      skyStyle: 2,
    },
    toxic: {
      fog: [0.4, 0.46, 0.3],
      fogD: 0.0021,
      ambient: 0.6,
      sun: [-0.35, 0.78, 0.32],
      skyTop: [0.11, 0.15, 0.1],
      skyHorizon: [0.5, 0.56, 0.34],
      skyCloud: [0.44, 0.5, 0.34],
      skyStyle: 1,
    },
    obsidian: {
      fog: [0.2, 0.18, 0.27],
      fogD: 0.0015,
      ambient: 0.5,
      sun: [-0.62, 0.6, 0.3],
      skyTop: [0.05, 0.05, 0.1],
      skyHorizon: [0.26, 0.22, 0.38],
      skyCloud: [0.2, 0.18, 0.3],
      skyStyle: 2,
    },
    crystal: {
      fog: [0.48, 0.55, 0.62],
      fogD: 0.0013,
      ambient: 0.68,
      sun: [-0.55, 0.74, 0.34],
      skyTop: [0.1, 0.13, 0.22],
      skyHorizon: [0.52, 0.6, 0.74],
      skyCloud: [0.6, 0.66, 0.8],
      skyStyle: 0,
    },
  };
  /* 타입마다 땅이 원래 그렇게 생겼다. 구경거리를 심지 않는다. */
  const SHAPE = {
    ocean: (x, z, a, b) => 9 * Math.sin(x * 0.004 + a) * Math.cos(z * 0.0037 + b) + 5 * Math.sin((x + z) * 0.011 + a),
    dune: (x, z, a, b) =>
      46 * Math.pow(Math.abs(Math.sin(x * 0.0032 + Math.sin(z * 0.0016 + b) * 1.7 + a)), 1.4) +
      7 * Math.sin(z * 0.02 + a),
    ice: (x, z, a, b) =>
      14 * Math.sin(x * 0.0029 + a) * Math.cos(z * 0.0031 + b) -
      34 * Math.pow(Math.max(0, 1 - Math.abs(Math.sin(x * 0.0051 + b) * Math.cos(z * 0.0044 + a)) * 4.5), 2),
    lava: (x, z, a, b) =>
      20 * Math.sin(x * 0.0035 + a) * Math.cos(z * 0.0041 + b) -
      46 * Math.pow(Math.max(0, 1 - Math.abs(Math.sin((x * 0.9 + z * 0.4) * 0.0047 + a)) * 6), 3),
    toxic: (x, z, a, b) =>
      26 * Math.sin(x * 0.0026 + a) * Math.cos(z * 0.0023 + b) +
      11 * Math.sin(x * 0.0093 + b) * Math.sin(z * 0.0088 + a),
    obsidian: (x, z, a, b) => Math.floor((28 * Math.sin(x * 0.0027 + a) * Math.cos(z * 0.0033 + b)) / 13) * 13,
    crystal: (x, z, a, b) => Math.abs(38 * Math.sin(x * 0.0031 + a) * Math.cos(z * 0.0029 + b)) - 12,
  };
  class Barren extends K.Surface {
    constructor(game, def) {
      const t = def.type,
        env = ENVS[t] || ENVS.ocean;
      super(game, def, {
        seed: Math.round(def.seed * 97) || 1,
        rulerName: '없음',
        areaLabel: (def.name || def.id).toUpperCase() + ' / SURFACE',
        regionName: '지표',
        afterLabel: '지표',
        rubble: def.color,
        accent: def.color,
        spark: def.air,
        lifeColor: def.color,
        environment: env,
      });
      this.barren = true;
      this.shape = SHAPE[t] || SHAPE.ocean;
      this.phaseA = def.seed % 6.283;
      this.phaseB = (def.seed * 1.618) % 6.283;
      this.amp = 0.75 + ((def.index % 7) / 7) * 0.8;
      this.initialize();
    }
    height(x, z) {
      const m = M.smooth(240, 900, Math.hypot(x, z));
      return m * this.amp * this.shape(x, z, this.phaseA, this.phaseB);
    }
    makeTerrain() {
      this.terrain(this.definition.color);
    }
    makeCity() {}
    makeCreatures() {}
    makeScenery() {}
    makeRuler() {
      const base = group(this.root, [0, -4000, 0]);
      base.visible = false;
      const body = group(base),
        head = group(base),
        halo = group(base);
      this.setupRuler(base, body, head, halo, 0, 1, 3);
      this.ruler.alive = false;
      this.ruler.captured = true;
      this.ruler.hp = 0;
    }
  }
  K.Barren = Barren;
})((window.KO ||= {}));
