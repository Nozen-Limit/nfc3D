import * as THREE from 'three'
import blackTexture from './assets/black-card.jpg'
import whiteTexture from './assets/white-card.jpg'
import metalTexture from './assets/metal-card.jpg'

export function mountCardScene(root, onPhaseChange) {
const scroller=root.querySelector('.ns-scroller'),stage=root.querySelector('.ns-stage'),canvas=stage.querySelector('canvas'),copy=root.querySelector('.ns-copy');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let targetProgress=0,progress=0,chapter=0,extraTurn=0,pointerTilt=0,pointerPitch=0,drag=false,last=0,active=true;
let raf=0,resizeObserver=null,intersectionObserver=null;
const settings={finish:'Black',light:'Warm studio'};
function sync(){const max=scroller.scrollHeight-scroller.clientHeight;targetProgress=max>0?scroller.scrollTop/max:0;const next=targetProgress<.28?0:targetProgress<.5?1:targetProgress<.78?2:3;if(next!==chapter){chapter=next;onPhaseChange(next)}}
scroller.addEventListener('scroll',sync,{passive:true});
let scene,camera,renderer,model,bgMaterial,shaderUniforms,bodyMaterial,frontMaterial,backMaterial,edgeMaterial;
function failure(message){const el=root.querySelector('.ns-loader');el.textContent=message;el.style.maxWidth='260px';el.style.lineHeight='1.6';}
const T=THREE;
try{
scene=new T.Scene();camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(0,.22,7.6);scene.add(camera);
renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
// A real studio environment, filtered for physically based metal reflections.
const room=new T.Scene();room.background=new T.Color(0x13151b);
function softbox(w,h,x,y,z,power,color){const material=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(power),side:T.DoubleSide});const plane=new T.Mesh(new T.PlaneGeometry(w,h),material);plane.position.set(x,y,z);plane.lookAt(0,0,0);room.add(plane);}
softbox(5,3,-4,5,5,7,0xffecd3);softbox(2,5,4,2,3,6,0xffffff);softbox(4,1,0,-3,5,3,0xbacfff);softbox(5,3,-3,1,-5,5,0xdde7ff);softbox(5,5,1,7,0,2,0xffffff);
const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromScene(room,.04,.1,40);scene.environment=environment.texture;pmrem.dispose();
const ambient=new T.AmbientLight(0xe9efff,.35);scene.add(ambient);
const key=new T.SpotLight(0xffeedb,55,30,Math.PI/4,.7,2);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0005;scene.add(key);scene.add(key.target);
const rim=new T.DirectionalLight(0xb9d0ff,3.0);rim.position.set(4,2,-2);scene.add(rim);const fill=new T.DirectionalLight(0xffffff,2.1);fill.position.set(1,-2,4);scene.add(fill);
function outline(width,height,r){const x=-width/2,y=-height/2;const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
const shellGeometry=new T.ExtrudeGeometry(outline(3.6,2.27,.15),{depth:.020,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:5,steps:1,curveSegments:24});shellGeometry.translate(0,0,-.010);shellGeometry.computeVertexNormals();
edgeMaterial=new T.MeshPhysicalMaterial({color:0xc4baa8,metalness:1,roughness:.19,envMapIntensity:1.55,clearcoat:.6,clearcoatRoughness:.17});model=new T.Group();const shell=new T.Mesh(shellGeometry,edgeMaterial);shell.castShadow=true;shell.receiveShadow=true;model.add(shell);scene.add(model);
function faceGeometry(){const g=new T.ShapeGeometry(outline(3.575,2.245,.14),32);const pos=g.attributes.position;const uvs=[];for(let i=0;i<pos.count;i++)uvs.push((pos.getX(i)+1.8)/3.6,(pos.getY(i)+1.135)/2.27);g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));return g;}
const frontGeometry=faceGeometry(),backGeometry=faceGeometry();
function artwork(back,finish){const c=document.createElement('canvas');c.width=1800;c.height=1135;const x=c.getContext('2d');x.fillStyle=finish==='White'?'#e6e5e0':finish==='Metal'?'#a5a6a6':'#171b21';x.fillRect(0,0,1800,1135);if(finish==='Metal'){for(let y=0;y<1135;y++){x.strokeStyle='rgba(30,35,40,'+(.025+(Math.sin(y*71.8)+1)*.02)+')';x.beginPath();x.moveTo(0,y);x.lineTo(1800,y);x.stroke()}}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;}
function brushed(){const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');x.fillStyle='#999999';x.fillRect(0,0,512,512);for(let y=0;y<512;y++){const shade=Math.round(144+Math.sin(y*73.8)*10);x.strokeStyle='rgb('+shade+','+shade+','+shade+')';x.beginPath();x.moveTo(0,y);x.lineTo(512,y);x.stroke();}const t=new T.CanvasTexture(c);t.wrapS=T.RepeatWrapping;t.wrapT=T.RepeatWrapping;t.repeat.set(1,2);return t;}
const roughnessTexture=brushed();
frontMaterial=new T.MeshPhysicalMaterial({map:artwork(false,settings.finish),metalness:.65,roughness:.3,roughnessMap:roughnessTexture,envMapIntensity:1.35,clearcoat:.45,clearcoatRoughness:.24});backMaterial=frontMaterial.clone();backMaterial.map=artwork(true,settings.finish);
const front=new T.Mesh(frontGeometry,frontMaterial);front.position.z=.015;model.add(front);const back=new T.Mesh(backGeometry,backMaterial);back.rotation.y=Math.PI;back.position.z=-.015;model.add(back);
const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.ShadowMaterial({color:0x000000,opacity:.28}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.55;floor.material.depthWrite=false;floor.receiveShadow=true;scene.add(floor);
// The reference's flowing background is rendered as a real shader behind the card.
shaderUniforms={uTime:{value:0},uResolution:{value:new T.Vector2(1,1)},uMouse:{value:new T.Vector2()},uScroll:{value:0}};
createBackgroundShader();
// Text-shaped dust travels from the introduction to the card surface.
const ease=(a,b,v)=>{const x=T.MathUtils.clamp((v-a)/(b-a),0,1);return x*x*(3-2*x)};
const sourceCanvas=document.createElement('canvas'),sourceCtx=sourceCanvas.getContext('2d');
function drawLandingName(){const box=copy.querySelector('h1').getBoundingClientRect(),size=stage.clientWidth<350?39:43;sourceCanvas.width=Math.round(box.width*3);sourceCanvas.height=Math.round(size*1.08*2*3);sourceCtx.fillStyle='#eee9df';sourceCtx.font='400 '+(size*3)+'px Outfit, Arial';sourceCtx.textAlign='center';sourceCtx.textBaseline='top';sourceCtx.fillText('Tom Jerald',sourceCanvas.width/2,0);sourceCtx.fillText('Ferrer.',sourceCanvas.width/2,size*1.08*3)}drawLandingName();
const sourceTexture=new T.CanvasTexture(sourceCanvas);sourceTexture.colorSpace=T.SRGBColorSpace;
const dissolveUniform={uMap:{value:sourceTexture},uDissolve:{value:0}};
const sourceName=new T.Mesh(new T.PlaneGeometry(2.4,1),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:dissolveUniform,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform sampler2D uMap;uniform float uDissolve;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec4 c=texture2D(uMap,vUv);float n=hash(floor(vUv*180.));float threshold=vUv.x*.65+n*.35;float a=1.-smoothstep(threshold-.045,threshold+.045,uDissolve);gl_FragColor=vec4(c.rgb,c.a*a);}',toneMapped:false}));scene.add(sourceName);
const bankCanvas=document.createElement('canvas');bankCanvas.width=1024;bankCanvas.height=256;const bankCtx=bankCanvas.getContext('2d');bankCtx.font='500 74px Outfit, Arial';bankCtx.fillStyle='#ffffff';bankCtx.fillText('Tom Jerald Ferrer',18,164);const bankTexture=new T.CanvasTexture(bankCanvas);bankTexture.colorSpace=T.SRGBColorSpace;
const nameUniform={uMap:{value:bankTexture},uReveal:{value:0},uColor:{value:new T.Color(0xdad6ce)}};
const bankName=new T.Mesh(new T.PlaneGeometry(2.85,.7),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:nameUniform,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform sampler2D uMap;uniform float uReveal;uniform vec3 uColor;void main(){float a=texture2D(uMap,vUv).a*smoothstep(vUv.x*.7,vUv.x*.7+.22,uReveal);gl_FragColor=vec4(uColor,a);}'}));bankName.position.set(-.17,-.55,.019);model.add(bankName);
const roleCanvas=document.createElement('canvas');roleCanvas.width=1024;roleCanvas.height=128;const roleCtx=roleCanvas.getContext('2d');roleCtx.fillStyle='#dcc7a4';roleCtx.font='400 55px monospace';roleCtx.fillText('0997 243 3478',20,83);const roleTexture=new T.CanvasTexture(roleCanvas);roleTexture.colorSpace=T.SRGBColorSpace;const role=new T.Mesh(new T.PlaneGeometry(2.8,.35),new T.MeshBasicMaterial({map:roleTexture,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));role.position.set(-.17,.77,.019);model.add(role);
const contactless=new T.Group();for(let k=0;k<3;k++){const points=[];for(let j=0;j<=28;j++){const a=-.8+j/28*1.6,r=.05+k*.045;points.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,0))}contactless.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xdad6ce})))}contactless.position.set(1.3,.72,.019);model.add(contactless);
let sample=[],destSamples=[];function sampleInk(c){const ctx=c.getContext('2d'),a=ctx.getImageData(0,0,c.width,c.height).data,points=[];for(let y=0;y<c.height;y+=3)for(let x=0;x<c.width;x+=3)if(a[(y*c.width+x)*4+3]>125)points.push([x/c.width,1-y/c.height]);return points}
sample=sampleInk(sourceCanvas);destSamples=sampleInk(bankCanvas);const count=Math.min(sample.length,4200),dustPosition=new Float32Array(count*3),dustAlpha=new Float32Array(count);const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.BufferAttribute(dustPosition,3));dustGeometry.setAttribute('aAlpha',new T.BufferAttribute(dustAlpha,1));
const dust=new T.Points(dustGeometry,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,vertexShader:'attribute float aAlpha;varying float vAlpha;void main(){vAlpha=aAlpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(16./-p.z,1.2,4.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.79,.48,(1.-smoothstep(.18,.5,d))*vAlpha);}'}));dust.frustumCulled=false;scene.add(dust);
function animateDust(){const small=stage.clientWidth<700,d= ease(.025,.225,progress);const b=copy.querySelector('h1').getBoundingClientRect(),sb=stage.getBoundingClientRect();camera.updateMatrixWorld();const ndc=new T.Vector3(((b.left-sb.left+b.width/2)/stage.clientWidth)*2-1,-((b.top-sb.top+b.height/2)/stage.clientHeight)*2+1,.5).unproject(camera);const dir=ndc.sub(camera.position).normalize(),distance=(.1-camera.position.z)/dir.z;sourceName.position.copy(camera.position).addScaledVector(dir,distance);sourceName.quaternion.copy(camera.quaternion);const worldHeight=2*Math.abs(camera.position.z-.1)*Math.tan(T.MathUtils.degToRad(camera.fov/2));sourceName.scale.set(b.width/stage.clientWidth*worldHeight*camera.aspect/2.4,b.height/stage.clientHeight*worldHeight,1);dissolveUniform.uDissolve.value=Math.min(1.07,d/.58*1.07);sourceName.visible=progress<.245;nameUniform.uReveal.value=ease(.12,.255,progress);nameUniform.uColor.value.set(settings.finish==='White'||settings.finish==='Metal'?0x252a2e:0xdad6ce);contactless.visible=progress>.42;
if(d<=0||d>=1){dust.visible=false;return;}model.updateMatrixWorld(true);sourceName.updateMatrixWorld(true);const src=new T.Vector3(),dest=new T.Vector3();for(let i=0;i<count;i++){const uv=sample[Math.floor(i*sample.length/count)],duv=destSamples[Math.floor(i*destSamples.length/count)],noise=Math.sin(Math.floor(uv[0]*180)*127.1+Math.floor(uv[1]*180)*311.7)*43758.5453,delay=(uv[0]*.65+(noise-Math.floor(noise))*.35)*.58,local=T.MathUtils.clamp((d-delay)/(.98-delay),0,1),v=local*local*(3-2*local);src.set((uv[0]-.5)*2.4,(uv[1]-.5),0);sourceName.localToWorld(src);dest.set((duv[0]-.5)*2.85-.17,(duv[1]-.5)*.7-.55,.021);model.localToWorld(dest);src.lerp(dest,v);const swirl=Math.sin(v*Math.PI),seed=i*2.39996;src.x+=Math.sin(seed+v*7)*swirl*.37;src.y+=Math.cos(seed*.6+v*8)*swirl*.55;src.z+=swirl*(.25+(i%31)/31*.8);dustPosition[i*3]=src.x;dustPosition[i*3+1]=src.y;dustPosition[i*3+2]=src.z;dustAlpha[i]=reduced?0:ease(0,.06,local)*(1-ease(.83,1,local))*.9;}dustGeometry.attributes.position.needsUpdate=true;dustGeometry.attributes.aAlpha.needsUpdate=true;dust.visible=d>0&&d<1;}
const phoneSamples=sampleInk(roleCanvas),phoneCount=Math.min(3000,phoneSamples.length);
const phoneSourceUniform={uMap:{value:roleTexture},uDissolve:{value:0}};
const phoneSourceMaterial=sourceName.material.clone();phoneSourceMaterial.uniforms=phoneSourceUniform;
const phoneSource=new T.Mesh(new T.PlaneGeometry(2.8,.35),phoneSourceMaterial);scene.add(phoneSource);
const phoneReveal={uMap:{value:roleTexture},uReveal:{value:0},uColor:{value:new T.Color(0xdad6ce)}};
role.material.dispose();role.material=bankName.material.clone();role.material.uniforms=phoneReveal;
const phonePositions=new Float32Array(phoneCount*3),phoneAlphas=new Float32Array(phoneCount),phoneGeometry=new T.BufferGeometry();
phoneGeometry.setAttribute('position',new T.BufferAttribute(phonePositions,3));phoneGeometry.setAttribute('aAlpha',new T.BufferAttribute(phoneAlphas,1));
const phoneDust=new T.Points(phoneGeometry,dust.material);phoneDust.frustumCulled=false;scene.add(phoneDust);
function animatePhoneDust(){
 const d=ease(.53,.72,progress),b=copy.querySelector('.ns-desc').getBoundingClientRect(),sb=stage.getBoundingClientRect();
 const ndc=new T.Vector3(((b.left-sb.left+b.width/2)/stage.clientWidth)*2-1,-((b.top-sb.top+b.height/2)/stage.clientHeight)*2+1,.5).unproject(camera),dir=ndc.sub(camera.position).normalize(),distance=(.1-camera.position.z)/dir.z;
 phoneSource.position.copy(camera.position).addScaledVector(dir,distance);phoneSource.quaternion.copy(camera.quaternion);
 const wh=2*Math.abs(camera.position.z-.1)*Math.tan(T.MathUtils.degToRad(camera.fov/2));phoneSource.scale.set(b.width/stage.clientWidth*wh*camera.aspect/2.8,b.height/stage.clientHeight*wh/.35,1);
 phoneSource.visible=chapter===2&&d<.99;phoneSourceUniform.uDissolve.value=Math.min(1.07,d/.58*1.07);phoneReveal.uReveal.value=ease(.625,.725,progress);phoneReveal.uColor.value.set(settings.finish==='Black'?0xdad6ce:0x252a2e);
 if(d<=0||d>=1){phoneDust.visible=false;return;}phoneSource.updateMatrixWorld(true);const src=new T.Vector3(),dest=new T.Vector3();
 for(let i=0;i<phoneCount;i++){const uv=phoneSamples[Math.floor(i*phoneSamples.length/phoneCount)],noise=Math.sin(Math.floor(uv[0]*180)*127.1+Math.floor(uv[1]*180)*311.7)*43758.5453,delay=(uv[0]*.65+(noise-Math.floor(noise))*.35)*.58,t=T.MathUtils.clamp((d-delay)/(.98-delay),0,1),v=t*t*(3-2*t);src.set((uv[0]-.5)*2.8,(uv[1]-.5)*.35,0);phoneSource.localToWorld(src);dest.set((uv[0]-.5)*2.8-.17,(uv[1]-.5)*.35+.77,.021);model.localToWorld(dest);src.lerp(dest,v);const swirl=Math.sin(v*Math.PI),seed=i*2.39996;src.x+=Math.sin(seed+v*8)*swirl*.35;src.y+=Math.cos(seed*.6+v*7)*swirl*.5;src.z+=swirl*(.3+(i%31)/31*.8);phonePositions[i*3]=src.x;phonePositions[i*3+1]=src.y;phonePositions[i*3+2]=src.z;phoneAlphas[i]=reduced?0:ease(0,.06,t)*(1-ease(.83,1,t))*.9;}
 phoneGeometry.attributes.position.needsUpdate=true;phoneGeometry.attributes.aAlpha.needsUpdate=true;phoneDust.visible=d>0&&d<1;
}

