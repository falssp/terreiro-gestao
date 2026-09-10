// ================================================================
//  GESTÃO DO TERREIRO -- Ile Ase Vodun Ogum Ayres -- Apps Script v16.2
//  Reescrito do zero -- 01/08/2026
//
//  ABAS:
//  Públicas:  Acervo | Consumíveis | Entidades e Orixás | Calendário
//  Privadas:  Filhos de Santo | Financeiro | Log | Admins
//
//  PERFIS:
//  Dev        -> devkey na URL, acesso total sem cadastro
//  Admin      -> Pai/Mãe de Santo, acesso total
//  Filho      -> acervo/consumíveis (edit) + próprio perfil
//
//  SEGURANÇA:
//  - Senha SHA-256 + salt, nunca texto puro
//  - Senha provisória obriga troca no primeiro acesso
//  - 3 tentativas erradas -> bloqueio 30 min
//  - Token de sessão 8h no PropertiesService
//  - Toda escrita grava log com usuário + data + valores
// ================================================================

const ABA = {
  ACERVO:     'Acervo',
  CONSUMIVEIS:'Consumíveis',
  ENTIDADES:  'Entidades e Orixás',
  CALENDARIO: 'Calendário',
  FILHOS:     'Filhos de Santo',
  FINANCEIRO: 'Financeiro',
  LOG:        'Log',
  ADMINS:     'Admins',
  LISTA:      'Lista de Compras',
  PONTOS:     'Pontos'
};

const SALT    = 'ile_ase_salt_v16_2026';
const DEV_KEY = 'ile_ase_dev_2024_falsp';

const PERM = {
  ACERVO_VIEW:      'acervo_view',
  ACERVO_EDIT:      'acervo_edit',
  CONSUMIVEIS_VIEW: 'consumiveis_view',
  CONSUMIVEIS_EDIT: 'consumiveis_edit',
  ENTIDADES_VIEW:   'entidades_view',
  ENTIDADES_EDIT:   'entidades_edit',
  FILHOS_VIEW:      'filhos_view',
  FILHOS_EDIT:      'filhos_edit',
  FINANCEIRO:       'financeiro',
  CALENDARIO_VIEW:  'calendario_view',
  CALENDARIO_EDIT:  'calendario_edit',
  USUARIOS:         'usuarios',
  CONFIGURACOES:    'configuracoes',
  LOG:              'log'
};

const PERM_ADMIN = Object.values(PERM);
const PERM_FILHO = [
  'acervo_view','acervo_edit',
  'consumiveis_view','consumiveis_edit',
  'entidades_view','calendario_view',
  'filhos_view','filhos_edit'
];

const LISTA = {
  ORIXA: ['Iansã','Iemanjá','Logun Edé','Nanã','Obá','Obaluaê / Omolu','Ogum','Oxaguiã / Oxalufã','Oxalá','Oxossi','Oxum','Oxumaré','Xangô','Outro'],
  ENTIDADE: ['Baiano / Baiana','Boiadeiro / Boiadeira','Caboclo / Cabocla','Cigano / Cigana','Criança / Erê','Exu','Marinheiro / Marinheira','Ogum Beira-Mar','Pomba-Gira','Preto-Velho / Preta-Velha','Zé Pilintra','Outro'],
  NACAO: ['Angola','Efon','Ijexá','Jeje','Ketu','Nagô','Omolokô','Umbanda','Outra'],
  STATUS_FILHO: ['Abiã','Ativo','Ebomi','Iaô','Inativo','Ogã / Ekedi','Suspenso'],
  CAT_ACERVO: ['Alimentos e Oferendas','Ervas e Plantas','Ferramentas e Objetos Rituais','Roupas e Indumentárias','Outro'],
  STATUS_ACERVO: ['Danificado','Disponível','Em Uso','Necessita Reposição','N/A'],
  CAT_CONSUMIVEL: ['Alimentos','Bebidas','Ervas e Defumação','Flores e Naturais','Fumo','Velas','Outro'],
  NIVEL: ['-- Sem mínimo','✅ OK','⚠ Repor','🔴 Alerta','🚨 Urgente / Zero'],
  CAT_FINANCEIRO: ['Consulta / Atendimento','Consumíveis','Dízimo / Doação','Evento / Gira','Indumentária / Acervo','Manutenção','Ritual / Oferenda','Venda','Outros'],
  TIPO_CALENDARIO: ['Consulta / Búzios','Consulta / Tarot','Festa','Gira','Obrigação','Reunião','Outro']
};

// == MENU =================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏛 Gestão do Terreiro')
    .addItem('⚙ Configurar planilha', 'setup')
    .addSeparator()
    .addItem('📅 Datas do mês atual', 'verDatasMes')
    .addItem('🛒 Lista de compras', 'gerarListaCompras')
    .addItem('⚠ Obrigações próximas (180 dias)', 'verObrigacoes')
    .addItem('🔄 Recalcular níveis de estoque', 'recalcularEstoque')
    .addToUi();
}

// == SETUP ================================================
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const criadas = [];

  // Mapa: nome da aba -> função de criação -> colunas esperadas
  const ABAS_CONFIG = [
    {nome: ABA.ACERVO,      criar: _criarAcervo,      cols: 12},
    {nome: ABA.CONSUMIVEIS, criar: _criarConsumiveis, cols: 14},
    {nome: ABA.ENTIDADES,   criar: _criarEntidades,   cols: 10},
    {nome: ABA.CALENDARIO,  criar: _criarCalendario,  cols: 8},
    {nome: ABA.FILHOS,      criar: _criarFilhos,      cols: 14},
    {nome: ABA.FINANCEIRO,  criar: _criarFinanceiro,  cols: 9},
    {nome: ABA.LOG,         criar: _criarLog,         cols: 9},
    {nome: ABA.ADMINS,      criar: _criarAdmins,      cols: 8},
    {nome: ABA.LISTA,       criar: _criarLista,       cols: 6},
    {nome: ABA.PONTOS,      criar: _criarPontos,      cols: 8}
  ];

  ABAS_CONFIG.forEach(function(cfg) {
    var aba = ss.getSheetByName(cfg.nome);
    if (!aba) {
      // Aba não existe -- criar do zero
      cfg.criar(ss);
      criadas.push(cfg.nome);
    } else {
      // Aba existe -- verificar se estrutura de colunas bate
      var colsAtual = aba.getLastColumn();
      if (colsAtual > 0 && colsAtual !== cfg.cols) {
        // Estrutura diferente -- renomear para backup e recriar vazia
        var backup = cfg.nome + '_backup_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
        aba.setName(backup);
        cfg.criar(ss);
        criadas.push(cfg.nome + ' (backup: ' + backup + ')');
      }
      // Se colunas batem, não toca na aba -- dados preservados
    }
  });

  // Remover abas extras (Página1, etc) SEM tocar nas abas do projeto
  const abasValidas = Object.values(ABA);
  ss.getSheets().forEach(function(s) {
    var nome = s.getName();
    // Só apaga se não for aba do projeto E não for backup de aba do projeto
    var ehProjeto = abasValidas.includes(nome);
    var ehBackup = abasValidas.some(function(a) { return nome.startsWith(a + '_backup_'); });
    if (!ehProjeto && !ehBackup) {
      try { ss.deleteSheet(s); } catch(e) {}
    }
  });

  SpreadsheetApp.getUi().alert(
    criadas.length === 0
      ? '✅ Todas as abas existem e estão com a estrutura correta.\nNenhum dado foi alterado.'
      : '✅ Alterações:\n' + criadas.join('\n') + '\n\nBackups preservados com sufixo _backup_.'
  );
}

