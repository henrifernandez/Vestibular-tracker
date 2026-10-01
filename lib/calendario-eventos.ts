// Dados da pagina /calendario: calendario de estudos de 30/09 a 15/11/2026.
// Snapshot do Google Calendar (30/09/2026) mais a proposta das proximas semanas.
// Para atualizar, edite este arquivo (ou gere de novo a partir do calendario).

export type Categoria =
  | "fis" | "mat" | "quim" | "nat" | "hum" | "ling" | "red" | "rev"
  | "generico" | "prova" | "marco";

export type EventoRota = {
  d: string; // YYYY-MM-DD
  s?: string; // HH:MM
  e?: string; // HH:MM
  t: string;
  c: Categoria;
  x?: string; // descricao
};

export const EVENTOS: EventoRota[] = [
 {
  "d": "2026-09-30",
  "s": "15:00",
  "e": "18:00",
  "t": "Física C13 e C14 (atrasadas)",
  "c": "fis",
  "x": "Duas aulas atrasadas de Física, 1h30 cada. Fazer os exercícios de cada aula e registrar erros no caderno de erros."
 },
 {
  "d": "2026-09-30",
  "s": "18:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-09-30",
  "s": "22:00",
  "e": "22:51",
  "t": "Química: Hidrocarbonetos (opcional)",
  "c": "quim",
  "x": "Sete aulas da plataforma em 2x (cerca de 51 min). Os exercícios de Hidrocarbonetos ficam para sexta 02/10. Revisão de Matemática às 19:00 continua fixa."
 },
 {
  "d": "2026-10-01",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-01",
  "s": "17:00",
  "e": "18:30",
  "t": "Física do dia (ou questões de Linguagens)",
  "c": "fis",
  "x": "Sem Química hoje. Se houver aula nova de Física, faça-a. Se não, questões de Linguagens. Revisão de Física às 19:00 continua fixa."
 },
 {
  "d": "2026-10-01",
  "s": "18:30",
  "e": "19:00",
  "t": "Caderno de erros",
  "c": "rev"
 },
 {
  "d": "2026-10-01",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-02",
  "s": "15:00",
  "e": "15:51",
  "t": "Química: aulas de Hidrocarbonetos",
  "c": "quim",
  "x": "Sete aulas da plataforma em 2x (cerca de 51 min). Se você fizer essas aulas na quarta às 22h, pule este bloco e comece direto nos exercícios, adiantando o resto da sexta em 51 min."
 },
 {
  "d": "2026-10-02",
  "s": "15:51",
  "e": "17:49",
  "t": "Química: exercícios de Hidrocarbonetos, Oxigenadas e Nitrogenadas",
  "c": "quim",
  "x": "15:51 exercícios de Hidrocarbonetos (20 min), 16:11 Funções Oxigenadas (56 min), 17:07 Funções Nitrogenadas (42 min). Aulas em 2x e 20 min de exercícios por assunto. Sexta de Química, vai até terminar. Jantar das 17:49 às 18:19."
 },
 {
  "d": "2026-10-02",
  "s": "18:19",
  "e": "19:19",
  "t": "Química: Propriedades Físicas e Químicas",
  "c": "quim",
  "x": "Quatro aulas em 2x mais 20 min de exercícios e simulado. Antes, pausa para jantar das 17:49 às 18:19."
 },
 {
  "d": "2026-10-02",
  "s": "19:19",
  "e": "20:30",
  "t": "Química: Isomeria",
  "c": "quim",
  "x": "Seis aulas em 2x mais 20 min de exercícios e simulado."
 },
 {
  "d": "2026-10-02",
  "s": "20:40",
  "e": "23:04",
  "t": "Química: Reações Orgânicas (última, fecha Química)",
  "c": "quim",
  "x": "Nove aulas em 2x (cerca de 2h04) mais 20 min de exercícios e simulado. Pausa de 10 min antes, das 20:30 às 20:40. Se passar de 23:04 e estiver cansado, o restante vai para sábado às 09:00 (antes da Redação 1 às 10:00), mas Química não passa de sábado."
 },
 {
  "d": "2026-10-02",
  "s": "23:04",
  "e": "23:19",
  "t": "Caderno de erros de Química",
  "c": "quim"
 },
 {
  "d": "2026-10-03",
  "s": "10:00",
  "e": "12:00",
  "t": "Redação 1 (padrão Enem e Provão, cronometrada)",
  "c": "red",
  "x": "Padrão Enem, com detalhamento na conclusão (superconjunto do Provão). Sem consulta e sem repertório colado de fora. Ao terminar, enviar a versão original para correção na plataforma do Ferreto. A IA só avalia depois da sua reescrita, uma avaliação por redação. Registrar a nota de cada competência no vault."
 },
 {
  "d": "2026-10-03",
  "s": "12:30",
  "e": "13:30",
  "t": "Revisão de Natureza",
  "c": "nat",
  "x": "Física e Química guiadas pelo caderno de erros. Também é a folga de Reações Orgânicas, se algo sobrar da sexta."
 },
 {
  "d": "2026-10-03",
  "s": "14:30",
  "e": "15:50",
  "t": "Simulado de Linguagens (19 questões, cronometrado)",
  "c": "ling",
  "x": "Português e Literatura 12 questões e Inglês 7, no ritmo da prova."
 },
 {
  "d": "2026-10-03",
  "s": "16:00",
  "e": "17:00",
  "t": "Correção do simulado de Linguagens no RemNote",
  "c": "ling",
  "x": "Registrar erros por tipo no Caderno de erros."
 },
 {
  "d": "2026-10-03",
  "s": "17:30",
  "e": "19:30",
  "t": "Revisão de Linguagens pelos erros",
  "c": "ling"
 },
 {
  "d": "2026-10-04",
  "s": "09:00",
  "e": "10:30",
  "t": "Simulado de Humanas (20 questões, cronometrado)",
  "c": "hum",
  "x": "História 7, Geografia 7, Filosofia 3 e Sociologia 3, no ritmo da prova (cerca de 4 min por questão)."
 },
 {
  "d": "2026-10-04",
  "s": "10:30",
  "e": "12:00",
  "t": "Correção do simulado de Humanas no RemNote",
  "c": "hum",
  "x": "Registrar cada erro por tipo no Caderno de erros. Esse resultado decide quantas horas de Humanas entram na revisão grande de 10/10."
 },
 {
  "d": "2026-10-04",
  "s": "14:00",
  "e": "15:00",
  "t": "Reescrita da Redação 1",
  "c": "red",
  "x": "Reescrever sozinho, corrigindo os pontos que você mesmo identificar. Só depois pedir a avaliação da IA."
 },
 {
  "d": "2026-10-04",
  "s": "15:00",
  "e": "16:30",
  "t": "Revisão de Natureza (Biologia e Matemática)",
  "c": "mat",
  "x": "Guiada pelo caderno de erros. Sem conteúdo novo, a Química já foi fechada na sexta."
 },
 {
  "d": "2026-10-04",
  "s": "16:30",
  "e": "17:00",
  "t": "Caderno de erros da semana",
  "c": "rev"
 },
 {
  "d": "2026-10-05",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-05",
  "s": "15:00",
  "e": "16:20",
  "t": "Revisão de Humanas pelos erros do simulado",
  "c": "hum",
  "x": "Guiada pelos erros do simulado de Humanas de domingo."
 },
 {
  "d": "2026-10-05",
  "s": "16:30",
  "e": "17:30",
  "t": "Caderno de erros de Humanas e Linguagens",
  "c": "hum",
  "x": "Registrar e revisar os erros dos dois simulados."
 },
 {
  "d": "2026-10-05",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-05",
  "s": "17:30",
  "e": "19:00",
  "t": "Revisão de Natureza guiada por erros",
  "c": "nat",
  "x": "A partir de hoje não há conteúdo novo em nenhuma matéria. Revisar Biologia, Química, Física e Matemática em rodízio, guiado pelo Caderno de erros."
 },
 {
  "d": "2026-10-05",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-06",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-06",
  "s": "17:00",
  "e": "19:00",
  "t": "Questões de Linguagens",
  "c": "ling"
 },
 {
  "d": "2026-10-06",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-07",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-07",
  "s": "15:00",
  "e": "17:00",
  "t": "Redação 2 (padrão Enem e Provão, cronometrada)",
  "c": "red",
  "x": "Com detalhamento na conclusão. Sem consulta. Reescrita no sábado 10/10. Se uma competência ficou abaixo de 120 na Redação 1 e nesta, a próxima treina só ela."
 },
 {
  "d": "2026-10-07",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-07",
  "s": "17:00",
  "e": "19:00",
  "t": "Revisão de Natureza",
  "c": "nat"
 },
 {
  "d": "2026-10-07",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-08",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-08",
  "s": "17:00",
  "e": "19:00",
  "t": "Questões de Humanas",
  "c": "hum"
 },
 {
  "d": "2026-10-08",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-09",
  "s": "14:00",
  "e": "16:00",
  "t": "Questões de Linguagens",
  "c": "ling"
 },
 {
  "d": "2026-10-09",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-09",
  "s": "16:00",
  "e": "18:00",
  "t": "Questões de Humanas",
  "c": "hum"
 },
 {
  "d": "2026-10-09",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-09",
  "s": "18:30",
  "e": "21:00",
  "t": "Revisão de Natureza",
  "c": "nat"
 },
 {
  "d": "2026-10-09",
  "s": "19:00",
  "e": "22:00",
  "t": "Estudo: bloco final da sexta (a definir)",
  "c": "generico"
 },
 {
  "d": "2026-10-09",
  "s": "21:00",
  "e": "22:00",
  "t": "Caderno de erros (RemNote)",
  "c": "rev"
 },
 {
  "d": "2026-10-10",
  "s": "09:00",
  "e": "13:00",
  "t": "Revisão grande de Humanas",
  "c": "hum",
  "x": "Guiada pelos erros do simulado de Humanas de 04/10. Sem conteúdo novo."
 },
 {
  "d": "2026-10-10",
  "s": "14:00",
  "e": "15:00",
  "t": "Reescrita da Redação 2",
  "c": "red"
 },
 {
  "d": "2026-10-10",
  "s": "16:00",
  "e": "18:00",
  "t": "Redação 3 (padrão Enem e Provão, cronometrada)",
  "c": "red",
  "x": "Ao terminar, enviar a versão original para correção na plataforma do Ferreto (segunda calibração do avaliador). Reescrita no domingo 11/10."
 },
 {
  "d": "2026-10-10",
  "s": "19:00",
  "e": "21:00",
  "t": "Questões de Humanas",
  "c": "hum"
 },
 {
  "d": "2026-10-11",
  "s": "09:00",
  "e": "12:30",
  "t": "Revisão grande de Linguagens",
  "c": "ling",
  "x": "Guiada pelos erros do simulado de Linguagens de 05/10. Sem conteúdo novo."
 },
 {
  "d": "2026-10-11",
  "s": "14:00",
  "e": "15:00",
  "t": "Reescrita da Redação 3",
  "c": "red"
 },
 {
  "d": "2026-10-11",
  "s": "15:00",
  "e": "18:00",
  "t": "Simulado misto (ritmo da 1ª fase)",
  "c": "rev",
  "x": "Cronometrado, com a proporção de áreas da Unicamp. Correção e caderno de erros ao final."
 },
 {
  "d": "2026-10-12",
  "s": "15:00",
  "e": "17:00",
  "t": "Correção do simulado misto",
  "c": "rev"
 },
 {
  "d": "2026-10-12",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-12",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-12",
  "s": "17:30",
  "e": "19:00",
  "t": "Revisão de Natureza",
  "c": "nat"
 },
 {
  "d": "2026-10-12",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-13",
  "t": "Refazer a análise de produtividade e ajustar o plano",
  "c": "marco"
 },
 {
  "d": "2026-10-13",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-13",
  "s": "17:00",
  "e": "19:00",
  "t": "Questões de Linguagens e Humanas",
  "c": "hum"
 },
 {
  "d": "2026-10-13",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-14",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-14",
  "s": "15:00",
  "e": "17:00",
  "t": "Redação 4 (formato Provão, sem detalhamento)",
  "c": "red",
  "x": "Proposta com 4 elementos (ação, agente, modo e efeito), sem detalhamento, para ensaiar o formato do Provão. Última antes da 1ª fase. Reescrita na manhã de sábado 17/10."
 },
 {
  "d": "2026-10-14",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-14",
  "s": "17:00",
  "e": "19:00",
  "t": "Revisão de Natureza",
  "c": "nat"
 },
 {
  "d": "2026-10-14",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-15",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-15",
  "s": "17:00",
  "e": "19:00",
  "t": "Questões de Linguagens e Humanas",
  "c": "hum"
 },
 {
  "d": "2026-10-15",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-16",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-16",
  "s": "15:00",
  "e": "17:00",
  "t": "Questões mistas",
  "c": "rev"
 },
 {
  "d": "2026-10-16",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-16",
  "s": "17:00",
  "e": "19:00",
  "t": "Revisão leve de Natureza",
  "c": "nat"
 },
 {
  "d": "2026-10-16",
  "s": "19:00",
  "e": "21:00",
  "t": "Correção e caderno de erros (RemNote)",
  "c": "rev"
 },
 {
  "d": "2026-10-16",
  "s": "19:00",
  "e": "22:00",
  "t": "Estudo: bloco final da sexta (a definir)",
  "c": "generico"
 },
 {
  "d": "2026-10-17",
  "s": "09:00",
  "e": "12:00",
  "t": "Véspera da 1ª fase: reescrita da Redação 4 e erros",
  "c": "rev",
  "x": "Só reescrita da Redação 4 e releitura dos erros. Sem conteúdo novo. Dormir bem vale mais que horas extras."
 },
 {
  "d": "2026-10-18",
  "t": "Unicamp 2027 - 1ª fase",
  "c": "prova",
  "x": "72 questões objetivas em 5 h. Datas conferidas em 10/09/2026, validar no edital da Comvest. Última semana: reduzir conteúdo novo e revisar erros."
 },
 {
  "d": "2026-10-19",
  "t": "Marco: transição Unicamp para FUVEST",
  "c": "marco",
  "x": "Corrigir a Unicamp só o suficiente para aprender. Fazer ao menos uma prova ou simulado no estilo FUVEST e uma redação fora do molde Enem."
 },
 {
  "d": "2026-10-19",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-19",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-19",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-20",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-20",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-21",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-21",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-21",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-22",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-22",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-23",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-23",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-23",
  "s": "19:00",
  "e": "22:00",
  "t": "Estudo: bloco final da sexta (a definir)",
  "c": "generico"
 },
 {
  "d": "2026-10-26",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-26",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-26",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-27",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-27",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-28",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-28",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-28",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-10-29",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-29",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-10-30",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-10-30",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-10-30",
  "s": "19:00",
  "e": "22:00",
  "t": "Estudo: bloco final da sexta (a definir)",
  "c": "generico"
 },
 {
  "d": "2026-10-31",
  "t": "Aspen: decidir se o Aspen Network entra no TCC",
  "c": "marco",
  "x": "Ponto de decisão. Aspen Core segue como escopo do TCC. O Aspen Network só entra se estiver pronto antes da banca."
 },
 {
  "d": "2026-11-01",
  "t": "FUVEST 2027 - 1ª fase",
  "c": "prova",
  "x": "80 questões objetivas. Datas conferidas em 10/09/2026, validar no edital da FUVEST."
 },
 {
  "d": "2026-11-02",
  "t": "Marco: início da sequência FUVEST, Provão e Enem",
  "c": "marco",
  "x": "Sem conteúdo novo grande. Priorizar descanso, logística, revisão leve, caderno de erros e fórmulas essenciais."
 },
 {
  "d": "2026-11-02",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-11-02",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-02",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-11-03",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-03",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-11-04",
  "t": "Provão Paulista Seriado III",
  "c": "prova",
  "x": "Dia 1 (04/11) Linguagens, Natureza e redação. Dia 2 (05/11) Matemática e Humanas. Datas conferidas em 10/09/2026, validar no edital."
 },
 {
  "d": "2026-11-04",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-11-04",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-04",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-11-05",
  "t": "Provão Paulista Seriado III",
  "c": "prova",
  "x": "Dia 1 (04/11) Linguagens, Natureza e redação. Dia 2 (05/11) Matemática e Humanas. Datas conferidas em 10/09/2026, validar no edital."
 },
 {
  "d": "2026-11-05",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-05",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-11-06",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-11-06",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-06",
  "s": "19:00",
  "e": "22:00",
  "t": "Estudo: bloco final da sexta (a definir)",
  "c": "generico"
 },
 {
  "d": "2026-11-08",
  "t": "Enem 2026 - dia 1",
  "c": "prova",
  "x": "Linguagens, Redação e Ciências Humanas. Datas conferidas em 10/09/2026, validar no edital do Inep."
 },
 {
  "d": "2026-11-09",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-11-09",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-09",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-11-10",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-10",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-11-11",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-11-11",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-11",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Matemática",
  "c": "mat",
  "x": "Últimas 3 horas do dia. Segunda e quarta, alternando com Física em terça e quinta. Guiar a revisão por erros recentes e questões mistas."
 },
 {
  "d": "2026-11-12",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-12",
  "s": "19:00",
  "e": "22:00",
  "t": "Revisão de Física",
  "c": "fis",
  "x": "Últimas 3 horas do dia. Terça e quinta, alternando com Matemática em segunda e quarta. Começar pelo modelo do fenômeno antes das fórmulas."
 },
 {
  "d": "2026-11-13",
  "s": "15:00",
  "e": "17:00",
  "t": "Estudo: simulado, questões ou flashcards",
  "c": "generico"
 },
 {
  "d": "2026-11-13",
  "s": "17:00",
  "e": "19:00",
  "t": "Estudo: bloco principal",
  "c": "generico"
 },
 {
  "d": "2026-11-13",
  "s": "19:00",
  "e": "22:00",
  "t": "Estudo: bloco final da sexta (a definir)",
  "c": "generico"
 },
 {
  "d": "2026-11-15",
  "t": "Enem 2026 - dia 2",
  "c": "prova",
  "x": "Ciências da Natureza e Matemática. Datas conferidas em 10/09/2026, validar no edital do Inep."
 }
];

