"use strict"

﻿let canvas = document.getElementById('canvas');let context = canvas.getContext('2d'); let canvas_bg = document.getElementById('canvas_bg');let context_bg = canvas_bg.getContext('2d');let sliderFluessigkeitsdichte = document.getElementById("fluessigkeitsdichte");
let sliderKoerperdichte = document.getElementById("koerperdichte");
let sliderErdbeschleunigung = document.getElementById("erdbeschleunigung");
let rhoKoerper;
let rhoFluessigkeit;
let g;
let V = 1;let koerper;
let koerperBreite = 80;
let koerperHoehe = 50;
let startHoehe = 325;let m = 1;let dichteWasser = 1.0;
let center = new Vector2D(canvas_bg.width / 2, canvas_bg.height / 2);let t0, dt;let force, acc;
let schwerkraft; 
let auftrieb;
let reibung;
let erdbeschleunigung;
let letzteMausPos = new Vector2D(0, 0);let animId;let isDragging = false;
let pt1 = {x: 0, y: 0}, pt2 = {x: 0, y: 400};
let gradient = context_bg.createLinearGradient(pt1.x, pt1.y, pt2.x, pt2.y);
let wasserstand = 375;
let k = 0.2;
let auftriebVektor;
let schwerkraftVektor;
let eiswuerfel;window.onload = init; 



function init() {
		koerper = new Box(koerperBreite, koerperHoehe,'rgb(219,50,224)',m);	koerper.pos2D = new Vector2D(canvas.width * 0.75, startHoehe - koerperHoehe);
	koerper.velo2D = new Vector2D(0, 0);	koerper.draw(context);
   canvas.addEventListener('mousedown', function () {
      canvas.addEventListener('mousemove',onDrag,false);
      canvas.addEventListener('mouseup',onDrop,false);
   }, false);	
		t0 = new Date().getTime(); 
	

		
	animFrame();};



function onDrag(evt){
	
	if ((koerper.x + koerperBreite / 2 - evt.clientX)*(koerper.x + koerperBreite / 2 - evt.clientX) + (koerper.y + koerperHoehe / 2 - evt.clientY) * (koerper.y + koerperHoehe / 2 - evt.clientY) < 4000) {
		isDragging = true;
		koerper.x = evt.clientX - koerperBreite / 2 ;
		koerper.y = evt.clientY - koerperHoehe / 2;
		}
   
   if (koerper.x > 90 && koerper.x < 360 - koerperBreite) {
	   if (isDragging==true && koerper.y > 536 - koerperHoehe) {         koerper.y = 535 - koerperHoehe; 	
	   } 
	}   
   
   else if (koerper.y > 325 - koerperHoehe) {
      koerper.y = 325 - koerperHoehe; 	
   }	
}

function onDrop(evt){
	
	isDragging = false;
	canvas.removeEventListener('mousemove',onDrag,false);
	canvas.removeEventListener('mouseup',onDrop,false);
	
	if (koerper.x < 90 || koerper.x > 360 - koerperBreite) {
      koerper.pos2D = new Vector2D(canvas.width * 0.75, startHoehe - koerperHoehe);		
	}
	
	else if (koerper.x >= 90 && koerper.x <= 360 - koerperBreite) {
      koerper.x = evt.clientX - koerperBreite / 2 ;
	   koerper.y = evt.clientY - koerperHoehe / 2;
	   RK4(koerper);		
	}
	
   koerper.velo2D = new Vector2D(0, 0);	
      
}
function animFrame(){	animId = requestAnimationFrame(animFrame,canvas);	onTimer(); }
function onTimer(){	let t1 = new Date().getTime(); 	dt = 0.002*(t1-t0); 	t0 = t1;	if (dt>0.2) {dt=0;};	
		
	rhoFluessigkeit = sliderFluessigkeitsdichte.value;
	var rhoFluessigkeitDiv = document.getElementById("wertFluessigkeitsdichte");
   sliderFluessigkeitsdichte.oninput = function() {
      rhoFluessigkeitDiv.innerHTML = this.value + ' kg/dm' + '<sup>3</sup>';
	}
		
	rhoKoerper = sliderKoerperdichte.value;
	var rhoKoerperDiv = document.getElementById("wertKoerperdichte");
   sliderKoerperdichte.oninput = function() {
      rhoKoerperDiv.innerHTML = this.value + ' kg/dm' + '<sup>3</sup>';
	}
	
	g = sliderErdbeschleunigung.value;
	var erdbeschleunigungDiv = document.getElementById("wertErdbeschleunigung");
   sliderErdbeschleunigung.oninput = function() {
      erdbeschleunigungDiv.innerHTML = this.value + ' m/s' + '<sup>2</sup>';
	}
		
	move();
   }