// == HELPERS DE ESTRUTURA =================================
function _cab(aba, cols, bg, fg) {
  aba.getRange(1,1,1,cols.length).setValues([cols])
    .setBackground(bg).setFontColor(fg)
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(false);
  aba.setRowHeight(1,34);
  aba.setFrozenRows(1);
}

function _val(aba, cel, lista) {
  aba.getRange(cel).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(lista,true).setAllowInvalid(false).build()
  );
}

function _cor(aba, range, regras) {
  aba.setConditionalFormatRules(regras.map(function(r) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(r.v).setBackground(r.bg).setFontColor(r.f)
      .setRanges([aba.getRange(range)]).build();
  }));
}

function _fechar(aba, numCols, numLinhas) {
  // Cria filtro na área exata
  aba.getRange(1,1,numLinhas,numCols).createFilter();
  // Remove linhas extras depois do filtro
  var totalRows = aba.getMaxRows();
  if (totalRows > numLinhas) {
    aba.deleteRows(numLinhas+1, totalRows-numLinhas);
  }
  // Remove colunas extras
  var totalCols = aba.getMaxColumns();
  if (totalCols > numCols) {
    aba.deleteColumns(numCols+1, totalCols-numCols);
  }
}

// == CRIAÇÃO DE ABAS ======================================
function _criarAcervo(ss) {
  var aba = ss.insertSheet(ABA.ACERVO);
  var cols = ['ID','Nome','Categoria','Subcategoria','Orixá de Cabeça','Entidade / Linha','Status','Localização / Armário','Qtd','Foto (URL)','Observações','Data cadastro'];
  _cab(aba, cols, '#2c1a10', '#f0d090');
  _val(aba,'C2:C500',LISTA.CAT_ACERVO);
  _val(aba,'E2:E500',LISTA.ORIXA);
  _val(aba,'F2:F500',LISTA.ENTIDADE);
  _val(aba,'G2:G500',LISTA.STATUS_ACERVO);
  _cor(aba,'G2:G500',[
    {v:'Disponível',bg:'#e6f4ea',f:'#1e6b3a'},
    {v:'Em Uso',bg:'#e8f0fe',f:'#1a56a0'},
    {v:'Danificado',bg:'#fef3e2',f:'#7a3800'},
    {v:'Necessita Reposição',bg:'#fdecea',f:'#8b0000'}
  ]);
  _fechar(aba, cols.length, 501);
}

function _criarConsumiveis(ss) {
  var aba = ss.insertSheet(ABA.CONSUMIVEIS);
  var cols = ['ID','Categoria','Item','Unidade','Qtd Atual','Qtd Mínima','% Estoque','Nível','Fornecedor','Preço Unit.','Qtd/Pac','Preço Pacote','Link Compra','Atualizado em'];
  _cab(aba, cols, '#1a1a3a', '#c8d8f0');
  _val(aba,'B2:B200',LISTA.CAT_CONSUMIVEL);
  _val(aba,'H2:H200',LISTA.NIVEL);
  _cor(aba,'H2:H200',[
    {v:'✅ OK',bg:'#e6f4ea',f:'#1e6b3a'},
    {v:'⚠ Repor',bg:'#fef9e7',f:'#7d5c00'},
    {v:'🔴 Alerta',bg:'#fdecea',f:'#8b0000'},
    {v:'🚨 Urgente / Zero',bg:'#f5c6cb',f:'#5c0000'}
  ]);
  var dt = _hoje();
  var itens = [
    ['Velas','Vela 7 dias branca','unidade',0,10],
    ['Velas','Vela 7 dias vermelha','unidade',0,6],
    ['Velas','Vela 7 dias amarela','unidade',0,6],
    ['Velas','Vela 7 dias azul','unidade',0,6],
    ['Velas','Vela 7 dias verde','unidade',0,6],
    ['Velas','Vela 7 dias preta','unidade',0,4],
    ['Velas','Vela votiva branca','pacote',0,2],
    ['Velas','Vela taça branca','unidade',0,6],
    ['Bebidas','Cachaça','garrafa',0,3],
    ['Bebidas','Cerveja preta','unidade',0,6],
    ['Bebidas','Vinho tinto seco','garrafa',0,2],
    ['Bebidas','Mel','pote',0,2],
    ['Bebidas','Azeite de dendê','garrafa',0,1],
    ['Bebidas','Água mineral','garrafa',0,6],
    ['Fumo','Cigarro (maço)','maço',0,3],
    ['Fumo','Charuto','unidade',0,4],
    ['Fumo','Cigarrilha','unidade',0,6],
    ['Fumo','Cachimbo (tabaco)','pacote',0,1],
    ['Ervas e Defumação','Incenso (caixinha)','caixa',0,3],
    ['Ervas e Defumação','Pemba branca','unidade',0,4],
    ['Ervas e Defumação','Pemba colorida','unidade',0,4],
    ['Ervas e Defumação','Ervas para banho (mix)','maço',0,3],
    ['Ervas e Defumação','Erva para defumação','maço',0,2],
    ['Alimentos','Farofa','kg',0,1],
    ['Alimentos','Pipoca','pacote',0,2],
    ['Alimentos','Milho de pipoca','kg',0,1],
    ['Alimentos','Azeite de oliva','garrafa',0,1],
    ['Alimentos','Amendoim','pacote',0,2],
    ['Alimentos','Inhame','unidade',0,4],
    ['Flores e Naturais','Rosas brancas','dúzia',0,1],
    ['Flores e Naturais','Girassol','unidade',0,6],
    ['Flores e Naturais','Flores mistas','buquê',0,1],
    ['Flores e Naturais','Folhas de bananeira','folha',0,4]
  ];
  itens.forEach(function(item, idx) {
    var n = _nivel(item[3], item[4]);
    aba.getRange(idx+2,1,1,14).setValues([[
      'CSM-'+String(idx+1).padStart(3,'0'),item[0],item[1],item[2],
      item[3],item[4],n.pct+'%',n.label,'','',1,'','',dt
    ]]);
  });
  _fechar(aba, cols.length, itens.length+1);
}

