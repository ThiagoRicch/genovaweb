class ThemeSwitcher {
  constructor() {
    this.inputCheck = document.querySelector('#modo__noturno');
    this.body = document.querySelector('body');

    this.imgGenovaNavbar = document.querySelector('.imagem__genova__navbar');
    this.imgGenova = document.querySelector('.imagem__genova');
    this.imgCardCerebro = document.querySelector('.imagem__card__cerebro');
    this.imgCardCerebro2 = document.querySelector('.imagem__card__cerebro2');
    this.imgCardBot = document.querySelector('.imagem__card__bot');
    this.imgGenovaProfile = document.querySelector('.imagem__genova__profile');
    this.titulo = document.querySelector('.titulo__menu__navbar');
    this.tituloSlideTablet = document.querySelector('.titulo__slide2__tablet');
    this.paragrafoSlideTablet = document.querySelector('.paragrafo__slide2__tablet');
    this.imgHomePage = document.querySelector('.img__home');
    this.imgChatGenova = document.querySelector('.img__chat-genova');
    this.imgOpenSupport = document.querySelector('.img__support');
    this.imgMyProfile = document.querySelector('.img__profile');
    this.imgHistoryIA = document.querySelector('.img__history-ia');
    this.imgHistoryChamado = document.querySelector('.img__history-chamado');
    this.imgFaleConosco = document.querySelector('.img__fale-conosco');
    this.imgTheme = document.querySelector('.img__theme');
    this.imgWarning = document.querySelector('.img__warning');
    this.HandDenuncias = document.querySelector('.img__hand__denuncias');
    this.imgSuccess = document.querySelector('.img__success');
    this.imgTiming = document.querySelector('.img__timing');
    this.imgLogout = document.querySelector('.img__logout');
    this.clipDenuncias = document.querySelector('.img__clip__denuncias');
    this.imageDenuncias = document.querySelector('.img__denuncias_user')

    this.initEvents();
    this.loadThemeFromStorage(); // <-- carrega o tema salvo ao iniciar
  }

  initEvents() {
    if (!this.inputCheck) return;
    this.inputCheck.addEventListener('click', () => this.toggleTheme());
  }

  toggleTheme() {
    const modo = this.inputCheck.checked ? 'dark' : 'light';
    this.applyTheme(modo);
    localStorage.setItem('tema_genova', modo); // <-- salva no localStorage
  }

  applyTheme(modo) {
    this.body.setAttribute('data-bs-theme', modo);

    if (modo === 'dark') {
      if (this.imgGenova) this.imgGenova.src = '../assets/genova_branco.svg';
      if (this.imgCardCerebro) this.imgCardCerebro.src = '../assets/cerebro_branco.svg';
      if (this.imgCardCerebro2) this.imgCardCerebro2.src = '../assets/cerebro2_branco.svg';
      if (this.imgCardBot) this.imgCardBot.src = '../assets/bot_branco.svg';
      if (this.imgGenovaNavbar) this.imgGenovaNavbar.src = '../assets/genova_branco.svg';
      if (this.imgGenovaProfile) this.imgGenovaProfile.src = '../assets/genova_branco.svg';
      if (this.titulo) this.titulo.style.color = 'white';
      if (this.tituloSlideTablet) this.tituloSlideTablet.style.color = 'white';
      if (this.paragrafoSlideTablet) this.paragrafoSlideTablet.style.color = 'white';
      if (this.imgHomePage) this.imgHomePage.src = '../assets/home_branco.svg.png';
      if (this.imgChatGenova) this.imgChatGenova.src = '../assets/chat_branco.svg.png';
      if (this.imgOpenSupport) this.imgOpenSupport.src = '../assets/support_branco.svg.png';
      if (this.imgMyProfile) this.imgMyProfile.src = '../assets/profile_branco.svg.png';
      if (this.imgHistoryIA) this.imgHistoryIA.src = '../assets/clipboard_ia_branco.svg.png';
      if (this.imgHistoryChamado) this.imgHistoryChamado.src = '../assets/clipboard_chamado_branco.svg.png';
      if (this.imgFaleConosco) this.imgFaleConosco.src = '../assets/telephone_branco.svg.png';
      if (this.imgTheme) this.imgTheme.src = '../assets/theme_branco.svg.png';
      if (this.imgWarning) this.imgWarning.src = '../assets/warning_branco.svg.png';
      if (this.HandDenuncias) this.HandDenuncias.src = '../assets/denunciar_branco.svg.png';
      if (this.imgSuccess) this.imgSuccess.src = '../assets/success__branco.png';
      if (this.imgTiming) this.imgTiming.src = '../assets/timing__branco.png';
      if (this.imgLogout) this.imgLogout.src = '../assets/logout__branco.png';
      if (this.clipDenuncias) this.clipDenuncias.src = '../assets/clipboard__denuncias__branco.svg';
      if (this.imageDenuncias) this.imageDenuncias.src = '../assets/denuncias_branco.png';
    } else {
      if (this.imgGenova) this.imgGenova.src = '../assets/genova.svg';
      if (this.imgCardCerebro) this.imgCardCerebro.src = '../assets/cerebro.svg';
      if (this.imgCardCerebro2) this.imgCardCerebro2.src = '../assets/cerebro2.svg';
      if (this.imgCardBot) this.imgCardBot.src = '../assets/bot.svg';
      if (this.imgGenovaNavbar) this.imgGenovaNavbar.src = '../assets/genova.svg';
      if (this.imgGenovaProfile) this.imgGenovaProfile.src = '../assets/genova.svg';
      if (this.titulo) this.titulo.style.color = 'black';
      if (this.tituloSlideTablet) this.tituloSlideTablet.style.color = 'black';
      if (this.paragrafoSlideTablet) this.paragrafoSlideTablet.style.color = 'black';
      if (this.imgHomePage) this.imgHomePage.src = '../assets/home.svg.png';
      if (this.imgChatGenova) this.imgChatGenova.src = '../assets/chat.svg.png';
      if (this.imgOpenSupport) this.imgOpenSupport.src = '../assets/support.svg.png';
      if (this.imgMyProfile) this.imgMyProfile.src = '../assets/profile.svg.png';
      if (this.imgHistoryIA) this.imgHistoryIA.src = '../assets/clipboard_ia.svg.png';
      if (this.imgHistoryChamado) this.imgHistoryChamado.src = '../assets/clipboard_chamado.svg.png';
      if (this.imgFaleConosco) this.imgFaleConosco.src = '../assets/telephone.svg.png';
      if (this.imgTheme) this.imgTheme.src = '../assets/theme.svg.png';
      if (this.imgWarning) this.imgWarning.src = '../assets/warning.svg.png';
      if (this.HandDenuncias) this.HandDenuncias.src = '../assets/denunciar.svg.png';
      if (this.imgSuccess) this.imgSuccess.src = '../assets/success.svg';
      if (this.imgTiming) this.imgTiming.src = '../assets/timing.png';
      if (this.imgLogout) this.imgLogout.src = '../assets/logout.png';
      if (this.clipDenuncias) this.clipDenuncias.src = '../assets/clipboard__denuncias.svg';
      if (this.imageDenuncias) this.imageDenuncias.src = '../assets/denuncias.png';
    }
  }

  loadThemeFromStorage() {
    const savedTheme = localStorage.getItem('tema_genova') || 'light';
    this.applyTheme(savedTheme);
    if (this.inputCheck) this.inputCheck.checked = savedTheme === 'dark';
  }
}

// Inicializa
document.addEventListener('DOMContentLoaded', () => new ThemeSwitcher());
