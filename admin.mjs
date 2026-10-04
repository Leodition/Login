const API = "https://acervo-leoalfa.onrender.com";
const TOKEN_KEY = "leodition_central_token";
const RETURN_KEY = "leodition_admin_return";
const PREVIEW_KEY = "leodition_preview_destination";
const PRODUCT_GROUPS = [
  {
    id: "colegio",
    title: "Colégio Leonardo da Vinci",
    description: "Serviços, sistemas e conteúdos do colégio.",
    items: [
      { title: "Acervo e Biblioteca", detail: "Biblioteca e ferramentas administrativas", destination: "acervo", category: "Sistema", icon: "▤" },
      { title: "Reprografia", detail: "Reprografia, Lellos, agenda e ferramentas", destination: "repografia", category: "Sistema", icon: "▧" },
      { title: "Jogos", detail: "Jogos educativos integrados ao Acervo", destination: "acervo", category: "Módulo", icon: "◇" },
      { title: "Monitor", detail: "Acompanhamento pelo sistema Acervo", destination: "acervo", category: "Módulo", icon: "◉" },
      { title: "Revista", detail: "Revista digital disponível pelo Acervo", destination: "acervo", category: "Módulo", icon: "▱" }
    ]
  },
  {
    id: "enquadrilhos",
    title: "Enquadrilhos",
    description: "Aplicativo independente, com acessos e permissões próprios.",
    items: []
  }
];
const PRODUCTS = PRODUCT_GROUPS.flatMap((group) => group.items.map((product) => ({ ...product, group: group.id })));
const VIEWS = [
  ["inicio", "Visão geral", "⌂"],
  ["sites", "Sites e acessos", "▦"],
  ["configuracoes", "Configurações", "⚙"],
  ["usuarios", "Usuários e permissões", "♙"],
  ["aprovacoes", "Aprovações", "✓"],
  ["alteracoes", "Alterações", "↻"]
];
const byId = (id) => document.getElementById(id);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const token = () => localStorage.getItem(TOKEN_KEY);
let panel;
let returnControl;
let activeView = "inicio";
let products = [];
let checkId = 0;
let previewStarted = false;
let currentUser = null;
let releaseData = null;

async function api(path, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: "Bearer " + token() } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Não foi possível concluir.");
  return data;
}

function button(label, className, action) {
  const node = el("button", className, label);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

function openDestination(id) {
  const index = products.findIndex((item) => item.id === id);
  const choices = [...byId("services").querySelectorAll("button")];
  if (index < 0 || !choices[index]) {
    panel.querySelector("[data-admin-message]").textContent = "Esse acesso não está disponível para esta conta.";
    return;
  }
  choices[index].click();
}

function productCard(product, compact = false) {
  const card = el("article", compact ? "product-card product-card-compact" : "product-card");
  const icon = el("span", "product-icon", product.icon);
  icon.setAttribute("aria-hidden", "true");
  const info = el("div", "product-card-info");
  info.append(el("span", "product-kicker", product.category === "Sistema" ? "SISTEMA INTEGRADO" : "MÓDULO DO ACERVO"));
  info.append(el("h3", "", product.title), el("p", "", product.detail));
  const action = button(compact ? "Abrir →" : "Abrir como AdmLeodition →", "admin-button admin-button-primary", () => openDestination(product.destination));
  const preview = button("Visualizar como usuário", "admin-button admin-button-secondary", () => showUserPreview(product.destination));
  card.append(icon, info, el("div", "product-card-actions"));
  card.lastElementChild.append(action, preview);
  return card;
}

async function showUserPreview(destination) {
  const message = panel.querySelector("[data-admin-message]");
  try {
    const result = await api("/api/auth/status");
    const accounts = (result.usuarios || []).filter((user) => user.usuario.toLowerCase() !== "leodition");
    if (!accounts.length) {
      message.textContent = "Não há outras contas disponíveis para visualizar.";
      return;
    }
    const dialog = document.createElement("dialog");
    dialog.className = "admin-preview-dialog";
    const form = el("form", "");
    form.method = "dialog";
    form.append(el("p", "admin-eyebrow", "VISUALIZAÇÃO DE ACESSO"), el("h2", "", "Escolha uma conta"));
    form.append(el("p", "admin-muted", "Você entrará no sistema como a conta escolhida. A sessão AdmLeodition ficará guardada nesta aba para permitir que você volte à central."));
    const label = el("label", "admin-label", "Conta para visualizar");
    const select = document.createElement("select");
    select.required = true;
    select.append(new Option("Selecione uma conta", ""));
    accounts.forEach((user) => select.append(new Option((user.nome || user.usuario) + " · @" + user.usuario, user.usuario)));
    label.append(select);
    const actions = el("div", "admin-dialog-actions");
    const cancel = button("Cancelar", "admin-button admin-button-secondary", () => dialog.close());
    const proceed = button("Continuar", "admin-button admin-button-primary", () => {});
    proceed.type = "submit";
    actions.append(cancel, proceed);
    form.append(label, actions);
    dialog.append(form);
    document.body.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!select.value) return;
      sessionStorage.setItem(RETURN_KEY, token());
      sessionStorage.setItem(PREVIEW_KEY, destination);
      previewStarted = false;
      byId("account").hidden = true;
      byId("loginForm").hidden = false;
      byId("username").value = select.value;
      byId("password").value = "";
      byId("password").focus();
      byId("status").textContent = "Digite a senha mestra já configurada para a conta Leodition. Você verá apenas os sistemas permitidos à conta escolhida.";
      document.body.classList.remove("admin-mode");
      panel.remove();
      panel = null;
      byId("loginForm").scrollIntoView({ behavior: "smooth", block: "center" });
      dialog.close();
    });
    dialog.showModal();
  } catch (error) {
    message.textContent = error.message;
  }
}

