
// --- Variáveis Globais do Jogo ---
let dinheiro = 10000;
let agua = 100;
let sementes = 20; // Sementes genéricas para fins de plantio
let producaoLavoura = 0; // Produção POTENCIAL da cultura atual
let saudeLavoura = 100;
let pragas = []; // Array para armazenar as pragas ativas
let taxaSurtoPraga = 0.0000; // Chance base de surgimento de pragas (por frame)
let nivelMaquinas = 1; // Nível inicial das máquinas
let felicidadeCidade = 100; // Felicidade da cidade
let reputacaoCidade = 100; // Reputação do fazendeiro na cidade
let climaAtual = 'sol'; // Estado atual do clima
let timerClima = 0; // Temporizador para mudança de clima
let duracaoClima = 3000; // Duração de cada estado de clima (em frames)
let demandaCidade = {
    tipo: '',
    quantidade: 0,
    ativa: false
};
let timerDemanda = 0; // Temporizador para novas demandas da cidade
let duracaoDemanda = 4000; // Duração de cada demanda da cidade (em frames)
const nivelMaximoMaquinas = 3;

// --- Sistema de Culturas ---
const culturasInfo = {
    'Milho': {
        custoSemente: 10,
        producaoBase: 30, // Quanto produz em condições ideais
        valorVenda: 1.5, // Preço por unidade no mercado
        resistenciaPraga: 0.8, // 80% do dano normal da praga (0.8 = 20% menos dano)
        cor: [255, 255, 0], // Amarelo
        derivado: 'Farinha de Milho', // Novo: derivado
        custoDerivacao: { Milho: 20, Dinheiro: 30 } // Novo: custo para derivar
    },
    'Trigo': {
        custoSemente: 12,
        producaoBase: 25,
        valorVenda: 2.0,
        resistenciaPraga: 0.9,
        cor: [245, 222, 179], // Bege
        derivado: 'Pão Integral', // Novo: derivado
        custoDerivacao: { Trigo: 15, Dinheiro: 40 } // Novo: custo para derivar
    },
    'Soja': {
        custoSemente: 15,
        producaoBase: 20,
        valorVenda: 2.5,
        resistenciaPraga: 0.7,
        cor: [100, 150, 50], // Verde mais escuro
        derivado: 'Leite de Soja', // Novo: derivado
        custoDerivacao: { Soja: 25, Dinheiro: 35 } // Novo: custo para derivar
    }
};
let culturaPlantada = null; // Armazena o tipo de cultura plantada ('Milho', 'Trigo', 'Soja' ou null)
let progressoCrescimento = 0; // 0-100% de crescimento da cultura
const tempoCrescimentoMax = 1200; // Tempo em frames para a cultura crescer (aprox. 20 segundos)

// --- Silo e Venda de Grãos ---
let silo = {
    'Milho': 500,
    'Trigo': 0,
    'Soja': 0,
    'Farinha de Milho': 0, // Novo: Armazena derivados
    'Pão Integral': 0, // Novo: Armazena derivados
    'Leite de Soja': 50, // Novo: Armazena derivados
    capacidadeMax: 500 // Capacidade inicial do silo
};
// --- Itens da Loja ---
const lojaItens = {
    'Semente Milho': {
        custo: 5,
        acao: () => {
            sementes += 10; // Adiciona sementes genéricas
            console.log("Sementes de milho compradas! (Sistema usa sementes genéricas para plantar)");
            return true; // Ação bem-sucedida
        }
    },
    'Semente Trigo': {
        custo: 6,
        acao: () => {
            sementes += 10;
            console.log("Sementes de trigo compradas! (Sistema usa sementes genéricas para plantar)");
            return true;
        }
    },
    'Semente Soja': {
        custo: 7,
        acao: () => {
            sementes += 10;
            console.log("Sementes de soja compradas! (Sistema usa sementes genéricas para plantar)");
            return true;
        }
    },
    'Água (30L)': {
        custo: 10,
        acao: () => {
            agua += 30;
            return true;
        }
    },
    'Máquina Nível 2': {
        custo: 150,
        nivelRequisito: 1, // Requer máquina nível 1 (inicial)
        acao: () => {
            if (nivelMaquinas < 2) {
                nivelMaquinas = 2;
                console.log("Máquina Nível 2 adquirida!");
                return true;
            }
            return false; // Já possui ou não cumpre requisito
        }
    },
    'Máquina Nível 3': {
        custo: 400,
        nivelRequisito: 2, // Requer máquina nível 2
        acao: () => {
            if (nivelMaquinas < 3) {
                nivelMaquinas = 3;
                console.log("Máquina Nível 3 adquirida!");
                return true;
            }
            return false; // Já possui ou não cumpre requisito
        }
    },
    'Aumento Silo (+100 Cap.)': {
        custo: 100,
        acao: () => {
            silo.capacidadeMax += 100;
            console.log(`Capacidade do silo aumentada para ${silo.capacidadeMax}`);
            return true;
        }
    },
    'Pesticida': {
        custo: 50,
        acao: () => {
            if (pragas.length > 0) {
                pragas = []; // Remove todas as pragas
                saudeLavoura = min(100, saudeLavoura + 15); // Aumenta um pouco a saúde
                // **NOVA FUNCIONALIDADE: Pesticida diminui a taxa de surgimento de pragas temporariamente**
                taxaSurtoPraga = max(0.0005, taxaSurtoPraga * 0.5); // Reduz a taxa em 50%, com um mínimo
                console.log("Pesticida aplicado! Pragas eliminadas e taxa de surto reduzida.");
                return true;
            } else {
                console.log("Não há pragas para usar o pesticida!");
                return false; // Indica que a ação não foi efetiva (não gasta dinheiro)
            }
        }
    }
};

// --- Estados de Exibição de Telas ---
let showLoja = false; // Controla a exibição da loja
let showVenda = false; // Controla a exibição da tela de venda de grãos
let showEscolhaPlantio = false; // Novo estado para a tela de escolha de cultura
let showProducaoDerivados = false; // Novo estado para produção de derivados
let showGameOver = false; // Novo estado para Game Over
let showVictory = false; // Novo estado para Vitória

// **NOVA FUNCIONALIDADE: Mensagens da cidade**
let cidadeAjudaMensagens = []; // Armazena mensagens de ajuda da cidade
const duracaoMensagemAjuda = 180; // Duração da mensagem em frames (3 segundos)

// --- Assets (Substitua pelos seus próprios, ou remova se não for usar) ---
let imgLavoura; // Ex: loadImage('assets/lavoura.png');
let imgPragaPequena;
let imgPragaGrande;
let imgCidade;
let imgGotaChuva;
let imgMaquina;

// Variáveis para animação da máquina
let maquinaX = 120;
let maquinaDirecao = 1; // 1 para direita, -1 para esquerda
const maquinaVelocidade = 1;

let motivoDerrota = ""; // Variável global para armazenar o motivo do Game Over

