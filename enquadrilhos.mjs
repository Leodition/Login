const notice='Esta é uma prévia visual. O acesso seguro e a criação de contas ainda estão sendo conectados; nenhum dado foi enviado.';
document.querySelectorAll('.eq-auth-card').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const status=form.querySelector('.eq-form-status');status.textContent=notice;form.reset();}));