function shellHeader() {
  const top = el("header", "admin-topbar");
  const left = el("div", "admin-topbar-left");
  left.append(button("☰", "admin-menu-toggle", () => panel.classList.toggle("sidebar-open")));
  const crumb = el("div", "admin-breadcrumb");
  crumb.append(el("span", "admin-eyebrow", "CENTRAL DE GESTÃO"), el("strong", "admin-page-title", "Visão geral"));
  left.append(crumb);
  const right = el("div", "admin-topbar-right");
  const user = el("div", "admin-user-chip");
  user.append(el("span", "admin-avatar", "L"), el("span", "admin-user-name", currentUser?.nome || "Leodition"));
  right.append(user, button("Sair", "admin-logout", () => byId("switchAccount").click()));
  top.append(left, right);
  return top;
}

function shellSidebar() {
  const side = el("aside", "admin-sidebar");
  const brand = el("a", "admin-brand");
  brand.href = "https://leodition.com.br/";
  brand.append(el("span", "admin-brand-mark", "L"));
  const brandText = el("span", "admin-brand-text");
  brandText.append(el("strong", "", "Leodition"), el("small", "", "CENTRAL ADMINISTRATIVA"));
  brand.append(brandText);
  const section = el("p", "admin-sidebar-label", "ESPAÇO DE GESTÃO");
  const nav = el("nav", "admin-nav");
  nav.setAttribute("aria-label", "Menu administrativo");
  VIEWS.forEach(([key, label, icon]) => {
    const item = button("", "admin-nav-item", () => navigate(key));
    item.dataset.view = key;
    item.append(el("span", "admin-nav-icon", icon), el("span", "", label));
    nav.append(item);
  });
  const spacer = el("div", "admin-sidebar-spacer");
  const help = el("div", "admin-sidebar-help");
  help.append(el("span", "admin-sidebar-label", "PRECISA DE AJUDA?"));
  const whatsapp = el("a", "", "Falar pelo WhatsApp ↗");
  whatsapp.href = "https://wa.me/5551998911304";
  whatsapp.target = "_blank";
  whatsapp.rel = "noopener";
  const email = el("a", "", "Enviar e-mail ↗");
  email.href = "mailto:comleodition@gmail.com";
  help.append(whatsapp, email);
  side.append(brand, section, nav, spacer, help, el("small", "admin-sidebar-version", "LEODITION · ADM"));
  return side;
}