// --- Sistema de Objetivos ---
const objetivos = {
    'dinheiroInicial': {
        descricao: 'Acumule R$500.',
        completo: false,
        verifica: () => dinheiro >= 500
    },
    'siloCheio': {
        descricao: 'Armazene um total de 300 unidades de grãos/derivados.',
        completo: false,
        verifica: () => {
            let totalSilo = 0;
            for (let tipoGrao in silo) {
                if (tipoGrao !== 'capacidadeMax') {
                    totalSilo += silo[tipoGrao];
                }
            }
            return totalSilo >= 300;
        }
    },
    'maquinaNivel3': {
        descricao: 'Adquira a Máquina Nível 3.',
        completo: false,
        verifica: () => nivelMaquinas === 3
    },
    'reputacaoExcelente': {
        descricao: 'Atinja 90% de reputação na cidade.',
        completo: false,
        verifica: () => reputacaoCidade >= 90
    },
    'felicidadeMaxima': {
        descricao: 'Atinja 90% de felicidade na cidade.',
        completo: false,
        verifica: () => felicidadeCidade >= 90
    },
    'producaoDerivados': {
        descricao: 'Produza 50 unidades de Farinha, Pão ou Leite.',
        completo: false,
        verifica: () => (silo['Farinha de Milho'] >= 50 || silo['Pão Integral'] >= 50 || silo['Leite de Soja'] >= 50)
    }
};

// --- Configurações do Canvas e Interface ---
const CANVAS_WIDTH = 1000; // Aumenta a largura para a barra lateral
const CANVAS_HEIGHT = 600;
const INTERFACE_START_X = 800; // Onde a barra lateral começa (depois do canvas de jogo)
const INTERFACE_WIDTH = CANVAS_WIDTH - INTERFACE_START_X; // Largura da barra lateral

// --- Variável para armazenar os botões interativos ---
let botoesAtivos = [];

function preload() {
    // Carregue suas imagens aqui!
    // Exemplo:
    // imgLavoura = loadImage('assets/lavoura.png');
    // imgPragaPequena = loadImage('assets/praga_pequena.png');
    // imgPragaGrande = loadImage('assets/praga_grande.png');
    // imgCidade = loadImage('assets/cidade.png');
    // imgGotaChuva = loadImage('assets/gota_chuva.png');
    // imgMaquina = loadImage('assets/maquina.png');
}

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    rectMode(CENTER); // Mantemos o rectMode(CENTER) para botões e alguns elementos
    textAlign(CENTER, CENTER); // Garante que o texto seja centralizado por padrão
    gerenciarClima(); // Inicia o sistema de clima
    gerenciarDemandasCidade(); // Inicia o sistema de demandas
}

function draw() {
    background(135, 206, 235); // Cor de fundo do céu

    // Limpa a lista de botões ativos a cada frame
    botoesAtivos = [];

    // Desenha o fundo da área de jogo principal
    push(); // Salva o estado atual do rectMode
    rectMode(CORNER); // Temporariamente muda para CORNER para o fundo
    fill(135, 206, 235);
    rect(0, 0, INTERFACE_START_X, CANVAS_HEIGHT); // Área de jogo vai de (0,0) até (INTERFACE_START_X, CANVAS_HEIGHT)
    pop(); // Restaura o rectMode(CENTER)

    // Desenha os elementos do jogo principal
    desenharClima();
    desenharClimaTexto();
    desenharLavoura();
    desenharCidade();
    desenharObjetivos(); // <--- AGORA CHAMADO AQUI! (ao lado da cidade)
    desenharPragas();
    desenharAvisos();
    desenharMensagensAjudaCidade();

    // Desenha a barra lateral da interface
    desenharInterfaceLateral();

    // **IMPORTANTE**: Chamar verificarDerrota ANTES de desenhar as telas modais
    // Isso garante que o Game Over seja acionado, mesmo se uma modal estiver aberta.
    verificarDerrota();
    verificarVitoria();

    // Desenha as telas modais sobre o jogo principal SE showGameOver/showVictory não forem true
    if (showGameOver) {
        desenharGameOver();
    } else if (showVictory) {
        desenharVictory();
    } else if (showLoja) {
        desenharLoja();
    } else if (showVenda) {
        desenharVenda();
    } else if (showEscolhaPlantio) {
        desenharEscolhaPlantio();
    } else if (showProducaoDerivados) {
        desenharProducaoDerivados();
    }

    // --- Lógica do Jogo (só roda se NENHUMA tela modal ou de fim de jogo estiver aberta) ---
    if (!showLoja && !showVenda && !showEscolhaPlantio && !showProducaoDerivados && !showGameOver && !showVictory) {
        gerenciarClima();
        gerenciarDemandasCidade();
        atualizarLavoura();
        atualizarCidade();
        criarPragas(); // Pragas só aparecem se tiver algo plantado (verificação interna)
        atualizarPragas(); // Reputação só abaixa se tiver algo plantado (verificação interna)
        ajudaMaquinas(); // Máquinas ajudam no combate/produção
        verificarObjetivos(); // Verifica o progresso dos objetivos

        // **NOVA FUNCIONALIDADE: A taxa de surto de pragas retorna ao normal gradualmente**
        if (taxaSurtoPraga < 0.003) {
            taxaSurtoPraga = min(0.003, taxaSurtoPraga + 0.000005);
        }
    }
}

/**
 * Cria e desenha um botão, adicionando-o à lista de botões ativos para detecção de clique.
 * As coordenadas X e Y representam o CENTRO do botão devido ao rectMode(CENTER) em setup().
 * @param {number} x Posição X do centro do botão.
 * @param {number} y Posição Y do centro do botão.
 * @param {number} w Largura do botão.
 * @param {number} h Altura do botão.
 * @param {string} text Texto a ser exibido no botão.
 * @param {function} acao Função a ser executada quando o botão é clicado.
 * @param {boolean} [ativo=true] Se o botão deve estar ativo para cliques (padrão: true).
 * @param {boolean} [podeComprar=true] Se o botão representa um item comprável e está disponível (afeta a cor).
 */
function criarBotao(x, y, w, h, textDisplay, acao, ativo = true, podeComprar = true) {
    let corBotao = (ativo && podeComprar) ? color(100, 150, 100) : color(70, 70, 70); // Cor verde/cinza
    if (!ativo) {
        corBotao = color(50, 50, 50); // Cor mais escura se inativo
    }

    fill(corBotao);
    rect(x, y, w, h, 5); // Desenha o retângulo do botão no centro

    fill(255);
    textSize(16);
    textStyle(BOLD);
    // **CORREÇÃO:** Passando apenas 3 argumentos (texto, x, y) para text()
    text(textDisplay, x, y);
    textStyle(NORMAL);

    if (ativo) {
        // Armazena as propriedades do botão para a detecção de clique.
        // As coordenadas x, y são o centro do botão.
        botoesAtivos.push({
            x: x,
            y: y,
            width: w,
            height: h,
            acao: acao
        });
    }
}

