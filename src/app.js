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
    data: {
      url: '',
    },
  },
  addingFeedProcess: {
    processState: 'idle',
    errorMessage: '',
  },
  RSSfeeds: {
    urls: [],
    feeds: [],
    posts: [],
  },
  UI: {
    modal: {
      postLink: '',
    },
  },
};

const app = (i18nextInstance) => {
  const watchedState = createWatchState(state, i18nextInstance);

  // const validate = (url) => {
  //   const urlSchema = yup.string()
  //     .url('errorLink')
  //     .nullable()
  //     .notOneOf(watchedState.RSSfeeds.urls, 'errorDuplicates');

  //   return urlSchema.validate(url);
  // };

  // class ValidationErrorCustom extends ValidationError {

  // }

  const validate = (url) => {
    const validateSchema = (link) => {
      const urlSchema = yup.string()
        .url('errorLink')
        .nullable()
        .notOneOf(watchedState.RSSfeeds.urls, 'errorDuplicates');

      return urlSchema.validate(link);
    };

    return validateSchema(url)
      .then((result) => result)
      .catch((error) => {
        class ValidationErrorCustom extends Error {
          constructor(message) {
            super(message);
            this.name = 'ValidationErrorCustom';
            this.isValidationError = true;
          }
        }
        const msg = error.message;
        throw new ValidationErrorCustom(msg);
      });
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

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = elements.input.value;
    watchedState.RSSform.data.url = url;
    validate(url)
      .then(() => {
        watchedState.addingFeedProcess.processState = 'sending';
        return getResponse(url);
      })
      .then((response) => {
        const parsedResponse = parseRSS(response);
        watchedState.addingFeedProcess.errorMessage = 'successMessage';
        watchedState.RSSfeeds.urls.push(url);
        watchedState.RSSfeeds.feeds.push(parsedResponse.feed);
        watchedState.RSSfeeds.posts.push(parsedResponse.posts);
        watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
        watchedState.addingFeedProcess.processState = 'idle';
        return parsedResponse;
      })
      .catch((er) => {
        console.log(er.isValidationError);
        const errorsMessages = ['errorLink', 'errorDuplicates', 'errorParse', 'errorNetwork'];
        if (errorsMessages.includes(er.message)) {
          watchedState.addingFeedProcess.errorMessage = er.message;
          watchedState.addingFeedProcess.processState = 'completed with error';
        } else {
          throw new Error('unknown error');
        }
      });
  });

  checkEvery5Sec();

  const postsContainer = document.querySelector('.posts');
  postsContainer.addEventListener('click', (e) => {
    const targetEl = e.target;
    const url = targetEl.getAttribute('data-link');

    if (url) {
      watchedState.RSSfeeds.posts.map((post) => {
        if (post.itemLink === url) {
          post.uiState = 'visited';
        }
        return post;
      });

      if (targetEl.localName === 'button') {
        watchedState.UI.modal.postLink = url;
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
