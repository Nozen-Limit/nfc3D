import * as T from 'three'
import { createSpaceEvents } from './space-events.js'

export function mountResumeScene(canvas){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mobile=matchMedia('(max-width:760px)').matches;
 const renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.1,60);camera.position.z=8;
 const spaceEvents=createSpaceEvents(T,scene,reduced,mobile);
 const uniforms={uTime:{value:0},uResolution:{value:new T.Vector2(1,1)},uScroll:{value:0}};
 const background=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,toneMapped:false,
 vertexShader:'void main(){gl_Position=vec4(position.xy,.999,1.);}',
 fragmentShader:`uniform float uTime;
uniform vec2 uResolution;
uniform float uScroll;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 stars(vec2 pixel,float cellSize,float seed){
 vec2 grid=pixel/cellSize,cell=floor(grid),f=fract(grid);
 float id=hash(cell+seed);
 vec2 center=vec2(hash(cell+13.4+seed),hash(cell+87.2+seed))*.76+.12;
 vec2 d=(f-center)*cellSize;
 float radius=mix(.40,1.05,pow(id,7.));
 float point=exp(-dot(d,d)/(radius*radius));
 float halo=exp(-length(d)*1.8)*.08;
 float brightness=step(.82,id)*mix(.18,.90,pow(id,4.));
 vec3 tint=mix(vec3(.72,.81,1.),vec3(1.,.94,.82),hash(cell+53.));
 return tint*(point+halo)*brightness;
}
void main(){
 vec2 pixel=gl_FragCoord.xy*(800./uResolution.y);
 vec3 color=stars(pixel,35.,1.)+stars(pixel,69.,7.);
 gl_FragColor=vec4(color,1.);
}
`
 }));background.renderOrder=-100;background.frustumCulled=false;scene.add(background);
 const count=mobile?30000:50000,position=new Float32Array(count*3),seeds=new Float32Array(count*3);
 let state=93271;function random(){state=(state*1664525+1013904223)>>>0;return state/4294967296;}
 const starCount=mobile?650:1100,starPositions=new Float32Array(starCount*3),starSeeds=new Float32Array(starCount);
 for(let i=0;i<starCount;i++){starPositions[i*3]=(random()-.5)*24.;starPositions[i*3+1]=(random()-.5)*20.;starPositions[i*3+2]=-12.+random()*15.;starSeeds[i]=random();}
 const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(starPositions,3));starGeometry.setAttribute('aSeed',new T.BufferAttribute(starSeeds,1));
 const starMaterial=new T.ShaderMaterial({uniforms:{uTime:uniforms.uTime,uRatio:{value:renderer.getPixelRatio()}},transparent:true,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending,
 vertexShader:'attribute float aSeed;uniform float uTime;uniform float uRatio;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((.8+pow(aSeed,8.)*2.2)*uRatio*7./-mv.z,.65,3.);vAlpha=(.25+aSeed*.5)*(.92+.08*sin(uTime*.6+aSeed*30.));}',
 fragmentShader:'varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float a=exp(-d*d*17.)*(1.-smoothstep(.38,.5,d));gl_FragColor=vec4(.86,.90,1.,a*vAlpha);}'});
 const deepStars=new T.Points(starGeometry,starMaterial);scene.add(deepStars);
 for(let i=0;i<count;i++){
  const bulge=random()<.36;
  let r,theta,z;
  if(bulge){r=Math.pow(random(),1.9)*.62;theta=random()*Math.PI*2;z=(random()+random()-1)*.28*(1-r/.8);}
  else{r=.16+Math.pow(random(),1.45)*1.85;const arm=random()<.5?0:Math.PI;const diffuse=random()<.30;theta=diffuse?random()*Math.PI*2:arm+Math.log(r+.15)*4.2+(random()+random()-1)*.65;z=(random()+random()-1)*(.028+r*.025);}
  position[i*3]=r*Math.cos(theta);position[i*3+1]=r*Math.sin(theta);position[i*3+2]=z;
  seeds[i*3]=random();seeds[i*3+1]=random();seeds[i*3+2]=random();
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(position,3));geometry.setAttribute('aSeed',new T.BufferAttribute(seeds,3));
 const previousTarget=new Float32Array(count*3),nextTarget=new Float32Array(count*3);geometry.setAttribute('aPrevious',new T.BufferAttribute(previousTarget,3));geometry.setAttribute('aTarget',new T.BufferAttribute(nextTarget,3));
 const particleUniforms={uTime:{value:0},uRatio:{value:renderer.getPixelRatio()},uOpacity:{value:1},uMorph:{value:0},uLogoMix:{value:1}};
 const material=new T.ShaderMaterial({uniforms:particleUniforms,transparent:true,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending,
 vertexShader:`attribute vec3 aSeed;
attribute vec3 aPrevious;
attribute vec3 aTarget;
uniform float uTime;
uniform float uRatio;
uniform float uOpacity;
uniform float uMorph;
uniform float uLogoMix;
varying float vAlpha;
varying float vColor;
varying float vRadius;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){
 vec3 p=position;
 vRadius=length(p.xy);
 p.xy=rot(uTime*.035)*p.xy;
 p.yz=rot(1.08)*p.yz;
 p.xy=rot(-.55)*p.xy;
 float m=smoothstep(aSeed.x*.16,.84+aSeed.x*.16,uMorph);
 vec3 logo=mix(aPrevious,aTarget,smoothstep(0.,1.,uLogoMix));
 float halo=step(.78,aSeed.x);
 float speed=.22+aSeed.y*.18;
 float life=fract(uTime*speed+aSeed.z);
 float envelope=sin(life*3.14159);
 float t=uTime*1.45;
 vec3 flow=vec3(sin(logo.y*6.+t)+cos(logo.z*5.-t*.8),sin(logo.z*6.+t*.7)+cos(logo.x*5.+t),sin(logo.x*6.-t*.8)+cos(logo.y*5.+t*.6));
 // Most points churn on the surface; a smaller layer lifts off, falls, and returns.
 logo+=flow*(.018+halo*.045);
 logo.x+=sin(life*6.28+aSeed.y*12.)*envelope*(.018+halo*.095);
 logo.y+=(.5-life)*envelope*(.035+halo*.42);
 logo.z+=sin(life*3.14159)*(.025+halo*.20);
 p=mix(p,logo,m);
 p+=sin(m*3.14159)*(aSeed-.5)*.85;
 vec4 mv=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*mv;
 float size=mix(1.25,2.85,pow(aSeed.y,5.));
 gl_PointSize=clamp(size*uRatio*8./-mv.z,1.05,3.5);
 float surfaceAlpha=.55+.35*aSeed.z;
 float snowAlpha=envelope*(.35+.45*aSeed.z);
 vAlpha=mix(.42+.35*aSeed.z,mix(surfaceAlpha,snowAlpha,halo),m)*uOpacity;
 vAlpha*=1.-m*(.12+.16*sin(t*.7+aSeed.z*21.));
 vColor=aSeed.y;
}
`,
 fragmentShader:`uniform float uMorph;varying float vAlpha;varying float vColor;varying float vRadius;void main(){float d=length(gl_PointCoord-.5);float a=exp(-d*d*17.)*(1.-smoothstep(.38,.5,d));vec3 core=mix(vec3(.88,.66,.36),vec3(1.,.93,.78),vColor);vec3 disk=mix(vec3(.48,.66,1.),vec3(.92,.96,1.),vColor);vec3 color=mix(core,disk,smoothstep(.18,.90,vRadius));color=mix(color,vec3(.88,.93,1.),uMorph);gl_FragColor=vec4(color,a*vAlpha);}`
 });
 const sculpture=new T.Points(geometry,material),group=new T.Group();group.add(sculpture);scene.add(group);
 const glowMaterial=new T.ShaderMaterial({uniforms:{uOpacity:particleUniforms.uOpacity},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uOpacity;void main(){float r=length((vUv-.5)*2.);float core=exp(-r*r*80.);float halo=exp(-r*r*14.);gl_FragColor=vec4(vec3(1.,.76,.43),(.60*core+.12*halo)*uOpacity);}'});
 const glow=new T.Mesh(new T.PlaneGeometry(2.4,2.4),glowMaterial);glow.rotation.set(1.08,0,-.55);sculpture.add(glow);
 const logoCache=new Map();let selection=0,disposed=false;
 async function setPlatform(id){const ticket=++selection;let points=logoCache.get(id);if(!points){const svg=document.querySelector(`[data-logo="${id}"]`);if(!svg)return;const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','256');clone.setAttribute('height','256');clone.setAttribute('stroke','white');clone.setAttribute('fill',id==='instagram'?'none':'white');clone.setAttribute('stroke-width',id==='instagram'?'1.7':'1.0');clone.setAttribute('color','white');const markup=new XMLSerializer().serializeToString(clone).replaceAll('currentColor','white');const url=URL.createObjectURL(new Blob([markup],{type:'image/svg+xml'}));const image=new Image();try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,256,256).data;points=[];for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(pixels[(y*256+x)*4+3]>90)points.push([(x/256-.5)*2.05,(.5-y/256)*2.05]);logoCache.set(id,points)}finally{URL.revokeObjectURL(url)}}if(disposed||ticket!==selection||!points?.length)return;const amount=particleUniforms.uLogoMix.value;for(let i=0;i<count;i++){const pt=points[Math.floor(random()*points.length)];for(let axis=0;axis<3;axis++)previousTarget[i*3+axis]=T.MathUtils.lerp(previousTarget[i*3+axis],nextTarget[i*3+axis],amount);nextTarget[i*3]=pt[0]+(random()-.5)*.012;nextTarget[i*3+1]=pt[1]+(random()-.5)*.012;nextTarget[i*3+2]=(random()-.5)*.34;}geometry.attributes.aPrevious.needsUpdate=true;geometry.attributes.aTarget.needsUpdate=true;particleUniforms.uLogoMix.value=0;}
 setPlatform('linkedin');
 let pointerX=0,pointerY=0,scroll=window.scrollY,raf=0,previous=0,visible=true;
 function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.getDrawingBufferSize(uniforms.uResolution.value);const small=w<761;group.position.set(0,0,0);group.scale.setScalar(small?1.22:1.35);}
 function pointer(event){pointerX=(event.clientX/innerWidth-.5)*2;pointerY=(event.clientY/innerHeight-.5)*2;}
 function onScroll(){scroll=window.scrollY;}
 function visibility(){visible=!document.hidden;}
 resize();window.addEventListener('resize',resize);window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('scroll',onScroll,{passive:true});document.addEventListener('visibilitychange',visibility);
 function render(time){raf=requestAnimationFrame(render);if(!visible||time-previous<1000/40)return;previous=time;const t=reduced?0:time/1000;uniforms.uTime.value=t;particleUniforms.uTime.value=t;const morph=T.MathUtils.smoothstep(scroll/innerHeight,.12,.80);particleUniforms.uMorph.value+=(morph-particleUniforms.uMorph.value)*(reduced?1:.11);particleUniforms.uLogoMix.value=Math.min(1,particleUniforms.uLogoMix.value+(reduced?1:.035));glow.visible=particleUniforms.uMorph.value<.95;glow.scale.setScalar(1-particleUniforms.uMorph.value);
  const targetX=reduced?0:pointerY*.035+Math.sin(t*.35)*.045*particleUniforms.uMorph.value,targetY=reduced?0:pointerX*.06+Math.sin(t*.28)*.24*particleUniforms.uMorph.value;group.rotation.x+=(targetX-group.rotation.x)*.045;group.rotation.y+=(targetY-group.rotation.y)*.045;
  const intro=1-particleUniforms.uMorph.value;
  const cameraX=reduced?0:(Math.sin(t*.10)*.16+pointerX*.07)*intro,cameraY=reduced?0:Math.cos(t*.08)*.07*intro;
  camera.position.x+=(cameraX-camera.position.x)*.025;camera.position.y+=(cameraY-camera.position.y)*.025;camera.position.z=8.-Math.pow(Math.sin(particleUniforms.uMorph.value*Math.PI),.8)*7.0-intro*.18*Math.sin(t*.07);camera.lookAt(0,0,0);
  deepStars.rotation.y=reduced?0:Math.sin(t*.025)*.018;
  spaceEvents.update(t,intro,camera.aspect);
  renderer.render(scene,camera);
 }
 render(0);
 return{setPlatform,dispose(){disposed=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',pointer);window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',visibility);spaceEvents.dispose();starGeometry.dispose();starMaterial.dispose();geometry.dispose();material.dispose();glow.geometry.dispose();glowMaterial.dispose();background.geometry.dispose();background.material.dispose();renderer.dispose();}};
}