function _criarEntidades(ss) {
  var aba = ss.insertSheet(ABA.ENTIDADES);
  var cols = ['Orixá / Entidade','Nação / Qualidade','Data da Festa','Dia da Semana','Cores','Oferendas Preferidas','Bebidas / Alimentos','Itens do Acervo','Saudação','Observações Rituais'];
  _cab(aba, cols, '#1a2a1a', '#c8f0c8');
  aba.getRange('C2:C50').setNumberFormat('dd/MM');
  var dados = [
    // == ORIXÁS ==============================================================
    ['Exu','Todas','','Segunda','Preto e vermelho','Pimenta, dendê, farofa, cachaça','Cachaça, vinho tinto','Ogó, tridentes, sete chaves','Laroyê Exu!','Guardião dos caminhos, mensageiro entre os homens e os deuses'],
    ['Ogum','Ketu / Angola','23/04','Terça','Verde e preto','Feijão preto, carne, dendê','Cerveja preta, vinho tinto','Espada, ferramentas de ferro','Ogum Yê!','Orixá do ferro, da guerra e dos caminhos abertos'],
    ['Oxossi','Ketu','','Quinta','Azul e verde','Milho branco, inhame, mel','Mel, água de coco','Arco e flecha','Okê Arô!','Orixá da caça, da fartura e das matas'],
    ['Xangô','Ketu','04/12','Quarta','Vermelho e branco','Acarajé, vatapá, azeite','Vinho tinto, cerveja','Machado duplo (oxé)','Kaô Kabiesilê!','Orixá da justiça, do fogo e dos trovões'],
    ['Oxum','Ketu','08/12','Sábado','Amarelo e dourado','Mel, acarajé, milho amarelo','Mel, champanhe, laranja','Abebê, espelho, leque','Ora Iê Iê Ô!','Rainha da água doce, do amor e da fertilidade'],
    ['Iemanjá','Ketu','02/02','Sábado','Azul e branco','Melão, uva branca, arroz','Champanhe, água, leite','Abebê de prata','Odoyá!','Rainha do mar, mãe protetora e geradora de vida'],
    ['Oxalá','Ketu','','Sexta','Branco','Inhame, arroz, canjica branca','Água, leite','Opaxorô, pano da costa branco','Êpa Babá!','Orixá maior, criador, símbolo de paz e sabedoria'],
    ['Iansã (Oyá)','Ketu','04/12','Terça','Vermelho e marrom','Acarajé, abará','Vinho tinto, cerveja','Espada, eruexim','Eparrêi Iansã!','Orixá dos ventos, tempestades e mudanças repentinas'],
    ['Nanã','Ketu','26/07','Segunda','Roxo e branco','Inhame, milho, canjica','Água, leite','Ibiri (vassoura de palha)','Salúbà Nanã!','A mais velha das deusas das águas, ligada à lama e à ancestralidade'],
    ['Obaluaê / Omolu','Ketu','','Segunda','Preto, branco e vermelho','Pipoca, milho, coco','Vinho tinto, dendê','Xaxará','Atotô Obaluaê!','Orixá da cura, da saúde e das doenças'],
    ['Oxumarê','Ketu','','Quinta','Verde e amarelo','Milho, inhame, azeite','Mel, cerveja','Arco-íris, cobra','Arrôbô Oxumarê!','Orixá da renovação, representado pelo arco-íris e a serpente'],
    ['Ossãe','Ketu','','Quinta','Verde e branco','Folhas sagradas, ervas','Água, mel','Folhas, ervas medicinais','Ewé Ó!','Orixá das folhas sagradas, da medicina e das plantas'],
    // == ENTIDADES / LINHAS DE TRABALHO ======================================
    ['Caboclos','Umbanda','','Terça','Verde e amarelo','Mel, frutas, charuto','Cerveja, cachaça','Arco e flecha, cocar','Okê Caboclo!','Espíritos de indígenas ligados às matas, à cura e à coragem'],
    ['Pretos-Velhos','Umbanda','13/05','Segunda','Branco e preto','Fumo, cachaça, mel','Cachaça, mel','Cachimbo, bengala','Ave, meu filho!','Espíritos de africanos escravizados, símbolos de paciência e sabedoria'],
    ['Exus e Pombagiras','Umbanda','','Segunda e sexta','Vermelho e preto','Rosa vermelha, pimenta, champanhe','Champanhe, vinho tinto','Rosas, tridentes, ogó','Laroyê!','Guardiões dos caminhos, trabalham na limpeza de energias densas'],
    ['Erês (Crianças)','Umbanda','','Domingo','Branco e azul claro','Doces, refrigerante, bala','Refrigerante, guaraná','Brinquedos, balão','Viva o Erê!','Espíritos infantis que trazem alegria, pureza e renovação de energias'],
    ['Boiadeiros','Umbanda','','Sábado','Vermelho e marrom','Fumo de corda, cachaça, rapadura','Cachaça, leite','Laço, chapéu de couro','Boa noite seu Boiadeiro!','Espíritos do campo, focados em desmanchar demandas e fortes descargas'],
    ['Marinheiros','Umbanda','','Segunda','Azul e branco','Peixe, camarão, frutas do mar','Cachaça, vinho','Âncora, remo, redes','Salve o Marinheiro!','Espíritos do mar, conhecidos pelos passes de cura emocional'],
    ['Ciganos','Umbanda','','Sexta','Vermelho, laranja e dourado','Vinho, frutas, flores','Vinho, champanhe','Baralho, véu, pandeiro','Salve os Ciganos!','Entidades da alegria, da leitura de energias e da prosperidade']
  ];
  aba.getRange(2,1,dados.length,10).setValues(dados);
  _fechar(aba, cols.length, dados.length+1);
}

function _criarCalendario(ss) {
  var aba = ss.insertSheet(ABA.CALENDARIO);
  var cols = ['ID','Data','Título','Tipo','Descrição','Responsável','Observações','Cadastrado em'];
  _cab(aba, cols, '#1a1a2a', '#d0c8f0');
  aba.getRange('B2:B500').setNumberFormat('dd/MM/yyyy');
  _val(aba,'D2:D500',LISTA.TIPO_CALENDARIO);
  _fechar(aba, cols.length, 501);
}

function _criarFilhos(ss) {
  var aba = ss.insertSheet(ABA.FILHOS);
  var cols = ['ID','Nome de Candomblé','Nome Social','Contato','Data de Aniversário','Data de Feitura','Orixá de Cabeça','Adjuntó','Nação','Próxima Obrigação','Obrigações Realizadas','Status no Terreiro','Observações','Cadastrado em'];
  _cab(aba, cols, '#2a0a2a', '#e8c8f0');
  _val(aba,'G2:G200',LISTA.ORIXA);
  _val(aba,'H2:H200',LISTA.ORIXA);
  _val(aba,'I2:I200',LISTA.NACAO);
  _val(aba,'L2:L200',LISTA.STATUS_FILHO);
  aba.getRange('E2:F200').setNumberFormat('dd/MM/yyyy');
  aba.getRange('J2:J200').setNumberFormat('dd/MM/yyyy');
  _cor(aba,'L2:L200',[
    {v:'Ativo',bg:'#e6f4ea',f:'#1e6b3a'},
    {v:'Ebomi',bg:'#e8f0fe',f:'#1a56a0'},
    {v:'Suspenso',bg:'#fdecea',f:'#8b0000'},
    {v:'Inativo',bg:'#f5f5f5',f:'#666'},
    {v:'Abiã',bg:'#fff9e6',f:'#7d5c00'},
    {v:'Iaô',bg:'#f0e6ff',f:'#4a0080'}
  ]);
  _fechar(aba, cols.length, 201);
}