const jobCanvas=document.createElement('canvas');jobCanvas.width=1024;jobCanvas.height=128;const jobCtx=jobCanvas.getContext('2d');jobCtx.fillStyle='#dcc7a4';jobCtx.font='400 44px Outfit, Arial';jobCtx.fillText('Aspiring developer',20,83);const jobTexture=new T.CanvasTexture(jobCanvas);jobTexture.colorSpace=T.SRGBColorSpace;const jobLabel=new T.Mesh(new T.PlaneGeometry(2.8,.35),new T.MeshBasicMaterial({transparent:true,opacity:0}));jobLabel.position.set(-.17,-.84,.019);model.add(jobLabel);
const jobSourceCanvas=document.createElement('canvas');jobSourceCanvas.width=1024;jobSourceCanvas.height=128;const jobSourceCtx=jobSourceCanvas.getContext('2d');function drawJobSource(){jobSourceCtx.clearRect(0,0,1024,128);jobSourceCtx.fillStyle='#d3cdc3';jobSourceCtx.font='400 80px Outfit, Arial';jobSourceCtx.textAlign='center';jobSourceCtx.fillText('Aspiring developer',512,91)}drawJobSource();const jobSourceTexture=new T.CanvasTexture(jobSourceCanvas);jobSourceTexture.colorSpace=T.SRGBColorSpace;
let jobSamples=sampleInk(jobSourceCanvas),jobDestSamples=sampleInk(jobCanvas);const jobCount=Math.min(3000,jobSamples.length);
const jobSourceUniform={uMap:{value:jobSourceTexture},uDissolve:{value:0}};
const jobSourceMaterial=sourceName.material.clone();jobSourceMaterial.uniforms=jobSourceUniform;
const jobSource=new T.Mesh(new T.PlaneGeometry(2.8,.35),jobSourceMaterial);scene.add(jobSource);
const jobReveal={uMap:{value:jobTexture},uReveal:{value:0},uColor:{value:new T.Color(0xdad6ce)}};
jobLabel.material.dispose();jobLabel.material=bankName.material.clone();jobLabel.material.uniforms=jobReveal;
const jobPositions=new Float32Array(jobCount*3),jobAlphas=new Float32Array(jobCount),jobGeometry=new T.BufferGeometry();
jobGeometry.setAttribute('position',new T.BufferAttribute(jobPositions,3));jobGeometry.setAttribute('aAlpha',new T.BufferAttribute(jobAlphas,1));
const jobDust=new T.Points(jobGeometry,dust.material);jobDust.frustumCulled=false;scene.add(jobDust);
function animateJobDust(){
 const d=ease(.055,.26,progress),b=copy.querySelector('.ns-desc').getBoundingClientRect(),sb=stage.getBoundingClientRect();
 const ndc=new T.Vector3(((b.left-sb.left+b.width/2)/stage.clientWidth)*2-1,-((b.top-sb.top+b.height/2)/stage.clientHeight)*2+1,.5).unproject(camera),dir=ndc.sub(camera.position).normalize(),distance=(.1-camera.position.z)/dir.z;
 jobSource.position.copy(camera.position).addScaledVector(dir,distance);jobSource.quaternion.copy(camera.quaternion);
 const wh=2*Math.abs(camera.position.z-.1)*Math.tan(T.MathUtils.degToRad(camera.fov/2));jobSource.scale.set(b.width/stage.clientWidth*wh*camera.aspect/2.8,b.height/stage.clientHeight*wh/.35,1);
 jobSource.visible=chapter===0&&d<.99;jobSourceUniform.uDissolve.value=Math.min(1.07,d/.58*1.07);jobReveal.uReveal.value=ease(.17,.27,progress);jobReveal.uColor.value.set(settings.finish==='Black'?0xb6b9bd:0x666b70);
 if(d<=0||d>=1){jobDust.visible=false;return;}jobSource.updateMatrixWorld(true);const src=new T.Vector3(),dest=new T.Vector3();
 for(let i=0;i<jobCount;i++){const uv=jobSamples[Math.floor(i*jobSamples.length/jobCount)],duv=jobDestSamples[Math.floor(i*jobDestSamples.length/jobCount)],noise=Math.sin(Math.floor(uv[0]*180)*127.1+Math.floor(uv[1]*180)*311.7)*43758.5453,delay=(uv[0]*.65+(noise-Math.floor(noise))*.35)*.58,t=T.MathUtils.clamp((d-delay)/(.98-delay),0,1),v=t*t*(3-2*t);src.set((uv[0]-.5)*2.8,(uv[1]-.5)*.35,0);jobSource.localToWorld(src);dest.set((duv[0]-.5)*2.8-.17,(duv[1]-.5)*.35-.84,.021);model.localToWorld(dest);src.lerp(dest,v);const swirl=Math.sin(v*Math.PI),seed=i*2.39996;src.x+=Math.sin(seed+v*8)*swirl*.35;src.y+=Math.cos(seed*.6+v*7)*swirl*.5;src.z+=swirl*(.3+(i%31)/31*.8);jobPositions[i*3]=src.x;jobPositions[i*3+1]=src.y;jobPositions[i*3+2]=src.z;jobAlphas[i]=reduced?0:ease(0,.06,t)*(1-ease(.83,1,t))*.9;}
 jobGeometry.attributes.position.needsUpdate=true;jobGeometry.attributes.aAlpha.needsUpdate=true;jobDust.visible=d>0&&d<1;
}

