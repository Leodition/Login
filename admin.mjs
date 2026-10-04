const API = "https://acervo-leoalfa.onrender.com";
const TOKEN_KEY = "leodition_central_token";
const PRODUCTS = [
  { title: "Acervo e Biblioteca", detail: "Biblioteca e ferramentas administrativas", destination: "acervo", category: "Sistema" },
  { title: "Repografia", detail: "Repografia, Lellos e ferramentas relacionadas", destination: "repografia", category: "Sistema" },
  { title: "Jogos", detail: "Módulo acessado pelo Acervo", destination: "acervo", category: "Módulo" },
  { title: "Monitor", detail: "Módulo acessado pelo Acervo", destination: "acervo", category: "Módulo" },
  { title: "Revista", detail: "Módulo acessado pelo Acervo", destination: "acervo", category: "Módulo" }
];

const byId = (id) => document.getElementById(id);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
const token = () => localStorage.getItem(TOKEN_KEY);
let panel;
let activeTab = "inicio";
let products = [];

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

function makeButton(label, className, action) {
  const button = el("button", className, label);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

function switchTab(tab) {
  activeTab = tab;
  panel.querySelectorAll("[data-admin-tab]").forEach((button) => {
    const selected = button.dataset.adminTab === tab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-current", selected ? "page" : "false");
  });
  panel.querySelectorAll("[data-admin-view]").forEach((view) => {
    view.hidden = view.dataset.adminView !== tab;
  });
}

function openDestination(id) {
  const index = products.findIndex((item) => item.id === id);
  const buttons = [...byId("services").querySelectorAll("button")];
  if (index < 0 || !buttons[index]) {
    panel.querySelector("[data-admin-message]").textContent = "Esse acesso não está disponível para esta conta.";
    return;
  }
  buttons[index].click();
}

function productCard(product) {
  const card = el("article", "admin-product");
  const top = el("div", "admin-product-top");
  top.append(el("span", "admin-tag", product.category), el("span", "admin-status", product.category === "Sistema" ? "Acesso integrado" : "Dentro do Acervo"));
  const heading = el("h3", "", product.title);
  const detail = el("p", "", product.detail);
  const actions = el("div", "admin-product-actions");
  actions.append(makeButton(product.category === "Sistema" ? "Abrir como AdmLeodition" : "Abrir pelo Acervo", "admin-button admin-button-primary", () => openDestination(product.destination)));
  actions.append(makeButton("Visualizar como usuário", "admin-button admin-button-secondary", () => showUserPreview(product.destination)));
  card.append(top, heading, detail, actions);
  return card;
}

async function showUserPreview(destination) {
  const message = panel.querySelector("[data-admin-message]");
  try {
    const result = await api("/api/auth/status", { headers: {} });
    const choices = (result.usuarios || []).filter((user) => user.usuario.toLowerCase() !== "leodition");
    if (!choices.length) {
      message.textContent = "Não há outras contas disponíveis para visualizar.";
      return;
    }

    const dialog = document.createElement("dialog");
    dialog.className = "admin-preview-dialog";
    const form = el("form", "");
    form.method = "dialog";
    form.append(el("p", "admin-eyebrow", "VISUALIZAÇÃO DE ACESSO"));
    form.append(el("h2", "", "Escolha uma conta"));
    form.append(el("p", "admin-muted", "A central usará a senha mestra já configurada. Você sairá da conta AdmLeodition nesta aba e poderá entrar novamente ao terminar."));
    const label = el("label", "admin-label", "Conta para visualizar");
    const select = document.createElement("select");
    select.required = true;
    select.append(new Option("Selecione uma conta", ""));
    choices.forEach((user) => select.append(new Option((user.nome || user.usuario) + " · @" + user.usuario, user.usuario)));
    label.append(select);
    const feedback = el("p", "admin-form-message");
    const actions = el("div", "admin-dialog-actions");
    const cancel = el("button", "admin-button admin-button-secondary", "Cancelar");
    cancel.type = "button";
    cancel.addEventListener("click", () => dialog.close());
    const proceed = el("button", "admin-button admin-button-primary", "Continuar");
    proceed.type = "submit";
    actions.append(cancel, proceed);
    form.append(label, feedback, actions);
    dialog.append(form);
    document.body.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = select.value;
      if (!username) return;
      proceed.disabled = true;
      feedback.textContent = "Encerrando a sessão administrativa…";
      try {
        const current = token();
        const response = await fetch(API + "/api/auth/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + current, "Content-Type": "application/json" },
          body: "{}",
          cache: "no-store"
        });
        if (!response.ok) throw new Error("Não foi possível encerrar a sessão administrativa. Tente novamente.");
        localStorage.removeItem(TOKEN_KEY);
        byId("account").hidden = true;
        byId("loginForm").hidden = false;
        const userField = byId("username");
        userField.value = username;
        byId("password").value = "";
        byId("password").focus();
        byId("status").textContent = "Digite a senha mestra da Leodition para visualizar esta conta. Depois, escolha o sistema permitido para ela.";
        byId("loginForm").scrollIntoView({ behavior: "smooth", block: "center" });
        dialog.close();
        if (destination) sessionStorage.setItem("leodition_preview_destination", destination);
      } catch (error) {
        feedback.textContent = error.message;
        proceed.disabled = false;
      }
    });
    dialog.showModal();
  } catch (error) {
    message.textContent = error.message;
  }
}

