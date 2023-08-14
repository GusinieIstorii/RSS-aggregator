import onChange from 'on-change';
import i18next from 'i18next';
import elements from './elements.js';
import ru from './locales/ru.js';
// import 'bootstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';

const state = {
  RSSform: {
    state: 'valid',
    data: {
      url: '',
    },
    errors: '',
  },
  RSSfeeds: {
    urls: [],
    feeds: [],
    posts: [],
  },
  UI: {
    modal: {
      status: '',
      postLink: '',
    },
  },
};

// init должен здесь инициироваться или где-то еще?
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
  document.querySelector('[class="mt-2 mb-0 text-secondary fs-6"]').innerHTML = i18next.t('example');
});

const feedbackRender = (feedback) => {
  switch (feedback) {
    case 'url must not be one of the following values':
      elements.error.classList.add('text-danger');
      elements.error.classList.remove('text-success');
      elements.error.innerHTML = i18next.t('errorDuplicates'); // почему тут пролетело без промисов?
      break;
    case 'url must be a valid URL':
      elements.error.classList.add('text-danger');
      elements.error.classList.remove('text-success');
      elements.error.innerHTML = i18next.t('errorLink');
      break;
    case 'parsing error':
      elements.error.classList.remove('text-success');
      elements.error.classList.add('text-danger');
      elements.error.innerHTML = i18next.t('errorParse');
      break;
    case 'success':
      elements.error.classList.add('text-success');
      elements.error.classList.remove('text-danger');
      elements.error.innerHTML = i18next.t('successMessage');
      break;
    default:
      elements.error.innerHTML = '';
  }
};

const render = () => {
  feedbackRender(state.RSSform.errors);
  if (state.RSSform.errors === 'url must not be one of the following values'
   || state.RSSform.errors === 'url must be a valid URL') {
    elements.input.classList.add('is-invalid');
    elements.input.value = state.RSSform.data.url;
  } else if (state.RSSform.errors === 'parsing error') {
    elements.input.classList.remove('is-invalid');
    elements.input.value = state.RSSform.data.url;
  } else if (state.RSSform.errors === 'success') {
    elements.input.classList.remove('is-invalid');
    elements.form.reset();
    elements.input.focus();
  }

  if (state.RSSfeeds.feeds.length > 0) {
    // собираем раздел фид
    const feedsContainer = document.querySelector('.feeds');
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    feedsContainer.replaceChildren(card);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    const cardTitle = document.createElement('h2');
    cardTitle.classList.add('card-title', 'h4');
    cardTitle.innerHTML = i18next.t('feedsHeader');
    cardBody.append(cardTitle);
    card.append(cardBody);

    const listOfFeeds = document.createElement('ul');
    listOfFeeds.classList.add('list-group', 'border-0', 'rounded-0');
    card.append(listOfFeeds);
    state.RSSfeeds.feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');
      const h3 = document.createElement('h3');
      h3.classList.add('h6', 'm-0');
      h3.innerHTML = feed.feedTitle;
      li.append(h3);
      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.innerHTML = feed.feedDesc;
      li.append(p);
      listOfFeeds.append(li);
    });

    // собираем посты
    const postsContainer = document.querySelector('.posts');
    const cardPosts = document.createElement('div');
    cardPosts.classList.add('card', 'border-0');
    postsContainer.replaceChildren(cardPosts);
    const cardPostsBody = document.createElement('div');
    cardPostsBody.classList.add('card-body');
    const cardPostsTitle = document.createElement('h2');
    cardPostsTitle.classList.add('card-title', 'h4');
    cardPostsTitle.innerHTML = i18next.t('postsHeader');
    cardPostsBody.append(cardPostsTitle);
    cardPosts.append(cardPostsBody);

    const listOfPosts = document.createElement('ul');
    listOfPosts.classList.add('list-group', 'border-0', 'rounded-0');
    cardPosts.append(listOfPosts);

    state.RSSfeeds.posts.forEach((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const a = document.createElement('a');
      a.setAttribute('href', post.itemLink);
      a.classList.add('fw-bold');
      if (post.uiState === 'visited') {
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal', 'link-secondary');
      }
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.innerHTML = post.itemTitle;
      li.append(a);
      const btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      btn.innerHTML = 'Просмотр';
      btn.setAttribute('data-bs-toggle', 'modal');
      btn.setAttribute('data-bs-target', '#modal');
      li.append(btn);
      listOfPosts.append(li);
    });

    // modal
    if (state.UI.modal.status === 'active') {
      const modalFade = document.querySelector('#modal');
      const modalTitle = modalFade.querySelector('.modal-title');
      const modalDesc = modalFade.querySelector('.modal-body');
      const btnRead = modalFade.querySelector('.full-article');
      btnRead.innerHTML = 'Читать полностью';
      const currentPostArray = state.RSSfeeds.posts
        .filter((post) => post.itemLink === state.UI.modal.postLink);
      const [currentPost] = currentPostArray;
      modalTitle.innerHTML = currentPost.itemTitle;
      modalDesc.innerHTML = currentPost.itemDesc;
      btnRead.setAttribute('href', currentPost.itemLink);
    }
  }
};

const watchedState = onChange(state, render);

export { watchedState, state };