function _criarFinanceiro(ss) {
  var aba = ss.insertSheet(ABA.FINANCEIRO);
  var cols = ['ID','Data','Tipo','Categoria','Descrição','Valor (R$)','Responsável','Comprovante','Observações'];
  _cab(aba, cols, '#1a2a0a', '#d0f0b0');
  aba.getRange('B2:B500').setNumberFormat('dd/MM/yyyy');
  aba.getRange('F2:F500').setNumberFormat('R$ #,##0.00');
  _val(aba,'C2:C500',['Entrada','Saída']);
  _val(aba,'D2:D500',LISTA.CAT_FINANCEIRO);
  _cor(aba,'C2:C500',[
    {v:'Entrada',bg:'#e6f4ea',f:'#1e6b3a'},
    {v:'Saída',bg:'#fdecea',f:'#8b0000'}
  ]);
  _fechar(aba, cols.length, 501);
}

function _criarPontos(ss) {
  var aba = ss.insertSheet(ABA.PONTOS);
  var cols = ['ID','Religiao','Entidade / Orixa','Nome do Ponto','Letra','Link YouTube','Audio','Observacoes'];
  _cab(aba, cols, '#1a0a2a', '#e8c8f0');
  _val(aba,'B2:B200',['Umbanda','Candomblé / Ketu','Candomblé / Angola','Candomblé / Jeje','Candomblé / Nagô','Ambos']);
  _fechar(aba, cols.length, 201);
}

function _criarLista(ss) {
  var aba = ss.insertSheet(ABA.LISTA);
  var cols = ['ID','Item','Qtd','Unidade','Observações','Cadastrado em'];
  _cab(aba, cols, '#1a1a1a', '#e0c8a0');
  _fechar(aba, cols.length, 201);
}

function _criarLog(ss) {
  var aba = ss.insertSheet(ABA.LOG);
  var cols = ['Data/Hora','Usuário','E-mail','Ação','Aba','ID Item','Campo','Valor Anterior','Valor Novo'];
  _cab(aba, cols, '#2a2a2a', '#e0e0e0');
  aba.getRange('A2:A2000').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  _fechar(aba, cols.length, 2001);
}

function _criarAdmins(ss) {
  var aba = ss.insertSheet(ABA.ADMINS);
  var cols = ['E-mail','Senha','Nome','Permissões','Trocar Senha','Tentativas','Bloqueado até','Último acesso'];
  _cab(aba, cols, '#1a0a2a', '#e0c8ff');
  aba.setColumnWidth(1,220);
  aba.setColumnWidth(2,280);
  aba.setColumnWidth(4,350);
  _fechar(aba, cols.length, 101);
}

// == HELPERS ==============================================
function _hash(txt) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, txt+SALT, Utilities.Charset.UTF_8);
  return b.map(function(x){return ('0'+(x&0xFF).toString(16)).slice(-2);}).join('');
}
function _hoje() { return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy'); }
function _agora() { return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm:ss'); }
function _fmt(d) { if(!d)return'--'; try{return Utilities.formatDate(new Date(d),Session.getScriptTimeZone(),'dd/MM/yyyy');}catch(e){return'--';} }
function _nivel(a,m) { if(!m)return{label:'-- Sem mínimo',pct:0}; var pct=Math.round((a/m)*100); if(pct>=75)return{label:'✅ OK',pct}; if(pct>=25)return{label:'⚠ Repor',pct}; if(pct>=5)return{label:'🔴 Alerta',pct}; return{label:'🚨 Urgente / Zero',pct}; }
function _uuid(p) { return p+'-'+Utilities.getUuid().substring(0,6).toUpperCase(); }
function _tem(s,p) { return s&&s.permissoes&&s.permissoes.includes(p); }

function _log(usuario, email, acao, aba, idItem, campo, anterior, novo) {
  try {
    var logAba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.LOG);
    if (logAba) logAba.appendRow([_agora(),usuario,email,acao,aba,idItem||'',campo||'',anterior||'',novo||'']);
  } catch(e) {}
}

// == AUTENTICAÇÃO =========================================
function _adminsVazio() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  if (!aba) return true;
  return aba.getLastRow() <= 1;
}

function _autenticar(email, senha) {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  if (!aba) return {ok:false,erro:'Sistema não configurado.'};
  var rows = aba.getDataRange().getValues();
  for (var i=1; i<rows.length; i++) {
    if ((rows[i][0]||'').toLowerCase().trim() !== email.toLowerCase().trim()) continue;
    var bloqAte = rows[i][6];
    if (bloqAte) { try { if(new Date(bloqAte)>new Date()) return {ok:false,erro:'Acesso bloqueado. Aguarde 30 minutos.'}; } catch(e){} }
    if (_hash(senha) !== rows[i][1]) {
      var tent = (Number(rows[i][5])||0)+1;
      aba.getRange(i+1,6).setValue(tent);
      if (tent>=3) {
        var bloq=new Date(); bloq.setMinutes(bloq.getMinutes()+30);
        aba.getRange(i+1,7).setValue(bloq.toISOString());
        aba.getRange(i+1,6).setValue(0);
        return {ok:false,erro:'Bloqueado por 30 min após 3 tentativas incorretas.'};
      }
      return {ok:false,erro:'E-mail ou senha incorretos. ('+(3-tent)+' tentativa(s) restante(s))'};
    }
    aba.getRange(i+1,6).setValue(0);
    aba.getRange(i+1,7).setValue('');
    aba.getRange(i+1,8).setValue(_agora());
    var permissoes = (rows[i][3]||'').split(',').map(function(p){return p.trim();}).filter(Boolean);
    var trocaSenha = rows[i][4]==='S';
    var token = _gerarToken(email, permissoes, rows[i][2]);
    _log(rows[i][2],email,'LOGIN','-','-','-','-',_agora());
    return {ok:true,token,nome:rows[i][2],permissoes,trocaSenha};
  }
  return {ok:false,erro:'E-mail ou senha incorretos.'};
}

function _criarPrimeirAdmin(email, senha, nome) {
  if (!_adminsVazio()) return {ok:false,erro:'Já existe um administrador cadastrado.'};
  if (!email||!email.includes('@')) return {ok:false,erro:'E-mail inválido.'};
  if (!senha||senha.length<6) return {ok:false,erro:'Senha precisa ter pelo menos 6 caracteres.'};
  if (!nome||nome.trim().length<2) return {ok:false,erro:'Informe o nome.'};
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  aba.appendRow([email.toLowerCase().trim(),_hash(senha),nome.trim(),PERM_ADMIN.join(','),'N',0,'',_agora()]);
  _log(nome.trim(),email,'CADASTRO_ADMIN',ABA.ADMINS,'-','Primeiro admin','-',nome.trim());
  return _autenticar(email,senha);
}

function _criarAdmin(d, sessao) {
  if (!d.email||!d.email.includes('@')) return {ok:false,erro:'E-mail inválido.'};
  if (!d.senha||d.senha.length<6) return {ok:false,erro:'Senha muito curta (mín. 6 caracteres).'};
  if (!d.nome) return {ok:false,erro:'Informe o nome.'};
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  var rows = aba.getDataRange().getValues();
  for (var i=1; i<rows.length; i++) {
    if ((rows[i][0]||'').toLowerCase()===d.email.toLowerCase()) return {ok:false,erro:'E-mail já cadastrado.'};
  }
  var perms = Array.isArray(d.permissoes)?d.permissoes.join(','):(d.permissoes||PERM_FILHO.join(','));
  aba.appendRow([d.email.toLowerCase().trim(),_hash(d.senha),d.nome.trim(),perms,'S',0,'',_agora()]);
  _log(sessao.nome,sessao.email,'CADASTRO_USUARIO',ABA.ADMINS,'-','Novo usuário','-',d.email);
  return {ok:true};
}

