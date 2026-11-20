import*as T from 'three';import{OrbitControls}from 'three/addons/controls/OrbitControls.js';import{MAP}from './map.js';
const S=0.8,CX=MAP.w/2,CY=MAP.h/2,X=x=>(x-CX)*S,Z=y=>(y-CY)*S;
const HT={red:27,yellow:15,blue:45,cyan:6,pink:12},COL={red:0xcdb9a8,yellow:0xe6d9b0,blue:0xbcc7d4,cyan:0xb4bbc2,pink:0xdcbcc0};
const R=new T.WebGLRenderer({antialias:true});R.setPixelRatio(1);R.setSize(innerWidth,innerHeight);app.append(R.domElement);R.shadowMap.type=T.PCFSoftShadowMap;
const sc=new T.Scene();sc.background=new T.Color(0xcfe3f1);sc.fog=new T.Fog(0xcfe3f1,600,1600);
const cam=new T.PerspectiveCamera(50,innerWidth/innerHeight,1,4000),ctl=new OrbitControls(cam,R.domElement);
ctl.enableDamping=true;ctl.screenSpacePanning=false;ctl.maxDistance=1200;ctl.minDistance=12;
sc.add(new T.HemisphereLight(0xffffff,0x778866,1.25));const sun=new T.DirectionalLight(0xfff1dc,1.8);sun.position.set(320,380,130);
Object.assign(sun.shadow.camera,{left:-420,right:420,top:420,bottom:-420,far:1400});sun.shadow.bias=-.0004;sc.add(sun);
// земля: супутниковий знімок + зелений фон навколо
const bg=new T.Mesh(new T.PlaneGeometry(5000,5000),new T.MeshBasicMaterial({color:0x6f8b5a}));bg.rotation.x=-Math.PI/2;bg.position.y=-.3;sc.add(bg);
const st=new T.TextureLoader().load('satellite.jpg');st.colorSpace=T.SRGBColorSpace;st.anisotropy=8;
const gr=new T.Mesh(new T.PlaneGeometry(MAP.w*S,MAP.h*S),new T.MeshBasicMaterial({map:st}));gr.rotation.x=-Math.PI/2;sc.add(gr);
// стрічка вздовж ламаної (дороги, доріжки)
function ribbon(pts,w,y,color,closed){const v=[],ix=[],n=pts.length;
 for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)]||pts[n-1],b=pts[Math.min(n-1,i+1)]||pts[0],p=pts[i];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  v.push(p[0]-dz*w/2,y,p[1]+dx*w/2,p[0]+dz*w/2,y,p[1]-dx*w/2);}
 for(let i=0;i<n-1+(closed?1:0);i++){const a=i*2,b=((i+1)%n)*2;ix.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshLambertMaterial({color,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.receiveShadow=true;sc.add(m);return m;}
const sm=(p)=>{const o=[];for(let i=0;i<p.length-1;i++)for(let t=0;t<6;t++){const a=p[i],b=p[i+1],c=p[Math.max(0,i-1)],d=p[Math.min(p.length-1,i+2)],u=t/6;
 o.push([.5*((2*a[0])+(-c[0]+b[0])*u+(2*c[0]-5*a[0]+4*b[0]-d[0])*u*u+(-c[0]+3*a[0]-3*b[0]+d[0])*u**3),.5*((2*a[1])+(-c[1]+b[1])*u+(2*c[1]-5*a[1]+4*b[1]-d[1])*u*u+(-c[1]+3*a[1]-3*b[1]+d[1])*u**3)]);}o.push(p[p.length-1]);return o};
MAP.roads.forEach(([w,p])=>{const q=sm(p).map(([x,y])=>[X(x),Z(y)]);ribbon(q,w*S,.25,0x45484d);ribbon(q.map(([x,z])=>[x,z]),.5,.32,0xd8d8c8);});
MAP.paths.forEach(p=>ribbon(sm(p).map(([x,y])=>[X(x),Z(y)]),2.4*S,.3,0xd2c4a0));
{const e=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2;e.push([X(282+38*Math.cos(a)),Z(357+42*Math.sin(a))])}ribbon(e,3,.3,0xb86a4e,true);}
// фасад із вікнами
const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,64,64);c.fillStyle='#46647f';c.fillRect(14,16,36,30);c.fillStyle='#fff';c.fillRect(31,16,3,30);
const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
const wall={},roofM=new T.MeshLambertMaterial({color:0x6f7174});for(const k in COL)wall[k]=new T.MeshLambertMaterial({color:COL[k],map:k=='cyan'?null:tex});
// будівлі: кожна — справжній паралелепіпед із висотою, дахом і вікнами
const bl=new T.Group();sc.add(bl);const FH=3.2;
MAP.b.forEach(([cls,cx,cy,w,d,an],i)=>{const h=HT[cls]+((i*7)%4)*(cls=='cyan'?.5:3)+(i%9)*.03,W=w*S,D=d*S,g=new T.BoxGeometry(W,h,D),uv=g.attributes.uv;
 for(let f=0;f<6;f++){const fw=f<2?D:W;for(let k=0;k<4;k++){const j=f*4+k;if(f<2||f>3){uv.setXY(j,uv.getX(j)*fw/FH,uv.getY(j)*h/FH)}}}
 const m=new T.Mesh(g,[wall[cls],wall[cls],roofM,roofM,wall[cls],wall[cls]]);m.position.set(X(cx),h/2,Z(cy));m.rotation.y=-an*Math.PI/180;m.castShadow=m.receiveShadow=true;bl.add(m);});