function renderShell() {
  if (panel) panel.remove();
  panel = el("div", "admin-shell");
  panel.id = "adminConsole";
  panel.setAttribute("aria-label", "Painel administrativo AdmLeodition");
  const workspace = el("div", "admin-workspace");
  const page = el("div", "admin-page-content");
  const notice = el("p", "admin-form-message");
  notice.dataset.adminMessage = "";
  panel.append(shellSidebar(), workspace);
  workspace.append(shellHeader(), page, notice);
  document.body.append(panel);
  document.body.classList.add("admin-mode");
  navigate(activeView);
}

function navigate(view) {
  activeView = view;
  if (!panel) return;
  panel.classList.remove("sidebar-open");
  panel.querySelectorAll(".admin-nav-item").forEach((item) => {
    const active = item.dataset.view === view;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-current", active ? "page" : "false");
  });
  const page = panel.querySelector(".admin-page-content");
  page.replaceChildren();
  const title = VIEWS.find((item) => item[0] === view)?.[1] || "Visão geral";
  panel.querySelector(".admin-page-title").textContent = title;
  if (view === "inicio") renderOverview(page);
  else if (view === "sites") renderSites(page);
  else if (view === "configuracoes") void renderSettings(page);
  else if (view === "usuarios") void renderUsers(page);
  else if (view === "aprovacoes") renderApprovals(page);
  else if (view === "alteracoes") void renderChanges(page);
}

function sectionIntro(container, kicker, title, description) {
  const intro = el("section", "page-intro");
  intro.append(el("p", "admin-eyebrow", kicker), el("h1", "", title), el("p", "admin-muted", description));
  container.append(intro);
}

function metric(label, value, detail, icon) {
  const card = el("article", "admin-metric");
  card.append(el("span", "metric-icon", icon), el("span", "metric-label", label), el("strong", "metric-value", value), el("span", "metric-detail", detail));
  return card;
}

function renderOverview(container) {
  sectionIntro(container, "PAINEL DA LEODITION", "Olá, " + (currentUser?.nome || "Leodition"), "Sua central administrativa para acompanhar e acessar os produtos da Leodition.");
  const metrics = el("div", "admin-metrics");
  metrics.append(metric("Sistemas integrados", "02", "Acervo e Reprografia", "▦"), metric("Módulos vinculados", "03", "Jogos, Monitor e Revista", "◈"), metric("Acesso administrativo", "Ativo", "Perfil AdmLeodition", "✓"));
  container.append(metrics);
  const quick = el("section", "admin-content-section");
  const heading = el("div", "admin-section-heading");
  heading.append(el("div", "", "Acesso rápido"), button("Ver todos os sites →", "admin-text-button", () => navigate("sites")));
  quick.append(heading);
  const grid = el("div", "admin-product-grid admin-product-grid-home");
  PRODUCTS.forEach((product) => grid.append(productCard(product, true)));
  quick.append(grid);
  const lower = el("div", "admin-lower-grid");
  const status = el("article", "admin-info-card");
  status.append(el("p", "admin-eyebrow", "CENTRAL DE ACESSOS"), el("h2", "", "Tudo no mesmo lugar"), el("p", "admin-muted", "Entre nos sistemas integrados, confira a experiência das contas e encontre as configurações administrativas."));
  status.append(button("Abrir configurações →", "admin-button admin-button-secondary", () => navigate("configuracoes")));
  const support = el("article", "admin-info-card admin-info-card-accent");
  support.append(el("p", "admin-eyebrow", "SUPORTE"), el("h2", "", "Fale com a Leodition"), el("p", "admin-muted", "Escolha o canal de contato que preferir."));
  const links = el("div", "admin-support-links");
  const wa = el("a", "", "WhatsApp ↗");
  wa.href = "https://wa.me/5551998911304";
  wa.target = "_blank";
  wa.rel = "noopener";
  const email = el("a", "", "E-mail ↗");
  email.href = "mailto:comleodition@gmail.com";
  links.append(wa, email);
  support.append(links);
  lower.append(status, support);
  container.append(lower);
}