document.fonts?.ready.then(()=>{drawLandingName();sourceTexture.needsUpdate=true;sample=sampleInk(sourceCanvas);drawJobSource();jobSourceTexture.needsUpdate=true;jobSamples=sampleInk(jobSourceCanvas);bankCtx.clearRect(0,0,1024,256);bankCtx.font='500 74px Outfit, Arial';bankCtx.fillText('Tom Jerald Ferrer',18,164);bankTexture.needsUpdate=true;destSamples=sampleInk(bankCanvas);jobCtx.clearRect(0,0,1024,128);jobCtx.font='400 44px Outfit, Arial';jobCtx.fillText('Aspiring developer',20,83);jobTexture.needsUpdate=true;jobDestSamples=sampleInk(jobCanvas)});
bankName.material.fragmentShader=bankName.material.fragmentShader.replace('gl_FragColor=vec4(uColor,a);','vec2 e=vec2(1.4/1024.,1.4/256.);float dx=texture2D(uMap,vUv+vec2(e.x,0.)).a-texture2D(uMap,vUv-vec2(e.x,0.)).a;float dy=texture2D(uMap,vUv+vec2(0.,e.y)).a-texture2D(uMap,vUv-vec2(0.,e.y)).a;float bevel=clamp(dx*.28-dy*.36,-.28,.3);float sheen=.91+.14*sin(vUv.y*9.);gl_FragColor=vec4(clamp(uColor*sheen+bevel,0.,1.),a);');bankName.material.needsUpdate=true;
const userRotation=new T.Quaternion(),deltaRotation=new T.Quaternion(),rotationAxis=new T.Vector3(),ray=new T.Raycaster(),pointer=new T.Vector2();let lastY=0;const hitZone=root.querySelector('.ns-card-hit');
let activePointer=null;
stage.addEventListener('pointerdown',e=>{if(drag||e.isPrimary===false||e.button>0||e.target.closest?.('button,a'))return;const b=canvas.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);if(!ray.intersectObjects([shell,front,back],false).length)return;e.preventDefault();e.stopPropagation();drag=true;activePointer=e.pointerId;last=e.clientX;lastY=e.clientY;stage.classList.add('is-rotating');const selection=window.getSelection?.();if(selection?.anchorNode&&root.contains(selection.anchorNode))selection.removeAllRanges();stage.setPointerCapture(e.pointerId)},{capture:true,passive:false});
stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==activePointer)return;e.preventDefault();e.stopPropagation();const dx=(e.clientX-last)*.009,dy=(e.clientY-lastY)*.009;last=e.clientX;lastY=e.clientY;rotationAxis.set(dy,dx,0);const angle=rotationAxis.length();if(angle){rotationAxis.normalize();deltaRotation.setFromAxisAngle(rotationAxis,angle);userRotation.premultiply(deltaRotation).normalize()}},{capture:true,passive:false});
function finishRotation(e){if(!drag||(e?.pointerId!==undefined&&e.pointerId!==activePointer))return;const id=activePointer;drag=false;activePointer=null;stage.classList.remove('is-rotating');if(stage.hasPointerCapture(id))stage.releasePointerCapture(id)}
stage.addEventListener('pointerup',finishRotation);stage.addEventListener('pointercancel',finishRotation);stage.addEventListener('lostpointercapture',finishRotation);window.addEventListener('blur',()=>finishRotation());
stage.addEventListener('selectstart',e=>e.preventDefault());stage.addEventListener('dragstart',e=>e.preventDefault());canvas.draggable=false;
function updateHitZone(){camera.updateMatrixWorld();model.updateMatrixWorld(true);let x0=stage.clientWidth,y0=stage.clientHeight,x1=0,y1=0;for(const x of [-1.8,1.8])for(const y of [-1.135,1.135]){const q=model.localToWorld(new T.Vector3(x,y,0)).project(camera),px=(q.x*.5+.5)*stage.clientWidth,py=(-q.y*.5+.5)*stage.clientHeight;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)}hitZone.style.left=Math.max(0,x0)+'px';hitZone.style.top=Math.max(0,y0)+'px';hitZone.style.width=Math.max(0,Math.min(stage.clientWidth,x1)-Math.max(0,x0))+'px';hitZone.style.height=Math.max(0,Math.min(stage.clientHeight,y1)-Math.max(0,y0))+'px';}
let width=0,height=0;
function resize(){width=stage.clientWidth;height=stage.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.getDrawingBufferSize(shaderUniforms.uResolution.value);}
resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);resize();
const photoAssets={Black:blackTexture,White:whiteTexture,Metal:metalTexture},photoTextures={},photoReady={};let finishPhase=0,finishDirection=1,pendingFinish=null,finishSwapped=false;
function configureSurface(record=true){const f=settings.finish;const oldF=frontMaterial.map,oldB=backMaterial.map;frontMaterial.map=photoReady[f]?photoTextures[f].clone():artwork(false,f);backMaterial.map=photoReady[f]?photoTextures[f].clone():artwork(true,f);frontMaterial.map.needsUpdate=true;backMaterial.map.needsUpdate=true;oldF?.dispose();oldB?.dispose();for(const mat of [frontMaterial,backMaterial]){mat.color.setHex(0xffffff);mat.roughnessMap=null;mat.metalness=f==='Metal'?.88:f==='Black'?.27:.02;mat.roughness=f==='Metal'?.40:f==='Black'?.42:.39;mat.envMapIntensity=.75;mat.clearcoat=f==='Metal'?.12:.25;mat.clearcoatRoughness=.3;mat.bumpMap=mat.map;mat.bumpScale=.00065;mat.needsUpdate=true}edgeMaterial.color.set(f==='Metal'?0xc6c9cc:f==='White'?0xe3e2dc:0x525b66);}
for(const [f,url] of Object.entries(photoAssets)){const im=new Image();const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);photoTextures[f]=t;im.onload=()=>{t.needsUpdate=true;photoReady[f]=true;if(settings.finish===f)configureSurface(false)};im.src=url;}
configureSurface(false);