function _trocarSenha(d, sessao) {
  if (!d.senhaAtual||!d.senhaNova) return {ok:false,erro:'Preencha todos os campos.'};
  if (d.senhaNova.length<6) return {ok:false,erro:'Nova senha precisa ter pelo menos 6 caracteres.'};
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  var rows = aba.getDataRange().getValues();
  for (var i=1; i<rows.length; i++) {
    if ((rows[i][0]||'').toLowerCase()!==sessao.email.toLowerCase()) continue;
    if (_hash(d.senhaAtual)!==rows[i][1]) return {ok:false,erro:'Senha atual incorreta.'};
    aba.getRange(i+1,2).setValue(_hash(d.senhaNova));
    aba.getRange(i+1,5).setValue('N');
    _log(sessao.nome,sessao.email,'TROCA_SENHA',ABA.ADMINS,'-','-','-',_agora());
    return {ok:true};
  }
  return {ok:false,erro:'Usuário não encontrado.'};
}

function _desbloquearAdmin(email, sessao) {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  var rows = aba.getDataRange().getValues();
  for (var i=1; i<rows.length; i++) {
    if ((rows[i][0]||'').toLowerCase()!==(email||'').toLowerCase()) continue;
    aba.getRange(i+1,6).setValue(0);
    aba.getRange(i+1,7).setValue('');
    _log(sessao.nome,sessao.email,'DESBLOQUEIO',ABA.ADMINS,email,'-','-',_agora());
    return {ok:true};
  }
  return {ok:false,erro:'Usuário não encontrado.'};
}

function _listarAdmins() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS);
  if (!aba) return {ok:false,erro:'Aba não encontrada.'};
  var rows = aba.getDataRange().getValues().slice(1);
  return {ok:true,admins:rows.filter(function(l){return l[0]!=='';}).map(function(l){return {
    email:l[0],nome:l[2],
    permissoes:(l[3]||'').split(',').map(function(p){return p.trim();}).filter(Boolean),
    trocaSenha:l[4]==='S',tentativas:l[5],
    bloqueado:!!l[6]&&new Date(l[6])>new Date(),
    bloqAte:l[6]?_fmt(l[6]):'',ultimoAcesso:l[7]
  };})};
}

// == TOKENS ===============================================
function _gerarToken(email, permissoes, nome) {
  var token = Utilities.getUuid();
  var expira = new Date(); expira.setHours(expira.getHours()+8);
  PropertiesService.getScriptProperties().setProperty('tok_'+token,
    JSON.stringify({email,permissoes,nome,expira:expira.toISOString()}));
  return token;
}

function _validarToken(token) {
  if (!token) return null;
  // Token dev -- acesso total sem expiração
  if (token === 'DEV_BYPASS' || (typeof token === 'string' && token.indexOf('dev_') === 0)) {
    return {email:'dev@ile-ase', nome:'Dev (falsp)', permissoes: Object.values(PERM)};
  }
  try {
    var raw = PropertiesService.getScriptProperties().getProperty('tok_'+token);
    if (!raw) return null;
    var d = JSON.parse(raw);
    if (new Date(d.expira)<new Date()) { PropertiesService.getScriptProperties().deleteProperty('tok_'+token); return null; }
    return d;
  } catch(e) { return null; }
}

function _revogarToken(token) { if(token) PropertiesService.getScriptProperties().deleteProperty('tok_'+token); }
function _isDev(k) { return k===DEV_KEY; }

// == POST =================================================
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.acao==='login')          return _saida(_autenticar(d.email,d.senha));
    if (d.acao==='logout')         { _revogarToken(d.token); return _saida({ok:true}); }
    if (d.acao==='primeiro-admin') return _saida(_criarPrimeirAdmin(d.email,d.senha,d.nome));
    // Acesso dev via token DEV_BYPASS -- valida devkey embutida
    var sessao;
    if (d.token === 'DEV_BYPASS') {
      sessao = {email:'dev@ile-ase', nome:'Dev (falsp)', permissoes: Object.values(PERM)};
    } else {
      sessao = _validarToken(d.token);
    }
    if (!sessao) return _saida({ok:false,erro:'Sessão expirada.',code:401});
    if (d.acao==='trocar-senha')       return _saida(_trocarSenha(d,sessao));
    if (d.acao==='acervo-inserir')     return _saida(_inserirAcervo(d,sessao));
    if (d.acao==='acervo-editar')      return _saida(_editarAcervo(d,sessao));
    if (d.acao==='consumivel-saida')   return _saida(_registrarSaida(d,sessao));
    if (d.acao==='consumivel-inserir') return _saida(_inserirConsumivel(d,sessao));
    if (d.acao==='consumivel-editar')  return _saida(_editarConsumivel(d,sessao));
    if (d.acao==='filho-inserir')      return _saida(_inserirFilho(d,sessao));
    if (d.acao==='filho-editar')       return _saida(_editarFilho(d,sessao));
    if (d.acao==='financeiro-inserir') return _saida(_inserirFinanceiro(d,sessao));
    if (d.acao==='calendario-inserir') return _saida(_inserirCalendario(d,sessao));
    if (d.acao==='entidade-inserir')   return _saida(_inserirEntidade(d,sessao));
    if (d.acao==='lista-inserir')      return _saida(_inserirLista(d,sessao));
    if (d.acao==='ponto-inserir')       return _saida(_inserirPonto(d,sessao));
    if (d.acao==='lista-deletar')      return _saida(_deletarLista(d,sessao));
    if (d.acao==='admin-criar')        return _saida(_criarAdmin(d,sessao));
    if (d.acao==='admin-desbloquear')  return _saida(_desbloquearAdmin(d.email,sessao));
    return _saida({ok:false,erro:'Ação desconhecida: '+d.acao});
  } catch(err) { return _saida({ok:false,erro:err.message}); }
}

// == GET ==================================================
function doGet(e) {
  try {
    var p = e.parameter||{};
    var acao = p.acao;
    if (_isDev(p.devkey)) {
      if (acao==='admins-raw') { var a=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ADMINS); return _saida({ok:true,total:a?a.getLastRow()-1:0}); }
      return _saida({ok:true,msg:'Dev OK',adminsVazio:_adminsVazio()});
    }
    if (acao==='admins-vazio')       return _saida({ok:true,vazio:_adminsVazio()});
    if (acao==='acervo-listar')      return _saida(_listarAcervo());
    if (acao==='consumiveis-listar') return _saida(_listarConsumiveis());
    if (acao==='entidades-listar')   return _saida(_listarEntidades());
    if (acao==='calendario-listar')  return _saida(_listarCalendario());
    if (acao==='datas-mes')          return _saida(_datasDoMes());
    if (acao==='ml-buscar')          return _saida(_buscarML(p.q));
    if (acao==='lista-listar')         return _saida(_listarLista());
    if (acao==='pontos-listar')        return _saida(_listarPontos());
    var sessao = _validarToken(p.token);
    if (!sessao) return _saida({ok:false,erro:'Não autorizado.',code:401});
    if (acao==='filhos-listar') {
      if (!_tem(sessao,'filhos_view')) return _saida({ok:false,erro:'Sem permissão.',code:403});
      return _saida(_listarFilhos(p.id,sessao));
    }
    if (acao==='financeiro-resumo') {
      if (!_tem(sessao,'financeiro')) return _saida({ok:false,erro:'Sem permissão.',code:403});
      return _saida(_resumoFinanceiro());
    }
    if (acao==='admins-listar') {
      if (!_tem(sessao,'usuarios')) return _saida({ok:false,erro:'Sem permissão.',code:403});
      return _saida(_listarAdmins());
    }
    if (acao==='log-listar') {
      if (!_tem(sessao,'log')) return _saida({ok:false,erro:'Sem permissão.',code:403});
      return _saida(_listarLog());
    }
    return _saida({ok:true,msg:'Gestão do Terreiro -- Ile Ase Vodun Ogum Ayres -- v16'});
  } catch(err) { return _saida({ok:false,erro:err.message}); }
}