function renderSites(container) {
  sectionIntro(container, "PRODUTOS E SISTEMAS", "Sites e acessos", "Os serviços estão organizados por produto; os acessos de cada grupo serão gerenciados separadamente.");
  PRODUCT_GROUPS.forEach((group) => {
    const section = el("section", "admin-content-section");
    section.append(el("div", "admin-section-heading", group.title));
    section.append(el("p", "admin-muted", group.description));
    if (group.items.length) {
      const grid = el("div", "admin-product-grid");
      group.items.forEach((product) => grid.append(productCard(product)));
      section.append(grid);
    } else {
      const placeholder = el("article", "admin-info-card admin-group-placeholder");
      placeholder.append(el("p", "admin-eyebrow", "APLICATIVO INDEPENDENTE"), el("h2", "", "Espaço de acesso do Enquadrilhos"), el("p", "admin-muted", "O grupo fica separado do Colégio. A conexão de login e o gerenciamento de permissões serão habilitados quando o aplicativo estiver integrado."));
      section.append(placeholder);
    }
    container.append(section);
  });
}

function settingCard(icon, title, description, status) {
  const card = el("article", "admin-setting-card");
  card.append(el("span", "setting-icon", icon), el("div", "setting-copy"), el("span", "setting-status", status));
  card.children[1].append(el("h2", "", title), el("p", "admin-muted", description));
  return card;
}