function move(){				
   context.clearRect(0, 0, canvas.width, canvas.height);  
   context_bg.clearRect(0, 0, canvas_bg.width, canvas_bg.height);  
   
   
   if (koerper.y + koerperHoehe >= 537) {  
      koerper.y = 536 - koerperHoehe;
   } 
   	
   if (koerper.x > 90 && koerper.x < 360 - koerperBreite) {
	   if (isDragging==false && koerper.y < 536 - koerperHoehe){         RK4(koerper);	
         if (koerper.y > 536 - koerperHoehe) {
            koerper.y -= 1;	
         }
	   } 
	}
	
	else {
      if (isDragging==false && koerper.y < 536 - koerperHoehe){         koerper.pos2D = new Vector2D(canvas.width * 0.75, startHoehe - koerperHoehe);		
	   } 	   
	}			
	
	hintergrundZeichnen();
   beckenZeichnen();
   koerper.draw(context);	
   calcForce(koerper);
   erdbeschleunigungsVektor();
   auftriebsVektor();
   wasser();
   
   
  
   
   
   
} 
		 




	function calcForce(pos){
	let dr = (koerper.y - (wasserstand - 13)) / koerperHoehe;	
   let ratio;
      
   if (dr <= -1){
      ratio = 0;   
   } else if (dr < 0){
   	ratio = 1 + dr;
   }	else {
      ratio = 1;	
   }	 
   
   m = rhoKoerper * V;
   schwerkraft = new Vector2D(0, m * g);
   auftrieb = new Vector2D(0, -rhoFluessigkeit * g * V * ratio);
   reibung = koerper.velo2D.multiply(-ratio * k * koerper.velo2D.length());
	force = Forces.add([schwerkraft, auftrieb, reibung]);}	


function getAcc(pos,vel){	calcForce(pos,vel);	return force.multiply(1/m);}