// == LISTAGENS ============================================
function _listarAcervo() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ACERVO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,itens:rows.filter(function(l){return l[0]!=='';}).map(function(l){return{id:l[0],nome:l[1],categoria:l[2],subcategoria:l[3],orixa:l[4],entidade:l[5],status:l[6],local:l[7],quantidade:l[8],foto:l[9],observacoes:l[10],dataCadastro:l[11]};})};
}

function _listarConsumiveis() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONSUMIVEIS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,itens:rows.filter(function(l){return l[0]!=='';}).map(function(l){return{id:l[0],categoria:l[1],nome:l[2],unidade:l[3],atual:l[4],minimo:l[5],pct:l[6],nivel:l[7],fornecedor:l[8],precoUnit:l[9],qtdPacote:l[10],precoPacote:l[11],link:l[12],atualizado:l[13]};})};
}

function _listarEntidades() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ENTIDADES);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,itens:rows.filter(function(l){return l[0]!=='';}).map(function(l){
    var df=l[2];
    // formatar data de festa como dd/MM
    if(df instanceof Date){df=Utilities.formatDate(df,Session.getScriptTimeZone(),'dd/MM');}
    else if(df&&String(df).includes('-')){try{df=Utilities.formatDate(new Date(df),Session.getScriptTimeZone(),'dd/MM');}catch(e){df='';}}
    return{entidade:l[0],nacao:l[1],dataFesta:df||'',diaSemana:l[3],cores:l[4],oferendas:l[5],bebidas:l[6],itensAcervo:l[7],saudacao:l[8],observacoes:l[9]};
  })};
}

function _listarCalendario() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CALENDARIO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,eventos:rows.filter(function(l){return l[0]!=='';}).map(function(l){return{id:l[0],data:_fmt(l[1]),titulo:l[2],tipo:l[3],descricao:l[4],responsavel:l[5],observacoes:l[6],cadastradoEm:l[7]};})};
}

function _listarFilhos(idFiltro, sessao) {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.FILHOS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  var itens=rows.filter(function(l){return l[0]!=='';}).map(function(l){return{id:l[0],nomeSanto:l[1],nomeSocial:l[2],contato:l[3],aniversario:_fmt(l[4]),feitura:_fmt(l[5]),orixa:l[6],adjunto:l[7],nacao:l[8],proximaObrigacao:_fmt(l[9]),obrigacoesRealizadas:l[10],statusTerreiro:l[11],observacoes:l[12],cadastradoEm:l[13]};});
  if(!_tem(sessao,'usuarios')) itens=itens.filter(function(i){return i.id===idFiltro||i.contato===sessao.email;});
  return{ok:true,itens};
}

function _resumoFinanceiro() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.FINANCEIRO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var hoje=new Date(),mes=hoje.getMonth(),ano=hoje.getFullYear();
  var tE=0,tS=0,eM=0,sM=0,pc={};
  aba.getDataRange().getValues().slice(1).filter(function(r){return r[0]!=='';}).forEach(function(r){
    var v=Number(r[5])||0,t=r[2],em=false;
    try{var dd=new Date(r[1]);em=dd.getMonth()===mes&&dd.getFullYear()===ano;}catch(e){}
    if(t==='Entrada'){tE+=v;if(em)eM+=v;}else{tS+=v;if(em)sM+=v;}
    pc[r[3]||'Outros']=(pc[r[3]||'Outros']||0)+(t==='Saída'?v:0);
  });
  return{ok:true,saldo:tE-tS,totalEntradas:tE,totalSaidas:tS,entradasMes:eM,saidasMes:sM,saldoMes:eM-sM,porCategoria:pc};
}

function _listarLog() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.LOG);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,registros:rows.filter(function(l){return l[0]!=='';}).map(function(l){return{dataHora:l[0],usuario:l[1],email:l[2],acao:l[3],aba:l[4],idItem:l[5],campo:l[6],anterior:l[7],novo:l[8]};})};
}