function mousePressed() {
    // Verifica se o clique ocorreu em algum dos botões ativos
    for (let i = botoesAtivos.length - 1; i >= 0; i--) {
        let btn = botoesAtivos[i];

        // Verifica se o mouse está dentro dos limites do botão.
        // Como o botão foi desenhado com rectMode(CENTER), o cálculo da área de clique
        // deve ser feito em relação ao centro (btn.x, btn.y) e sua largura/altura.
        if (mouseX > btn.x - btn.width / 2 &&
            mouseX < btn.x + btn.width / 2 &&
            mouseY > btn.y - btn.height / 2 &&
            mouseY < btn.y + btn.height / 2) {
            btn.acao(); // Executa a ação do botão
            return false; // Retorna false para evitar que o evento mousePressed se propague
        }
    }

    // Lógica para clicar nas pragas (se houver)
    if (!showLoja && !showVenda && !showEscolhaPlantio && !showProducaoDerivados && !showGameOver && !showVictory) {
        for (let i = pragas.length - 1; i >= 0; i--) {
            let praga = pragas[i];
            let d = dist(mouseX, mouseY, praga.x, praga.y);
            if (d < praga.tamanho / 2) {
                praga.saude -= 20; // Dano de clique
                if (praga.saude <= 0) {
                    pragas.splice(i, 1); // Remove a praga
                    reputacaoCidade = min(100, reputacaoCidade + 1); // Pequeno bônus de reputação
                    felicidadeCidade = min(100, felicidadeCidade + 0.5);
                }
                return false; // Processou o clique, pare por aqui
            }
        }
    }
}

// --- Funções de Desenho ---
function desenharClima() {
    push();
    rectMode(CORNER); // Para desenhar o overlay do clima a partir do canto
    if (climaAtual === 'chuva') {
        fill(100, 100, 255, 50);
        rect(0, 0, INTERFACE_START_X, height);
        for (let i = 0; i < 50; i++) {
            if (imgGotaChuva) {
                image(imgGotaChuva, random(0, INTERFACE_START_X), random(height), 10, 10);
            } else {
                fill(100, 100, 255, 150);
                ellipse(random(0, INTERFACE_START_X), random(height), 5, 5);
            }
        }
    } else if (climaAtual === 'seca') {
        fill(255, 165, 0, 30);
        rect(0, 0, INTERFACE_START_X, height);
    } else if (climaAtual === 'tempestade') {
        fill(50, 50, 50, 80);
        rect(0, 0, INTERFACE_START_X, height);
    }
    pop(); // Restaura o rectMode(CENTER)
}

function desenharClimaTexto() {
    push();
    rectMode(CENTER);
    fill(0, 0, 0, 150); // Fundo semi-transparente para o texto do clima
    let textWidthVal = textWidth(`Clima: ${climaAtual.toUpperCase()}`) + 20; // Calcula a largura do texto + padding
    rect(INTERFACE_START_X / 2, 30, textWidthVal, 30, 5); // Fundo para o texto do clima
    fill(255);
    textSize(18);
    // CORREÇÃO: Usar INTERFACE_START_X / 2 em vez de INTERFACE_START_2
    text(`Clima: ${climaAtual.toUpperCase()}`, INTERFACE_START_X / 2, 30); // LINHA 264 - CORRIGIDA
    pop();
}

function desenharLavoura() {
    push();
    rectMode(CORNER); // Desenha o campo a partir do canto
    fill(100, 150, 50);
    rect(50, 250, 700, 300); // Fundo do campo
    pop(); // Restaura o rectMode(CENTER)

    // A cultura e o texto são desenhados com rectMode(CENTER) porque pop() foi chamado.
    if (culturaPlantada) {
        let culturaCor = culturasInfo[culturaPlantada].cor;
        fill(culturaCor[0], culturaCor[1], culturaCor[2]);
        let alturaCultura = map(progressoCrescimento, 0, 100, 0, 80);
        // Ajuste no Y da cultura para desenhar a partir do centro
        rect(50 + 700 / 2, 550 - alturaCultura / 2, 600, alturaCultura); // Representação da cultura

        fill(0);
        textSize(16);
        // Ajuste no Y para ficar mais próximo da lavoura
        text(`${culturaPlantada} (${progressoCrescimento.toFixed(0)}%)`, INTERFACE_START_X / 2, 270);
    }

    fill(0);
    textSize(18);
    // Ajuste no Y para ficar dentro/próximo da área da lavoura
    text(`Saúde: ${saudeLavoura.toFixed(0)}%`, INTERFACE_START_X / 2, 300);
    text(`Produção Potencial: ${producaoLavoura.toFixed(0)} unidades`, INTERFACE_START_X / 2, 325);


    // Desenha a máquina na lavoura se houver
    if (nivelMaquinas > 1) {
        maquinaX += maquinaVelocidade * maquinaDirecao;
        if (maquinaX > INTERFACE_START_X - 100 || maquinaX < 100) {
            maquinaDirecao *= -1;
        }
        fill(100, 100, 100);
        rect(maquinaX, 480, 50, 30); // Desenha o retângulo da máquina com rectMode(CENTER)
        fill(0);
        textSize(12);
        text(`Máquina Nv. ${nivelMaquinas}`, maquinaX, 520); // Texto da máquina centralizado
    }
}

function desenharCidade() {
    push();
    rectMode(CORNER); // Desenha a cidade a partir do canto
    fill(150);
    rect(50, 50, 250, 150); // Quadro da cidade
    pop();

    fill(0);
    textSize(16);
    // Ajuste no Y para ficar dentro do quadro da cidade
    text(`Felicidade: ${felicidadeCidade.toFixed(0)}%`, 175, 90);
    text(`Reputação: ${reputacaoCidade.toFixed(0)}%`, 175, 115);

    if (demandaCidade.ativa) {
        fill(255, 200, 0);
        text(`Cidade precisa de: ${demandaCidade.tipo} (${demandaCidade.quantidade})`, 175, 140);
    }
}

function desenharPragas() {
    // Pragas são desenhadas com ellipse, então não são afetadas por rectMode.
    // As coordenadas x,y para ellipse são sempre o centro.
    for (let praga of pragas) {
        let corPraga = praga.tipo === 'pequena' ? color(255, 100, 100) : color(200, 0, 0);
        fill(corPraga);
        ellipse(praga.x, praga.y, praga.tamanho, praga.tamanho);
        fill(255);
        textSize(10);
        text(praga.saude, praga.x, praga.y + praga.tamanho / 2 + 5);
    }
}

