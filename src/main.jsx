import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Linkedin, Github, Instagram, Facebook } from 'lucide-react'
import './stage.css'
import './social-controls.css'
import './landing-environment.css'

const socials=[{id:'linkedin',name:'LinkedIn',Icon:Linkedin,url:'https://www.linkedin.com/in/tom-jerald-ferrer-6b7b37301/'},{id:'github',name:'GitHub',Icon:Github,url:'https://github.com/Nozen-Limit'},{id:'instagram',name:'Instagram',Icon:Instagram,url:'https://www.instagram.com/frrrtom/'},{id:'facebook',name:'Facebook',Icon:Facebook,url:'https://www.facebook.com/tomjerald.ferrer.7/'}]
function App(){
 const canvas=useRef(null),controller=useRef(null),swipe=useRef(null),suppressClick=useRef(false)
 const [platform,setPlatform]=useState('linkedin'),[progress,setProgress]=useState(0)
 useEffect(()=>{let disposed=false;import('./resume-scene.js').then(({mountResumeScene})=>{if(!disposed)try{controller.current=mountResumeScene(canvas.current)}catch{}});const onScroll=()=>setProgress(Math.min(1,window.scrollY/(innerHeight*.8)));window.addEventListener('scroll',onScroll,{passive:true});onScroll();if(window.location.hash==='#socials')requestAnimationFrame(()=>window.scrollTo(0,innerHeight*.95));return()=>{disposed=true;controller.current?.dispose();window.removeEventListener('scroll',onScroll)}},[])
 useEffect(()=>{controller.current?.setPlatform(platform)},[platform])
 const selected=socials.find(s=>s.id===platform),showSocials=progress>.5
 const current=socials.findIndex(s=>s.id===platform),previous=socials[(current+3)%4],next=socials[(current+1)%4]
 function change(direction){setPlatform(socials[(current+direction+4)%4].id)}
 function startSwipe(e){if(e.isPrimary===false||e.button>0)return;suppressClick.current=false;swipe.current={x:e.clientX,y:e.clientY}}
 function endSwipe(e){const start=swipe.current;swipe.current=null;if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClick.current=true;change(dx<0?1:-1)}}
 return <main aria-label="Tom Ferrer">
  <div className="logo-sources" aria-hidden="true">{socials.map(({id,Icon})=><Icon key={id} data-logo={id} size={256} strokeWidth={1.3}/>)}</div>
  <div className="story"><div className="viewport">
   <canvas ref={canvas} aria-label="Galaxy particles forming social platform logos"/>
   <header className="intro-copy" style={{opacity:Math.max(0,1-progress*2),transform:`translateY(${-progress*25}px)`}} aria-hidden={showSocials}><h1>Tom Ferrer</h1><p>— Developer</p></header>
   <span className="scroll-hint" style={{opacity:Math.max(0,1-progress*3)}} aria-hidden="true">Scroll ↓</span>
   <section id="socials" className="social-panel" aria-label="Social profiles. Swipe left or right to switch platforms." aria-roledescription="carousel" tabIndex={showSocials?0:-1} style={{opacity:Math.max(0,(progress-.5)*2),pointerEvents:showSocials?'auto':'none'}} inert={!showSocials} onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={()=>{swipe.current=null}} onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false}}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change(e.key==='ArrowLeft'?-1:1)}}}>
    <div className="social-names"><button className="adjacent-name" onClick={()=>change(-1)}>{previous.name}</button><a className="selected-name" href={selected.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit my ${selected.name} profile`}><span aria-hidden="true">⌜</span><strong aria-live="polite">{selected.name}</strong><span aria-hidden="true">⌟</span></a><button className="adjacent-name" onClick={()=>change(1)}>{next.name}</button></div>
   </section>
  </div></div>
 </main>
}
createRoot(document.getElementById('root')).render(<App/> )
