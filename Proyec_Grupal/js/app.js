$(function(){
/* ===== CONFIGURACIÓN: cambia esto para tu negocio ===== */
var CONFIG={nombre:"Mi Negocio",logo:"📦",moneda:"Bs",
 empresa:{razon:"Mi Negocio S.R.L.",nit:"1234567019",dir:"Av. Principal 123, La Paz, Bolivia",tel:"+591 70000000",mail:"contacto@minegocio.com",horario:"Lunes a sábado, 9:00 a 19:00"},
 redes:[{n:"Facebook",i:"📘",u:"https://facebook.com/"},{n:"Instagram",i:"📸",u:"https://instagram.com/"},{n:"WhatsApp",i:"💬",u:"https://wa.me/59170000000"},{n:"TikTok",i:"🎵",u:"https://tiktok.com/"}]};
/* ===================================================== */
var COLORS=["#0f7b6c","#2563eb","#7c3aed","#db2777","#d97706","#475569"];
var KEY="inv_data_v1",products=[],moves=[],editId=null,color=COLORS[0];
function load(){try{var d=JSON.parse(localStorage.getItem(KEY));if(d){products=d.p;moves=d.m;return}}catch(e){}
 products=[
 {id:1,name:"Producto de ejemplo A",sku:"EJ-001",cat:"General",price:25,stock:40,min:10,desc:"Reemplaza con tus productos.",emoji:"🛍️",color:COLORS[0]},
 {id:2,name:"Producto de ejemplo B",sku:"EJ-002",cat:"General",price:120,stock:6,min:8,desc:"",emoji:"🎁",color:COLORS[2]},
 {id:3,name:"Insumo de ejemplo",sku:"IN-001",cat:"Insumos",price:8.5,stock:0,min:20,desc:"",emoji:"🧴",color:COLORS[4]},
 {id:4,name:"Accesorio de ejemplo",sku:"AC-001",cat:"Accesorios",price:49.9,stock:75,min:15,desc:"",emoji:"🎧",color:COLORS[1]}];moves=[]}
function save(){try{localStorage.setItem(KEY,JSON.stringify({p:products,m:moves}))}catch(e){}}
function esc(s){return $("<div>").text(s==null?"":s).html()}
function money(n){return CONFIG.moneda+" "+Number(n).toLocaleString("es-BO",{minimumFractionDigits:2,maximumFractionDigits:2})}
function status(p){return p.stock<=0?"out":(p.stock<=p.min?"low":"ok")}
var LBL={ok:"Disponible",low:"Stock bajo",out:"Agotado"};
function toast(t){$("#toast").text(t).addClass("show");clearTimeout(toast.t);toast.t=setTimeout(function(){$("#toast").removeClass("show")},2200)}

/* ===== Tema día / noche ===== */
function setTheme(t){$("html").attr("data-theme",t);$("#themeBtn").text(t==="dark"?"☀️":"🌙");try{localStorage.setItem("inv_theme",t)}catch(e){}}
var st=null;try{st=localStorage.getItem("inv_theme")}catch(e){}
setTheme(st||(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
$("#themeBtn").on("click",function(){setTheme($("html").attr("data-theme")==="dark"?"light":"dark")});

/* ===== Menú hamburguesa y vistas ===== */
$("#burger,#scrim").on("click",function(){$("body").toggleClass("nav-open")});
function show(v){if(!$("#v-"+v).length)v="inicio";$(".view").removeClass("active");$("#v-"+v).addClass("active");$("nav.side a").removeClass("active").filter("[data-view="+v+"]").addClass("active");$("body").removeClass("nav-open");window.scrollTo(0,0)}
$("nav.side a").on("click",function(){show($(this).data("view"))});
$(window).on("hashchange",function(){show(location.hash.slice(1))});

/* ===== Carrusel ===== */
var cur=0,N=3,timer;
for(var i=0;i<N;i++)$("#dots").append('<button aria-label="Ir a la diapositiva '+(i+1)+'" data-i="'+i+'"></button>');
function go(i){cur=(i+N)%N;$("#track").css("transform","translateX(-"+cur*100+"%)");$("#dots button").removeClass("on").eq(cur).addClass("on")}
function auto(){clearInterval(timer);timer=setInterval(function(){go(cur+1)},5000)}
$(".prev").on("click",function(){go(cur-1);auto()});$(".next").on("click",function(){go(cur+1);auto()});
$("#dots").on("click","button",function(){go($(this).data("i"));auto()});
$("#carousel").on("mouseenter",function(){clearInterval(timer)}).on("mouseleave",auto);go(0);auto();

/* ===== Render ===== */
function cardHTML(p){var s=status(p),pct=Math.min(100,Math.round(p.stock/Math.max(p.min*3,1)*100));
 return '<article class="card"><div class="thumb" style="background:linear-gradient(135deg,'+p.color+','+p.color+'99)"><span>'+esc(p.emoji)+'</span><span class="badge '+s+'">'+LBL[s]+'</span><button type="button" class="fav'+(p.fav?' on':'')+'" data-id="'+p.id+'" aria-label="Favorito">'+(p.fav?'★':'☆')+'</button></div><div class="body"><h3>'+esc(p.name)+'</h3><div class="meta">'+esc(p.sku)+' · '+esc(p.cat)+'</div>'+'<button class="btn sm more" type="button">Ver detalle ▾</button><div class="extra" style="display:none"><div class="meta">'+(esc(p.desc)||"Sin descripción")+'</div><div class="meta">Valor en stock: <b>'+money(p.stock*p.price)+'</b></div></div>'+'<div class="price">'+money(p.price)+'</div><div class="bar '+s+'"><i style="width:'+pct+'%"></i></div><div class="meta">'+p.stock+' unidades (mínimo '+p.min+')</div><div class="actions"><button class="btn sm" data-act="move" data-id="'+p.id+'">Movimiento</button><button class="btn sm" data-act="edit" data-id="'+p.id+'">Editar</button><button class="btn sm danger" data-act="del" data-id="'+p.id+'" aria-label="Eliminar">🗑</button></div></div></article>'}
function renderStats(){var units=0,val=0,low=0;$.each(products,function(_,p){units+=p.stock;val+=p.stock*p.price;if(status(p)!=="ok")low++});
 var items=[["Productos",products.length],["Unidades en stock",units],["Valor total",money(val)],["Requieren atención",low]];
 $("#stats").html(items.map(function(x){return '<div class="stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>'}).join(""));
 var cu={},mxu=1;$.each(products,function(_,p){cu[p.cat]=(cu[p.cat]||0)+p.stock;mxu=Math.max(mxu,cu[p.cat])});
 $("#catChart").html(Object.keys(cu).map(function(k){return '<div class="brow"><span>'+esc(k)+'</span><div class="bar"><i style="width:'+Math.round(cu[k]/mxu*100)+'%;background:var(--accent)"></i></div><b>'+cu[k]+'</b></div>'}).join("")||'<div class="meta">Sin datos todavía.</div>');
 if(low&&!renderStats.off){$("#alertBar").html('⚠️ <b>'+low+'</b> producto(s) con stock bajo o agotado. <button class="btn sm" id="alertGo">Ver ahora</button><button class="btn sm" id="alertX" aria-label="Cerrar aviso">✕</button>').slideDown(250)}else{$("#alertBar").slideUp(200)}
 $("#lowTitle").text(low?low+" producto(s) necesitan reposición":"Todo el stock está en orden");
 $("#lowText").text(low?"Revisa el inventario y filtra por estado para ver cuáles son.":"No hay productos agotados ni por debajo del mínimo.");
 $("#valText").text("Tienes "+units+" unidades valoradas en "+money(val)+".");
 $("#recent").html(products.slice(-4).reverse().map(cardHTML).join("")||'<div class="empty">Aún no hay productos.</div>')}
function cats(){var c=[];$.each(products,function(_,p){if(c.indexOf(p.cat)<0)c.push(p.cat)});return c.sort()}
function renderFilters(){var v=$("#fcat").val();$("#fcat").html('<option value="">Todas</option>'+cats().map(function(c){return '<option>'+esc(c)+'</option>'}).join("")).val(v);$("#cats").html(cats().map(function(c){return '<option value="'+esc(c)+'">'}).join(""))}
function renderGrid(){renderChips();var mx=Math.max.apply(null,products.map(function(p){return p.price}).concat([1])),lim=mx*$("#fprice").val()/100;$("#pv").text(+$("#fprice").val()>=100?"todos":money(lim));var q=$("#fq").val().toLowerCase().trim(),c=$("#fcat").val(),s=$("#fst").val(),o=$("#fsort").val();
 var l=products.filter(function(p){return(!q||p.name.toLowerCase().indexOf(q)>-1||p.sku.toLowerCase().indexOf(q)>-1)&&(!c||p.cat===c)&&(!s||(s==="fav"?p.fav:status(p)===s))&&p.price<=lim+.001});
 l.sort(function(a,b){return o==="price-asc"?a.price-b.price:o==="price-desc"?b.price-a.price:o==="stock-asc"?a.stock-b.stock:a.name.localeCompare(b.name)});
 $("#grid").html(l.map(cardHTML).join("")||'<div class="empty" style="grid-column:1/-1">No hay productos con esos filtros. Prueba limpiarlos o agrega uno nuevo.</div>');$("#grid .card").hide().fadeIn(220);
 if(q||c||s||+$("#fprice").val()<100)$("#clearF").show();else $("#clearF").hide()}
function renderChips(){var cur=$("#fcat").val()||"",h='<button class="chip'+(cur?'':' on')+'" data-cat="">Todas</button>',l='';
 $.each(cats(),function(_,c){h+='<button class="chip'+(c===cur?' on':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>';l+='<button type="button" class="catlink" data-cat="'+esc(c)+'">'+esc(c)+'</button>'});
 $("#chips").html(h);$("#catList").html(l)}
function renderMoves(){$("#moves").html(moves.slice().reverse().map(function(m){return '<tr><td>'+esc(m.date)+'</td><td>'+esc(m.name)+'</td><td class="'+m.type+'">'+(m.type==="in"?"Entrada":"Salida")+'</td><td>'+m.qty+'</td><td>'+esc(m.note||"-")+'</td></tr>'}).join("")||'<tr><td colspan="5" style="text-align:center;color:var(--muted)">Todavía no registraste movimientos.</td></tr>')}
function renderAll(){renderStats();renderFilters();renderGrid();renderMoves();save()}
$("#fq").on("input",renderGrid);$("#fcat,#fst,#fsort,#fprice").on("input change",renderGrid);
$("#clearF").on("click",function(){$("#fq").val("");$("#fcat,#fst").val("");$("#fprice").val(100);$("#fsort").val("name");renderGrid()});

/* ===== Validación ===== */
function check($el){var v=$.trim($el.val()),id=$el.attr("id"),m="";
 if($el.prop("required")&&!v)m="Este campo es obligatorio.";
 else if(id==="pname"&&v.length<3)m="Escribe al menos 3 caracteres.";
 else if(id==="psku"){if(!/^[A-Za-z0-9\-_]{3,20}$/.test(v))m="Usa 3 a 20 letras, números o guiones.";else if(products.some(function(p){return p.sku.toLowerCase()===v.toLowerCase()&&p.id!==editId}))m="Ese SKU ya existe."}
 else if(id==="pprice"&&!(parseFloat(v)>0))m="El precio debe ser mayor que 0.";
 else if(id==="cname"&&v.length<3)m="Escribe tu nombre completo.";
 else if(id==="cmail"&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))m="Ingresa un correo válido (ej: nombre@correo.com).";
 else if(id==="cphone"&&!/^\+?[\d\s]{7,15}$/.test(v))m="Ingresa un teléfono de 7 a 15 dígitos.";
 else if(id==="cmsg"&&v.length<10)m="Cuéntanos un poco más (mínimo 10 caracteres).";
 else if((id==="pstock"||id==="pmin")&&(!/^\d+$/.test(v)))m="Ingresa un número entero de 0 o más.";
 else if(id==="mqty"){if(!/^\d+$/.test(v)||+v<1)m="Ingresa una cantidad entera mayor que 0.";else if($("#mtype").val()==="out"){var p=find(+$("#mprod").val());if(p&&+v>p.stock)m="Solo hay "+p.stock+" unidades disponibles."}}
 $el.toggleClass("invalid",!!m).toggleClass("valid",!m&&!!v);$el.siblings(".err").text(m);return !m}
function validate($f){var ok=true;$f.find("input[required],select[required],textarea[required]").each(function(){if(!check($(this)))ok=false});return ok}
$("form").on("blur input change","input[required],select[required],textarea[required]",function(){check($(this))});
function find(id){return products.filter(function(p){return p.id===id})[0]}

/* ===== Modales ===== */
function open(m){$(m).addClass("show")}function close(){$(".modal").removeClass("show")}
$(".modal").on("click",function(e){if(e.target===this)close()});$("[data-close]").on("click",close);
$(document).on("keydown",function(e){if(e.key==="Escape")close()});
$("#swatches").html(COLORS.map(function(c){return '<button type="button" data-c="'+c+'" style="background:'+c+'" aria-label="Color"></button>'}).join(""));
$("#swatches").on("click","button",function(){color=$(this).data("c");$("#swatches button").removeClass("on");$(this).addClass("on")});
function pickColor(c){color=c;$("#swatches button").removeClass("on").filter('[data-c="'+c+'"]').addClass("on")}
function openProd(p){editId=p?p.id:null;$("#fProd .err").text("");$("#fProd input,#fProd textarea").removeClass("invalid");
 $("#mProdTitle").text(p?"Editar producto":"Nuevo producto");
 $("#pname").val(p?p.name:"");$("#psku").val(p?p.sku:"");$("#pcat").val(p?p.cat:"");$("#pprice").val(p?p.price:"");$("#pstock").val(p?p.stock:"");$("#pmin").val(p?p.min:"5");$("#pdesc").val(p?p.desc:"");$("#pemoji").val(p?p.emoji:"📦");pickColor(p?p.color:COLORS[0]);open("#mProd");$("#pname").focus()}
$("#addBtn").on("click",function(){openProd(null)});
$("#fProd").on("submit",function(e){e.preventDefault();if(!validate($(this))){toast("Revisa los campos marcados");return}
 var d={name:$.trim($("#pname").val()),sku:$.trim($("#psku").val()).toUpperCase(),cat:$.trim($("#pcat").val()),price:parseFloat($("#pprice").val()),stock:parseInt($("#pstock").val(),10),min:parseInt($("#pmin").val(),10),desc:$.trim($("#pdesc").val()),emoji:$.trim($("#pemoji").val())||"📦",color:color};
 if(editId){$.extend(find(editId),d);toast("Producto actualizado")}else{d.id=Date.now();products.push(d);toast("Producto agregado")}
 close();renderAll()});
function openMove(id){$("#fMove .err").text("");$("#fMove input").removeClass("invalid");
 if(!products.length){toast("Primero agrega un producto");return}
 $("#mprod").html(products.map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+' ('+p.stock+')</option>'}).join(""));if(id)$("#mprod").val(id);$("#mqty,#mnote").val("");open("#mMove");$("#mqty").focus()}
$("#moveBtn").on("click",function(){openMove()});
$("#fMove").on("submit",function(e){e.preventDefault();if(!validate($(this)))return;
 var p=find(+$("#mprod").val()),q=parseInt($("#mqty").val(),10),t=$("#mtype").val();
 p.stock+=t==="in"?q:-q;moves.push({name:p.name,type:t,qty:q,note:$.trim($("#mnote").val()),date:new Date().toLocaleString("es-BO",{dateStyle:"short",timeStyle:"short"})});
 toast(t==="in"?"Entrada registrada":"Salida registrada");close();renderAll()});
$("#mtype,#mprod").on("change",function(){if($("#mqty").val())check($("#mqty"))});

/* ===== Acciones de tarjetas ===== */
$(document).on("click","[data-act]",function(){var id=+$(this).data("id"),a=$(this).data("act"),p=find(id);
 if(a==="edit")openProd(p);else if(a==="move")openMove(id);
 else if(a==="del"&&confirm("¿Eliminar \""+p.name+"\"? Esta acción no se puede deshacer.")){products=products.filter(function(x){return x.id!==id});toast("Producto eliminado");renderAll()}});

/* ===== Efectos jQuery: slideToggle, fadeToggle, hide/show ===== */
$(document).on("click",".fav",function(){var p=find(+$(this).data("id"));p.fav=!p.fav;toast(p.fav?"Agregado a favoritos":"Quitado de favoritos");renderAll()});
$(document).on("click","#alertX",function(){renderStats.off=true;$("#alertBar").slideUp(200)});
$(document).on("click","#alertGo",function(){$("#fst").val("low");renderGrid();show("inventario");location.hash="inventario"});
$(document).on("click",".faq .q",function(){var $a=$(this).next(".a");$(".faq .a").not($a).slideUp(200);$a.slideToggle(200)});
$(window).on("scroll",function(){if($(window).scrollTop()>300)$("#toTop").fadeIn(200);else $("#toTop").fadeOut(200)});
$("#toTop").on("click",function(){$("html,body").animate({scrollTop:0},400)});
$("#clearMoves").on("click",function(){if(moves.length&&confirm("¿Vaciar todo el historial de movimientos?")){moves=[];toast("Historial vaciado");renderAll()}});
$("#exportBtn").on("click",function(){var rows=[["SKU","Nombre","Categoria","Precio","Stock","Minimo"]].concat(products.map(function(p){return[p.sku,p.name,p.cat,p.price,p.stock,p.min]}));
 var csv="\ufeff"+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(",")}).join("\n");
 try{var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="inventario.csv";document.body.appendChild(a);a.click();a.remove();toast("CSV exportado")}catch(e){toast("No se pudo exportar aquí")}});
$("#catToggle").on("click",function(){$("#catList").slideToggle(200)});
$("#toggleF").on("click",function(){$("#toolbar").slideToggle(250)});
$("#toggleStats").on("click",function(){$("#stats").slideToggle(250,function(){$("#toggleStats").text($(this).is(":visible")?"Ocultar resumen":"Mostrar resumen")})});
$("#toggleCo").on("click",function(){$("#coBox").slideToggle(250)});
$("#toggleSoc").on("click",function(){$("#socBox").fadeToggle(250)});
$(document).on("click",".more",function(){var $e=$(this).next(".extra"),open=$e.is(":visible");$e.slideToggle(200);$(this).text(open?"Ver detalle ▾":"Ocultar detalle ▴")});
$(document).on("click",".chip,.catlink",function(){$("#fcat").val($(this).attr("data-cat")||"");renderGrid();if($(this).hasClass("catlink")){show("inventario");location.hash="inventario"}});

/* ===== Empresa, redes y contacto ===== */
var E=CONFIG.empresa;
$(".socials").html(CONFIG.redes.map(function(r){return '<a class="social" href="'+r.u+'" target="_blank" rel="noopener noreferrer"><span>'+r.i+'</span>'+esc(r.n)+'</a>'}).join(""));
$("#coBox").html([["Razón social",E.razon],["NIT",E.nit],["Dirección",E.dir],["Teléfono",E.tel],["Correo",E.mail],["Horario",E.horario]].map(function(x){return '<li><b>'+x[0]+':</b> '+esc(x[1])+'</li>'}).join(""));
$("#fInfo").text(E.razon+" · NIT "+E.nit+" · "+new Date().getFullYear());
$("#cmsg").on("input",function(){$("#cnt").text(this.value.length+"/300")});
$("#fCont").on("submit",function(e){e.preventDefault();if(!validate($(this))){toast("Revisa los campos marcados");return}
 this.reset();$(this).find(".valid").removeClass("valid");$("#cnt").text("0/300");$("#okMsg").hide().fadeIn(300).delay(3500).fadeOut(400);toast("Mensaje enviado")});

/* ===== Inicio ===== */
document.title="Inventario · "+CONFIG.nombre;$("#brandName").text(CONFIG.nombre);$("#logo").text(CONFIG.logo);
load();renderAll();show(location.hash.slice(1)||"inicio");
});
