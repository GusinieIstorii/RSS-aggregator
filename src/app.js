import './styles.scss';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import ru from './locales/ru.js';
import parseRSS from './parseRSS.js';
import elements from './elements.js';
import render from './render.js';
import getResponse from './getResponse.js';

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

const watchedState = onChange(state, function f() {
  render(this);
});

const app = () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  });

  const validate = (fields) => {
    const schema = yup.object({
      url: yup.string()
        .url()
        .nullable()
        .notOneOf(watchedState.RSSfeeds.urls, 'url must not be one of the following values'),
    });

    return schema.validate(fields);
  };

  const checkEvery5Sec = () => {
    setTimeout(() => {
      const promises = state.RSSfeeds.urls.map((url) => getResponse(url));
      const promise = Promise.all(promises);
      promise.then((responses) => {
        responses.map((response) => {
          try {
            parseRSS(response);
          } catch (err) {
            watchedState.RSSform.errors = 'parsing error';
            return err;
          }
          const parsedResponse = parseRSS(response);
          const actualPostsLinks = [];
          state.RSSfeeds.posts.forEach((post) => actualPostsLinks.push(post.itemLink));
          const newPosts = parsedResponse.posts
            .filter((postNewResponse) => !actualPostsLinks.includes(postNewResponse.itemLink));
          watchedState.RSSfeeds.posts.push(newPosts);
          watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
          return newPosts;
        });
      })
        // .catch((e) => console.log(e)) имелось в виду просто убрать здесь отлов ошибок?
        .then(checkEvery5Sec);
    }, '5000');
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.RSSform.data.url = elements.input.value;

    validate(watchedState.RSSform.data)
      .then(() => {
        watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
        watchedState.RSSform.errors = '';
      })
      .catch((er) => {
        watchedState.RSSform.errors = er.errors.join();
        return null;
      })
      .then(() => getResponse(state.RSSform.data.url))
      .then((response) => {
        if (watchedState.RSSform.errors) {
          return null;
        }
        try {
          parseRSS(response);
        } catch (err) {
          watchedState.RSSform.errors = 'parsing error';
          console.log('parsing error');
          return err;
        }
        const parsedResponse = parseRSS(response);
        watchedState.RSSform.errors = 'success';
        watchedState.RSSfeeds.feeds.push(parsedResponse.feed);
        watchedState.RSSfeeds.posts.push(parsedResponse.posts);
        watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
        return parsedResponse;
      })
      .catch((er) => {
        watchedState.RSSform.errors = 'netWork error';
        return (er.errors);
      });
  });

  checkEvery5Sec();

  const postsContainer = document.querySelector('.posts');
  postsContainer.addEventListener('click', (e) => {
    const targetEl = e.target;
    const li = targetEl.parentElement;
    const linkEl = li.querySelector('a');
    const link = linkEl.getAttribute('href');

    if (targetEl.localName === 'button' || targetEl.localName === 'a') {
      watchedState.RSSfeeds.posts.map((post) => {
        if (post.itemLink === link) {
          post.uiState = 'visited';
        }
        return post;
      });

      if (targetEl.localName === 'button') {
        watchedState.UI.modal.postLink = link;
        watchedState.UI.modal.status = 'active';
      }
    }
  });
};

export { watchedState, app };
