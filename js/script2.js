class ThemeSwitcher {
  constructor() {
    this.inputCheck = document.querySelector('#modo__noturno');
    this.body = document.querySelector('body');

    this.imgGenovaNavbar = document.querySelector('.imagem__genova__navbar');
    this.imgGenova = document.querySelector('.imagem__genova');
    this.imgCardCerebro = document.querySelector('.imagem__card__cerebro');
    this.imgCardCerebro2 = document.querySelector('.imagem__card__cerebro2');
    this.imgCardBot = document.querySelector('.imagem__card__bot');

    this.titulo = document.querySelector('.titulo__menu__navbar');
    this.tituloSlideTablet = document.querySelector('.titulo__slide2__tablet');
    this.paragrafoSlideTablet = document.querySelector('.paragrafo__slide2__tablet');

    this.initEvents();
  }

  initEvents() {
    if (!this.inputCheck) return;
    this.inputCheck.addEventListener('click', () => this.toggleTheme());
  }

  toggleTheme() {
    const modo = this.inputCheck.checked ? 'dark' : 'light';
    this.body.setAttribute('data-bs-theme', modo);

    if (modo === 'dark') {
      if (this.imgGenova) this.imgGenova.src = '../assets/genova_branco.svg';
      if (this.imgCardCerebro) this.imgCardCerebro.src = '../assets/cerebro_branco.svg';
      if (this.imgCardCerebro2) this.imgCardCerebro2.src = '../assets/cerebro2_branco.svg';
      if (this.imgCardBot) this.imgCardBot.src = '../assets/bot_branco.svg';
      if (this.imgGenovaNavbar) this.imgGenovaNavbar.src = '../assets/genova_branco.svg';
      if (this.titulo) this.titulo.style.color = 'white';
      if (this.tituloSlideTablet) this.tituloSlideTablet.style.color = 'white';
      if (this.paragrafoSlideTablet) this.paragrafoSlideTablet.style.color = 'white';
    } else {
      if (this.imgGenova) this.imgGenova.src = '../assets/genova.svg';
      if (this.imgCardCerebro) this.imgCardCerebro.src = '../assets/cerebro.svg';
      if (this.imgCardCerebro2) this.imgCardCerebro2.src = '../assets/cerebro2.svg';
      if (this.imgCardBot) this.imgCardBot.src = '../assets/bot.svg';
      if (this.imgGenovaNavbar) this.imgGenovaNavbar.src = '../assets/genova.svg';
      if (this.titulo) this.titulo.style.color = 'black';
      if (this.tituloSlideTablet) this.tituloSlideTablet.style.color = 'black';
      if (this.paragrafoSlideTablet) this.paragrafoSlideTablet.style.color = 'black';
    }
  }
}

// Inicializa
document.addEventListener('DOMContentLoaded', () => new ThemeSwitcher());
