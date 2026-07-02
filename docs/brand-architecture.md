# Brand Architecture & Product Naming

> **Tipo:** Documentação conceitual e oficial
> **Escopo:** Arquitetura de marca e nomenclatura de produtos do ecossistema Altech
> **Impacto técnico:** Nenhum — esta atualização não altera o escopo do MVP, regras de negócio, autenticação, multi-tenant, RBAC, banco de dados, Supabase, módulos, contratos de API ou integrações.

---

## 1. Visão Geral da Arquitetura de Marca

A marca **Altech** é a identidade institucional que representa a empresa, o ecossistema e a governança tecnológica por trás dos produtos SaaS. Dentro desse ecossistema, cada produto tem uma finalidade específica, um público-alvo distinto e limites de escopo bem definidos.

A arquitetura de marca segue a seguinte estrutura:

```text
Altech (marca-mãe / ecossistema)
├── Altech Project  → gestão de projetos e agilidade
├── Altech Control  → governança, controle e operação dos SaaS
└── Altech View     → dashboards executivos e visão de cliente
```

---

## 2. Marca-mãe: Altech

A marca **Altech** deve ser usada quando a referência for:

- a empresa e identidade institucional;
- o ecossistema de produtos SaaS;
- a tecnologia, segurança e governança compartilhadas;
- o conjunto de capacidades e produtos da organização.

**Exemplos de uso correto:**

- "A Altech desenvolve soluções SaaS para gestão e governança."
- "O ecossistema Altech reúne produtos especializados em projetos, controle e visualização."

---

## 3. Produtos do Ecossistema

| Produto | Status | Finalidade | Público principal | Escopo resumido |
|---|---|---|---|---|
| **Altech Project** | Em desenvolvimento (MVP) | Gestão de projetos, gestão ágil, backlog, sprint, board, work items, dashboards operacionais do projeto e acompanhamento de entregas. | Times de projeto, Scrum Masters, Product Owners, gestores de entrega. | Projetos, backlog, sprints, boards, work items, anexos, permissões, multi-tenant, auditoria e governança básica. |
| **Altech Control** | Produto futuro | Controle de tenants, ativação de produtos e módulos, gestão de planos, billing, cobrança, usuários admin master, controle de licenças e governança SaaS. | Administradores da plataforma, times comerciais e financeiros. | SaaS operations, tenant lifecycle, billing, licenciamento, admin master. |
| **Altech View** | Produto futuro | Dashboards executivos, indicadores consolidados, visão de cliente, acompanhamento de performance, relatórios visuais e painéis gerenciais. | Executivos, stakeholders, clientes e gestores de conta. | BI executivo, visão consolidada, relatórios, painéis gerenciais. |

---

## 4. Regras de Nomenclatura

### 4.1. Altech

Usar **Altech** quando a referência for institucional ou relacionada ao ecossistema.

- ✅ "A Altech oferece produtos SaaS para gestão e governança."
- ✅ "A arquitetura de segurança do ecossistema Altech é compartilhada entre os produtos."
- ❌ "O dashboard do Altech é chamado de Altech View." (uso incorreto — o dashboard interno pertence ao Altech Project)

### 4.2. Altech Project

Usar **Altech Project** quando a referência for ao produto atual de gestão de projetos.

- ✅ "O Altech Project permite gerenciar projetos, sprints, backlogs e work items."
- ✅ "O MVP do Altech Project inclui dashboard operacional do projeto."
- ❌ "O Altech Project controla billing e ativação de tenants." (fora do escopo do produto atual)

### 4.3. Altech Control

Usar **Altech Control** apenas quando a referência for ao produto futuro de controle de SaaS, billing, tenants e ativações.

- ✅ "O Altech Control será responsável pela gestão de planos e cobrança."
- ❌ "O Altech Control faz parte do MVP atual." (não faz parte)

### 4.4. Altech View

Usar **Altech View** apenas quando a referência for ao produto futuro de dashboards executivos e visão de clientes.

- ✅ "O Altech View oferecerá dashboards executivos consolidados."
- ❌ "O dashboard interno do Altech Project é o Altech View." (confunde produtos distintos)

### 4.5. Proibições e Cuidados