// Itens propostos que ainda não estão no Google Calendar
export const PROPOSTA: Record<string, string[]> = {
  "2026-10-11": ["18h30-22h correção do simulado e questões de Matemática"],
  "2026-10-12": ["9h-12h Natureza (Biologia e Química)", "14h-16h Humanas e 16h-17h30 Linguagens"],
  "2026-10-13": ["9h-12h Matemática", "14h-16h Natureza (Bio e Quím) e 16h-17h Linguagens e Humanas"],
  "2026-10-14": ["9h-12h Humanas", "14h-15h Linguagens"],
  "2026-10-15": ["9h-12h Matemática", "14h-17h Natureza (Física e Química)"],
  "2026-10-16": ["9h-12h questões mistas no ritmo da prova"],
  "2026-10-19": ["Balanço da Unicamp e caderno de erros"],
  "2026-10-21": ["15h-17h Redação 5 (Enem)"],
  "2026-10-24": ["Redação 6 cronometrada"],
  "2026-10-25": ["Reescrita da Redação 6", "Simulado FUVEST, 80 questões cronometrado"],
  "2026-10-26": ["Correção do simulado FUVEST e caderno de erros"],
  "2026-10-28": ["15h-17h Redação 7"],
  "2026-10-30": ["Dia leve"],
  "2026-10-31": ["Véspera leve, só erros e dormir cedo"],
  "2026-11-02": ["Descanso e conferir o gabarito da FUVEST"],
  "2026-11-03": ["Revisão para o Provão Paulista"],
  "2026-11-06": ["Linguagens e Humanas"],
  "2026-11-07": ["Reescrita curta de Redação e véspera leve"],
  "2026-11-09": ["Corrigir os erros do dia 1"],
  "2026-11-10": ["Física e Natureza"],
  "2026-11-11": ["Matemática"],
  "2026-11-12": ["Física e Natureza"],
  "2026-11-13": ["Questões mistas, ritmo leve"],
  "2026-11-14": ["Véspera leve"],
};

export const MARCOS_PROVA: { d: string; nome: string; detalhe: string }[] = [
  { d: "2026-10-18", nome: "Unicamp", detalhe: "1ª fase" },
  { d: "2026-11-01", nome: "FUVEST", detalhe: "1ª fase" },
  { d: "2026-11-04", nome: "Provão Paulista", detalhe: "3ª série" },
  { d: "2026-11-08", nome: "Enem", detalhe: "dia 1" },
  { d: "2026-11-15", nome: "Enem", detalhe: "dia 2" },
];

export const SEMANAS: Record<string, string> = {
  "2026-09-28": "Etec, e Química fechada na sexta",
  "2026-10-05": "Simulados, redações e revisão por erros",
  "2026-10-12": "Semana da Comvest, em casa",
  "2026-10-19": "Erros da Unicamp e simulado FUVEST",
  "2026-10-26": "Fechar a FUVEST",
  "2026-11-02": "Provão Paulista e Enem dia 1",
  "2026-11-09": "Enem dia 2, Matemática e Natureza",
};
