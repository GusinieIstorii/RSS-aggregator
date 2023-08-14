import './styles.scss';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import isEmpty from 'lodash/isEmpty.js';
import axios from 'axios';
import parseRSS from './parseRSS.js';
import elements from './elements.js';
import { watchedState, state } from './render.js';

const validate = (fields) => {
  const schema = yup.object({
    url: yup.string()
      .url()
      .nullable()
      .notOneOf(watchedState.RSSfeeds.urls, 'url must not be one of the following values'),
  });

  const promise = schema.validate(fields)
    .then(() => [])
    .catch((e) => e.errors);

  return promise;
};

const checkEvery5Sec = () => {
  setTimeout(() => {
    // хз как проверить не уверена что работает
    const promises = state.RSSfeeds.urls.map((url) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`));
    const promise = Promise.all(promises);
    promise.then((responses) => {
      responses.map((response) => {
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
      .then(checkEvery5Sec);
  }, '5000');
};

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  watchedState.RSSform.data.url = elements.input.value;
  const errorsPromise = validate(watchedState.RSSform.data)
    .then((validationErrors) => {
      watchedState.RSSform.errors = validationErrors.join();
      if (isEmpty(validationErrors)) {
        // здесь кажется не хватает асинхронности или я в аду колбеков?
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${watchedState.RSSform.data.url}`)
          .then((response) => {
            const parsedResponse = parseRSS(response);
            watchedState.RSSform.errors = 'success';
            // watchedState.RSSform.state = 'valid';
            watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
            watchedState.RSSfeeds.feeds.push(parsedResponse.feed);
            watchedState.RSSfeeds.posts.push(parsedResponse.posts);
            watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
            return parsedResponse;
          })
          .catch((er) => {
            watchedState.RSSform.errors = 'parsing error';
            return (er.errors);
          })
          .then(checkEvery5Sec);
        // return responsePromise; не очень понимаю где то что должно возвращаться
      }
    });

  console.log(state);
  return errorsPromise;
});

const postsContainer = document.querySelector('.posts');
postsContainer.addEventListener('click', (e) => {
  const targetEl = e.target;
  if (targetEl.localName === 'button' || targetEl.localName === 'a') {
    const li = targetEl.parentElement;
    const linkEl = li.querySelector('a');
    const link = linkEl.getAttribute('href');
    console.log(link);
    watchedState.RSSfeeds.posts.map((post) => {
      if (post.itemLink === link) {
        post.uiState = 'visited';
      }
      return post;
    });

    if (targetEl.localName === 'button') {
      watchedState.UI.modal = 'active';
    }
  }
});
