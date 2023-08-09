import onChange from 'on-change';
import i18next from 'i18next';
import elements from './elements.js';
import ru from './locales/ru.js';

const state = {
  RSSform: {
    state: 'valid',
    data: {
      url: '',
    },
    errors: {},
  },
  RSSfeeds: {
    urls: ['aaa'],
  },
};

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
}).then(() => {
  elements.button.innerHTML = i18next.t('button');
  document.querySelector('[class = "display-3 mb-0"]').innerHTML = i18next.t('h1');
  document.querySelector('[class = "lead"]').innerHTML = i18next.t('p');
  document.querySelector('[for="url-input"]').innerHTML = i18next.t('urlInput');
  document.querySelector('[class="mt-2 mb-0 text-muted"]').innerHTML = i18next.t('example');
});

const render = () => {
  if (state.RSSform.state === 'valid') {
    elements.input.classList.remove('is-invalid');
    elements.form.reset();
    elements.input.focus();
  }
  if (state.RSSform.state === 'invalid') {
    elements.input.classList.add('is-invalid');
    elements.input.value = state.RSSform.data.url;
    if (state.RSSform.errors.includes('url must not be one of the following values')) {
      elements.error.innerHTML = i18next.t('errorDuplicates');
    }
    if (state.RSSform.errors.includes('url must be a valid URL')) {
      elements.error.innerHTML = i18next.t('errorLink');
    }
  }
};

const watchedState = onChange(state, render);

export { watchedState, state };
