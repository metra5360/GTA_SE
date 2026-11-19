import*as T from 'three';import{OrbitControls}from 'three/addons/controls/OrbitControls.js';import{MAP}from './map.js';
const S=0.7,CX=MAP.w/2,CY=MAP.h/2,P=(x,y)=>[(x-CX)*S,(y-CY)*S];
const HT={red:27,yellow:15,blue:45,cyan:6,pink:12},COL={red:0xc9b6a6,yellow:0xe0d2a8,blue:0xb9c4d0,cyan:0xaeb6bd,pink:0xd9b9bd};
const R=new T.WebGLRenderer({antialias:true});R.setPixelRatio(1);R.setSize(innerWidth,innerHeight);app.append(R.domElement);R.shadowMap.type=T.PCFSoftShadowMap;
const sc=new T.Scene();sc.background=new T.Color(0xcfe3f1);sc.fog=new T.Fog(0xcfe3f1,500,1400);
const cam=new T.PerspectiveCamera(50,innerWidth/innerHeight,1,3000),ctl=new OrbitControls(cam,R.domElement);
ctl.enableDamping=true;ctl.maxPolarAngle=Math.PI/2-.02;ctl.maxDistance=1100;ctl.minDistance=15;
sc.add(new T.HemisphereLight(0xffffff,0x6b7a5a,1.1));const sun=new T.DirectionalLight(0xfff3dd,2);sun.position.set(-250,400,200);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-450,right:450,top:450,bottom:-450,far:1200});sun.shadow.mapSize.set(2048,2048);sc.add(sun);
// ground
const g=new T.Mesh(new T.PlaneGeometry(3000,3000),new T.MeshLambertMaterial({color:0x7c9a64}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;sc.add(g);
// roads (приблизні осі, у пікселях знімка)
const ROADS=[[[385,640],[470,500],[560,360],[650,230],[730,120]],[[0,38],[220,95],[470,100],[753,150]],[[285,0],[230,110],[150,300],[40,480],[0,560]],[[0,570],[200,560],[330,640]]];
const rm=new T.MeshLambertMaterial({color:0x3a3d42});
for(const r of ROADS){const pts=r.map(([x,y])=>{const[a,b]=P(x,y);return new T.Vector3(a,0,b)});
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],l=a.distanceTo(b),m=new T.Mesh(new T.BoxGeometry(l,.4,i%2?14:18),rm);
  m.position.set((a.x+b.x)/2,.2,(a.z+b.z)/2);m.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);m.receiveShadow=true;sc.add(m);}}
// текстура фасаду з вікнами
const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,64,64);c.fillStyle='#4a6a85';c.fillRect(14,16,36,30);c.fillStyle='#fff';c.fillRect(31,16,3,30);
const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.repeat.set(1/3.2,1/3.2);tex.anisotropy=4;
const roofM=new T.MeshLambertMaterial({color:0x6d6f72});
const bl=new T.Group(),foot=[];sc.add(bl);
for(const[cls,f]of MAP.b){const sh=new T.Shape();for(let i=0;i<f.length;i+=2){const[x,y]=P(f[i],f[i+1]);i?sh.lineTo(x,-y):sh.moveTo(x,-y);}
 const h=HT[cls]*(cls=='cyan'?1:1)+((f[0]*7+f[1]*3)%5);const geo=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);
 const wm=cls=='cyan'?new T.MeshLambertMaterial({color:COL[cls]}):new T.MeshLambertMaterial({color:COL[cls],map:tex});
 const m=new T.Mesh(geo,[roofM,wm]);m.castShadow=m.receiveShadow=true;bl.add(m);foot.push(f.map((v,i)=>i%2?P(0,v)[1]:P(v,0)[0]));}