function renderPanel() {
  if (panel) panel.remove();
  panel = el("section", "admin-console");
  panel.id = "adminConsole";
  panel.setAttribute("aria-label", "Painel AdmLeodition");
  const heading = el("div", "admin-heading");
  const intro = el("div", "");
  intro.append(el("p", "admin-eyebrow", "CENTRAL ADMINISTRATIVA"), el("h2", "", "AdmLeodition"), el("p", "admin-muted", "Acesso geral aos produtos e às ferramentas da Leodition."));
  heading.append(intro, el("span", "admin-secure", "Acesso protegido"));
  const nav = el("nav", "admin-tabs");
  nav.setAttribute("aria-label", "Seções administrativas");
  [["inicio", "Visão geral"], ["sites", "Sites e acessos"], ["configuracoes", "Configurações"]].forEach(([key, label]) => {
    const button = makeButton(label, "admin-tab", () => switchTab(key));
    button.dataset.adminTab = key;
    nav.append(button);
  });
  const views = el("div", "admin-views");
  const home = el("section", "admin-view");
  home.dataset.adminView = "inicio";
  home.append(el("p", "admin-eyebrow", "BEM-VINDA À CENTRAL"), el("h3", "admin-welcome", "Tudo da Leodition, em um só lugar."));
  home.append(el("p", "admin-muted", "Acesse os produtos integrados com o seu perfil administrativo. A lista pode crescer conforme novos projetos forem conectados."));
  const stats = el("div", "admin-summary");
  stats.append(el("article", "admin-summary-card", "2 sistemas com acesso direto"), el("article", "admin-summary-card", "3 módulos pelo Acervo"), el("article", "admin-summary-card", "Painel administrativo ativo"));
  home.append(stats, makeButton("Ver sites e acessos", "admin-button admin-button-primary", () => switchTab("sites")));
  const sites = el("section", "admin-view");
  sites.dataset.adminView = "sites";
  sites.append(el("p", "admin-eyebrow", "PRODUTOS E SISTEMAS"), el("h3", "admin-welcome", "Sites e acessos"));
  sites.append(el("p", "admin-muted", "Abra os sistemas no contexto de AdmLeodition ou escolha uma conta para conferir a experiência permitida a ela."));
  const grid = el("div", "admin-products");
  PRODUCTS.forEach((product) => grid.append(productCard(product)));
  sites.append(grid);
  const settings = el("section", "admin-view");
  settings.dataset.adminView = "configuracoes";
  settings.append(el("p", "admin-eyebrow", "PREFERÊNCIAS GERAIS"), el("h3", "admin-welcome", "Configurações"));
  settings.append(el("p", "admin-muted", "Esta área está preparada para reunirmos configurações, aprovações e mudanças da Leodition. Vamos habilitar cada controle quando definirmos seu funcionamento."));
  const note = el("div", "admin-note");
  note.append(el("strong", "", "Autenticação centralizada"), el("span", "", "Usuários, permissões e senhas continuam protegidos pela API do sistema."));
  settings.append(note);
  views.append(home, sites, settings);
  const message = el("p", "admin-form-message");
  message.dataset.adminMessage = "";
  panel.append(heading, nav, views, message);
  byId("services").hidden = true;
  byId("accountDetails").after(panel);
  switchTab(activeTab);
}

let checkId = 0;
async function syncPanel() {
  const id = ++checkId;
  const account = byId("account");
  if (account.hidden || !token()) {
    if (panel) panel.remove();
    panel = null;
    byId("services").hidden = false;
    return;
  }
  try {
    const user = await api("/api/auth/me");
    if (id !== checkId) return;
    if (user.perfil !== "leodition") {
      if (panel) panel.remove();
      panel = null;
      byId("services").hidden = false;
      return;
    }
    const access = await api("/api/auth/central/destinos");
    if (id !== checkId) return;
    products = access.destinos || [];
    if (!panel) renderPanel();
  } catch {
    if (panel) panel.remove();
    panel = null;
    byId("services").hidden = false;
  }
}

const observer = new MutationObserver(() => { void syncPanel(); });
observer.observe(byId("account"), { attributes: true, attributeFilter: ["hidden"] });
observer.observe(byId("accountName"), { childList: true, characterData: true, subtree: true });
syncPanel();