async function renderSettings(container) {
  sectionIntro(container, "CONTROLE CENTRAL", "Configurações gerais", "Gerencie opções do Acervo, módulos ativos e menus visíveis pelo AdmLeodition.");
  const cards = el("div", "admin-settings-grid");
  cards.append(
    settingCard("◎", "Conta e segurança", "Perfil administrativo e proteção da sessão.", "Central de login"),
    settingCard("♙", "Usuários e permissões", "Acessos individuais separados por produto.", "Gerenciar contas"),
    settingCard("▧", "Sites e produtos", "Acervo e Enquadrilhos em áreas próprias.", "2 grupos"),
    settingCard("✓", "Aprovações", "Solicitações administrativas que aguardam decisão.", "Área preparada"),
    settingCard("↻", "Histórico de alterações", "Novidades e mudanças publicadas nos sistemas.", "Ver alterações")
  );
  container.append(cards);
  container.append(button("Abrir usuários e permissões →", "admin-button admin-button-primary", () => navigate("usuarios")));

  const menuCard = el("section", "admin-settings-panel");
  menuCard.append(el("p", "admin-eyebrow", "ACERVO · PERSONALIZAÇÃO"), el("h2", "", "Menus visíveis para a equipe"), el("p", "admin-muted", "Escolha quais áreas do Acervo aparecem no menu geral."));
  const menus = { livros: "Livros", alunos: "Leitores", leozinho: "Revista online", agenda: "Agenda", sas: "Livros SAS", emprestimos: "Empréstimos", devolucoes: "Devoluções", reservas: "Reservas", etiquetas: "Etiquetas", relatorios: "Relatórios" };
  const currentPermissions = (() => { try { return typeof currentUser?.permissoes === "string" ? JSON.parse(currentUser.permissoes) : currentUser?.permissoes || {}; } catch { return {}; } })();
  const hidden = Array.isArray(currentPermissions.menus_ocultos) ? currentPermissions.menus_ocultos : [];
  const menuGrid = el("div", "admin-user-permissions");
  Object.entries(menus).forEach(([key, label]) => {
    const item = el("label", "", label);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !hidden.includes(key);
    checkbox.dataset.adminMenu = key;
    item.prepend(checkbox);
    menuGrid.append(item);
  });
  menuCard.append(menuGrid);
  const menuMessage = el("p", "admin-form-message");
  const saveMenus = button("Salvar menus visíveis", "admin-button admin-button-primary", async (event) => {
    event.currentTarget.disabled = true;
    try {
      const hiddenMenus = [...menuGrid.querySelectorAll("[data-admin-menu]")].filter((item) => !item.checked).map((item) => item.dataset.adminMenu);
      const result = await api("/api/admin/meus-menus", { method: "PUT", body: JSON.stringify({ menus_ocultos: hiddenMenus }) });
      currentUser.permissoes = result.permissoes;
      menuMessage.textContent = "Menus do Acervo atualizados.";
    } catch (error) { menuMessage.textContent = error.message; }
    finally { event.currentTarget.disabled = false; }
  });
  menuCard.append(saveMenus, menuMessage);

  const modulesCard = el("section", "admin-settings-panel");
  modulesCard.append(el("p", "admin-eyebrow", "ACERVO · MÓDULOS"), el("h2", "", "Opções do sistema"));
  const moduleGrid = el("div", "admin-user-permissions");
  const moduleChoices = {};
  [["reservas_ativas", "Reservas"], ["etiquetas_ativas", "Etiquetas"]].forEach(([key, label]) => {
    const item = el("label", "", label);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.module = key;
    moduleChoices[key] = checkbox;
    item.prepend(checkbox);
    moduleGrid.append(item);
  });
  modulesCard.append(moduleGrid);
  const moduleMessage = el("p", "admin-form-message");
  const saveModules = button("Salvar opções do sistema", "admin-button admin-button-primary", async (event) => {
    event.currentTarget.disabled = true;
    try {
      const body = Object.fromEntries(Object.entries(moduleChoices).map(([key, input]) => [key, input.checked]));
      const result = await api("/api/admin/modulos", { method: "PUT", body: JSON.stringify(body) });
      Object.entries(moduleChoices).forEach(([key, input]) => { input.checked = Boolean(result[key]); });
      moduleMessage.textContent = "Opções do Acervo atualizadas.";
    } catch (error) { moduleMessage.textContent = error.message; }
    finally { event.currentTarget.disabled = false; }
  });
  modulesCard.append(saveModules, moduleMessage);

  const generalCard = el("section", "admin-settings-panel");
  generalCard.append(el("p", "admin-eyebrow", "ACERVO · OPÇÕES GERAIS"), el("h2", "", "Identificação e prazo de empréstimo"));
  const settingsForm = el("form", "admin-general-settings-form");
  const systemNameLabel = el("label", "admin-label", "Nome do sistema");
  const systemName = document.createElement("input");
  systemName.required = true;
  systemNameLabel.append(systemName);
  const daysLabel = el("label", "admin-label", "Prazo padrão de empréstimo (dias)");
  const days = document.createElement("input");
  days.type = "number";
  days.min = "1";
  days.max = "365";
  days.required = true;
  daysLabel.append(days);
  const settingsMessage = el("p", "admin-form-message");
  const saveSettings = button("Salvar opções gerais", "admin-button admin-button-primary", () => {});
  saveSettings.type = "submit";
  settingsForm.append(systemNameLabel, daysLabel, saveSettings, settingsMessage);
  generalCard.append(settingsForm);
  container.append(menuCard, modulesCard, generalCard);
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveSettings.disabled = true;
    try {
      await api("/api/configuracoes", { method: "PUT", body: JSON.stringify({ nome_sistema: systemName.value.trim(), prazo_emprestimo: Number(days.value) }) });
      settingsMessage.textContent = "Opções gerais atualizadas.";
    } catch (error) { settingsMessage.textContent = error.message; }
    finally { saveSettings.disabled = false; }
  });
  try {
    const [moduleData, generalData] = await Promise.all([api("/api/admin/modulos"), api("/api/configuracoes")]);
    if (!container.isConnected) return;
    Object.entries(moduleChoices).forEach(([key, input]) => { input.checked = Boolean(moduleData[key]); });
    systemName.value = generalData.nome_sistema || "Acervo LeoAlfa";
    days.value = String(generalData.prazo_emprestimo || 7);
  } catch (error) {
    if (container.isConnected) menuMessage.textContent = "Não foi possível carregar as opções do Acervo. " + error.message;
  }
}

const COLLEGE_PERMISSIONS = {
  inicio: "Início",
  livros: "Livros",
  alunos: "Leitores",
  emprestimos: "Empréstimos",
  devolucoes: "Devoluções",
  reservas: "Reservas",
  leozinho: "Revista online",
  agenda: "Agenda",
  sas: "Livros SAS",
  etiquetas: "Etiquetas",
  relatorios: "Relatórios",
  configuracoes: "Configurações"
};