const inside=(x,z)=>foot.some(p=>{let o=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const xi=p[i],zi=p[i+1],xj=p[j],zj=p[j+1];if((zi>z)!=(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)o=!o}return o});
// дерева (InstancedMesh)
const N=2200,tr=new T.InstancedMesh(new T.ConeGeometry(3,9,6).translate(0,6.5,0),new T.MeshLambertMaterial({color:0x3f6b34}),N),tk=new T.InstancedMesh(new T.CylinderGeometry(.4,.5,3,5).translate(0,1.5,0),new T.MeshLambertMaterial({color:0x5a4330}),N);
let n=0,sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647,d=new T.Object3D(),HW=CX*S,HH=CY*S;
for(let k=0;k<N*4&&n<N;k++){const x=(rnd()*2-1)*HW*1.15,z=(rnd()*2-1)*HH*1.15;if(inside(x,z))continue;d.position.set(x,0,z);d.scale.setScalar(.7+rnd()*.8);d.updateMatrix();tr.setMatrixAt(n,d.matrix);tk.setMatrixAt(n++,d.matrix);}
tr.count=tk.count=n;tr.castShadow=true;sc.add(tr,tk);
// камери
const tgt0=new T.Vector3(0,0,0),pos0=new T.Vector3(-260,300,330);
function view(m){ctl.enableRotate=m=='free';const t=ctl.target.clone().setY(0),dist=Math.max(150,cam.position.distanceTo(ctl.target));
 if(m=='top'){ctl.minPolarAngle=ctl.maxPolarAngle=0;cam.position.set(t.x,dist*1.1,t.z+.01);ctl.enableRotate=false}
 else{ctl.minPolarAngle=0;ctl.maxPolarAngle=Math.PI/2-.02;if(m=='iso')cam.position.set(t.x+dist*.6,dist*.7,t.z+dist*.6);}
 ctl.target.copy(t);ctl.update();document.querySelectorAll('#cams button').forEach(b=>b.classList.toggle('on',b.dataset.c==m));}
cams.onclick=e=>e.target.dataset.c&&view(e.target.dataset.c);
reset.onclick=()=>{ctl.target.copy(tgt0);cam.position.copy(pos0);view('free')};
street.onclick=()=>{view('free');ctl.target.set(ctl.target.x,2,ctl.target.z);cam.position.set(ctl.target.x+30,3,ctl.target.z+30);ctl.update()};
hide.onclick=()=>document.body.classList.toggle('nui');
function gfx(q){R.setPixelRatio([1,Math.min(devicePixelRatio,1.5),devicePixelRatio][q]);R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=q>0;sun.castShadow=q>0;sun.shadow.mapSize.setScalar(q==2?4096:2048);
 tr.count=tk.count=[Math.floor(n*.25),Math.floor(n*.6),n][q];tr.castShadow=q==2;sc.fog.far=[700,1100,1600][q];tex.anisotropy=[1,4,8][q];tex.needsUpdate=true;
 bl.children.forEach(m=>{m.material.forEach(x=>x.needsUpdate=true);m.castShadow=q>0});document.querySelectorAll('#gfx button').forEach(b=>b.classList.toggle('on',+b.dataset.g==q));}
document.getElementById('gfx').onclick=e=>e.target.dataset.g&&gfx(+e.target.dataset.g);gfx(1);
// WASD
const keys={};addEventListener('keydown',e=>keys[e.code]=1);addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.setSize(innerWidth,innerHeight)});
reset.click();let fr=0,t0=performance.now();const fw=new T.Vector3(),rt=new T.Vector3();
(function loop(){requestAnimationFrame(loop);
 const sp=cam.position.distanceTo(ctl.target)*.012;cam.getWorldDirection(fw);fw.y=0;fw.normalize();rt.crossVectors(fw,cam.up);
 const mv=new T.Vector3();if(keys.KeyW)mv.add(fw);if(keys.KeyS)mv.sub(fw);if(keys.KeyD)mv.add(rt);if(keys.KeyA)mv.sub(rt);mv.multiplyScalar(sp);cam.position.add(mv);ctl.target.add(mv);
 ctl.update();R.render(sc,cam);fr++;const t=performance.now();if(t-t0>500){fps.textContent=Math.round(fr*1000/(t-t0))+' FPS';fr=0;t0=t;scale.textContent='≈'+Math.round(cam.position.distanceTo(ctl.target))+' м до цілі'}})();
