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
  //   setTimeout(() => {
  //     Promise.allSettled(state.RSSfeeds.urls.map((url) => getResponse(url)))
  //       .then((responses) => {
  //         responses.forEach((response) => {
  //           if (response.status === 'rejected') {
  //             throw new Error(response.reason);
  //           } else {
  //             try {
  //               parseRSS(response);
  //             } catch (err) {
  //               console.log(err);
  //               watchedState.RSSform.errors = 'parsing error';
  //               return err;
  //             }
  //             const parsedResponse = parseRSS(response);
  //             const actualPostsLinks = [];
  //             state.RSSfeeds.posts.forEach((post) => actualPostsLinks.push(post.itemLink));
  //             const newPosts = parsedResponse.posts
  //             .filter((postNewResponse) => !actualPostsLinks.includes(postNewResponse.itemLink));
  //             watchedState.RSSfeeds.posts.push(newPosts);
  //             watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
  //             return newPosts;
  //           }
  //         });
  //       })
  //       .catch((e) => console.log(e))
  //       .finally(checkEvery5Sec);
  //   }, '5000');
  // };

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
        .catch((e) => console.log(e))
        .finally(checkEvery5Sec);
    }, '5000');
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.RSSform.signupState = 'sending';
    watchedState.RSSform.data.url = elements.input.value;

    validate(watchedState.RSSform.data)
      .then(() => {
        watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
        watchedState.RSSform.errors = '';
      })
      .catch((er) => {
        watchedState.RSSform.errors = er.errors.join();
        watchedState.RSSform.signupState = 'sent';
        return null;
      })
      .then(() => getResponse(state.RSSform.data.url))
      .then((response) => {
        if (response === 'http request error') {
          watchedState.RSSform.errors = 'netWork error';
          watchedState.RSSform.signupState = 'sent';
          return null;
        }
        if (watchedState.RSSform.errors) {
          return null;
        }
        try {
          parseRSS(response);
        } catch (err) {
          watchedState.RSSform.errors = 'parsing error';
          watchedState.RSSform.signupState = 'sent';
          console.log('parsing error');
          return err;
        }
        const parsedResponse = parseRSS(response);
        watchedState.RSSform.errors = 'success';
        watchedState.RSSfeeds.feeds.push(parsedResponse.feed);
        watchedState.RSSfeeds.posts.push(parsedResponse.posts);
        watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
        watchedState.RSSform.signupState = 'sent';
        return parsedResponse;
      })
      .catch((er) => {
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
  }).then(app(i18nextInstance));
};

export default runApp;