function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function renderUsers(container) {
  sectionIntro(container, "CONTAS E ACESSOS", "Usuários e permissões", "As permissões de cada conta ficam organizadas no produto correspondente.");
  const college = el("section", "admin-content-section");
  college.append(el("div", "admin-section-heading", "Colégio Leonardo da Vinci"));
  college.append(el("p", "admin-muted", "Contas e menus disponíveis no Acervo, Reprografia, Jogos, Monitor e Revista."));

  const notice = el("p", "admin-form-message");
  const createBox = el("article", "admin-user-create");
  createBox.append(el("h2", "", "Criar conta de funcionário do Acervo"));
  createBox.append(el("p", "admin-muted", "A conta começa com permissões de trabalho diário. A senha temporária será exibida uma vez e a pessoa deverá trocá-la ao entrar."));
  const form = el("form", "admin-user-create-form");
  const field = (labelText, name, value, type = "text") => {
    const label = el("label", "admin-label", labelText);
    const input = document.createElement("input");
    input.name = name;
    input.type = type;
    input.value = value;
    input.required = true;
    input.autocomplete = "off";
    label.append(input);
    return { label, input };
  };
  const name = field("Nome", "nome", "Leonardo");
  const username = field("Usuário", "usuario", "leonardosilvart");
  const unitsLabel = el("label", "admin-label", "Unidade");
  const units = document.createElement("select");
  units.required = true;
  units.append(new Option("Carregando unidades…", ""));
  unitsLabel.append(units);
  const save = button("Criar Leonardo", "admin-button admin-button-primary", () => {});
  save.type = "submit";
  form.append(name.label, username.label, unitsLabel, save);
  createBox.append(form);
  college.append(createBox);
  form.addEventListener("submit", (event) => event.preventDefault(), { capture: true });

  const userList = el("div", "admin-user-list");
  userList.append(el("p", "admin-muted", "Carregando contas…"));
  college.append(userList);

  const enquadrilhos = el("section", "admin-content-section");
  enquadrilhos.append(el("div", "admin-section-heading", "Enquadrilhos"));
  const pending = el("article", "admin-info-card admin-group-placeholder");
  pending.append(el("p", "admin-eyebrow", "GESTÃO SEPARADA"), el("h2", "", "Contas e permissões do Enquadrilhos"), el("p", "admin-muted", "A gestão ficará isolada das contas do Colégio. O aplicativo ainda precisa de autenticação e API próprias para que essas permissões sejam efetivamente aplicadas."));
  enquadrilhos.append(pending);
  container.append(college, enquadrilhos, notice);

  let accounts = [];
  let unitsList = [];
  try {
    [accounts, unitsList] = await Promise.all([api("/api/admin/usuarios"), api("/api/unidades")]);
    if (!container.isConnected) return;
    units.replaceChildren(new Option("Selecione a unidade", ""));
    unitsList.forEach((unit) => units.append(new Option(unit.nome, String(unit.id))));
    const existing = accounts.find((user) => String(user.usuario).toLowerCase() === "leonardosilvart");
    if (existing) {
      name.input.value = existing.nome || "Leonardo";
      username.input.value = existing.usuario;
      createBox.querySelector("h2").textContent = "Conta do Leonardo já cadastrada";
      form.hidden = true;
    }
    userList.replaceChildren();
    accounts.forEach((user) => {
      const card = el("article", "admin-user-admin-card");
      const top = el("div", "admin-user-admin-head");
      top.append(el("div", "", user.nome || user.usuario), el("span", "setting-status", user.ativo ? "Ativo" : "Desativado"));
      top.firstElementChild.className = "admin-user-admin-name";
      top.firstElementChild.append(el("small", "", "@" + user.usuario + " · " + (user.unidade_nome || "Sem unidade")));
      card.append(top);
      const permissions = el("div", "admin-user-permissions");
      Object.entries(COLLEGE_PERMISSIONS).forEach(([key, label]) => {
        const item = el("label", "", label);
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.permission = key;
        checkbox.checked = user.permissoes?.[key] !== false;
        item.prepend(checkbox);
        permissions.append(item);
      });
      card.append(permissions);
      const footer = el("div", "admin-user-admin-actions");
      const activeLabel = el("label", "", "Conta ativa");
      const active = document.createElement("input");
      active.type = "checkbox";
      active.className = "user-active-toggle";
      active.checked = Boolean(user.ativo);
      activeLabel.prepend(active);
      const saveUser = button("Salvar permissões", "admin-button admin-button-secondary", async (event) => {
        event.currentTarget.disabled = true;
        try {
          const nextPermissions = { ...(user.permissoes || {}), acesso: user.permissoes?.acesso || "biblioteca" };
          card.querySelectorAll("[data-permission]").forEach((checkbox) => { nextPermissions[checkbox.dataset.permission] = checkbox.checked; });
          await api("/api/admin/usuarios/" + user.id, {
            method: "PUT",
            body: JSON.stringify({ nome: user.nome || user.usuario, usuario: user.usuario, unidade_id: user.unidade_id, ativo: active.checked, telefone: user.telefone || "", email: user.email || "", permissoes: nextPermissions })
          });
          notice.textContent = "Permissões de @" + user.usuario + " salvas.";
        } catch (error) { notice.textContent = error.message; }
        finally { event.currentTarget.disabled = false; }
      });
      footer.append(activeLabel, saveUser);
      card.append(footer);
      userList.append(card);
    });
    if (!accounts.length) userList.append(el("p", "admin-muted", "Ainda não há contas cadastradas."));
  } catch (error) {
    if (container.isConnected) userList.replaceChildren(el("p", "admin-muted", "Não foi possível carregar usuários e unidades. " + error.message));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!units.value) { notice.textContent = "Selecione a unidade do Leonardo."; return; }
    const initialPassword = temporaryPassword();
    const saveButton = form.querySelector('[type="submit"]');
    saveButton.disabled = true;
    try {
      const permissions = Object.fromEntries(Object.keys(COLLEGE_PERMISSIONS).map((key) => [key, key !== "configuracoes"]));
      permissions.acesso = "biblioteca";
      await api("/api/admin/usuarios", {
        method: "POST",
        body: JSON.stringify({ nome: name.input.value.trim(), usuario: username.input.value.trim(), senha: initialPassword, unidade_id: Number(units.value), permissoes: permissions })
      });
      notice.textContent = "Conta criada. Senha temporária (copie e entregue ao Leonardo): " + initialPassword + ". A troca será exigida no primeiro acesso.";
      createBox.querySelector("h2").textContent = "Conta do Leonardo criada";
      form.hidden = true;
      userList.replaceChildren(el("p", "admin-muted", "Atualize a página para conferir as contas e permissões."));
    } catch (error) { notice.textContent = error.message; }
    finally { saveButton.disabled = false; }
  });
}