intersectionObserver=new IntersectionObserver(entries=>active=entries[0].isIntersecting);intersectionObserver.observe(stage);
let lastTime=0,turn=0,pitch=0;
function animate(time){raf=requestAnimationFrame(animate);if(!active||document.hidden)return;if(time-lastTime<1000/45)return;lastTime=time;progress+=(targetProgress-progress)*(reduced?1:.075);turn+=(extraTurn+pointerTilt-turn)*.07;pitch+=(pointerPitch-pitch)*.07;const small=width<700;const angle=Math.sin(progress*Math.PI*2)*.32,zoom=ease(.78,.96,progress);copy.style.setProperty("--social-y",(-ease(.43,.5,progress)*28)+"px");copy.style.setProperty("--social-tilt",(ease(.43,.5,progress)*22)+"deg");copy.style.setProperty("--social-opacity",String(1-ease(.44,.5,progress)));
model.rotation.set(.13+pitch+Math.sin(progress*Math.PI*2)*.12,-.42+angle+turn+zoom*.27,-.17+Math.sin(progress*Math.PI)*.14+zoom*.11);model.position.set(small?0:.91+Math.sin(progress*Math.PI)*.10,small?-.40+ease(.15,.29,progress)*1.72-zoom*.18:.16,0);if(finishPhase>0){finishPhase=Math.min(1,finishPhase+.045);model.rotation.y+=Math.sin(finishPhase*Math.PI)*finishDirection*.72;if(finishPhase>=.5&&!finishSwapped){settings.finish=pendingFinish;configureSurface();finishSwapped=true}if(finishPhase===1){finishPhase=0;pendingFinish=null}}model.quaternion.premultiply(userRotation);copy.style.setProperty('--intro-copy',String(1-ease(.03,.21,progress)));if(!reduced)model.position.y+=Math.sin(time*.00075)*.045;
camera.position.set(0,small?-.3:.18,small?3.6*height/(2*Math.tan(T.MathUtils.degToRad(19))*Math.max(180,width-76+zoom*38)):6.9-Math.sin(progress*Math.PI)*.35);camera.lookAt(0,small?-.53:0,0);shaderUniforms.uTime.value=reduced?0:time/1000;shaderUniforms.uScroll.value=progress;shaderUniforms.uMouse.value.set(pointerTilt,-pointerPitch);root.style.setProperty('--tagline-alpha',String(1-ease(.06,.22,progress)));root.style.setProperty('--tagline-offset',(-ease(.06,.22,progress)*14)+'px');copy.style.setProperty('--contact-lift',(-ease(.62,.735,progress)*50)+'px');animateDust();animateJobDust();animatePhoneDust();updateHitZone();renderer.render(scene,camera);}
root.querySelector('.ns-loader').hidden=true;requestAnimationFrame(animate);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);root.querySelector('.ns-loader').hidden=false;failure('The graphics context was interrupted. Reopen this preview to resume.');});
}catch(error){failure('The 3D preview could not initialize in this browser.');console.error('Three.js portfolio preview',error);}

