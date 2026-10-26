(function(){
 var b=document.querySelector('.burger'),m=document.getElementById('menu');
 if(!b||!m)return;
 function set(o){m.classList.toggle('open',o);b.setAttribute('aria-expanded',o);document.body.classList.toggle('lock',o)}
 b.addEventListener('click',function(){set(!m.classList.contains('open'))});
 m.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
 window.matchMedia('(min-width:901px)').addEventListener('change',function(){set(false)});
})();
