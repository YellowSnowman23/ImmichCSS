async function initializePreview() {
  const response = await fetch('../src/palettes.json');
  if (!response.ok) throw new Error(`Cannot load theme catalog: ${response.status}`);
  const catalog = await response.json();
  const themes = new Map(catalog.map(theme => [theme.slug, theme]));
  const picker = document.getElementById('theme-picker');
  const stylesheet = document.getElementById('theme-stylesheet');
  picker.replaceChildren(...catalog.map(theme => new Option(theme.name, theme.slug)));
  function selectTheme(slug, updateHistory = true) {
    if (!themes.has(slug)) slug = 'obsidian-mint';
    const { name, description } = themes.get(slug);
    stylesheet.href = `../themes/${slug}.css`;
    picker.value = slug;
    document.getElementById('theme-name').textContent = name;
    document.getElementById('theme-description').textContent = description;
    document.getElementById('download-theme').href = `../themes/${slug}.css`;
    document.title = `${name} · Immich Themes`;
    document.documentElement.dataset.theme = slug;
    document.querySelector('.theme-status').lastChild.textContent = ['claude-theme','gpt-theme'].includes(slug) ? 'Unofficial theme' : 'Dark theme';
    if (updateHistory) {
      const url = new URL(location.href);
      url.searchParams.set('theme', slug);
      history.replaceState(null, '', url);
    }
  }
  selectTheme(new URLSearchParams(location.search).get('theme'), false);
  picker.addEventListener('change', () => selectTheme(picker.value));
  window.addEventListener('popstate', () => selectTheme(new URLSearchParams(location.search).get('theme'), false));
  document.documentElement.dataset.ready = 'true';
}
initializePreview().catch(error => {
  document.getElementById('theme-description').textContent = 'Start the local preview server to load the theme catalog.';
  console.error(error);
});