function desenharInterfaceLateral() {
    push();
    rectMode(CORNER); // Desenha a barra lateral a partir do canto
    fill(70, 80, 90);
    rect(INTERFACE_START_X, 0, INTERFACE_WIDTH, CANVAS_HEIGHT);
    pop(); // Restaura rectMode(CENTER)

    // Informações financeiras e da máquina (usar CENTER para o texto centralizado)
    fill(255);
    textSize(20);
    text(`Dinheiro: R$${dinheiro.toFixed(2)}`, INTERFACE_START_X + INTERFACE_WIDTH / 2, 30);
    text(`Água: ${agua.toFixed(0)}L`, INTERFACE_START_X + INTERFACE_WIDTH / 2, 55);
    text(`Máquina Nível: ${nivelMaquinas}`, INTERFACE_START_X + INTERFACE_WIDTH / 2, 80);

    // Silo Info na barra lateral
    let siloYStart = 120;
    fill(255);
    textSize(16);
    text(`Silo (${silo.capacidadeMax} Cap.)`, INTERFACE_START_X + INTERFACE_WIDTH / 2, siloYStart);
    let yOffsetSilo = siloYStart + 20;
    for (let tipoGrao in silo) {
        if (tipoGrao !== 'capacidadeMax') {
            text(`${tipoGrao}: ${silo[tipoGrao]}`, INTERFACE_START_X + INTERFACE_WIDTH / 2, yOffsetSilo);
            yOffsetSilo += 20;
        }
    }

    // Botões de Ação na barra lateral (coordenadas para o CENTRO dos botões)
    let buttonX = INTERFACE_START_X + (INTERFACE_WIDTH / 2); // Centraliza os botões na lateral
    let buttonYStart = yOffsetSilo + 30; // Começa abaixo do silo info
    const buttonSpacing = 50;
    const btnWidth = 150;
    const btnHeight = 40;

    // Ações dos botões da interface lateral
    criarBotao(buttonX, buttonYStart, btnWidth, btnHeight, "Plantar", () => acaoPlantar());
    criarBotao(buttonX, buttonYStart + buttonSpacing, btnWidth, btnHeight, "Regar", () => acaoRegar());
    criarBotao(buttonX, buttonYStart + (buttonSpacing * 2), btnWidth, btnHeight, "Pedir Ajuda", () => acaoPedirAjuda());
    criarBotao(buttonX, buttonYStart + (buttonSpacing * 3), btnWidth, btnHeight, showLoja ? "Fechar Loja" : "Abrir Loja", () => {
        showLoja = !showLoja;
        showVenda = false;
        showEscolhaPlantio = false;
        showProducaoDerivados = false;
    });
    criarBotao(buttonX, buttonYStart + (buttonSpacing * 4), btnWidth, btnHeight, showVenda ? "Fechar Venda" : "Vender Grãos", () => {
        showVenda = !showVenda;
        showLoja = false;
        showEscolhaPlantio = false;
        showProducaoDerivados = false;
    });
    criarBotao(buttonX, buttonYStart + (buttonSpacing * 5), btnWidth, btnHeight, showProducaoDerivados ? "Fechar Produção" : "Produzir Derivados", () => {
        showProducaoDerivados = !showProducaoDerivados;
        showLoja = false;
        showVenda = false;
        showEscolhaPlantio = false;
    });
}

function desenharLoja() {
    push();
    rectMode(CENTER); // Usa CENTER para o modal em si

    let modalX = CANVAS_WIDTH / 2 - 100; // Ajuste o X para centralizar melhor o modal na área de jogo
    let modalY = CANVAS_HEIGHT / 2;
    let modalWidth = INTERFACE_START_X - 100; // Largura do modal
    let modalHeight = CANVAS_HEIGHT - 100; // Altura do modal

    fill(50, 50, 100, 220); // Fundo semi-transparente
    rect(modalX, modalY, modalWidth, modalHeight, 20); // Janela da loja

    fill(255);
    textSize(30);
    text("Loja de Equipamentos Agrícolas", modalX, modalY - modalHeight / 2 + 30); // Título centralizado

    let itemY = modalY - modalHeight / 2 + 80; // Posição Y inicial ajustada (centro do modal - metade da altura + offset)
    let itemSpacing = 55;
    const itemHeight = 45;
    const itemWidth = 320;
    let itemX = modalX; // Centraliza os itens no modal

    for (let itemKey in lojaItens) {
        let item = lojaItens[itemKey];
        let podeComprar = dinheiro >= item.custo;
        let jaPossui = (itemKey.startsWith('Máquina') && parseInt(itemKey.split(' ')[2]) <= nivelMaquinas);
        let requisitoNivelAtendido = (!item.nivelRequisito || nivelMaquinas >= item.nivelRequisito);

        let ativo = podeComprar && requisitoNivelAtendido && !jaPossui;
        criarBotao(itemX, itemY, itemWidth, itemHeight, `${itemKey} - R$${item.custo}`, () => {
            if (ativo) {
                if (dinheiro >= item.custo) {
                    dinheiro -= item.custo;
                    item.acao();
                } else {
                    console.log("Dinheiro insuficiente!");
                }
            } else {
                console.log("Não é possível comprar este item no momento.");
            }
        }, ativo, podeComprar);

        fill(255);
        textSize(12);
        if (jaPossui && itemKey.startsWith('Máquina')) {
            text(`(Adquirida)`, itemX, itemY + itemHeight / 2 + 10);
        } else if (item.nivelRequisito && nivelMaquinas < item.nivelRequisito) {
            text(`(Requer Nv. ${item.nivelRequisito})`, itemX, itemY + itemHeight / 2 + 10);
        } else if (!podeComprar) {
            text(`(Dinheiro Insuficiente)`, itemX, itemY + itemHeight / 2 + 10);
        }

        itemY += itemSpacing;
    }
    pop(); // Restaura rectMode(CENTER)
}

function desenharVenda() {
    push();
    rectMode(CENTER);

    let modalX = CANVAS_WIDTH / 2 - 100;
    let modalY = CANVAS_HEIGHT / 2;
    let modalWidth = INTERFACE_START_X - 100;
    let modalHeight = CANVAS_HEIGHT - 100;

    fill(50, 100, 50, 220);
    rect(modalX, modalY, modalWidth, modalHeight, 20);

    fill(255);
    textSize(30);
    text("Venda de Grãos e Derivados", modalX, modalY - modalHeight / 2 + 30);

    let itemY = modalY - modalHeight / 2 + 100;
    let itemSpacing = 60;
    let itemWidth = 300;
    let itemHeight = 50;
    let itemX = modalX;

    let multiplicadorPreco = 1.0;
    let avisoPreco = "";
    if (reputacaoCidade < 30) {
        multiplicadorPreco = 0.5;
        fill(255, 100, 100);
        textSize(18);
        avisoPreco = "Reputação muito baixa! Preço de venda reduzido em 50%!";
    } else if (reputacaoCidade < 60) {
        multiplicadorPreco = 0.75;
        fill(255, 200, 0);
        textSize(18);
        avisoPreco = "Reputação baixa! Preço de venda reduzido em 25%!";
    }
    if (avisoPreco !== "") {
        text(avisoPreco, modalX, modalY - modalHeight / 2 + 65);
    }

    for (let tipoGrao in silo) {
        if (tipoGrao !== 'capacidadeMax') {
            // Define o valor de venda para derivados aqui
            let infoItem = culturasInfo[tipoGrao];
            let valorVendaCalculado;
            if (tipoGrao === 'Farinha de Milho') valorVendaCalculado = 9.0;
            else if (tipoGrao === 'Pão Integral') valorVendaCalculado = 7.5;
            else if (tipoGrao === 'Leite de Soja') valorVendaCalculado = 10.5;
            else valorVendaCalculado = infoItem ? infoItem.valorVenda : 0; // Se não for um dos derivados, usa o valor da cultura

            let podeVender = silo[tipoGrao] > 0;
            let precoAtual = valorVendaCalculado * multiplicadorPreco;

            criarBotao(itemX, itemY, itemWidth, itemHeight, `${tipoGrao}: ${silo[tipoGrao]} unidades - R$${precoAtual.toFixed(2)}/un. (Vender Tudo)`, () => {
                // Chama a função para vender
                // LINHA 422 - A função venderDerivados agora está definida e acessível
                venderDerivados(tipoGrao, precoAtual);
            }, podeVender);

            itemY += itemSpacing;
        }
    }
    pop();
}

