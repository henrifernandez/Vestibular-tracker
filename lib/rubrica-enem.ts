// Rubrica oficial INEP das 5 competências do ENEM + calibração determinística
// (a parte numérica das travas roda em código, não é decidida pela IA — ver motivo
// no comentário de calibrarNota mais abaixo).

export const NIVEIS_VALIDOS = [0, 40, 80, 120, 160, 200];

export const RUBRICA = `## C1 — Domínio da norma padrão
Avalia ortografia, acentuação, pontuação, concordância, regência, crase, colocação pronominal, registro formal e estrutura sintática.
- 200: excelente domínio, no máximo uma falha, sem reincidência.
- 160: bom domínio, poucos desvios.
- 120: domínio mediano, alguns desvios, estrutura sintática regular.
- 80: domínio insuficiente, muitos desvios, estrutura deficitária.
- 40: domínio precário, desvios frequentes e diversificados.
- 0: desconhecimento da norma, texto incompreensível.
Peso maior para PADRÃO RECORRENTE de erro. Erro isolado ou typo não derruba muito; reincidência sim.

## C2 — Compreender o tema e aplicar o tipo dissertativo-argumentativo
Avalia aderência ao tema, domínio do tipo textual e repertório sociocultural legitimado e articulado.
- 200: argumentação consistente + repertório sociocultural produtivo + excelente domínio do tipo.
- 160: argumentação consistente + repertório legitimado + bom domínio do tipo.
- 120: argumentação PREVISÍVEL, repertório baseado só nos textos motivadores, domínio mediano.
- 80: aborda o tema de forma superficial ou copia motivadores; traços de outros tipos textuais.
- 40: tangencia o tema, ou domínio precário com traços constantes de outros tipos.
- 0: fuga ao tema, ou não é dissertativo-argumentativo, ou até 7 linhas.
Repertório só CITADO, sem função argumentativa, não conta como produtivo. Repertório genérico ou inventado derruba.

## C3 — Selecionar, relacionar e organizar (projeto de texto)
Avalia o planejamento do texto, a progressão entre parágrafos e a marca de autoria.
- 200: informações relacionadas de forma consistente e organizada, configurando AUTORIA.
- 160: de forma organizada, com INDÍCIOS de autoria.
- 120: de forma POUCO organizada, mas com defesa de ponto de vista.
- 80: desorganizada ou contraditória, limitada à reprodução dos motivadores.
- 40: caótica, sem encadeamento.
- 0: argumentos desconexos, sem defesa de ponto de vista.
C3 é a LÓGICA INTERNA do texto, diferente de C4 que é a costura linguística.

## C4 — Mecanismos linguísticos (coesão)
Avalia conectivos, referenciação, repetição indesejada e diversidade dos recursos coesivos.
- 200: articula bem as partes, repertório diversificado de recursos coesivos.
- 160: articula com poucas inadequações, repertório diversificado.
- 120: articulação mediana, com inadequações, repertório pouco diversificado.
- 80: articulação insuficiente, muitas inadequações, repertório limitado.
- 40: articulação precária.
- 0: não articula as informações.
Conectivo presente não é coesão boa: se for apenas protocolar ("além disso", "portanto") sem progressão real, não passa de 120.

## C5 — Proposta de intervenção
Conta explicitamente os 5 elementos: AÇÃO (o que), AGENTE (quem, ator social identificável), MODO/MEIO (como), EFEITO (para quê), DETALHAMENTO (explicação extra de algum elemento).
- 200: proposta muito bem elaborada e detalhada, articulada. (5 elementos)
- 160: proposta bem elaborada, relacionada e articulada. (4 elementos)
- 120: proposta mediana, relacionada ao tema. (3 elementos)
- 80: proposta insuficiente. (2 elementos)
- 40: proposta vaga ou precária. (1 elemento)
- 0: proposta ausente ou que fere os direitos humanos.
Agente nulo ("alguém", "as pessoas", "a sociedade" genérica) NÃO conta como agente.
Sem AÇÃO explícita, não passa de 80.`;

export const REGRA_ANTI_HALO = `Julgue cada competência com evidência PRÓPRIA no texto, independente da impressão geral:
- Boa tese não sobe automaticamente C1, C4 ou C5.
- Erros gramaticais não derrubam automaticamente C2, C3 ou C5.
- Texto organizado visualmente ou com linguagem rebuscada não é nota alta por si: rebuscamento sem conteúdo concreto é sinal de fraqueza, não de qualidade.
- Repertório filosófico sem conexão material com o problema não credita C2 nem C3.
- Cada apontamento (positivo ou negativo) precisa citar um trecho literal do texto como prova, nunca uma impressão geral.
- Isso vale nos dois sentidos: não infle uma competência fraca, mas também não deflacione uma competência que genuinamente cumpre o descritor de 200 só por cautela ou para "sobrar espaço de melhoria". Se a evidência do texto bate com o descritor de 200 da rubrica, a nota é 200, ponto final.`;

// Vocabulário fixo de sinais de superficialidade. A IA só marca quais observou;
// o que cada quantidade de sinais FAZ com a nota é decidido em código (calibrarNota),
// pra não dar à IA um número-alvo pra "acertar".
export const SINAIS_SUPERFICIALIDADE = [
  "argumentacao_generica",
  "repertorio_pouco_articulado",
  "tese_previsivel_sem_aprofundamento",
  "proposta_incompleta_ou_generica",
  "coesao_apenas_basica",
  "desenvolvimento_curto",
  "periodos_vagos",
  "pouca_analise_causa_consequencia",
] as const;

export type SinalSuperficialidade = (typeof SINAIS_SUPERFICIALIDADE)[number];

export type FlagsCalibracao = {
  paragrafoUnicoOuDesenvolvimentoMuitoCurto: boolean;
};

export type CompetenciaAvaliada = {
  nome: string;
  nota: number;
  evidencia?: string;
  comentario: string;
};

export type ResultadoCalibracao = {
  notaBruta: number;
  notaFinal: number;
  travaAplicada: string | null;
};

/**
 * Aplica as travas de calibração de forma determinística (não é a IA que decide
 * o corte numérico — ela só reporta sinais e flags; o código decide o teto).
 * Baseado na metodologia do projeto corretor-enem, mas reduzida às duas travas
 * mais objetivas: parágrafo único e 3+ sinais de superficialidade confirmados.
 * As travas de "2 sinais" e de "requisitos extras para manter 800+" foram
 * removidas por punirem texto bom demais em cima de sinais frágeis/subjetivos.
 */
export function calibrarNota(
  competencias: CompetenciaAvaliada[],
  sinais: string[],
  flags: FlagsCalibracao
): ResultadoCalibracao {
  const notaBruta = competencias.reduce((soma, c) => soma + c.nota, 0);
  const sinaisValidos = sinais.filter((s) =>
    (SINAIS_SUPERFICIALIDADE as readonly string[]).includes(s)
  );

  let teto = 1000;
  let motivo: string | null = null;

  if (flags.paragrafoUnicoOuDesenvolvimentoMuitoCurto) {
    teto = 640;
    motivo = "parágrafo único ou desenvolvimento muito curto (teto pedagógico de 640)";
  } else if (sinaisValidos.length >= 3) {
    teto = 640;
    motivo = `${sinaisValidos.length} sinais de superficialidade confirmados: ${sinaisValidos.join(", ")} (teto de 640)`;
  }

  const notaFinal = Math.min(notaBruta, teto);

  return { notaBruta, notaFinal, travaAplicada: notaFinal < notaBruta ? motivo : null };
}