function renderApprovals(container) {
  sectionIntro(container, "GESTÃO E DECISÕES", "Aprovações", "Um espaço para acompanhar solicitações e decisões administrativas da Leodition.");
  const empty = el("section", "admin-empty-state");
  empty.append(el("span", "empty-icon", "✓"), el("h2", "", "A área de aprovações está pronta para ser definida"), el("p", "admin-muted", "Quando os fluxos de aprovação forem conectados, as solicitações aparecerão aqui para análise."));
  container.append(empty);
}

async function renderChanges(container) {
  sectionIntro(container, "HISTÓRICO DO PRODUTO", "Alterações", "Acompanhe as atualizações publicadas nos sistemas integrados.");
  const list = el("section", "admin-change-list");
  list.append(el("p", "admin-muted", "Carregando as novidades…"));
  container.append(list);
  try {
    if (!releaseData) releaseData = await api("/api/app-version");
    if (!container.isConnected) return;
    list.replaceChildren();
    const release = releaseData.releaseNotes || {};
    const header = el("article", "admin-release-card");
    const top = el("div", "admin-release-top");
    top.append(el("span", "admin-status-pill", "VERSÃO " + (releaseData.version || releaseData.release || "ATUAL")), el("time", "", "Sistema integrado"));
    header.append(top, el("h2", "", release.title || "Últimas atualizações"));
    const items = Array.isArray(release.items) ? release.items : [];
    if (!items.length) header.append(el("p", "admin-muted", "As novidades aparecerão aqui quando forem publicadas."));
    else {
      const ul = el("ul", "admin-release-items");
      items.forEach((item) => ul.append(el("li", "", item)));
      header.append(ul);
    }
    list.append(header);
  } catch (error) {
    list.replaceChildren(el("p", "admin-muted", "Não foi possível carregar as atualizações agora. " + error.message));
  }
}