function desenharEscolhaPlantio() {
    push();
    rectMode(CENTER);

    let modalX = CANVAS_WIDTH / 2 - 100;
    let modalY = CANVAS_HEIGHT / 2;
    let modalWidth = 400;
    let modalHeight = 300;

    fill(50, 50, 100, 220);
    rect(modalX, modalY, modalWidth, modalHeight, 20);
    fill(255);
    textSize(20);
    text("Escolha a Cultura para Plantar:", modalX, modalY - modalHeight / 2 + 30);

    let yBtn = modalY - modalHeight / 2 + 80;
    const btnH = 40;
    const btnW = 200;
    const btnX = modalX;

    for (let culturaTipo in culturasInfo) {
        let info = culturasInfo[culturaTipo];
        let podePlantar = dinheiro >= info.custoSemente && sementes > 0;

        criarBotao(btnX, yBtn, btnW, btnH, `${culturaTipo} (R$${info.custoSemente})`, () => {
            if (podePlantar) {
                dinheiro -= info.custoSemente;
                sementes--;
                culturaPlantada = culturaTipo;
                progressoCrescimento = 0;
                saudeLavoura = 100;
                producaoLavoura = info.producaoBase;
                pragas = [];
                showEscolhaPlantio = false;
                console.log(`${culturaTipo} plantado com sucesso!`);
            } else {
                console.log("Recursos insuficientes para plantar esta cultura.");
            }
        }, podePlantar);

        yBtn += btnH + 10;
    }
    criarBotao(btnX, yBtn + 20, 150, 40, "Cancelar", () => showEscolhaPlantio = false);
    pop();
}

function desenharProducaoDerivados() {
    push();
    rectMode(CENTER);

    let modalX = CANVAS_WIDTH / 2 - 100;
    let modalY = CANVAS_HEIGHT / 2;
    let modalWidth = INTERFACE_START_X - 100;
    let modalHeight = CANVAS_HEIGHT - 100;

    fill(100, 50, 100, 220);
    rect(modalX, modalY, modalWidth, modalHeight, 20);

    fill(255);
    textSize(30);
    text("Produzir Derivados (Na Cidade)", modalX, modalY - modalHeight / 2 + 30);

    let itemY = modalY - modalHeight / 2 + 100;
    let itemSpacing = 60;
    let itemWidth = 350;
    let itemHeight = 50;
    let itemX = modalX;

    for (let culturaTipo in culturasInfo) {
        let info = culturasInfo[culturaTipo];
        if (info.derivado) {
            let graoNecessario = culturaTipo;
            let qtdGraoNecessario = info.custoDerivacao[graoNecessario];
            let dinheiroNecessario = info.custoDerivacao.Dinheiro;

            let podeProduzir = silo[graoNecessario] >= qtdGraoNecessario && dinheiro >= dinheiroNecessario;
            let capacidadeSiloOk = (Object.values(silo).reduce((sum, val) => typeof val === 'number' && val !== silo.capacidadeMax ? sum + val : sum, 0) + 1) <= silo.capacidadeMax;

            criarBotao(itemX, itemY, itemWidth, itemHeight, `Produzir ${info.derivado} (Custa ${qtdGraoNecessario} ${graoNecessario}, R$${dinheiroNecessario})`, () => {
                // Chama a função para produzir derivados
                produzirDerivados(graoNecessario, qtdGraoNecessario, dinheiroNecessario, info.derivado);
            }, podeProduzir && capacidadeSiloOk, podeProduzir);

            fill(255);
            textSize(12);
            if (!podeProduzir) {
                let textoFalta = "";
                if (silo[graoNecessario] < qtdGraoNecessario) {
                    textoFalta += `Precisa de ${qtdGraoNecessario - silo[graoNecessario]} ${graoNecessario} a mais.`;
                }
                if (dinheiro < dinheiroNecessario) {
                    if (textoFalta !== "") textoFalta += " e ";
                    textoFalta += `Precisa de R$${(dinheiroNecessario - dinheiro).toFixed(2)} a mais.`;
                }
                text(textoFalta, itemX, itemY + itemHeight / 2 + 10);
            } else if (!capacidadeSiloOk) {
                text(`Silo Cheio!`, itemX, itemY + itemHeight / 2 + 10);
            }

            itemY += itemSpacing;
        }
    }
    criarBotao(itemX, itemY + 20, 150, 40, "Cancelar", () => showProducaoDerivados = false);
    pop();
}

function desenharAvisos() {
    textSize(20);
    fill(255, 255, 0); // Amarelo
    if (climaAtual === 'seca') {
        text("ALERTA: Seca Intensa! Regue sua lavoura!", INTERFACE_START_X / 2, 550);
    } else if (climaAtual === 'tempestade') {
        text("TEMPESTADE! A lavoura está em risco!", INTERFACE_START_X / 2, 550);
    } else if (saudeLavoura < 40 && saudeLavoura > 0 && culturaPlantada) {
        text("Saúde da lavoura baixa! Cuidado!", INTERFACE_START_X / 2, 580);
    } else if (saudeLavoura <= 0 && culturaPlantada) {
        text("LAVOURA MORTA! Game Over.", INTERFACE_START_X / 2, 580);
    }
    // As mensagens de objetivos concluídos agora são adicionadas via adicionarMensagemAjudaCidade
}

function desenharMensagensAjudaCidade() {
    push();
    rectMode(CENTER); // As mensagens podem ser desenhadas no centro para alinhamento mais fácil

    for (let i = cidadeAjudaMensagens.length - 1; i >= 0; i--) {
        let msg = cidadeAjudaMensagens[i];
        let msgX = INTERFACE_START_X / 2;
        let msgY = CANVAS_HEIGHT - 80 - (i * 30); // Para que apareçam em cima um do outro

        fill(0, 150, 0, 200); // Fundo verde para a mensagem
        rect(msgX, msgY, 300, 25, 5); // Retângulo para a mensagem (centro)

        fill(255);
        textSize(14);
        text(msg.texto, msgX, msgY); // Texto da mensagem (centro)

        msg.timer--;
        if (msg.timer <= 0) {
            cidadeAjudaMensagens.splice(i, 1);
        }
    }
    pop();
}