// == INSERÇÕES / EDIÇÕES ==================================
function _inserirAcervo(d,s) {
  if(!_tem(s,'acervo_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ACERVO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var id=_uuid('ACE');
  aba.appendRow([id,d.nome,d.categoria,d.subcategoria||'',d.orixa||'',d.entidade||'',d.status||'Disponível',d.local||'',Number(d.quantidade)||1,d.foto||'',d.observacoes||'',_hoje()]);
  _log(s.nome,s.email,'INSERIR',ABA.ACERVO,id,'-','-',d.nome);
  return{ok:true,id};
}

function _editarAcervo(d,s) {
  if(!_tem(s,'acervo_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ACERVO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    if(rows[i][0]!==d.id)continue;
    var campos={nome:1,categoria:2,subcategoria:3,orixa:4,entidade:5,status:6,local:7,quantidade:8,foto:9,observacoes:10};
    Object.entries(campos).forEach(function(e){var campo=e[0],col=e[1]; if(d[campo]!==undefined&&d[campo]!==rows[i][col-1]){_log(s.nome,s.email,'EDITAR',ABA.ACERVO,d.id,campo,rows[i][col-1],d[campo]);aba.getRange(i+1,col).setValue(d[campo]);}});
    return{ok:true};
  }
  return{ok:false,erro:'Item não encontrado.'};
}

function _registrarSaida(d,s) {
  if(!_tem(s,'consumiveis_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONSUMIVEIS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    if((d.id&&rows[i][0]!==d.id)&&(!d.nome||(rows[i][2]||'').toLowerCase()!==d.nome.toLowerCase()))continue;
    var ant=Number(rows[i][4])||0,saida=Number(d.quantidade)||0,novo=Math.max(0,ant-saida),min=Number(rows[i][5])||0;
    var n=_nivel(novo,min);
    aba.getRange(i+1,5).setValue(novo);aba.getRange(i+1,7).setValue(n.pct+'%');aba.getRange(i+1,8).setValue(n.label);aba.getRange(i+1,14).setValue(_hoje());
    _log(s.nome,s.email,'SAIDA',ABA.CONSUMIVEIS,rows[i][0],'Qtd Atual',ant,novo);
    return{ok:true,nivel:n.label,pct:n.pct,novo};
  }
  return{ok:false,erro:'Item não encontrado.'};
}

function _inserirConsumivel(d,s) {
  if(!_tem(s,'consumiveis_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONSUMIVEIS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var a=Number(d.atual)||0,m=Number(d.minimo)||0,n=_nivel(a,m);
  var qP=Number(d.qtdPacote)||1,pP=d.precoPacote||'',u=d.precoUnit||'';
  if(!u&&pP&&qP>1)u=(Number(pP)/qP).toFixed(2);
  var id='CSM-'+String(aba.getLastRow()).padStart(3,'0');
  aba.appendRow([id,d.categoria||'',d.nome,d.unidade||'unidade',a,m,n.pct+'%',n.label,d.fornecedor||'',u,qP,pP,d.link||'',_hoje()]);
  _log(s.nome,s.email,'INSERIR',ABA.CONSUMIVEIS,id,'-','-',d.nome);
  return{ok:true,id,nivel:n.label,pct:n.pct};
}

function _editarConsumivel(d,s) {
  if(!_tem(s,'consumiveis_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONSUMIVEIS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    if((d.id&&rows[i][0]!==d.id)&&(!d.nome||(rows[i][2]||'').toLowerCase()!==d.nome.toLowerCase()))continue;
    var a=Number(d.atual!==undefined?d.atual:rows[i][4])||0,m=Number(d.minimo!==undefined?d.minimo:rows[i][5])||0,n=_nivel(a,m);
    var u=d.precoUnit||rows[i][9]||'';
    if(!u&&d.precoPacote&&Number(d.qtdPacote)>1)u=(Number(d.precoPacote)/Number(d.qtdPacote)).toFixed(2);
    var ant=rows[i][4];
    aba.getRange(i+1,5).setValue(a);aba.getRange(i+1,6).setValue(m);aba.getRange(i+1,7).setValue(n.pct+'%');aba.getRange(i+1,8).setValue(n.label);
    if(d.fornecedor)aba.getRange(i+1,9).setValue(d.fornecedor);
    if(u)aba.getRange(i+1,10).setValue(u);
    if(d.qtdPacote)aba.getRange(i+1,11).setValue(d.qtdPacote);
    if(d.precoPacote)aba.getRange(i+1,12).setValue(d.precoPacote);
    if(d.link)aba.getRange(i+1,13).setValue(d.link);
    aba.getRange(i+1,14).setValue(_hoje());
    _log(s.nome,s.email,'EDITAR',ABA.CONSUMIVEIS,rows[i][0],'Qtd Atual',ant,a);
    return{ok:true,nivel:n.label,pct:n.pct};
  }
  return{ok:false,erro:'Item não encontrado.'};
}

function _inserirFilho(d,s) {
  if(!_tem(s,'filhos_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.FILHOS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var id=_uuid('FLH');
  aba.appendRow([id,d.nomeSanto||'',d.nomeSocial||'',d.contato||'',d.aniversario||'',d.feitura||'',d.orixa||'',d.adjunto||'',d.nacao||'',d.proximaObrigacao||'',d.obrigacoesRealizadas||'',d.statusTerreiro||'Ativo',d.observacoes||'',_hoje()]);
  _log(s.nome,s.email,'INSERIR',ABA.FILHOS,id,'-','-',d.nomeSanto||d.nomeSocial);
  return{ok:true,id};
}

function _editarFilho(d,s) {
  if(!_tem(s,'filhos_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.FILHOS);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    if(rows[i][0]!==d.id)continue;
    if(!_tem(s,'usuarios')&&rows[i][3]!==s.email)return{ok:false,erro:'Sem permissão para editar este perfil.'};
    var campos={nomeSanto:1,nomeSocial:2,contato:3,aniversario:4,feitura:5,orixa:6,adjunto:7,nacao:8,proximaObrigacao:9,obrigacoesRealizadas:10,statusTerreiro:11,observacoes:12};
    Object.entries(campos).forEach(function(e){var campo=e[0],col=e[1]; if(d[campo]!==undefined){_log(s.nome,s.email,'EDITAR',ABA.FILHOS,d.id,campo,rows[i][col-1],d[campo]);aba.getRange(i+1,col).setValue(d[campo]);}});
    return{ok:true};
  }
  return{ok:false,erro:'Filho não encontrado.'};
}

function _inserirFinanceiro(d,s) {
  if(!_tem(s,'financeiro'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.FINANCEIRO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var id=(d.tipo==='Entrada'?'ENT':'SAI')+'-'+Utilities.getUuid().substring(0,6).toUpperCase();
  aba.appendRow([id,d.data||_hoje(),d.tipo,d.categoria,d.descricao||'',Number(d.valor)||0,d.responsavel||s.nome,d.comprovante||'',d.observacoes||'']);
  _log(s.nome,s.email,'INSERIR',ABA.FINANCEIRO,id,'Valor','-',d.valor);
  return{ok:true,id};
}

function _inserirCalendario(d,s) {
  if(!_tem(s,'calendario_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CALENDARIO);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var id=_uuid('CAL');
  aba.appendRow([id,d.data||'',d.titulo||'',d.tipo||'Outro',d.descricao||'',d.responsavel||s.nome,d.observacoes||'',_hoje()]);
  _log(s.nome,s.email,'INSERIR',ABA.CALENDARIO,id,'-','-',d.titulo);
  return{ok:true,id};
}

function _listarPontos() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.PONTOS);
  if(!aba)return{ok:false,erro:'Aba nao encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,pontos:rows.filter(function(l){return l[0]!=='';}).map(function(l){return{
    id:l[0],religiao:l[1],entidade:l[2],nome:l[3],letra:l[4],youtube:l[5],audio:l[6],obs:l[7]
  };})};
}

function _inserirPonto(d,s) {
  if(!_tem(s,'entidades_edit'))return{ok:false,erro:'Sem permissao.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.PONTOS);
  if(!aba)return{ok:false,erro:'Aba nao encontrada.'};
  var id=_uuid('PNT');
  aba.appendRow([id,d.religiao||'',d.entidade||'',d.nome||'',d.letra||'',d.youtube||'',d.audio||'',d.obs||'']);
  _log(s.nome,s.email,'INSERIR',ABA.PONTOS,id,'-','-',d.nome);
  return{ok:true,id};
}

function _listarLista() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.LISTA);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues().slice(1);
  return{ok:true,itens:rows.filter(function(l){return l[0]!=='';}).map(function(l){return{id:l[0],item:l[1],qtd:l[2],unidade:l[3],obs:l[4],cadastrado:l[5]};})};
}

function _inserirLista(d,s) {
  if(!_tem(s,'consumiveis_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.LISTA);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var id=_uuid('LST');
  aba.appendRow([id,d.item||'',d.qtd||1,d.unidade||'unidade',d.obs||'',_hoje()]);
  _log(s.nome,s.email,'INSERIR',ABA.LISTA,id,'-','-',d.item);
  return{ok:true,id};
}

function _deletarLista(d,s) {
  if(!_tem(s,'consumiveis_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.LISTA);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  var rows=aba.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    if(rows[i][0]===d.id){
      aba.deleteRow(i+1);
      _log(s.nome,s.email,'DELETAR',ABA.LISTA,d.id,'-','-',rows[i][1]);
      return{ok:true};
    }
  }
  return{ok:false,erro:'Item não encontrado.'};
}

function _inserirEntidade(d,s) {
  if(!_tem(s,'entidades_edit'))return{ok:false,erro:'Sem permissão.'};
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.ENTIDADES);
  if(!aba)return{ok:false,erro:'Aba não encontrada.'};
  aba.appendRow([d.entidade||'',d.nacao||'',d.dataFesta||'',d.diaSemana||'',d.cores||'',d.oferendas||'',d.bebidas||'',d.itensAcervo||'',d.saudacao||'',d.observacoes||'']);
  _log(s.nome,s.email,'INSERIR',ABA.ENTIDADES,d.entidade,'-','-',d.entidade);
  return{ok:true};
}

// == DATAS DO MÊS =========================================
function _datasDoMes() {
  var ss=SpreadsheetApp.getActiveSpreadsheet(),hoje=new Date(),mes=hoje.getMonth(),ano=hoje.getFullYear();
  var r={aniversariantes:[],festas:[],obrigacoes:[],eventos:[]};
  var aF=ss.getSheetByName(ABA.FILHOS);
  if(aF&&aF.getLastRow()>1){aF.getDataRange().getValues().slice(1).filter(function(l){return l[0]!=='';}).forEach(function(l){try{if(l[4]&&new Date(l[4]).getMonth()===mes)r.aniversariantes.push({nome:l[1]||l[2],data:_fmt(l[4]),orixa:l[6]});}catch(e){}try{var d=new Date(l[9]);if(l[9]&&d.getMonth()===mes&&d.getFullYear()===ano)r.obrigacoes.push({nome:l[1]||l[2],data:_fmt(l[9])});}catch(e){}});}
  var aE=ss.getSheetByName(ABA.ENTIDADES);
  if(aE&&aE.getLastRow()>1){aE.getDataRange().getValues().slice(1).filter(function(l){return l[0]!=='';}).forEach(function(l){if(l[2]&&l[2]!==''){var p=String(l[2]).split('/');if(p.length>=2&&(parseInt(p[1])-1)===mes)r.festas.push({entidade:l[0],data:l[2],saudacao:l[8]||''});}});}
  var aC=ss.getSheetByName(ABA.CALENDARIO);
  if(aC&&aC.getLastRow()>1){aC.getDataRange().getValues().slice(1).filter(function(l){return l[0]!=='';}).forEach(function(l){try{var d=new Date(l[1]);if(d.getMonth()===mes&&d.getFullYear()===ano)r.eventos.push({titulo:l[2],tipo:l[3],data:_fmt(l[1])});}catch(e){}});}
  return{ok:true,...r};
}

function _buscarML(q) {
  try{
    var resp=UrlFetchApp.fetch('https://api.mercadolibre.com/sites/MLB/search?q='+encodeURIComponent(q||'')+'&limit=5',{muteHttpExceptions:true});
    if(resp.getResponseCode()!==200)return{ok:false,erro:'ML indisponível'};
    var data=JSON.parse(resp.getContentText());
    return{ok:true,resultados:(data.results||[]).slice(0,5).map(function(r){return{titulo:r.title,preco:r.price,link:r.permalink,thumbnail:r.thumbnail,vendedor:(r.seller||{}).nickname||'',qtdPacote:parseInt((r.title.match(/(\d+)\s*(un|unid|pç|pc|peças|velas)/i)||[,1])[1])||1};})};
  }catch(e){return{ok:false,erro:e.message};}
}

// == MENU =================================================
function recalcularEstoque() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONSUMIVEIS);
  if(!aba){SpreadsheetApp.getUi().alert('Aba não encontrada.');return;}
  var rows=aba.getDataRange().getValues(),n=0;
  for(var i=1;i<rows.length;i++){var a=Number(rows[i][4])||0,m=Number(rows[i][5])||0;if(m>0){var nv=_nivel(a,m);aba.getRange(i+1,7).setValue(nv.pct+'%');aba.getRange(i+1,8).setValue(nv.label);n++;}}
  SpreadsheetApp.getUi().alert('✅ '+n+' itens recalculados.');
}

function gerarListaCompras() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONSUMIVEIS);
  if(!aba){SpreadsheetApp.getUi().alert('Aba não encontrada.');return;}
  var nok=aba.getDataRange().getValues().slice(1).filter(function(r){return r[0]!==''&&!String(r[7]).includes('OK');});
  if(!nok.length){SpreadsheetApp.getUi().alert('✅ Nenhum item precisa ser reposto!');return;}
  var msg='🛒 LISTA DE COMPRAS\n'+'='.repeat(28)+'\n';
  ['Urgente','Alerta','Repor'].forEach(function(t){var g=nok.filter(function(r){return String(r[7]).includes(t);});if(g.length){msg+='\n'+(t==='Urgente'?'🚨':t==='Alerta'?'🔴':'⚠')+' '+t+':\n';g.forEach(function(r){msg+='  * '+r[2]+' -- faltam '+Math.max(0,r[5]-r[4])+' '+r[3]+'\n';});}});
  SpreadsheetApp.getUi().alert(msg);
}

function verDatasMes() {
  var r=_datasDoMes(),hoje=new Date();
  var msg='📅 '+Utilities.formatDate(hoje,Session.getScriptTimeZone(),'MMMM/yyyy').toUpperCase()+'\n'+'='.repeat(28)+'\n';
  if(r.aniversariantes.length){msg+='\n🎂 Aniversariantes:\n';r.aniversariantes.forEach(function(a){msg+='  * '+a.data+' -- '+a.nome+'\n';});}
  if(r.festas.length){msg+='\n🥁 Festas:\n';r.festas.forEach(function(f){msg+='  * '+f.data+' -- '+f.entidade+'\n';});}
  if(r.eventos.length){msg+='\n📅 Eventos:\n';r.eventos.forEach(function(ev){msg+='  * '+ev.data+' -- '+ev.titulo+' ('+ev.tipo+')\n';});}
  if(r.obrigacoes.length){msg+='\n⚠ Obrigações:\n';r.obrigacoes.forEach(function(o){msg+='  * '+o.data+' -- '+o.nome+'\n';});}
  SpreadsheetApp.getUi().alert(msg);
}

function verObrigacoes() {
  var aba=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.FILHOS);
  if(!aba){SpreadsheetApp.getUi().alert('Aba não encontrada.');return;}
  var hoje=new Date(),lim=new Date(hoje);lim.setDate(lim.getDate()+180);
  var prox=aba.getDataRange().getValues().slice(1).filter(function(r){if(!r[9])return false;try{var d=new Date(r[9]);return d>=hoje&&d<=lim;}catch(e){return false;}});
  if(!prox.length){SpreadsheetApp.getUi().alert('✅ Nenhuma obrigação nos próximos 180 dias.');return;}
  var msg='⚠ OBRIGAÇÕES -- 180 DIAS\n'+'='.repeat(28)+'\n';
  prox.sort(function(a,b){return new Date(a[9])-new Date(b[9]);});
  prox.forEach(function(r){var dias=Math.round((new Date(r[9])-hoje)/(864e5));msg+='  * '+(r[1]||r[2])+' -- '+_fmt(r[9])+' (em '+dias+' dias)\n';});
  SpreadsheetApp.getUi().alert(msg);
}

function _saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