// дерева (InstancedMesh) за зеленими ділянками знімка
const N=MAP.trees.length/2,tr=new T.InstancedMesh(new T.IcosahedronGeometry(3.4,0).scale(1,1.15,1).translate(0,8,0),new T.MeshLambertMaterial({color:0xffffff}),N),
tk=new T.InstancedMesh(new T.CylinderGeometry(.35,.5,5,5).translate(0,2.5,0),new T.MeshLambertMaterial({color:0x5a4330}),N);
const d=new T.Object3D(),col=new T.Color();let sd=11;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
for(let i=0;i<N;i++){d.position.set(X(MAP.trees[i*2]),0,Z(MAP.trees[i*2+1]));d.scale.setScalar(.75+rnd()*.7);d.rotation.y=rnd()*6;d.updateMatrix();tr.setMatrixAt(i,d.matrix);tk.setMatrixAt(i,d.matrix);tr.setColorAt(i,col.setHSL(.27+rnd()*.07,.45,.2+rnd()*.1));}
tr.castShadow=true;sc.add(tr,tk);
// камери
const pos0=new T.Vector3(-380,380,440);
function view(m){const t=ctl.target.clone().setY(0),dist=Math.max(200,cam.position.distanceTo(ctl.target));ctl.enableRotate=m!='top';
 if(m=='top'){ctl.minPolarAngle=ctl.maxPolarAngle=0;cam.position.set(t.x,dist*1.1,t.z+.01)}
 else{ctl.minPolarAngle=0;ctl.maxPolarAngle=Math.PI/2-.02;if(m=='iso')cam.position.set(t.x+dist*.6,dist*.7,t.z+dist*.6)}
 ctl.target.copy(t);ctl.update();document.querySelectorAll('#cams button').forEach(b=>b.classList.toggle('on',b.dataset.c==m));}
cams.onclick=e=>e.target.dataset.c&&view(e.target.dataset.c);
reset.onclick=()=>{ctl.target.set(0,0,0);cam.position.copy(pos0);view('free')};
street.onclick=()=>{view('free');const t=ctl.target;t.y=2;cam.position.set(t.x+25,2.5,t.z+25);ctl.update()};
hide.onclick=()=>document.body.classList.toggle('nui');
function gfx(q){R.setPixelRatio([1,Math.min(devicePixelRatio,1.5),devicePixelRatio][q]);R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=q>0;sun.castShadow=q>0;sun.shadow.mapSize.setScalar(q==2?4096:2048);
 tr.count=tk.count=Math.floor(N*[.3,.65,1][q]);tr.castShadow=q==2;sc.fog.far=[800,1400,2200][q];tex.anisotropy=[1,4,8][q];
 sun.shadow.map&&(sun.shadow.map.dispose(),sun.shadow.map=null);bl.children.forEach(m=>{m.castShadow=q>0;m.material.forEach(x=>x.needsUpdate=true)});document.querySelectorAll('#gfx button').forEach(b=>b.classList.toggle('on',+b.dataset.g==q));}
document.getElementById('gfx').onclick=e=>e.target.dataset.g&&gfx(+e.target.dataset.g);gfx(1);
const keys={};addEventListener('keydown',e=>keys[e.code]=1);addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.setSize(innerWidth,innerHeight)});
reset.click();let fr=0,t0=performance.now(),far=false;const fw=new T.Vector3(),rt=new T.Vector3();
(function loop(){requestAnimationFrame(loop);
 const dist=cam.position.distanceTo(ctl.target),sp=dist*.012;cam.getWorldDirection(fw);fw.y=0;fw.normalize();rt.crossVectors(fw,cam.up);
 const mv=new T.Vector3();if(keys.KeyW)mv.add(fw);if(keys.KeyS)mv.sub(fw);if(keys.KeyD)mv.add(rt);if(keys.KeyA)mv.sub(rt);mv.multiplyScalar(sp);cam.position.add(mv);ctl.target.add(mv);
 // адаптивна деталізація за відстанню: далеко — без вікон і стовбурів
 const f=dist>650;if(f!=far){far=f;tk.visible=!f;for(const k in wall){wall[k].map=f||k=='cyan'?null:tex;wall[k].needsUpdate=true}}
 ctl.update();R.render(sc,cam);fr++;const t=performance.now();if(t-t0>500){fps.textContent=Math.round(fr*1000/(t-t0))+' FPS';fr=0;t0=t;scale.textContent='≈'+Math.round(dist)+' м до цілі'}})();