function createBackgroundShader(){
 const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
 const fragmentShader=`
 varying vec2 vUv;uniform float uTime;uniform vec2 uResolution;uniform vec2 uMouse;uniform float uScroll;
 void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
 float time=uTime*.08,scroll=uScroll;vec2 p=uv;
 float deform=scroll*5.;p.x+=sin(uv.y*2.5+time*.2+deform)*.35;p.y+=cos(uv.x*2.5-time*.15-deform*.8)*.35;p.x+=sin(uv.y*1.2-time*.1-deform*1.5)*.25;p.y+=cos(uv.x*1.2+time*.18+deform*1.2)*.25;p+=vec2(scroll*.04,-scroll*.02)+uMouse*.025;
 float w1=sin(dot(p,vec2(cos(.6),sin(.6)))*2.4+time);float w2=cos(dot(p,vec2(cos(-.7),sin(-.7)))*3.2-time*1.4+w1*.4);float w3=sin(dot(p,vec2(cos(1.2),sin(1.2)))*4.+time*1.8+w2*.5);float field=w1*.5+w2*.35+w3*.15;
 float broad=pow(max(0.,1.-abs(field-.1)),3.);float shine=pow(max(0.,1.-abs(field-.15)),15.);float t=smoothstep(0.,1.,scroll);
 vec3 base=mix(vec3(.005,.0025,.001),vec3(.0015,.004,.009),t);vec3 body=mix(vec3(.026,.012,.004),vec3(.003,.010,.026),t);vec3 light=mix(vec3(.22,.108,.039),vec3(.018,.075,.17),t);
 vec3 color=base+body*smoothstep(-.6,.5,field)+light*(broad*.10+shine*.65);color*=1.-dot(uv,uv)*.20;gl_FragColor=vec4(color,1.);
 }`;
 bgMaterial=new T.ShaderMaterial({vertexShader,fragmentShader,uniforms:shaderUniforms,depthWrite:false,depthTest:false,toneMapped:false});const plane=new T.Mesh(new T.PlaneGeometry(30,30),bgMaterial);plane.position.z=-9;plane.renderOrder=-10;camera.add(plane);
}

return () => {
  active=false;
  scroller.removeEventListener('scroll',sync);
  cancelAnimationFrame(raf);
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  renderer?.dispose();
};
}
