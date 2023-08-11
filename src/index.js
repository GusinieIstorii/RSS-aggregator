import './styles.scss';
import 'bootstrap';
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
    // есть подозрение что тут должно быть промис ол
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
        watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat()
          .map((post) => {
            post.uiState = 'not visited';
            return post;
          });
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
            watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat()
              .map((post) => {
                post.uiState = 'not visited';
                return post;
              });
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
const postItems = postsContainer.querySelectorAll('li');
postItems.forEach((postItem) => {
  postItem.addEventListener('click', () => {
    console.log('hi');
  });
});