function RK4(obj){				// step 1	let pos1 = obj.pos2D;	let vel1 = obj.velo2D;	let acc1 = getAcc(pos1,vel1); 	// step 2	let pos2 = pos1.addScaled(vel1,dt/2); 	let vel2 = vel1.addScaled(acc1,dt/2);	let acc2 = getAcc(pos2,vel2); 	// step 3	let pos3 = pos1.addScaled(vel2,dt/2); 	let vel3 = vel1.addScaled(acc2,dt/2);	let acc3 = getAcc(pos3,vel3); 	// step 4	let pos4 = pos1.addScaled(vel3,dt); 	let vel4 = vel1.addScaled(acc3,dt);	let acc4 = getAcc(pos4,vel4); 	// sum vel and acc	let velsum = vel1.addScaled(vel2,2).addScaled(vel3,2).add(vel4);	let accsum = acc1.addScaled(acc2,2).addScaled(acc3,2).add(acc4);	// update particle pos and velo	obj.pos2D = pos1.addScaled(velsum,dt/6);	obj.velo2D = vel1.addScaled(accsum,dt/6);					}


function hintergrundZeichnen() {
   
   context_bg.save();   
   gradient.addColorStop(0, 'rgb(57,100,250, 0.6)');
   gradient.addColorStop(1, 'rgb(255, 255, 255, 1.0)');
   context_bg.fillStyle = gradient;
   context_bg.fillRect(0, 0, 800, 300)
   context_bg.restore();	
   
   context_bg.save();   
   context_bg.fillStyle = 'rgb(65,240,169)';
   context_bg.fillRect(0, 300, 800, 50);
   context_bg.restore();
	
   context_bg.save();   
   context_bg.fillStyle = 'rgb(247,110,42)';
   context_bg.fillRect(0, 350, 800, 250);
   context_bg.restore();

   
   context.font = "15px Arial";
   context.fillStyle = 'rgb(0,0,0)';
   context.fillText("Prinzip von Archimedes:",10,30);
   context.fillText("Der statische Auftrieb eines Körpers",25,50);
   context.fillText("ist gleich gross wie die Gewichtskraft",25,70);
   context.fillText("des vom Körper verdrängten Mediums.",25,90);
   
   
}


function wasser() {
	

   context_bg.save();  
   context_bg.fillStyle = 'rgba(87,130,280, 0.6)';
   context_bg.strokeStyle = 'rgba(57,100,250, 0.6)';
   context_bg.beginPath();
   context_bg.moveTo(75, wasserstand -12.5);
   context_bg.lineTo(375, wasserstand - 13);  
   context_bg.lineTo(350, wasserstand - 25); 
   context_bg.lineTo(100, wasserstand - 25);  
   context_bg.lineTo(75, wasserstand - 13);  
   context_bg.fill();
   context_bg.restore();
	
	
	context.save();   
   context.fillStyle = 'rgba(57,100,250, 0.6)';
   context.fillRect(50, wasserstand, 350, 550 - wasserstand);
   context.restore();
 
 
   context.save();  
   context.fillStyle = 'rgba(87,130,280, 0.6)';
   context.strokeStyle = 'rgba(60, 100, 220, 0.6)';
   context.beginPath();
   context.moveTo(50, wasserstand);
   context.lineTo(400, wasserstand);   
   context.lineTo(375, wasserstand - 13);  
   context.lineTo(75, wasserstand - 13);  
   context.lineTo(50, wasserstand);  
   context.fill();
   context.restore();
   
}


function erdbeschleunigungsVektor() {
   schwerkraftVektor = m * g * 5;   
   context.save();   
   context.strokeStyle = 'rgb(255, 0, 0)';
   context.fillStyle = 'rgb(255, 0, 0)';
   context.lineWidth = 1;
   context.beginPath();
   context.moveTo(koerper.x + koerperBreite / 2, koerper.y + koerperHoehe / 2);
   context.lineTo(koerper.x + koerperBreite / 2, koerper.y + koerperHoehe / 2 + schwerkraftVektor);
   context.lineTo(koerper.x + koerperBreite / 2 - 5, koerper.y + koerperHoehe / 2 + schwerkraftVektor - 10);
   context.lineTo(koerper.x + koerperBreite / 2 + 5, koerper.y + koerperHoehe / 2 + schwerkraftVektor - 10);
   context.lineTo(koerper.x + koerperBreite / 2, koerper.y + koerperHoehe / 2 + schwerkraftVektor);
   context.fill();
   context.stroke();
   context.restore();      
}


function auftriebsVektor() {
   auftriebVektor = auftrieb.y * 5;   
   context.save();   
   context.strokeStyle = 'rgb(0, 255, 0)';
   context.fillStyle = 'rgb(0, 255, 0)';
   context.lineWidth = 1;
   context.beginPath();
   context.moveTo(koerper.x + koerperBreite / 2, koerper.y + koerperHoehe / 2);
   context.lineTo(koerper.x + koerperBreite / 2, koerper.y + koerperHoehe / 2 + auftriebVektor);
   context.lineTo(koerper.x + koerperBreite / 2 - 5, koerper.y + koerperHoehe / 2 + auftriebVektor + 10);
   context.lineTo(koerper.x + koerperBreite / 2 + 5, koerper.y + koerperHoehe / 2 + auftriebVektor + 10);
   context.lineTo(koerper.x + koerperBreite / 2, koerper.y + koerperHoehe / 2 + auftriebVektor);
   context.fill();
   context.stroke();
   //context.closePath();
   context.restore();      
}


function beckenZeichnen() {
   context_bg.save();   
   context_bg.strokeStyle = 'rgb(0, 0, 0)';
   context_bg.fillStyle = 'rgb(180, 180, 180)';
   context_bg.beginPath();
   context_bg.moveTo(50, 550);
   context_bg.lineTo(400, 550);
   context_bg.lineTo(400, 350);
   context_bg.lineTo(350, 325);
   context_bg.lineTo(100, 325);
   context_bg.lineTo(50, 350); 
   context_bg.lineTo(50, 550); 
   context_bg.fill();
   context_bg.stroke();
   context_bg.restore(); 
   
   context_bg.save();
   context_bg.strokeStyle = 'rgb(0, 0, 0)';
   context_bg.beginPath();
   context_bg.moveTo(100, 325);
   context_bg.lineTo(100, 525);
   context_bg.lineTo(50, 550); 
   context_bg.moveTo(100, 525);
   context_bg.lineTo(350, 525);
   context_bg.lineTo(400, 550);
   context_bg.moveTo(350, 525);
   context_bg.lineTo(350, 325);
   context_bg.stroke();
   context_bg.restore();
}




