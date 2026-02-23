;(function(){
  var state={professions:[],filters:{q:"",cat:""}}
  var DEFAULT_PROFESSIONS=[
    {id:"dev-fe",title:"Frontend-разработчик",category:"Разработка",description:"Создает интерфейсы, работает с HTML, CSS, JavaScript, фреймворками."},
    {id:"dev-be",title:"Backend-разработчик",category:"Разработка",description:"Проектирует API, бизнес-логику, базы данных и интеграции."},
    {id:"qa",title:"Тестировщик (QA)",category:"Тестирование",description:"Обеспечивает качество продукта с помощью тестирования и автоматизации."},
    {id:"analyst",title:"Системный аналитик",category:"Аналитика",description:"Формализует требования, моделирует процессы и данные."},
    {id:"devops",title:"DevOps-инженер",category:"Инфраструктура",description:"Автоматизирует сборку, развёртывание и мониторинг, обеспечивает надежность."},
    {id:"uxui",title:"UX/UI-дизайнер",category:"Дизайн",description:"Проектирует пользовательские сценарии и визуальные интерфейсы."}
  ]
  var sections=[].slice.call(document.querySelectorAll("[data-section]"))
  var navList=document.getElementById("nav-list")
  var navToggle=document.getElementById("nav-toggle")
  function load(key,def){try{var v=localStorage.getItem(key);return v?JSON.parse(v):def}catch(e){return def}}
  function save(key,val){localStorage.setItem(key,JSON.stringify(val))}
  function uid(){return Math.random().toString(36).slice(2)}
  function demoBootstrap(){
    var users=load("users",null)
    if(!users){
      users=[
        {email:"admin@demo",name:"Админ",password:"demo123",role:"admin"},
        {email:"expert@demo",name:"Эксперт",password:"demo123",role:"expert"},
        {email:"consultant@demo",name:"Консультант",password:"demo123",role:"consultant"},
        {email:"user@demo",name:"Пользователь",password:"demo123",role:"user"}
      ]
      save("users",users)
    }
  }
  function currentUser(){return load("currentUser",null)}
  function setCurrentUser(u){if(u)save("currentUser",u);else localStorage.removeItem("currentUser");refreshAuthUI()}
  function getUsers(){return load("users",[])}
  function setUsers(arr){save("users",arr)}
  function getRatings(){return load("ratings",{})}
  function setRatings(r){save("ratings",r)}
  function getConsultations(){return load("consultations",[])}
  function setConsultations(c){save("consultations",c)}
  function getProfExtra(){return load("professionsExtra",[])}
  function setProfExtra(p){save("professionsExtra",p)}
  function getFavorites(email){return load("favorites_"+email,[])}
  function setFavorites(email,arr){save("favorites_"+email,arr)}
  function showSection(id){
    sections.forEach(function(s){s.hidden=s.id!==id})
    if(id!=="login"&&id!=="register")history.replaceState(null,"","#"+id)
    if(id==="professions")renderProfessions()
    if(id==="user")renderUserCabinet()
    if(id==="expert")renderExpertCabinet()
    if(id==="consultant")renderConsultantCabinet()
    if(id==="admin")renderAdminPanel()
  }
  function refreshAuthUI(){
    var u=currentUser()
    var authEls=[].slice.call(document.querySelectorAll(".auth-only"))
    var guestEls=[].slice.call(document.querySelectorAll(".guest-only"))
    authEls.forEach(function(el){
      var needRole=el.getAttribute("data-role")
      var ok=!!u && (!needRole || (u && u.role===needRole))
      el.style.display=ok?"":"none"
    })
    guestEls.forEach(function(el){el.style.display=u?"none":""})
  }
  function fetchProfessions(){
    return fetch("data/professions.json").then(function(r){
      if(!r.ok) throw new Error("bad")
      return r.json()
    }).then(function(base){
      var extra=getProfExtra()
      state.professions=base.concat(extra)
    }).catch(function(){
      var extra=getProfExtra()
      var base=DEFAULT_PROFESSIONS
      state.professions=base.concat(extra)
    })
  }
  function ratingAvg(id){
    var r=getRatings()[id]||{}
    var vals=Object.values(r)
    if(!vals.length)return 0
    var s=vals.reduce(function(a,b){return a+b},0)
    return Math.round((s/vals.length)*10)/10
  }
  function isFav(email,id){
    return getFavorites(email).indexOf(id)>=0
  }
  function toggleFav(email,id){
    var fav=getFavorites(email)
    var i=fav.indexOf(id)
    if(i>=0)fav.splice(i,1);else fav.push(id)
    setFavorites(email,fav)
    renderUserCabinet()
    renderProfessions()
  }
  function renderProfessions(){
    var list=document.getElementById("prof-list")
    if(!list)return
    var u=currentUser()
    var q=state.filters.q.trim().toLowerCase()
    var cat=state.filters.cat
    var items=state.professions.filter(function(p){
      var okTitle=!q || p.title.toLowerCase().indexOf(q)>=0
      var okCat=!cat || p.category===cat
      return okTitle && okCat
    })
    list.innerHTML=""
    items.forEach(function(p){
      var card=document.createElement("div")
      card.className="card"
      var avg=ratingAvg(p.id)
      var stars="★★★★★".slice(0,Math.round(avg))+"☆☆☆☆☆".slice(0,5-Math.round(avg))
      var html=""
      html+='<h3 class="prof-card-title">'+p.title+'</h3>'
      html+='<div class="prof-card-cat">'+p.category+' • Средняя оценка: '+(avg||"—")+'</div>'
      html+='<p>'+p.description+'</p>'
      html+='<div class="prof-actions">'
      if(u && u.role==="user"){
        var f=isFav(u.email,p.id)
        html+='<button class="btn" data-act="fav" data-id="'+p.id+'">'+(f?"Убрать из избранного":"В избранное")+'</button>'
      }else{
        html+='<button class="btn" disabled>В избранное</button>'
      }
      if(u && u.role==="expert"){
        html+='<span class="stars" data-id="'+p.id+'">★ ★ ★ ★ ★</span>'
      }else{
        html+='<span class="muted">Только эксперт может оценивать</span>'
      }
      html+='</div>'
      card.innerHTML=html
      list.appendChild(card)
      if(u && u.role==="expert"){
        var starsEl=card.querySelector(".stars")
        starsEl.addEventListener("click",function(e){
          var rect=starsEl.getBoundingClientRect()
          var x=e.clientX-rect.left
          var w=rect.width
          var val=Math.min(5,Math.max(1,Math.ceil((x/w)*5)))
          var all=getRatings()
          all[p.id]=all[p.id]||{}
          all[p.id][u.email]=val
          setRatings(all)
          renderProfessions()
        })
      }
      var favBtn=card.querySelector('[data-act="fav"]')
      if(favBtn)favBtn.addEventListener("click",function(){toggleFav(u.email,p.id)})
    })
  }
  function renderUserCabinet(){
    var u=currentUser()
    var info=document.getElementById("user-info")
    if(!u||!info)return
    info.innerHTML="<div><strong>"+u.name+"</strong> • "+u.email+" • Роль: "+u.role+"</div>"
    var favWrap=document.getElementById("favorites")
    var favIds=getFavorites(u.email)
    var items=state.professions.filter(function(p){return favIds.indexOf(p.id)>=0})
    favWrap.innerHTML=items.length?items.map(function(p){return "<div>"+p.title+"</div>"}).join(""):"<div class='muted'>Нет избранного</div>"
    var mine=getConsultations().filter(function(c){return c.userEmail===u.email})
    var el=document.getElementById("my-consultations")
    el.innerHTML=mine.length?mine.map(function(c){return "<div class='card'><div><strong>"+c.topic+"</strong> • "+new Date(c.date).toLocaleString()+"</div><div>"+c.text+"</div><div class='muted'>Консультант: "+c.consultantEmail+"</div></div>"}).join(""):""
  }
  function renderExpertCabinet(){
    var u=currentUser()
    var box=document.getElementById("expert-queue")
    if(!u||!box)return
    box.innerHTML=""
    state.professions.forEach(function(p){
      var avg=ratingAvg(p.id)
      var card=document.createElement("div")
      card.className="card"
      card.innerHTML="<h3>"+p.title+"</h3><div class='muted'>Текущая средняя: "+(avg||"—")+"</div>"
      box.appendChild(card)
    })
  }
  function renderConsultantCabinet(){
    var box=document.getElementById("all-consultations")
    if(!box)return
    var items=getConsultations()
    box.innerHTML=items.length?items.map(function(c){return "<div class='card'><div><strong>"+c.userEmail+"</strong> • "+new Date(c.date).toLocaleString()+"</div><div><em>"+c.topic+"</em></div><div>"+c.text+"</div><div class='muted'>"+c.consultantEmail+"</div></div>"}).join(""):""
  }
  function renderAdminPanel(){
    var list=document.getElementById("admin-prof-list")
    var usersList=document.getElementById("admin-users")
    if(list){
      var extra=getProfExtra()
      list.innerHTML=extra.length?extra.map(function(p,i){return "<div class='card'><div><strong>"+p.title+"</strong> • "+p.category+"</div><div>"+p.description+"</div><button class='btn' data-del='"+i+"'>Удалить</button></div>"}).join(""):"<div class='muted'>Нет добавленных профессий</div>"
      list.querySelectorAll("[data-del]").forEach(function(btn){
        btn.addEventListener("click",function(){
          var idx=parseInt(btn.getAttribute("data-del"),10)
          var e=getProfExtra()
          e.splice(idx,1)
          setProfExtra(e)
          fetchProfessions().then(function(){renderAdminPanel();renderProfessions()})
        })
      })
    }
    if(usersList){
      var us=getUsers()
      usersList.innerHTML=us.map(function(u){return "<div>"+u.name+" • "+u.email+" • "+u.role+"</div>"}).join("")
    }
  }
  navToggle.addEventListener("click",function(){navList.classList.toggle("show")})
  document.querySelectorAll("[data-link]").forEach(function(a){
    a.addEventListener("click",function(){
      var id=a.getAttribute("href").replace("#","")
      showSection(id)
      navList.classList.remove("show")
    })
  })
  document.getElementById("logout-btn").addEventListener("click",function(){setCurrentUser(null);showSection("home")})
  document.getElementById("search").addEventListener("input",function(e){state.filters.q=e.target.value;renderProfessions()})
  document.getElementById("category-filter").addEventListener("change",function(e){state.filters.cat=e.target.value;renderProfessions()})
  var loginForm=document.getElementById("login-form")
  loginForm.addEventListener("submit",function(e){
    e.preventDefault()
    var email=document.getElementById("login-email").value.trim().toLowerCase()
    var pass=document.getElementById("login-password").value
    var users=getUsers()
    var u=users.find(function(x){return x.email.toLowerCase()===email && x.password===pass})
    if(u){setCurrentUser({email:u.email,name:u.name,role:u.role});showSection("home")}else{alert("Неверные данные")}
  })
  var regForm=document.getElementById("register-form")
  regForm.addEventListener("submit",function(e){
    e.preventDefault()
    var name=document.getElementById("reg-name").value.trim()
    var email=document.getElementById("reg-email").value.trim()
    var pass=document.getElementById("reg-password").value
    var users=getUsers()
    if(users.find(function(u){return u.email.toLowerCase()===email.toLowerCase()})){alert("Email уже используется");return}
    users.push({email:email,name:name,password:pass,role:"user"})
    setUsers(users)
    setCurrentUser({email:email,name:name,role:"user"})
    showSection("user")
  })
  var reqForm=document.getElementById("request-consult-form")
  reqForm.addEventListener("submit",function(e){
    e.preventDefault()
    var u=currentUser()
    if(!u){alert("Нужно войти");return}
    var topic=document.getElementById("consult-topic").value.trim()
    var message=document.getElementById("consult-message").value.trim()
    var items=getConsultations()
    items.push({id:uid(),userEmail:u.email,consultantEmail:"—",topic:topic,text:message,date:Date.now()})
    setConsultations(items)
    e.target.reset()
    renderUserCabinet()
    showSection("user")
  })
  var consForm=document.getElementById("consultant-form")
  consForm.addEventListener("submit",function(e){
    e.preventDefault()
    var consul=currentUser()
    if(!consul||consul.role!=="consultant"){alert("Недостаточно прав");return}
    var email=document.getElementById("cons-email").value.trim()
    var text=document.getElementById("cons-reco").value.trim()
    var items=getConsultations()
    items.push({id:uid(),userEmail:email,consultantEmail:consul.email,topic:"Рекомендации",text:text,date:Date.now()})
    setConsultations(items)
    e.target.reset()
    renderConsultantCabinet()
  })
  var addProf=document.getElementById("add-prof-form")
  addProf.addEventListener("submit",function(e){
    e.preventDefault()
    var u=currentUser()
    if(!u||u.role!=="admin"){alert("Недостаточно прав");return}
    var t=document.getElementById("new-prof-title").value.trim()
    var c=document.getElementById("new-prof-cat").value
    var d=document.getElementById("new-prof-desc").value.trim()
    var extra=getProfExtra()
    extra.push({id:uid(),title:t,category:c,description:d})
    setProfExtra(extra)
    e.target.reset()
    fetchProfessions().then(function(){renderAdminPanel();renderProfessions()})
  })
  demoBootstrap()
  fetchProfessions().then(function(){
    refreshAuthUI()
    var hash=location.hash.replace("#","")||"home"
    showSection(hash)
  })
  window.addEventListener("storage",function(){refreshAuthUI();renderProfessions()})
  refreshAuthUI()
})()