function desenharObjetivos() {
    push();
    rectMode(CORNER); // Mudança para CORNER para facilitar o posicionamento relativo

    // Coordenadas ajustadas para ficar ao lado da cidade e acima do campo
    const objetivosX = 320; // X inicial do quadro de objetivos (logo após o quadro da cidade)
    const objetivosY = 50;  // Y inicial do quadro de objetivos (mesmo nível da cidade)

    const objetivosPanelWidth = 430; // Largura do painel reduzida
    const objetivosPanelHeight = 190; // Altura do painel ajustada

    fill(0, 0, 0, 180); // Fundo semi-transparente
    rect(objetivosX, objetivosY, objetivosPanelWidth, objetivosPanelHeight, 10);

    fill(255);
    textSize(18);
    textStyle(BOLD);
    textAlign(LEFT, TOP); // Alinha o título à esquerda e no topo
    text("Objetivos:", objetivosX + 10, objetivosY + 10); // Título com padding
    textStyle(NORMAL);

    let yOffset = objetivosY + 40; // Início do texto dos objetivos
    let xText = objetivosX + 10; // Posição X para o texto dos objetivos

    for (let key in objetivos) {
        let objetivo = objetivos[key];
        fill(objetivo.completo ? color(150, 255, 150) : color(255)); // Verde se completo, branco se não
        textSize(14);
        textAlign(LEFT, TOP); // Alinha o texto à esquerda e no topo do espaço
        text(objetivo.descricao, xText, yOffset); // Posição do texto
        yOffset += 25; // Espaçamento entre objetivos ligeiramente maior
    }
    pop();
}


function desenharGameOver() {
    push();
    rectMode(CENTER);

    let modalX = CANVAS_WIDTH / 2 - 100;
    let modalY = CANVAS_HEIGHT / 2;

    fill(0, 0, 0, 200);
    rect(modalX, modalY, 500, 300, 20);
    fill(255, 0, 0);
    textSize(50);
    text("GAME OVER", modalX, modalY - 80);
    textSize(20);
    fill(255);
    text(motivoDerrota, modalX, modalY - 20); // Exibe o motivo
    criarBotao(modalX, modalY + 80, 150, 50, "Reiniciar", () => reiniciarJogo());
    pop();
}

function desenharVictory() {
    push();
    rectMode(CENTER);

    let modalX = CANVAS_WIDTH / 2 - 100;
    let modalY = CANVAS_HEIGHT / 2;

    fill(0, 150, 0, 200);
    rect(modalX, modalY, 500, 300, 20);
    fill(255, 255, 0);
    textSize(50);
    text("VITÓRIA!", modalX, modalY - 80);
    textSize(20);
    fill(255);
    text("Você é o maior fazendeiro da região!", modalX, modalY - 20);
    // Estes ellipses e rects estão sendo desenhados com rectMode(CENTER)
    fill(255, 100, 100, 150);
    ellipse(random(modalX - 200, modalX + 200), random(modalY - 120, modalY + 120), 20, 20);
    fill(100, 255, 100, 150);
    rect(random(modalX - 200, modalX + 200), random(modalY - 120, modalY + 120), 15, 15);

    criarBotao(modalX, modalY + 80, 150, 50, "Reiniciar", () => reiniciarJogo());
    pop();
}

// --- Funções de Ação do Jogador ---
function acaoPlantar() {
    if (!culturaPlantada) {
        showEscolhaPlantio = true;
        showLoja = false;
        showVenda = false;
        showProducaoDerivados = false;
    } else {
        console.log("Já existe uma cultura plantada. Colha antes de plantar novamente!");
        adicionarMensagemAjudaCidade("Você já tem uma lavoura plantada! Colha-a primeiro!");
    }
}

function acaoRegar() {
    const custoAgua = 5 - (nivelMaquinas * 0.5);
    if (culturaPlantada && agua >= custoAgua) {
        agua -= custoAgua;
        saudeLavoura = min(100, saudeLavoura + 10);
        console.log("Lavoura regada!");
        adicionarMensagemAjudaCidade("Lavoura regada! Saúde aumentou!");
    } else if (!culturaPlantada) {
        console.log("Não há nada plantado para regar!");
        adicionarMensagemAjudaCidade("Não há nada plantado para regar!");
    } else {
        console.log("Água insuficiente para regar!");
        adicionarMensagemAjudaCidade("Você precisa de mais água para regar!");
    }
}

function acaoPedirAjuda() {
    let mensagemAjuda = "";
    let beneficioMultiplicador = 1;

    if (reputacaoCidade < 20) {
        mensagemAjuda = "A cidade oferece ajuda com relutância, dadas as circunstâncias...";
        beneficioMultiplicador = 0.4;
    } else if (reputacaoCidade < 50) {
        mensagemAjuda = "A cidade estende a mão amiga.";
        beneficioMultiplicador = 0.7;
    } else {
        mensagemAjuda = "A cidade está feliz em ajudar um bom fazendeiro!";
    }

    let tipoAjuda = floor(random(3));
    let mensagemEspecifica = "";
    if (tipoAjuda === 0) {
        let valorAjuda = (30 + (reputacaoCidade / 3)) * beneficioMultiplicador;
        dinheiro += valorAjuda;
        mensagemEspecifica = `A cidade doou R$${valorAjuda.toFixed(2)}!`;
    } else if (tipoAjuda === 1) {
        let valorAjuda = (30 * beneficioMultiplicador);
        agua = min(100, agua + valorAjuda);
        mensagemEspecifica = `A cidade doou ${valorAjuda.toFixed(0)}L de água!`;
    } else {
        if (pragas.length > 0) {
            let numPragasRemover = max(1, floor(pragas.length * 0.3 * beneficioMultiplicador));
            for (let i = 0; i < numPragasRemover; i++) {
                if (pragas.length > 0) pragas.splice(floor(random(pragas.length)), 1);
            }
            saudeLavoura = min(100, saudeLavoura + (15 * beneficioMultiplicador));
            mensagemEspecifica = "A cidade enviou ajuda para combater pragas!";
        } else {
            mensagemEspecifica = "A cidade está pronta para ajudar, mas não há pragas ativas!";
        }
    }
    cidadeAjudaMensagens.push({ texto: mensagemEspecifica, timer: duracaoMensagemAjuda });
    console.log(mensagemAjuda + " " + mensagemEspecifica);

    felicidadeCidade = max(0, felicidadeCidade - 5);
    reputacaoCidade = max(0, reputacaoCidade - 2);
}

// --- Funções de Lógica do Jogo ---
function gerenciarClima() {
    timerClima++;
    if (timerClima > duracaoClima) {
        timerClima = 0;
        let chance = random(1);
        if (chance < 0.25) {
            climaAtual = 'chuva';
            duracaoClima = floor(random(1200, 3500));
        } else if (chance < 0.45) {
            climaAtual = 'seca';
            duracaoClima = floor(random(1800, 4500));
        } else if (chance < 0.55) {
            climaAtual = 'tempestade';
            duracaoClima = floor(random(1000, 2500));
        } else {
            climaAtual = 'sol';
            duracaoClima = floor(random(3500, 7000));
        }
    }

    if (climaAtual === 'chuva' && frameCount % 60 === 0) {
        agua = min(100, agua + 3);
        saudeLavoura = min(100, saudeLavoura + 0.5); // Aumento da saúde da lavoura
    } else if (climaAtual === 'seca' && frameCount % 60 === 0) {
        saudeLavoura = max(0, saudeLavoura - 0.4);
        agua = max(0, agua - 0.7);
    } else if (climaAtual === 'tempestade' && frameCount % 60 === 0) {
        saudeLavoura = max(0, saudeLavoura - 1);
        producaoLavoura = max(0, producaoLavoura - 0.5);
    }
}