- Não chamar o dashboard interno do Altech Project de **Altech View**.
- Não misturar responsabilidades entre produtos.
- Não usar "Altech" isolado para referir-se a uma funcionalidade específica do Altech Project quando o contexto exigir precisão de produto.

---

## 5. Impacto no MVP Atual

A mudança de arquitetura de marca **não altera** o escopo funcional do MVP.

O MVP atual continua sendo o **Altech Project**, e continua contendo:

- gestão de projetos;
- backlog;
- sprint;
- board;
- work item details;
- dashboards operacionais;
- anexos;
- permissões;
- multi-tenant;
- auditoria;
- governança básica.

A nomenclatura "Altech Project" passa a ser a identificação oficial do produto em desenvolvimento. Nenhum módulo, regra de negócio, fluxo ou integração do MVP é modificado.

---

## 6. Limites de Escopo

### 6.1. Dentro do MVP do Altech Project

- gestão de projetos e tarefas;
- planejamento e acompanhamento de sprints;
- backlog de trabalho;
- board visual (Kanban / workflow);
- detalhamento de work items;
- anexos e indicador de armazenamento;
- dashboards operacionais do projeto;
- permissões, multi-tenant e auditoria básica.

### 6.2. Fora do Escopo do MVP Atual

- billing e cobrança (Altech Control);
- ativação de produtos e módulos (Altech Control);
- controle de tenants e licenças (Altech Control);
- dashboards executivos de cliente (Altech View);
- relatórios gerenciais consolidados (Altech View);
- indicadores de performance de negócio (Altech View).

---

## 7. Riscos de Confusão entre Produtos

| Risco | Descrição | Mitigação |
|---|---|---|
| Dashboard interno vs. Altech View | O Altech Project possui dashboards operacionais que podem ser confundidos com o produto futuro Altech View. | Sempre usar "dashboard operacional do Altech Project" ou "dashboard interno do projeto" para referir-se ao MVP atual. Reservar "Altech View" para o produto futuro de BI executivo. |
| Admin vs. admin master | O MVP inclui permissões e governança básica, mas não o controle de usuários admin master da plataforma. | Usar "admin do projeto" para o Altech Project e "admin master da plataforma" para o Altech Control. |
| Tenant vs. projeto | O multi-tenant do Altech Project é uma camada de isolamento, não o controle comercial de tenants. | Usar "organização" ou "tenant do projeto" no Altech Project; reservar "gestão de tenants" para o Altech Control. |
| Altech genérico vs. produto específico | Usar "Altech" para tudo pode obscurecer a qual produto se refere a funcionalidade. | Preferir "Altech Project", "Altech Control" ou "Altech View" quando o contexto técnico ou funcional exigir. |

---

## 8. Recomendações de Consistência Textual

Para manter a documentação futura coerente com a arquitetura de marca:

1. **Seja específico:** sempre que possível, nomeie o produto ao qual a funcionalidade pertence.
2. **Evite sinônimos improvisados:** não crie variações como "Altech Projects", "Altech Dashboard" ou "Altech Admin" sem definição prévia.
3. **Use "Altech" para contexto institucional:** logo, apresentação institucional, ecossistema, governança e segurança compartilhada.
4. **Use "Altech Project" para o produto em desenvolvimento:** funcionalidades do MVP, roadmap de curto prazo e documentação de uso.
5. **Mencione "Altech Control" e "Altech View" apenas como produtos futuros:** roadmap de médio/longuro prazo, arquitetura de ecossistema e delimitação de escopo.
6. **Revise cross-references:** quando um documento mencionar dashboard, permissões, tenants ou billing, verifique se o termo está alinhado ao produto correto.
7. **Mantenha este documento como referência:** em caso de dúvida, consultar esta arquitetura de marca antes de publicar novos textos oficiais.

---

## 9. Histórico de Decisões

- **Decisão atual:** o produto em desenvolvimento passa a ser oficialmente chamado de **Altech Project**.
- **Produtos futuros registrados:** **Altech Control** e **Altech View**.
- **Marca-mãe:** **Altech** permanece como identidade institucional e ecossistema.
- **Escopo técnico:** inalterado — esta decisão é exclusivamente documental e conceitual.
