/* ==========================================================================
   Master Eletrônica e Informática | site-v2
   1. Revelação de blocos ao entrar na tela
   2. Sombra da navegação
   3. Barra de WhatsApp do mobile
   4. Ano do rodapé
   5. Modo TV (?tv=1)
   Sem dependência externa. Tudo degrada sem quebrar.
   ========================================================================== */

(function () {
  'use strict';

  var raiz = document.documentElement;
  var corpo = document.body;
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------------
     1. Revelação
     ------------------------------------------------------------------------ */
  (function revelar() {
    var alvos = Array.prototype.slice.call(document.querySelectorAll('.rev'));
    if (!alvos.length) return;

    function mostrarTudo() {
      alvos.forEach(function (el) { el.classList.add('vis'); });
    }

    if (reduzido || !('IntersectionObserver' in window)) {
      mostrarTudo();
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var el = entrada.target;
        var atraso = parseInt(el.getAttribute('data-atraso') || '0', 10);
        el.style.transitionDelay = (atraso || 0) + 'ms';
        el.classList.add('vis');
        observador.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    alvos.forEach(function (el) { observador.observe(el); });

    /* Rede de segurança: passados 6s, mostra a página inteira, não só o que
       está na tela naquele instante. Se o observador falhar (ou a TV da loja
       nunca rolar a página), nenhum bloco fica invisível para sempre. */
    window.setTimeout(mostrarTudo, 6000);
  })();

  /* ---------------------------------------------------------------------------
     2. Sombra da navegação
     ------------------------------------------------------------------------ */
  (function navegacao() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var ticando = false;

    function avaliar() {
      ticando = false;
      if (window.scrollY > 8) nav.classList.add('solta');
      else nav.classList.remove('solta');
    }

    window.addEventListener('scroll', function () {
      if (ticando) return;
      ticando = true;
      window.requestAnimationFrame(avaliar);
    }, { passive: true });

    avaliar();
  })();

  /* ---------------------------------------------------------------------------
     3. Barra de WhatsApp do mobile
        Some enquanto houver outro botão de WhatsApp grande na tela: o CTA do
        hero (senão são três botões dourados iguais na primeira tela, e a barra
        ainda cobre os chips) e a seção de contato.
     ------------------------------------------------------------------------ */
  (function barraZap() {
    var barra = document.getElementById('barraZap');
    if (!barra || !('IntersectionObserver' in window)) return;

    var naTela = { contato: false, hero: false };

    function aplicar() {
      barra.classList.toggle('escondida', naTela.contato || naTela.hero);
    }

    function vigiar(alvo, chave, limite) {
      if (!alvo) return;
      var observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) { naTela[chave] = entrada.isIntersecting; });
        aplicar();
      }, { threshold: limite });
      observador.observe(alvo);
    }

    function naJanela(el) {
      if (!el) return false;
      var r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || 0);
    }

    var contato = document.getElementById('contato');
    var ctaHero = document.getElementById('ctaHero');

    /* primeira decisão na hora, sem transição: o observador só responde depois
       da primeira pintura, e a barra apareceria por um quadro antes de sumir */
    barra.style.transition = 'none';
    naTela.contato = naJanela(contato);
    naTela.hero = naJanela(ctaHero);
    aplicar();

    vigiar(contato, 'contato', 0.18);
    vigiar(ctaHero, 'hero', 0.6);

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { barra.style.transition = ''; });
    });
  })();

  /* ---------------------------------------------------------------------------
     4. Ano do rodapé
     ------------------------------------------------------------------------ */
  (function ano() {
    var el = document.getElementById('ano');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

  /* ---------------------------------------------------------------------------
     5. Modo TV (?tv=1)
        4s parado no topo, ~70s descendo a página, 3s no fim, volta ao topo.
        Roda do mouse, toque ou tecla pausam o ciclo por 30s.
     ------------------------------------------------------------------------ */
  (function modoTV() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('tv') !== '1') return;

    corpo.classList.add('tv');
    raiz.style.scrollBehavior = 'auto';

    var DESCIDA = 70000;
    var PAUSA_FIM = 3000;
    var SUBIDA = 1600;
    var PAUSA_TOPO = 4000;
    var PAUSA_HUMANA = 30000;

    var estado = 'esperando-topo';
    var marca = performance.now();
    var altoDaVolta = 0;
    var pausadoAte = 0;
    var recalibrar = false;

    function curso() {
      return Math.max(1, raiz.scrollHeight - window.innerHeight);
    }

    function irPara(y) {
      window.scrollTo(0, Math.round(y));
    }

    function interagiu() {
      pausadoAte = performance.now() + PAUSA_HUMANA;
      recalibrar = true;
    }

    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (evento) {
      window.addEventListener(evento, interagiu, { passive: true });
    });

    function tique(agora) {
      window.requestAnimationFrame(tique);
      if (agora < pausadoAte) return;

      if (recalibrar) {
        recalibrar = false;
        estado = 'descendo';
        marca = agora - (window.scrollY / curso()) * DESCIDA;
      }

      if (estado === 'descendo') {
        var p = (agora - marca) / DESCIDA;
        if (p >= 1) {
          irPara(curso());
          estado = 'esperando-fim';
          marca = agora;
        } else {
          irPara(p * curso());
        }
      } else if (estado === 'esperando-fim') {
        if (agora - marca >= PAUSA_FIM) {
          estado = 'subindo';
          marca = agora;
          altoDaVolta = window.scrollY;
        }
      } else if (estado === 'subindo') {
        var k = (agora - marca) / SUBIDA;
        if (k >= 1) {
          irPara(0);
          estado = 'esperando-topo';
          marca = agora;
        } else {
          var suave = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          irPara(altoDaVolta * (1 - suave));
        }
      } else if (estado === 'esperando-topo') {
        if (agora - marca >= PAUSA_TOPO) {
          estado = 'descendo';
          marca = agora;
        }
      }
    }

    window.requestAnimationFrame(tique);
  })();
})();