function gerenciarDemandasCidade() {
    timerDemanda++;
    if (timerDemanda >= duracaoDemanda && !demandaCidade.ativa) {
        let tiposPossiveis = ['Milho', 'Trigo', 'Soja', 'Farinha de Milho', 'Pão Integral', 'Leite de Soja'];
        demandaCidade.tipo = random(tiposPossiveis);
        demandaCidade.quantidade = floor(random(10, 50));
        demandaCidade.ativa = true;
        timerDemanda = 0;
        console.log(`Nova demanda da cidade: ${demandaCidade.quantidade} de ${demandaCidade.tipo}`);
        adicionarMensagemAjudaCidade(`A cidade está precisando de ${demandaCidade.quantidade} de ${demandaCidade.tipo}! Ajude-os!`);
    }

    if (demandaCidade.ativa && silo[demandaCidade.tipo] >= demandaCidade.quantidade) {
        silo[demandaCidade.tipo] -= demandaCidade.quantidade;
        // O valor de venda dos derivados precisa ser definido aqui, pois eles não estão em culturasInfo
        let valorUnitarioDerivado = 0;
        if (demandaCidade.tipo === 'Farinha de Milho') valorUnitarioDerivado = 10.0;
        else if (demandaCidade.tipo === 'Pão Integral') valorUnitarioDerivado = 8.5;
        else if (demandaCidade.tipo === 'Leite de Soja') valorUnitarioDerivado = 9.5;
        else valorUnitarioDerivado = culturasInfo[demandaCidade.tipo]?.valorVenda || 3.0; // Valor padrão para grãos

        let valorBonus = demandaCidade.quantidade * (valorUnitarioDerivado * 2); // Bônus por demanda
        dinheiro += valorBonus;
        felicidadeCidade = min(100, felicidadeCidade + 15);
        reputacaoCidade = min(100, reputacaoCidade + 10);
        console.log(`Demanda da cidade por ${demandaCidade.tipo} cumprida! Você recebeu R$${valorBonus.toFixed(2)}.`);
        adicionarMensagemAjudaCidade(`Demanda da cidade por ${demandaCidade.tipo} cumprida! Ótimo trabalho!`);
        demandaCidade.ativa = false;
    } else if (demandaCidade.ativa && timerDemanda >= duracaoDemanda * 1.5) {
        felicidadeCidade = max(0, felicidadeCidade - 10);
        reputacaoCidade = max(0, reputacaoCidade - 5);
        console.log(`Demanda da cidade por ${demandaCidade.tipo} falhou. Reputação e felicidade caíram.`);
        adicionarMensagemAjudaCidade(`A demanda por ${demandaCidade.tipo} não foi atendida a tempo. A cidade ficou desapontada.`);
        demandaCidade.ativa = false;
    }
}

function atualizarLavoura() {
    if (culturaPlantada) {
        if (progressoCrescimento < 100) {
            progressoCrescimento += (100 / tempoCrescimentoMax);
        } else {
            if (frameCount % 180 === 0) { // Verifica a cada 3 segundos (180 frames)
                console.log("Lavoura pronta para colheita!");
                colherLavoura(); // Tenta colher automaticamente
            }
        }

        saudeLavoura = max(0, saudeLavoura - 0.05);

        if (saudeLavoura <= 0) {
            console.log("Sua lavoura morreu!");
            culturaPlantada = null;
            progressoCrescimento = 0;
            producaoLavoura = 0;
            pragas = [];
            adicionarMensagemAjudaCidade("Sua lavoura morreu! Lembre-se de cuidar bem dela.");
        }
    }
}

function colherLavoura() {
    if (culturaPlantada && progressoCrescimento >= 100) {
        let producaoFinal = producaoLavoura * (saudeLavoura / 100);
        producaoFinal *= (1 + (nivelMaquinas - 1) * 0.1);

        let tipoGrao = culturaPlantada;
        let espacoLivreSilo = silo.capacidadeMax - (Object.values(silo).reduce((sum, val) => typeof val === 'number' && val !== silo.capacidadeMax ? sum + val : sum, 0));

        if (espacoLivreSilo >= producaoFinal) {
            silo[tipoGrao] += floor(producaoFinal);
            dinheiro += floor(producaoFinal) * culturasInfo[tipoGrao].valorVenda * 0.5;
            console.log(`Colhido ${floor(producaoFinal)} de ${tipoGrao}. Dinheiro atual: ${dinheiro.toFixed(2)}`);
            adicionarMensagemAjudaCidade(`Colhidos ${floor(producaoFinal)} de ${tipoGrao}!`);
            culturaPlantada = null;
            progressoCrescimento = 0;
            saudeLavoura = 100;
            producaoLavoura = 0;
            pragas = [];
        } else if (espacoLivreSilo > 0) {
            silo[tipoGrao] += floor(espacoLivreSilo);
            dinheiro += floor(espacoLivreSilo) * culturasInfo[tipoGrao].valorVenda * 0.5;
            console.log(`Silo cheio! Colhido ${floor(espacoLivreSilo)} de ${tipoGrao}.`);
            adicionarMensagemAjudaCidade("Silo cheio! Colhemos o que coube. Venda ou aumente o silo!");
            culturaPlantada = null;
            progressoCrescimento = 0;
            saudeLavoura = 100;
            producaoLavoura = 0;
            pragas = [];
        } else {
            console.log("Silo completamente cheio! Não é possível colher nada.");
            adicionarMensagemAjudaCidade("Silo completamente cheio! Venda produtos ou aumente a capacidade do silo para colher.");
        }
    } else if (culturaPlantada && progressoCrescimento < 100) {
        console.log("A lavoura ainda não está pronta para colheita!");
        adicionarMensagemAjudaCidade("A lavoura ainda não está pronta para colheita!");
    } else {
        console.log("Não há lavoura para colher!");
        adicionarMensagemAjudaCidade("Não há lavoura para colher!");
    }
}

function atualizarCidade() {
    felicidadeCidade = max(0, felicidadeCidade - 0.005);
    reputacaoCidade = max(0, reputacaoCidade - 0.002);
}

function criarPragas() {
    if (culturaPlantada && random() < taxaSurtoPraga) {
        let tipo = random() < 0.7 ? 'pequena' : 'grande';
        let tamanho = tipo === 'pequena' ? 15 : 25;
        let saude = tipo === 'pequena' ? 30 : 60;
        let pragaX = random(60, INTERFACE_START_X - 60);
        let pragaY = random(260, 540);

        pragas.push({ x: pragaX, y: pragaY, tipo: tipo, tamanho: tamanho, saude: saude });
        console.log(`Uma praga ${tipo} surgiu!`);
        adicionarMensagemAjudaCidade(`Uma praga ${tipo} apareceu na lavoura! Clique para eliminá-la.`);
    }
}

function atualizarPragas() {
    if (culturaPlantada) {
        for (let praga of pragas) {
            let danoBase = praga.tipo === 'pequena' ? 0.05 : 0.15;
            let resistencia = culturasInfo[culturaPlantada].resistenciaPraga;
            saudeLavoura = max(0, saudeLavoura - (danoBase * resistencia));

            reputacaoCidade = max(0, reputacaoCidade - 0.001);
            felicidadeCidade = max(0, felicidadeCidade - 0.0005);
        }
    }
}

