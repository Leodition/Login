const notice='O cadastro e o login ainda estão sendo conectados. Nenhum dado foi enviado.';
const dialog=document.getElementById('eqAuthDialog');
function setAuthMode(mode){const signup=mode==='signup';document.querySelectorAll('[data-auth-tab]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.authTab===mode)));document.getElementById('eqLoginForm').hidden=signup;document.getElementById('eqSignupForm').hidden=!signup;document.getElementById('eqAuthTitle').textContent=signup?'Crie sua conta':'Entre na sua conta';}
document.querySelectorAll('[data-open-auth]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const mode=link.dataset.openAuth;setAuthMode(mode);dialog.showModal();}));
document.querySelectorAll('[data-auth-tab]').forEach(tab=>tab.addEventListener('click',()=>setAuthMode(tab.dataset.authTab)));
document.getElementById('eqAuthClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
document.querySelectorAll('.eq-auth-card').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();form.querySelector('.eq-form-status').textContent=notice;form.reset();}));