async function restoreAdmin() {
  const adminToken = sessionStorage.getItem(RETURN_KEY);
  const current = token();
  if (!adminToken || !current) return;
  const response = await fetch(API + "/api/auth/logout", {
    method: "POST",
    headers: { Authorization: "Bearer " + current, "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store"
  });
  if (!response.ok) {
    returnControl.querySelector("span").textContent = "Não foi possível encerrar a visualização. Tente novamente.";
    returnControl.querySelector("button").disabled = false;
    return;
  }
  localStorage.setItem(TOKEN_KEY, adminToken);
  sessionStorage.removeItem(RETURN_KEY);
  sessionStorage.removeItem(PREVIEW_KEY);
  location.reload();
}

function renderPreviewReturn() {
  const adminToken = sessionStorage.getItem(RETURN_KEY);
  if (!adminToken || returnControl) return;
  returnControl = el("div", "admin-preview-return");
  returnControl.append(el("span", "", "Você está visualizando a conta como AdmLeodition."));
  returnControl.append(button("Voltar ao painel AdmLeodition", "admin-button admin-button-secondary", async (event) => {
    event.currentTarget.disabled = true;
    try { await restoreAdmin(); }
    catch {
      returnControl.querySelector("span").textContent = "Não foi possível voltar agora. Verifique sua conexão e tente novamente.";
      event.currentTarget.disabled = false;
    }
  }));
  byId("accountDetails").after(returnControl);
}

function maybeOpenPreview(destinations) {
  const requested = sessionStorage.getItem(PREVIEW_KEY);
  if (!requested || previewStarted) return;
  const index = destinations.findIndex((item) => item.id === requested);
  if (index < 0) {
    sessionStorage.removeItem(PREVIEW_KEY);
    byId("status").textContent = "Esta conta não tem acesso ao sistema escolhido. Você pode conferir os acessos permitidos.";
    return;
  }
  const choices = byId("services").querySelectorAll("button");
  if (!choices[index]) return;
  previewStarted = true;
  sessionStorage.removeItem(PREVIEW_KEY);
  choices[index].click();
}

function clearPanel() {
  if (panel) panel.remove();
  panel = null;
  document.body.classList.remove("admin-mode");
  byId("services").hidden = false;
}

async function syncPanel() {
  const id = ++checkId;
  if (byId("account").hidden || !token()) {
    clearPanel();
    if (returnControl) returnControl.remove();
    returnControl = null;
    return;
  }
  try {
    const user = await api("/api/auth/me");
    if (id !== checkId) return;
    if (user.perfil !== "leodition") {
      clearPanel();
      if (user.acesso_mestre) renderPreviewReturn();
      else if (returnControl) { returnControl.remove(); returnControl = null; }
      const access = await api("/api/auth/central/destinos");
      if (id !== checkId) return;
      if (sessionStorage.getItem(PREVIEW_KEY) && !user.acesso_mestre) {
        sessionStorage.removeItem(PREVIEW_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        byId("status").textContent = "A senha mestra não foi confirmada. Você entrou com a conta escolhida e verá os acessos dela.";
      } else {
        maybeOpenPreview(access.destinos || []);
      }
      return;
    }
    if (returnControl) { returnControl.remove(); returnControl = null; }
    currentUser = user;
    const access = await api("/api/auth/central/destinos");
    if (id !== checkId) return;
    products = access.destinos || [];
    if (!panel) renderShell();
  } catch {
    if (id !== checkId) return;
    clearPanel();
  }
}

const observer = new MutationObserver(() => { void syncPanel(); });
observer.observe(byId("account"), { attributes: true, attributeFilter: ["hidden"] });
observer.observe(byId("accountName"), { childList: true, characterData: true, subtree: true });
syncPanel();