function ajudaMaquinas() {
    if (nivelMaquinas >= 2 && pragas.length > 0) {
        let chanceDano = (nivelMaquinas === 2) ? 0.005 : 0.01;
        let danoMaquina = (nivelMaquinas === 2) ? 5 : 10;

        if (random() < chanceDano) {
            let pragaAlvo = random(pragas);
            if (pragaAlvo) {
                pragaAlvo.saude -= danoMaquina;
                if (pragaAlvo.saude <= 0) {
                    let index = pragas.indexOf(pragaAlvo);
                    if (index > -1) {
                        pragas.splice(index, 1);
                        reputacaoCidade = min(100, reputacaoCidade + 0.5);
                        felicidadeCidade = min(100, felicidadeCidade + 0.2);
                    }
                }
            }
        }
    }
}

function adicionarMensagemAjudaCidade(texto) {
    // Evita adicionar mensagens duplicadas que já estão na tela
    if (cidadeAjudaMensagens.length > 0 && cidadeAjudaMensagens[cidadeAjudaMensagens.length - 1].texto === texto) {
        return;
    }
    cidadeAjudaMensagens.push({ texto: texto, timer: duracaoMensagemAjuda });
    // Limita o número de mensagens na tela
    while (cidadeAjudaMensagens.length > 3) {
        cidadeAjudaMensagens.shift(); // Remove a mensagem mais antiga
    }
}

function verificarObjetivos() {
    for (let key in objetivos) {
        let objetivo = objetivos[key];
        if (!objetivo.completo && objetivo.verifica()) {
            objetivo.completo = true;
            console.log(`Objetivo "${objetivo.descricao}" COMPLETO!`);
            // Adiciona a mensagem visual de objetivo concluído
            adicionarMensagemAjudaCidade(`✅ Objetivo Concluído: ${objetivo.descricao.split('.')[0]}!`);
        }
    }
}

function verificarDerrota() {
    if (dinheiro < -50) {
        motivoDerrota = "Sua fazenda faliu!";
        showGameOver = true;
        noLoop();
    } else if (culturaPlantada && saudeLavoura <= 0) {
        motivoDerrota = "Sua lavoura morreu completamente!";
        showGameOver = true;
        noLoop();
    } else if (felicidadeCidade <= 0) {
        motivoDerrota = "A cidade perdeu a esperança na sua fazenda!";
        showGameOver = true;
        noLoop();
    }
}

function verificarVitoria() {
    let todosCompletos = true;
    for (let key in objetivos) {
        if (!objetivos[key].completo) {
            todosCompletos = false;
            break;
        }
    }
    if (todosCompletos) {
        showVictory = true;
        noLoop(); // Para o loop do draw
    }
}

function reiniciarJogo() {
    // Reseta todas as variáveis para os valores iniciais
    dinheiro = 200;
    agua = 100;
    sementes = 20;
    producaoLavoura = 0;
    saudeLavoura = 100;
    pragas = [];
    taxaSurtoPraga = 0.003;
    nivelMaquinas = 1;
    felicidadeCidade = 60;
    reputacaoCidade = 30;
    climaAtual = 'sol';
    timerClima = 0;
    duracaoClima = 3000;
    demandaCidade = {
        tipo: '',
        quantidade: 0,
        ativa: false
    };
    timerDemanda = 0;
    duracaoDemanda = 4000;

    culturaPlantada = null;
    progressoCrescimento = 0;

    silo = {
        'Milho': 0,
        'Trigo': 0,
        'Soja': 0,
        'Farinha de Milho': 0,
        'Pão Integral': 0,
        'Leite de Soja': 0,
        capacidadeMax: 500
    };

    cidadeAjudaMensagens = [];
    maquinaX = 120;
    maquinaDirecao = 1;

    motivoDerrota = ""; // Reseta o motivo da derrota

    // Reseta o estado dos objetivos
    for (let key in objetivos) {
        objetivos[key].completo = false;
    }

    // Reseta os estados das telas
    showLoja = false;
    showVenda = false;
    showEscolhaPlantio = false;
    showProducaoDerivados = false;
    showGameOver = false;
    showVictory = false;

    loop(); // Reinicia o loop do draw
}

/**
 * Função para produzir derivados.
 * @param {string} graoNecessario Tipo de grão necessário para a produção.
 * @param {number} qtdGraoNecessario Quantidade de grão necessária.
 * @param {number} dinheiroNecessario Quantidade de dinheiro necessária.
 * @param {string} derivadoProduzido Nome do derivado que será produzido.
 */
function produzirDerivados(graoNecessario, qtdGraoNecessario, dinheiroNecessario, derivadoProduzido) {
    let capacidadeSiloOk = (Object.values(silo).reduce((sum, val) => typeof val === 'number' && val !== silo.capacidadeMax ? sum + val : sum, 0) + 1) <= silo.capacidadeMax;

    if (silo[graoNecessario] >= qtdGraoNecessario && dinheiro >= dinheiroNecessario && capacidadeSiloOk) {
        silo[graoNecessario] -= qtdGraoNecessario;
        dinheiro -= dinheiroNecessario;
        silo[derivadoProduzido]++;
        felicidadeCidade = min(100, felicidadeCidade + 10);
        reputacaoCidade = min(100, reputacaoCidade + 5);
        console.log(`1 unidade de ${derivadoProduzido} produzida!`);
        adicionarMensagemAjudaCidade(`1 unidade de ${derivadoProduzido} produzida!`);
    } else {
        let msgFalta = "Recursos insuficientes: ";
        if (silo[graoNecessario] < qtdGraoNecessario) msgFalta += `${qtdGraoNecessario - silo[graoNecessario]} ${graoNecessario} `;
        if (dinheiro < dinheiroNecessario) msgFalta += `R$${(dinheiroNecessario - dinheiro).toFixed(2)} `;
        if (!capacidadeSiloOk) msgFalta = "Silo cheio! Aumente a capacidade ou venda produtos.";
        console.log(msgFalta);
        adicionarMensagemAjudaCidade(msgFalta);
    }
}

/**
 * Função para vender grãos ou derivados.
 * @param {string} tipoItem O tipo de item a ser vendido (ex: 'Milho', 'Farinha de Milho').
 * @param {number} precoUnitario O preço por unidade do item.
 */
function venderDerivados(tipoItem, precoUnitario) {
    if (silo[tipoItem] > 0) {
        let valorTotal = silo[tipoItem] * precoUnitario;
        dinheiro += valorTotal;
        console.log(`Você vendeu ${silo[tipoItem]} de ${tipoItem} por R$${valorTotal.toFixed(2)}`);
        adicionarMensagemAjudaCidade(`Você vendeu ${silo[tipoItem]} de ${tipoItem} por R$${valorTotal.toFixed(2)}!`);
        silo[tipoItem] = 0;
        felicidadeCidade = min(100, felicidadeCidade + 5);
        reputacaoCidade = min(100, reputacaoCidade + 3);
    } else {
        console.log(`Não há ${tipoItem} para vender.`);
        adicionarMensagemAjudaCidade(`Não há ${tipoItem} para vender.`);
    }
}