import './styles.scss';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import i18next from 'i18next';
import ru from './locales/ru.js';
import parseRSS from './parseRSS.js';
import elements from './elements.js';
import createWatchState from './render.js';
import getResponse from './getResponse.js';

const state = {
  RSSform: {
    signupState: 'filling',
    data: {
      url: '',
    },
    errors: '',
  },
  addingFeedProcess: {
    processState: 'nothing happens', // есть конечно сомнения насчет нейминга
    errorMessage: '',
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

const app = (i18nextInstance) => {
  const watchedState = createWatchState(state, i18nextInstance);

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
      Promise.allSettled(state.RSSfeeds.urls.map((url) => getResponse(url)))
        .then((responses) => {
          responses.map((response) => {
            if (response.status === 'rejected') {
              console.log('response status: rejected');
            } else {
              const parsedResponse = parseRSS(response.value);
              const actualPostsLinks = [];
              state.RSSfeeds.posts.forEach((post) => actualPostsLinks.push(post.itemLink));
              const newPosts = parsedResponse.posts
                .filter((postNewResponse) => !actualPostsLinks.includes(postNewResponse.itemLink));
              watchedState.RSSfeeds.posts.push(newPosts);
              watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
              return newPosts;
            }
            return response;
          });
        })
        .catch((e) => console.log(e))
        .finally(checkEvery5Sec);
    }, '5000');
  };

  //   setTimeout(() => {
  //     const promises = state.RSSfeeds.urls.map((url) => getResponse(url));
  //     const promise = Promise.all(promises);

  //     promise.then((responses) => {
  //       responses.map((response) => {
  //         try {
  //           parseRSS(response);
  //         } catch (err) {
  //           watchedState.RSSform.errors = 'parsing error';
  //           return err;
  //         }
  //         const parsedResponse = parseRSS(response);
  //         const actualPostsLinks = [];
  //         state.RSSfeeds.posts.forEach((post) => actualPostsLinks.push(post.itemLink));
  //         const newPosts = parsedResponse.posts
  //           .filter((postNewResponse) => !actualPostsLinks.includes(postNewResponse.itemLink));
  //         watchedState.RSSfeeds.posts.push(newPosts);
  //         watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
  //         return newPosts;
  //       });
  //     })
  //       .catch((e) => console.log(e))
  //       .finally(checkEvery5Sec);
  //   }, '5000');
  // };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    // блокируем отправку запроса, если предыдйший запрос все еще обрабатывается
    if (watchedState.RSSform.signupState === 'sending') {
      return;
    }
    watchedState.RSSform.data.url = elements.input.value;
    validate(watchedState.RSSform.data)
      .then(() => {
        watchedState.RSSform.errors = '';
        watchedState.RSSform.signupState = 'sending';
        return getResponse(state.RSSform.data.url);
      })
      .then((response) => {
        const parsedResponse = parseRSS(response);
        watchedState.RSSform.errors = 'success';
        watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
        watchedState.RSSfeeds.feeds.push(parsedResponse.feed);
        watchedState.RSSfeeds.posts.push(parsedResponse.posts);
        watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
        watchedState.RSSform.signupState = 'sent';
        return parsedResponse;
      })
      .catch((er) => {
        console.log(er.message);
        // if array of errors has er.message
        if (er.name === 'ValidationError') {
          watchedState.RSSform.errors = er.message;
          watchedState.RSSform.signupState = 'sent';
          return (er.name);
        }
        if (er.message === 'parsing error') {
          watchedState.RSSform.errors = 'parsing error';
          watchedState.RSSform.signupState = 'sent';
          return (er);
        }
        if (er.message === 'netWork error') {
          watchedState.RSSform.errors = 'netWork error';
          watchedState.RSSform.signupState = 'sent';
          return null;
        }
        watchedState.RSSform.errors = 'netWork error';
        watchedState.RSSform.signupState = 'sent';
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

const runApp = () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  }).then(() => app(i18nextInstance));
};

export default runApp;
